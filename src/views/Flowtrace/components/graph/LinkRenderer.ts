/**
 * LinkRenderer - Canvas-based link rendering for NetworkGraphV2
 * Handles drawing of transaction links with labels and amounts
 */

import { FTConnection } from '../NetworkGraph';

/**
 * Format amount with proper locale string
 */
export function formatAmount(valStr: string): string {
  const num = parseFloat(valStr || "0");
  return Number.isFinite(num)
    ? Number(num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 })
    : valStr;
}

/**
 * Link rendering configuration
 */
export interface LinkRenderConfig {
  theme: 'light' | 'dark';
  utxoCollapseMode: 'aggregated' | 'individual';
  nodeRadius?: number;
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
  arrowLength: number
): void {
  // Calculate angle of the line
  const angle = Math.atan2(toY - fromY, toX - fromX);

  // Calculate arrowhead points
  const arrowPoint1X = toX - arrowLength * Math.cos(angle - Math.PI / 6);
  const arrowPoint1Y = toY - arrowLength * Math.sin(angle - Math.PI / 6);
  const arrowPoint2X = toX - arrowLength * Math.cos(angle + Math.PI / 6);
  const arrowPoint2Y = toY - arrowLength * Math.sin(angle + Math.PI / 6);

  // Draw filled arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(arrowPoint1X, arrowPoint1Y);
  ctx.lineTo(arrowPoint2X, arrowPoint2Y);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw a link label on the canvas
 */
export function drawLinkLabel(
  link: any,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  config: LinkRenderConfig
): void {
  if (!link.amount) return;

  // Hide labels when zoomed out too far (threshold: 0.5)
  if (globalScale < 0.5) return;

  const { theme, utxoCollapseMode } = config;
  const isDark = theme === 'dark';
  const start = link.source;
  const end = link.target;

  if (typeof start !== 'object' || typeof end !== 'object') return;

  // Calculate the midpoint on the curve using the same logic as react-force-graph-2d
  let midX: number, midY: number;

  if (link.curvature && link.curvature !== 0) {
    // react-force-graph-2d uses distance-based curvature calculation
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular vector
    const perpX = -dy / distance;
    const perpY = dx / distance;

    // Control point offset (matches library's calculation)
    const controlPointOffset = link.curvature * distance;

    // Control point
    const controlX = (start.x + end.x) / 2 + perpX * controlPointOffset;
    const controlY = (start.y + end.y) / 2 + perpY * controlPointOffset;

    // Calculate point on quadratic bezier curve at t=0.5
    const t = 0.5;
    midX = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * controlX + t * t * end.x;
    midY = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * controlY + t * t * end.y;
  } else {
    // For straight links
    midX = (start.x + end.x) / 2;
    midY = (start.y + end.y) / 2;
  }

  // Format label
  const label = utxoCollapseMode === 'aggregated' && link.utxoCount && link.utxoCount > 1
    ? `${formatAmount(link.amount)} ${link.currency} (${link.utxoCount})`
    : `${formatAmount(link.amount)} ${link.currency || ''}`;

  // Draw label background
  ctx.font = `${11 / globalScale}px Inter, system-ui, sans-serif`;
  const metrics = ctx.measureText(label);
  const padding = 4 / globalScale;
  const bgWidth = metrics.width + padding * 2;
  const bgHeight = 16 / globalScale;

  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  ctx.fillRect(midX - bgWidth / 2, midY - bgHeight / 2, bgWidth, bgHeight);

  // Draw label text
  ctx.fillStyle = isDark ? '#ffffff' : '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, midX, midY);
}

/**
 * Draw custom edge with arrow
 */
function drawEdge(
  link: any,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  config: LinkRenderConfig
): void {
  const start = link.source;
  const end = link.target;

  if (typeof start !== 'object' || typeof end !== 'object') return;

  const nodeRadius = config.nodeRadius || 20;
  const offset = 5; // Units outside the node
  const totalOffset = nodeRadius + offset;

  // Set stroke style (custom color or theme default)
  const isDark = config.theme === 'dark';
  ctx.strokeStyle = link.customColor || (isDark ? '#6b7280' : '#000000');
  ctx.lineWidth = 2 / globalScale;

  // Calculate line properties
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) return;

  // Unit vector for direction
  const unitX = dx / distance;
  const unitY = dy / distance;

  let startX: number, startY: number, endX: number, endY: number;

  // For curved links
  if (link.curvature && link.curvature !== 0) {
    // Calculate perpendicular vector
    const perpX = -unitY;
    const perpY = unitX;

    // Control point offset
    const controlPointOffset = link.curvature * distance;

    // Control point for quadratic bezier
    const controlX = (start.x + end.x) / 2 + perpX * controlPointOffset;
    const controlY = (start.y + end.y) / 2 + perpY * controlPointOffset;

    // Offset start point
    startX = start.x + unitX * totalOffset;
    startY = start.y + unitY * totalOffset;

    // Offset end point
    endX = end.x - unitX * totalOffset;
    endY = end.y - unitY * totalOffset;

    // Draw curved path
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
    ctx.stroke();

    // Calculate angle at the end for arrowhead
    const t = 0.99; // Sample point very close to end
    const curveX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
    const curveY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;

    // Draw arrowhead
    const arrowLength = 10 / globalScale;
    ctx.fillStyle = ctx.strokeStyle;
    drawArrowhead(ctx, curveX, curveY, endX, endY, arrowLength);
  } else {
    // Straight line with offset
    startX = start.x + unitX * totalOffset;
    startY = start.y + unitY * totalOffset;
    endX = end.x - unitX * totalOffset;
    endY = end.y - unitY * totalOffset;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw arrowhead
    const arrowLength = 10 / globalScale;
    ctx.fillStyle = ctx.strokeStyle;
    drawArrowhead(ctx, startX, startY, endX, endY, arrowLength);
  }
}

/**
 * Create link canvas object renderer function
 */
export function createLinkRenderer(config: LinkRenderConfig) {
  return (
    link: any,
    ctx: CanvasRenderingContext2D,
    globalScale: number
  ) => {
    // Draw custom edge with arrow
    drawEdge(link, ctx, globalScale, config);

    // Draw label on top
    drawLinkLabel(link, ctx, globalScale, config);
  };
}

/**
 * Generate link label for tooltip
 */
export function getLinkLabel(
  link: FTConnection & { amount?: string; currency?: string; utxoCount?: number },
  utxoCollapseMode: 'aggregated' | 'individual'
): string {
  if (!link.amount) return '';
  return utxoCollapseMode === 'aggregated' && link.utxoCount && link.utxoCount > 1
    ? `${formatAmount(link.amount)} ${link.currency} (${link.utxoCount} UTXOs)`
    : `${formatAmount(link.amount)} ${link.currency || ''}`;
}
