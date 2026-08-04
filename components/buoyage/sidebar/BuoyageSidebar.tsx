'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { getDefinition, getSidebarCategories } from '@/data/buoyage';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import { DND_TYPE, setMarkDragGhost } from '@/components/buoyage/dnd';
import { MarkVisual } from '@/components/buoyage/marks/MarkVisual';
import type { BuoyDefinition, SidebarCategory } from '@/types/buoyage';

type ShapeKey = 'can' | 'cone' | 'pillar' | 'spar';

function shapeFromId(id: string): ShapeKey | null {
  const m = id.match(/-(can|cone|pillar|spar)-/);
  return (m?.[1] as ShapeKey) ?? null;
}

function shapeLabel(shape: ShapeKey) {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

function isPortish(id: string) {
  return id.includes('-port-') || id.includes('preferred-port-');
}

function isStarboardish(id: string) {
  return id.includes('-starboard-') || id.includes('preferred-starboard-');
}

function shortTitle(def: BuoyDefinition) {
  const shape = shapeFromId(def.id);
  if (shape) return shapeLabel(shape);
  return def.name
    .replace(/\s*\(Region [AB]\)$/i, '')
    .replace(/\s*\([AB]\)$/i, '')
    .replace(/^Preferred Channel to /i, 'Pref. ')
    .replace(/ Hand$/i, '');
}

function MarkThumb({
  def,
  active,
  onPick,
  compact,
}: {
  def: BuoyDefinition;
  active: boolean;
  onPick: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      aria-pressed={active}
      aria-label={def.name}
      title={`${def.name} · ${def.lightCharacteristic}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick(def.id);
        }
      }}
      onClick={() => onPick(def.id)}
      onDragStart={(e) => {
        e.dataTransfer.setData(DND_TYPE, def.id);
        e.dataTransfer.effectAllowed = 'copy';
        setMarkDragGhost(e, {
          imageSrc: def.imageDay,
          label: shortTitle(def),
        });
        useBuoyageStore.getState().setPendingDefinitionId(null);
      }}
      className={`flex cursor-grab items-center transition active:cursor-grabbing touch-manipulation ${
        compact
          ? `flex-col gap-1 rounded-xl border p-1.5 ${
              active
                ? 'border-[#2A61FA] bg-[#2A61FA]/10 shadow-sm'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
            }`
          : `min-h-12 gap-2 rounded-xl border px-2 py-2 ${
              active
                ? 'border-[#2A61FA] bg-[#2A61FA]/10 shadow-sm'
                : 'border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm'
            }`
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center ${
          compact ? 'h-14 w-full' : 'h-11 w-11'
        }`}
      >
        <MarkVisual
          def={def}
          night={false}
          showSvgLight={false}
          className={compact ? 'h-12 w-12 object-contain' : 'h-10 w-10 object-contain'}
        />
      </div>
      {compact ? (
        <span className="text-[10px] font-medium text-slate-700">{shortTitle(def)}</span>
      ) : (
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-800">{shortTitle(def)}</p>
          <p className="truncate text-[10px] text-slate-500">{def.lightCharacteristic}</p>
        </div>
      )}
    </div>
  );
}

function ShapeGrid({
  ids,
  categoryId,
  pendingId,
  onPick,
}: {
  ids: string[];
  categoryId: string;
  pendingId: string | null;
  onPick: (id: string) => void;
}) {
  const defs = ids
    .map((id) => getDefinition(id))
    .filter((d): d is BuoyDefinition => Boolean(d));

  const port = defs.filter((d) => isPortish(d.id));
  const starboard = defs.filter((d) => isStarboardish(d.id));
  const preferred = categoryId === 'preferred-channel';
  const groups: { label: string; items: BuoyDefinition[] }[] = [];

  if (port.length) {
    groups.push({ label: preferred ? 'To port' : 'Port hand', items: port });
  }
  if (starboard.length) {
    groups.push({ label: preferred ? 'To starboard' : 'Starboard hand', items: starboard });
  }
  if (!groups.length) groups.push({ label: '', items: defs });

  return (
    <div className="space-y-3 pb-2">
      {groups.map((g) => (
        <div key={g.label || 'all'}>
          {g.label ? (
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {g.label}
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-1">
            {g.items.map((def) => (
              <MarkThumb
                key={def.id}
                def={def}
                active={pendingId === def.id}
                onPick={onPick}
                compact
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MarkList({
  ids,
  pendingId,
  onPick,
}: {
  ids: string[];
  pendingId: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <ul className="space-y-1 pb-2">
      {ids.map((id) => {
        const def = getDefinition(id);
        if (!def) return null;
        return (
          <li key={id}>
            <MarkThumb def={def} active={pendingId === id} onPick={onPick} />
          </li>
        );
      })}
    </ul>
  );
}

function usesShapeGrid(cat: SidebarCategory) {
  return cat.id === 'lateral' || cat.id === 'preferred-channel';
}

/** Shared mark catalogue — desktop sidebar or tablet bottom sheet. */
export function MarksPalette({
  variant = 'sidebar',
  onPlaced,
}: {
  variant?: 'sidebar' | 'sheet';
  onPlaced?: () => void;
}) {
  const region = useBuoyageStore((s) => s.region);
  const pendingDefinitionId = useBuoyageStore((s) => s.pendingDefinitionId);
  const categories = useMemo(() => getSidebarCategories(region), [region]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
      for (const c of categories) {
        if (next[c.id] === undefined) next[c.id] = true;
      }
      return next;
    });
  }, [categories]);

  const pick = (id: string) => {
    const store = useBuoyageStore.getState();
    if (store.pendingDefinitionId === id) {
      store.setPendingDefinitionId(null);
      return;
    }
    store.setPendingDefinitionId(id);
    onPlaced?.();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-black/5 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-900">Navigation Marks</h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          {variant === 'sheet'
            ? 'Tap a mark, then tap the chart to place'
            : 'Drag onto the chart, or tap then tap to place'}
        </p>
        <p className="mt-1 text-[10px] font-medium text-slate-400">IALA Region {region}</p>
        {pendingDefinitionId && (
          <button
            type="button"
            className="mt-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#2A61FA]/10 px-2.5 text-[11px] font-medium text-[#2A61FA]"
            onClick={() => useBuoyageStore.getState().setPendingDefinitionId(null)}
          >
            Placing: {getDefinition(pendingDefinitionId)?.name ?? 'mark'}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {categories.map((cat) => {
          const isOpen = open[cat.id] !== false;
          return (
            <div key={cat.id} className="mb-1">
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
                onClick={() => setOpen((s) => ({ ...s, [cat.id]: !isOpen }))}
              >
                <span>
                  {cat.label}
                  <span className="ml-1.5 font-normal normal-case tracking-normal text-slate-400">
                    {cat.definitionIds.length}
                  </span>
                </span>
                <motion.span animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                  <ChevronDown className="h-3.5 w-3.5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    {usesShapeGrid(cat) ? (
                      <ShapeGrid
                        ids={cat.definitionIds}
                        categoryId={cat.id}
                        pendingId={pendingDefinitionId}
                        onPick={pick}
                      />
                    ) : (
                      <MarkList
                        ids={cat.definitionIds}
                        pendingId={pendingDefinitionId}
                        onPick={pick}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BuoyageSidebar() {
  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-black/10 bg-white/95 backdrop-blur-md xl:flex">
      <MarksPalette variant="sidebar" />
    </aside>
  );
}
