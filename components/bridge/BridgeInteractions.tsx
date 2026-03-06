'use client';

import { useState, useCallback } from 'react';
import { SCREENS, OBJECTS, ScreenDef, ScreenKey, ObjectDef, ObjectKey } from './BridgeScene';

export function useBridgeInteractions() {

  // ── Radar ──────────────────────────────────────────────────────────────────
  const [radarOn, setRadarOn] = useState(true);
  const toggleRadar = useCallback(() => setRadarOn(v => !v), []);

  const screenDefs: Record<ScreenKey, ScreenDef> = {
    radarScreen: {
      ...SCREENS.radarScreen,
      isActive: !radarOn,
    },
    radarToggle: {
      ...SCREENS.radarToggle,
      isActive: !radarOn,
      onClick:  toggleRadar,
    },
  };

  // ── 3D Objects ─────────────────────────────────────────────────────────────
  const objectDefs: Record<ObjectKey, ObjectDef> = {
    throttle: {
      ...OBJECTS.throttle,
      onClick: () => console.log('throttle clicked'),
    },
  };

  return {
    screenDefs,
    objectDefs,
  };
}