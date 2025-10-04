/**
 * Coordinate System Utility
 * Centralizes graph <-> screen coordinate transformations for NetworkGraphV2
 */

import { ForceGraphMethods } from 'react-force-graph-2d';

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Shape with start and end points
 */
export interface Shape {
  start: Point;
  end: Point;
}

/**
 * Line segment
 */
export interface Line {
  start: Point;
  end: Point;
}

/**
 * CoordinateSystem class for managing graph and screen coordinate transformations
 */
export class CoordinateSystem {
  private graphRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>;

  constructor(graphRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>) {
    this.graphRef = graphRef;
  }

  /**
   * Convert screen coordinates to graph coordinates
   */
  toGraph(screenX: number, screenY: number): Point {
    if (!this.graphRef.current) {
      return { x: screenX, y: screenY };
    }
    return this.graphRef.current.screen2GraphCoords(screenX, screenY);
  }

  /**
   * Convert graph coordinates to screen coordinates
   */
  toScreen(graphX: number, graphY: number): Point {
    if (!this.graphRef.current) {
      return { x: graphX, y: graphY };
    }
    return this.graphRef.current.graph2ScreenCoords(graphX, graphY);
  }

  /**
   * Convert multiple screen points to graph coordinates
   */
  pointsToGraph(screenPoints: Point[]): Point[] {
    return screenPoints.map(p => this.toGraph(p.x, p.y));
  }

  /**
   * Convert multiple graph points to screen coordinates
   */
  pointsToScreen(graphPoints: Point[]): Point[] {
    return graphPoints.map(p => this.toScreen(p.x, p.y));
  }

  /**
   * Convert a shape from screen to graph coordinates
   */
  shapeToGraph(screenShape: Shape): Shape {
    const start = this.toGraph(screenShape.start.x, screenShape.start.y);
    const end = this.toGraph(screenShape.end.x, screenShape.end.y);
    return { start, end };
  }

  /**
   * Convert a shape from graph to screen coordinates
   */
  shapeToScreen(graphShape: Shape): Shape {
    const start = this.toScreen(graphShape.start.x, graphShape.start.y);
    const end = this.toScreen(graphShape.end.x, graphShape.end.y);
    return { start, end };
  }

  /**
   * Convert a line from screen to graph coordinates
   */
  lineToGraph(screenLine: Line): Line {
    const start = this.toGraph(screenLine.start.x, screenLine.start.y);
    const end = this.toGraph(screenLine.end.x, screenLine.end.y);
    return { start, end };
  }

  /**
   * Convert a line from graph to screen coordinates
   */
  lineToScreen(graphLine: Line): Line {
    const start = this.toScreen(graphLine.start.x, graphLine.start.y);
    const end = this.toScreen(graphLine.end.x, graphLine.end.y);
    return { start, end };
  }

  /**
   * Calculate offset between two points (useful for drag operations)
   */
  calculateOffset(startPoint: Point, endPoint: Point): Point {
    return {
      x: endPoint.x - startPoint.x,
      y: endPoint.y - startPoint.y
    };
  }

  /**
   * Apply offset to a point
   */
  applyOffset(point: Point, offset: Point): Point {
    return {
      x: point.x + offset.x,
      y: point.y + offset.y
    };
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    if (!this.graphRef.current) {
      return 1;
    }
    return this.graphRef.current.zoom();
  }

  /**
   * Get current center position
   */
  getCenter(): Point {
    if (!this.graphRef.current) {
      return { x: 0, y: 0 };
    }
    const center = this.graphRef.current.centerAt();
    return { x: center.x || 0, y: center.y || 0 };
  }

  /**
   * Get current transformation state
   */
  getTransform(): { zoom: number; center: Point } {
    return {
      zoom: this.getZoom(),
      center: this.getCenter()
    };
  }

  /**
   * Calculate distance between two points
   */
  distance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate midpoint between two points
   */
  midpoint(p1: Point, p2: Point): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  /**
   * Check if a point is within a bounding box
   */
  isPointInBounds(point: Point, bounds: { min: Point; max: Point }): boolean {
    return (
      point.x >= bounds.min.x &&
      point.x <= bounds.max.x &&
      point.y >= bounds.min.y &&
      point.y <= bounds.max.y
    );
  }

  /**
   * Calculate bounding box from a shape
   */
  getBounds(shape: Shape): { min: Point; max: Point } {
    return {
      min: {
        x: Math.min(shape.start.x, shape.end.x),
        y: Math.min(shape.start.y, shape.end.y)
      },
      max: {
        x: Math.max(shape.start.x, shape.end.x),
        y: Math.max(shape.start.y, shape.end.y)
      }
    };
  }
}

/**
 * Hook to create and use a coordinate system
 */
export const useCoordinateSystem = (
  graphRef: React.MutableRefObject<ForceGraphMethods<any, any> | undefined>
): CoordinateSystem => {
  return new CoordinateSystem(graphRef);
};
