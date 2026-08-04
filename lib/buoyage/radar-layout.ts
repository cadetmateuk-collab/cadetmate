/** Tunable radar plane layout on the bridge. Calibrate with RADAR_DEV_TOOLS, then lock defaults. */
export type RadarLayout = {
  /** Plane position as % of bridge frame */
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  /** Corner radius of the bezel (px) */
  borderRadius: number;
  /** Inset of the glowing screen inside the bezel (px) */
  screenInset: number;
  /** World units shown from own ship to edge of radar */
  range: number;
  /** Number of range rings */
  ringCount: number;
  /**
   * 3D tilt to match a slanted helm screen (CSS perspective).
   * rotateX: tip toward/away from viewer (console slant)
   * rotateY: lean left/right
   * rotateZ: flat spin in screen plane
   */
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  /** Skew in degrees (parallelogram distort to match overlay bezel) */
  skewX: number;
  skewY: number;
  /** CSS perspective distance in px (lower = stronger foreshortening) */
  perspective: number;
  /** Transform origin as "x% y%" */
  originXPct: number;
  originYPct: number;
  /** Bezel / frame opacity */
  bezelOpacity: number;
  /** Screen phosphor green tint strength 0–1 */
  phosphor: number;
};

export const DEFAULT_RADAR_LAYOUT: RadarLayout = {
  leftPct: 0.5,
  topPct: 59,
  widthPct: 25.5,
  heightPct: 23.5,
  borderRadius: 0,
  screenInset: 0,
  range: 400,
  ringCount: 4,
  rotateX: 14,
  rotateY: -4.5,
  rotateZ: 2.5,
  skewX: -3,
  skewY: -1.5,
  perspective: 1850,
  originXPct: 100,
  originYPct: 100,
  bezelOpacity: 1,
  phosphor: 0.35,
};

/** Enable while lining the radar plane up with helm art; set false after locking values. */
export const RADAR_DEV_TOOLS = false;

const STORAGE_KEY = 'cadetmate.buoyage.radarLayout';

export function loadRadarLayout(): RadarLayout {
  if (!RADAR_DEV_TOOLS) return { ...DEFAULT_RADAR_LAYOUT };
  if (typeof window === 'undefined') return { ...DEFAULT_RADAR_LAYOUT };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RADAR_LAYOUT };
    const parsed = JSON.parse(raw) as Partial<RadarLayout> & { pictureRotate?: number };
    // Migrate older saves that only had pictureRotate
    if (parsed.rotateZ == null && parsed.pictureRotate != null) {
      parsed.rotateZ = parsed.pictureRotate;
    }
    return { ...DEFAULT_RADAR_LAYOUT, ...parsed };
  } catch {
    return { ...DEFAULT_RADAR_LAYOUT };
  }
}

export function saveRadarLayout(layout: RadarLayout) {
  if (!RADAR_DEV_TOOLS) return;
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

export function buildRadarExportPayload(layout: RadarLayout) {
  return {
    exportedAt: new Date().toISOString(),
    kind: 'radar-layout' as const,
    layout,
  };
}

/** CSS transform for matching a slanted bridge overlay screen. */
export function radarPlaneTransform(layout: RadarLayout): string {
  const { rotateX, rotateY, rotateZ, skewX, skewY } = layout;
  return `perspective(${layout.perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) skew(${skewX}deg, ${skewY}deg)`;
}

export function radarPlaneOrigin(layout: RadarLayout): string {
  return `${layout.originXPct}% ${layout.originYPct}%`;
}

/** Scale absolute (px) radar fields with the bridge stage. */
export function scaleRadarLayout(layout: RadarLayout, scale: number): RadarLayout {
  return {
    ...layout,
    perspective: layout.perspective * scale,
    borderRadius: layout.borderRadius * scale,
    screenInset: layout.screenInset * scale,
  };
}
