'use client';

import { create } from 'zustand';
import { getDefinition } from '@/data/buoyage';
import {
  clamp,
  marksBounds,
  MAX_ZOOM,
  MIN_ZOOM,
  NOTE_DEFAULT_H,
  NOTE_DEFAULT_W,
  NUDGE_LARGE,
  NUDGE_SMALL,
  snapToGrid,
} from '@/lib/buoyage/geometry';
import {
  DEFAULT_CAMERA,
  downloadJson,
  loadFromLocalStorage,
  parseDocument,
  saveToLocalStorage,
} from '@/lib/buoyage/serialize';
import type {
  BuoyageDocument,
  CameraState,
  CanvasMark,
  CanvasNote,
  CanvasPath,
  CanvasShip,
  CanvasViewpoint,
  ClipboardItem,
  IalaRegion,
  ShipType,
  ToolMode,
  ViewMode,
} from '@/types/buoyage';

const MAX_HISTORY = 50;

/** Lagged helm so throttle/rudder don't snap the hull instantly. */
const helmApplied = new Map<string, { throttle: number; rudder: number }>();

function approach(current: number, target: number, maxStep: number) {
  const d = target - current;
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

type SceneSnapshot = {
  marks: CanvasMark[];
  ships: CanvasShip[];
  paths: CanvasPath[];
  notes: CanvasNote[];
  viewpoints: CanvasViewpoint[];
};

type BuoyageState = {
  marks: CanvasMark[];
  ships: CanvasShip[];
  paths: CanvasPath[];
  notes: CanvasNote[];
  viewpoints: CanvasViewpoint[];
  activeViewpointId: string | null;
  activeShipId: string | null;
  selectedIds: string[];
  camera: CameraState;
  region: IalaRegion;
  nightMode: boolean;
  gridVisible: boolean;
  snapEnabled: boolean;
  tool: ToolMode;
  viewMode: ViewMode;
  drawColor: string;
  drawStrokeWidth: number;
  shipType: ShipType;
  /** Tap-to-place: next canvas tap places this buoy definition */
  pendingDefinitionId: string | null;
  clipboard: ClipboardItem[];
  past: SceneSnapshot[];
  future: SceneSnapshot[];
  hydrated: boolean;

  hydrate: () => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  setRegion: (region: IalaRegion) => void;
  setNightMode: (v: boolean) => void;
  setGridVisible: (v: boolean) => void;
  setSnapEnabled: (v: boolean) => void;
  setTool: (tool: ToolMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setDrawColor: (c: string) => void;
  setDrawStrokeWidth: (w: number) => void;
  setShipType: (t: ShipType) => void;
  setPendingDefinitionId: (id: string | null) => void;
  setActiveViewpointId: (id: string | null) => void;
  setActiveShipId: (id: string | null) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setZoom: (zoom: number, anchor?: { x: number; y: number }) => void;

  maxZ: () => number;
  addMark: (definitionId: string, x: number, y: number) => string;
  addShip: (x: number, y: number, shipType?: ShipType) => string;
  addNote: (x: number, y: number) => string;
  addViewpoint: (x: number, y: number) => string;
  startPath: (x: number, y: number) => string;
  appendPathPoint: (id: string, x: number, y: number) => void;
  finishPath: (id: string) => void;

  updateMark: (id: string, patch: Partial<CanvasMark>, recordHistory?: boolean) => void;
  updateShip: (id: string, patch: Partial<CanvasShip>, recordHistory?: boolean) => void;
  clearShipTrack: (id: string) => void;
  /** High-frequency sim step — no history */
  simulateShipStep: (id: string, dt: number) => void;
  updateNote: (id: string, patch: Partial<CanvasNote>, recordHistory?: boolean) => void;
  updatePath: (id: string, patch: Partial<CanvasPath>, recordHistory?: boolean) => void;
  updateViewpoint: (id: string, patch: Partial<CanvasViewpoint>, recordHistory?: boolean) => void;

  deleteSelected: () => void;
  deleteByIds: (ids: string[], recordHistory?: boolean) => void;
  clearScene: () => void;
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: (offset?: number) => void;
  select: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  nudgeSelected: (dx: number, dy: number, large?: boolean) => void;

  moveSelectedBy: (dx: number, dy: number, origins: Record<string, { x: number; y: number }>, snap: boolean) => void;

  fitToScreen: (viewportW: number, viewportH: number) => void;
  centerSelection: (viewportW: number, viewportH: number) => void;

  getDocument: () => BuoyageDocument;
  loadDocument: (doc: BuoyageDocument) => void;
  exportJson: () => void;
  importJson: (json: string) => void;
  autosave: () => void;
};

function uid(prefix = 'obj') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function cloneScene(s: SceneSnapshot): SceneSnapshot {
  return {
    marks: s.marks.map((m) => ({ ...m })),
    ships: s.ships.map((m) => ({ ...m })),
    paths: s.paths.map((p) => ({ ...p, points: p.points.map((pt) => ({ ...pt })) })),
    notes: s.notes.map((n) => ({ ...n })),
    viewpoints: s.viewpoints.map((v) => ({ ...v })),
  };
}

const SHIP_COLORS: Record<ShipType, string> = {
  own: '#2A61FA',
  target: '#334155',
  tanker: '#B45309',
  ferry: '#0F766E',
};

export const useBuoyageStore = create<BuoyageState>((set, get) => ({
  marks: [],
  ships: [],
  paths: [],
  notes: [],
  viewpoints: [],
  activeViewpointId: null,
  activeShipId: null,
  selectedIds: [],
  camera: { ...DEFAULT_CAMERA },
  region: 'A',
  nightMode: false,
  gridVisible: true,
  snapEnabled: true,
  tool: 'select',
  viewMode: 'plan',
  drawColor: '#1e293b',
  drawStrokeWidth: 3,
  shipType: 'own',
  pendingDefinitionId: null,
  clipboard: [],
  past: [],
  future: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const saved = loadFromLocalStorage();
    if (saved) {
      set({
        marks: saved.marks,
        ships: saved.ships,
        paths: saved.paths,
        notes: saved.notes,
        viewpoints: saved.viewpoints,
        activeViewpointId: saved.activeViewpointId,
        activeShipId:
          saved.activeShipId ??
          saved.ships.find((s) => s.shipType === 'own')?.id ??
          saved.ships[0]?.id ??
          null,
        camera: saved.camera,
        region: saved.region,
        nightMode: saved.nightMode,
        gridVisible: saved.gridVisible,
        snapEnabled: saved.snapEnabled,
        viewMode: saved.viewMode,
        selectedIds: [],
        past: [],
        future: [],
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },

  pushHistory: () => {
    const { marks, ships, paths, notes, viewpoints, past } = get();
    const next = [
      ...past,
      cloneScene({ marks, ships, paths, notes, viewpoints }),
    ];
    if (next.length > MAX_HISTORY) next.shift();
    set({ past: next, future: [] });
  },

  undo: () => {
    const { past, future, marks, ships, paths, notes, viewpoints } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      past: past.slice(0, -1),
      future: [...future, cloneScene({ marks, ships, paths, notes, viewpoints })],
      ...cloneScene(prev),
      selectedIds: [],
    });
  },

  redo: () => {
    const { future, past, marks, ships, paths, notes, viewpoints } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    set({
      future: future.slice(0, -1),
      past: [...past, cloneScene({ marks, ships, paths, notes, viewpoints })],
      ...cloneScene(next),
      selectedIds: [],
    });
  },

  setRegion: (region) => set({ region }),
  setNightMode: (nightMode) => set({ nightMode }),
  setGridVisible: (gridVisible) => set({ gridVisible }),
  setSnapEnabled: (snapEnabled) => set({ snapEnabled }),
  setTool: (tool) => set({ tool, pendingDefinitionId: null }),
  setViewMode: (viewMode) => set({ viewMode }),
  setDrawColor: (drawColor) => set({ drawColor }),
  setDrawStrokeWidth: (drawStrokeWidth) => set({ drawStrokeWidth }),
  setShipType: (shipType) => set({ shipType }),
  setPendingDefinitionId: (pendingDefinitionId) =>
    set({ pendingDefinitionId, tool: pendingDefinitionId ? 'select' : get().tool }),
  setActiveViewpointId: (activeViewpointId) => set({ activeViewpointId }),
  setActiveShipId: (activeShipId) => set({ activeShipId }),
  setCamera: (camera) => set((s) => ({ camera: { ...s.camera, ...camera } })),

  setZoom: (zoom, anchor) => {
    const z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const { camera } = get();
    if (!anchor) {
      set({ camera: { ...camera, zoom: z } });
      return;
    }
    const worldX = (anchor.x - camera.x) / camera.zoom;
    const worldY = (anchor.y - camera.y) / camera.zoom;
    set({
      camera: {
        zoom: z,
        x: anchor.x - worldX * z,
        y: anchor.y - worldY * z,
      },
    });
  },

  maxZ: () => {
    const { marks, ships, paths, notes, viewpoints } = get();
    return Math.max(
      0,
      ...marks.map((m) => m.zIndex),
      ...ships.map((m) => m.zIndex),
      ...paths.map((m) => m.zIndex),
      ...notes.map((m) => m.zIndex),
      ...viewpoints.map((m) => m.zIndex),
    );
  },

  addMark: (definitionId, x, y) => {
    if (!getDefinition(definitionId)) return '';
    get().pushHistory();
    const { snapEnabled, marks } = get();
    const id = uid('mark');
    const mark: CanvasMark = {
      id,
      definitionId,
      x: snapToGrid(x, undefined, snapEnabled),
      y: snapToGrid(y, undefined, snapEnabled),
      rotation: 0,
      scale: 1,
      nightMode: null,
      zIndex: get().maxZ() + 1,
    };
    set({ marks: [...marks, mark], selectedIds: [id], tool: 'select' });
    return id;
  },

  addShip: (x, y, shipType) => {
    get().pushHistory();
    const type = shipType ?? get().shipType;
    const id = uid('ship');
    const ship: CanvasShip = {
      id,
      x: snapToGrid(x, undefined, get().snapEnabled),
      y: snapToGrid(y, undefined, get().snapEnabled),
      rotation: 0,
      scale: 1,
      shipType: type,
      label: type === 'own' ? 'Own ship' : 'Target',
      color: SHIP_COLORS[type],
      fov: 88,
      speed: 0,
      throttle: 0,
      rudder: 0,
      track: [{ x: snapToGrid(x, undefined, get().snapEnabled), y: snapToGrid(y, undefined, get().snapEnabled) }],
      zIndex: get().maxZ() + 1,
    };
    set((s) => ({
      ships: [...s.ships, ship],
      selectedIds: [id],
      activeShipId: type === 'own' || !s.activeShipId ? id : s.activeShipId,
      tool: 'select',
      viewMode: type === 'own' && s.viewMode === 'plan' ? 'split' : s.viewMode,
    }));
    return id;
  },

  addNote: (x, y) => {
    get().pushHistory();
    const id = uid('note');
    const note: CanvasNote = {
      id,
      x: snapToGrid(x, undefined, get().snapEnabled),
      y: snapToGrid(y, undefined, get().snapEnabled),
      width: NOTE_DEFAULT_W,
      height: NOTE_DEFAULT_H,
      text: 'Teaching note…',
      color: '#FEF08A',
      zIndex: get().maxZ() + 1,
    };
    set((s) => ({
      notes: [...s.notes, note],
      selectedIds: [id],
      tool: 'select',
    }));
    return id;
  },

  addViewpoint: (x, y) => {
    get().pushHistory();
    const id = uid('view');
    const vp: CanvasViewpoint = {
      id,
      x: snapToGrid(x, undefined, get().snapEnabled),
      y: snapToGrid(y, undefined, get().snapEnabled),
      heading: 0,
      fov: 88,
      label: 'Bridge view',
      zIndex: get().maxZ() + 1,
    };
    set((s) => ({
      viewpoints: [...s.viewpoints, vp],
      selectedIds: [id],
      activeViewpointId: id,
      tool: 'select',
      viewMode: s.viewMode === 'plan' ? 'split' : s.viewMode,
    }));
    return id;
  },

  startPath: (x, y) => {
    get().pushHistory();
    const id = uid('path');
    const path: CanvasPath = {
      id,
      points: [{ x, y }],
      color: get().drawColor,
      strokeWidth: get().drawStrokeWidth,
      dashed: false,
      zIndex: get().maxZ() + 1,
    };
    // Don't auto-select ink — keep drawing fluid like a pen
    set((s) => ({ paths: [...s.paths, path], selectedIds: [] }));
    return id;
  },

  appendPathPoint: (id, x, y) => {
    set((s) => ({
      paths: s.paths.map((p) => {
        if (p.id !== id) return p;
        const last = p.points[p.points.length - 1];
        if (last && Math.hypot(last.x - x, last.y - y) < 2) return p;
        return { ...p, points: [...p.points, { x, y }] };
      }),
    }));
  },

  finishPath: (id) => {
    const path = get().paths.find((p) => p.id === id);
    if (path && path.points.length < 2) {
      set((s) => ({
        paths: s.paths.filter((p) => p.id !== id),
        selectedIds: [],
      }));
    }
  },

  updateMark: (id, patch, recordHistory = true) => {
    if (recordHistory) get().pushHistory();
    set((s) => ({ marks: s.marks.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },
  updateShip: (id, patch, recordHistory = true) => {
    if (recordHistory) get().pushHistory();
    set((s) => ({ ships: s.ships.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },

  clearShipTrack: (id) => {
    get().pushHistory();
    set((s) => ({
      ships: s.ships.map((m) =>
        m.id === id ? { ...m, track: [{ x: m.x, y: m.y }] } : m,
      ),
    }));
  },

  simulateShipStep: (id, dt) => {
    if (dt <= 0 || dt > 0.25) return;
    set((s) => ({
      ships: s.ships.map((ship) => {
        if (ship.id !== id) return ship;

        // Heavier vessel feel: slower hull, lagged helm, modest turn rate
        const maxSpeed = 42; // world units / sec
        const accelRate = 0.22; // toward commanded speed (slew)
        const brakeRate = 0.3; // coast / reverse response
        const maxTurnDeg = 9; // deg/sec at full rudder & speed
        const throttleSlew = 0.45; // command → applied throttle / sec
        const rudderSlew = 0.55; // command → applied rudder / sec

        const cmdThrottle = Math.max(-1, Math.min(1, ship.throttle ?? 0));
        const cmdRudder = Math.max(-1, Math.min(1, ship.rudder ?? 0));

        // Lag applied helm so A/D & W/S feel less twitchy
        let helm = helmApplied.get(id);
        if (!helm) {
          helm = { throttle: cmdThrottle, rudder: cmdRudder };
          helmApplied.set(id, helm);
        }
        helm.throttle = approach(helm.throttle, cmdThrottle, throttleSlew * dt);
        helm.rudder = approach(helm.rudder, cmdRudder, rudderSlew * dt);

        const throttle = helm.throttle;
        const rudder = helm.rudder;
        const targetSpeed = throttle * maxSpeed;
        let speed = ship.speed ?? 0;
        const closing = Math.abs(targetSpeed) > Math.abs(speed) + 0.5;
        const rate = closing ? accelRate : brakeRate;
        speed += (targetSpeed - speed) * Math.min(1, rate * dt);
        if (Math.abs(speed) < 0.12 && Math.abs(throttle) < 0.02) speed = 0;

        // Turning authority builds with speed (almost none when stopped)
        const speedFactor = Math.min(1, Math.abs(speed) / (maxSpeed * 0.55));
        const turnAuthority = Math.pow(speedFactor, 1.15);
        const turn = rudder * maxTurnDeg * turnAuthority * dt;
        let rotation = ((ship.rotation + turn) % 360 + 360) % 360;

        const rad = (rotation * Math.PI) / 180;
        const x = ship.x + Math.sin(rad) * speed * dt;
        const y = ship.y - Math.cos(rad) * speed * dt;

        let track = ship.track ?? [];
        const last = track[track.length - 1];
        const distMoved = last ? Math.hypot(x - last.x, y - last.y) : 999;
        if (distMoved >= 6) {
          track = [...track, { x, y }];
          // Cap trail length for performance
          if (track.length > 4000) track = track.slice(track.length - 4000);
        }

        return { ...ship, x, y, rotation, speed, track };
      }),
    }));
  },

  updateNote: (id, patch, recordHistory = true) => {
    if (recordHistory) get().pushHistory();
    set((s) => ({ notes: s.notes.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },
  updatePath: (id, patch, recordHistory = true) => {
    if (recordHistory) get().pushHistory();
    set((s) => ({ paths: s.paths.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  },
  updateViewpoint: (id, patch, recordHistory = true) => {
    if (recordHistory) get().pushHistory();
    set((s) => ({
      viewpoints: s.viewpoints.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  },

  deleteSelected: () => {
    const { selectedIds } = get();
    get().deleteByIds(selectedIds);
  },

  deleteByIds: (ids, recordHistory = true) => {
    if (ids.length === 0) return;
    if (recordHistory) get().pushHistory();
    const idSet = new Set(ids);
    set((s) => ({
      marks: s.marks.filter((m) => !idSet.has(m.id)),
      ships: s.ships.filter((m) => !idSet.has(m.id)),
      paths: s.paths.filter((m) => !idSet.has(m.id)),
      notes: s.notes.filter((m) => !idSet.has(m.id)),
      viewpoints: s.viewpoints.filter((m) => !idSet.has(m.id)),
      activeViewpointId:
        s.activeViewpointId && idSet.has(s.activeViewpointId)
          ? s.viewpoints.find((v) => !idSet.has(v.id))?.id ?? null
          : s.activeViewpointId,
      activeShipId:
        s.activeShipId && idSet.has(s.activeShipId)
          ? s.ships.find((ship) => !idSet.has(ship.id))?.id ?? null
          : s.activeShipId,
      selectedIds: s.selectedIds.filter((id) => !idSet.has(id)),
    }));
  },

  clearScene: () => {
    const { marks, ships, paths, notes, viewpoints } = get();
    if (
      marks.length === 0 &&
      ships.length === 0 &&
      paths.length === 0 &&
      notes.length === 0 &&
      viewpoints.length === 0
    ) {
      return;
    }
    get().pushHistory();
    set({
      marks: [],
      ships: [],
      paths: [],
      notes: [],
      viewpoints: [],
      selectedIds: [],
      activeShipId: null,
      activeViewpointId: null,
    });
  },

  duplicateSelected: () => {
    const { selectedIds, marks, ships, notes, viewpoints, snapEnabled } = get();
    if (selectedIds.length === 0) return;
    get().pushHistory();
    const idSet = new Set(selectedIds);
    const newIds: string[] = [];
    let z = get().maxZ();

    const nextMarks = [...marks];
    for (const m of marks) {
      if (!idSet.has(m.id)) continue;
      z += 1;
      const id = uid('mark');
      newIds.push(id);
      nextMarks.push({
        ...m,
        id,
        x: snapToGrid(m.x + 40, undefined, snapEnabled),
        y: snapToGrid(m.y + 40, undefined, snapEnabled),
        zIndex: z,
      });
    }

    const nextShips = [...ships];
    for (const m of ships) {
      if (!idSet.has(m.id)) continue;
      z += 1;
      const id = uid('ship');
      newIds.push(id);
      nextShips.push({
        ...m,
        id,
        x: snapToGrid(m.x + 40, undefined, snapEnabled),
        y: snapToGrid(m.y + 40, undefined, snapEnabled),
        zIndex: z,
      });
    }

    const nextNotes = [...notes];
    for (const m of notes) {
      if (!idSet.has(m.id)) continue;
      z += 1;
      const id = uid('note');
      newIds.push(id);
      nextNotes.push({
        ...m,
        id,
        x: snapToGrid(m.x + 40, undefined, snapEnabled),
        y: snapToGrid(m.y + 40, undefined, snapEnabled),
        zIndex: z,
      });
    }

    const nextViews = [...viewpoints];
    for (const m of viewpoints) {
      if (!idSet.has(m.id)) continue;
      z += 1;
      const id = uid('view');
      newIds.push(id);
      nextViews.push({
        ...m,
        id,
        x: snapToGrid(m.x + 40, undefined, snapEnabled),
        y: snapToGrid(m.y + 40, undefined, snapEnabled),
        zIndex: z,
      });
    }

    set({
      marks: nextMarks,
      ships: nextShips,
      notes: nextNotes,
      viewpoints: nextViews,
      selectedIds: newIds,
    });
  },

  copySelected: () => {
    const { selectedIds, marks, ships, paths, notes, viewpoints } = get();
    const idSet = new Set(selectedIds);
    const clipboard: ClipboardItem[] = [];
    for (const m of marks) if (idSet.has(m.id)) clipboard.push({ type: 'mark', data: { ...m } });
    for (const m of ships) if (idSet.has(m.id)) clipboard.push({ type: 'ship', data: { ...m } });
    for (const m of paths)
      if (idSet.has(m.id))
        clipboard.push({ type: 'path', data: { ...m, points: m.points.map((p) => ({ ...p })) } });
    for (const m of notes) if (idSet.has(m.id)) clipboard.push({ type: 'note', data: { ...m } });
    for (const m of viewpoints)
      if (idSet.has(m.id)) clipboard.push({ type: 'viewpoint', data: { ...m } });
    set({ clipboard });
  },

  pasteClipboard: (offset = 40) => {
    const { clipboard, snapEnabled } = get();
    if (clipboard.length === 0) return;
    get().pushHistory();
    let z = get().maxZ();
    const newIds: string[] = [];
    const patch: Partial<BuoyageState> = {};

    set((s) => {
      let marks = [...s.marks];
      let ships = [...s.ships];
      let paths = [...s.paths];
      let notes = [...s.notes];
      let viewpoints = [...s.viewpoints];

      for (const item of clipboard) {
        z += 1;
        if (item.type === 'mark') {
          const id = uid('mark');
          newIds.push(id);
          marks.push({
            ...item.data,
            id,
            x: snapToGrid(item.data.x + offset, undefined, snapEnabled),
            y: snapToGrid(item.data.y + offset, undefined, snapEnabled),
            zIndex: z,
          });
        } else if (item.type === 'ship') {
          const id = uid('ship');
          newIds.push(id);
          ships.push({
            ...item.data,
            id,
            x: snapToGrid(item.data.x + offset, undefined, snapEnabled),
            y: snapToGrid(item.data.y + offset, undefined, snapEnabled),
            zIndex: z,
          });
        } else if (item.type === 'path') {
          const id = uid('path');
          newIds.push(id);
          paths.push({
            ...item.data,
            id,
            points: item.data.points.map((p) => ({
              x: snapToGrid(p.x + offset, undefined, snapEnabled),
              y: snapToGrid(p.y + offset, undefined, snapEnabled),
            })),
            zIndex: z,
          });
        } else if (item.type === 'note') {
          const id = uid('note');
          newIds.push(id);
          notes.push({
            ...item.data,
            id,
            x: snapToGrid(item.data.x + offset, undefined, snapEnabled),
            y: snapToGrid(item.data.y + offset, undefined, snapEnabled),
            zIndex: z,
          });
        } else if (item.type === 'viewpoint') {
          const id = uid('view');
          newIds.push(id);
          viewpoints.push({
            ...item.data,
            id,
            x: snapToGrid(item.data.x + offset, undefined, snapEnabled),
            y: snapToGrid(item.data.y + offset, undefined, snapEnabled),
            zIndex: z,
          });
        }
      }

      return { marks, ships, paths, notes, viewpoints, selectedIds: newIds, ...patch };
    });
  },

  select: (ids, additive = false) => {
    if (!additive) {
      set({ selectedIds: ids });
      return;
    }
    set((s) => {
      const next = new Set(s.selectedIds);
      for (const id of ids) next.add(id);
      return { selectedIds: [...next] };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  nudgeSelected: (dx, dy, large = false) => {
    const { selectedIds } = get();
    if (selectedIds.length === 0) return;
    get().pushHistory();
    const step = large ? NUDGE_LARGE : NUDGE_SMALL;
    const idSet = new Set(selectedIds);
    const snap = get().snapEnabled;
    set((s) => ({
      marks: s.marks.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              x: snapToGrid(m.x + dx * step, undefined, snap),
              y: snapToGrid(m.y + dy * step, undefined, snap),
            }
          : m,
      ),
      ships: s.ships.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              x: snapToGrid(m.x + dx * step, undefined, snap),
              y: snapToGrid(m.y + dy * step, undefined, snap),
            }
          : m,
      ),
      notes: s.notes.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              x: snapToGrid(m.x + dx * step, undefined, snap),
              y: snapToGrid(m.y + dy * step, undefined, snap),
            }
          : m,
      ),
      viewpoints: s.viewpoints.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              x: snapToGrid(m.x + dx * step, undefined, snap),
              y: snapToGrid(m.y + dy * step, undefined, snap),
            }
          : m,
      ),
      paths: s.paths.map((p) =>
        idSet.has(p.id)
          ? {
              ...p,
              points: p.points.map((pt) => ({
                x: snapToGrid(pt.x + dx * step, undefined, snap),
                y: snapToGrid(pt.y + dy * step, undefined, snap),
              })),
            }
          : p,
      ),
    }));
  },

  moveSelectedBy: (dx, dy, origins, snap) => {
    const idSet = new Set(Object.keys(origins));
    set((s) => ({
      marks: s.marks.map((m) => {
        const o = origins[m.id];
        if (!o) return m;
        return {
          ...m,
          x: snapToGrid(o.x + dx, undefined, snap),
          y: snapToGrid(o.y + dy, undefined, snap),
        };
      }),
      ships: s.ships.map((m) => {
        const o = origins[m.id];
        if (!o) return m;
        return {
          ...m,
          x: snapToGrid(o.x + dx, undefined, snap),
          y: snapToGrid(o.y + dy, undefined, snap),
        };
      }),
      notes: s.notes.map((m) => {
        const o = origins[m.id];
        if (!o) return m;
        return {
          ...m,
          x: snapToGrid(o.x + dx, undefined, snap),
          y: snapToGrid(o.y + dy, undefined, snap),
        };
      }),
      viewpoints: s.viewpoints.map((m) => {
        const o = origins[m.id];
        if (!o) return m;
        return {
          ...m,
          x: snapToGrid(o.x + dx, undefined, snap),
          y: snapToGrid(o.y + dy, undefined, snap),
        };
      }),
      paths: s.paths.map((p) => {
        if (!idSet.has(p.id)) return p;
        // paths use first point as origin key via special handling — skip here if no origin
        return p;
      }),
    }));
  },

  fitToScreen: (viewportW, viewportH) => {
    const { marks, ships, notes, viewpoints } = get();
    const pts = [
      ...marks,
      ...ships,
      ...notes.map((n) => ({ x: n.x + n.width / 2, y: n.y + n.height / 2, scale: 1 })),
      ...viewpoints.map((v) => ({ x: v.x, y: v.y, scale: 1 })),
    ];
    const b = marksBounds(pts);
    const zoom = clamp(
      Math.min(viewportW / b.width, viewportH / b.height) * 0.9,
      MIN_ZOOM,
      MAX_ZOOM,
    );
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    set({
      camera: {
        zoom,
        x: viewportW / 2 - cx * zoom,
        y: viewportH / 2 - cy * zoom,
      },
    });
  },

  centerSelection: (viewportW, viewportH) => {
    const { marks, ships, notes, viewpoints, selectedIds, camera } = get();
    const idSet = new Set(selectedIds);
    const selected = [
      ...marks.filter((m) => idSet.has(m.id)),
      ...ships.filter((m) => idSet.has(m.id)),
      ...notes
        .filter((m) => idSet.has(m.id))
        .map((n) => ({ x: n.x + n.width / 2, y: n.y + n.height / 2, scale: 1 })),
      ...viewpoints.filter((m) => idSet.has(m.id)),
    ];
    if (selected.length === 0) return;
    const b = marksBounds(selected, 0);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    set({
      camera: {
        ...camera,
        x: viewportW / 2 - cx * camera.zoom,
        y: viewportH / 2 - cy * camera.zoom,
      },
    });
  },

  getDocument: () => {
    const s = get();
    return {
      version: 2 as const,
      region: s.region,
      marks: s.marks.map((m) => ({ ...m })),
      ships: s.ships.map((m) => ({ ...m })),
      paths: s.paths.map((p) => ({ ...p, points: p.points.map((pt) => ({ ...pt })) })),
      notes: s.notes.map((n) => ({ ...n })),
      viewpoints: s.viewpoints.map((v) => ({ ...v })),
      activeViewpointId: s.activeViewpointId,
      activeShipId: s.activeShipId,
      camera: { ...s.camera },
      nightMode: s.nightMode,
      gridVisible: s.gridVisible,
      snapEnabled: s.snapEnabled,
      viewMode: s.viewMode,
    };
  },

  loadDocument: (doc) => {
    set({
      marks: doc.marks.map((m) => ({ ...m })),
      ships: doc.ships.map((m) => ({ ...m })),
      paths: doc.paths.map((p) => ({ ...p, points: p.points.map((pt) => ({ ...pt })) })),
      notes: doc.notes.map((n) => ({ ...n })),
      viewpoints: doc.viewpoints.map((v) => ({ ...v })),
      activeViewpointId: doc.activeViewpointId,
      activeShipId: doc.activeShipId,
      camera: { ...doc.camera },
      region: doc.region,
      nightMode: doc.nightMode,
      gridVisible: doc.gridVisible,
      snapEnabled: doc.snapEnabled,
      viewMode: doc.viewMode,
      selectedIds: [],
      past: [],
      future: [],
    });
  },

  exportJson: () => downloadJson(get().getDocument()),

  importJson: (json) => {
    const doc = parseDocument(json);
    get().loadDocument(doc);
  },

  autosave: () => saveToLocalStorage(get().getDocument()),
}));
