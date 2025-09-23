export function getEdgeOffset(
  from: { x: number; y: number },
  to: { x: number; y: number },
  edgeType: "in" | "out" = "out",
  zoom = 1,
  px = 14
) {
  // Compute canonical direction (lexicographically smaller point first) for stable perpendicular basis
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  if (from.x + from.y > to.x + to.y) {
    dx = -dx;
    dy = -dy;
  }

  const len = Math.hypot(dx, dy) || 1;
  const perpX = (dy / len) * (px / zoom);
  const perpY = (-dx / len) * (px / zoom);

  const sign = edgeType === "out" ? 1 : -1;
  return { offX: perpX * sign, offY: perpY * sign };
}