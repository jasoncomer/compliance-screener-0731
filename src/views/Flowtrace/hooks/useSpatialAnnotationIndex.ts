/**
 * useSpatialAnnotationIndex Hook
 * Maintains a spatial index of annotations for O(log n) hit testing
 * Updates automatically when annotations change
 */

import { useMemo, useCallback } from 'react';
import { SpatialIndex, SpatialItem, BoundingBox } from '../../../utils/spatialIndex';
import { FTNode } from '../components/NetworkGraph';
import { Point } from './useAnnotationManagement';

interface AnnotationBounds {
  index: number;
  type: 'line' | 'rectangle' | 'circle' | 'text';
  bounds: BoundingBox;
  data: any;
}

export interface SpatialAnnotationIndexHandlers {
  findAnnotationsAtPoint: (point: Point, tolerance?: number) => number[];
  findAnnotationsInRegion: (bounds: BoundingBox) => number[];
  getAnnotationBounds: (index: number) => BoundingBox | null;
}

/**
 * Calculate bounding box for an annotation
 */
function calculateAnnotationBounds(
  action: any,
  nodes: FTNode[],
  index: number
): AnnotationBounds | null {
  try {
    if (action.type === 'addLine') {
      let startX = action.data.line.start.x;
      let startY = action.data.line.start.y;
      let endX = action.data.line.end.x;
      let endY = action.data.line.end.y;

      // Handle node attachment
      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          startX = attachedNode.x + action.data.line.start.x;
          startY = attachedNode.y + action.data.line.start.y;
          endX = attachedNode.x + action.data.line.end.x;
          endY = attachedNode.y + action.data.line.end.y;
        }
      }

      const tolerance = 5; // pixels
      return {
        index,
        type: 'line',
        data: action.data,
        bounds: {
          minX: Math.min(startX, endX) - tolerance,
          minY: Math.min(startY, endY) - tolerance,
          maxX: Math.max(startX, endX) + tolerance,
          maxY: Math.max(startY, endY) + tolerance
        }
      };
    } else if (action.type === 'addRectangle') {
      let startX = action.data.shape.start.x;
      let startY = action.data.shape.start.y;
      let endX = action.data.shape.end.x;
      let endY = action.data.shape.end.y;

      // Handle node attachment
      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          startX = attachedNode.x + action.data.shape.start.x;
          startY = attachedNode.y + action.data.shape.start.y;
          endX = attachedNode.x + action.data.shape.end.x;
          endY = attachedNode.y + action.data.shape.end.y;
        }
      }

      const tolerance = 5;
      return {
        index,
        type: 'rectangle',
        data: action.data,
        bounds: {
          minX: Math.min(startX, endX) - tolerance,
          minY: Math.min(startY, endY) - tolerance,
          maxX: Math.max(startX, endX) + tolerance,
          maxY: Math.max(startY, endY) + tolerance
        }
      };
    } else if (action.type === 'addCircle') {
      let centerX = action.data.shape.start.x;
      let centerY = action.data.shape.start.y;
      let edgeX = action.data.shape.end.x;
      let edgeY = action.data.shape.end.y;

      // Handle node attachment
      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          centerX = attachedNode.x + action.data.shape.start.x;
          centerY = attachedNode.y + action.data.shape.start.y;
          edgeX = attachedNode.x + action.data.shape.end.x;
          edgeY = attachedNode.y + action.data.shape.end.y;
        }
      }

      const radius = Math.sqrt(Math.pow(edgeX - centerX, 2) + Math.pow(edgeY - centerY, 2));
      const tolerance = 5;
      return {
        index,
        type: 'circle',
        data: action.data,
        bounds: {
          minX: centerX - radius - tolerance,
          minY: centerY - radius - tolerance,
          maxX: centerX + radius + tolerance,
          maxY: centerY + radius + tolerance
        }
      };
    } else if (action.type === 'addText') {
      let actualX = action.data.x;
      let actualY = action.data.y;

      // Handle node attachment
      if (action.data.attachedNodeId) {
        const attachedNode = nodes.find(n => n.id === action.data.attachedNodeId);
        if (attachedNode) {
          actualX = attachedNode.x + action.data.x;
          actualY = attachedNode.y + action.data.y;
        }
      }

      // Estimate text bounds (conservative)
      const fontSizeMap: Record<string, number> = { small: 12, medium: 16, large: 24 };
      const fontSize = action.data.fontSize ? (fontSizeMap[action.data.fontSize] || 16) : 16;
      const lines = (action.data.text || '').split('\n');
      const estimatedWidth = Math.max(...lines.map((line: string) => line.length * fontSize * 0.6));
      const estimatedHeight = lines.length * fontSize * 1.2;
      const padding = 4;

      return {
        index,
        type: 'text',
        data: action.data,
        bounds: {
          minX: actualX - padding,
          minY: actualY - padding,
          maxX: actualX + estimatedWidth + padding,
          maxY: actualY + estimatedHeight + padding
        }
      };
    }
  } catch (error) {
    console.warn('Error calculating annotation bounds:', error);
  }

  return null;
}

/**
 * Hook that maintains a spatial index of annotations
 * Provides O(log n) hit testing instead of O(n) linear search
 */
export function useSpatialAnnotationIndex(
  drawingHistory: any[],
  nodes: FTNode[]
): SpatialAnnotationIndexHandlers {
  // Build spatial index when annotations or nodes change
  const spatialIndex = useMemo(() => {
    // Define world bounds (large enough to contain all annotations)
    const worldBounds = {
      minX: -10000,
      minY: -10000,
      maxX: 10000,
      maxY: 10000
    };

    const index = new SpatialIndex<AnnotationBounds>(worldBounds);

    // Calculate bounds for all annotations and insert into index
    const items: SpatialItem<AnnotationBounds>[] = [];

    drawingHistory.forEach((action, i) => {
      const bounds = calculateAnnotationBounds(action, nodes, i);
      if (bounds) {
        items.push({
          id: i, // Use index as unique ID
          bounds: bounds.bounds,
          data: bounds
        });
      }
    });

    // Bulk insert for better performance
    index.rebuild(items);

    return index;
  }, [drawingHistory, nodes]);

  // Find annotations at a specific point with optional tolerance
  const findAnnotationsAtPoint = useCallback((point: Point, tolerance: number = 5): number[] => {
    // Query spatial index with tolerance
    const queryBounds: BoundingBox = {
      minX: point.x - tolerance,
      minY: point.y - tolerance,
      maxX: point.x + tolerance,
      maxY: point.y + tolerance
    };

    const candidates = spatialIndex.query(queryBounds);

    // Return indices in reverse order (top to bottom, like the original)
    return candidates
      .map(item => item.data.index)
      .sort((a, b) => b - a); // Reverse order for z-index (last drawn is on top)
  }, [spatialIndex]);

  // Find annotations in a region
  const findAnnotationsInRegion = useCallback((bounds: BoundingBox): number[] => {
    const candidates = spatialIndex.query(bounds);
    return candidates
      .map(item => item.data.index)
      .sort((a, b) => b - a);
  }, [spatialIndex]);

  // Get bounding box for a specific annotation
  const getAnnotationBounds = useCallback((index: number): BoundingBox | null => {
    if (index < 0 || index >= drawingHistory.length) return null;
    const bounds = calculateAnnotationBounds(drawingHistory[index], nodes, index);
    return bounds ? bounds.bounds : null;
  }, [drawingHistory, nodes]);

  return {
    findAnnotationsAtPoint,
    findAnnotationsInRegion,
    getAnnotationBounds
  };
}
