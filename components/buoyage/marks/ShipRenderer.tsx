'use client';

import type { CanvasShip, ShipType } from '@/types/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';

const LABELS: Record<ShipType, string> = {
  own: 'Own',
  target: 'Tgt',
  tanker: 'Tkr',
  ferry: 'Fry',
};

export function ShipRenderer({
  ship,
  selected,
  activeCamera,
  onPointerDown,
}: {
  ship: CanvasShip;
  selected: boolean;
  activeCamera: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const camera = useBuoyageStore((s) => s.camera);
  const showCone = ship.shipType === 'own' || activeCamera;
  const halfFov = (ship.fov || 90) / 2;
  const r = 100;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const left = {
    x: Math.sin(toRad(-halfFov)) * r,
    y: -Math.cos(toRad(-halfFov)) * r,
  };
  const right = {
    x: Math.sin(toRad(halfFov)) * r,
    y: -Math.cos(toRad(halfFov)) * r,
  };

  const screenX = ship.x * camera.zoom + camera.x;
  const screenY = ship.y * camera.zoom + camera.y;
  const display = 72 * ship.scale * camera.zoom;
  const coneSize = 220 * ship.scale * camera.zoom;

  return (
    <div
      className="absolute origin-center select-none"
      style={{
        left: screenX,
        top: screenY,
        width: display,
        height: display,
        transform: `translate(-50%, -50%) rotate(${ship.rotation}deg)`,
        zIndex: ship.zIndex + (selected || activeCamera ? 10000 : 0),
        cursor: 'grab',
        touchAction: 'none',
      }}
      onPointerDown={(e) => onPointerDown(e, ship.id)}
      data-obj-id={ship.id}
    >
      {showCone && (
        <svg
          viewBox="-110 -110 220 220"
          width={coneSize}
          height={coneSize}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
          shapeRendering="geometricPrecision"
          aria-hidden
        >
          <path
            d={`M 0 0 L ${left.x} ${left.y} A ${r} ${r} 0 0 1 ${right.x} ${right.y} Z`}
            fill={activeCamera ? 'rgba(42,97,250,0.22)' : 'rgba(42,97,250,0.1)'}
            stroke={activeCamera ? '#2A61FA' : 'rgba(42,97,250,0.45)'}
            strokeWidth={1.5 / Math.max(camera.zoom, 0.4)}
          />
        </svg>
      )}
      {selected && (
        <div className="pointer-events-none absolute -inset-[8%] rounded-xl border-2 border-[#2A61FA]" />
      )}
      <svg
        viewBox="0 0 72 72"
        className="h-full w-full overflow-visible"
        shapeRendering="geometricPrecision"
        aria-hidden
      >
        <ellipse cx="36" cy="40" rx="10" ry="22" fill={ship.color} stroke="#0f172a" strokeWidth="1.5" />
        <polygon
          points="36,8 46,28 26,28"
          fill={ship.color}
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        {(ship.shipType === 'own' || activeCamera) && (
          <circle cx="36" cy="36" r="4" fill="#fff" opacity="0.95" />
        )}
      </svg>
      <div
        className="pointer-events-none absolute left-1/2 top-full mt-0.5 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 font-semibold text-white"
        style={{
          fontSize: Math.max(9, 9 * camera.zoom),
          transform: `translate(-50%, 0) rotate(${-ship.rotation}deg)`,
        }}
      >
        {ship.label || LABELS[ship.shipType]}
        {activeCamera ? ' · cam' : ''}
      </div>
    </div>
  );
}
