/**
 * NodeRenderer - Canvas-based node rendering for NetworkGraphV2
 * Handles drawing of nodes with logos, labels, and risk indicators
 */

import { logoService } from '../../../../services/logoService';
import { FTNode } from '../NetworkGraph';

/**
 * LRU Cache implementation for images
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Node rendering configuration
 */
export interface NodeRenderConfig {
  radius: number;
  theme: 'light' | 'dark';
  selectedNodes: Set<string>;
  hoveredNode: string | null;
  imageCache: LRUCache<string, HTMLImageElement>;
  loadImage: (url: string) => Promise<HTMLImageElement | null>;
}

/**
 * Load and cache logo images using the logo service
 */
export async function loadNodeImage(
  url: string,
  cache: LRUCache<string, HTMLImageElement>,
  mountedRef: React.MutableRefObject<boolean>
): Promise<HTMLImageElement | null> {
  // Check local cache first
  const cached = cache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  // Use logo service to load image
  const img = await logoService.loadImage(url);
  if (img && mountedRef.current) {
    cache.set(url, img);
  }
  return img;
}

/**
 * Draw a node on the canvas
 */
export function drawNode(
  node: FTNode & { fx?: number; fy?: number; val?: number },
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  config: NodeRenderConfig
): void {
  const { radius, theme, selectedNodes, hoveredNode, imageCache } = config;
  const isDark = theme === 'dark';
  const isHovered = node.id === hoveredNode;
  const isSelected = selectedNodes.has(node.id);

  // Use consistent radius (no scaling on hover)
  const effectiveRadius = radius;

  // Draw node background circle with hover effect
  ctx.beginPath();
  ctx.arc(node.x, node.y, effectiveRadius, 0, Math.PI * 2);
  ctx.fillStyle = isHovered ? '#e5e7eb' : '#f3f4f6';
  ctx.fill();
  ctx.strokeStyle = isSelected ? '#f97316' : (isHovered ? '#9ca3af' : '#d1d5db');
  ctx.lineWidth = (isHovered ? 2.5 : 2) / globalScale;
  ctx.stroke();

  // Draw subtle glow on hover
  if (isHovered) {
    ctx.beginPath();
    ctx.arc(node.x, node.y, effectiveRadius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
    ctx.lineWidth = 3 / globalScale;
    ctx.stroke();
  }

  // Draw logo or fallback
  const logoUrl = logoService.getLogoUrl(node.entityId, node.logoUrl);
  if (logoUrl) {
    const img = imageCache.get(logoUrl);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, effectiveRadius - 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, node.x - effectiveRadius, node.y - effectiveRadius, effectiveRadius * 2, effectiveRadius * 2);
      ctx.restore();
    } else {
      // Draw fallback while loading or if load failed
      drawFallbackText(node, ctx, globalScale, effectiveRadius, isDark);
    }
  } else {
    // No logo - draw fallback
    drawFallbackText(node, ctx, globalScale, effectiveRadius, isDark);
  }

  // Draw risk ring if available
  if (typeof node.risk === 'number') {
    drawRiskRing(node, ctx, globalScale, effectiveRadius);
  }

  // Draw labels
  drawNodeLabels(node, ctx, globalScale, effectiveRadius, isDark);

  // Draw add (+) button
  drawAddButton(node, ctx, globalScale, effectiveRadius);

  // Draw delete (X) button
  drawDeleteButton(node, ctx, globalScale, effectiveRadius);
}

/**
 * Draw fallback text when logo is not available
 */
function drawFallbackText(
  node: FTNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  _radius: number,
  isDark: boolean
): void {
  const displayText = (node.label && node.label !== node.id) ? node.label.charAt(0).toUpperCase() :
                     node.entityId ? node.entityId.charAt(0).toUpperCase() :
                     node.entityType ? node.entityType.charAt(0).toUpperCase() : '?';
  ctx.fillStyle = isDark ? '#f9fafb' : '#374151';
  ctx.font = `bold ${14 / globalScale}px Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayText, node.x, node.y);
}

/**
 * Draw risk indicator ring
 */
function drawRiskRing(
  node: FTNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  radius: number
): void {
  const risk = Math.max(0, Math.min(100, node.risk!));
  const endAngle = (risk / 100) * Math.PI * 2;
  ctx.beginPath();
  ctx.strokeStyle = risk > 70 ? '#ef4444' : risk > 40 ? '#f59e0b' : '#10b981';
  ctx.lineWidth = 3 / globalScale;
  ctx.arc(node.x, node.y, radius + 4, -Math.PI / 2, -Math.PI / 2 + endAngle);
  ctx.stroke();
}

/**
 * Draw node labels (name, address, risk)
 */
function drawNodeLabels(
  node: FTNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  radius: number,
  isDark: boolean
): void {
  let yOffset = radius + 14;

  // Entity name
  const displayName = node.label && node.label !== node.id ? node.label :
                     node.entityId ? node.entityId :
                     node.entityType ? node.entityType : null;

  if (displayName) {
    ctx.fillStyle = node.type === 'custom' ? '#9ca3af' : (isDark ? '#ffffff' : '#000000');
    ctx.font = `bold ${12 / globalScale}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(displayName, node.x, node.y + yOffset);
    yOffset += 16 / globalScale;
  }

  // Address (truncated)
  if (node.type !== 'custom' && displayName && node.id) {
    const addressText = node.id.length > 12 ? `${node.id.slice(0, 6)}...${node.id.slice(-6)}` : node.id;
    ctx.fillStyle = isDark ? '#9ca3af' : '#6b7280';
    ctx.font = `${10 / globalScale}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(addressText, node.x, node.y + yOffset);
    yOffset += 14 / globalScale;
  }

  // Risk score
  if (node.risk !== undefined && node.risk !== null) {
    const riskValue = typeof node.risk === 'number' ? node.risk : parseFloat(String(node.risk));
    if (!isNaN(riskValue) && riskValue >= 0) {
      const riskColor = riskValue > 70 ? '#ef4444' : riskValue > 40 ? '#f59e0b' : '#10b981';
      ctx.fillStyle = riskColor;
      ctx.font = `bold ${10 / globalScale}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`Risk: ${Math.round(riskValue)}`, node.x, node.y + yOffset);
    }
  }
}

/**
 * Draw add button (+)
 */
function drawAddButton(
  node: FTNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  radius: number
): void {
  const addR = 7; // Increased from 5 to 7 for better visibility
  const addCx = node.x - radius - 6;
  const addCy = node.y - radius - 6;

  // Draw outer glow/border for better visibility
  ctx.beginPath();
  ctx.arc(addCx, addCy, addR + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
  ctx.lineWidth = 2 / globalScale;
  ctx.stroke();

  // Draw main button circle
  ctx.beginPath();
  ctx.arc(addCx, addCy, addR, 0, Math.PI * 2);
  ctx.fillStyle = '#10b981';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2 / globalScale;
  ctx.stroke();

  // Draw plus sign
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5 / globalScale;
  ctx.beginPath();
  ctx.moveTo(addCx - addR / 2, addCy);
  ctx.lineTo(addCx + addR / 2, addCy);
  ctx.moveTo(addCx, addCy - addR / 2);
  ctx.lineTo(addCx, addCy + addR / 2);
  ctx.stroke();
}

/**
 * Draw delete button (X)
 */
function drawDeleteButton(
  node: FTNode,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  radius: number
): void {
  const delR = 5;
  const delCx = node.x + radius + 6;
  const delCy = node.y - radius - 6;
  ctx.beginPath();
  ctx.arc(delCx, delCy, delR, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.8 / globalScale;
  ctx.beginPath();
  ctx.moveTo(delCx - delR / 2, delCy - delR / 2);
  ctx.lineTo(delCx + delR / 2, delCy + delR / 2);
  ctx.moveTo(delCx + delR / 2, delCy - delR / 2);
  ctx.lineTo(delCx - delR / 2, delCy + delR / 2);
  ctx.stroke();
}

/**
 * Create node canvas object renderer function
 */
export function createNodeRenderer(config: NodeRenderConfig) {
  return (
    node: FTNode & { fx?: number; fy?: number; val?: number },
    ctx: CanvasRenderingContext2D,
    globalScale: number
  ) => {
    drawNode(node, ctx, globalScale, config);
  };
}
