/** Operator-facing radar display settings (separate from helm plane layout). */

export const RADAR_RANGE_OPTIONS_NM = [0.5, 1, 2, 3, 6, 12] as const;
export type RadarRangeNm = (typeof RADAR_RANGE_OPTIONS_NM)[number];

/**
 * World units per nautical mile for buoyage radar.
 * Matches DEFAULT_RADAR_LAYOUT.range (400) ≈ 1 NM.
 */
export const WORLD_UNITS_PER_NM = 400;

export type TrailLength = 'off' | 'short' | 'medium' | 'long' | 'infinite';
export type TrailMode = 'relative' | 'true' | 'both';

export type RadarDisplaySettings = {
  rangeNm: RadarRangeNm;
  showRangeRings: boolean;
  ringCount: number;
  /** Echo strength 0–1 */
  gain: number;
  /** Background clutter / interference 0–1 */
  noise: number;
  headingLine: boolean;
  /** Fraction of PPI radius (0.25–1) */
  headingLineLength: number;
  trailLength: TrailLength;
  trailMode: TrailMode;
};

export const DEFAULT_RADAR_SETTINGS: RadarDisplaySettings = {
  rangeNm: 1,
  showRangeRings: true,
  ringCount: 4,
  gain: 0.7,
  noise: 0.22,
  headingLine: true,
  headingLineLength: 1,
  trailLength: 'medium',
  trailMode: 'relative',
};

export const TRAIL_LENGTH_OPTIONS: { id: TrailLength; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
  { id: 'infinite', label: 'Infinite' },
];

/** Max PPI trail samples for each length preset. */
export function trailSampleCap(length: TrailLength): number {
  switch (length) {
    case 'off':
      return 0;
    case 'short':
      return 14;
    case 'medium':
      return 36;
    case 'long':
      return 72;
    case 'infinite':
      return 400;
  }
}

export function rangeNmToWorld(nm: number): number {
  return Math.max(40, nm * WORLD_UNITS_PER_NM);
}

export function formatRangeNm(nm: number): string {
  return Number.isInteger(nm) ? `${nm}` : nm.toFixed(1);
}
