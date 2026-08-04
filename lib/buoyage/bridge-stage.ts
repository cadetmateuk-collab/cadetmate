/** Bridge overlay art is authored at 1920×1080 — keep all helm UI in this frame. */
export const BRIDGE_STAGE_WIDTH = 1920;
export const BRIDGE_STAGE_HEIGHT = 1080;
export const BRIDGE_STAGE_ASPECT = BRIDGE_STAGE_WIDTH / BRIDGE_STAGE_HEIGHT;

/** Largest 16:9 rect that fits inside the parent (letterbox / pillarbox). */
export function containedStageSize(
  parentW: number,
  parentH: number,
  aspect = BRIDGE_STAGE_ASPECT,
): { width: number; height: number } {
  if (parentW <= 0 || parentH <= 0) return { width: 0, height: 0 };
  let width = parentW;
  let height = parentW / aspect;
  if (height > parentH) {
    height = parentH;
    width = parentH * aspect;
  }
  return { width, height };
}

/** Scale factor vs design resolution (1 = calibrated desktop size). */
export function bridgeUiScale(stageWidth: number) {
  return stageWidth > 0 ? stageWidth / BRIDGE_STAGE_WIDTH : 1;
}
