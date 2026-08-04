export const GRID_SIZE = 40;
export const MARK_HIT_SIZE = 56;
export const SHIP_HIT_SIZE = 64;
export const NOTE_DEFAULT_W = 160;
export const NOTE_DEFAULT_H = 100;
export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 4;
export const NUDGE_SMALL = 1;
export const NUDGE_LARGE = 10;

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function snapToGrid(value: number, gridSize = GRID_SIZE, enabled = true) {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: { x: number; y: number; zoom: number },
  rect: { left: number; top: number },
) {
  return {
    x: (screenX - rect.left - camera.x) / camera.zoom,
    y: (screenY - rect.top - camera.y) / camera.zoom,
  };
}

export function marksBounds(
  marks: { x: number; y: number; scale?: number }[],
  padding = 80,
) {
  if (marks.length === 0) {
    return { minX: -200, minY: -200, maxX: 200, maxY: 200, width: 400, height: 400 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const m of marks) {
    const half = (MARK_HIT_SIZE * (m.scale ?? 1)) / 2;
    minX = Math.min(minX, m.x - half);
    minY = Math.min(minY, m.y - half);
    maxX = Math.max(maxX, m.x + half);
    maxY = Math.max(maxY, m.y + half);
  }
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

export function hitTestMark(
  worldX: number,
  worldY: number,
  mark: { x: number; y: number; scale: number },
  hitSize = MARK_HIT_SIZE,
) {
  const half = (hitSize * mark.scale) / 2;
  return (
    worldX >= mark.x - half &&
    worldX <= mark.x + half &&
    worldY >= mark.y - half &&
    worldY <= mark.y + half
  );
}

export function hitTestNote(
  worldX: number,
  worldY: number,
  note: { x: number; y: number; width: number; height: number },
) {
  return (
    worldX >= note.x &&
    worldX <= note.x + note.width &&
    worldY >= note.y &&
    worldY <= note.y + note.height
  );
}

export function rectContainsPoint(
  rx: number,
  ry: number,
  rw: number,
  rh: number,
  px: number,
  py: number,
) {
  const minX = Math.min(rx, rx + rw);
  const maxX = Math.max(rx, rx + rw);
  const minY = Math.min(ry, ry + rh);
  const maxY = Math.max(ry, ry + rh);
  return px >= minX && px <= maxX && py >= minY && py <= maxY;
}

/** Canvas heading: 0° = north (−Y), clockwise positive */
export function bearingDeg(fromX: number, fromY: number, toX: number, toY: number) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  // atan2(dx, -dy): 0 when pointing up (−Y)
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function normalizeAngleDiff(diff: number) {
  let d = ((diff + 180) % 360) - 180;
  if (d < -180) d += 360;
  return d;
}

export function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay);
}

/** Smooth exponential zoom factor from wheel delta (pixel or line) */
export function wheelZoomFactor(deltaY: number, deltaMode: number) {
  // Normalize to roughly pixel-like units
  let dy = deltaY;
  if (deltaMode === 1) dy *= 16; // lines
  if (deltaMode === 2) dy *= 400; // pages
  // Gentler curve — ~1% per 20px scroll
  return Math.exp(-dy * 0.0015);
}
