'use client';

import { useRef } from 'react';
import {
  Anchor,
  Download,
  Eraser,
  Eye,
  Focus,
  Grid3x3,
  Hand,
  LayoutTemplate,
  Magnet,
  Moon,
  MousePointer2,
  Pen,
  Redo2,
  Ship,
  StickyNote,
  Sun,
  Trash2,
  Undo2,
  Upload,
  Video,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import type { ToolMode, ViewMode } from '@/types/buoyage';

const INK_COLORS = ['#1e293b', '#2563eb', '#dc2626', '#16a34a', '#d97706', '#f8fafc'];
const INK_SIZES = [
  { w: 2, label: 'S' },
  { w: 3, label: 'M' },
  { w: 6, label: 'L' },
] as const;

export function BuoyageToolbar({
  getViewportSize,
  variant = 'full',
  onOpenMarks,
}: {
  getViewportSize: () => { w: number; h: number };
  /** Bridge-only mode: view switch + night — no plan tools */
  variant?: 'full' | 'bridge';
  /** Open marks palette sheet (tablet / phone) */
  onOpenMarks?: () => void;
}) {
  const region = useBuoyageStore((s) => s.region);
  const nightMode = useBuoyageStore((s) => s.nightMode);
  const gridVisible = useBuoyageStore((s) => s.gridVisible);
  const snapEnabled = useBuoyageStore((s) => s.snapEnabled);
  const zoom = useBuoyageStore((s) => Math.round(s.camera.zoom * 10) / 10);
  const tool = useBuoyageStore((s) => s.tool);
  const viewMode = useBuoyageStore((s) => s.viewMode);
  const shipType = useBuoyageStore((s) => s.shipType);
  const drawColor = useBuoyageStore((s) => s.drawColor);
  const drawStrokeWidth = useBuoyageStore((s) => s.drawStrokeWidth);
  const ships = useBuoyageStore((s) => s.ships);
  const activeShipId = useBuoyageStore((s) => s.activeShipId);
  const canUndo = useBuoyageStore((s) => s.past.length > 0);
  const canRedo = useBuoyageStore((s) => s.future.length > 0);
  const fileRef = useRef<HTMLInputElement>(null);

  const setTool = (t: ToolMode) => useBuoyageStore.getState().setTool(t);
  const setView = (m: ViewMode) => useBuoyageStore.getState().setViewMode(m);

  const clearScene = () => {
    const ok = window.confirm('Clear the whole scene? You can undo this.');
    if (!ok) return;
    useBuoyageStore.getState().clearScene();
  };

  if (variant === 'bridge') {
    const bridgeBtn = (active: boolean) =>
      `inline-flex h-11 w-11 items-center justify-center rounded-xl transition touch-manipulation ${
        active ? 'bg-white text-slate-900' : 'text-white/80 hover:bg-white/10 active:bg-white/15'
      }`;
    return (
      <div className="absolute left-1/2 top-3 z-[70] flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-2.5 py-1.5 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-0.5 rounded-xl bg-white/10 p-0.5">
          <button
            type="button"
            title="Plan view"
            aria-label="Plan view"
            className={bridgeBtn(viewMode === 'plan')}
            onClick={() => setView('plan')}
          >
            <LayoutTemplate className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Split: plan + bridge"
            aria-label="Split view"
            className={bridgeBtn(viewMode === 'split')}
            onClick={() => setView('split')}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Bridge view"
            aria-label="Bridge view"
            className={bridgeBtn(viewMode === 'vessel')}
            onClick={() => setView('vessel')}
          >
            <Video className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          title={nightMode ? 'Day mode' : 'Night mode'}
          aria-label={nightMode ? 'Day mode' : 'Night mode'}
          className={bridgeBtn(nightMode)}
          onClick={() => useBuoyageStore.getState().setNightMode(!nightMode)}
        >
          {nightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        {ships.length > 0 && (
          <select
            className="h-11 max-w-[160px] rounded-xl border border-white/15 bg-white/10 px-2 text-xs text-white outline-none"
            value={activeShipId ?? ships[0]?.id}
            onChange={(e) => useBuoyageStore.getState().setActiveShipId(e.target.value)}
            aria-label="Active ship"
          >
            {ships.map((s) => (
              <option key={s.id} value={s.id} className="text-slate-900">
                {s.label || s.shipType}
                {s.shipType === 'own' ? ' · helm' : ''}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="absolute left-1/2 top-2 z-20 flex max-w-[calc(100%-0.75rem)] -translate-x-1/2 flex-wrap items-end justify-center gap-x-1.5 gap-y-1 rounded-2xl border border-black/10 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur-md sm:top-3 sm:gap-x-2 sm:px-2.5 sm:py-2">
      {onOpenMarks && (
        <div className="xl:hidden">
          <Group label="Marks">
            <IconBtn title="Open marks palette" onClick={onOpenMarks}>
              <Anchor className="h-4 w-4" />
            </IconBtn>
          </Group>
        </div>
      )}

      <Group label="Region">
        <Segment>
          <TextBtn
            active={region === 'A'}
            title="IALA Region A"
            onClick={() => useBuoyageStore.getState().setRegion('A')}
          >
            A
          </TextBtn>
          <TextBtn
            active={region === 'B'}
            title="IALA Region B"
            onClick={() => useBuoyageStore.getState().setRegion('B')}
          >
            B
          </TextBtn>
        </Segment>
      </Group>

      <Group label="Move">
        <Segment>
          <ToolBtn active={tool === 'select'} title="Select" onClick={() => setTool('select')}>
            <MousePointer2 className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn active={tool === 'pan'} title="Pan (or hold Space)" onClick={() => setTool('pan')}>
            <Hand className="h-3.5 w-3.5" />
          </ToolBtn>
        </Segment>
      </Group>

      <Group label="Draw">
        <Segment>
          <ToolBtn active={tool === 'pen'} title="Pen" onClick={() => setTool('pen')}>
            <Pen className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            active={tool === 'erase'}
            title="Eraser — click or drag over items"
            onClick={() => setTool('erase')}
          >
            <Eraser className="h-3.5 w-3.5" />
          </ToolBtn>
        </Segment>
        {tool === 'pen' && (
          <div className="ml-1 flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {INK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title="Ink colour"
                  aria-label={`Ink ${c}`}
                  onClick={() => useBuoyageStore.getState().setDrawColor(c)}
                  className="h-8 w-8 rounded-full border border-black/15 transition touch-manipulation sm:h-5 sm:w-5"
                  style={{
                    background: c,
                    boxShadow:
                      drawColor === c
                        ? '0 0 0 2px #fff, 0 0 0 3.5px #0f172a'
                        : undefined,
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
              {INK_SIZES.map(({ w, label }) => (
                <button
                  key={w}
                  type="button"
                  title={`Stroke ${label}`}
                  onClick={() => useBuoyageStore.getState().setDrawStrokeWidth(w)}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-[11px] font-semibold transition touch-manipulation sm:h-8 sm:min-w-8 ${
                    drawStrokeWidth === w
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </Group>

      <Group label="Place">
        <Segment>
          <ToolBtn active={tool === 'note'} title="Sticky note" onClick={() => setTool('note')}>
            <StickyNote className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            active={tool === 'ship'}
            title="Place ship (own ship = bridge camera)"
            onClick={() => setTool('ship')}
          >
            <Ship className="h-3.5 w-3.5" />
          </ToolBtn>
        </Segment>
        {tool === 'ship' && (
          <select
            className="ml-1 h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px]"
            value={shipType}
            onChange={(e) =>
              useBuoyageStore.getState().setShipType(e.target.value as typeof shipType)
            }
          >
            <option value="own">Own ship</option>
            <option value="target">Target</option>
            <option value="tanker">Tanker</option>
            <option value="ferry">Ferry</option>
          </select>
        )}
      </Group>

      <Group label="View">
        <Segment>
          <ToolBtn active={viewMode === 'plan'} title="Plan view" onClick={() => setView('plan')}>
            <LayoutTemplate className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            active={viewMode === 'split'}
            title="Split: plan + bridge"
            onClick={() => setView('split')}
          >
            <Eye className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            active={viewMode === 'vessel'}
            title="Bridge view only"
            onClick={() => setView('vessel')}
          >
            <Video className="h-3.5 w-3.5" />
          </ToolBtn>
        </Segment>
      </Group>

      <Group label="Display">
        <IconBtn
          active={nightMode}
          title={nightMode ? 'Day mode' : 'Night mode'}
          onClick={() => useBuoyageStore.getState().setNightMode(!nightMode)}
        >
          {nightMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn
          active={gridVisible}
          title="Grid"
          onClick={() => useBuoyageStore.getState().setGridVisible(!gridVisible)}
        >
          <Grid3x3 className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          active={snapEnabled}
          title="Snap to grid"
          onClick={() => useBuoyageStore.getState().setSnapEnabled(!snapEnabled)}
        >
          <Magnet className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>

      <Group label="Edit">
        <IconBtn
          title="Undo"
          disabled={!canUndo}
          onClick={() => useBuoyageStore.getState().undo()}
        >
          <Undo2 className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Redo"
          disabled={!canRedo}
          onClick={() => useBuoyageStore.getState().redo()}
        >
          <Redo2 className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Clear scene" onClick={clearScene} danger>
          <Trash2 className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>

      <Group label="Zoom">
        <IconBtn
          title="Zoom out"
          onClick={() => {
            const s = useBuoyageStore.getState();
            const el = document.querySelector('[data-buoyage-canvas]') as HTMLElement | null;
            const anchor = el
              ? { x: el.clientWidth / 2, y: el.clientHeight / 2 }
              : undefined;
            s.setZoom(s.camera.zoom * 0.85, anchor);
          }}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </IconBtn>
        <span className="min-w-[2.75rem] text-center text-[11px] font-semibold tabular-nums text-slate-600">
          {Math.round(zoom * 100)}%
        </span>
        <IconBtn
          title="Zoom in"
          onClick={() => {
            const s = useBuoyageStore.getState();
            const el = document.querySelector('[data-buoyage-canvas]') as HTMLElement | null;
            const anchor = el
              ? { x: el.clientWidth / 2, y: el.clientHeight / 2 }
              : undefined;
            s.setZoom(s.camera.zoom * 1.15, anchor);
          }}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn
          title="Fit to screen"
          onClick={() => {
            const { w, h } = getViewportSize();
            useBuoyageStore.getState().fitToScreen(w, h);
          }}
        >
          <Focus className="h-3.5 w-3.5" />
        </IconBtn>
      </Group>

      <Group label="File">
        <IconBtn
          title="Export JSON"
          onClick={() => useBuoyageStore.getState().exportJson()}
        >
          <Download className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Import JSON" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
        </IconBtn>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const text = await file.text();
            useBuoyageStore.getState().importJson(text);
            e.target.value = '';
          }}
        />
      </Group>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="px-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <div className="flex items-center gap-0.5">{children}</div>
    </div>
  );
}

function Segment({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-0.5">{children}</div>
  );
}

function ToolBtn({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition touch-manipulation sm:h-9 sm:w-9 [&>svg]:h-4 [&>svg]:w-4 ${
        active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white active:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function TextBtn({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-semibold transition touch-manipulation sm:h-9 sm:min-w-9 sm:rounded-lg sm:px-2.5 sm:text-xs ${
        active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white active:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function IconBtn({
  title,
  onClick,
  children,
  active,
  disabled,
  danger,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg transition touch-manipulation disabled:opacity-40 sm:h-9 sm:w-9 [&>svg]:h-4 [&>svg]:w-4 ${
        active
          ? 'bg-slate-900 text-white'
          : danger
            ? 'text-rose-600 hover:bg-rose-50 active:bg-rose-100'
            : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
      }`}
    >
      {children}
    </button>
  );
}
