'use client';

import type { CanvasShip } from '@/types/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';

/** Persistent own-ship track on the plan (screen-space SVG). */
export function ShipTrackRenderer({ ship }: { ship: CanvasShip }) {
  const camera = useBuoyageStore((s) => s.camera);
  const track = ship.track ?? [];
  if (track.length < 2) return null;

  const pts = track.map((p) => ({
    x: p.x * camera.zoom + camera.x,
    y: p.y * camera.zoom + camera.y,
  }));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = 4;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`).join(' ');

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: minX,
        top: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
        zIndex: 1,
      }}
    >
      <svg
        width={Math.max(1, maxX - minX)}
        height={Math.max(1, maxY - minY)}
        className="overflow-visible"
        shapeRendering="geometricPrecision"
      >
        <path
          d={d}
          fill="none"
          stroke={ship.color}
          strokeOpacity={0.85}
          strokeWidth={Math.max(1.5, 2.5 * camera.zoom)}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${5 * camera.zoom} ${4 * camera.zoom}`}
        />
      </svg>
    </div>
  );
}
