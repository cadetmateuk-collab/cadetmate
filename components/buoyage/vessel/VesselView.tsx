'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Copy, Download, Eye, Radar, RotateCcw, Ship, SlidersHorizontal, Wrench } from 'lucide-react';
import { getDefinition } from '@/data/buoyage';
import { isMarkLightOnAt, parseCharacteristic } from '@/data/buoyage/light-patterns';
import {
  bearingDeg,
  distance,
  normalizeAngleDiff,
} from '@/lib/buoyage/geometry';
import {
  apparentSize,
  bearingToScreenX,
  BRIDGE_DEV_TOOLS,
  buildBridgeExportPayload,
  DEFAULT_BRIDGE_PROJECTION,
  loadBridgeProjection,
  passOpacity,
  rangeToScreenY,
  saveBridgeProjection,
  type BridgeProjection,
} from '@/lib/buoyage/bridge-projection';
import {
  bridgeUiScale,
  containedStageSize,
} from '@/lib/buoyage/bridge-stage';
import {
  buildRadarExportPayload,
  DEFAULT_RADAR_LAYOUT,
  loadRadarLayout,
  RADAR_DEV_TOOLS,
  radarPlaneOrigin,
  radarPlaneTransform,
  saveRadarLayout,
  scaleRadarLayout,
  type RadarLayout,
} from '@/lib/buoyage/radar-layout';
import { useBuoyageStore } from '@/hooks/buoyage/useBuoyageStore';
import { MarkVisual } from '@/components/buoyage/marks/MarkVisual';
import { RadarScreen } from '@/components/buoyage/vessel/RadarScreen';
import { HelmWheel } from '@/components/buoyage/vessel/HelmWheel';
import { InstrumentPanel } from '@/components/buoyage/vessel/InstrumentPanel';
import { HELM_ASSETS } from '@/lib/buoyage/assets';
import {
  buildHelmExportPayload,
  DEFAULT_INSTRUMENT_LAYOUT,
  DEFAULT_WHEEL_LAYOUT,
  HELM_DEV_TOOLS,
  loadInstrumentLayout,
  loadWheelLayout,
  planeOrigin,
  planeTransform,
  saveInstrumentLayout,
  saveWheelLayout,
  scaleInstrumentLayout,
  scaleWheelLayout,
  type InstrumentLayout,
  type WheelLayout,
} from '@/lib/buoyage/helm-layout';

const LIGHT_HEX: Record<string, string> = {
  red: '#FF4D4D',
  green: '#3DFF8A',
  white: '#FFFFFF',
  yellow: '#FFE066',
  blue: '#66B3FF',
  none: 'transparent',
};

/** Hides itself if the asset file is missing (404). */
function HelmImage({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      onError={() => setOk(false)}
    />
  );
}

type HorizonItem = {
  id: string;
  kind: 'buoy' | 'ship';
  label: string;
  relativeBearing: number;
  range: number;
  lightColour?: string;
  lightOn?: boolean;
  definitionId?: string;
  night: boolean;
  bodyColor?: string;
  xPct: number;
  yPct: number;
  size: number;
  opacity: number;
};

export function VesselView() {
  const nightMode = useBuoyageStore((s) => s.nightMode);
  const marks = useBuoyageStore((s) => s.marks);
  const ships = useBuoyageStore((s) => s.ships);
  const activeShipId = useBuoyageStore((s) => s.activeShipId);
  const setActiveShipId = useBuoyageStore((s) => s.setActiveShipId);
  const updateShip = useBuoyageStore((s) => s.updateShip);
  const clearShipTrack = useBuoyageStore((s) => s.clearShipTrack);

  const [tick, setTick] = useState(0);
  const [proj, setProj] = useState<BridgeProjection>(DEFAULT_BRIDGE_PROJECTION);
  const [radar, setRadar] = useState<RadarLayout>(DEFAULT_RADAR_LAYOUT);
  const [wheelLayout, setWheelLayout] = useState<WheelLayout>(DEFAULT_WHEEL_LAYOUT);
  const [instLayout, setInstLayout] = useState<InstrumentLayout>(DEFAULT_INSTRUMENT_LAYOUT);
  const [devOpen, setDevOpen] = useState(false);
  const [radarDevOpen, setRadarDevOpen] = useState(false);
  const [helmDevOpen, setHelmDevOpen] = useState(HELM_DEV_TOOLS);
  const [helmTuneTab, setHelmTuneTab] = useState<'wheel' | 'instruments'>('instruments');
  const [display, setDisplay] = useState<'bridge' | 'radar'>('bridge');
  const [hideHelmUi, setHideHelmUi] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'copied' | 'saved'>('idle');
  const stageOuterRef = useRef<HTMLDivElement>(null);
  const [stagePx, setStagePx] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setProj(loadBridgeProjection());
    setRadar(loadRadarLayout());
    setWheelLayout(loadWheelLayout());
    setInstLayout(loadInstrumentLayout());
  }, []);

  // Keep helm / radar / overlay in a fixed 16:9 stage that scales to fit
  useEffect(() => {
    if (display !== 'bridge') return;
    const el = stageOuterRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setStagePx(containedStageSize(width, height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [display, activeShipId, ships.length]);

  const patchProj = (patch: Partial<BridgeProjection>) => {
    setProj((prev) => {
      const next = { ...prev, ...patch };
      saveBridgeProjection(next);
      return next;
    });
  };

  const patchRadar = (patch: Partial<RadarLayout>) => {
    setRadar((prev) => {
      const next = { ...prev, ...patch };
      saveRadarLayout(next);
      return next;
    });
  };

  const patchWheel = (patch: Partial<WheelLayout>) => {
    setWheelLayout((prev) => {
      const next = { ...prev, ...patch };
      saveWheelLayout(next);
      return next;
    });
  };

  const patchInst = (patch: Partial<InstrumentLayout>) => {
    setInstLayout((prev) => {
      const next = { ...prev, ...patch };
      saveInstrumentLayout(next);
      return next;
    });
  };

  const cameraShip =
    ships.find((s) => s.id === activeShipId) ??
    ships.find((s) => s.shipType === 'own') ??
    ships[0] ??
    null;

  useEffect(() => {
    if (!cameraShip) return;
    if (activeShipId !== cameraShip.id) setActiveShipId(cameraShip.id);
    // Light flash animation only needed at night — avoid 10Hz re-renders in daylight
    if (!nightMode) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [cameraShip, activeShipId, setActiveShipId, nightMode]);

  // Keyboard helm: W/S throttle, A/D rudder (hold)
  useEffect(() => {
    if (!cameraShip) return;
    const down = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (!['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k))
        return;
      e.preventDefault();
      down.add(k);
      const id = cameraShip.id;
      if (k === 'w' || k === 'arrowup') updateShip(id, { throttle: 1 }, false);
      if (k === 's' || k === 'arrowdown') updateShip(id, { throttle: -1 }, false);
      if (k === 'a' || k === 'arrowleft') updateShip(id, { rudder: -1 }, false);
      if (k === 'd' || k === 'arrowright') updateShip(id, { rudder: 1 }, false);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      down.delete(k);
      const id = cameraShip.id;
      if (k === 'w' || k === 's' || k === 'arrowup' || k === 'arrowdown') {
        if (![...down].some((x) => ['w', 's', 'arrowup', 'arrowdown'].includes(x))) {
          updateShip(id, { throttle: 0 }, false);
        }
      }
      if (k === 'a' || k === 'd' || k === 'arrowleft' || k === 'arrowright') {
        if (![...down].some((x) => ['a', 'd', 'arrowleft', 'arrowright'].includes(x))) {
          updateShip(id, { rudder: 0 }, false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [cameraShip, updateShip]);

  const items = useMemo(() => {
    if (!cameraShip) return [] as HorizonItem[];
    const list: HorizonItem[] = [];
    const fov = cameraShip.fov || 90;
    const halfFov = fov / 2;
    const heading = cameraShip.rotation;

    for (const m of marks) {
      const def = getDefinition(m.definitionId);
      if (!def) continue;
      const range = distance(cameraShip.x, cameraShip.y, m.x, m.y);
      if (proj.minVisibleRange > 0 && range < proj.minVisibleRange) continue;
      if (proj.maxVisibleRange > 0 && range > proj.maxVisibleRange) continue;
      const opacity = passOpacity(range, proj);
      if (opacity <= 0.02) continue;
      const abs = bearingDeg(cameraShip.x, cameraShip.y, m.x, m.y);
      const rel = normalizeAngleDiff(abs - heading);
      if (Math.abs(rel) > halfFov) continue;

      const night =
        m.nightMode === true || m.nightMode === false ? m.nightMode : nightMode;
      let lightOn = false;
      if (night && def.lightColour !== 'none') {
        const seq = m.lightCharacteristicOverride
          ? parseCharacteristic(m.lightCharacteristicOverride, def.periodSec)
          : def.flashSequence;
        lightOn = isMarkLightOnAt(seq, performance.now() / 1000, m.id);
      }

      const xPct = bearingToScreenX(rel, halfFov, range, proj);
      const yPct = rangeToScreenY(range, proj);
      const size = apparentSize(range, 'buoy', proj);

      list.push({
        id: m.id,
        kind: 'buoy',
        label: m.label || def.name,
        relativeBearing: rel,
        range,
        lightColour: def.lightColour,
        lightOn,
        definitionId: m.definitionId,
        night,
        xPct,
        yPct,
        size,
        opacity,
      });
    }

    for (const s of ships) {
      if (s.id === cameraShip.id) continue;
      const range = distance(cameraShip.x, cameraShip.y, s.x, s.y);
      if (proj.minVisibleRange > 0 && range < proj.minVisibleRange) continue;
      if (proj.maxVisibleRange > 0 && range > proj.maxVisibleRange) continue;
      const opacity = passOpacity(range, proj);
      if (opacity <= 0.02) continue;
      const abs = bearingDeg(cameraShip.x, cameraShip.y, s.x, s.y);
      const rel = normalizeAngleDiff(abs - heading);
      if (Math.abs(rel) > halfFov) continue;
      list.push({
        id: s.id,
        kind: 'ship',
        label: s.label || s.shipType,
        relativeBearing: rel,
        range,
        night: nightMode,
        bodyColor: s.color,
        xPct: bearingToScreenX(rel, halfFov, range, proj),
        yPct: rangeToScreenY(range, proj),
        size: apparentSize(range, 'ship', proj),
        opacity,
      });
    }

    return list.sort((a, b) => b.range - a.range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraShip, marks, ships, nightMode, tick, proj]);

  if (!cameraShip) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-slate-900 px-6 text-center text-sm text-slate-400">
        <Eye className="h-8 w-8 opacity-50" />
        <p>
          Place an <strong className="text-white">Own ship</strong> on the plan — bridge camera
          looks ahead and slightly down the channel.
        </p>
      </div>
    );
  }

  const fov = cameraShip.fov || 90;
  const heading = ((cameraShip.rotation % 360) + 360) % 360;
  const throttle = cameraShip.throttle ?? 0;
  const rudder = cameraShip.rudder ?? 0;
  const speed = cameraShip.speed ?? 0;

  const uiScale = stagePx.width > 0 ? bridgeUiScale(stagePx.width) : 1;
  const radarFit = scaleRadarLayout(radar, uiScale);
  const wheelFit = scaleWheelLayout(wheelLayout, uiScale);
  const instFit = scaleInstrumentLayout(instLayout, uiScale);

  const sky = nightMode
    ? 'linear-gradient(to bottom, #020617 0%, #0f172a 50%, #1e293b 100%)'
    : 'linear-gradient(to bottom, #6ec8f5 0%, #a8dffc 40%, #d4eefc 100%)';
  const sea = nightMode
    ? 'linear-gradient(to bottom, #0c1929 0%, #071018 55%, #020617 100%)'
    : 'linear-gradient(to bottom, #0f7a96 0%, #0c5f78 45%, #0a4a5e 100%)';

  const copyJson = async () => {
    const payload = buildBridgeExportPayload(fov, proj);
    const text = JSON.stringify(payload, null, 2);
    await navigator.clipboard.writeText(text);
    setExportStatus('copied');
    window.setTimeout(() => setExportStatus('idle'), 2000);
  };

  const exportJsonFile = async () => {
    const payload = buildBridgeExportPayload(fov, proj);
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard optional */
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bridge-projection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('saved');
    window.setTimeout(() => setExportStatus('idle'), 2000);
  };

  const exportRadarFile = async () => {
    const payload = buildRadarExportPayload(radar);
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* optional */
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radar-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('saved');
    window.setTimeout(() => setExportStatus('idle'), 2000);
  };

  const copyRadarJson = async () => {
    const text = JSON.stringify(buildRadarExportPayload(radar), null, 2);
    await navigator.clipboard.writeText(text);
    setExportStatus('copied');
    window.setTimeout(() => setExportStatus('idle'), 2000);
  };

  const exportHelmFile = async () => {
    const text = JSON.stringify(buildHelmExportPayload(wheelLayout, instLayout), null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* optional */
    }
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helm-layout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus('saved');
    window.setTimeout(() => setExportStatus('idle'), 2000);
  };

  const copyHelmJson = async () => {
    const text = JSON.stringify(buildHelmExportPayload(wheelLayout, instLayout), null, 2);
    await navigator.clipboard.writeText(text);
    setExportStatus('copied');
    window.setTimeout(() => setExportStatus('idle'), 2000);
  };

  // Full radar display mode
  if (display === 'radar') {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-slate-950">
        <div className="absolute left-2 top-2 z-[70] flex flex-wrap items-center gap-1">
          <button
            type="button"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-black/65 px-3 text-[11px] font-semibold text-white touch-manipulation hover:bg-black/80"
            onClick={() => setDisplay('bridge')}
          >
            <Eye className="h-3.5 w-3.5" />
            Bridge
          </button>
          {RADAR_DEV_TOOLS && (
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 text-[11px] font-semibold text-emerald-100 touch-manipulation hover:bg-emerald-500/30"
              onClick={() => setRadarDevOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Radar tune
            </button>
          )}
        </div>
        <div className="relative min-h-0 flex-1 p-3 pt-14 sm:p-6 sm:pt-16">
          <RadarScreen
            cameraShip={cameraShip}
            layout={radar}
            mode="full"
            className="h-full w-full max-w-3xl mx-auto aspect-square sm:aspect-auto"
          />
        </div>
        <div className="absolute bottom-2 left-2 right-2 z-50 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/55 p-3 backdrop-blur-sm sm:left-auto sm:right-2 sm:w-80">
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/70">
            Throttle
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={throttle}
              className="mt-2 h-8 w-full accent-[#2A61FA] touch-manipulation"
              onChange={(e) =>
                updateShip(cameraShip.id, { throttle: Number(e.target.value) }, false)
              }
            />
          </label>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-white/70">
            Rudder
            <input
              type="range"
              min={-1}
              max={1}
              step={0.05}
              value={rudder}
              className="mt-2 h-8 w-full accent-emerald-400 touch-manipulation"
              onChange={(e) =>
                updateShip(cameraShip.id, { rudder: Number(e.target.value) }, false)
              }
              onPointerUp={() => updateShip(cameraShip.id, { rudder: 0 }, false)}
            />
          </label>
        </div>
        {RADAR_DEV_TOOLS && radarDevOpen && (
          <RadarTunePanel
            radar={radar}
            patchRadar={patchRadar}
            onExport={exportRadarFile}
            onCopy={copyRadarJson}
            exportStatus={exportStatus}
            hideHelmUi={hideHelmUi}
            onToggleHelmUi={() => setHideHelmUi((v) => !v)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950">
      <div ref={stageOuterRef} className="relative min-h-0 flex-1">
        {/* Fixed 16:9 bridge stage — letterboxes on tablet / tall panes */}
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <div
            className="relative overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
            style={
              stagePx.width > 0
                ? { width: stagePx.width, height: stagePx.height }
                : { width: '100%', maxHeight: '100%', aspectRatio: '16 / 9' }
            }
          >
        {/* Sea / sky — under buoys */}
        <div className="absolute inset-0 z-0" style={{ background: sky }} />
        <div
          className="absolute inset-x-0 bottom-0 z-0"
          style={{
            height: `${100 - proj.horizonY}%`,
            background: sea,
            backgroundImage: nightMode
              ? `linear-gradient(to bottom, rgba(120,180,255,0.06) 0%, transparent 8%), ${sea}`
              : `linear-gradient(to bottom, rgba(255,255,255,0.12) 0%, transparent 10%), ${sea}`,
          }}
        />

        {/* Guide lines while tuning */}
        {BRIDGE_DEV_TOOLS && devOpen && (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 z-[55] border-t border-dashed border-sky-300/90"
              style={{ top: `${proj.horizonY}%` }}
            >
              <span className="absolute left-2 -translate-y-full rounded bg-sky-500/80 px-1 text-[9px] font-semibold text-white">
                BG horizon {proj.horizonY.toFixed(1)}%
              </span>
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 z-[55] border-t border-dashed border-amber-300/90"
              style={{ top: `${proj.buoyLineY}%` }}
            >
              <span className="absolute left-2 top-0.5 rounded bg-amber-500/80 px-1 text-[9px] font-semibold text-white">
                Far buoy line {proj.buoyLineY.toFixed(1)}%
              </span>
            </div>
            <div
              className="pointer-events-none absolute inset-x-0 z-[55] border-t border-dashed border-emerald-300/90"
              style={{ top: `${proj.seaBottom}%` }}
            >
              <span className="absolute left-2 -translate-y-full rounded bg-emerald-600/80 px-1 text-[9px] font-semibold text-white">
                Near buoy line {proj.seaBottom.toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {/* Buoys / ships — below helm overlay so frame hides them */}
        {items.map((item) => {
          const def = item.definitionId ? getDefinition(item.definitionId) : undefined;
          // Keep z under overlay (overlay is z-30). Closer = slightly higher within 1–20.
          const z = Math.max(1, Math.min(20, Math.round(20 - item.range / 50)));
          const markSize = item.size * (uiScale || 1);

          return (
            <div
              key={item.id}
              className="absolute"
              style={{
                left: `${item.xPct}%`,
                top: `${item.yPct}%`,
                transform: `translate(-50%, -${proj.anchorY}%)`,
                zIndex: z,
                opacity: item.opacity,
                transition: 'opacity 80ms linear',
              }}
              title={`${item.label} · ${item.relativeBearing.toFixed(1)}° · ${Math.round(item.range)} m · ${item.xPct.toFixed(1)}%, ${item.yPct.toFixed(1)}%`}
            >
              {item.kind === 'buoy' && def ? (
                <div
                  className="relative"
                  style={{ width: markSize, height: markSize * 1.05 }}
                >
                  <MarkVisual
                    def={def}
                    night={item.night}
                    showSvgLight={false}
                    className="h-full w-full"
                  />
                  {/* Light overlays the mark — never shifts layout */}
                  {item.night &&
                    item.lightOn &&
                    item.lightColour &&
                    item.lightColour !== 'none' && (
                      <div
                        className="pointer-events-none absolute left-1/2 top-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          width: markSize * 0.22,
                          height: markSize * 0.22,
                          background: LIGHT_HEX[item.lightColour],
                          boxShadow: `0 0 ${markSize * 0.45}px ${LIGHT_HEX[item.lightColour]}`,
                        }}
                      />
                    )}
                </div>
              ) : (
                <div
                  style={{
                    width: markSize,
                    height: markSize * 0.36,
                    background: item.bodyColor,
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Bridge window overlay — ABOVE buoys; fills the 16:9 stage exactly */}
        <HelmImage
          src={HELM_ASSETS.bridgeOverlay}
          alt=""
          className="pointer-events-none absolute inset-0 z-30 h-full w-full object-fill"
        />

        {/* Radar plane — display only (not clickable); use Radar button for full view */}
        <RadarScreen
          cameraShip={cameraShip}
          layout={radarFit}
          mode="inset"
          className="absolute z-[35]"
          style={{
            left: `${radar.leftPct}%`,
            top: `${radar.topPct}%`,
            width: `${radar.widthPct}%`,
            height: `${radar.heightPct}%`,
            transform: radarPlaneTransform(radarFit),
            transformOrigin: radarPlaneOrigin(radarFit),
          }}
        />
        {RADAR_DEV_TOOLS && radarDevOpen && (
          <div
            className="pointer-events-none absolute z-[36] border-2 border-dashed border-emerald-400/80"
            style={{
              left: `${radar.leftPct}%`,
              top: `${radar.topPct}%`,
              width: `${radar.widthPct}%`,
              height: `${radar.heightPct}%`,
              borderRadius: radarFit.borderRadius,
              transform: radarPlaneTransform(radarFit),
              transformOrigin: radarPlaneOrigin(radarFit),
            }}
          >
            <span className="absolute -top-5 left-0 rounded bg-emerald-600/90 px-1 text-[9px] font-semibold text-white">
              Radar plane
            </span>
          </div>
        )}

        {/* Instruments — HDG / ROT / SOG */}
        {!hideHelmUi && (
          <InstrumentPanel
            heading={heading}
            speed={speed}
            throttle={throttle}
            rudder={rudder}
            layout={instFit}
          />
        )}
        {HELM_DEV_TOOLS && helmDevOpen && helmTuneTab === 'instruments' && (
          <div
            className="pointer-events-none absolute z-[36] border-2 border-dashed border-cyan-400/80"
            style={{
              left: `${instLayout.leftPct}%`,
              top: `${instLayout.topPct}%`,
              width: `${instLayout.widthPct}%`,
              height: `${instLayout.heightPct}%`,
              borderRadius: instFit.borderRadius,
              transform: planeTransform(instFit),
              transformOrigin: planeOrigin(instFit),
            }}
          >
            <span className="absolute -top-5 left-0 rounded bg-cyan-600/90 px-1 text-[9px] font-semibold text-white">
              Instruments
            </span>
          </div>
        )}

        {/* Interactive wheel — A/D or drag to spin */}
        {!hideHelmUi && (
          <HelmWheel shipId={cameraShip.id} rudder={rudder} layout={wheelFit} />
        )}
        {HELM_DEV_TOOLS && helmDevOpen && helmTuneTab === 'wheel' && (
          <div
            className="pointer-events-none absolute z-[46] border-2 border-dashed border-amber-400/80"
            style={{
              left: `${wheelLayout.leftPct}%`,
              top: `${wheelLayout.topPct}%`,
              width: `${wheelLayout.widthPct}%`,
              height: `${wheelLayout.heightPct}%`,
              borderRadius: wheelFit.borderRadius,
              transform: planeTransform(wheelFit),
              transformOrigin: planeOrigin(wheelFit),
            }}
          >
            <span className="absolute -top-5 left-0 rounded bg-amber-600/90 px-1 text-[9px] font-semibold text-white">
              Wheel
            </span>
          </div>
        )}

        {!hideHelmUi && (
          <div className="pointer-events-none absolute bottom-[2%] left-[1.5%] z-40">
            <HelmImage
              src={HELM_ASSETS.throttle}
              alt="Throttle"
              className="origin-bottom object-contain drop-shadow-lg"
              style={{
                height: `${Math.max(72, 128 * uiScale)}px`,
                width: 'auto',
                transform: `translateY(${(-throttle) * 18 * uiScale}px) rotate(${throttle * -8}deg)`,
              }}
            />
          </div>
        )}
          </div>
        </div>

        {/* Compact helm chrome */}
        {!hideHelmUi ? (
          <div className="absolute bottom-2 right-2 z-50 flex max-w-[min(100%-1rem,280px)] flex-col gap-2 sm:bottom-3 sm:right-3">
            <div className="flex flex-wrap items-center justify-end gap-1">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/25 px-2 py-1 text-[10px] font-semibold text-emerald-100 hover:bg-emerald-500/40 touch-manipulation"
                onClick={() => setDisplay('radar')}
                title="Radar (top-down)"
              >
                <Radar className="h-3 w-3" />
                Radar
              </button>
              {HELM_DEV_TOOLS && (
                <>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/85 hover:bg-black/75 touch-manipulation"
                    onClick={() => setHelmDevOpen((v) => !v)}
                    title="Wheel / instrument tune"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    Helm tune
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/85 hover:bg-black/75 touch-manipulation"
                    onClick={() => setHideHelmUi(true)}
                    title="Hide helm UI to align"
                  >
                    Hide UI
                  </button>
                </>
              )}
              {RADAR_DEV_TOOLS && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/85 hover:bg-black/75 touch-manipulation"
                  onClick={() => setRadarDevOpen((v) => !v)}
                  title="Radar plane tuning"
                >
                  Radar tune
                </button>
              )}
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white/85 hover:bg-black/75"
                onClick={() => clearShipTrack(cameraShip.id)}
                title="Clear track"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
            <label className="block rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-white/70 backdrop-blur-sm">
              Throttle · W/S
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={throttle}
                className="mt-2 h-8 w-full accent-[#2A61FA] touch-manipulation"
                onChange={(e) =>
                  updateShip(cameraShip.id, { throttle: Number(e.target.value) }, false)
                }
              />
            </label>
            <p className="text-right text-[9px] text-white/40">Hold A/D or drag wheel · P/S</p>
          </div>
        ) : (
          <div className="absolute bottom-2 right-2 z-50 flex items-center gap-1">
            {HELM_DEV_TOOLS && (
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1.5 text-[10px] font-semibold text-white touch-manipulation hover:bg-black/85"
                onClick={() => setHelmDevOpen((v) => !v)}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Helm tune
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/90 px-2.5 py-1.5 text-[10px] font-semibold text-black touch-manipulation hover:bg-emerald-400"
              onClick={() => setHideHelmUi(false)}
            >
              Show UI
            </button>
          </div>
        )}

        {HELM_DEV_TOOLS && helmDevOpen && (
          <HelmTunePanel
            tab={helmTuneTab}
            setTab={setHelmTuneTab}
            wheel={wheelLayout}
            instruments={instLayout}
            patchWheel={patchWheel}
            patchInst={patchInst}
            onExport={exportHelmFile}
            onCopy={copyHelmJson}
            exportStatus={exportStatus}
            hideHelmUi={hideHelmUi}
            onToggleHelmUi={() => setHideHelmUi((v) => !v)}
          />
        )}

        {/* Dev projection panel */}
        {BRIDGE_DEV_TOOLS && devOpen && (
          <div className="absolute right-2 top-2 z-[60] flex max-h-[min(70vh,520px)] w-[min(100%-1rem,300px)] flex-col overflow-hidden rounded-xl border border-amber-400/40 bg-black/85 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <Wrench className="h-3.5 w-3.5 text-amber-300" />
              <span className="text-[11px] font-semibold text-amber-100">Bridge tune</span>
            </div>
            <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-amber-500/90 px-2 py-1.5 text-[10px] font-semibold text-black hover:bg-amber-400"
                onClick={exportJsonFile}
              >
                <Download className="h-3 w-3" />
                {exportStatus === 'saved' ? 'Exported' : 'Export JSON'}
              </button>
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white/10 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-white/20"
                onClick={copyJson}
              >
                <Copy className="h-3 w-3" />
                {exportStatus === 'copied' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-2 text-[10px] text-white/80">
              <label className="block">
                <span className="font-semibold text-white/60">FOV (visible width) °</span>
                <input
                  type="range"
                  min={40}
                  max={140}
                  step={1}
                  value={fov}
                  className="mt-0.5 w-full accent-amber-400"
                  onChange={(e) =>
                    updateShip(cameraShip.id, { fov: Number(e.target.value) }, false)
                  }
                />
                <span className="tabular-nums text-amber-200">{Math.round(fov)}°</span>
              </label>

              <div className="space-y-2 rounded-lg border border-sky-400/30 bg-sky-500/10 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-sky-200">
                  Background horizon
                </p>
                <label className="block">
                  <span className="font-semibold text-white/60">Sky / sea split %</span>
                  <input
                    type="range"
                    min={10}
                    max={70}
                    step={0.5}
                    value={proj.horizonY}
                    className="mt-0.5 w-full accent-sky-400"
                    onChange={(e) => patchProj({ horizonY: Number(e.target.value) })}
                  />
                  <span className="tabular-nums text-sky-200">{proj.horizonY.toFixed(1)}</span>
                </label>
              </div>

              <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-500/10 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-amber-200">
                  Buoy lines
                </p>
                <label className="block">
                  <span className="font-semibold text-white/60">Far buoy line % (distant)</span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={0.5}
                    value={proj.buoyLineY}
                    className="mt-0.5 w-full accent-amber-400"
                    onChange={(e) => patchProj({ buoyLineY: Number(e.target.value) })}
                  />
                  <span className="tabular-nums text-amber-200">{proj.buoyLineY.toFixed(1)}</span>
                </label>
                <label className="block">
                  <span className="font-semibold text-white/60">Near buoy line % (closest)</span>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    step={0.5}
                    value={proj.seaBottom}
                    className="mt-0.5 w-full accent-emerald-400"
                    onChange={(e) => patchProj({ seaBottom: Number(e.target.value) })}
                  />
                  <span className="tabular-nums text-emerald-200">{proj.seaBottom.toFixed(1)}</span>
                </label>
              </div>

              <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">Distance</p>
              {(
                [
                  ['nearRange', 'Near range (m)', 5, 120, 1],
                  ['farRange', 'Far range (m)', 200, 2000, 10],
                  ['rangeEase', 'Range ease', 0.2, 1.5, 0.01],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <TuneSlider
                  key={key}
                  label={label}
                  min={min}
                  max={max}
                  step={step}
                  value={proj[key]}
                  onChange={(v) => patchProj({ [key]: v })}
                />
              ))}

              <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">Angle / width</p>
              {(
                [
                  ['bearingSpan', 'Bearing span %', 20, 55, 0.5],
                  ['nearBoostMax', 'Near lateral boost', 0, 1.2, 0.01],
                  ['nearBoostRange', 'Near boost range', 40, 400, 5],
                  ['nearBoostPower', 'Near boost power', 0.5, 3, 0.05],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <TuneSlider
                  key={key}
                  label={label}
                  min={min}
                  max={max}
                  step={step}
                  value={proj[key]}
                  onChange={(v) => patchProj({ [key]: v })}
                />
              ))}

              <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">Close pass</p>
              {(
                [
                  ['passFadeStart', 'Fade start range', 10, 200, 1],
                  ['passHideRange', 'Hide range', 2, 80, 1],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <TuneSlider
                  key={key}
                  label={label}
                  min={min}
                  max={max}
                  step={step}
                  value={proj[key]}
                  onChange={(v) => patchProj({ [key]: v })}
                />
              ))}

              <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">Size</p>
              {(
                [
                  ['sizeRefBuoy', 'Size ref buoy', 40, 400, 5],
                  ['sizeScale', 'Size scale', 20, 160, 1],
                  ['sizeMinBuoy', 'Size min buoy', 4, 40, 1],
                  ['sizeMaxBuoy', 'Size max buoy', 40, 160, 1],
                  ['anchorY', 'Anchor Y %', 50, 100, 1],
                  ['minVisibleRange', 'Min visible (0=off)', 0, 200, 1],
                  ['maxVisibleRange', 'Max visible (0=off)', 0, 2000, 10],
                ] as const
              ).map(([key, label, min, max, step]) => (
                <TuneSlider
                  key={key}
                  label={label}
                  min={min}
                  max={max}
                  step={step}
                  value={proj[key]}
                  onChange={(v) => patchProj({ [key]: v })}
                />
              ))}

              <button
                type="button"
                className="w-full rounded-lg bg-white/10 py-1.5 text-[10px] font-medium text-white hover:bg-white/15"
                onClick={() => {
                  setProj({ ...DEFAULT_BRIDGE_PROJECTION });
                  saveBridgeProjection(DEFAULT_BRIDGE_PROJECTION);
                }}
              >
                Reset defaults
              </button>

              <div className="border-t border-white/10 pt-2">
                <div className="mb-1 flex items-center gap-1 font-semibold text-white/60">
                  <Ship className="h-3 w-3" />
                  Visible marks ({items.filter((i) => i.kind === 'buoy').length})
                </div>
                <ul className="max-h-36 space-y-1 overflow-y-auto font-mono text-[9px] text-white/70">
                  {items
                    .filter((i) => i.kind === 'buoy')
                    .map((i) => (
                      <li key={i.id} className="rounded bg-white/5 px-1.5 py-1">
                        <div className="truncate text-white/90">{i.label}</div>
                        <div>
                          brg {i.relativeBearing.toFixed(1)}° · rng {i.range.toFixed(0)} · xy{' '}
                          {i.xPct.toFixed(1)}%,{i.yPct.toFixed(1)}% · sz {i.size.toFixed(0)}
                        </div>
                      </li>
                    ))}
                  {items.filter((i) => i.kind === 'buoy').length === 0 && (
                    <li className="text-white/40">None in FOV — place buoys ahead of the ship</li>
                  )}
                </ul>
              </div>

              <p className="text-[9px] leading-relaxed text-white/40">
                Blue = background horizon · Amber = far buoy line · Green = near buoy line. Hit
                Export JSON and paste the file (or Copy) into chat to lock values in code.
              </p>
            </div>
          </div>
        )}

        {RADAR_DEV_TOOLS && radarDevOpen && (
          <RadarTunePanel
            radar={radar}
            patchRadar={patchRadar}
            onExport={exportRadarFile}
            onCopy={copyRadarJson}
            exportStatus={exportStatus}
            hideHelmUi={hideHelmUi}
            onToggleHelmUi={() => setHideHelmUi((v) => !v)}
          />
        )}
      </div>
    </div>
  );
}

function HelmTunePanel({
  tab,
  setTab,
  wheel,
  instruments,
  patchWheel,
  patchInst,
  onExport,
  onCopy,
  exportStatus,
  hideHelmUi,
  onToggleHelmUi,
}: {
  tab: 'wheel' | 'instruments';
  setTab: (t: 'wheel' | 'instruments') => void;
  wheel: WheelLayout;
  instruments: InstrumentLayout;
  patchWheel: (p: Partial<WheelLayout>) => void;
  patchInst: (p: Partial<InstrumentLayout>) => void;
  onExport: () => void;
  onCopy: () => void;
  exportStatus: 'idle' | 'copied' | 'saved';
  hideHelmUi?: boolean;
  onToggleHelmUi?: () => void;
}) {
  const active = tab === 'wheel' ? wheel : instruments;
  const patch = tab === 'wheel' ? patchWheel : patchInst;

  return (
    <div className="absolute left-2 top-2 z-[65] flex max-h-[min(70vh,540px)] w-[min(100%-1rem,300px)] flex-col overflow-hidden rounded-xl border border-amber-400/40 bg-black/90 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Wrench className="h-3.5 w-3.5 text-amber-300" />
        <span className="text-[11px] font-semibold text-amber-100">Helm tune</span>
      </div>
      <div className="flex gap-1 border-b border-white/10 p-1.5">
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-[10px] font-semibold ${
            tab === 'wheel' ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'
          }`}
          onClick={() => setTab('wheel')}
        >
          Wheel
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-[10px] font-semibold ${
            tab === 'instruments' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white'
          }`}
          onClick={() => setTab('instruments')}
        >
          Instruments
          <span className="mt-0.5 block text-[8px] font-medium opacity-80">HDG · speed</span>
        </button>
      </div>
      <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-amber-500/90 px-2 py-1.5 text-[10px] font-semibold text-black hover:bg-amber-400"
          onClick={onExport}
        >
          <Download className="h-3 w-3" />
          {exportStatus === 'saved' ? 'Exported' : 'Export'}
        </button>
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white/10 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-white/20"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3" />
          {exportStatus === 'copied' ? 'Copied' : 'Copy'}
        </button>
      </div>
      {onToggleHelmUi && (
        <div className="border-b border-white/10 px-2 py-1.5">
          <button
            type="button"
            className="w-full rounded-md bg-white/10 py-1.5 text-[10px] font-semibold text-white hover:bg-white/20"
            onClick={onToggleHelmUi}
          >
            {hideHelmUi ? 'Show helm UI' : 'Hide helm UI'}
          </button>
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-[10px] text-white/80">
        <p className="text-[9px] leading-relaxed text-white/45">
          Align the {tab === 'wheel' ? 'amber wheel' : 'cyan instrument'} box with the overlay,
          then Export JSON.
        </p>
        {(
          [
            ['leftPct', 'Left %', 0, 90, 0.5],
            ['topPct', 'Top %', 0, 90, 0.5],
            ['widthPct', 'Width %', 8, 80, 0.5],
            ['heightPct', 'Height %', 8, 80, 0.5],
            ['borderRadius', 'Corner radius', 0, 999, 1],
            ['rotateX', 'Tilt X °', -80, 80, 0.5],
            ['rotateY', 'Tilt Y °', -45, 45, 0.5],
            ['rotateZ', 'Spin Z °', -30, 30, 0.5],
            ['skewX', 'Skew X °', -45, 45, 0.5],
            ['skewY', 'Skew Y °', -45, 45, 0.5],
            ['perspective', 'Perspective px', 200, 2000, 10],
            ['originXPct', 'Pivot X %', 0, 100, 1],
            ['originYPct', 'Pivot Y %', 0, 100, 1],
            ['bezelOpacity', 'Opacity', 0.4, 1, 0.02],
          ] as const
        ).map(([key, label, min, max, step]) => (
          <TuneSlider
            key={key}
            label={label}
            min={min}
            max={max}
            step={step}
            value={Number(active[key as keyof typeof active])}
            onChange={(v) => patch({ [key]: v } as never)}
          />
        ))}
        {tab === 'wheel' && (
          <TuneSlider
            label="Spin speed (°/s at full rudder)"
            min={60}
            max={480}
            step={10}
            value={wheel.spinSpeed}
            onChange={(v) => patchWheel({ spinSpeed: v })}
          />
        )}
        {tab === 'instruments' && (
          <TuneSlider
            label="Screen inset px"
            min={0}
            max={24}
            step={1}
            value={instruments.screenInset}
            onChange={(v) => patchInst({ screenInset: v })}
          />
        )}
        <button
          type="button"
          className="w-full rounded-lg bg-white/10 py-1.5 text-[10px] font-medium text-white hover:bg-white/15"
          onClick={() => {
            if (tab === 'wheel') {
              patchWheel({ ...DEFAULT_WHEEL_LAYOUT });
              saveWheelLayout(DEFAULT_WHEEL_LAYOUT);
            } else {
              patchInst({ ...DEFAULT_INSTRUMENT_LAYOUT });
              saveInstrumentLayout(DEFAULT_INSTRUMENT_LAYOUT);
            }
          }}
        >
          Reset {tab} defaults
        </button>
      </div>
    </div>
  );
}

function RadarTunePanel({
  radar,
  patchRadar,
  onExport,
  onCopy,
  exportStatus,
  hideHelmUi,
  onToggleHelmUi,
}: {
  radar: RadarLayout;
  patchRadar: (p: Partial<RadarLayout>) => void;
  onExport: () => void;
  onCopy: () => void;
  exportStatus: 'idle' | 'copied' | 'saved';
  hideHelmUi?: boolean;
  onToggleHelmUi?: () => void;
}) {
  return (
    <div className="absolute left-2 top-2 z-[65] flex max-h-[min(70vh,540px)] w-[min(100%-1rem,300px)] flex-col overflow-hidden rounded-xl border border-emerald-400/40 bg-black/90 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <Wrench className="h-3.5 w-3.5 text-emerald-300" />
        <span className="text-[11px] font-semibold text-emerald-100">Radar plane tune</span>
      </div>
      <div className="flex gap-1 border-b border-white/10 px-2 py-1.5">
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1.5 text-[10px] font-semibold text-black hover:bg-emerald-400"
          onClick={onExport}
        >
          <Download className="h-3 w-3" />
          {exportStatus === 'saved' ? 'Exported' : 'Export JSON'}
        </button>
        <button
          type="button"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-white/10 px-2 py-1.5 text-[10px] font-medium text-white hover:bg-white/20"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3" />
          {exportStatus === 'copied' ? 'Copied' : 'Copy'}
        </button>
      </div>
      {onToggleHelmUi && (
        <div className="border-b border-white/10 px-2 py-1.5">
          <button
            type="button"
            className="w-full rounded-md bg-white/10 py-1.5 text-[10px] font-semibold text-white hover:bg-white/20"
            onClick={onToggleHelmUi}
          >
            {hideHelmUi ? 'Show throttle / wheel UI' : 'Hide throttle / wheel UI'}
          </button>
        </div>
      )}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-2 text-[10px] text-white/80">
        <p className="text-[9px] leading-relaxed text-white/45">
          Line the dashed green box up with the helm radar bezel. Use <strong>Tilt X</strong> for
          console slant, Y for lean, Z for spin. Hide UI to align cleanly, then Export JSON.
        </p>
        {(
          [
            ['leftPct', 'Left %', 0, 90, 0.5],
            ['topPct', 'Top %', 0, 90, 0.5],
            ['widthPct', 'Width %', 8, 80, 0.5],
            ['heightPct', 'Height %', 8, 80, 0.5],
            ['borderRadius', 'Corner radius px', 0, 40, 1],
            ['screenInset', 'Screen inset px', 0, 24, 1],
            ['range', 'Radar range (world)', 80, 1200, 10],
            ['ringCount', 'Range rings', 2, 8, 1],
            ['rotateX', 'Tilt X ° (console slant)', -80, 80, 0.5],
            ['rotateY', 'Tilt Y ° (lean L/R)', -45, 45, 0.5],
            ['rotateZ', 'Spin Z ° (flat rotate)', -30, 30, 0.5],
            ['skewX', 'Skew X °', -45, 45, 0.5],
            ['skewY', 'Skew Y °', -45, 45, 0.5],
            ['perspective', 'Perspective px', 200, 2000, 10],
            ['originXPct', 'Pivot X %', 0, 100, 1],
            ['originYPct', 'Pivot Y %', 0, 100, 1],
            ['bezelOpacity', 'Bezel opacity', 0.4, 1, 0.02],
            ['phosphor', 'Phosphor glow', 0, 1, 0.02],
          ] as const
        ).map(([key, label, min, max, step]) => (
          <TuneSlider
            key={key}
            label={label}
            min={min}
            max={max}
            step={step}
            value={radar[key]}
            onChange={(v) => patchRadar({ [key]: v })}
          />
        ))}
        <button
          type="button"
          className="w-full rounded-lg bg-white/10 py-1.5 text-[10px] font-medium text-white hover:bg-white/15"
          onClick={() => {
            patchRadar({ ...DEFAULT_RADAR_LAYOUT });
            saveRadarLayout(DEFAULT_RADAR_LAYOUT);
          }}
        >
          Reset radar defaults
        </button>
      </div>
    </div>
  );
}

function TuneSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-semibold text-white/60">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="mt-0.5 w-full accent-emerald-400"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="tabular-nums text-emerald-200">
        {value.toFixed(step < 1 ? 2 : 0)}
      </span>
    </label>
  );
}
