/** Tunable bridge / vessel-view projection. Edit defaults after calibrating in the UI. */
export type BridgeProjection = {
  /** Painted sky / sea split (% from top) — background horizon */
  horizonY: number;
  /** Far buoy line (% from top) — where distant marks sit on the water */
  buoyLineY: number;
  /** Near buoy line / sea bottom (% from top) — closest marks */
  seaBottom: number;
  /** World range mapped to seaBottom (closest) */
  nearRange: number;
  /** World range mapped to buoyLineY (farthest) */
  farRange: number;
  /** Power ease on range→Y (lower = more mid-range spread) */
  rangeEase: number;
  /** % of half-width used at edge of FOV (50 = full edge) */
  bearingSpan: number;
  /**
   * Extra lateral spread when close — marks accelerate wide as you pass
   * (perspective exaggeration). 0 = none.
   */
  nearBoostMax: number;
  /** Range below which nearBoost ramps in */
  nearBoostRange: number;
  /** Power on nearBoost ramp (higher = snappier last approach) */
  nearBoostPower: number;
  /** Start fading only when almost alongside (after swinging wide) */
  passFadeStart: number;
  /** Fully hidden at or below this range */
  passHideRange: number;
  /** Apparent size: ref / range * sizeScale */
  sizeRefBuoy: number;
  sizeRefShip: number;
  sizeScale: number;
  sizeMinBuoy: number;
  sizeMaxBuoy: number;
  sizeMinShip: number;
  sizeMaxShip: number;
  /** Vertical anchor of mark (% of its height below pivot) */
  anchorY: number;
  /** Hide marks beyond this world range (0 = use FOV only) */
  maxVisibleRange: number;
  /** Hide marks closer than this */
  minVisibleRange: number;
};

export const DEFAULT_BRIDGE_PROJECTION: BridgeProjection = {
  horizonY: 47.5,
  buoyLineY: 45.5,
  seaBottom: 58,
  nearRange: 14,
  farRange: 1350,
  rangeEase: 0.48,
  bearingSpan: 46,
  nearBoostMax: 0.55,
  nearBoostRange: 200,
  nearBoostPower: 1.75,
  passFadeStart: 28,
  passHideRange: 10,
  sizeRefBuoy: 220,
  sizeRefShip: 240,
  sizeScale: 95,
  sizeMinBuoy: 10,
  sizeMaxBuoy: 128,
  sizeMinShip: 14,
  sizeMaxShip: 140,
  anchorY: 78,
  maxVisibleRange: 0,
  minVisibleRange: 0,
};

/** When false, always use DEFAULT_BRIDGE_PROJECTION (ignore localStorage). */
export const BRIDGE_DEV_TOOLS = false;

export const DEFAULT_BRIDGE_FOV = 88;

const STORAGE_KEY = 'cadetmate.buoyage.bridgeProjection';

export function loadBridgeProjection(): BridgeProjection {
  if (!BRIDGE_DEV_TOOLS) return { ...DEFAULT_BRIDGE_PROJECTION };
  if (typeof window === 'undefined') return { ...DEFAULT_BRIDGE_PROJECTION };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BRIDGE_PROJECTION };
    const parsed = JSON.parse(raw) as Partial<BridgeProjection>;
    // Migrate older saves that lacked buoyLineY
    if (parsed.buoyLineY == null && parsed.horizonY != null) {
      parsed.buoyLineY = parsed.horizonY;
    }
    return { ...DEFAULT_BRIDGE_PROJECTION, ...parsed };
  } catch {
    return { ...DEFAULT_BRIDGE_PROJECTION };
  }
}

export function saveBridgeProjection(p: BridgeProjection) {
  if (!BRIDGE_DEV_TOOLS) return;
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/** Payload to paste back for locking defaults in code. */
export function buildBridgeExportPayload(fov: number, projection: BridgeProjection) {
  return {
    exportedAt: new Date().toISOString(),
    fov,
    projection,
  };
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function apparentSize(
  range: number,
  kind: 'buoy' | 'ship',
  p: BridgeProjection,
) {
  const ref = kind === 'buoy' ? p.sizeRefBuoy : p.sizeRefShip;
  const max = kind === 'buoy' ? p.sizeMaxBuoy : p.sizeMaxShip;
  const min = kind === 'buoy' ? p.sizeMinBuoy : p.sizeMinShip;
  // Grow with 1/range until size max; keep growing into the near zone
  const raw = (ref * p.sizeScale) / Math.max(p.nearRange * 0.75, range);
  return clamp(raw, min, max);
}

/** 1 → fully visible; only fade once almost under the bow (after swinging wide). */
export function passOpacity(range: number, p: BridgeProjection) {
  if (range <= p.passHideRange) return 0;
  if (range >= p.passFadeStart) return 1;
  const t = (range - p.passHideRange) / (p.passFadeStart - p.passHideRange || 1);
  return t * t;
}

/**
 * Map world range onto the buoy plane. Near field is compressed so closing
 * the last stretch moves the mark down the glass faster (perspective rush).
 */
export function rangeToScreenY(range: number, p: BridgeProjection) {
  const r = Math.max(range, p.passHideRange * 0.85);
  const t = clamp((r - p.nearRange) / (p.farRange - p.nearRange || 1), 0, 1);
  // Slightly lower ease → more travel in the near half of the approach
  const eased = Math.pow(t, p.rangeEase);
  return p.buoyLineY + (1 - eased) * (p.seaBottom - p.buoyLineY);
}

/**
 * Bearing → screen X. As range drops, amplify lateral offset so marks
 * rush wider and leave the frame as you pass (realistic pass-by).
 */
export function bearingToScreenX(
  relBearing: number,
  halfFov: number,
  range: number,
  p: BridgeProjection,
) {
  const x = 50 + (relBearing / halfFov) * p.bearingSpan;
  const t = clamp((p.nearBoostRange - range) / (p.nearBoostRange || 1), 0, 1);
  const power = p.nearBoostPower > 0 ? p.nearBoostPower : 1;
  const boost = 1 + Math.pow(t, power) * p.nearBoostMax;
  // Allow going past the frame so overflow:hidden clips the pass-by
  return 50 + (x - 50) * boost;
}
