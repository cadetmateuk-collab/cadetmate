'use client';

import { useRef } from 'react';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import { MARK_HIT_SIZE } from '@/lib/buoyage/geometry';

type Props = {
  markId: string;
  hitSize?: number;
};

export function TransformHandles({ markId, hitSize = MARK_HIT_SIZE }: Props) {
  const mark = useBuoyageStore((s) => s.marks.find((m) => m.id === markId));
  const camera = useBuoyageStore((s) => s.camera);
  const historyPushed = useRef(false);

  if (!mark) return null;

  const screenX = mark.x * camera.zoom + camera.x;
  const screenY = mark.y * camera.zoom + camera.y;
  const half = (hitSize * mark.scale * camera.zoom) / 2;
  const visual = 12;
  const hit = 44;

  const bindDrag = (
    e: React.PointerEvent,
    onMove: (ev: PointerEvent) => void,
  ) => {
    e.stopPropagation();
    e.preventDefault();
    historyPushed.current = false;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    const move = (ev: PointerEvent) => {
      if (!historyPushed.current) {
        useBuoyageStore.getState().pushHistory();
        historyPushed.current = true;
      }
      onMove(ev);
    };
    const up = () => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', up);
      target.removeEventListener('pointercancel', up);
      historyPushed.current = false;
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', up);
    target.addEventListener('pointercancel', up);
  };

  const startRotate = (e: React.PointerEvent) => {
    const origin = { x: mark.x, y: mark.y };
    bindDrag(e, (ev) => {
      const store = useBuoyageStore.getState();
      const el = document.querySelector('[data-buoyage-canvas]') as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const wx = (ev.clientX - rect.left - store.camera.x) / store.camera.zoom;
      const wy = (ev.clientY - rect.top - store.camera.y) / store.camera.zoom;
      const angle = (Math.atan2(wy - origin.y, wx - origin.x) * 180) / Math.PI + 90;
      useBuoyageStore.getState().updateMark(markId, { rotation: Math.round(angle) }, false);
    });
  };

  const startScale = (e: React.PointerEvent, corner: 'se' | 'ne' | 'sw' | 'nw') => {
    const startScaleVal = mark.scale;
    const startDist = Math.hypot(half / camera.zoom, half / camera.zoom) || 1;
    bindDrag(e, (ev) => {
      const store = useBuoyageStore.getState();
      const el = document.querySelector('[data-buoyage-canvas]') as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const wx = (ev.clientX - rect.left - store.camera.x) / store.camera.zoom;
      const wy = (ev.clientY - rect.top - store.camera.y) / store.camera.zoom;
      const dist = Math.hypot(wx - mark.x, wy - mark.y);
      const next = Math.min(3, Math.max(0.4, (dist / startDist) * startScaleVal));
      useBuoyageStore.getState().updateMark(markId, { scale: Math.round(next * 100) / 100 }, false);
      void corner;
    });
  };

  const corners: Array<{ key: 'nw' | 'ne' | 'sw' | 'se'; x: number; y: number }> = [
    { key: 'nw', x: screenX - half, y: screenY - half },
    { key: 'ne', x: screenX + half, y: screenY - half },
    { key: 'sw', x: screenX - half, y: screenY + half },
    { key: 'se', x: screenX + half, y: screenY + half },
  ];

  return (
    <div className="pointer-events-none absolute left-0 top-0 z-[20000]">
      <div
        className="absolute border-2 border-[#2A61FA]/80"
        style={{
          left: screenX - half - 6,
          top: screenY - half - 6,
          width: half * 2 + 12,
          height: half * 2 + 12,
          borderRadius: 8,
        }}
      />
      {corners.map((c) => (
        <div
          key={c.key}
          className="pointer-events-auto absolute flex items-center justify-center touch-manipulation"
          style={{
            left: c.x,
            top: c.y,
            width: hit,
            height: hit,
            transform: 'translate(-50%, -50%)',
            cursor: c.key === 'se' || c.key === 'nw' ? 'nwse-resize' : 'nesw-resize',
          }}
          onPointerDown={(e) => startScale(e, c.key)}
        >
          <div
            className="rounded-sm border-2 border-[#2A61FA] bg-white shadow"
            style={{ width: visual, height: visual }}
          />
        </div>
      ))}
      <div
        className="pointer-events-auto absolute touch-manipulation"
        style={{
          left: screenX,
          top: screenY - half - 36,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="mx-auto h-5 w-px bg-[#2A61FA]" />
        <button
          type="button"
          aria-label="Rotate"
          className="mt-0 flex h-11 w-11 items-center justify-center rounded-full"
          onPointerDown={startRotate}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2A61FA] bg-white shadow" />
        </button>
      </div>
    </div>
  );
}
