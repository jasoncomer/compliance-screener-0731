import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo } from 'react';
import { generateConnectionKey } from '../utils/utxoKeyGeneration';

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
  notes?: Array<{ id: string; userId: string; userName: string; content: string; timestamp: string }>;
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
  txid?: string // Transaction ID for display in Transaction Details
  // Unique key to identify a specific UTXO within a tx when in individual mode
  utxoKey?: string
  // Primary connection key in format: source:destination:utxo:amount
  connectionKey?: string
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
  locked?: boolean // If true, this connection cannot be modified, edited, or duplicated
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

  centerNodeId?: string | null
}

export type NetworkGraphHandle = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  forceRender: () => void
  centerOnNode: (nodeId: string) => void
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

  centerNodeId
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);
  const [centeredNodeId, setCenteredNodeId] = useState<string | null>(null);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingLine, setDrawingLine] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [drawingShape, setDrawingShape] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  
  // Edge color picker state

  
  // Create a mapping from node ID to logo URL using the same logic as useLogo hook
  const nodeLogoMap = useMemo(() => {
    console.log('🔍 Creating logo map for nodes:', nodes.map(n => ({
      id: n.id,
      logoUrl: n.logoUrl,
      type: n.type,
      entityId: n.entityId,
      entityType: n.entityType
    })));
    
    const map: Record<string, string | null> = {};
    nodes.forEach(node => {
      // For custom nodes, always use the logoUrl directly (currency logo)
      if (node.type === 'custom' && node.logoUrl) {
        console.log('🎯 Using currency logo for custom node', node.id, ':', node.logoUrl);
        map[node.id] = node.logoUrl;
      } else if (node.logoUrl) {
        // For other nodes, use logoUrl from SOT data (this should be set by prefetchProfilesAndLogos)
        console.log('🎯 Using logoUrl from node data for', node.id, ':', node.logoUrl);
        map[node.id] = node.logoUrl;
      } else if (node.entityId || node.entityType) {
        // Priority 2: Construct logo URL directly from Google Storage
        const entityId = node.entityId || node.entityType;
        if (entityId) {
          console.log('🔍 Constructing direct logo URL for', node.id, 'entityId:', entityId);
          // Use direct Google Storage URL (JPG first, PNG fallback handled by image loading)
          const directUrl = `https://storage.googleapis.com/entity-logos/${entityId}.jpg`;
          map[node.id] = directUrl;
        } else {
          map[node.id] = null;
        }
      } else {
        // Priority 3: For nodes without entityId yet, we'll wait for prefetchProfilesAndLogos to complete
        // This happens when a node is first created but profile data hasn't been fetched yet
        map[node.id] = null;
      }
    });
    return map;
  }, [nodes]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Helper function to get logo URL for a node
  const getNodeLogoUrl = useCallback((node: FTNode): string | null => {
    return nodeLogoMap[node.id] || null;
  }, [nodeLogoMap]);

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
    forceRender: () => setRenderTick(prev => prev + 1),
    centerOnNode: (nodeId: string) => {
      if (!canvasRef.current) return;
      
      const targetNode = nodes.find(node => node.id === nodeId);
      if (!targetNode) return;
      
      // Get canvas dimensions
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      
      // Calculate the right center position (75% from left, 50% from top)
      const targetX = canvasWidth * 0.75;
      const targetY = canvasHeight * 0.5;
      
      // Calculate the pan offset needed to center the node at the target position
      const panX = targetX - (targetNode.x * zoom);
      const panY = targetY - (targetNode.y * zoom);
      
      console.log('🎯 Programmatically centering node', nodeId, 'to right center of view');
      setPan({ x: panX, y: panY });
      setCenteredNodeId(nodeId); // Mark this node as centered
    }
  }), [nodes, zoom]);

  const drawArrow = useCallback((ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label?: string, fillColor?: string) => {
    // Calculate the direction vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    // Check if we have a valid direction
    if (length === 0) {
      console.log('⚠️ Cannot draw arrow: zero length vector');
      return;
    }
    
    // Normalize the direction vector (commented out as not currently used)
    // const unitX = dx / length;
    // const unitY = dy / length;
    
    // Position arrow halfway between source and destination (between text and destination)
    const arrowX = x1 + (x2 - x1) * 0.75; // 75% of the way from source to destination
    const arrowY = y1 + (y2 - y1) * 0.75; // 75% of the way from source to destination
    
    // Draw arrow head - make it proportional to the spacing
    const angle = Math.atan2(dy, dx);
    const size = 10; // Reduced size for cleaner look
    
    // Save current fill style and set the arrow color
    ctx.save();
    if (fillColor) {
      ctx.fillStyle = fillColor;
    } else {
      // Fallback color if none provided
      ctx.fillStyle = '#666666'; // Gray fallback
    }
    
    // Draw a clean arrow
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - size * Math.cos(angle - Math.PI / 6), arrowY - size * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(arrowX - size * Math.cos(angle + Math.PI / 6), arrowY - size * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    
    // Restore fill style
    ctx.restore();
    

    
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
    fillColor?: string,
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
    ctx.save();
    if (fillColor) {
      ctx.fillStyle = fillColor;
    }
    
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - unitTangentX * arrowSize + perpX * arrowSize * 0.5, arrowY - unitTangentY * arrowSize + perpY * arrowSize * 0.5)
    ctx.lineTo(arrowX - unitTangentX * arrowSize - perpX * arrowSize * 0.5, arrowY - unitTangentY * arrowSize - perpY * arrowSize * 0.5)
    ctx.closePath()
    ctx.fill()
    
    ctx.restore();

    return { midX: controlX, midY: controlY }
  }

  // Track rendered text to prevent duplicate text rendering using connection keys
  // const renderedTextRef = useRef<Set<string>>(new Set());
  
  // Function to clear rendered text when starting fresh
  // const clearRenderedText = useCallback(() => {
  //   console.log('🧹 Clearing rendered text tracking');
  //   renderedTextRef.current.clear();
  // }, []);

  // Helper function to render text (temporarily disabled tracking to fix blank screen)
  const renderTextOnce = useCallback((ctx: CanvasRenderingContext2D, connection: FTConnection, text: string, x: number, y: number, angle: number) => {
    const textKey = generateConnectionKey(connection);
    
    console.log('📝 Rendering text for connection:', textKey, 'text:', text, 'at', x, y);
    
    try {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillText(text, 0, 0);
      ctx.restore();
      console.log('✅ Successfully rendered text for:', textKey);
    } catch (error) {
      console.error('❌ Error rendering text:', error);
    }
  }, []);

  const drawConnections = useCallback(() => {
    console.log('🔄 drawConnections called at:', new Date().toISOString());
    console.log('🔧 Current mode:', utxoCollapseMode);
    console.log('📊 Total connections:', connections.length);
    console.log('🔄 drawConnections dependencies:', { 
      connectionsLength: connections.length, 
      nodesLength: nodes.length, 
      utxoCollapseMode, 
      pan, 
      zoom 
    });
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
    
    // Clear canvas completely before drawing
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    console.log('🧹 Canvas cleared at:', new Date().toISOString());

    // Clear canvas with theme-aware background (before transformations)
    const isDark = document.documentElement.classList.contains('dark')
    ctx.fillStyle = isDark ? "#0f172a" : "#ffffff"
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight)
    console.log('🎨 Canvas background filled with:', isDark ? "dark" : "light", 'theme');

    // apply pan/zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw connections based on UTXO collapse mode
    const connectionKeys = connections.map(c => generateConnectionKey(c));
    const uniqueKeys = [...new Set(connectionKeys)];
    console.log('🎨 Drawing connections:', { 
      mode: utxoCollapseMode, 
      totalConnections: connections.length,
      uniqueConnections: uniqueKeys.length,
      hasDuplicates: connectionKeys.length !== uniqueKeys.length,
      connections: connections.map(c => ({ 
        from: c.from, 
        to: c.to, 
        amount: c.amount, 
        currency: c.currency,
        utxoKey: c.utxoKey,
        txHash: c.txHash,
        key: generateConnectionKey(c)
      })) 
    });
    
    if (utxoCollapseMode === "aggregated") {
      console.log('🔀 Using AGGREGATED mode');
      // Draw connections based on displayConnections (which handles collapsed vs individual)
      // Group connections by from-to pairs using JSON keys to avoid '-' split issues
      const connectionGroups = new Map<string, FTConnection[]>()

      // Filter out self-loops (from === to) to avoid zero-length edges
      const drawableConnections = connections.filter((c) => c.from !== c.to)

      drawableConnections.forEach((connection) => {
        // If connection is already aggregated, treat it as a single connection
        if (connection.isAggregated) {
          const nodePair = `${connection.from}|${connection.to}`
          connectionGroups.set(nodePair, [connection])
        } else {
          // Group by node pair to handle bidirectional connections
          // Use a consistent key that preserves direction information
          const nodePair = `${connection.from}|${connection.to}`
          
          if (!connectionGroups.has(nodePair)) {
            connectionGroups.set(nodePair, [])
          }
          connectionGroups.get(nodePair)!.push(connection)
        }
      })
      
      // Also check for reverse connections and group them together
      const reverseGroups = new Map<string, FTConnection[]>();
      connectionGroups.forEach((connections, key) => {
        const [fromId, toId] = key.split('|');
        const reverseKey = `${toId}|${fromId}`;
        
        if (connectionGroups.has(reverseKey)) {
          // We have bidirectional connections
          const forwardConnections = connections;
          const reverseConnections = connectionGroups.get(reverseKey) || [];
          
          // Create a combined group for bidirectional connections
          const bidirectionalKey = `${fromId}|${toId}`;
          reverseGroups.set(bidirectionalKey, [...forwardConnections, ...reverseConnections]);
        } else {
          // Only unidirectional connections
          reverseGroups.set(key, connections);
        }
      });
      
      // Use the reverse groups for processing
      const finalGroups = reverseGroups;
      
      console.log('🔗 Processing connections:', {
        total: drawableConnections.length,
        groups: finalGroups.size,
        connections: Array.from(finalGroups.entries()).map(([key, conns]) => ({
          key: key,
          count: conns.length
        }))
      });

      finalGroups.forEach((connections, key) => {
        const [fromId, toId] = key.split('|')
        const fromNode = nodes.find((n) => n.id === fromId)
        const toNode = nodes.find((n) => n.id === toId)
        if (!fromNode || !toNode) {
          return
        }

        console.log('🔗 Aggregated mode processing:', { 
          fromId, 
          toId, 
          connectionsCount: connections.length
        });

        // Separate connections by direction
        const outgoingConnections = connections.filter(conn => 
          conn.from === fromId && conn.to === toId
        );
        const incomingConnections = connections.filter(conn => 
          conn.from === toId && conn.to === fromId
        );

        // Check if we have bidirectional connections
        const hasBidirectional = outgoingConnections.length > 0 && incomingConnections.length > 0;
        
        // Check if we have multiple connections in the same direction (need curves)
        // For aggregated connections, treat as single connection
        const hasAggregatedOutgoing = outgoingConnections.some(conn => conn.isAggregated);
        const hasAggregatedIncoming = incomingConnections.some(conn => conn.isAggregated);
        const hasMultipleOutgoing = !hasAggregatedOutgoing && outgoingConnections.length > 1;
        const hasMultipleIncoming = !hasAggregatedIncoming && incomingConnections.length > 1;
        
        console.log('🔍 Connection analysis:', {
          fromId,
          toId,
          outgoingCount: outgoingConnections.length,
          incomingCount: incomingConnections.length,
          hasMultipleOutgoing,
          hasMultipleIncoming,
          hasBidirectional
        });
        
        // Draw outgoing connections (from first node to second node)
        if (outgoingConnections.length > 0) {
          const edgeColor = outgoingConnections[0]?.customColor || (isDark ? "#6b7280" : "#9ca3af")
          
          // Check if we have an aggregated connection
          const aggregatedConnection = outgoingConnections.find(conn => conn.isAggregated);
          
          let totalAmount: string;
          let totalFormatted: string;
          let utxoCount: number;
          let currency: string;
          
          if (aggregatedConnection) {
            // Use pre-calculated values from aggregated connection
            totalAmount = aggregatedConnection.amount || "0";
            totalFormatted = formatAmount(String(totalAmount));
            utxoCount = aggregatedConnection.utxoCount || outgoingConnections.length;
            currency = aggregatedConnection.currency || "BTC";
          } else {
            // Calculate from individual connections
            totalAmount = outgoingConnections.reduce((sum, conn) => sum + parseFloat(conn.amount || "0"), 0).toFixed(8);
            totalFormatted = formatAmount(String(totalAmount));
            utxoCount = outgoingConnections.length;
            currency = outgoingConnections[0]?.currency || "BTC";
          }

          // Handle aggregated connections as single straight lines
          if (hasAggregatedOutgoing) {
            console.log('📊 Drawing aggregated connection as straight line');
            const connection = outgoingConnections[0]; // Should only be one aggregated connection
            
            // Draw straight line
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.strokeStyle = connection.customColor || edgeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw arrow
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const length = Math.sqrt(dx*dx + dy*dy);
            const unitX = dx / length;
            const unitY = dy / length;
            const arrowX = toNode.x - unitX * 20;
            const arrowY = toNode.y - unitY * 20;
            
            ctx.beginPath();
            ctx.moveTo(arrowX - unitY * 8, arrowY + unitX * 8);
            ctx.lineTo(arrowX, arrowY);
            ctx.lineTo(arrowX + unitY * 8, arrowY - unitX * 8);
            ctx.strokeStyle = connection.customColor || edgeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text with count
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            const textX = midX + unitY * 15;
            const textY = midY - unitX * 15;
            
            const amountText = `${totalFormatted} ${currency}`;
            const countText = `${utxoCount} UTXOs`;
            
            ctx.save();
            ctx.fillStyle = isDark ? "#ffffff" : "#000000";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(amountText, textX, textY - 6);
            ctx.fillText(countText, textX, textY + 6);
            ctx.restore();
          } else if (hasBidirectional || hasMultipleOutgoing) {
            console.log('🎯 Drawing curved connections:', {
              hasBidirectional,
              hasMultipleOutgoing,
              connectionCount: outgoingConnections.length
            });
            
            // Draw individual curved lines for each connection when there are multiple
            if (hasMultipleOutgoing) {
              console.log('📐 Drawing multiple outgoing curves');
              const OFFSET_STEP = 40;
              outgoingConnections.forEach((connection, index) => {
                const connectionColor = connection.customColor || edgeColor;
                const curveOffset = (index - (outgoingConnections.length - 1) / 2) * OFFSET_STEP;
                
                drawCurvedConnection(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset)
                drawCurvedArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset, 8, connectionColor)
                
                // Position text on the curve
                const midX = (fromNode.x + toNode.x) / 2
                const midY = (fromNode.y + toNode.y) / 2
                const dx = toNode.x - fromNode.x
                const dy = toNode.y - fromNode.y
                const length = Math.sqrt(dx*dx+dy*dy)||1;
                const unitX = -dy/length;
                const unitY = dx/length;
                
                const textX = midX + unitX * curveOffset * 0.5
                const textY = midY + unitY * curveOffset * 0.5
                
                const amountText = `${formatAmount(String(connection.amount))} ${connection.currency}`

                const textDx = toNode.x - fromNode.x
                const textDy = toNode.y - fromNode.y
                let angle = Math.atan2(textDy, textDx)
                
                if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                  angle += Math.PI
                }
                
                ctx.save()
                ctx.translate(textX, textY)
                ctx.rotate(angle)
                ctx.fillStyle = isDark ? "#ffffff" : "#000000";
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(amountText, 0, 0);
                ctx.restore();
              });
            } else {
              // Single outgoing connection with bidirectional - use single curve
              const curveOffset = 40;
              drawCurvedConnection(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset)
              drawCurvedArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset, 8, edgeColor)
              
              // Position text on the curve
              const midX = (fromNode.x + toNode.x) / 2
              const midY = (fromNode.y + toNode.y) / 2
              const dx = toNode.x - fromNode.x
              const dy = toNode.y - fromNode.y
              const length = Math.sqrt(dx*dx+dy*dy)||1;
              const unitX = -dy/length;
              const unitY = dx/length;
              
              const textX = midX + unitX * curveOffset * 0.5
              const textY = midY + unitY * curveOffset * 0.5
              
              const isCustomNode = fromNode.type === 'custom' || toNode.type === 'custom'
              const amountText = isCustomNode 
                ? `${totalFormatted} ${currency}`
                : utxoCount > 1 
                  ? `${totalFormatted} ${currency} (${utxoCount} UTXOs)`
                  : `${totalFormatted} ${currency}`

              const textDx = toNode.x - fromNode.x
              const textDy = toNode.y - fromNode.y
              let angle = Math.atan2(textDy, textDx)
              
              if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                angle += Math.PI
              }
              
              ctx.save()
              ctx.translate(textX, textY)
              ctx.rotate(angle)
              ctx.fillStyle = isDark ? "#ffffff" : "#000000";
              ctx.font = "12px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(amountText, 0, 0);
              ctx.restore();
            }
          } else {
            // Draw straight line for unidirectional connections
            ctx.strokeStyle = edgeColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(fromNode.x, fromNode.y)
            ctx.lineTo(toNode.x, toNode.y)
            ctx.stroke()

            // Draw arrow
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, undefined, edgeColor)

            // Draw amount text
            const isCustomNode = fromNode.type === 'custom' || toNode.type === 'custom'
            const amountText = isCustomNode 
              ? `${totalFormatted} ${currency}`
              : utxoCount > 1 
                ? `${totalFormatted} ${currency} (${utxoCount} UTXOs)`
                : `${totalFormatted} ${currency}`

            const textAngle = Math.atan2(dy, dx);
            const textX = (fromNode.x + toNode.x) / 2 + Math.cos(textAngle) * 20;
            const textY = (fromNode.y + toNode.y) / 2 + Math.sin(textAngle) * 20;

            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle);
            ctx.fillStyle = isDark ? "#ffffff" : "#000000";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(amountText, 0, 0);
            ctx.restore();
          }
        }

        // Draw incoming connections (from second node to first node) if they exist
        if (incomingConnections.length > 0) {
          const edgeColor = incomingConnections[0]?.customColor || (isDark ? "#9ca3af" : "#6b7280")
          
          // Check if we have an aggregated connection
          const aggregatedConnection = incomingConnections.find(conn => conn.isAggregated);
          
          let totalAmount: string;
          let totalFormatted: string;
          let utxoCount: number;
          let currency: string;
          
          if (aggregatedConnection) {
            // Use pre-calculated values from aggregated connection
            totalAmount = aggregatedConnection.amount || "0";
            totalFormatted = formatAmount(String(totalAmount));
            utxoCount = aggregatedConnection.utxoCount || incomingConnections.length;
            currency = aggregatedConnection.currency || "BTC";
          } else {
            // Calculate from individual connections
            totalAmount = incomingConnections.reduce((sum, conn) => sum + parseFloat(conn.amount || "0"), 0).toFixed(8);
            totalFormatted = formatAmount(String(totalAmount));
            utxoCount = incomingConnections.length;
            currency = incomingConnections[0]?.currency || "BTC";
          }

          // Handle aggregated connections as single straight lines
          if (hasAggregatedIncoming) {
            console.log('📊 Drawing aggregated incoming connection as straight line');
            const connection = incomingConnections[0]; // Should only be one aggregated connection
            
            // Draw straight line
            ctx.beginPath();
            ctx.moveTo(toNode.x, toNode.y);
            ctx.lineTo(fromNode.x, fromNode.y);
            ctx.strokeStyle = connection.customColor || edgeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw arrow
            const dx = fromNode.x - toNode.x;
            const dy = fromNode.y - toNode.y;
            const length = Math.sqrt(dx*dx + dy*dy);
            const unitX = dx / length;
            const unitY = dy / length;
            const arrowX = fromNode.x - unitX * 20;
            const arrowY = fromNode.y - unitY * 20;
            
            ctx.beginPath();
            ctx.moveTo(arrowX - unitY * 8, arrowY + unitX * 8);
            ctx.lineTo(arrowX, arrowY);
            ctx.lineTo(arrowX + unitY * 8, arrowY - unitX * 8);
            ctx.strokeStyle = connection.customColor || edgeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw text with count
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            const textX = midX - unitY * 15;
            const textY = midY + unitX * 15;
            
            const amountText = `${totalFormatted} ${currency}`;
            const countText = `${utxoCount} UTXOs`;
            
            ctx.save();
            ctx.fillStyle = isDark ? "#ffffff" : "#000000";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(amountText, textX, textY - 6);
            ctx.fillText(countText, textX, textY + 6);
            ctx.restore();
          } else if (hasBidirectional || hasMultipleIncoming) {
            // Draw individual curved lines for each connection when there are multiple
            if (hasMultipleIncoming) {
              const OFFSET_STEP = 40;
              incomingConnections.forEach((connection, index) => {
                const connectionColor = connection.customColor || edgeColor;
                const curveOffset = -((index - (incomingConnections.length - 1) / 2) * OFFSET_STEP);
                
                drawCurvedConnection(ctx, toNode.x, toNode.y, fromNode.x, fromNode.y, curveOffset)
                drawCurvedArrow(ctx, toNode.x, toNode.y, fromNode.x, fromNode.y, curveOffset, 8, connectionColor)
                
                // Position text on the curve
                const midX = (fromNode.x + toNode.x) / 2
                const midY = (fromNode.y + toNode.y) / 2
                const dx = fromNode.x - toNode.x
                const dy = fromNode.y - toNode.y
                const length = Math.sqrt(dx*dx+dy*dy)||1;
                const unitX = -dy/length;
                const unitY = dx/length;
                
                const textX = midX + unitX * curveOffset * 0.5
                const textY = midY + unitY * curveOffset * 0.5
                
                const amountText = `${formatAmount(String(connection.amount))} ${connection.currency}`

                const textDx = fromNode.x - toNode.x
                const textDy = fromNode.y - toNode.y
                let angle = Math.atan2(textDy, textDx)
                
                if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                  angle += Math.PI
                }
                
                ctx.save()
                ctx.translate(textX, textY)
                ctx.rotate(angle)
                ctx.fillStyle = isDark ? "#ffffff" : "#000000";
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(amountText, 0, 0);
                ctx.restore();
              });
            } else {
              // Single incoming connection with bidirectional - use single curve
              const curveOffset = -40; // Negative offset for the opposite direction
              drawCurvedConnection(ctx, toNode.x, toNode.y, fromNode.x, fromNode.y, curveOffset)
              drawCurvedArrow(ctx, toNode.x, toNode.y, fromNode.x, fromNode.y, curveOffset, 8, edgeColor)
              
              // Position text on the curve
              const midX = (fromNode.x + toNode.x) / 2
              const midY = (fromNode.y + toNode.y) / 2
              const dx = fromNode.x - toNode.x
              const dy = fromNode.y - toNode.y
              const length = Math.sqrt(dx*dx+dy*dy)||1;
              const unitX = -dy/length;
              const unitY = dx/length;
              
              const textX = midX + unitX * curveOffset * 0.5
              const textY = midY + unitY * curveOffset * 0.5
              
              const isCustomNode = fromNode.type === 'custom' || toNode.type === 'custom'
              const amountText = isCustomNode 
                ? `${totalFormatted} ${currency}`
                : utxoCount > 1 
                  ? `${totalFormatted} ${currency} (${utxoCount} UTXOs)`
                  : `${totalFormatted} ${currency}`

              const textDx = fromNode.x - toNode.x
              const textDy = fromNode.y - toNode.y
              let angle = Math.atan2(textDy, textDx)
              
              if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
                angle += Math.PI
              }
              
              ctx.save()
              ctx.translate(textX, textY)
              ctx.rotate(angle)
              ctx.fillStyle = isDark ? "#ffffff" : "#000000";
              ctx.font = "12px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(amountText, 0, 0);
              ctx.restore();
            }
          } else {
            // Draw straight line for unidirectional connections
            ctx.strokeStyle = edgeColor
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(toNode.x, toNode.y)
            ctx.lineTo(fromNode.x, fromNode.y)
            ctx.stroke()

            // Draw arrow
            const dx = fromNode.x - toNode.x;
            const dy = fromNode.y - toNode.y;
            drawArrow(ctx, toNode.x, toNode.y, fromNode.x, fromNode.y, undefined, edgeColor)

            // Draw amount text
            const isCustomNode = fromNode.type === 'custom' || toNode.type === 'custom'
            const amountText = isCustomNode 
              ? `${totalFormatted} ${currency}`
              : utxoCount > 1 
                ? `${totalFormatted} ${currency} (${utxoCount} UTXOs)`
                : `${totalFormatted} ${currency}`

            const textAngle = Math.atan2(dy, dx);
            const textX = (fromNode.x + toNode.x) / 2 - Math.cos(textAngle) * 20;
            const textY = (fromNode.y + toNode.y) / 2 - Math.sin(textAngle) * 20;

            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle);
            ctx.fillStyle = isDark ? "#ffffff" : "#000000";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(amountText, 0, 0);
            ctx.restore();
          }
        }
      })
    } else {
      console.log('🔀 Using INDIVIDUAL mode');
      // Individual mode - draw all connections as-is with curved offsets for multiple edges
      const connectionGroups = new Map<string, FTConnection[]>()

      // Filter out self-loops (from === to) in individual mode as well
      const drawable = connections.filter((c) => c.from !== c.to)

        const OFFSET_STEP = 80;
        drawable.forEach((connection) => {
          // Group by node pair to enable multiple edge spreading
          const key = `${connection.from}|${connection.to}`;
          if (!connectionGroups.has(key)) {
            connectionGroups.set(key, [])
          }
          connectionGroups.get(key)!.push(connection)
        })

      connectionGroups.forEach((connections) => {
        // Since we're using node pairs as keys, we need to get from/to from the first connection
        const firstConnection = connections[0]
        const fromId = firstConnection.from
        const toId = firstConnection.to
        const fromNode = nodes.find((n) => n.id === fromId)
        const toNode = nodes.find((n) => n.id === toId)
        if (!fromNode || !toNode) return

        console.log('🔗 Individual mode processing:', { 
          fromId, 
          toId, 
          connectionsCount: connections.length, 
          fromNode: { x: fromNode.x, y: fromNode.y }, 
          toNode: { x: toNode.x, y: toNode.y },
          connections: connections.map(c => ({ 
            utxoKey: c.utxoKey, 
            txHash: c.txHash, 
            amount: c.amount, 
            currency: c.currency 
          }))
        });

        console.log('🔍 Individual mode connection analysis:', {
          fromId,
          toId,
          connectionCount: connections.length,
          connections: connections.map(c => ({ utxoKey: c.utxoKey, amount: c.amount }))
        });

        if (connections.length === 1) {
          console.log('📏 Drawing single straight line');
          // Single connection - draw straight line
          const connection = connections[0]
          const edgeColor = connection.customColor || (isDark ? "#6b7280" : "#9ca3af")
          
          ctx.strokeStyle = edgeColor
          ctx.lineWidth = 1.5
          ctx.setLineDash([])
          
          // Draw line all the way to the destination node
          ctx.beginPath()
          ctx.moveTo(fromNode.x, fromNode.y)
          ctx.lineTo(toNode.x, toNode.y)
          ctx.stroke()

          drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, undefined, edgeColor)

          // Draw text on edge - no offset for single connections
          const midX = (fromNode.x + toNode.x) / 2
          const midY = (fromNode.y + toNode.y) / 2

          const dx = toNode.x - fromNode.x
          const dy = toNode.y - fromNode.y

          ctx.fillStyle = isDark ? "#e5e7eb" : "#374151"
          ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          ctx.textAlign = "center"

          const valueToShow = connection.receivedAmount || connection.amount
          const amountText = valueToShow ? `${formatAmount(String(valueToShow))} ${connection.currency}` : connection.currency

          let angle = Math.atan2(dy, dx)
          if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle += Math.PI
          }

          // Use the helper function to render text only once per connection
          renderTextOnce(ctx, connection, amountText, midX, midY, angle);
        } else {
          console.log('📐 Drawing multiple curved lines in individual mode');
          // Multiple connections - draw curved lines with offsets
          connections.forEach((connection, index) => {
            const edgeColor = connection.customColor || (isDark ? "#6b7280" : "#9ca3af")
            
            ctx.strokeStyle = edgeColor
            ctx.lineWidth = 1.5
            ctx.setLineDash([])
            
            // Calculate curve offset to prevent stacking
            const curveOffset = (index - (connections.length - 1) / 2) * OFFSET_STEP
            const midX = (fromNode.x + toNode.x) / 2
            const midY = (fromNode.y + toNode.y) / 2
            
            // Calculate curve control point
            const dx = toNode.x - fromNode.x
            const dy = toNode.y - fromNode.y
            const length = Math.sqrt(dx*dx+dy*dy)||1;
            const unitX = -dy/length;
            const unitY = dx/length;
            
            
            // Draw curved connection
            drawCurvedConnection(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset)
            
            // Draw curved arrow
            drawCurvedArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y, curveOffset, 8, edgeColor)
            
            // Draw text on the curve at the same offset as the edge
            ctx.fillStyle = isDark ? "#e5e7eb" : "#374151"
            ctx.font = "11px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            ctx.textAlign = "center"
            
            const valueToShow = connection.receivedAmount || connection.amount
            const amountText = valueToShow ? `${formatAmount(String(valueToShow))} ${connection.currency}` : connection.currency
            
            // Reduce label offset by 50% compared to curve control point
            const textX = midX + unitX * (curveOffset * 0.5)
            const textY = midY + unitY * (curveOffset * 0.5)
            
            const textDx = toNode.x - fromNode.x
            const textDy = toNode.y - fromNode.y
            let angle = Math.atan2(textDy, textDx)
            
            if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
              angle += Math.PI
            }
            
            // Use the helper function to render text only once per connection
            renderTextOnce(ctx, connection, amountText, textX, textY, angle);
          })
        }
      })
    }

    // Draw nodes
    nodes.forEach((n) => {
      const radius = 20;
      const active = hoverNodeId === n.id;
      
      // Get logo URL using the helper function
      const logoUrl = getNodeLogoUrl(n);
      
      // Use logo if available, otherwise use default color
      if (logoUrl) {
        const cache = imageCacheRef.current;
        let img = cache.get(logoUrl);
        if (!img) {
          img = new Image();
          // Don't set crossOrigin for test images to avoid CORS issues
          img.onload = () => {
            setRenderTick((t) => t + 1);
          };
          img.onerror = () => {
            // Try PNG fallback if JPG failed
            if (logoUrl.endsWith('.jpg')) {
              const pngUrl = logoUrl.replace('.jpg', '.png');
              const pngImg = new Image();
              pngImg.onload = () => {
                cache.set(logoUrl, pngImg); // Cache the PNG under the original JPG key
                setRenderTick((t) => t + 1);
              };
              pngImg.onerror = () => {
                cache.delete(logoUrl);
              };
              pngImg.src = pngUrl;
            } else {
              // Remove from cache so it doesn't keep trying
              cache.delete(logoUrl);
            }
          };
          img.src = logoUrl;
          cache.set(logoUrl, img);
        }
        if (img && img.complete && img.naturalWidth > 0) {
          console.log('🎨 Drawing logo as circular node', n.id, 'at position', n.x, n.y, 'logoUrl:', logoUrl);
          try {
            // Create circular clipping path for the logo
            ctx.save();
            ctx.beginPath();
            ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            
            // Draw the logo to fill the entire clipped circle
            const logoSize = radius * 2; // Use the standard node size
            ctx.drawImage(img, n.x - logoSize / 2, n.y - logoSize / 2, logoSize, logoSize);
            ctx.restore();
          } catch (error) {
            console.log('❌ Error drawing logo for node', n.id, ':', error, 'logoUrl:', logoUrl);
            // Fallback if drawing fails - show circle with border and background
            // Draw circle with background and border
            ctx.beginPath();
            ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f3f4f6'; // Light gray background
            ctx.fill();
            ctx.strokeStyle = '#d1d5db'; // Light gray border
            ctx.lineWidth = 2 / zoom;
            ctx.stroke();
            
            const displayText = (n.label && n.label !== n.id) ? n.label.charAt(0).toUpperCase() : 
                               n.entityId ? n.entityId.charAt(0).toUpperCase() :
                               n.entityType ? n.entityType.charAt(0).toUpperCase() : '?';
            ctx.fillStyle = '#374151'; // Dark gray text
            ctx.font = `bold ${14 / zoom}px Inter, system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(displayText, n.x, n.y);
          }
        } else {
          // Fallback while logo is loading or if image is broken - show circle with border and background
          
          // Draw circle with background and border
          ctx.beginPath();
          ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = '#f3f4f6'; // Light gray background
          ctx.fill();
          ctx.strokeStyle = '#d1d5db'; // Light gray border
          ctx.lineWidth = 2 / zoom;
          ctx.stroke();
          
          // Add text indicator with first letter of entity name or type
          const displayText = (n.label && n.label !== n.id) ? n.label.charAt(0).toUpperCase() : 
                             n.entityId ? n.entityId.charAt(0).toUpperCase() :
                             n.entityType ? n.entityType.charAt(0).toUpperCase() : '?';
          ctx.fillStyle = '#374151'; // Dark gray text
          ctx.font = `bold ${14 / zoom}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(displayText, n.x, n.y);
        }
      } else {
        // No logo available - show circle with border and background
        // Draw circle with background and border
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f3f4f6'; // Light gray background
        ctx.fill();
        ctx.strokeStyle = '#d1d5db'; // Light gray border
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
        
        const displayText = (n.label && n.label !== n.id) ? n.label.charAt(0).toUpperCase() : 
                           n.entityId ? n.entityId.charAt(0).toUpperCase() :
                           n.entityType ? n.entityType.charAt(0).toUpperCase() : '?';
        ctx.fillStyle = '#374151'; // Dark gray text
        ctx.font = `bold ${14 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayText, n.x, n.y);
      }
      
      ctx.lineWidth = 2 / zoom;
      ctx.strokeStyle = active ? '#f97316' : '#374151';
      ctx.stroke();

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
      
      // Entity name (primary label) - show proper entity name if available
      const displayName = n.label && n.label !== n.id ? n.label : 
                         n.entityId ? n.entityId : 
                         n.entityType ? n.entityType : null;
      
      if (displayName) {
        const labelColor = n.type === 'custom' ? '#9ca3af' : '#ffffff';
        ctx.fillStyle = labelColor;
        ctx.font = `bold ${12 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(displayName, n.x, n.y + yOffset);
        yOffset += 16 / zoom;
      }
      
      // Address (truncated) - only show for non-custom nodes and when we have a proper entity name
      if (n.type !== 'custom' && displayName) {
        const addressText = n.id.length > 12 ? `${n.id.slice(0, 6)}...${n.id.slice(-6)}` : n.id;
        ctx.fillStyle = '#9ca3af';
        ctx.font = `${10 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(addressText, n.x, n.y + yOffset);
        yOffset += 14 / zoom;
      }
      
      // Risk score
      if (n.risk !== undefined && n.risk !== null) {
        const riskValue = typeof n.risk === 'number' ? n.risk : parseFloat(String(n.risk));
        if (!isNaN(riskValue) && riskValue >= 0) {
          const riskColor = riskValue > 70 ? '#ef4444' : riskValue > 40 ? '#f59e0b' : '#10b981';
          ctx.fillStyle = riskColor;
          ctx.font = `bold ${10 / zoom}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(`Risk: ${Math.round(riskValue)}`, n.x, n.y + yOffset);
          yOffset += 14 / zoom;
          
          // Debug logging for all nodes with risk scores
          console.log('🔍 Node risk display:', {
            nodeId: n.id,
            label: n.label,
            risk: n.risk,
            riskValue,
            rounded: Math.round(riskValue),
            isAggregated: n.id.startsWith('agg:')
          });
        } else {
          // Debug logging for nodes without valid risk scores
          console.log('⚠️ Node missing valid risk score:', {
            nodeId: n.id,
            label: n.label,
            risk: n.risk,
            riskValue,
            isAggregated: n.id.startsWith('agg:')
          });
        }
      } else {
        // Debug logging for nodes without risk property
        console.log('❌ Node missing risk property:', {
          nodeId: n.id,
          label: n.label,
          risk: n.risk,
          isAggregated: n.id.startsWith('agg:')
        });
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
  }, [dpi, drawArrow, nodes, connections, pan.x, pan.y, zoom, hoverNodeId, renderTick, utxoCollapseMode, activeTool, activeColor, drawingLine, drawingShape, textInput, drawingHistory, getNodeLogoUrl]);

  useEffect(() => {
    drawConnections();
  }, [drawConnections]);

  // Temporarily disabled connection change detection to fix blank screen
  // TODO: Re-enable with proper logic once blank screen issue is resolved



  // Center on a node by id when requested (only once per node)
  useEffect(() => {
    if (!canvasRef.current || !centerNodeId || !nodes.length) return;
    
    // Only center if we haven't centered on this node before
    if (centeredNodeId === centerNodeId) return;
    
    const targetNode = nodes.find(node => node.id === centerNodeId);
    if (!targetNode) return;
    
    // Get canvas dimensions
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    
    // Calculate the right center position (75% from left, 50% from top)
    const targetX = canvasWidth * 0.75;
    const targetY = canvasHeight * 0.5;
    
    // Calculate the pan offset needed to center the node at the target position
    const panX = targetX - (targetNode.x * zoom);
    const panY = targetY - (targetNode.y * zoom);
    
    console.log('🎯 Centering node', centerNodeId, 'to right center of view (first time)');
    console.log('Node position:', targetNode.x, targetNode.y);
    console.log('Target view position:', targetX, targetY);
    console.log('New pan position:', panX, panY);
    
    setPan({ x: panX, y: panY });
    setCenteredNodeId(centerNodeId); // Mark this node as centered
  }, [centerNodeId, nodes, zoom, centeredNodeId]);

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

  // helper
  const formatAmount = (valStr:string)=>{
    const num=parseFloat(valStr||"0");
    return Number.isFinite(num)?Number(num).toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:8}):valStr
  }

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
      const sampleBezier = (x0:number,y0:number,x1:number,y1:number,x2:number,y2:number,px:number,py:number)=>{
        // approximate min distance by sampling points along t
        let min=Infinity;
        for(let t=0;t<=1.0;t+=0.1){
          const xt=(1-t)*(1-t)*x0+2*(1-t)*t*x1+t*t*x2;
          const yt=(1-t)*(1-t)*y0+2*(1-t)*t*y1+t*t*y2;
          const dx=px-xt;const dy=py-yt;const dist=Math.sqrt(dx*dx+dy*dy);
          if(dist<min)min=dist;
        }
        return min;
      };

      connections.forEach((c, idx) => {
        const a = nodes.find((n) => n.id === c.from);
        const b = nodes.find((n) => n.id === c.to);
        if (!a || !b) return;

        let d;
        // Determine if multiple connections between the pair exist to use curved offset logic
        const pairKey = JSON.stringify({ from: c.from, to: c.to, type: c.type || "out" });
        const siblings = connections.filter(conn => JSON.stringify({ from: conn.from, to: conn.to, type: conn.type || "out" })===pairKey);
        if(siblings.length>1){
          const indexPos = siblings.indexOf(c);
          const OFFSET_STEP = 80;
          const curveOffset = (indexPos - (siblings.length - 1) / 2) * OFFSET_STEP;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.sqrt(dx*dx+dy*dy)||1;
          const unitX = -dy/length;
          const unitY = dx/length;
          const controlX = midX + unitX * curveOffset;
          const controlY = midY + unitY * curveOffset;
          d = sampleBezier(a.x,a.y,controlX,controlY,b.x,b.y,w.x,w.y);
        }else{
          d = distToSegment(w.x, w.y, a.x, a.y, b.x, b.y);
        }
        if (d < bestDist) {
          bestDist = d;
          bestIdx = idx;
        }
      });
      const threshold = 8 / zoom; // world units threshold adjusted by zoom
      if (bestIdx >= 0 && bestDist <= threshold) {
        const conn = connections[bestIdx];
        if (conn && onEdgeClick) {
          if (utxoCollapseMode === "aggregated") {
            // Collect all connections between the same pair (and same type) to build a summary
            const sameGroup = connections.filter(c =>
              c.from === conn.from &&
              c.to === conn.to &&
              (c.type || "out") === (conn.type || "out")
            );

            if (sameGroup.length > 1) {
              const totalAmount = sameGroup.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0).toFixed(8);
              const aggregated: FTConnection = {
                ...conn,
                amount: totalAmount,
                isAggregated: true,
                utxoCount: sameGroup.length,
                txHash: sameGroup.map(c => c.txHash).join(","),
                txid: sameGroup.map(c => c.txid).filter(Boolean).join(","),
                date: sameGroup.map(c => c.date).join(","),
                _aggregatedText: {
                  amount: totalAmount,
                  count: sameGroup.length,
                  currency: conn.currency
                }
              };
              onEdgeClick(aggregated);
            } else {
              onEdgeClick(conn);
            }
          } else {
            onEdgeClick(conn);
          }
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
      

    </>
  );
});


