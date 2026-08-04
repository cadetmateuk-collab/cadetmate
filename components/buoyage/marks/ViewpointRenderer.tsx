'use client';

import type { CanvasViewpoint } from '@/types/buoyage';

export function ViewpointRenderer({
  viewpoint,
  selected,
  active,
  onPointerDown,
}: {
  viewpoint: CanvasViewpoint;
  selected: boolean;
  active: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const halfFov = viewpoint.fov / 2;
  const r = 90;

  // FOV wedge in local coords: heading 0 = up
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const left = {
    x: Math.sin(toRad(-halfFov)) * r,
    y: -Math.cos(toRad(-halfFov)) * r,
  };
  const right = {
    x: Math.sin(toRad(halfFov)) * r,
    y: -Math.cos(toRad(halfFov)) * r,
  };

  return (
    <div
      className="absolute origin-center select-none"
      style={{
        left: viewpoint.x,
        top: viewpoint.y,
        transform: `translate(-50%, -50%) rotate(${viewpoint.heading}deg)`,
        zIndex: viewpoint.zIndex + (selected || active ? 10000 : 0),
        cursor: 'grab',
        touchAction: 'none',
      }}
      onPointerDown={(e) => onPointerDown(e, viewpoint.id)}
      data-obj-id={viewpoint.id}
    >
      <svg width="200" height="200" viewBox="-100 -100 200 200" className="overflow-visible" aria-hidden>
        <path
          d={`M 0 0 L ${left.x} ${left.y} A ${r} ${r} 0 0 1 ${right.x} ${right.y} Z`}
          fill={active ? 'rgba(42,97,250,0.22)' : 'rgba(42,97,250,0.12)'}
          stroke={selected || active ? '#2A61FA' : 'rgba(42,97,250,0.5)'}
          strokeWidth="1.5"
        />
        <circle
          cx="0"
          cy="0"
          r="10"
          fill={active ? '#2A61FA' : '#1e293b'}
          stroke="#fff"
          strokeWidth="2"
        />
        <line x1="0" y1="0" x2="0" y2="-28" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div
        className="pointer-events-none absolute left-1/2 top-[70%] -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold text-white"
        style={{ transform: `translate(-50%, 0) rotate(${-viewpoint.heading}deg)` }}
      >
        {viewpoint.label || 'Vessel cam'}
      </div>
    </div>
  );
}
