'use client';

import { useEffect, useRef, useState } from 'react';
import { HELM_ASSETS } from '@/lib/buoyage/assets';
import {
  planeOrigin,
  planeTransform,
  type WheelLayout,
} from '@/lib/buoyage/helm-layout';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import { clamp } from '@/lib/buoyage/bridge-projection';

type Props = {
  shipId: string;
  rudder: number;
  layout: WheelLayout;
  className?: string;
};

/** Visual degrees at full hard-over (±100% rudder) — wheel stops here. */
const MAX_WHEEL_DEG = 120;

/**
 * Interactive helm wheel: spins while A/D (or rudder) held; drag/spin on tablet.
 */
export function HelmWheel({ shipId, rudder, layout, className }: Props) {
  const updateShip = useBuoyageStore((s) => s.updateShip);
  const [angle, setAngle] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const dragging = useRef(false);
  const lastPointerAngle = useRef<number | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  // Continuous spin while rudder applied; stop at ±100%; spring back when amidships
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = useBuoyageStore.getState().ships.find((s) => s.id === shipId)?.rudder ?? 0;
      setAngle((prev) => {
        if (dragging.current) return prev;
        if (Math.abs(r) > 0.04) {
          const next = prev + r * layout.spinSpeed * dt;
          return clamp(next, -MAX_WHEEL_DEG, MAX_WHEEL_DEG);
        }
        // Ease toward amidships when rudder released
        const next = prev * Math.exp(-6 * dt);
        return Math.abs(next) < 0.15 ? 0 : next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [shipId, layout.spinSpeed]);

  const pointerAngle = (clientX: number, clientY: number) => {
    const el = elRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    lastPointerAngle.current = pointerAngle(e.clientX, e.clientY);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current || lastPointerAngle.current == null) return;
    const a = pointerAngle(e.clientX, e.clientY);
    let delta = a - lastPointerAngle.current;
    // unwrap
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastPointerAngle.current = a;
    setAngle((prev) => {
      const next = clamp(prev + delta, -MAX_WHEEL_DEG, MAX_WHEEL_DEG);
      updateShip(shipId, { rudder: next / MAX_WHEEL_DEG }, false);
      return next;
    });
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    lastPointerAngle.current = null;
    updateShip(shipId, { rudder: 0 }, false);
  };

  if (!imgOk) return null;

  return (
    <div
      ref={elRef}
      className={`absolute z-[45] touch-none select-none ${className ?? ''}`}
      style={{
        left: `${layout.leftPct}%`,
        top: `${layout.topPct}%`,
        width: `${layout.widthPct}%`,
        height: `${layout.heightPct}%`,
        transform: planeTransform(layout),
        transformOrigin: planeOrigin(layout),
        opacity: layout.bezelOpacity,
        cursor: 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="slider"
      aria-label="Helm wheel"
      aria-valuemin={-1}
      aria-valuemax={1}
      aria-valuenow={Math.round(rudder * 100) / 100}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HELM_ASSETS.wheel}
        alt=""
        draggable={false}
        className="h-full w-full object-contain drop-shadow-lg"
        style={{
          transform: `rotate(${angle}deg)`,
          transformOrigin: '50% 50%',
          pointerEvents: 'none',
        }}
        onError={() => setImgOk(false)}
      />
    </div>
  );
}
