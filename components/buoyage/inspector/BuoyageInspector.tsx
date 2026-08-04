'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { getDefinition } from '@/data/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-[#2A61FA] focus:ring-2 focus:ring-[#2A61FA]/20';

export function BuoyageInspector({
  variant = 'dock',
  onClose,
}: {
  variant?: 'dock' | 'sheet';
  onClose?: () => void;
}) {
  const selectedIds = useBuoyageStore((s) => s.selectedIds);
  const marks = useBuoyageStore((s) => s.marks);
  const ships = useBuoyageStore((s) => s.ships);
  const notes = useBuoyageStore((s) => s.notes);
  const paths = useBuoyageStore((s) => s.paths);
  const updateMark = useBuoyageStore((s) => s.updateMark);
  const updateShip = useBuoyageStore((s) => s.updateShip);
  const updateNote = useBuoyageStore((s) => s.updateNote);
  const updatePath = useBuoyageStore((s) => s.updatePath);

  const id = selectedIds.length === 1 ? selectedIds[0] : null;
  const mark = id ? marks.find((m) => m.id === id) : null;
  const ship = id ? ships.find((m) => m.id === id) : null;
  const note = id ? notes.find((m) => m.id === id) : null;
  const path = id ? paths.find((m) => m.id === id) : null;
  const def = mark ? getDefinition(mark.definitionId) : null;

  const shell =
    variant === 'sheet'
      ? 'flex max-h-[min(70dvh,520px)] w-full flex-col rounded-t-2xl border-t border-black/10 bg-white shadow-2xl'
      : 'hidden h-full w-72 shrink-0 flex-col border-l border-black/10 bg-white/95 backdrop-blur-md xl:flex';

  return (
    <aside className={shell}>
      <div className="flex items-start justify-between border-b border-black/5 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Inspector</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {selectedIds.length === 0
              ? 'Select an object'
              : selectedIds.length > 1
                ? `${selectedIds.length} selected`
                : 'Edit properties'}
          </p>
        </div>
        {variant === 'sheet' && onClose && (
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 touch-manipulation"
            aria-label="Close inspector"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex gap-2 border-b border-black/5 px-4 py-2">
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 touch-manipulation"
            onClick={() => useBuoyageStore.getState().duplicateSelected()}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="min-h-11 flex-1 rounded-xl bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100 touch-manipulation"
            onClick={() => {
              useBuoyageStore.getState().deleteSelected();
              onClose?.();
            }}
          >
            Delete
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {mark && def ? (
          <motion.div
            key={mark.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">{def.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{def.description}</p>
            </div>
            <Field label="Label">
              <input
                className={fieldClass}
                value={mark.label ?? ''}
                onChange={(e) => updateMark(mark.id, { label: e.target.value }, false)}
              />
            </Field>
            <Field label={`Rotation (${Math.round(mark.rotation)}°)`}>
              <input
                type="range"
                min={-180}
                max={180}
                value={mark.rotation}
                onChange={(e) => updateMark(mark.id, { rotation: Number(e.target.value) }, false)}
                className="w-full accent-[#2A61FA]"
              />
            </Field>
            <Field label={`Scale (${mark.scale.toFixed(2)})`}>
              <input
                type="range"
                min={0.4}
                max={3}
                step={0.05}
                value={mark.scale}
                onChange={(e) => updateMark(mark.id, { scale: Number(e.target.value) }, false)}
                className="w-full accent-[#2A61FA]"
              />
            </Field>
            <Field label="Night Mode Override">
              <select
                className={fieldClass}
                value={
                  mark.nightMode === true ? 'night' : mark.nightMode === false ? 'day' : 'global'
                }
                onChange={(e) => {
                  const v = e.target.value;
                  updateMark(
                    mark.id,
                    { nightMode: v === 'global' ? null : v === 'night' },
                    false,
                  );
                }}
              >
                <option value="global">Follow global</option>
                <option value="day">Force day</option>
                <option value="night">Force night</option>
              </select>
            </Field>
            <Field label="Light Characteristic">
              <input
                className={fieldClass}
                value={mark.lightCharacteristicOverride ?? def.lightCharacteristic}
                onChange={(e) =>
                  updateMark(mark.id, { lightCharacteristicOverride: e.target.value }, false)
                }
              />
            </Field>
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600">
              <Row label="Flash" value={def.lightCharacteristic} />
              <Row label="Period" value={`${def.periodSec}s`} />
              <Row label="Light" value={def.lightColour} />
              <Row label="Topmark" value={def.topmark ?? '—'} />
            </div>
            <Field label="Notes">
              <textarea
                className={`${fieldClass} min-h-[80px] resize-y`}
                value={mark.notes ?? ''}
                onChange={(e) => updateMark(mark.id, { notes: e.target.value }, false)}
              />
            </Field>
          </motion.div>
        ) : ship ? (
          <motion.div
            key={ship.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            <p className="text-sm font-semibold">Ship / bridge camera</p>
            <p className="text-[11px] text-slate-500">
              Heading drives the bridge horizon view. Own ships show a FOV cone on the plan.
            </p>
            <Field label="Label">
              <input
                className={fieldClass}
                value={ship.label ?? ''}
                onChange={(e) => updateShip(ship.id, { label: e.target.value }, false)}
              />
            </Field>
            <Field label="Type">
              <select
                className={fieldClass}
                value={ship.shipType}
                onChange={(e) =>
                  updateShip(ship.id, { shipType: e.target.value as typeof ship.shipType }, false)
                }
              >
                <option value="own">Own ship</option>
                <option value="target">Target</option>
                <option value="tanker">Tanker</option>
                <option value="ferry">Ferry</option>
              </select>
            </Field>
            <Field label={`Heading (${Math.round(ship.rotation)}°)`}>
              <input
                type="range"
                min={0}
                max={359}
                value={((ship.rotation % 360) + 360) % 360}
                onChange={(e) => updateShip(ship.id, { rotation: Number(e.target.value) }, false)}
                className="w-full accent-[#2A61FA]"
              />
            </Field>
            <Field label={`Field of view (${ship.fov ?? 90}°)`}>
              <input
                type="range"
                min={40}
                max={140}
                value={ship.fov ?? 90}
                onChange={(e) => updateShip(ship.id, { fov: Number(e.target.value) }, false)}
                className="w-full accent-[#2A61FA]"
              />
            </Field>
            <Field label={`Throttle (${((ship.throttle ?? 0) * 100).toFixed(0)}%)`}>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={ship.throttle ?? 0}
                onChange={(e) => updateShip(ship.id, { throttle: Number(e.target.value) }, false)}
                className="w-full accent-[#2A61FA]"
              />
            </Field>
            <Field label={`Rudder (${((ship.rudder ?? 0) * 100).toFixed(0)}%)`}>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={ship.rudder ?? 0}
                onChange={(e) => updateShip(ship.id, { rudder: Number(e.target.value) }, false)}
                className="w-full accent-emerald-500"
              />
            </Field>
            <button
              type="button"
              className="min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 touch-manipulation"
              onClick={() => useBuoyageStore.getState().clearShipTrack(ship.id)}
            >
              Clear track ({ship.track?.length ?? 0} pts)
            </button>
            <Field label={`Scale (${ship.scale.toFixed(2)})`}>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.05}
                value={ship.scale}
                onChange={(e) => updateShip(ship.id, { scale: Number(e.target.value) }, false)}
                className="w-full accent-[#2A61FA]"
              />
            </Field>
            <button
              type="button"
              className="min-h-11 w-full rounded-xl bg-[#2A61FA] px-3 py-2.5 text-xs font-semibold text-white touch-manipulation"
              onClick={() => {
                useBuoyageStore.getState().setActiveShipId(ship.id);
                useBuoyageStore.getState().setViewMode('split');
              }}
            >
              Open bridge view
            </button>
          </motion.div>
        ) : note ? (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            <p className="text-sm font-semibold">Teaching note</p>
            <Field label="Text">
              <textarea
                className={`${fieldClass} min-h-[120px] resize-y`}
                value={note.text}
                onChange={(e) => updateNote(note.id, { text: e.target.value }, false)}
              />
            </Field>
            <Field label="Colour">
              <input
                type="color"
                className="h-9 w-full cursor-pointer rounded-lg border border-slate-200"
                value={note.color}
                onChange={(e) => updateNote(note.id, { color: e.target.value }, false)}
              />
            </Field>
          </motion.div>
        ) : path ? (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
          >
            <p className="text-sm font-semibold">Ink</p>
            <Field label="Label">
              <input
                className={fieldClass}
                value={path.label ?? ''}
                onChange={(e) => updatePath(path.id, { label: e.target.value }, false)}
              />
            </Field>
            <Field label="Colour">
              <input
                type="color"
                className="h-9 w-full cursor-pointer rounded-lg border border-slate-200"
                value={path.color}
                onChange={(e) => updatePath(path.id, { color: e.target.value }, false)}
              />
            </Field>
            <Field label="Thickness">
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                className="w-full accent-slate-800"
                value={path.strokeWidth}
                onChange={(e) =>
                  updatePath(path.id, { strokeWidth: Number(e.target.value) }, false)
                }
              />
            </Field>
            <p className="text-[11px] text-slate-400">Select + Delete, or use the eraser tool.</p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-1 items-center justify-center px-6 text-center text-xs text-slate-400"
          >
            {selectedIds.length > 1
              ? 'Multi-select active — move, duplicate, or delete together.'
              : 'Select a buoy, ship, note, or ink stroke.'}
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value}</span>
    </div>
  );
}
