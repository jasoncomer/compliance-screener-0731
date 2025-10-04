/**
 * useAnnotationManagement Hook
 * Handles annotation hit testing, text save/cancel, and coordinate transformations
 */

import { useCallback } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';

import { FTNode } from '../components/NetworkGraph';
import { TextAnnotation } from '../components/InlineTextEditor';
import { useSpatialAnnotationIndex } from './useSpatialAnnotationIndex';
import { ResizeHandleType } from './useDrawingState';

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  start: Point;
  end: Point;
}

export interface ResizeHandle {
  type: ResizeHandleType;
  x: number;
  y: number;
  screenX?: number;
  screenY?: number;
}

export interface AnnotationManagementConfig {
  fgRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  nodes: FTNode[];
  drawingHistory: any[];
  textEditorState: { x: number; y: number; graphX: number; graphY: number } | null;
  setTextEditorState: React.Dispatch<React.SetStateAction<{ x: number; y: number; graphX: number; graphY: number } | null>>;
  activeColor: string;
  selectedAnnotationIndex: number | null;
  onDrawingAction?: (action: { type: string; data: any }) => void;
  onAnnotationUpdate?: (index: number, data: any) => void;
}

export interface AnnotationManagementHandlers {
  graphToScreen: (x: number, y: number) => Point;
  screenToGraph: (x: number, y: number) => Point;
  findNearestNode: (x: number, y: number, maxDistance?: number) => string | null;
  findAnnotationAtPoint: (screenX: number, screenY: number) => number;
  findResizeHandleAtPoint: (screenX: number, screenY: number, annotationIndex: number) => ResizeHandle | null;
  getResizeHandles: (annotationIndex: number) => ResizeHandle[];
  calculateResizedDimensions: (originalData: any, handleType: ResizeHandleType, newX: number, newY: number, nodes?: FTNode[]) => any;
  handleTextSave: (annotation: TextAnnotation) => void;
  handleTextCancel: () => void;
  isPointInRectangle: (px: number, py: number, rect: { start: Point; end: Point }) => boolean;
  isPointInCircle: (px: number, py: number, center: Point, edgePoint: Point) => boolean;
  isPointNearLine: (px: number, py: number, start: Point, end: Point) => boolean;
  isPointInText: (px: number, py: number, action: any, ctx: CanvasRenderingContext2D) => boolean;
}

/**
 * Hook for managing annotation operations
 */
export function useAnnotationManagement(config: AnnotationManagementConfig): AnnotationManagementHandlers {
  const {
    fgRef,
    overlayCanvasRef,
    nodes,
    drawingHistory,
    textEditorState,
    setTextEditorState,
    activeColor,
    selectedAnnotationIndex,
    onDrawingAction,
    onAnnotationUpdate
  } = config;

  // Initialize spatial index for O(log n) annotation queries
  const spatialIndex = useSpatialAnnotationIndex(drawingHistory, nodes);

  // Helper function to convert graph coordinates to screen coordinates
  const graphToScreen = useCallback((x: number, y: number): Point => {
    if (!fgRef.current) return { x, y };
    return fgRef.current.graph2ScreenCoords(x, y);
  }, [fgRef]);

  // Helper function to convert screen coordinates to graph coordinates
  const screenToGraph = useCallback((x: number, y: number): Point => {
    if (!fgRef.current) return { x, y };
    return fgRef.current.screen2GraphCoords(x, y);
  }, [fgRef]);

  // Helper function to find nearest node within attachment radius
  const findNearestNode = useCallback((x: number, y: number, maxDistance = 100): string | null => {
    let nearestNode: string | null = null;
    let minDistance = maxDistance;

    nodes.forEach(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node.id;
      }
    });

    return nearestNode;
  }, [nodes]);

  // Hit testing: Check if point is near rectangle edges (not inside, to avoid blocking nodes)
  const isPointInRectangle = useCallback((px: number, py: number, rect: { start: Point; end: Point }): boolean => {
    const minX = Math.min(rect.start.x, rect.end.x);
    const maxX = Math.max(rect.start.x, rect.end.x);
    const minY = Math.min(rect.start.y, rect.end.y);
    const maxY = Math.max(rect.start.y, rect.end.y);
    const threshold = 10; // pixels of tolerance

    // Check if point is near any of the four edges
    const nearTop = Math.abs(py - minY) <= threshold && px >= minX - threshold && px <= maxX + threshold;
    const nearBottom = Math.abs(py - maxY) <= threshold && px >= minX - threshold && px <= maxX + threshold;
    const nearLeft = Math.abs(px - minX) <= threshold && py >= minY - threshold && py <= maxY + threshold;
    const nearRight = Math.abs(px - maxX) <= threshold && py >= minY - threshold && py <= maxY + threshold;

    return nearTop || nearBottom || nearLeft || nearRight;
  }, []);

  // Hit testing: Check if point is on circle edge
  const isPointInCircle = useCallback((px: number, py: number, center: Point, edgePoint: Point): boolean => {
    const radius = Math.sqrt(Math.pow(edgePoint.x - center.x, 2) + Math.pow(edgePoint.y - center.y, 2));
    const distance = Math.sqrt(Math.pow(px - center.x, 2) + Math.pow(py - center.y, 2));
    const threshold = 5; // pixels of tolerance
    return Math.abs(distance - radius) <= threshold;
  }, []);

  // Hit testing: Check if point is near line (including arrowhead)
  const isPointNearLine = useCallback((px: number, py: number, start: Point, end: Point): boolean => {
    // Check if point is near the line segment
    const A = px - start.x;
    const B = py - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx: number, yy: number;
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 10) return true; // 10 pixel threshold for line (increased from 5 for easier selection)

    // Also check if point is near the arrowhead triangle
    // Arrowhead is at the end point, so check distance from end point with larger threshold
    const arrowLength = 10;
    const dxFromEnd = px - end.x;
    const dyFromEnd = py - end.y;
    const distanceFromEnd = Math.sqrt(dxFromEnd * dxFromEnd + dyFromEnd * dyFromEnd);

    // If within arrowhead radius, check if it's in the arrowhead cone
    if (distanceFromEnd <= arrowLength + 10) { // Increased tolerance from 5 to 10 pixels
      const angle = Math.atan2(end.y - start.y, end.x - start.x);
      const pointAngle = Math.atan2(py - end.y, px - end.x);
      const angleDiff = Math.abs(angle - pointAngle);
      const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);

      // Check if point is within the cone of the arrowhead (roughly 30 degrees on each side)
      if (normalizedAngleDiff <= Math.PI / 6 + 0.3) { // Increased angle tolerance from 0.2 to 0.3
        return true;
      }
    }

    return false;
  }, []);

  // Hit testing: Check if point is in text annotation bounds
  const isPointInText = useCallback((px: number, py: number, action: any, ctx: CanvasRenderingContext2D): boolean => {
    const fontSizeMap: Record<string, number> = { small: 12, medium: 16, large: 24 };
    const baseFontSize = action.data.fontSize ? (fontSizeMap[action.data.fontSize] || 16) : 16;
    const zoom = fgRef.current?.zoom() || 1;
    const fontSize = Math.max(12, baseFontSize * zoom);
    const bold = action.data.bold ? 'bold ' : '';
    const italic = action.data.italic ? 'italic ' : '';

    ctx.font = `${bold}${italic}${fontSize}px sans-serif`;
    const lines = action.data.text.split('\n');
    const lineHeight = fontSize * 1.2;
    const maxWidth = Math.max(...lines.map((line: string) => ctx.measureText(line).width));
    const padding = 4;

    return px >= action.screenX - padding &&
           px <= action.screenX + maxWidth + padding &&
           py >= action.screenY - padding &&
           py <= action.screenY + lines.length * lineHeight + padding;
  }, [fgRef]);

  // Handle text annotation save
  const handleTextSave = useCallback((annotation: TextAnnotation) => {
    if (!textEditorState) return;

    // Check if we're editing an existing annotation
    const isEditing = selectedAnnotationIndex !== null &&
      selectedAnnotationIndex >= 0 &&
      drawingHistory[selectedAnnotationIndex]?.type === 'addText';

    if (isEditing && onAnnotationUpdate) {
      // Update existing text annotation
      onAnnotationUpdate(selectedAnnotationIndex, {
        text: annotation.text,
        fontSize: annotation.fontSize,
        bold: annotation.bold,
        italic: annotation.italic,
        backgroundColor: annotation.backgroundColor,
      });
    } else if (onDrawingAction) {
      // Create new text annotation
      // Find nearest node for attachment
      const attachedNodeId = findNearestNode(textEditorState.graphX, textEditorState.graphY);
      let offsetX = textEditorState.graphX;
      let offsetY = textEditorState.graphY;

      // If attached to a node, store relative offset instead of absolute position
      if (attachedNodeId) {
        const node = nodes.find(n => n.id === attachedNodeId);
        if (node) {
          offsetX = textEditorState.graphX - node.x;
          offsetY = textEditorState.graphY - node.y;
        }
      }

      onDrawingAction({
        type: 'addText',
        data: {
          id: crypto.randomUUID(),
          x: offsetX,
          y: offsetY,
          text: annotation.text,
          color: activeColor,
          fontSize: annotation.fontSize,
          bold: annotation.bold,
          italic: annotation.italic,
          backgroundColor: annotation.backgroundColor,
          attachedNodeId: attachedNodeId || undefined,
        }
      });
    }
    setTextEditorState(null);
  }, [textEditorState, selectedAnnotationIndex, drawingHistory, onAnnotationUpdate, onDrawingAction, activeColor, findNearestNode, nodes, setTextEditorState]);

  // Handle text annotation cancel
  const handleTextCancel = useCallback(() => {
    setTextEditorState(null);
  }, [setTextEditorState]);

  // Get resize handles for a selected annotation
  const getResizeHandles = useCallback((annotationIndex: number): ResizeHandle[] => {
    if (annotationIndex < 0 || annotationIndex >= drawingHistory.length) return [];

    const action = drawingHistory[annotationIndex];
    const handles: ResizeHandle[] = [];

    if (action.type === 'addLine') {
      // Line: 2 endpoint handles
      let startX = action.data.line.start.x;
      let startY = action.data.line.start.y;
      let endX = action.data.line.end.x;
      let endY = action.data.line.end.y;

      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          startX = attachedNode.x + action.data.line.start.x;
          startY = attachedNode.y + action.data.line.start.y;
          endX = attachedNode.x + action.data.line.end.x;
          endY = attachedNode.y + action.data.line.end.y;
        }
      }

      handles.push(
        { type: 'endpoint-start', x: startX, y: startY },
        { type: 'endpoint-end', x: endX, y: endY }
      );
    } else if (action.type === 'addRectangle') {
      // Rectangle: 4 corner + 4 edge handles
      let startX = action.data.shape.start.x;
      let startY = action.data.shape.start.y;
      let endX = action.data.shape.end.x;
      let endY = action.data.shape.end.y;

      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          startX = attachedNode.x + action.data.shape.start.x;
          startY = attachedNode.y + action.data.shape.start.y;
          endX = attachedNode.x + action.data.shape.end.x;
          endY = attachedNode.y + action.data.shape.end.y;
        }
      }

      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      // Corners
      handles.push(
        { type: 'corner-nw', x: minX, y: minY },
        { type: 'corner-ne', x: maxX, y: minY },
        { type: 'corner-se', x: maxX, y: maxY },
        { type: 'corner-sw', x: minX, y: maxY }
      );

      // Edges
      handles.push(
        { type: 'edge-n', x: midX, y: minY },
        { type: 'edge-e', x: maxX, y: midY },
        { type: 'edge-s', x: midX, y: maxY },
        { type: 'edge-w', x: minX, y: midY }
      );
    } else if (action.type === 'addCircle') {
      // Circle: 8 handles around the circle
      let centerX = action.data.shape.start.x;
      let centerY = action.data.shape.start.y;
      let edgeX = action.data.shape.end.x;
      let edgeY = action.data.shape.end.y;

      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          centerX = attachedNode.x + action.data.shape.start.x;
          centerY = attachedNode.y + action.data.shape.start.y;
          edgeX = attachedNode.x + action.data.shape.end.x;
          edgeY = attachedNode.y + action.data.shape.end.y;
        }
      }

      const radius = Math.sqrt(
        Math.pow(edgeX - centerX, 2) + Math.pow(edgeY - centerY, 2)
      );

      // 8 cardinal and diagonal points
      handles.push(
        { type: 'circle-n', x: centerX, y: centerY - radius },
        { type: 'circle-ne', x: centerX + radius * 0.707, y: centerY - radius * 0.707 },
        { type: 'circle-e', x: centerX + radius, y: centerY },
        { type: 'circle-se', x: centerX + radius * 0.707, y: centerY + radius * 0.707 },
        { type: 'circle-s', x: centerX, y: centerY + radius },
        { type: 'circle-sw', x: centerX - radius * 0.707, y: centerY + radius * 0.707 },
        { type: 'circle-w', x: centerX - radius, y: centerY },
        { type: 'circle-nw', x: centerX - radius * 0.707, y: centerY - radius * 0.707 }
      );
    }

    return handles;
  }, [drawingHistory, nodes]);

  // Find which resize handle is at the given screen point
  const findResizeHandleAtPoint = useCallback((screenX: number, screenY: number, annotationIndex: number): ResizeHandle | null => {
    const handles = getResizeHandles(annotationIndex);
    const hitRadius = 8; // pixels

    for (const handle of handles) {
      const screenPos = graphToScreen(handle.x, handle.y);
      const distance = Math.sqrt(
        Math.pow(screenX - screenPos.x, 2) + Math.pow(screenY - screenPos.y, 2)
      );

      if (distance <= hitRadius) {
        return {
          ...handle,
          screenX: screenPos.x,
          screenY: screenPos.y
        };
      }
    }

    return null;
  }, [getResizeHandles, graphToScreen]);

  // Calculate new dimensions based on resize handle movement
  const calculateResizedDimensions = useCallback((
    originalData: any,
    handleType: ResizeHandleType,
    newX: number,
    newY: number,
    providedNodes?: FTNode[]
  ): any => {
    const nodesList = providedNodes || nodes;

    // Helper to convert absolute coordinates to relative if needed
    const toRelative = (absX: number, absY: number) => {
      if (originalData.attachedNodeId) {
        const attachedNode = nodesList.find(n => n.id === originalData.attachedNodeId);
        if (attachedNode) {
          return { x: absX - attachedNode.x, y: absY - attachedNode.y };
        }
      }
      return { x: absX, y: absY };
    };

    // For lines
    if (handleType === 'endpoint-start') {
      const relativePos = toRelative(newX, newY);
      return {
        line: {
          start: relativePos,
          end: originalData.line.end
        }
      };
    } else if (handleType === 'endpoint-end') {
      const relativePos = toRelative(newX, newY);
      return {
        line: {
          start: originalData.line.start,
          end: relativePos
        }
      };
    }

    // For rectangles - corners
    if (handleType === 'corner-nw') {
      const relativePos = toRelative(newX, newY);
      return {
        shape: {
          start: relativePos,
          end: originalData.shape.end
        }
      };
    } else if (handleType === 'corner-ne') {
      const relativeX = toRelative(newX, newY);
      const relativeY = toRelative(newX, newY);
      return {
        shape: {
          start: { x: originalData.shape.start.x, y: relativeY.y },
          end: { x: relativeX.x, y: originalData.shape.end.y }
        }
      };
    } else if (handleType === 'corner-se') {
      const relativePos = toRelative(newX, newY);
      return {
        shape: {
          start: originalData.shape.start,
          end: relativePos
        }
      };
    } else if (handleType === 'corner-sw') {
      const relativeX = toRelative(newX, newY);
      const relativeY = toRelative(newX, newY);
      return {
        shape: {
          start: { x: relativeX.x, y: originalData.shape.start.y },
          end: { x: originalData.shape.end.x, y: relativeY.y }
        }
      };
    }

    // For rectangles - edges
    if (handleType === 'edge-n') {
      const relativeY = toRelative(newX, newY).y;
      return {
        shape: {
          start: { x: originalData.shape.start.x, y: relativeY },
          end: originalData.shape.end
        }
      };
    } else if (handleType === 'edge-s') {
      const relativeY = toRelative(newX, newY).y;
      return {
        shape: {
          start: originalData.shape.start,
          end: { x: originalData.shape.end.x, y: relativeY }
        }
      };
    } else if (handleType === 'edge-e') {
      const relativeX = toRelative(newX, newY).x;
      return {
        shape: {
          start: originalData.shape.start,
          end: { x: relativeX, y: originalData.shape.end.y }
        }
      };
    } else if (handleType === 'edge-w') {
      const relativeX = toRelative(newX, newY).x;
      return {
        shape: {
          start: { x: relativeX, y: originalData.shape.start.y },
          end: originalData.shape.end
        }
      };
    }

    // For circles - all handles adjust radius
    if (handleType.startsWith('circle-')) {
      const relativeEdge = toRelative(newX, newY);
      return {
        shape: {
          start: originalData.shape.start, // center stays same (relative)
          end: relativeEdge // new edge point (relative if attached, absolute if not)
        }
      };
    }

    return originalData;
  }, [nodes]);

  // Find annotation at click point using spatial index
  const findAnnotationAtPoint = useCallback((screenX: number, screenY: number): number => {
    if (!overlayCanvasRef.current || !fgRef.current) return -1;

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return -1;

    const graphCoords = screenToGraph(screenX, screenY);

    // Use spatial index to get candidates (O(log n) instead of O(n))
    const candidates = spatialIndex.findAnnotationsAtPoint(graphCoords);

    // Precise hit testing only on candidates (typically 0-3 items)
    for (const i of candidates) {
      const action = drawingHistory[i];

      if (action.type === 'addLine') {
        let startX = action.data.line.start.x;
        let startY = action.data.line.start.y;
        let endX = action.data.line.end.x;
        let endY = action.data.line.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + action.data.line.start.x;
            startY = attachedNode.y + action.data.line.start.y;
            endX = attachedNode.x + action.data.line.end.x;
            endY = attachedNode.y + action.data.line.end.y;
          }
        }

        if (isPointNearLine(graphCoords.x, graphCoords.y, { x: startX, y: startY }, { x: endX, y: endY })) {
          return i;
        }
      } else if (action.type === 'addRectangle') {
        let startX = action.data.shape.start.x;
        let startY = action.data.shape.start.y;
        let endX = action.data.shape.end.x;
        let endY = action.data.shape.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + action.data.shape.start.x;
            startY = attachedNode.y + action.data.shape.start.y;
            endX = attachedNode.x + action.data.shape.end.x;
            endY = attachedNode.y + action.data.shape.end.y;
          }
        }

        if (isPointInRectangle(graphCoords.x, graphCoords.y, { start: { x: startX, y: startY }, end: { x: endX, y: endY } })) {
          return i;
        }
      } else if (action.type === 'addCircle') {
        let centerX = action.data.shape.start.x;
        let centerY = action.data.shape.start.y;
        let edgeX = action.data.shape.end.x;
        let edgeY = action.data.shape.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            centerX = attachedNode.x + action.data.shape.start.x;
            centerY = attachedNode.y + action.data.shape.start.y;
            edgeX = attachedNode.x + action.data.shape.end.x;
            edgeY = attachedNode.y + action.data.shape.end.y;
          }
        }

        if (isPointInCircle(graphCoords.x, graphCoords.y, { x: centerX, y: centerY }, { x: edgeX, y: edgeY })) {
          return i;
        }
      } else if (action.type === 'addText') {
        let actualX = action.data.x;
        let actualY = action.data.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            actualX = attachedNode.x + action.data.x;
            actualY = attachedNode.y + action.data.y;
          }
        }

        const textScreen = graphToScreen(actualX, actualY);
        if (isPointInText(screenX, screenY, { ...action, screenX: textScreen.x, screenY: textScreen.y }, ctx)) {
          return i;
        }
      }
    }

    return -1;
  }, [
    overlayCanvasRef,
    fgRef,
    drawingHistory,
    nodes,
    screenToGraph,
    graphToScreen,
    isPointNearLine,
    isPointInRectangle,
    isPointInCircle,
    isPointInText,
    spatialIndex
  ]);

  return {
    graphToScreen,
    screenToGraph,
    findNearestNode,
    findAnnotationAtPoint,
    findResizeHandleAtPoint,
    getResizeHandles,
    calculateResizedDimensions,
    handleTextSave,
    handleTextCancel,
    isPointInRectangle,
    isPointInCircle,
    isPointNearLine,
    isPointInText
  };
}
