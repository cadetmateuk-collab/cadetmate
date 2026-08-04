'use client';

import { useEffect, useRef, useState } from 'react';
import { normalizeAngleDiff } from '@/lib/buoyage/geometry';
import {
  planeOrigin,
  planeTransform,
  type InstrumentLayout,
} from '@/lib/buoyage/helm-layout';

type Props = {
  heading: number;
  speed: number;
  throttle: number;
  rudder: number;
  layout: InstrumentLayout;
  className?: string;
};

/** Conning readout: heading, rate of turn, speed — styled like a bridge instrument. */
export function InstrumentPanel({
  heading,
  speed,
  throttle,
  rudder,
  layout,
  className,
}: Props) {
  const [rot, setRot] = useState(0); // deg/sec, + = starboard
  const prev = useRef({ heading, t: performance.now() });

  useEffect(() => {
    const now = performance.now();
    const dt = (now - prev.current.t) / 1000;
    if (dt >= 0.08) {
      const dH = normalizeAngleDiff(heading - prev.current.heading);
      setRot(dH / dt);
      prev.current = { heading, t: now };
    }
  }, [heading]);

  const hdg = ((heading % 360) + 360) % 360;
  const sog = Math.abs(speed);
  const ahead = throttle >= -0.05;
  const rotLabel =
    Math.abs(rot) < 0.4 ? '0.0' : `${rot > 0 ? '+' : ''}${rot.toFixed(1)}`;

  return (
    <div
      className={`pointer-events-none absolute z-[35] overflow-hidden ${className ?? ''}`}
      style={{
        left: `${layout.leftPct}%`,
        top: `${layout.topPct}%`,
        width: `${layout.widthPct}%`,
        height: `${layout.heightPct}%`,
        borderRadius: layout.borderRadius,
        transform: planeTransform(layout),
        transformOrigin: planeOrigin(layout),
        background: `rgba(6,10,14,${layout.bezelOpacity})`,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 20px rgba(0,0,0,0.4)',
      }}
      aria-hidden
    >
      <div
        className="absolute flex flex-col justify-between font-mono"
        style={{
          inset: layout.screenInset,
          borderRadius: Math.max(2, layout.borderRadius - 2),
          background:
            'radial-gradient(circle at 30% 20%, rgba(40,90,120,0.35), #071018 65%)',
          padding: '6%',
          color: '#9fd4ff',
        }}
      >
        <div className="flex items-baseline justify-between gap-1 border-b border-cyan-400/20 pb-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-cyan-200/60 sm:text-[9px]">
            HDG
          </span>
          <span className="text-[15px] font-bold tabular-nums leading-none text-cyan-50 sm:text-[18px]">
            {hdg.toFixed(0).padStart(3, '0')}°
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1 border-b border-cyan-400/20 py-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-cyan-200/60 sm:text-[9px]">
            ROT
          </span>
          <span
            className={`text-[13px] font-bold tabular-nums leading-none sm:text-[15px] ${
              rot > 0.5 ? 'text-emerald-300' : rot < -0.5 ? 'text-rose-300' : 'text-cyan-50'
            }`}
          >
            {rotLabel}
            <span className="ml-0.5 text-[8px] font-medium text-cyan-200/50">°/s</span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1 border-b border-cyan-400/20 py-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-cyan-200/60 sm:text-[9px]">
            SOG
          </span>
          <span className="text-[13px] font-bold tabular-nums leading-none text-cyan-50 sm:text-[15px]">
            {sog.toFixed(1)}
            <span className="ml-0.5 text-[8px] font-medium text-cyan-200/50">
              {ahead ? 'ahead' : 'astern'}
            </span>
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-1 pt-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-cyan-200/60 sm:text-[9px]">
            RUD
          </span>
          <span className="text-[11px] font-bold tabular-nums leading-none text-cyan-50 sm:text-[12px]">
            {Math.abs(rudder) < 0.05
              ? 'AMID'
              : rudder < 0
                ? `P ${Math.round(Math.abs(rudder) * 100)}%`
                : `S ${Math.round(rudder * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
