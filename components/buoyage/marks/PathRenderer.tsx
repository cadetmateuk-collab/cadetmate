'use client';

import type { CanvasPath } from '@/types/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';

export function PathRenderer({
  path,
  selected,
  onPointerDown,
}: {
  path: CanvasPath;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const camera = useBuoyageStore((s) => s.camera);
  if (path.points.length < 1) return null;

  const toScreen = (p: { x: number; y: number }) => ({
    x: p.x * camera.zoom + camera.x,
    y: p.y * camera.zoom + camera.y,
  });

  const screenPts = path.points.map(toScreen);
  const xs = screenPts.map((p) => p.x);
  const ys = screenPts.map((p) => p.y);
  const pad = 12;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const maxX = Math.max(...xs) + pad;
  const maxY = Math.max(...ys) + pad;
  const d = screenPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x - minX} ${p.y - minY}`)
    .join(' ');

  const strokeW = path.strokeWidth * camera.zoom;

  return (
    <div
      className="absolute"
      style={{
        left: minX,
        top: minY,
        width: maxX - minX,
        height: maxY - minY,
        zIndex: path.zIndex + (selected ? 10000 : 0),
        touchAction: 'none',
      }}
      onPointerDown={(e) => onPointerDown(e, path.id)}
      data-obj-id={path.id}
    >
      <svg
        width={maxX - minX}
        height={maxY - minY}
        className="overflow-visible"
        shapeRendering="geometricPrecision"
      >
        {selected && (
          <path
            d={d}
            fill="none"
            stroke="#2A61FA"
            strokeWidth={strokeW + 4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
          />
        )}
        <path
          d={d}
          fill="none"
          stroke={path.color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={
            path.dashed ? `${8 * camera.zoom} ${6 * camera.zoom}` : undefined
          }
        />
      </svg>
      {path.label && (
        <div
          className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-1 text-white"
          style={{ fontSize: Math.max(9, 9 * camera.zoom) }}
        >
          {path.label}
        </div>
      )}
    </div>
  );
}
