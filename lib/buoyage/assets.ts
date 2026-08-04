/** Static helm overlay art (served from public/buoyage/helm). */
export const HELM_ASSETS = {
  bridgeOverlay: '/buoyage/helm/bridge-overlay.png',
  wheel: '/buoyage/helm/wheel.png',
  throttle: '/buoyage/helm/throttle.png',
} as const;

export function markImagePath(definitionId: string, mode: 'day' | 'night') {
  return `/buoyage/marks/${definitionId}.${mode}.png`;
}

/**
 * Explicit day art for marks whose filenames don't follow `{id}.day.png`
 * (typos in source assets are preserved on purpose).
 */
export const MARK_DAY_IMAGES: Record<string, string> = {
  'cardinal-north': '/buoyage/marks/cardinal-north.day.png',
  'cardinal-east': '/buoyage/marks/cardinal-east.day.png',
  'cardinal-south': '/buoyage/marks/cardinal-south.day.png',
  'cardinal-west': '/buoyage/marks/cardinal-west.day.png',
  'isolated-danger': '/buoyage/marks/isolate-danger.png',
  'safe-water': '/buoyage/marks/safe-water.png',
  'special-mark': '/buoyage/marks/special-mark.png',
  'emergency-wreck': '/buoyage/marks/emergency-wreck.png',

  // Region A preferred channels (filenames use "prefered")
  'preferred-port-cone-a': '/buoyage/marks/prefered-channel-to-port-cone.png',
  'preferred-port-pillar-a': '/buoyage/marks/prefered-channel-to-port-pillar.png',
  'preferred-port-spar-a': '/buoyage/marks/prefered-channel-to-port-spar.png',
  'preferred-starboard-can-a': '/buoyage/marks/prefered-channel-to-starboard-can.png',
  'preferred-starboard-pillar-a': '/buoyage/marks/prefered-channel-to-starboard-pillar.png',
  'preferred-starboard-spar-a': '/buoyage/marks/prefered-channel-to-starboard-spar.png',

  // Region B: colours reverse, so reuse the opposite Region A art
  'preferred-port-can-b': '/buoyage/marks/prefered-channel-to-starboard-can.png',
  'preferred-port-pillar-b': '/buoyage/marks/prefered-channel-to-starboard-pillar.png',
  'preferred-port-spar-b': '/buoyage/marks/prefered-channel-to-starboard-spar.png',
  'preferred-starboard-cone-b': '/buoyage/marks/prefered-channel-to-port-cone.png',
  'preferred-starboard-pillar-b': '/buoyage/marks/prefered-channel-to-port-pillar.png',
  'preferred-starboard-spar-b': '/buoyage/marks/prefered-channel-to-port-spar.png',
};

/** Attach day art when we have a mapped file; otherwise leave unset (SVG fallback). */
export function withMarkImages<T extends { id: string }>(def: T): T & {
  imageDay?: string;
  imageNight?: string;
} {
  const imageDay = MARK_DAY_IMAGES[def.id];
  if (!imageDay) return { ...def };
  return {
    ...def,
    imageDay,
  };
}
