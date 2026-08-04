'use client';

import { useEffect, useRef } from 'react';
import { useBuoyageStore } from './useBuoyageStore';

/**
 * Runs the active own-ship (or activeShipId) physics loop.
 * Throttle/rudder drive speed & heading; position updates leave a track.
 */
export function useShipSimulation() {
  const activeShipId = useBuoyageStore((s) => s.activeShipId);
  const ships = useBuoyageStore((s) => s.ships);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);

  const ship =
    ships.find((s) => s.id === activeShipId) ??
    ships.find((s) => s.shipType === 'own') ??
    null;

  const needsSim = Boolean(
    ship &&
      (Math.abs(ship.throttle ?? 0) > 0.01 ||
        Math.abs(ship.speed ?? 0) > 0.2 ||
        Math.abs(ship.rudder ?? 0) > 0.01),
  );

  useEffect(() => {
    if (!ship || !needsSim) {
      if (raf.current != null) {
        cancelAnimationFrame(raf.current);
        raf.current = null;
      }
      last.current = 0;
      return;
    }

    const shipId = ship.id;
    const loop = (t: number) => {
      if (!last.current) last.current = t;
      const dt = Math.min(0.05, (t - last.current) / 1000);
      last.current = t;
      useBuoyageStore.getState().simulateShipStep(shipId, dt);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
      raf.current = null;
      last.current = 0;
    };
  }, [ship?.id, needsSim, ship?.throttle, ship?.rudder, ship?.speed]);
}
