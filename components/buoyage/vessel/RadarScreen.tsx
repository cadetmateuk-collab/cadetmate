'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getDefinition } from '@/data/buoyage';
import { bearingDeg, distance, normalizeAngleDiff } from '@/lib/buoyage/geometry';
import type { RadarLayout } from '@/lib/buoyage/radar-layout';
import {
  DEFAULT_RADAR_SETTINGS,
  formatRangeNm,
  rangeNmToWorld,
  trailSampleCap,
  type RadarDisplaySettings,
} from '@/lib/buoyage/radar-settings';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import type { CanvasShip } from '@/types/buoyage';

const TARGET_COLOR = '#8dffb5';
const TRAIL_COLOR = '#6fd99a';
const NOISE_RGB = '90, 255, 140';

const TRAIL_SAMPLE_MS = 280;
/** Full 360° rotation period (ms) */
const SWEEP_PERIOD_MS = 2400;

type Props = {
  cameraShip: CanvasShip;
  layout: RadarLayout;
  mode: 'inset' | 'full';
  className?: string;
  style?: React.CSSProperties;
  settings?: RadarDisplaySettings;
};

type TrailPt = { x: number; y: number };
type WorldTrailPt = { wx: number; wy: number };

type Blip = {
  id: string;
  kind: 'buoy' | 'ship';
  x: number;
  y: number;
  wx: number;
  wy: number;
  label: string;
};

function projectWorld(
  ox: number,
  oy: number,
  heading: number,
  wx: number,
  wy: number,
  range: number,
): TrailPt | null {
  const r = distance(ox, oy, wx, wy);
  if (r > range * 1.05) return null;
  const abs = bearingDeg(ox, oy, wx, wy);
  const rel = normalizeAngleDiff(abs - heading);
  const rad = (rel * Math.PI) / 180;
  return {
    x: Math.sin(rad) * (r / range),
    y: -Math.cos(rad) * (r / range),
  };
}

/**
 * Heading-up PPI radar with operator controls, rotating sweep,
 * sparse green clutter, and configurable trails.
 */
export function RadarScreen({
  cameraShip,
  layout,
  mode,
  className,
  style,
  settings = DEFAULT_RADAR_SETTINGS,
}: Props) {
  const marks = useBuoyageStore((s) => s.marks);
  const ships = useBuoyageStore((s) => s.ships);
  const nightMode = useBuoyageStore((s) => s.nightMode);

  const rmTrailsRef = useRef<Map<string, TrailPt[]>>(new Map());
  const tmTrailsRef = useRef<Map<string, WorldTrailPt[]>>(new Map());
  const [trailTick, setTrailTick] = useState(0);
  const lastSample = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const persistRef = useRef<HTMLCanvasElement | null>(null);
  const sweepRef = useRef(0);
  const rafRef = useRef(0);

  const range = rangeNmToWorld(settings.rangeNm);
  const trailCap = trailSampleCap(settings.trailLength);
  const wantRm =
    trailCap > 0 && (settings.trailMode === 'relative' || settings.trailMode === 'both');
  const wantTm =
    trailCap > 0 && (settings.trailMode === 'true' || settings.trailMode === 'both');

  const blips = useMemo(() => {
    const heading = cameraShip.rotation;
    const list: Blip[] = [];

    for (const m of marks) {
      const def = getDefinition(m.definitionId);
      if (!def) continue;
      const r = distance(cameraShip.x, cameraShip.y, m.x, m.y);
      if (r > range) continue;
      const abs = bearingDeg(cameraShip.x, cameraShip.y, m.x, m.y);
      const rel = normalizeAngleDiff(abs - heading);
      const rad = (rel * Math.PI) / 180;
      list.push({
        id: m.id,
        kind: 'buoy',
        x: Math.sin(rad) * (r / range),
        y: -Math.cos(rad) * (r / range),
        wx: m.x,
        wy: m.y,
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
        wx: s.x,
        wy: s.y,
        label: s.label || s.shipType,
      });
    }

    return list;
  }, [cameraShip, marks, ships, range]);

  // Sample trails
  useEffect(() => {
    if (!wantRm && !wantTm) {
      rmTrailsRef.current.clear();
      tmTrailsRef.current.clear();
      return;
    }
    const now = performance.now();
    if (now - lastSample.current < TRAIL_SAMPLE_MS) return;
    lastSample.current = now;

    const nextIds = new Set(blips.map((b) => b.id));
    for (const id of [...rmTrailsRef.current.keys()]) {
      if (!nextIds.has(id)) rmTrailsRef.current.delete(id);
    }
    for (const id of [...tmTrailsRef.current.keys()]) {
      if (!nextIds.has(id)) tmTrailsRef.current.delete(id);
    }

    for (const b of blips) {
      if (wantRm) {
        const prev = rmTrailsRef.current.get(b.id) ?? [];
        const last = prev[prev.length - 1];
        if (!(last && Math.hypot(last.x - b.x, last.y - b.y) < 0.004)) {
          const updated = [...prev, { x: b.x, y: b.y }];
          if (updated.length > trailCap) updated.splice(0, updated.length - trailCap);
          rmTrailsRef.current.set(b.id, updated);
        }
      }
      if (wantTm) {
        const prev = tmTrailsRef.current.get(b.id) ?? [];
        const last = prev[prev.length - 1];
        if (!(last && Math.hypot(last.wx - b.wx, last.wy - b.wy) < 0.8)) {
          const updated = [...prev, { wx: b.wx, wy: b.wy }];
          if (updated.length > trailCap) updated.splice(0, updated.length - trailCap);
          tmTrailsRef.current.set(b.id, updated);
        }
      }
    }
    setTrailTick((n) => n + 1);
  }, [blips, wantRm, wantTm, trailCap, cameraShip.x, cameraShip.y, cameraShip.rotation]);

  // Clear trails when settings change length/mode
  useEffect(() => {
    if (!wantRm) rmTrailsRef.current.clear();
    if (!wantTm) tmTrailsRef.current.clear();
  }, [wantRm, wantTm, trailCap]);

  const ownTrack = useMemo(() => {
    const pts = cameraShip.track ?? [];
    if (pts.length < 2) return [] as TrailPt[];
    const heading = cameraShip.rotation;
    return pts
      .map((p) => projectWorld(cameraShip.x, cameraShip.y, heading, p.x, p.y, range))
      .filter((p): p is TrailPt => p != null);
  }, [cameraShip, range]);

  const size = 100;
  const cx = 50;
  const cy = 50;
  const maxR = 46;

  const toSvg = (nx: number, ny: number) => ({
    x: cx + nx * maxR,
    y: cy + ny * maxR,
  });

  const ringCount = Math.max(1, Math.min(8, Math.round(settings.ringCount)));
  const rings = settings.showRangeRings
    ? Array.from({ length: ringCount }, (_, i) => (i + 1) / ringCount)
    : [];

  const ownTrackD =
    ownTrack.length >= 2
      ? ownTrack
          .map((p, i) => {
            const s = toSvg(p.x, p.y);
            return `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`;
          })
          .join(' ')
      : '';

  const relativeTrailPaths = useMemo(() => {
    void trailTick;
    if (!wantRm) return [] as Array<{ id: string; d: string }>;
    const out: Array<{ id: string; d: string }> = [];
    for (const b of blips) {
      const pts = rmTrailsRef.current.get(b.id);
      if (!pts || pts.length < 2) continue;
      const d = pts
        .map((p, i) => {
          const s = toSvg(p.x, p.y);
          return `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`;
        })
        .join(' ');
      out.push({ id: b.id, d });
    }
    return out;
  }, [blips, wantRm, trailTick]);

  const trueTrailPaths = useMemo(() => {
    void trailTick;
    if (!wantTm) return [] as Array<{ id: string; d: string }>;
    const heading = cameraShip.rotation;
    const out: Array<{ id: string; d: string }> = [];
    for (const b of blips) {
      const pts = tmTrailsRef.current.get(b.id);
      if (!pts || pts.length < 2) continue;
      const projected = pts
        .map((p) => projectWorld(cameraShip.x, cameraShip.y, heading, p.wx, p.wy, range))
        .filter((p): p is TrailPt => p != null);
      if (projected.length < 2) continue;
      const d = projected
        .map((p, i) => {
          const s = toSvg(p.x, p.y);
          return `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`;
        })
        .join(' ');
      out.push({ id: b.id, d });
    }
    return out;
  }, [blips, wantTm, trailTick, cameraShip.x, cameraShip.y, cameraShip.rotation, range]);

  // Sweep + sparse green noise (targets stay steady on SVG)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let last = performance.now();

    const ensurePersist = (w: number, h: number) => {
      if (!persistRef.current) {
        persistRef.current = document.createElement('canvas');
      }
      const p = persistRef.current;
      if (p.width !== w || p.height !== h) {
        p.width = w;
        p.height = h;
      }
      return p;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sweepRef.current = (sweepRef.current + (360 * dt * 1000) / SWEEP_PERIOD_MS) % 360;

      const parent = canvas.parentElement;
      const rect = parent?.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const cssW = Math.max(1, rect?.width ?? canvas.clientWidth);
      const cssH = Math.max(1, rect?.height ?? canvas.clientHeight);
      const w = Math.round(cssW * dpr);
      const h = Math.round(cssH * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const persist = ensurePersist(w, h);
      const pctx = persist.getContext('2d')!;
      const cxPx = w / 2;
      const cyPx = h / 2;
      const radius = Math.min(w, h) * 0.46;

      // Fade old noise
      pctx.globalCompositeOperation = 'source-over';
      pctx.fillStyle = 'rgba(0, 8, 4, 0.06)';
      pctx.fillRect(0, 0, w, h);

      const sweep = sweepRef.current;
      const prevSweep = (sweep - (360 * dt * 1000) / SWEEP_PERIOD_MS + 360) % 360;
      const gain = settings.gain;
      const noiseAmt = settings.noise;

      pctx.save();
      pctx.beginPath();
      pctx.arc(cxPx, cyPx, radius, 0, Math.PI * 2);
      pctx.clip();

      // Sparse green clutter under the beam — random hits here and there
      if (noiseAmt > 0.02) {
        let delta = sweep - prevSweep;
        if (delta < 0) delta += 360;
        const start = ((prevSweep - 90) * Math.PI) / 180;
        const span = (delta * Math.PI) / 180;

        pctx.save();
        pctx.beginPath();
        pctx.moveTo(cxPx, cyPx);
        pctx.arc(cxPx, cyPx, radius, start, start + Math.max(span, 0.01), false);
        pctx.closePath();
        pctx.clip();

        const density = Math.floor(2 + noiseAmt * 14 * (0.5 + gain * 0.5));
        for (let i = 0; i < density; i++) {
          if (Math.random() > 0.45 + noiseAmt * 0.4) continue;
          const a = start + Math.random() * Math.max(span, 0.01);
          const rr = Math.sqrt(Math.random()) * radius;
          const x = cxPx + Math.cos(a) * rr;
          const y = cyPx + Math.sin(a) * rr;
          const alpha = (0.18 + Math.random() * 0.35) * (0.45 + noiseAmt * 0.55);
          pctx.fillStyle = `rgba(${NOISE_RGB}, ${alpha})`;
          const sz = dpr * (0.8 + Math.random() * 1.4);
          pctx.fillRect(x, y, sz, sz);
        }

        // Occasional slightly larger false echo
        if (Math.random() < 0.08 * noiseAmt) {
          const a = start + Math.random() * Math.max(span, 0.01);
          const rr = Math.sqrt(Math.random()) * radius;
          const x = cxPx + Math.cos(a) * rr;
          const y = cyPx + Math.sin(a) * rr;
          pctx.fillStyle = `rgba(${NOISE_RGB}, ${0.35 + Math.random() * 0.25})`;
          pctx.beginPath();
          pctx.arc(x, y, dpr * (1.2 + Math.random()), 0, Math.PI * 2);
          pctx.fill();
        }
        pctx.restore();
      }
      pctx.restore();

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cxPx, cyPx, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(persist, 0, 0);

      const beamStart = ((sweep - 90) * Math.PI) / 180;
      const beamWide = 0.1;
      const grad = ctx.createRadialGradient(cxPx, cyPx, 0, cxPx, cyPx, radius);
      grad.addColorStop(0, 'rgba(120,255,170,0.22)');
      grad.addColorStop(0.55, 'rgba(80,255,140,0.1)');
      grad.addColorStop(1, 'rgba(60,255,120,0)');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cxPx, cyPx);
      ctx.arc(cxPx, cyPx, radius, beamStart - beamWide, beamStart, false);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(180,255,210,0.7)';
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(cxPx, cyPx);
      ctx.lineTo(cxPx + Math.cos(beamStart) * radius, cyPx + Math.sin(beamStart) * radius);
      ctx.stroke();
      ctx.restore();
      ctx.restore();

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [settings.gain, settings.noise]);

  const phosphor = layout.phosphor;
  const bg = nightMode
    ? `radial-gradient(circle at 50% 50%, rgba(16,80,48,${0.55 + phosphor * 0.3}) 0%, #03140c 70%)`
    : `radial-gradient(circle at 50% 50%, rgba(20,90,55,${0.45 + phosphor * 0.25}) 0%, #052015 72%)`;

  const headingLen = Math.max(0.2, Math.min(1, settings.headingLineLength));
  const trailHud =
    settings.trailLength === 'off'
      ? ''
      : settings.trailMode === 'both'
        ? ' · RM+TM'
        : settings.trailMode === 'true'
          ? ' · TM trails'
          : ' · RM trails';

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
        className="absolute overflow-hidden"
        style={{
          inset: layout.screenInset,
          borderRadius: Math.max(4, layout.borderRadius - 4),
          background: bg,
          boxShadow: `inset 0 0 ${20 + phosphor * 30}px rgba(60,255,140,${0.15 + phosphor * 0.25})`,
        }}
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        />

        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="relative h-full w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Crosshair */}
          <line x1={cx} y1={4} x2={cx} y2={96} stroke="rgba(120,255,170,0.18)" strokeWidth={0.35} />
          <line x1={4} y1={cy} x2={96} y2={cy} stroke="rgba(120,255,170,0.18)" strokeWidth={0.35} />

          {rings.map((t, i) => (
            <g key={t}>
              <circle
                cx={cx}
                cy={cy}
                r={maxR * t}
                fill="none"
                stroke="rgba(120,255,170,0.28)"
                strokeWidth={0.45}
              />
              {mode === 'full' && (
                <text
                  x={cx + 1.2}
                  y={cy - maxR * t + 2.2}
                  fill="rgba(140,255,180,0.55)"
                  fontSize={2.4}
                  fontFamily="ui-monospace, monospace"
                >
                  {formatRangeNm((settings.rangeNm * (i + 1)) / ringCount)}
                </text>
              )}
            </g>
          ))}

          {settings.headingLine && (
            <line
              x1={cx}
              y1={cy}
              x2={cx}
              y2={cy - maxR * headingLen}
              stroke="rgba(200,255,220,0.85)"
              strokeWidth={0.7}
              strokeLinecap="round"
            />
          )}

          {ownTrackD && (
            <path
              d={ownTrackD}
              fill="none"
              stroke="rgba(100,200,255,0.5)"
              strokeWidth={0.65}
              strokeDasharray="1.5 1.2"
              strokeLinecap="round"
            />
          )}

          {trueTrailPaths.map((t) => (
            <path
              key={`tm-${t.id}`}
              d={t.d}
              fill="none"
              stroke={TRAIL_COLOR}
              strokeWidth={0.7}
              strokeOpacity={0.4}
              strokeDasharray="1.2 1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {relativeTrailPaths.map((t) => (
            <path
              key={`rm-${t.id}`}
              d={t.d}
              fill="none"
              stroke={TRAIL_COLOR}
              strokeWidth={0.85}
              strokeOpacity={0.55}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {blips.map((b) => {
            const p = toSvg(b.x, b.y);
            const r = b.kind === 'ship' ? 1.55 : 1.1;
            return (
              <g key={b.id}>
                <circle cx={p.x} cy={p.y} r={r * 2} fill={TARGET_COLOR} opacity={0.22} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={TARGET_COLOR}
                  stroke="rgba(0,0,0,0.35)"
                  strokeWidth={0.25}
                />
              </g>
            );
          })}

          <polygon
            points={`${cx},${cy - 3.2} ${cx - 2.2},${cy + 2.4} ${cx + 2.2},${cy + 2.4}`}
            fill="#e2e8f0"
            stroke="#2A61FA"
            strokeWidth={0.5}
          />
        </svg>

        <div className="pointer-events-none absolute left-1.5 top-1.5 rounded bg-black/45 px-1 py-0.5 font-mono text-[8px] text-emerald-200/90 sm:text-[9px]">
          RNG {formatRangeNm(settings.rangeNm)} NM · HDG{' '}
          {Math.round(((cameraShip.rotation % 360) + 360) % 360)}°
          {trailHud}
        </div>
      </div>
    </div>
  );
}
