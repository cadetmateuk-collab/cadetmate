'use client';

import { useState, useMemo } from 'react';
import { SCREENS, ScreenDef, ScreenKey } from './BridgeScene';

// ══════════════════════════════════════════════════════════════════════════════
// All plane interactions live here.
// To add a new interaction:
//   1. Add state below
//   2. Wire it into useScreenDefs
// ══════════════════════════════════════════════════════════════════════════════

export function useBridgeInteractions() {
  // ── Radar on/off ────────────────────────────────────────────────────────────
  const [radarOn, setRadarOn] = useState(true);

  // ── Add more state here ─────────────────────────────────────────────────────
  // const [compassOn, setCompassOn] = useState(true);

  // ── Wire state into screen defs ─────────────────────────────────────────────
  const screenDefs: Record<ScreenKey, ScreenDef> = useMemo(() => ({
    radarScreen: {
      ...SCREENS.radarScreen,
      isActive: !radarOn,  // isActive = true shows altTexture (off state)
    },
    radarToggle: {
      ...SCREENS.radarToggle,
      isActive: !radarOn,  // button also swaps texture
      onClick:  () => setRadarOn(v => !v),
    },
    // compassScreen: {
    //   ...SCREENS.compassScreen,
    //   isActive: !compassOn,
    // },
    // compassToggle: {
    //   ...SCREENS.compassToggle,
    //   isActive: !compassOn,
    //   onClick: () => setCompassOn(v => !v),
    // },
  }), [radarOn]);

  return { screenDefs };
}