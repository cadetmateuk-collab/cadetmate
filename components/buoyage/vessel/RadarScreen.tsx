'use client';

import { useMemo } from 'react';
import { getDefinition } from '@/data/buoyage';
import { bearingDeg, distance, normalizeAngleDiff } from '@/lib/buoyage/geometry';
import type { RadarLayout } from '@/lib/buoyage/radar-layout';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import type { CanvasShip } from '@/types/buoyage';

const BLIP: Record<string, string> = {
  red: '#ff5c5c',
  green: '#3dff8a',
  white: '#e8fff0',
  yellow: '#ffe066',
  blue: '#66b3ff',
  none: '#9ae6b4',
};

type Props = {
  cameraShip: CanvasShip;
  layout: RadarLayout;
  /** Fullscreen radar vs inset plane */
  mode: 'inset' | 'full';
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Heading-up PPI radar: own ship centre, heading toward top of the screen.
 * Inset mode is display-only (not clickable) so it can sit under the helm overlay.
 */
export function RadarScreen({
  cameraShip,
  layout,
  mode,
  className,
  style,
}: Props) {
  const marks = useBuoyageStore((s) => s.marks);
  const ships = useBuoyageStore((s) => s.ships);
  const nightMode = useBuoyageStore((s) => s.nightMode);

  const blips = useMemo(() => {
    const heading = cameraShip.rotation;
    const range = Math.max(40, layout.range);
    const list: Array<{
      id: string;
      kind: 'buoy' | 'ship';
      x: number;
      y: number;
      color: string;
      label: string;
    }> = [];

    for (const m of marks) {
      const def = getDefinition(m.definitionId);
      if (!def) continue;
      const r = distance(cameraShip.x, cameraShip.y, m.x, m.y);
      if (r > range) continue;
      const abs = bearingDeg(cameraShip.x, cameraShip.y, m.x, m.y);
      const rel = normalizeAngleDiff(abs - heading);
      // Heading-up: 0° = up (−Y). Clockwise positive like nautical relative bearing.
      const rad = (rel * Math.PI) / 180;
      const nx = Math.sin(rad) * (r / range);
      const ny = -Math.cos(rad) * (r / range);
      list.push({
        id: m.id,
        kind: 'buoy',
        x: nx,
        y: ny,
        color: BLIP[def.lightColour] ?? BLIP.none,
        label: m.label || def.name,
      });
    }

    for (const s of ships) {
      if (s.id === cameraShip.id) continue;
      const r = distance(cameraShip.x, cameraShip.y, s.x, s.y);
      if (r > range) continue;
      const abs = bearingDeg(cameraShip.x, cameraShip.y, s.x, s.y);
      const rel = normalizeAngleDiff(abs - heading);
      const rad = (rel * Math.PI) / 180;
      list.push({
        id: s.id,
        kind: 'ship',
        x: Math.sin(rad) * (r / range),
        y: -Math.cos(rad) * (r / range),
        color: s.color || '#94a3b8',
        label: s.label || s.shipType,
      });
    }

    return list;
  }, [cameraShip, marks, ships, layout.range]);

  const track = useMemo(() => {
    const pts = cameraShip.track ?? [];
    if (pts.length < 2) return [] as { x: number; y: number }[];
    const heading = cameraShip.rotation;
    const range = Math.max(40, layout.range);
    // Track relative to current ship pose (heading-up)
    return pts
      .map((p) => {
        const r = distance(cameraShip.x, cameraShip.y, p.x, p.y);
        if (r > range * 1.05) return null;
        const abs = bearingDeg(cameraShip.x, cameraShip.y, p.x, p.y);
        const rel = normalizeAngleDiff(abs - heading);
        const rad = (rel * Math.PI) / 180;
        return {
          x: Math.sin(rad) * (r / range),
          y: -Math.cos(rad) * (r / range),
        };
      })
      .filter((p): p is { x: number; y: number } => p != null);
  }, [cameraShip, layout.range]);

  const rings = Array.from({ length: layout.ringCount }, (_, i) => (i + 1) / layout.ringCount);
  const size = mode === 'full' ? 100 : 100;
  const cx = 50;
  const cy = 50;
  const maxR = 46;

  const toSvg = (nx: number, ny: number) => ({
    x: cx + nx * maxR,
    y: cy + ny * maxR,
  });

  const trackD =
    track.length >= 2
      ? track
          .map((p, i) => {
            const s = toSvg(p.x, p.y);
            return `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`;
          })
          .join(' ')
      : '';

  const phosphor = layout.phosphor;
  const bg = nightMode
    ? `radial-gradient(circle at 50% 50%, rgba(16,80,48,${0.55 + phosphor * 0.3}) 0%, #03140c 70%)`
    : `radial-gradient(circle at 50% 50%, rgba(20,90,55,${0.45 + phosphor * 0.25}) 0%, #052015 72%)`;

  return (
    <div
      className={`relative overflow-hidden ${mode === 'inset' ? 'pointer-events-none' : ''} ${className ?? ''}`}
      style={{
        ...style,
        borderRadius: layout.borderRadius,
        background: `rgba(8,12,10,${layout.bezelOpacity})`,
        boxShadow:
          mode === 'inset'
            ? 'inset 0 0 0 1px rgba(255,255,255,0.12), 0 8px 24px rgba(0,0,0,0.45)'
            : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
      aria-hidden={mode === 'inset'}
      aria-label={mode === 'full' ? 'Radar display' : undefined}
    >
      <div
        className="absolute"
        style={{
          inset: layout.screenInset,
          borderRadius: Math.max(4, layout.borderRadius - 4),
          background: bg,
          boxShadow: `inset 0 0 ${20 + phosphor * 30}px rgba(60,255,140,${0.15 + phosphor * 0.25})`,
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Crosshairs */}
          <line x1={cx} y1={4} x2={cx} y2={96} stroke="rgba(120,255,170,0.25)" strokeWidth={0.4} />
          <line x1={4} y1={cy} x2={96} y2={cy} stroke="rgba(120,255,170,0.25)" strokeWidth={0.4} />

          {rings.map((t) => (
            <circle
              key={t}
              cx={cx}
              cy={cy}
              r={maxR * t}
              fill="none"
              stroke="rgba(120,255,170,0.28)"
              strokeWidth={0.45}
            />
          ))}

          {trackD && (
            <path
              d={trackD}
              fill="none"
              stroke="rgba(100,200,255,0.55)"
              strokeWidth={0.7}
              strokeDasharray="1.5 1.2"
              strokeLinecap="round"
            />
          )}

          {blips.map((b) => {
            const p = toSvg(b.x, b.y);
            const r = b.kind === 'ship' ? 1.6 : 1.15;
            return (
              <g key={b.id}>
                <circle cx={p.x} cy={p.y} r={r * 2.2} fill={b.color} opacity={0.2} />
                <circle cx={p.x} cy={p.y} r={r} fill={b.color} stroke="rgba(0,0,0,0.35)" strokeWidth={0.25} />
              </g>
            );
          })}

          {/* Own ship — triangle pointing up (heading) */}
          <polygon
            points={`${cx},${cy - 3.2} ${cx - 2.2},${cy + 2.4} ${cx + 2.2},${cy + 2.4}`}
            fill="#e2e8f0"
            stroke="#2A61FA"
            strokeWidth={0.5}
          />
        </svg>

        <div className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/45 px-1 py-0.5 font-mono text-[8px] text-emerald-200/90 sm:text-[9px]">
          RNG {Math.round(layout.range)} · HDG {Math.round(((cameraShip.rotation % 360) + 360) % 360)}°
        </div>
      </div>
    </div>
  );
}
