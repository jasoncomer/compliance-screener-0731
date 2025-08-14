import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
};

export type FTConnection = {
  from: string;
  to: string;
  amount?: number | string;
  currency?: string;
  txHash?: string;
  color?: string;
};

type Props = {
  nodes: FTNode[];
  setNodes: React.Dispatch<React.SetStateAction<FTNode[]>>;
  connections: FTConnection[];
  setConnections: React.Dispatch<React.SetStateAction<FTConnection[]>>;
  highlightedNodes?: Set<string>;
  highlightedEdges?: Set<string>;
  onEdgeClick?: (payload: { index: number; connection: FTConnection }) => void;
  onNodeClick?: (payload: { id: string }) => void;
  centerNodeId?: string | null;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const NetworkGraph: React.FC<Props> = ({
  nodes,
  setNodes,
  connections,
  setConnections,
  highlightedNodes,
  highlightedEdges,
  onEdgeClick,
  onNodeClick,
  centerNodeId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [pressStart, setPressStart] = useState<{ x: number; y: number } | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);

  const dpi = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const [renderTick, setRenderTick] = useState(0);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

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

  const draw = useCallback(() => {
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

    // edges
    ctx.lineWidth = 1.5 / zoom;
    connections.forEach((c) => {
      const a = nodes.find((n) => n.id === c.from);
      const b = nodes.find((n) => n.id === c.to);
      if (!a || !b) return;
      ctx.strokeStyle = c.color || '#9ca3af';
      ctx.fillStyle = c.color || '#9ca3af';
      const label =
        c.amount !== undefined && c.currency
          ? `${String(c.amount)} ${c.currency}`
          : c.amount !== undefined
            ? String(c.amount)
            : undefined;
      drawArrow(ctx, a.x, a.y, b.x, b.y, label);
    });

    // nodes
    nodes.forEach((n) => {
      const radius = 20;
      const active = highlightedNodes?.has(n.id);
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

      // label
      if (n.label) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = `${12 / zoom}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + radius + 14);
      }

      // delete (X) button at top-right of node
      const delR = 8; // icon radius
      const delCx = n.x + radius + 6; // a bit offset from circle edge
      const delCy = n.y - radius - 6;
      ctx.save();
      ctx.beginPath();
      ctx.arc(delCx, delCy, delR, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.lineWidth = 1.5 / zoom;
      ctx.strokeStyle = '#7f1d1d';
      ctx.stroke();
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

    ctx.restore();
  }, [dpi, drawArrow, nodes, connections, pan.x, pan.y, zoom, highlightedNodes, renderTick]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Center on a node by id when requested
  useEffect(() => {
    if (!canvasRef.current) return;
    if (!nodes.length) return;
    const id = (typeof (arguments as any) !== 'undefined') ? undefined : undefined; // noop to satisfy TS checker in this context
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
    // 1) Check delete-X hit BEFORE node hit radius so clicks just outside the node circle are captured
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const radius = 20;
      const delR = 8;
      const delCx = n.x + radius + 6;
      const delCy = n.y - radius - 6;
      const dx = w.x - delCx;
      const dy = w.y - delCy;
      if (dx * dx + dy * dy <= (delR + 5) * (delR + 5)) {
        setNodes((prev) => prev.filter((node) => node.id !== n.id));
        setConnections((prev) => prev.filter((c) => c.from !== n.id && c.to !== n.id));
        return;
      }
    }
    const id = hitNode(w.x, w.y);
    if (id) {
      setDraggedNodeId(id);
      setDragStart({ x: w.x, y: w.y });
      setPressStart({ x: w.x, y: w.y });
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
        if (conn && onEdgeClick) onEdgeClick({ index: bestIdx, connection: conn });
        // do not start panning on edge click
        return;
      }
      // fallback to start panning
      setDragging(true);
      setDragStart({ x: mx - pan.x, y: my - pan.y });
    }
  };

  const onPointerMove: React.PointerEventHandler<HTMLCanvasElement> = (e) => {
    if (!dragging && !draggedNodeId) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (draggedNodeId) {
      const w = toWorld(mx, my);
      const dx = w.x - dragStart.x;
      const dy = w.y - dragStart.y;
      setDragStart({ x: w.x, y: w.y });
      setNodes((prev) => prev.map((n) => (n.id === draggedNodeId ? { ...n, x: n.x + dx, y: n.y + dy } : n)));
      return;
    }
    if (dragging) {
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
    } else if (dragging || draggedNodeId) {
      canvas.style.cursor = 'grabbing';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const onPointerUp: React.PointerEventHandler<HTMLCanvasElement> = () => {
    const wasDragging = dragging;
    setDragging(false);
    if (draggedNodeId && pressStart) {
      const node = nodes.find((n) => n.id === draggedNodeId);
      if (node) {
        const dx = Math.abs(node.x - pressStart.x);
        const dy = Math.abs(node.y - pressStart.y);
        // Treat as click if we were not panning and movement was tiny
        if (!wasDragging || (dx < 5 && dy < 5)) {
          if (onNodeClick) onNodeClick({ id: draggedNodeId });
        }
      }
    }
    setDraggedNodeId(null);
    setPressStart(null);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-white dark:bg-black"
      onPointerDown={onPointerDown}
      onPointerMove={(e) => { onPointerMove(e); onPointerMoveHover(e); }}
      onPointerUp={onPointerUp}
    />
  );
};

export default NetworkGraph;


