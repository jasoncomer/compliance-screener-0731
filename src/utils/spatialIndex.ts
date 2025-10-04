/**
 * Spatial Index Utility
 * Quadtree-based spatial indexing for efficient annotation hit testing
 * Reduces hit testing complexity from O(n) to O(log n)
 */

import { Point } from './coordinateSystem';

/**
 * Bounding box interface
 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Item stored in the spatial index
 */
export interface SpatialItem<T = any> {
  id: string | number;
  bounds: BoundingBox;
  data: T;
}

/**
 * QuadTree node
 */
class QuadTreeNode<T> {
  bounds: BoundingBox;
  items: SpatialItem<T>[];
  children: QuadTreeNode<T>[] | null;
  maxItems: number;
  maxDepth: number;
  depth: number;

  constructor(bounds: BoundingBox, maxItems = 4, maxDepth = 8, depth = 0) {
    this.bounds = bounds;
    this.items = [];
    this.children = null;
    this.maxItems = maxItems;
    this.maxDepth = maxDepth;
    this.depth = depth;
  }

  /**
   * Check if bounds intersect
   */
  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return !(
      a.maxX < b.minX ||
      a.minX > b.maxX ||
      a.maxY < b.minY ||
      a.minY > b.maxY
    );
  }

  /**
   * Check if bounds contain a point
   */
  private containsPoint(bounds: BoundingBox, point: Point): boolean {
    return (
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.y >= bounds.minY &&
      point.y <= bounds.maxY
    );
  }

  /**
   * Split node into 4 quadrants
   */
  private split(): void {
    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.children = [
      // Top-left
      new QuadTreeNode(
        { minX, minY, maxX: midX, maxY: midY },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
      // Top-right
      new QuadTreeNode(
        { minX: midX, minY, maxX, maxY: midY },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
      // Bottom-left
      new QuadTreeNode(
        { minX, minY: midY, maxX: midX, maxY },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      ),
      // Bottom-right
      new QuadTreeNode(
        { minX: midX, minY: midY, maxX, maxY },
        this.maxItems,
        this.maxDepth,
        this.depth + 1
      )
    ];

    // Redistribute items to children
    const itemsToRedistribute = this.items;
    this.items = [];

    itemsToRedistribute.forEach(item => {
      this.insertToChildren(item);
    });
  }

  /**
   * Insert item into appropriate child node
   */
  private insertToChildren(item: SpatialItem<T>): void {
    if (!this.children) return;

    for (const child of this.children) {
      if (this.intersects(child.bounds, item.bounds)) {
        child.insert(item);
      }
    }
  }

  /**
   * Insert an item into the quadtree
   */
  insert(item: SpatialItem<T>): void {
    // If we have children, insert into them
    if (this.children) {
      this.insertToChildren(item);
      return;
    }

    // Add item to this node
    this.items.push(item);

    // Split if we exceeded capacity and haven't reached max depth
    if (this.items.length > this.maxItems && this.depth < this.maxDepth) {
      this.split();
    }
  }

  /**
   * Query items that intersect with given bounds
   */
  query(bounds: BoundingBox, results: SpatialItem<T>[] = []): SpatialItem<T>[] {
    // Check if query bounds intersect this node
    if (!this.intersects(this.bounds, bounds)) {
      return results;
    }

    // Add items from this node
    this.items.forEach(item => {
      if (this.intersects(item.bounds, bounds)) {
        results.push(item);
      }
    });

    // Query children
    if (this.children) {
      this.children.forEach(child => {
        child.query(bounds, results);
      });
    }

    return results;
  }

  /**
   * Query items at a specific point
   */
  queryPoint(point: Point, results: SpatialItem<T>[] = []): SpatialItem<T>[] {
    // Check if point is in this node's bounds
    if (!this.containsPoint(this.bounds, point)) {
      return results;
    }

    // Check items in this node
    this.items.forEach(item => {
      if (this.containsPoint(item.bounds, point)) {
        results.push(item);
      }
    });

    // Query children
    if (this.children) {
      this.children.forEach(child => {
        child.queryPoint(point, results);
      });
    }

    return results;
  }

  /**
   * Clear all items from the tree
   */
  clear(): void {
    this.items = [];
    this.children = null;
  }
}

/**
 * SpatialIndex class for managing annotation spatial queries
 */
export class SpatialIndex<T = any> {
  private tree: QuadTreeNode<T>;

  constructor(worldBounds: BoundingBox, maxItems = 4, maxDepth = 8) {
    this.tree = new QuadTreeNode(worldBounds, maxItems, maxDepth);
  }

  /**
   * Insert an item into the index
   */
  insert(item: SpatialItem<T>): void {
    this.tree.insert(item);
  }

  /**
   * Insert multiple items
   */
  insertMany(items: SpatialItem<T>[]): void {
    items.forEach(item => this.insert(item));
  }

  /**
   * Query items within bounds
   */
  query(bounds: BoundingBox): SpatialItem<T>[] {
    return this.tree.query(bounds);
  }

  /**
   * Query items at a specific point with optional radius
   */
  queryPoint(point: Point, radius = 0): SpatialItem<T>[] {
    if (radius === 0) {
      return this.tree.queryPoint(point);
    }

    // Query with bounding box around point
    const bounds: BoundingBox = {
      minX: point.x - radius,
      minY: point.y - radius,
      maxX: point.x + radius,
      maxY: point.y + radius
    };

    return this.tree.query(bounds);
  }

  /**
   * Clear the index
   */
  clear(): void {
    this.tree.clear();
  }

  /**
   * Rebuild the index with new items
   */
  rebuild(items: SpatialItem<T>[]): void {
    this.clear();
    this.insertMany(items);
  }

  /**
   * Update world bounds and rebuild tree
   */
  updateBounds(newBounds: BoundingBox, items: SpatialItem<T>[] = []): void {
    this.tree = new QuadTreeNode(newBounds, this.tree.maxItems, this.tree.maxDepth);
    if (items.length > 0) {
      this.insertMany(items);
    }
  }
}

/**
 * Helper function to create bounding box from points
 */
export function createBounds(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  return { minX, minY, maxX, maxY };
}

/**
 * Helper function to create bounding box with padding
 */
export function createBoundsWithPadding(
  points: Point[],
  padding: number
): BoundingBox {
  const bounds = createBounds(points);
  return {
    minX: bounds.minX - padding,
    minY: bounds.minY - padding,
    maxX: bounds.maxX + padding,
    maxY: bounds.maxY + padding
  };
}

/**
 * Helper to create bounding box for a line with tolerance
 */
export function createLineBounds(
  start: Point,
  end: Point,
  tolerance = 5
): BoundingBox {
  return {
    minX: Math.min(start.x, end.x) - tolerance,
    minY: Math.min(start.y, end.y) - tolerance,
    maxX: Math.max(start.x, end.x) + tolerance,
    maxY: Math.max(start.y, end.y) + tolerance
  };
}

/**
 * Helper to create bounding box for a circle
 */
export function createCircleBounds(center: Point, radius: number): BoundingBox {
  return {
    minX: center.x - radius,
    minY: center.y - radius,
    maxX: center.x + radius,
    maxY: center.y + radius
  };
}
