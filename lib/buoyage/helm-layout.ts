/** Shared bridge-plane transform (radar, instruments, wheel). */
export type BridgePlaneLayout = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
  borderRadius: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  skewX: number;
  skewY: number;
  perspective: number;
  originXPct: number;
  originYPct: number;
  bezelOpacity: number;
};

export function planeTransform(layout: BridgePlaneLayout): string {
  return `perspective(${layout.perspective}px) rotateX(${layout.rotateX}deg) rotateY(${layout.rotateY}deg) rotateZ(${layout.rotateZ}deg) skew(${layout.skewX}deg, ${layout.skewY}deg)`;
}

export function planeOrigin(layout: BridgePlaneLayout): string {
  return `${layout.originXPct}% ${layout.originYPct}%`;
}

/** Scale absolute (px) layout fields with the bridge stage. */
export function scalePlanePx<T extends BridgePlaneLayout>(layout: T, scale: number): T {
  return {
    ...layout,
    perspective: layout.perspective * scale,
    borderRadius: layout.borderRadius * scale,
  };
}

export function scaleInstrumentLayout(layout: InstrumentLayout, scale: number): InstrumentLayout {
  return {
    ...scalePlanePx(layout, scale),
    screenInset: layout.screenInset * scale,
  };
}

export function scaleWheelLayout(layout: WheelLayout, scale: number): WheelLayout {
  return scalePlanePx(layout, scale);
}

/** Interactive helm wheel placement over the overlay art. */
export type WheelLayout = BridgePlaneLayout & {
  /** Visual spin degrees per second at full rudder */
  spinSpeed: number;
};

export const DEFAULT_WHEEL_LAYOUT: WheelLayout = {
  leftPct: 38,
  topPct: 73.5,
  widthPct: 23,
  heightPct: 44.5,
  borderRadius: 999,
  rotateX: 8,
  rotateY: 0,
  rotateZ: 0,
  skewX: 0,
  skewY: 0,
  perspective: 1200,
  originXPct: 50,
  originYPct: 50,
  bezelOpacity: 1,
  spinSpeed: 220,
};

/** Conning / instrument readout plane (HDG, ROT, speed). */
export type InstrumentLayout = BridgePlaneLayout & {
  screenInset: number;
};

export const DEFAULT_INSTRUMENT_LAYOUT: InstrumentLayout = {
  leftPct: 46.5,
  topPct: 59.5,
  widthPct: 16,
  heightPct: 23,
  borderRadius: 0,
  screenInset: 4,
  rotateX: 13,
  rotateY: 0,
  rotateZ: 0,
  skewX: 0,
  skewY: 0,
  perspective: 1110,
  originXPct: 50,
  originYPct: 100,
  bezelOpacity: 1,
};

/** Set true to tune wheel / instrument planes; false after locking values. */
export const HELM_DEV_TOOLS = false;

const WHEEL_KEY = 'cadetmate.buoyage.wheelLayout';
const INST_KEY = 'cadetmate.buoyage.instrumentLayout';

export function loadWheelLayout(): WheelLayout {
  if (!HELM_DEV_TOOLS) return { ...DEFAULT_WHEEL_LAYOUT };
  if (typeof window === 'undefined') return { ...DEFAULT_WHEEL_LAYOUT };
  try {
    const raw = localStorage.getItem(WHEEL_KEY);
    if (!raw) return { ...DEFAULT_WHEEL_LAYOUT };
    return { ...DEFAULT_WHEEL_LAYOUT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_WHEEL_LAYOUT };
  }
}

export function saveWheelLayout(layout: WheelLayout) {
  if (!HELM_DEV_TOOLS || typeof window === 'undefined') return;
  localStorage.setItem(WHEEL_KEY, JSON.stringify(layout));
}

export function loadInstrumentLayout(): InstrumentLayout {
  if (!HELM_DEV_TOOLS) return { ...DEFAULT_INSTRUMENT_LAYOUT };
  if (typeof window === 'undefined') return { ...DEFAULT_INSTRUMENT_LAYOUT };
  try {
    const raw = localStorage.getItem(INST_KEY);
    if (!raw) return { ...DEFAULT_INSTRUMENT_LAYOUT };
    return { ...DEFAULT_INSTRUMENT_LAYOUT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_INSTRUMENT_LAYOUT };
  }
}

export function saveInstrumentLayout(layout: InstrumentLayout) {
  if (!HELM_DEV_TOOLS || typeof window === 'undefined') return;
  localStorage.setItem(INST_KEY, JSON.stringify(layout));
}

export function buildHelmExportPayload(wheel: WheelLayout, instruments: InstrumentLayout) {
  return {
    exportedAt: new Date().toISOString(),
    kind: 'helm-layout' as const,
    wheel,
    instruments,
  };
}
