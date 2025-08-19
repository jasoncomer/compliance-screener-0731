import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { EdgeColorPicker } from './EdgeColorPicker';

export type FTNode = {
  id: string;
  label?: string;
  x: number;
  y: number;
  type?: string;
  risk?: number;
  logoUrl?: string;
  balance?: number | string;
  usdValue?: number | string;
  txCount?: number;
  entityId?: string;
  entityType?: string;
  bo?: string;
  custodian?: string;
};

export interface FTConnection {
  from: string
  to: string
  amount: string
  // When available, represents the amount actually received by the destination (e.g., specific UTXO value)
  receivedAmount?: string
  currency: string
  date: string
  txHash: string
  // Unique key to identify a specific UTXO within a tx when in individual mode
  utxoKey?: string
  type?: "in" | "out"
  usdValue?: string
  fee?: string
  note?: string
  groupId?: string // For grouping multiple transactions between same nodes
  passThroughNodes?: string[] // Track pass-through nodes that were aggregated
  originalConnections?: FTConnection[] // Track original connections that were aggregated
  customColor?: string // Custom color for individual edges
  isAggregated?: boolean // Indicates if this connection is an aggregated edge
  utxoCount?: number // Number of UTXOs represented by this aggregated edge
  _aggregatedText?: {
    amount: string
    count: number
    currency: string
  } // For individual mode: aggregated text info to prevent stacking
}

interface NetworkGraphProps {
  nodes: FTNode[]
  connections: FTConnection[]
  onNodeClick: (node: FTNode) => void
  onNodeDoubleClick?: (node: FTNode) => void
  onNodeDrag: (nodeId: string, x: number, y: number) => void
  onEdgeClick: (connection: FTConnection) => void
  onNodeRemove: (nodeId: string) => void
  onNodeAdd: (node: FTNode) => void
  utxoCollapseMode: "aggregated" | "individual"
  activeTool?: 'select' | 'draw' | 'rectangle' | 'circle' | 'text'
  activeColor?: string
  onDrawingAction?: (action: { type: string; data: any }) => void
  drawingHistory?: any[]
  onConnectionColorChange?: (txHash: string, color: string) => void
  onConnectionColorReset?: (txHash: string) => void
}

export type NetworkGraphHandle = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  forceRender: () => void
}

export const NetworkGraph = forwardRef<NetworkGraphHandle, NetworkGraphProps>(({ 
  nodes,
  connections,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDrag,
  onEdgeClick,
  onNodeRemove,
  onNodeAdd,
  utxoCollapseMode,
  activeTool = 'select',
  activeColor = '#ff6b35',
  onDrawingAction,
  drawingHistory = [],
  onConnectionColorChange,
  onConnectionColorReset
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingLine, setDrawingLine] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [drawingShape, setDrawingShape] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  
  // Edge color picker state
  const [edgeColorPickerOpen, setEdgeColorPickerOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<FTConnection | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const dpi = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Expose imperative API for toolbar controls
  useImperativeHandle(ref, () => ({
    zoomIn: () => setZoom((z) => Math.min(z * 1.1, 4)),
    zoomOut: () => setZoom((z) => Math.max(z * 0.9, 0.25)),
    resetView: () => {
      setPan({ x: 0, y: 0 });
      setZoom(1);
    },
    forceRender: () => setRenderTick(prev => prev + 1)
  }), []);

  const drawArrow = useCallback((ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label?: string) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // arrow head
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const size = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - Math.PI / 6), y2 - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - size * Math.cos(angle + Math.PI / 6), y2 - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    if (label) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.save();
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${10 / zoom}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(label, mx, my - 4);
      ctx.restore();
    }
  }, []);

  // Function to draw curved line for multiple connections
  const drawCurvedConnection = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    curveOffset: number,
  ) => {
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2

    // Calculate perpendicular offset for curve
    const dx = toX - fromX
    const dy = toY - fromY
    const length = Math.sqrt(dx * dx + dy * dy)
    const unitX = -dy / length
    const unitY = dx / length

    const controlX = midX + unitX * curveOffset
    const controlY = midY + unitY * curveOffset

    ctx.beginPath()
    ctx.moveTo(fromX, fromY)
    ctx.quadraticCurveTo(controlX, controlY, toX, toY)
    ctx.stroke()

    return { midX: controlX, midY: controlY }
  }

  // Function to draw curved arrow
  const drawCurvedArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    curveOffset: number,
    arrowSize: number = 6,
  ) => {
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2

    // Calculate perpendicular offset for curve
    const dx = toX - fromX
    const dy = toY - fromY
    const length = Math.sqrt(dx * dx + dy * dy)
    const unitX = -dy / length
    const unitY = dx / length

    const controlX = midX + unitX * curveOffset
    const controlY = midY + unitY * curveOffset

    // Calculate arrow position on the curve (80% along the curve)
    const t = 0.8
    const arrowX = fromX * (1 - t) * (1 - t) + 2 * controlX * t * (1 - t) + toX * t * t
    const arrowY = fromY * (1 - t) * (1 - t) + 2 * controlY * t * (1 - t) + toY * t * t

    // Calculate tangent vector at arrow position
    const tangentX = 2 * (controlX - fromX) * (1 - t) + 2 * (toX - controlX) * t
    const tangentY = 2 * (controlY - fromY) * (1 - t) + 2 * (toY - controlY) * t
    const tangentLength = Math.sqrt(tangentX * tangentX + tangentY * tangentY)
    
    if (tangentLength === 0) return { midX: controlX, midY: controlY }
    
    const unitTangentX = tangentX / tangentLength
    const unitTangentY = tangentY / tangentLength
    
    // Calculate perpendicular vector for arrow wings
    const perpX = -unitTangentY
    const perpY = unitTangentX
    
    // Draw arrow
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - unitTangentX * arrowSize + perpX * arrowSize * 0.5, arrowY - unitTangentY * arrowSize + perpY * arrowSize * 0.5)
    ctx.lineTo(arrowX - unitTangentX * arrowSize - perpX * arrowSize * 0.5, arrowY - unitTangentY * arrowSize - perpY * arrowSize * 0.5)
    ctx.closePath()
    ctx.fill()

    return { midX: controlX, midY: controlY }
  }

  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth * dpi;
    const height = canvas.clientHeight * dpi;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.save();
    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // apply pan/zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Clear canvas with theme-aware background
    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? "#0f172a" : "#ffffff"
    ctx.fillRect(-pan.x, -pan.y, canvas.offsetWidth, canvas.offsetHeight)

    // Draw connections based on UTXO collapse mode
    if (utxoCollapseMode === "aggregated") {
      // Draw connections based on displayConnections (which handles collapsed vs individual)
      // Group connections by from-to pairs using JSON keys to avoid '-' split issues
      const connectionGroups = new Map<string, FTConnection[]>()

      // Filter out self-loops (from === to) to avoid zero-length edges
      const drawableConnections = connections.filter((c) => c.from !== c.to)

      drawableConnections.forEach((connection) => {
        // Use the original connection type or determine from the connection data
        const connectionType = connection.type || "out"
        const key = JSON.stringify({ from: connection.from, to: connection.to, type: connectionType })
        if (!connectionGroups.has(key)) {
          connectionGroups.set(key, [])
        }
        connectionGroups.get(key)!.push(connection)
      })

      connectionGroups.forEach((connections, key) => {
        const { from: fromId, to: toId } = JSON.parse(key)
        const fromNode = nodes.find((n) => n.id === fromId)
        const toNode = nodes.find((n) => n.id === toId)
        if (!fromNode || !toNode) {
          return
        }

        if (connections.length === 1) {
          // Single connection - draw straight line
          const connection = connections[0]
          const edgeColor = connection.customColor || (isDark ? "#6b7280" : "#9ca3af")
          
          ctx.strokeStyle = edgeColor
          ctx.lineWidth = connection.isAggregated ? 2 : 1.5
          ctx.setLineDash([])
          
          ctx.beginPath()
          ctx.moveTo(fromNode.x, fromNode.y)
          ctx.lineTo(toNode.x, toNode.y)
          ctx.stroke()

          ctx.fillStyle = edgeColor
          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y)

          // Draw text on edge
          const midX = (fromNode.x + toNode.x) / 2
          const midY = (fromNode.y + toNode.y) / 2

          ctx.fillStyle = isDark ? "#e5e7eb" : "#374151"
          ctx.font = connection.isAggregated ? "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          ctx.textAlign = "center"
          
          let amountText: string
          if (connection.isAggregated && connection._aggregatedText) {
            amountText = `${connection._aggregatedText.amount} ${connection._aggregatedText.currency} (${connection._aggregatedText.count} UTXOs)`
          } else {
            const valueToShow = connection.receivedAmount || connection.amount
            amountText = valueToShow ? `${valueToShow} ${connection.currency}` : connection.currency
          }
          
          const dx = toNode.x - fromNode.x
          const dy = toNode.y - fromNode.y
          let angle = Math.atan2(dy, dx)
          
          if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle += Math.PI
          }
          
          ctx.save()
          ctx.translate(midX, midY)
          ctx.rotate(angle)
          ctx.fillText(amountText, 0, 0)
          ctx.restore()
        } else {
          // Multiple connections - draw curved lines with offsets
          connections.forEach((connection, index) => {
            const edgeColor = connection.customColor || (isDark ? "#6b7280" : "#9ca3af")
            
            ctx.strokeStyle = edgeColor
            ctx.lineWidth = connection.isAggregated ? 2 : 1.5
            ctx.setLineDash([])
            
            // Calculate curve offset to prevent stacking
            const curveOffset = (index - (connections.length - 1) / 2) * 50
            const midX = (fromNode.x + toNode.x) / 2
            const midY = (fromNode.y + toNode.y) / 2
            
            // Calculate curve control point
            const dx = toNode.x - fromNode.x
            const dy = toNode.y - fromNode.y
            const length = Math.sqrt(dx * dx + dy * dy)
            const unitX = -dy / length
            const unitY = dx / length
            
            const controlX = midX + unitX * curveOffset
            const controlY = midY + unitY * curveOffset
            
            // Draw curved connection
            drawCurvedConnection(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset)
            
            // Draw curved arrow
            drawCurvedArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset, 8)
            
            // Draw text on the curve at the same offset as the edge
            ctx.fillStyle = isDark ? "#e5e7eb" : "#374151"
            ctx.font = connection.isAggregated ? "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" : "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            ctx.textAlign = "center"
            
            let amountText: string
            if (connection.isAggregated && connection._aggregatedText) {
              amountText = `${connection._aggregatedText.amount} ${connection._aggregatedText.currency} (${connection._aggregatedText.count} UTXOs)`
            } else {
              const valueToShow = connection.receivedAmount || connection.amount
              amountText = valueToShow ? `${valueToShow} ${connection.currency}` : connection.currency
            }
            
            const textX = controlX
            const textY = controlY
            
            const textDx = toNode.x - fromNode.x
            const textDy = toNode.y - fromNode.y
            let angle = Math.atan2(textDy, textDx)
            
            if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
              angle += Math.PI
            }
            
            ctx.save()
            ctx.translate(textX, textY)
            ctx.rotate(angle)
            ctx.fillText(amountText, 0, 0)
            ctx.restore()
          })
        }
      })
    } else {
      // Individual mode - draw all connections as-is with curved offsets for multiple edges
      const connectionGroups = new Map<string, FTConnection[]>()

      // Filter out self-loops (from === to) in individual mode as well
      const drawable = connections.filter((c) => c.from !== c.to)

      drawable.forEach((connection) => {
        const key = JSON.stringify({ from: connection.from, to: connection.to, type: connection.type || "out" })
        if (!connectionGroups.has(key)) {
          connectionGroups.set(key, [])
        }
        connectionGroups.get(key)!.push(connection)
      })

      connectionGroups.forEach((connections, key) => {
        const { from: fromId, to: toId } = JSON.parse(key)
        const fromNode = nodes.find((n) => n.id === fromId)
        const toNode = nodes.find((n) => n.id === toId)
        if (!fromNode || !toNode) return

        if (connections.length === 1) {
          // Single connection - draw straight line
          const connection = connections[0]
          const edgeColor = connection.customColor || (isDark ? "#6b7280" : "#9ca3af")
          
          ctx.strokeStyle = edgeColor
          ctx.lineWidth = 1.5
          ctx.setLineDash([])
          
          ctx.beginPath()
          ctx.moveTo(fromNode.x, fromNode.y)
          ctx.lineTo(toNode.x, toNode.y)
          ctx.stroke()

          ctx.fillStyle = edgeColor
          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, "8")

          // Draw text on edge
          const midX = (fromNode.x + toNode.x) / 2
          const midY = (fromNode.y + toNode.y) / 2

          ctx.fillStyle = isDark ? "#e5e7eb" : "#374151"
          ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          ctx.textAlign = "center"
          
          const valueToShow = connection.receivedAmount || connection.amount
          const amountText = valueToShow ? `${valueToShow} ${connection.currency}` : connection.currency
          
          const textDx = toNode.x - fromNode.x
          const textDy = toNode.y - fromNode.y
          let angle = Math.atan2(textDy, textDx)
          
          if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle += Math.PI
          }
          
          ctx.save()
          ctx.translate(midX, midY)
          ctx.rotate(angle)
          ctx.fillText(amountText, 0, 0)
          ctx.restore()
        } else {
          // Multiple connections - draw curved lines with offsets
          connections.forEach((connection, index) => {
            const edgeColor = connection.customColor || (isDark ? "#6b7280" : "#9ca3af")
            
            ctx.strokeStyle = edgeColor
            ctx.lineWidth = 1.5
            ctx.setLineDash([])
            
            // Calculate curve offset to prevent stacking
            const curveOffset = (index - (connections.length - 1) / 2) * 50
            const midX = (fromNode.x + toNode.x) / 2
            const midY = (fromNode.y + toNode.y) / 2
            
            // Calculate curve control point
            const dx = toNode.x - fromNode.x
            const dy = toNode.y - fromNode.y
            const length = Math.sqrt(dx * dx + dy * dy)
            const unitX = -dy / length
            const unitY = dx / length
            
            const controlX = midX + unitX * curveOffset
            const controlY = midY + unitY * curveOffset
            
            // Draw curved connection
            drawCurvedConnection(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset)
            
            // Draw curved arrow
            drawCurvedArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset, 8)
            
            // Draw text on the curve at the same offset as the edge
            ctx.fillStyle = isDark ? "#e5e7eb" : "#374151"
            ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            ctx.textAlign = "center"
            
            const valueToShow = connection.receivedAmount || connection.amount
            const amountText = valueToShow ? `${valueToShow} ${connection.currency}` : connection.currency
            
            const textX = controlX
            const textY = controlY
            
            const textDx = toNode.x - fromNode.x
            const textDy = toNode.y - fromNode.y
            let angle = Math.atan2(textDy, textDx)
            
            if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
              angle += Math.PI
            }
            
            ctx.save()
            ctx.translate(textX, textY)
            ctx.rotate(angle)
            ctx.fillText(amountText, 0, 0)
            ctx.restore()
          })
        }
      })
    }

    // Draw nodes
    nodes.forEach((n) => {
      const radius = 20;
      const active = hoverNodeId === n.id;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#111827';
      ctx.fill();
      ctx.lineWidth = 2 / zoom;
      ctx.strokeStyle = active ? '#f97316' : '#374151';
      ctx.stroke();

      // draw logo if available
      if (n.logoUrl) {
        const cache = imageCacheRef.current;
        let img = cache.get(n.logoUrl);
        if (!img) {
          img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => setRenderTick((t) => t + 1);
          img.src = n.logoUrl;
          cache.set(n.logoUrl, img);
        }
        if (img && img.complete) {
          const size = (radius - 4) * 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius - 4, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, n.x - size / 2, n.y - size / 2, size, size);
          ctx.restore();
        }
      }

      // risk ring
      if (typeof n.risk === 'number') {
        const risk = clamp(n.risk, 0, 100);
        const end = (risk / 100) * Math.PI * 2;
        ctx.beginPath();
        ctx.strokeStyle = risk > 70 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10b981';
        ctx.lineWidth = 3 / zoom;
        ctx.arc(n.x, n.y, radius + 4, -Math.PI / 2, -Math.PI / 2 + end);
        ctx.stroke();
      }

      // label and additional info
      let yOffset = radius + 14;
      
      // Entity name (primary label)
      if (n.label && (n.label !== n.id || n.type === 'custom')) {
        const labelColor = n.type === 'custom' ? '#9ca3af' : '#ffffff';
        ctx.fillStyle = labelColor;
        ctx.font = `bold ${12 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + yOffset);
        yOffset += 16 / zoom;
      }
      
      // Address (truncated) - only show for non-custom nodes
      if (n.type !== 'custom') {
        const addressText = n.id.length > 12 ? `${n.id.slice(0, 6)}...${n.id.slice(-6)}` : n.id;
        ctx.fillStyle = '#9ca3af';
        ctx.font = `${10 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(addressText, n.x, n.y + yOffset);
        yOffset += 14 / zoom;
      }
      
      // Risk score
      if (typeof n.risk === 'number') {
        const riskColor = n.risk > 70 ? '#ef4444' : n.risk > 40 ? '#f59e0b' : '#10b981';
        ctx.fillStyle = riskColor;
        ctx.font = `bold ${10 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`Risk: ${n.risk}`, n.x, n.y + yOffset);
        yOffset += 14 / zoom;
      }
      
      // Balance
      if (n.balance !== undefined) {
        const balanceValue = typeof n.balance === 'number' ? n.balance / 100000000 : Number(n.balance) / 100000000;
        const balanceText = balanceValue.toFixed(8);
        ctx.fillStyle = '#10b981';
        ctx.font = `${10 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`Balance: ${balanceText}`, n.x, n.y + yOffset);
        yOffset += 14 / zoom;
      }
      
      // USD Value
      if (n.usdValue !== undefined) {
        const usdText = typeof n.usdValue === 'number' ? `$${n.usdValue.toLocaleString()}` : String(n.usdValue);
        ctx.fillStyle = '#3b82f6';
        ctx.font = `${10 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(usdText, n.x, n.y + yOffset);
      }

      // add (+) button at top-left of node
      const addR = 5; // icon radius
      const addCx = n.x - radius - 6; // a bit offset from circle edge on left side
      const addCy = n.y - radius - 6;
      ctx.save();
      ctx.beginPath();
      ctx.arc(addCx, addCy, addR, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; // green color
      ctx.fill();
      // draw +
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8 / zoom;
      ctx.beginPath();
      // horizontal line
      ctx.moveTo(addCx - addR / 2, addCy);
      ctx.lineTo(addCx + addR / 2, addCy);
      // vertical line
      ctx.moveTo(addCx, addCy - addR / 2);
      ctx.lineTo(addCx, addCy + addR / 2);
      ctx.stroke();
      ctx.restore();

      // delete (X) button at top-right of node
      const delR = 5; // icon radius (reduced from 8)
      const delCx = n.x + radius + 6; // a bit offset from circle edge
      const delCy = n.y - radius - 6;
      ctx.save();
      ctx.beginPath();
      ctx.arc(delCx, delCy, delR, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      // draw X
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8 / zoom;
      ctx.beginPath();
      ctx.moveTo(delCx - delR / 2, delCy - delR / 2);
      ctx.lineTo(delCx + delR / 2, delCy + delR / 2);
      ctx.moveTo(delCx + delR / 2, delCy - delR / 2);
      ctx.lineTo(delCx - delR / 2, delCy + delR / 2);
      ctx.stroke();
      ctx.restore();
    });

    // Draw saved drawing elements from history
    if (drawingHistory.length > 0) {
      ctx.save();
      drawingHistory.forEach((action) => {
        if (action.type === 'addLine') {
          ctx.strokeStyle = action.data.color;
          ctx.lineWidth = 2 / zoom;
          ctx.beginPath();
          ctx.moveTo(action.data.line.start.x, action.data.line.start.y);
          ctx.lineTo(action.data.line.end.x, action.data.line.end.y);
          ctx.stroke();
        } else if (action.type === 'addRectangle') {
          ctx.strokeStyle = action.data.color;
          ctx.lineWidth = 2 / zoom;
          const { start, end } = action.data.shape;
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (action.type === 'addCircle') {
          ctx.strokeStyle = action.data.color;
          ctx.lineWidth = 2 / zoom;
          const { start, end } = action.data.shape;
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (action.type === 'addText') {
          ctx.fillStyle = action.data.color;
          ctx.font = `16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(action.data.text, action.data.x, action.data.y);
        }
      });
      ctx.restore();
    }

    // Draw current drawing elements (preview)
    if (activeTool !== 'select') {
      ctx.save();
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.lineWidth = 2 / zoom;

      // Draw line
      if (drawingLine) {
        ctx.beginPath();
        ctx.moveTo(drawingLine.start.x, drawingLine.start.y);
        ctx.lineTo(drawingLine.end.x, drawingLine.end.y);
        ctx.stroke();
      }

      // Draw shapes
      if (drawingShape) {
        const { start, end } = drawingShape;
        if (activeTool === 'rectangle') {
          ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
        } else if (activeTool === 'circle') {
          const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
          ctx.beginPath();
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw text input
      if (textInput) {
        ctx.font = `16px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(textInput.text, textInput.x, textInput.y);
      }

      ctx.restore();
    }

    ctx.restore();
  }, [dpi, drawArrow, nodes, connections, pan.x, pan.y, zoom, hoverNodeId, renderTick, utxoCollapseMode, activeTool, activeColor, drawingLine, drawingShape, textInput, drawingHistory]);

  useEffect(() => {
    drawConnections();
  }, [drawConnections]);

  // Center on a node by id when requested
  useEffect(() => {
    if (!canvasRef.current) return;
    if (!nodes.length) return;
    // Center logic can be added here if needed
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !nodes.length) return;
    // centerNodeId prop
  }, [nodes.length]);

  // helpers to convert screen to world coords
  const toWorld = (sx: number, sy: number) => {
    return { x: (sx - pan.x) / zoom, y: (sy - pan.y) / zoom };
  };

  const hitNode = (wx: number, wy: number) => {
    const r = 26; // include logo area and make easier to click
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = wx - n.x;
      const dy = wy - n.y;
      if (dx * dx + dy * dy <= r * r) return n.id;
    }
    return null;
  };

  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    // distance from point p to line segment ab
    const vx = x2 - x1;
    const vy = y2 - y1;
    const wx = px - x1;
    const wy = py - y1;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return Math.hypot(px - x1, py - y1);
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) return Math.hypot(px - x2, py - y2);
    const b = c1 / c2;
    const bx = x1 + b * vx;
    const by = y1 + b * vy;
    return Math.hypot(px - bx, py - by);
  };

  // Non-passive wheel listener to allow preventDefault (avoids console warnings)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const before = toWorld(mx, my);
      const nextZoom = clamp(zoom * factor, 0.25, 4);
      setZoom(nextZoom);
      const after = toWorld(mx, my);
      setPan((p) => ({ x: p.x + (after.x - before.x) * nextZoom, y: p.y + (after.y - before.y) * nextZoom }));
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel as EventListener);
  }, [zoom, pan.x, pan.y]);

  const onPointerDown: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = toWorld(mx, my);

    // Handle drawing tools
    if (activeTool !== 'select') {
      if (activeTool === 'draw') {
        setIsDrawing(true);
        setDrawingLine({ start: { x: w.x, y: w.y }, end: { x: w.x, y: w.y } });
        return;
      } else if (activeTool === 'rectangle' || activeTool === 'circle') {
        setDrawingShape({ start: { x: w.x, y: w.y }, end: { x: w.x, y: w.y } });
        return;
      } else if (activeTool === 'text') {
        setTextInput({ x: w.x, y: w.y, text: '' });
        const text = prompt('Enter text:');
        if (text !== null) {
          setTextInput({ x: w.x, y: w.y, text });
          if (onDrawingAction) {
            onDrawingAction({ type: 'addText', data: { x: w.x, y: w.y, text, color: activeColor } });
          }
        }
        setTextInput(null);
        return;
      }
    }

    // 1) Check add button hit BEFORE node hit radius so clicks just outside the node circle are captured
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const radius = 20;
      const addR = 5;
      const addCx = n.x - radius - 6;
      const addCy = n.y - radius - 6;
      const dx = w.x - addCx;
      const dy = w.y - addCy;
      if (dx * dx + dy * dy <= (addR + 5) * (addR + 5)) {
        onNodeAdd(n);
        return;
      }
    }

    // 2) Check delete-X hit BEFORE node hit radius so clicks just outside the node circle are captured
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const radius = 20;
      const delR = 5;
      const delCx = n.x + radius + 6;
      const delCy = n.y - radius - 6;
      const dx = w.x - delCx;
      const dy = w.y - delCy;
      if (dx * dx + dy * dy <= (delR + 5) * (delR + 5)) {
        onNodeRemove(n.id);
        return;
      }
    }
    const id = hitNode(w.x, w.y);
    if (id) {
      setDraggedNodeId(id);
      setDragStart({ x: w.x, y: w.y });
      setIsDragging(false); // Reset wasDragging on new drag
    } else {
      // try edge hit-test first
      let bestIdx = -1;
      let bestDist = Infinity;
      connections.forEach((c, idx) => {
        const a = nodes.find((n) => n.id === c.from);
        const b = nodes.find((n) => n.id === c.to);
        if (!a || !b) return;
        const d = distToSegment(w.x, w.y, a.x, a.y, b.x, b.y);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      const threshold = 8 / zoom; // world units threshold adjusted by zoom
      if (bestIdx >= 0 && bestDist <= threshold) {
        const conn = connections[bestIdx];
        if (conn) {
          setSelectedConnection(conn);
          setEdgeColorPickerOpen(true);
          if (onEdgeClick) onEdgeClick(conn);
        }
        // do not start panning on edge click
        return;
      }
      // fallback to start panning
      setIsDragging(true);
      setDragStart({ x: mx - pan.x, y: my - pan.y });
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = toWorld(mx, my);

    // Handle drawing
    if (isDrawing && activeTool === 'draw') {
      setDrawingLine(prev => prev ? { ...prev, end: { x: w.x, y: w.y } } : null);
      return;
    }

    if (drawingShape && (activeTool === 'rectangle' || activeTool === 'circle')) {
      setDrawingShape(prev => prev ? { ...prev, end: { x: w.x, y: w.y } } : null);
      return;
    }

    if (!isDragging && !draggedNodeId) return;
    
    if (draggedNodeId) {
      setDragStart({ x: w.x, y: w.y });
      onNodeDrag(draggedNodeId, w.x, w.y);
      return;
    }
    if (isDragging) {
      setPan({ x: mx - dragStart.x, y: my - dragStart.y });
    }
  };

  // Track hover to update cursor for logo/node area
  const onPointerMoveHover: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = toWorld(mx, my);
    const id = hitNode(w.x, w.y);
    setHoverNodeId(id);
    if (id) {
      canvas.style.cursor = 'pointer';
    } else if (isDragging || draggedNodeId) {
      canvas.style.cursor = 'grabbing';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLCanvasElement> = () => {
    const wasDragging = isDragging;
    setIsDragging(false);
    
    // Finalize drawing
    if (isDrawing && activeTool === 'draw' && drawingLine) {
      if (onDrawingAction) {
        onDrawingAction({ 
          type: 'addLine', 
          data: { line: drawingLine, color: activeColor } 
        });
      }
      setIsDrawing(false);
      setDrawingLine(null);
    }

    if (drawingShape && (activeTool === 'rectangle' || activeTool === 'circle')) {
      if (onDrawingAction) {
        onDrawingAction({ 
          type: activeTool === 'rectangle' ? 'addRectangle' : 'addCircle', 
          data: { shape: drawingShape, color: activeColor } 
        });
      }
      setDrawingShape(null);
    }

    if (draggedNodeId) {
      const node = nodes.find((n) => n.id === draggedNodeId);
      if (node) {
        const dx = Math.abs(node.x - dragStart.x);
        const dy = Math.abs(node.y - dragStart.y);
        // Treat as click if we were not panning and movement was tiny
        if (!wasDragging || (dx < 5 && dy < 5)) {
          if (onNodeClick) onNodeClick(node);
        }
      }
    }
    setDraggedNodeId(null);
    setDragStart({ x: 0, y: 0 }); // Reset dragStart on pointer up
  };

  const onDoubleClick: React.MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!onNodeDoubleClick) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const w = toWorld(mx, my);
    const id = hitNode(w.x, w.y);
    if (id) {
      const node = nodes.find((n) => n.id === id);
      if (node) onNodeDoubleClick(node);
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedConnection && onConnectionColorChange) {
      onConnectionColorChange(selectedConnection.txHash, color);
    }
  };

  const handleColorReset = () => {
    if (selectedConnection && onConnectionColorReset) {
      onConnectionColorReset(selectedConnection.txHash);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-white dark:bg-black"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => { onPointerMove(e); onPointerMoveHover(e); }}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
      
      <EdgeColorPicker
        open={edgeColorPickerOpen}
        onOpenChange={setEdgeColorPickerOpen}
        txHash={selectedConnection?.txHash || ''}
        currentColor={selectedConnection?.customColor}
        onColorChange={handleColorChange}
        onReset={handleColorReset}
      />
    </>
  );
});


