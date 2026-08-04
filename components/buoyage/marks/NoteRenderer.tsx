'use client';

import type { CanvasNote } from '@/types/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';

export function NoteRenderer({
  note,
  selected,
  onPointerDown,
}: {
  note: CanvasNote;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}) {
  const updateNote = useBuoyageStore((s) => s.updateNote);
  const camera = useBuoyageStore((s) => s.camera);

  const screenX = note.x * camera.zoom + camera.x;
  const screenY = note.y * camera.zoom + camera.y;
  const w = note.width * camera.zoom;
  const h = note.height * camera.zoom;

  return (
    <div
      className="absolute select-none rounded-lg shadow-md"
      style={{
        left: screenX,
        top: screenY,
        width: w,
        height: h,
        background: note.color,
        zIndex: note.zIndex + (selected ? 10000 : 0),
        boxShadow: selected
          ? '0 0 0 2px #2A61FA, 0 8px 20px rgba(0,0,0,0.15)'
          : '0 4px 14px rgba(0,0,0,0.12)',
        touchAction: 'none',
        fontSize: Math.max(10, 12 * camera.zoom),
      }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
        onPointerDown(e, note.id);
      }}
      data-obj-id={note.id}
    >
      <div
        className="flex items-center justify-between border-b border-black/10 px-2"
        style={{ height: Math.max(16, 20 * camera.zoom) }}
      >
        <span className="font-bold uppercase tracking-wide text-black/50" style={{ fontSize: '0.75em' }}>
          Note
        </span>
      </div>
      <textarea
        className="w-full resize-none bg-transparent px-2 py-1 leading-snug text-slate-800 outline-none"
        style={{ height: `calc(100% - ${Math.max(16, 20 * camera.zoom)}px)`, fontSize: 'inherit' }}
        value={note.text}
        onChange={(e) => updateNote(note.id, { text: e.target.value }, false)}
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}
