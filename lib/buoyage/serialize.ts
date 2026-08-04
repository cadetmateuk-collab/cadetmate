import type {
  BuoyageDocument,
  CameraState,
  CanvasMark,
  CanvasNote,
  CanvasPath,
  CanvasShip,
  CanvasViewpoint,
  IalaRegion,
  ViewMode,
} from '@/types/buoyage';

export const STORAGE_KEY = 'cadetmate-buoyage-v2';
export const LEGACY_STORAGE_KEY = 'cadetmate-buoyage-v1';

export const DEFAULT_CAMERA: CameraState = { x: 0, y: 0, zoom: 1 };

export function createEmptyDocument(region: IalaRegion = 'A'): BuoyageDocument {
  return {
    version: 2,
    region,
    marks: [],
    ships: [],
    paths: [],
    notes: [],
    viewpoints: [],
    activeViewpointId: null,
    activeShipId: null,
    camera: { ...DEFAULT_CAMERA },
    nightMode: false,
    gridVisible: true,
    snapEnabled: true,
    viewMode: 'plan',
  };
}

export function serializeDocument(doc: BuoyageDocument): string {
  return JSON.stringify(doc, null, 2);
}

export function parseDocument(json: string): BuoyageDocument {
  const data = JSON.parse(json) as BuoyageDocument & { version?: number };
  if (!Array.isArray(data.marks)) {
    throw new Error('Invalid buoyage document');
  }

  const viewMode: ViewMode =
    data.viewMode === 'split' || data.viewMode === 'vessel' ? data.viewMode : 'plan';

  return {
    version: 2,
    region: data.region === 'B' ? 'B' : 'A',
    marks: data.marks.map(normalizeMark),
    ships: (data.ships ?? []).map(normalizeShip),
    paths: (data.paths ?? []).map(normalizePath),
    notes: (data.notes ?? []).map(normalizeNote),
    viewpoints: (data.viewpoints ?? []).map(normalizeViewpoint),
    activeViewpointId: data.activeViewpointId ?? null,
    activeShipId:
      data.activeShipId ??
      data.ships?.find((s) => s.shipType === 'own')?.id ??
      data.ships?.[0]?.id ??
      null,
    camera: {
      x: Number(data.camera?.x) || 0,
      y: Number(data.camera?.y) || 0,
      zoom: Number(data.camera?.zoom) || 1,
    },
    nightMode: Boolean(data.nightMode),
    gridVisible: data.gridVisible !== false,
    snapEnabled: data.snapEnabled !== false,
    viewMode,
  };
}

function normalizeMark(m: CanvasMark): CanvasMark {
  return {
    id: String(m.id),
    definitionId: String(m.definitionId),
    x: Number(m.x) || 0,
    y: Number(m.y) || 0,
    rotation: Number(m.rotation) || 0,
    scale: Number(m.scale) || 1,
    label: m.label,
    nightMode: m.nightMode ?? null,
    notes: m.notes,
    lightCharacteristicOverride: m.lightCharacteristicOverride,
    zIndex: Number(m.zIndex) || 0,
  };
}

function normalizeShip(s: CanvasShip): CanvasShip {
  return {
    id: String(s.id),
    x: Number(s.x) || 0,
    y: Number(s.y) || 0,
    rotation: Number(s.rotation) || 0,
    scale: Number(s.scale) || 1,
    shipType: s.shipType ?? 'target',
    label: s.label,
    color: s.color ?? '#334155',
    fov: Number(s.fov) || 90,
    speed: Number(s.speed) || 0,
    throttle: clampNum(Number(s.throttle) || 0, -1, 1),
    rudder: clampNum(Number(s.rudder) || 0, -1, 1),
    track: (s.track ?? []).map((pt) => ({ x: Number(pt.x) || 0, y: Number(pt.y) || 0 })),
    zIndex: Number(s.zIndex) || 0,
  };
}

function clampNum(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function normalizePath(p: CanvasPath): CanvasPath {
  return {
    id: String(p.id),
    points: (p.points ?? []).map((pt) => ({ x: Number(pt.x) || 0, y: Number(pt.y) || 0 })),
    color: p.color ?? '#FBBF24',
    strokeWidth: Number(p.strokeWidth) || 3,
    dashed: Boolean(p.dashed),
    label: p.label,
    zIndex: Number(p.zIndex) || 0,
  };
}

function normalizeNote(n: CanvasNote): CanvasNote {
  return {
    id: String(n.id),
    x: Number(n.x) || 0,
    y: Number(n.y) || 0,
    width: Number(n.width) || 160,
    height: Number(n.height) || 100,
    text: String(n.text ?? ''),
    color: n.color ?? '#FEF08A',
    zIndex: Number(n.zIndex) || 0,
  };
}

function normalizeViewpoint(v: CanvasViewpoint): CanvasViewpoint {
  return {
    id: String(v.id),
    x: Number(v.x) || 0,
    y: Number(v.y) || 0,
    heading: Number(v.heading) || 0,
    fov: Number(v.fov) || 90,
    label: v.label,
    zIndex: Number(v.zIndex) || 0,
  };
}

export function saveToLocalStorage(doc: BuoyageDocument) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, serializeDocument(doc));
  } catch {
    // quota / private mode
  }
}

export function loadFromLocalStorage(): BuoyageDocument | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    return parseDocument(raw);
  } catch {
    return null;
  }
}

export function downloadJson(doc: BuoyageDocument, filename = 'buoyage-scene.json') {
  const blob = new Blob([serializeDocument(doc)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
