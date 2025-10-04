/**
 * AnnotationOverlay - Canvas overlay rendering for drawing annotations
 * This component handles ONLY the rendering logic for annotations.
 * Event handlers remain in the parent NetworkGraphV2 component.
 */

import { useEffect } from 'react';
import { ForceGraphMethods } from 'react-force-graph-2d';

import { FTNode } from '../NetworkGraph';
import { Point, Shape, ResizeHandle } from '../../hooks/useAnnotationManagement';
import { ResizingAnnotation, ResizeHandleType } from '../../hooks/useDrawingState';

export interface DrawingAction {
  type: 'addLine' | 'addRectangle' | 'addCircle' | 'addText';
  data: {
    id?: string;
    line?: { start: Point; end: Point };
    shape?: Shape;
    x?: number;
    y?: number;
    text?: string;
    color: string;
    lineWidth?: number;
    fontSize?: string;
    bold?: boolean;
    italic?: boolean;
    backgroundColor?: string;
    attachedNodeId?: string;
  };
}

export interface AnnotationRenderProps {
  fgRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>;
  overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
  nodes: FTNode[];
  drawingHistory: DrawingAction[];
  selectedAnnotationIndex: number | null;
  draggingAnnotation: {
    index: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null;
  resizingAnnotation: ResizingAnnotation | null;
  drawingLine: { start: Point; end: Point } | null;
  drawingShape: { start: Point; end: Point } | null;
  activeTool?: 'select' | 'draw' | 'rectangle' | 'circle' | 'text';
  activeColor: string;
  selectionBox: { start: Point; end: Point } | null;
  graphToScreen: (x: number, y: number) => Point;
  graphTransform: { zoom: number; centerX: number; centerY: number };
  resizeHandles?: ResizeHandle[];
  hoveredHandle?: ResizeHandleType | null;
}

/**
 * Draw an arrowhead at the end of a line
 */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  arrowLength: number = 10
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle - Math.PI / 6),
    toY - arrowLength * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - arrowLength * Math.cos(angle + Math.PI / 6),
    toY - arrowLength * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

/**
 * Hook that handles annotation rendering on canvas
 * Extracted from NetworkGraphV2's large useEffect
 */
export function useAnnotationRendering(props: AnnotationRenderProps) {
  const {
    fgRef,
    overlayCanvasRef,
    nodes,
    drawingHistory,
    selectedAnnotationIndex,
    draggingAnnotation,
    resizingAnnotation,
    drawingLine,
    drawingShape,
    activeTool,
    activeColor,
    selectionBox,
    graphToScreen,
    graphTransform,
    resizeHandles = [],
    hoveredHandle = null
  } = props;

  useEffect(() => {
    if (!overlayCanvasRef.current || !fgRef.current) return;

    const ctx = overlayCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height);

    const zoom = fgRef.current.zoom();

    // Draw saved drawing elements (now in graph coordinates)
    drawingHistory.forEach((action) => {
      if (action.type === 'addLine') {
        // Calculate actual positions (handle node attachment)
        let startX = action.data.line!.start.x;
        let startY = action.data.line!.start.y;
        let endX = action.data.line!.end.x;
        let endY = action.data.line!.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + action.data.line!.start.x;
            startY = attachedNode.y + action.data.line!.start.y;
            endX = attachedNode.x + action.data.line!.end.x;
            endY = attachedNode.y + action.data.line!.end.y;
          }
        }

        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.strokeStyle = action.data.color;
        ctx.fillStyle = action.data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();

        // Draw arrowhead at the end
        drawArrowhead(ctx, startScreen.x, startScreen.y, endScreen.x, endScreen.y);
      } else if (action.type === 'addRectangle') {
        // Calculate actual positions (handle node attachment)
        let startX = action.data.shape!.start.x;
        let startY = action.data.shape!.start.y;
        let endX = action.data.shape!.end.x;
        let endY = action.data.shape!.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + action.data.shape!.start.x;
            startY = attachedNode.y + action.data.shape!.start.y;
            endX = attachedNode.x + action.data.shape!.end.x;
            endY = attachedNode.y + action.data.shape!.end.y;
          }
        }

        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.strokeStyle = action.data.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          startScreen.x,
          startScreen.y,
          endScreen.x - startScreen.x,
          endScreen.y - startScreen.y
        );
      } else if (action.type === 'addCircle') {
        // Calculate actual positions (handle node attachment)
        let centerX = action.data.shape!.start.x;
        let centerY = action.data.shape!.start.y;
        let edgeX = action.data.shape!.end.x;
        let edgeY = action.data.shape!.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            centerX = attachedNode.x + action.data.shape!.start.x;
            centerY = attachedNode.y + action.data.shape!.start.y;
            edgeX = attachedNode.x + action.data.shape!.end.x;
            edgeY = attachedNode.y + action.data.shape!.end.y;
          }
        }

        const centerScreen = graphToScreen(centerX, centerY);
        const edgeScreen = graphToScreen(edgeX, edgeY);
        const radius = Math.sqrt(
          Math.pow(edgeScreen.x - centerScreen.x, 2) +
          Math.pow(edgeScreen.y - centerScreen.y, 2)
        );

        ctx.strokeStyle = action.data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (action.type === 'addText') {
        // Calculate actual position (handle node attachment)
        let actualX = action.data.x!;
        let actualY = action.data.y!;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            // Position relative to attached node
            actualX = attachedNode.x + action.data.x!;
            actualY = attachedNode.y + action.data.y!;
          }
        }

        const textScreen = graphToScreen(actualX, actualY);

        // Support new text annotation properties
        const fontSizeMap: Record<string, number> = { small: 12, medium: 16, large: 24 };
        const baseFontSize = action.data.fontSize ? (fontSizeMap[action.data.fontSize] || 16) : 16;
        const fontSize = Math.max(12, baseFontSize * zoom);
        const bold = action.data.bold ? 'bold ' : '';
        const italic = action.data.italic ? 'italic ' : '';

        ctx.font = `${bold}${italic}${fontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Handle background color
        if (action.data.backgroundColor) {
          // Measure text for background
          const lines = action.data.text!.split('\n');
          const lineHeight = fontSize * 1.2;
          const maxWidth = Math.max(...lines.map((line: string) => ctx.measureText(line).width));
          const padding = 4;

          ctx.fillStyle = action.data.backgroundColor;
          ctx.fillRect(
            textScreen.x - padding,
            textScreen.y - padding,
            maxWidth + padding * 2,
            lines.length * lineHeight + padding * 2
          );
        }

        // Draw text (support multi-line)
        ctx.fillStyle = action.data.color;
        const lines = action.data.text!.split('\n');
        const lineHeight = fontSize * 1.2;
        lines.forEach((line: string, index: number) => {
          ctx.fillText(line, textScreen.x, textScreen.y + index * lineHeight);
        });
      }
    });

    // Draw selection highlight for selected annotation
    if (selectedAnnotationIndex !== null && selectedAnnotationIndex >= 0 && selectedAnnotationIndex < drawingHistory.length) {
      const selectedAction = drawingHistory[selectedAnnotationIndex];

      ctx.save();
      ctx.strokeStyle = '#3b82f6'; // Blue selection color
      ctx.lineWidth = 2;
      ctx.setLineDash([]); // Solid line

      if (selectedAction.type === 'addLine') {
        let startX = selectedAction.data.line!.start.x;
        let startY = selectedAction.data.line!.start.y;
        let endX = selectedAction.data.line!.end.x;
        let endY = selectedAction.data.line!.end.y;

        if (selectedAction.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === selectedAction.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + selectedAction.data.line!.start.x;
            startY = attachedNode.y + selectedAction.data.line!.start.y;
            endX = attachedNode.x + selectedAction.data.line!.end.x;
            endY = attachedNode.y + selectedAction.data.line!.end.y;
          }
        }

        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();

        // Draw arrowhead in selection color
        drawArrowhead(ctx, startScreen.x, startScreen.y, endScreen.x, endScreen.y);
      } else if (selectedAction.type === 'addRectangle') {
        let startX = selectedAction.data.shape!.start.x;
        let startY = selectedAction.data.shape!.start.y;
        let endX = selectedAction.data.shape!.end.x;
        let endY = selectedAction.data.shape!.end.y;

        if (selectedAction.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === selectedAction.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + selectedAction.data.shape!.start.x;
            startY = attachedNode.y + selectedAction.data.shape!.start.y;
            endX = attachedNode.x + selectedAction.data.shape!.end.x;
            endY = attachedNode.y + selectedAction.data.shape!.end.y;
          }
        }

        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.strokeRect(
          startScreen.x,
          startScreen.y,
          endScreen.x - startScreen.x,
          endScreen.y - startScreen.y
        );
      } else if (selectedAction.type === 'addCircle') {
        let centerX = selectedAction.data.shape!.start.x;
        let centerY = selectedAction.data.shape!.start.y;
        let edgeX = selectedAction.data.shape!.end.x;
        let edgeY = selectedAction.data.shape!.end.y;

        if (selectedAction.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === selectedAction.data.attachedNodeId);
          if (attachedNode) {
            centerX = attachedNode.x + selectedAction.data.shape!.start.x;
            centerY = attachedNode.y + selectedAction.data.shape!.start.y;
            edgeX = attachedNode.x + selectedAction.data.shape!.end.x;
            edgeY = attachedNode.y + selectedAction.data.shape!.end.y;
          }
        }

        const centerScreen = graphToScreen(centerX, centerY);
        const edgeScreen = graphToScreen(edgeX, edgeY);
        const radius = Math.sqrt(
          Math.pow(edgeScreen.x - centerScreen.x, 2) +
          Math.pow(edgeScreen.y - centerScreen.y, 2)
        );

        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (selectedAction.type === 'addText') {
        let actualX = selectedAction.data.x!;
        let actualY = selectedAction.data.y!;

        if (selectedAction.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === selectedAction.data.attachedNodeId);
          if (attachedNode) {
            actualX = attachedNode.x + selectedAction.data.x!;
            actualY = attachedNode.y + selectedAction.data.y!;
          }
        }

        const textScreen = graphToScreen(actualX, actualY);
        const fontSizeMap: Record<string, number> = { small: 12, medium: 16, large: 24 };
        const baseFontSize = selectedAction.data.fontSize ? (fontSizeMap[selectedAction.data.fontSize] || 16) : 16;
        const fontSize = Math.max(12, baseFontSize * zoom);
        const bold = selectedAction.data.bold ? 'bold ' : '';
        const italic = selectedAction.data.italic ? 'italic ' : '';

        ctx.font = `${bold}${italic}${fontSize}px sans-serif`;
        const lines = selectedAction.data.text!.split('\n');
        const lineHeight = fontSize * 1.2;
        const maxWidth = Math.max(...lines.map((line: string) => ctx.measureText(line).width));
        const padding = 4;

        ctx.strokeRect(
          textScreen.x - padding,
          textScreen.y - padding,
          maxWidth + padding * 2,
          lines.length * lineHeight + padding * 2
        );
      }

      ctx.restore();
    }

    // Draw resize handles for selected annotation (only when not dragging/resizing)
    if (selectedAnnotationIndex !== null && selectedAnnotationIndex >= 0 &&
        !draggingAnnotation && !resizingAnnotation && resizeHandles.length > 0) {
      ctx.save();

      resizeHandles.forEach(handle => {
        const screenPos = graphToScreen(handle.x, handle.y);
        const isHovered = hoveredHandle === handle.type;
        const handleRadius = isHovered ? 5 : 4;

        // Draw handle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, handleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      ctx.restore();
    }

    // Draw resizing preview - show annotation with updated dimensions
    if (resizingAnnotation && resizingAnnotation.index < drawingHistory.length) {
      const action = drawingHistory[resizingAnnotation.index];

      ctx.save();
      ctx.strokeStyle = action.data.color || activeColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line for preview

      if (action.type === 'addLine') {
        // Preview resized line
        const newData = {
          line: action.data.line,
          ...resizingAnnotation.originalData
        };

        // Calculate new line based on handle type
        let startX = newData.line.start.x;
        let startY = newData.line.start.y;
        let endX = newData.line.end.x;
        let endY = newData.line.end.y;

        if (resizingAnnotation.handleType === 'endpoint-start') {
          startX = resizingAnnotation.currentX;
          startY = resizingAnnotation.currentY;
        } else if (resizingAnnotation.handleType === 'endpoint-end') {
          endX = resizingAnnotation.currentX;
          endY = resizingAnnotation.currentY;
        }

        // Handle node attachment
        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + (resizingAnnotation.handleType === 'endpoint-start' ? resizingAnnotation.currentX : newData.line.start.x);
            startY = attachedNode.y + (resizingAnnotation.handleType === 'endpoint-start' ? resizingAnnotation.currentY : newData.line.start.y);
            endX = attachedNode.x + (resizingAnnotation.handleType === 'endpoint-end' ? resizingAnnotation.currentX : newData.line.end.x);
            endY = attachedNode.y + (resizingAnnotation.handleType === 'endpoint-end' ? resizingAnnotation.currentY : newData.line.end.y);
          }
        }

        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.fillStyle = action.data.color || activeColor;
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();

        // Draw arrowhead
        drawArrowhead(ctx, startScreen.x, startScreen.y, endScreen.x, endScreen.y);
      } else if (action.type === 'addRectangle' && action.data.shape) {
        // Preview resized rectangle
        let startX = resizingAnnotation.originalData.shape.start.x;
        let startY = resizingAnnotation.originalData.shape.start.y;
        let endX = resizingAnnotation.originalData.shape.end.x;
        let endY = resizingAnnotation.originalData.shape.end.y;

        // Adjust based on handle type
        if (resizingAnnotation.handleType.startsWith('corner-')) {
          if (resizingAnnotation.handleType === 'corner-nw') {
            startX = resizingAnnotation.currentX;
            startY = resizingAnnotation.currentY;
          } else if (resizingAnnotation.handleType === 'corner-ne') {
            endX = resizingAnnotation.currentX;
            startY = resizingAnnotation.currentY;
          } else if (resizingAnnotation.handleType === 'corner-se') {
            endX = resizingAnnotation.currentX;
            endY = resizingAnnotation.currentY;
          } else if (resizingAnnotation.handleType === 'corner-sw') {
            startX = resizingAnnotation.currentX;
            endY = resizingAnnotation.currentY;
          }
        } else if (resizingAnnotation.handleType.startsWith('edge-')) {
          if (resizingAnnotation.handleType === 'edge-n') {
            startY = resizingAnnotation.currentY;
          } else if (resizingAnnotation.handleType === 'edge-s') {
            endY = resizingAnnotation.currentY;
          } else if (resizingAnnotation.handleType === 'edge-e') {
            endX = resizingAnnotation.currentX;
          } else if (resizingAnnotation.handleType === 'edge-w') {
            startX = resizingAnnotation.currentX;
          }
        }

        // Handle node attachment
        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + startX;
            startY = attachedNode.y + startY;
            endX = attachedNode.x + endX;
            endY = attachedNode.y + endY;
          }
        }

        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.strokeRect(
          startScreen.x,
          startScreen.y,
          endScreen.x - startScreen.x,
          endScreen.y - startScreen.y
        );
      } else if (action.type === 'addCircle' && action.data.shape) {
        // Preview resized circle
        const centerX = resizingAnnotation.originalData.shape.start.x;
        const centerY = resizingAnnotation.originalData.shape.start.y;
        const mouseX = resizingAnnotation.currentX;  // Already absolute graph coordinates
        const mouseY = resizingAnnotation.currentY;  // Already absolute graph coordinates

        // Handle node attachment ONLY for center (which is stored as relative)
        let actualCenterX = centerX;
        let actualCenterY = centerY;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            // Convert relative center to absolute
            actualCenterX = attachedNode.x + centerX;
            actualCenterY = attachedNode.y + centerY;
            // DON'T modify mouseX/mouseY - they're already absolute graph coordinates!
          }
        }

        // Convert to screen coordinates first, then calculate radius in screen space
        const centerScreen = graphToScreen(actualCenterX, actualCenterY);
        const mouseScreen = graphToScreen(mouseX, mouseY);  // Use original absolute coordinates
        const radius = Math.sqrt(
          Math.pow(mouseScreen.x - centerScreen.x, 2) +
          Math.pow(mouseScreen.y - centerScreen.y, 2)
        );

        ctx.beginPath();
        ctx.arc(centerScreen.x, centerScreen.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Draw current drawing element (preview - still in screen coords, will convert on save)
    if (drawingLine) {
      ctx.strokeStyle = activeColor;
      ctx.fillStyle = activeColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(drawingLine.start.x, drawingLine.start.y);
      ctx.lineTo(drawingLine.end.x, drawingLine.end.y);
      ctx.stroke();

      // Draw arrowhead preview
      drawArrowhead(ctx, drawingLine.start.x, drawingLine.start.y, drawingLine.end.x, drawingLine.end.y);
    }

    if (drawingShape) {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2;
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

    // Draw dragging preview - show full annotation while dragging
    if (draggingAnnotation && draggingAnnotation.index < drawingHistory.length) {
      const action = drawingHistory[draggingAnnotation.index];
      const offsetX = draggingAnnotation.offsetX;
      const offsetY = draggingAnnotation.offsetY;

      ctx.save();
      ctx.strokeStyle = action.data.color || activeColor;
      ctx.lineWidth = 2;

      if (action.type === 'addText') {
        const fontSizeMap: Record<string, number> = { small: 12, medium: 16, large: 24 };
        const baseFontSize = action.data.fontSize ? (fontSizeMap[action.data.fontSize] || 16) : 16;
        const currentZoom = fgRef.current?.zoom() || 1;
        const fontSize = Math.max(12, baseFontSize * currentZoom);
        const bold = action.data.bold ? 'bold ' : '';
        const italic = action.data.italic ? 'italic ' : '';

        ctx.font = `${bold}${italic}${fontSize}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Draw background if exists
        if (action.data.backgroundColor) {
          const lines = action.data.text!.split('\n');
          const lineHeight = fontSize * 1.2;
          const maxWidth = Math.max(...lines.map((line: string) => ctx.measureText(line).width));
          const padding = 4;

          ctx.fillStyle = action.data.backgroundColor;
          ctx.fillRect(
            draggingAnnotation.startX + offsetX - padding,
            draggingAnnotation.startY + offsetY - padding,
            maxWidth + padding * 2,
            lines.length * lineHeight + padding * 2
          );
        }

        // Draw text
        ctx.fillStyle = action.data.color;
        const lines = action.data.text!.split('\n');
        const lineHeight = fontSize * 1.2;

        lines.forEach((line: string, index: number) => {
          ctx.fillText(
            line,
            draggingAnnotation.startX + offsetX,
            draggingAnnotation.startY + offsetY + index * lineHeight
          );
        });
      } else if (action.type === 'addLine') {
        // Calculate actual line positions (handle node attachment)
        let startX = action.data.line!.start.x;
        let startY = action.data.line!.start.y;
        let endX = action.data.line!.end.x;
        let endY = action.data.line!.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + action.data.line!.start.x;
            startY = attachedNode.y + action.data.line!.start.y;
            endX = attachedNode.x + action.data.line!.end.x;
            endY = attachedNode.y + action.data.line!.end.y;
          }
        }

        // Convert to screen coordinates and apply offset
        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.fillStyle = action.data.color || activeColor;
        ctx.beginPath();
        ctx.moveTo(startScreen.x + offsetX, startScreen.y + offsetY);
        ctx.lineTo(endScreen.x + offsetX, endScreen.y + offsetY);
        ctx.stroke();

        // Draw arrowhead with offset
        drawArrowhead(
          ctx,
          startScreen.x + offsetX,
          startScreen.y + offsetY,
          endScreen.x + offsetX,
          endScreen.y + offsetY
        );
      } else if (action.type === 'addRectangle') {
        // Calculate actual rectangle positions (handle node attachment)
        let startX = action.data.shape!.start.x;
        let startY = action.data.shape!.start.y;
        let endX = action.data.shape!.end.x;
        let endY = action.data.shape!.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            startX = attachedNode.x + action.data.shape!.start.x;
            startY = attachedNode.y + action.data.shape!.start.y;
            endX = attachedNode.x + action.data.shape!.end.x;
            endY = attachedNode.y + action.data.shape!.end.y;
          }
        }

        // Convert to screen coordinates and apply offset
        const startScreen = graphToScreen(startX, startY);
        const endScreen = graphToScreen(endX, endY);

        ctx.strokeRect(
          startScreen.x + offsetX,
          startScreen.y + offsetY,
          endScreen.x - startScreen.x,
          endScreen.y - startScreen.y
        );
      } else if (action.type === 'addCircle') {
        // Calculate actual circle positions (handle node attachment)
        let centerX = action.data.shape!.start.x;
        let centerY = action.data.shape!.start.y;
        let edgeX = action.data.shape!.end.x;
        let edgeY = action.data.shape!.end.y;

        if (action.data.attachedNodeId) {
          const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
          if (attachedNode) {
            centerX = attachedNode.x + action.data.shape!.start.x;
            centerY = attachedNode.y + action.data.shape!.start.y;
            edgeX = attachedNode.x + action.data.shape!.end.x;
            edgeY = attachedNode.y + action.data.shape!.end.y;
          }
        }

        // Convert to screen coordinates and calculate radius
        const centerScreen = graphToScreen(centerX, centerY);
        const edgeScreen = graphToScreen(edgeX, edgeY);
        const radius = Math.sqrt(
          Math.pow(edgeScreen.x - centerScreen.x, 2) +
          Math.pow(edgeScreen.y - centerScreen.y, 2)
        );

        ctx.beginPath();
        ctx.arc(
          centerScreen.x + offsetX,
          centerScreen.y + offsetY,
          radius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw selection box
    if (selectionBox) {
      ctx.strokeStyle = '#3b82f6'; // Blue
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'; // Light blue with transparency
      ctx.lineWidth = 2;
      const { start, end } = selectionBox;
      const width = end.x - start.x;
      const height = end.y - start.y;
      ctx.fillRect(start.x, start.y, width, height);
      ctx.strokeRect(start.x, start.y, width, height);
    }
  }, [
    drawingHistory,
    drawingLine,
    drawingShape,
    activeColor,
    activeTool,
    selectionBox,
    graphToScreen,
    selectedAnnotationIndex,
    nodes,
    draggingAnnotation,
    resizingAnnotation,
    resizeHandles,
    hoveredHandle,
    fgRef,
    overlayCanvasRef,
    graphTransform // Triggers re-render when graph pans/zooms
  ]);
}
