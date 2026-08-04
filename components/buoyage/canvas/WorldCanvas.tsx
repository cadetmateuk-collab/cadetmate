'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import { BuoyMarkRenderer } from '@/components/buoyage/marks/BuoyMarkRenderer';
import { ShipRenderer } from '@/components/buoyage/marks/ShipRenderer';
import { ShipTrackRenderer } from '@/components/buoyage/marks/ShipTrackRenderer';
import { PathRenderer } from '@/components/buoyage/marks/PathRenderer';
import { NoteRenderer } from '@/components/buoyage/marks/NoteRenderer';
import {
  GRID_SIZE,
  hitTestMark,
  hitTestNote,
  MARK_HIT_SIZE,
  rectContainsPoint,
  screenToWorld,
  SHIP_HIT_SIZE,
  snapToGrid,
  wheelZoomFactor,
} from '@/lib/buoyage/geometry';
import { DND_TYPE } from '@/components/buoyage/dnd';
import { TransformHandles } from './TransformHandles';

type DragMode =
  | { type: 'pan'; lastX: number; lastY: number }
  | {
      type: 'move';
      origins: Record<string, { x: number; y: number }>;
      startWorld: { x: number; y: number };
    }
  | { type: 'marquee'; startWorld: { x: number; y: number }; current: { x: number; y: number } }
  | { type: 'draw'; pathId: string }
  | { type: 'erase' }
  | null;

export function WorldCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const marks = useBuoyageStore((s) => s.marks);
  const ships = useBuoyageStore((s) => s.ships);
  const paths = useBuoyageStore((s) => s.paths);
  const notes = useBuoyageStore((s) => s.notes);
  const activeShipId = useBuoyageStore((s) => s.activeShipId);
  const selectedIds = useBuoyageStore((s) => s.selectedIds);
  const camera = useBuoyageStore((s) => s.camera);
  const nightMode = useBuoyageStore((s) => s.nightMode);
  const gridVisible = useBuoyageStore((s) => s.gridVisible);
  const tool = useBuoyageStore((s) => s.tool);
  const pendingDefinitionId = useBuoyageStore((s) => s.pendingDefinitionId);

  const [drag, setDrag] = useState<DragMode>(null);
  const [spaceDown, setSpaceDown] = useState(false);
  const historyPushed = useRef(false);

  // Smooth zoom via rAF accumulation
  const zoomTarget = useRef(camera.zoom);
  const zoomAnchor = useRef<{ x: number; y: number } | null>(null);
  const zoomRaf = useRef<number | null>(null);
  const pinchRef = useRef<{
    lastDist: number;
    midX: number;
    midY: number;
  } | null>(null);
  const panLastRef = useRef({ x: 0, y: 0 });
  const panDeltaRef = useRef({ x: 0, y: 0 });
  const panRafRef = useRef<number | null>(null);

  const flushPan = useCallback(() => {
    panRafRef.current = null;
    const { x, y } = panDeltaRef.current;
    if (x === 0 && y === 0) return;
    panDeltaRef.current = { x: 0, y: 0 };
    const store = useBuoyageStore.getState();
    store.setCamera({
      x: store.camera.x + x,
      y: store.camera.y + y,
    });
  }, []);

  useEffect(() => {
    zoomTarget.current = camera.zoom;
  }, [camera.zoom]);

  useEffect(() => {
    return () => {
      if (panRafRef.current != null) cancelAnimationFrame(panRafRef.current);
    };
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSpaceDown(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const getRect = () => containerRef.current!.getBoundingClientRect();

  const toWorld = useCallback((clientX: number, clientY: number) => {
    const rect = getRect();
    return screenToWorld(clientX, clientY, useBuoyageStore.getState().camera, rect);
  }, []);

  const applySmoothZoom = useCallback(() => {
    zoomRaf.current = null;
    const store = useBuoyageStore.getState();
    const current = store.camera.zoom;
    const target = zoomTarget.current;
    const next = current + (target - current) * 0.35;
    if (Math.abs(target - next) < 0.0005) {
      store.setZoom(target, zoomAnchor.current ?? undefined);
      zoomAnchor.current = null;
      return;
    }
    store.setZoom(next, zoomAnchor.current ?? undefined);
    zoomRaf.current = requestAnimationFrame(applySmoothZoom);
  }, []);

  const queueZoom = useCallback(
    (factor: number, anchor: { x: number; y: number }) => {
      zoomTarget.current = Math.min(
        4,
        Math.max(0.15, zoomTarget.current * factor),
      );
      zoomAnchor.current = anchor;
      if (zoomRaf.current == null) {
        zoomRaf.current = requestAnimationFrame(applySmoothZoom);
      }
    },
    [applySmoothZoom],
  );

  // Wheel zoom (smooth, cursor-centered)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = wheelZoomFactor(e.deltaY, e.deltaMode);
      queueZoom(factor, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [queueZoom]);

  // Pinch-to-zoom + two-finger pan (incremental, rAF-friendly)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const a = e.touches[0];
        const b = e.touches[1];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const rect = el.getBoundingClientRect();
        pinchRef.current = {
          lastDist: dist,
          midX: (a.clientX + b.clientX) / 2 - rect.left,
          midY: (a.clientY + b.clientY) / 2 - rect.top,
        };
        setDrag(null);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const a = e.touches[0];
        const b = e.touches[1];
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const rect = el.getBoundingClientRect();
        const midX = (a.clientX + b.clientX) / 2 - rect.left;
        const midY = (a.clientY + b.clientY) / 2 - rect.top;
        const store = useBuoyageStore.getState();
        const factor = dist / Math.max(1, pinchRef.current.lastDist);
        const dx = midX - pinchRef.current.midX;
        const dy = midY - pinchRef.current.midY;

        store.setZoom(store.camera.zoom * factor, { x: midX, y: midY });
        const cam = useBuoyageStore.getState().camera;
        store.setCamera({ x: cam.x + dx, y: cam.y + dy });

        pinchRef.current = { lastDist: dist, midX, midY };
        zoomTarget.current = useBuoyageStore.getState().camera.zoom;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchRef.current = null;
        zoomTarget.current = useBuoyageStore.getState().camera.zoom;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const store = useBuoyageStore.getState();
    if (store.marks.length > 0 || store.ships.length > 0) return;
    if (store.camera.x !== 0 || store.camera.y !== 0) return;
    store.setCamera({
      x: el.clientWidth / 2,
      y: el.clientHeight / 2,
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const preventAux = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    el.addEventListener('mousedown', preventAux);
    el.addEventListener('auxclick', preventAux);
    return () => {
      el.removeEventListener('mousedown', preventAux);
      el.removeEventListener('auxclick', preventAux);
    };
  }, []);

  const collectOrigins = (ids: string[]) => {
    const store = useBuoyageStore.getState();
    const idSet = new Set(ids);
    const origins: Record<string, { x: number; y: number }> = {};
    for (const m of store.marks) if (idSet.has(m.id)) origins[m.id] = { x: m.x, y: m.y };
    for (const m of store.ships) if (idSet.has(m.id)) origins[m.id] = { x: m.x, y: m.y };
    for (const m of store.notes) if (idSet.has(m.id)) origins[m.id] = { x: m.x, y: m.y };
    for (const m of store.viewpoints) if (idSet.has(m.id)) origins[m.id] = { x: m.x, y: m.y };
    return origins;
  };

  const onObjectPointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button === 1 || spaceDown || tool === 'pan') return;
    if (tool === 'pen' || tool === 'erase') return;
    e.stopPropagation();
    e.preventDefault();
    const store = useBuoyageStore.getState();
    const additive = e.shiftKey;
    const already = store.selectedIds.includes(id);

    if (additive && !already) store.select([...store.selectedIds, id]);
    else if (!already) store.select([id]);

    if (id.startsWith('ship')) {
      store.setActiveShipId(id);
    }

    const selected = useBuoyageStore.getState().selectedIds;
    historyPushed.current = false;
    setDrag({
      type: 'move',
      origins: collectOrigins(selected),
      startWorld: toWorld(e.clientX, e.clientY),
    });
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const hitTestAll = (world: { x: number; y: number }) => {
    const store = useBuoyageStore.getState();
    type Hit = { id: string; z: number };
    const hits: Hit[] = [];

    for (const m of store.marks) {
      if (hitTestMark(world.x, world.y, m)) hits.push({ id: m.id, z: m.zIndex });
    }
    for (const m of store.ships) {
      if (hitTestMark(world.x, world.y, m, SHIP_HIT_SIZE)) hits.push({ id: m.id, z: m.zIndex });
    }
    for (const m of store.viewpoints) {
      if (hitTestMark(world.x, world.y, { ...m, scale: 1 }, 48))
        hits.push({ id: m.id, z: m.zIndex });
    }
    for (const m of store.notes) {
      if (hitTestNote(world.x, world.y, m)) hits.push({ id: m.id, z: m.zIndex });
    }
    for (const p of store.paths) {
      // rough hit: near any segment
      for (let i = 0; i < p.points.length - 1; i++) {
        const a = p.points[i];
        const b = p.points[i + 1];
        const t = Math.max(
          0,
          Math.min(
            1,
            ((world.x - a.x) * (b.x - a.x) + (world.y - a.y) * (b.y - a.y)) /
              (Math.hypot(b.x - a.x, b.y - a.y) ** 2 || 1),
          ),
        );
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        if (Math.hypot(world.x - px, world.y - py) < 10) {
          hits.push({ id: p.id, z: p.zIndex });
          break;
        }
      }
    }

    hits.sort((a, b) => b.z - a.z);
    return hits[0]?.id ?? null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    if (pinchRef.current) return;

    const store = useBuoyageStore.getState();
    const isTouch = e.pointerType === 'touch';
    const isPan =
      e.button === 1 ||
      (e.button === 0 && spaceDown) ||
      tool === 'pan';

    if (isPan && e.button !== 2) {
      e.preventDefault();
      panLastRef.current = { x: e.clientX, y: e.clientY };
      setDrag({ type: 'pan', lastX: e.clientX, lastY: e.clientY });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }
    if (e.button !== 0) return;

    const world = toWorld(e.clientX, e.clientY);

    // Tap-to-place pending buoy (touch-friendly; works with mouse too)
    if (store.pendingDefinitionId) {
      store.addMark(store.pendingDefinitionId, world.x, world.y);
      store.setPendingDefinitionId(null);
      return;
    }

    if (tool === 'ship') {
      store.addShip(world.x, world.y);
      return;
    }
    if (tool === 'note') {
      store.addNote(world.x, world.y);
      return;
    }
    if (tool === 'pen') {
      const pathId = store.startPath(world.x, world.y);
      setDrag({ type: 'draw', pathId });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }
    if (tool === 'erase') {
      historyPushed.current = false;
      const hit = hitTestAll(world);
      if (hit) {
        store.pushHistory();
        historyPushed.current = true;
        store.deleteByIds([hit], false);
      }
      setDrag({ type: 'erase' });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }

    const hit = hitTestAll(world);
    if (hit) {
      onObjectPointerDown(e, hit);
      return;
    }

    // Touch on empty canvas: pan (not marquee). Mouse keeps marquee select.
    if (isTouch && tool === 'select') {
      e.preventDefault();
      panLastRef.current = { x: e.clientX, y: e.clientY };
      setDrag({ type: 'pan', lastX: e.clientX, lastY: e.clientY });
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!e.shiftKey) store.clearSelection();
    setDrag({
      type: 'marquee',
      startWorld: world,
      current: world,
    });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const store = useBuoyageStore.getState();

    if (drag.type === 'pan') {
      const dx = e.clientX - panLastRef.current.x;
      const dy = e.clientY - panLastRef.current.y;
      panLastRef.current = { x: e.clientX, y: e.clientY };
      // Coalesce store updates to one per animation frame (smoother 60fps pans).
      panDeltaRef.current.x += dx;
      panDeltaRef.current.y += dy;
      if (panRafRef.current == null) {
        panRafRef.current = requestAnimationFrame(flushPan);
      }
      return;
    }

    if (drag.type === 'draw') {
      const world = toWorld(e.clientX, e.clientY);
      store.appendPathPoint(drag.pathId, world.x, world.y);
      return;
    }

    if (drag.type === 'erase') {
      const world = toWorld(e.clientX, e.clientY);
      const hit = hitTestAll(world);
      if (hit) {
        if (!historyPushed.current) {
          store.pushHistory();
          historyPushed.current = true;
        }
        store.deleteByIds([hit], false);
      }
      return;
    }

    if (drag.type === 'move') {
      if (!historyPushed.current) {
        store.pushHistory();
        historyPushed.current = true;
      }
      const world = toWorld(e.clientX, e.clientY);
      const dx = world.x - drag.startWorld.x;
      const dy = world.y - drag.startWorld.y;
      const snap = store.snapEnabled;
      const origins = drag.origins;
      const idSet = new Set(Object.keys(origins));

      useBuoyageStore.setState((s) => ({
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
          // path move not in origins — skip
          return p;
        }),
      }));
      return;
    }

    if (drag.type === 'marquee') {
      setDrag({
        ...drag,
        current: toWorld(e.clientX, e.clientY),
      });
    }
  };

  const onPointerUp = () => {
    if (panRafRef.current != null) {
      cancelAnimationFrame(panRafRef.current);
      flushPan();
    }
    if (drag?.type === 'draw') {
      useBuoyageStore.getState().finishPath(drag.pathId);
    }
    if (drag?.type === 'marquee') {
      const { startWorld, current } = drag;
      const rw = current.x - startWorld.x;
      const rh = current.y - startWorld.y;
      if (Math.abs(rw) > 4 || Math.abs(rh) > 4) {
        const store = useBuoyageStore.getState();
        const ids = [
          ...store.marks
            .filter((m) => rectContainsPoint(startWorld.x, startWorld.y, rw, rh, m.x, m.y))
            .map((m) => m.id),
          ...store.ships
            .filter((m) => rectContainsPoint(startWorld.x, startWorld.y, rw, rh, m.x, m.y))
            .map((m) => m.id),
          ...store.notes
            .filter((m) =>
              rectContainsPoint(
                startWorld.x,
                startWorld.y,
                rw,
                rh,
                m.x + m.width / 2,
                m.y + m.height / 2,
              ),
            )
            .map((m) => m.id),
          ...store.viewpoints
            .filter((m) => rectContainsPoint(startWorld.x, startWorld.y, rw, rh, m.x, m.y))
            .map((m) => m.id),
        ];
        store.select(ids);
      }
    }
    setDrag(null);
    historyPushed.current = false;
  };

  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DND_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const definitionId = e.dataTransfer.getData(DND_TYPE);
    if (!definitionId) return;
    const world = toWorld(e.clientX, e.clientY);
    const store = useBuoyageStore.getState();
    store.addMark(definitionId, world.x, world.y);
    store.setPendingDefinitionId(null);
  };

  const sortedMarks = [...marks].sort((a, b) => a.zIndex - b.zIndex);
  const bg = nightMode
    ? 'radial-gradient(ellipse at center, #0a1628 0%, #050b14 100%)'
    : 'radial-gradient(ellipse at center, #1a6b9a 0%, #0d4a6e 55%, #0a3a58 100%)';

  const gridColor = nightMode ? 'rgba(120,180,255,0.08)' : 'rgba(255,255,255,0.12)';
  const majorGrid = nightMode ? 'rgba(120,180,255,0.14)' : 'rgba(255,255,255,0.2)';

  let marqueeStyle: React.CSSProperties | null = null;
  if (drag?.type === 'marquee') {
    const x = Math.min(drag.startWorld.x, drag.current.x);
    const y = Math.min(drag.startWorld.y, drag.current.y);
    marqueeStyle = {
      left: x,
      top: y,
      width: Math.abs(drag.current.x - drag.startWorld.x),
      height: Math.abs(drag.current.y - drag.startWorld.y),
    };
  }

  const cursor =
    tool === 'pan' || spaceDown || drag?.type === 'pan'
      ? 'grab'
      : pendingDefinitionId
        ? 'copy'
        : tool === 'pen'
          ? 'crosshair'
          : tool === 'erase'
            ? 'cell'
            : tool === 'ship' || tool === 'note'
              ? 'copy'
              : drag?.type === 'marquee'
                ? 'crosshair'
                : 'default';

  const selectedMark = selectedIds.length === 1 ? marks.find((m) => m.id === selectedIds[0]) : null;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden touch-none cm-drag-surface"
      style={{ background: bg, cursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Grid + marquee: OK to CSS-scale (not critical for crisp vectors) */}
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
        }}
      >
        {gridVisible && (
          <div
            className="absolute"
            style={{
              left: -5000,
              top: -5000,
              width: 10000,
              height: 10000,
              backgroundImage: `
                linear-gradient(${gridColor} 1px, transparent 1px),
                linear-gradient(90deg, ${gridColor} 1px, transparent 1px),
                linear-gradient(${majorGrid} 1px, transparent 1px),
                linear-gradient(90deg, ${majorGrid} 1px, transparent 1px)
              `,
              backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE}px ${GRID_SIZE}px, ${GRID_SIZE * 5}px ${GRID_SIZE * 5}px, ${GRID_SIZE * 5}px ${GRID_SIZE * 5}px`,
            }}
          />
        )}
        {marqueeStyle && (
          <div
            className="absolute border border-[#2A61FA] bg-[#2A61FA]/15"
            style={marqueeStyle}
          />
        )}
      </div>

      {/* Objects in screen space so SVG stays vector-crisp at any zoom */}
      <div className="absolute inset-0">
        {ships.map((ship) => (
          <ShipTrackRenderer key={`track-${ship.id}`} ship={ship} />
        ))}

        {paths.map((path) => (
          <PathRenderer
            key={path.id}
            path={path}
            selected={selectedIds.includes(path.id)}
            onPointerDown={onObjectPointerDown}
          />
        ))}

        {sortedMarks.map((mark) => (
          <BuoyMarkRenderer
            key={mark.id}
            mark={mark}
            selected={selectedIds.includes(mark.id)}
            onPointerDown={onObjectPointerDown}
          />
        ))}

        {ships.map((ship) => (
          <ShipRenderer
            key={ship.id}
            ship={ship}
            selected={selectedIds.includes(ship.id)}
            activeCamera={ship.id === activeShipId}
            onPointerDown={onObjectPointerDown}
          />
        ))}

        {notes.map((note) => (
          <NoteRenderer
            key={note.id}
            note={note}
            selected={selectedIds.includes(note.id)}
            onPointerDown={onObjectPointerDown}
          />
        ))}

        {selectedMark && (
          <TransformHandles markId={selectedMark.id} hitSize={MARK_HIT_SIZE} />
        )}
      </div>
    </div>
  );
}
