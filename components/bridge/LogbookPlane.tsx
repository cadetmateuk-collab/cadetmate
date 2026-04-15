'use client';

/**
 * LogbookPlane.tsx
 *
 * A 3D plane — placed on the logbook desk in the sbLogbook panorama —
 * that renders the ship's deck log as a canvas texture.
 *
 * HOW TO WIRE IN:
 *  1. Add `logbookPlane` to SCREENS in BridgeScene.tsx  (see SCREEN DEF below)
 *  2. In BridgeSimulator, render <LogbookEditOverlay> alongside the BridgeScene
 *  3. Pass logbook state down and connect onClick
 *
 * SCREEN DEF to paste into BridgeScene.tsx SCREENS object:
 * ─────────────────────────────────────────────────────────
 *  logbookPlane: {
 *    blenderPos:  [6.9, -1.3, 89.4]  as [number, number, number],
 *    blenderRot:  [75, 0, 0]          as [number, number, number],
 *    texture:     '/shipimages/logbook-blank.png',  // fallback only; overridden by canvas
 *    blenderSize: [0.55, 0.38]        as [number, number],
 *    scale:       95,                 // tune: 498 / dist_back_to_book
 *    visibility:  'bridge' as const,
 *    nodeAdjust: {
 *      back:       [0, 0, 0], helm:      [0, 0, 0], psSofa:    [0, 0, 0],
 *      sbDesk:     [0, 0, 0], psEcdis:   [0, 0, 0], psRadio:   [0, 0, 0],
 *      psLookout:  [0, 0, 0], sbLogbook: [0, 0, 0], sbLookout: [0, 0, 0],
 *      radar:      [0, 0, 0], psWing:    [0, 0, 0], sbWing:    [0, 0, 0],
 *    },
 *  },
 */

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LogEntry {
  time: string;
  heading: string;
  speed: string;
  depth: string;
  visibility: string;
  event: string;
}

export interface ShipInfo {
  shipType: string;
  hullNumber: string;
  date: string;
  month: string;
  year: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CANVAS RENDERER — bakes logbook data into a texture ──────────────────────
// ══════════════════════════════════════════════════════════════════════════════

const CANVAS_W = 1024;
const CANVAS_H = 700;
const MONO     = '"Courier New", "Courier", monospace';
const COL_X    = [12, 88, 170, 252, 320, 430]; // column x starts (px)
const COL_W    = [76, 82, 82, 68, 110, CANVAS_W - 430 - 12];
const HEADERS  = ['TIME', 'HDG', 'SPD', 'DEPTH', 'VISIBILITY', 'RECORD OF EVENTS'];

function renderLogbookToCanvas(
  canvas: HTMLCanvasElement,
  entries: LogEntry[],
  ship: ShipInfo,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Paper background
  ctx.fillStyle = '#f5f0e8';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle ruled-paper lines
  ctx.strokeStyle = 'rgba(180,160,120,0.3)';
  ctx.lineWidth = 1;
  for (let y = 100; y < CANVAS_H; y += 28) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }

  // Outer border
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, CANVAS_W - 12, CANVAS_H - 12);

  // ── Title bar ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(6, 6, CANVAS_W - 12, 30);
  ctx.fillStyle = '#f5f0e8';
  ctx.font = `bold 14px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText("SHIP'S DECK LOG — MV SOHO   IMO 16348275   CALLSIGN D1WX7", CANVAS_W / 2, 26);

  // ── Ship info row ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.font = `11px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText(
    `TYPE: ${ship.shipType || '—'}   HULL: ${ship.hullNumber || '—'}   DATE: ${ship.date}/${ship.month}/${ship.year}`,
    14, 52,
  );

  // Thin divider
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(6, 60); ctx.lineTo(CANVAS_W - 6, 60); ctx.stroke();

  // ── Column headers ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#e8e0cc';
  ctx.fillRect(6, 61, CANVAS_W - 12, 22);
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1;

  COL_X.forEach((x, i) => {
    // vertical separator
    if (i > 0) {
      ctx.beginPath(); ctx.moveTo(x, 61); ctx.lineTo(x, CANVAS_H - 6); ctx.stroke();
    }
    const cx = x + COL_W[i] / 2;
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `bold 9px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText(HEADERS[i], cx, 77);
  });

  // Header bottom border
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(6, 83); ctx.lineTo(CANVAS_W - 6, 83); ctx.stroke();

  // ── Rows ───────────────────────────────────────────────────────────────────
  const ROW_H  = 24;
  const ROW_Y0 = 83;
  const maxRows = Math.floor((CANVAS_H - ROW_Y0 - 30) / ROW_H);
  const visible = entries.slice(-maxRows);

  visible.forEach((entry, i) => {
    const y = ROW_Y0 + i * ROW_H;

    // Alternating row tint
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(240,235,220,0.5)';
      ctx.fillRect(7, y, CANVAS_W - 14, ROW_H);
    }

    // Row bottom rule
    ctx.strokeStyle = 'rgba(160,140,100,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(6, y + ROW_H); ctx.lineTo(CANVAS_W - 6, y + ROW_H); ctx.stroke();

    const values = [
      entry.time, entry.heading, entry.speed, entry.depth, entry.visibility, entry.event,
    ];

    // Handwriting-style font for values
    ctx.fillStyle = '#1c1c3a';
    ctx.font = `11px ${MONO}`;

    values.forEach((val, ci) => {
      const cx = COL_X[ci] + COL_W[ci] / 2;
      const maxW = COL_W[ci] - 8;
      ctx.textAlign = ci === 5 ? 'left' : 'center';
      const tx = ci === 5 ? COL_X[ci] + 6 : cx;

      // Clip long text
      let text = val;
      while (ctx.measureText(text).width > maxW && text.length > 0) {
        text = text.slice(0, -1);
      }
      if (text !== val) text += '…';

      ctx.fillText(text, tx, y + ROW_H - 8);
    });
  });

  // ── Footer ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(6, CANVAS_H - 24); ctx.lineTo(CANVAS_W - 6, CANVAS_H - 24); ctx.stroke();
  ctx.font = `9px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText(`${entries.length} entries`, 14, CANVAS_H - 9);
  ctx.textAlign = 'right';
  ctx.fillText('OPNAV 3109/09 (Rev. 7-64)   USE BLACK INK', CANVAS_W - 14, CANVAS_H - 9);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── LOGBOOK 3D PLANE MESH  ────────────────────────────────────────────────────
//
//  Drop this inside your <Scene> / <Suspense> in BridgeScene.tsx.
//  It maintains its own CanvasTexture; call refresh() to re-bake after edits.
// ══════════════════════════════════════════════════════════════════════════════

export interface LogbookPlaneHandle {
  /** Re-render the logbook canvas texture (call after editing entries) */
  refresh: () => void;
}

interface LogbookPlaneProps {
  /** World-space position of the plane mesh */
  position: [number, number, number];
  /** Euler rotation of the plane (Three.js) */
  rotation: [number, number, number];
  /** Physical size of the plane in Three.js world units */
  size: [number, number];
  entries: LogEntry[];
  shipInfo: ShipInfo;
  /** Called when user clicks the plane — use to open the edit overlay */
  onOpen: () => void;
  renderOrder?: number;
}

export const LogbookPlaneMesh = forwardRef<LogbookPlaneHandle, LogbookPlaneProps>(
  function LogbookPlaneMesh({ position, rotation, size, entries, shipInfo, onOpen, renderOrder = 130 }, ref) {
    const meshRef    = useRef<THREE.Mesh>(null);
    const canvasRef  = useRef<HTMLCanvasElement | null>(null);
    const textureRef = useRef<THREE.CanvasTexture | null>(null);

    // Create offscreen canvas + texture once
    useEffect(() => {
      const canvas = document.createElement('canvas');
      canvas.width  = CANVAS_W;
      canvas.height = CANVAS_H;
      canvasRef.current = canvas;

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      textureRef.current = tex;

      // Initial bake
      renderLogbookToCanvas(canvas, entries, shipInfo);
      tex.needsUpdate = true;

      return () => tex.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Expose refresh handle
    useImperativeHandle(ref, () => ({
      refresh() {
        if (!canvasRef.current || !textureRef.current) return;
        renderLogbookToCanvas(canvasRef.current, entries, shipInfo);
        textureRef.current.needsUpdate = true;
      },
    }));

    // Re-bake whenever entries / shipInfo change (live updates)
    useEffect(() => {
      if (!canvasRef.current || !textureRef.current) return;
      renderLogbookToCanvas(canvasRef.current, entries, shipInfo);
      textureRef.current.needsUpdate = true;
    }, [entries, shipInfo]);

    // Attach texture to mesh material once texture is ready
    useFrame(() => {
      const mesh = meshRef.current;
      const tex  = textureRef.current;
      if (!mesh || !tex) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });

    return (
      <mesh
        ref={meshRef}
        position={position}
        rotation={rotation}
        renderOrder={renderOrder}
        onClick={onOpen}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <planeGeometry args={size} />
        <meshBasicMaterial
          transparent={false}
          side={THREE.FrontSide}
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
    );
  }
);

// ══════════════════════════════════════════════════════════════════════════════
// ── EDIT OVERLAY  ─────────────────────────────────────────────────────────────
//
//  Renders as a DOM overlay in front of the canvas.
//  Styled like leaning over the real logbook — warm paper feel, full-bleed.
//  Open with isOpen=true, close fires onClose which re-bakes the plane.
// ══════════════════════════════════════════════════════════════════════════════

interface LogbookEditOverlayProps {
  isOpen: boolean;
  entries: LogEntry[];
  shipInfo: ShipInfo;
  onClose: () => void;
  onAddEntry: () => void;
  onUpdateEntry: (i: number, field: keyof LogEntry, val: string) => void;
  onDeleteEntry: (i: number) => void;
  onUpdateShipInfo: (field: keyof ShipInfo, val: string) => void;
}

export function LogbookEditOverlay({
  isOpen,
  entries,
  shipInfo,
  onClose,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  onUpdateShipInfo,
}: LogbookEditOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // slight delay so CSS transition plays
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const cellInput = (
    val: string,
    onChange: (v: string) => void,
    w: number,
    placeholder = '',
  ) => (
    <input
      value={val}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: w,
        background: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(80,50,20,0.3)',
        outline: 'none',
        fontFamily: MONO,
        fontSize: '0.62rem',
        color: '#1c1a10',
        textAlign: 'center',
        padding: '2px 0',
      }}
    />
  );

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 180,
          background: `rgba(10,6,2,${visible ? 0.72 : 0})`,
          transition: 'background 0.35s ease',
          backdropFilter: visible ? 'blur(4px)' : 'none',
        }}
      />

      {/* Logbook panel — slides up from bottom */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 0,
          transform: `translateX(-50%) translateY(${visible ? '0%' : '100%'})`,
          transition: 'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
          zIndex: 190,
          width: 'min(98vw, 1160px)',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '14px 14px 0 0',
          overflow: 'hidden',
          boxShadow: '0 -8px 60px rgba(0,0,0,0.8)',
          // Paper texture feel
          background: 'linear-gradient(180deg, #f4ede0 0%, #ede5d0 100%)',
          border: '3px solid #8c7248',
          borderBottom: 'none',
        }}
      >
        {/* ── Spine strip (left edge, like a real book) ── */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 18,
          background: 'linear-gradient(90deg, #4a3218 0%, #7a5c32 60%, #5c3e1e 100%)',
          zIndex: 1,
        }} />

        {/* ── Header ── */}
        <div style={{
          paddingLeft: 36,
          paddingRight: 20,
          paddingTop: 14,
          paddingBottom: 10,
          borderBottom: '3px double #8c7248',
          background: 'rgba(255,255,255,0.25)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{
                fontFamily: '"Georgia", serif',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#2c1a06',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                Ship's Deck Log
              </div>
              <div style={{
                fontFamily: MONO,
                fontSize: '0.55rem',
                color: '#7a5c32',
                letterSpacing: '0.18em',
                marginTop: 2,
              }}>
                MV SOHO · IMO 16348275 · CALLSIGN D1WX7
              </div>
            </div>

            {/* Ship info fields */}
            <div style={{
              display: 'flex', gap: 16, alignItems: 'center',
              fontFamily: MONO, fontSize: '0.6rem', color: '#3a2408',
            }}>
              {([
                { label: 'TYPE',  field: 'shipType'   as keyof ShipInfo, w: 60 },
                { label: 'HULL',  field: 'hullNumber' as keyof ShipInfo, w: 70 },
                { label: 'DD',    field: 'date'       as keyof ShipInfo, w: 30 },
                { label: 'MM',    field: 'month'      as keyof ShipInfo, w: 30 },
                { label: 'YYYY',  field: 'year'       as keyof ShipInfo, w: 46 },
              ]).map(({ label, field, w }) => (
                <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                  <span style={{ fontSize: '0.48rem', letterSpacing: '0.12em', opacity: 0.7 }}>{label}</span>
                  <input
                    value={shipInfo[field]}
                    onChange={e => onUpdateShipInfo(field, e.target.value)}
                    style={{
                      width: w, textAlign: 'center',
                      border: 'none', borderBottom: '1px solid #8c7248',
                      background: 'transparent', outline: 'none',
                      fontFamily: MONO, fontSize: '0.6rem', color: '#1c1a10',
                    }}
                  />
                </label>
              ))}
            </div>

            {/* Close — "stop writing" */}
            <button
              onClick={onClose}
              title="Close logbook"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: '#6b3a1f', border: '2px solid #a06030',
                color: '#f5f0e8', fontFamily: MONO, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginLeft: 16,
              }}
            >
              ✕
            </button>
          </div>

          {/* Instruction line */}
          <div style={{
            marginTop: 8,
            fontFamily: MONO,
            fontSize: '0.5rem',
            color: '#8c7248',
            letterSpacing: '0.16em',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            USE BLACK INK TO FILL IN THIS LOG · PRESS ✕ WHEN DONE TO UPDATE PAGE
          </div>
        </div>

        {/* ── Column headers ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '72px 86px 86px 74px 108px 1fr 36px',
          paddingLeft: 22,
          background: 'rgba(140,114,72,0.18)',
          borderBottom: '2px solid #8c7248',
          fontFamily: MONO,
          fontSize: '0.52rem',
          fontWeight: 700,
          color: '#3a2408',
          letterSpacing: '0.1em',
          flexShrink: 0,
        }}>
          {['TIME', 'HEADING', 'SPEED', 'DEPTH', 'VISIBILITY', 'RECORD OF ALL EVENTS OF THE DAY', ''].map(h => (
            <div key={h} style={{ padding: '5px 4px', textAlign: 'center', borderRight: '1px solid rgba(140,114,72,0.4)' }}>
              {h}
            </div>
          ))}
        </div>

        {/* ── Rows ── */}
        <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 22 }}>
          {entries.map((entry, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 86px 86px 74px 108px 1fr 36px',
                borderBottom: '1px solid rgba(140,114,72,0.25)',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.22)',
                minHeight: 30,
                alignItems: 'center',
              }}
            >
              {/* Time */}
              <div style={{ borderRight: '1px solid rgba(140,114,72,0.4)', padding: '0 4px', textAlign: 'center' }}>
                {cellInput(entry.time, v => onUpdateEntry(i, 'time', v), 64, 'HHMM')}
              </div>
              {/* Heading */}
              <div style={{ borderRight: '1px solid rgba(140,114,72,0.4)', padding: '0 4px', textAlign: 'center' }}>
                {cellInput(entry.heading, v => onUpdateEntry(i, 'heading', v), 78, '000°')}
              </div>
              {/* Speed */}
              <div style={{ borderRight: '1px solid rgba(140,114,72,0.4)', padding: '0 4px', textAlign: 'center' }}>
                {cellInput(entry.speed, v => onUpdateEntry(i, 'speed', v), 78, '0.0 kts')}
              </div>
              {/* Depth */}
              <div style={{ borderRight: '1px solid rgba(140,114,72,0.4)', padding: '0 4px', textAlign: 'center' }}>
                {cellInput(entry.depth, v => onUpdateEntry(i, 'depth', v), 66, '0.0m')}
              </div>
              {/* Visibility */}
              <div style={{ borderRight: '1px solid rgba(140,114,72,0.4)', padding: '0 4px', textAlign: 'center' }}>
                {cellInput(entry.visibility, v => onUpdateEntry(i, 'visibility', v), 100, 'Clear')}
              </div>
              {/* Event */}
              <div style={{ borderRight: '1px solid rgba(140,114,72,0.4)', padding: '0 4px' }}>
                <input
                  value={entry.event}
                  onChange={e => onUpdateEntry(i, 'event', e.target.value)}
                  placeholder="Enter event description..."
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(80,50,20,0.2)',
                    outline: 'none',
                    fontFamily: MONO,
                    fontSize: '0.62rem',
                    color: '#1c1a10',
                    padding: '2px 4px',
                  }}
                />
              </div>
              {/* Delete */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => onDeleteEntry(i)}
                  title="Delete row"
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'transparent', border: '1px solid rgba(160,80,40,0.4)',
                    color: '#a05028', fontFamily: MONO, fontSize: '0.7rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >×</button>
              </div>
            </div>
          ))}

          {/* Empty row padding */}
          {entries.length === 0 && (
            <div style={{
              padding: '2rem', textAlign: 'center',
              fontFamily: MONO, fontSize: '0.65rem',
              color: '#8c7248', letterSpacing: '0.12em', opacity: 0.7,
            }}>
              NO ENTRIES — ADD YOUR FIRST LOG ENTRY BELOW
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          paddingLeft: 28,
          paddingRight: 20,
          paddingTop: 10,
          paddingBottom: 14,
          borderTop: '2px solid #8c7248',
          background: 'rgba(255,255,255,0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            onClick={onAddEntry}
            style={{
              background: '#4a3218',
              color: '#f5f0e8',
              border: '1px solid #8c7248',
              borderRadius: 6,
              padding: '0.45rem 1.1rem',
              fontFamily: MONO,
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              cursor: 'pointer',
            }}
          >
            + ADD ENTRY
          </button>

          <span style={{ fontFamily: MONO, fontSize: '0.52rem', color: '#7a5c32', letterSpacing: '0.1em' }}>
            {entries.length} ENTRIES
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: '0.48rem', color: '#8c7248', letterSpacing: '0.1em' }}>
              OPNAV 3109/09 (Rev. 7-64)
            </span>
            {/* Done button — prominent */}
            <button
              onClick={onClose}
              style={{
                background: '#2c4a1c',
                color: '#d4f0b8',
                border: '1px solid #4a8030',
                borderRadius: 6,
                padding: '0.45rem 1.3rem',
                fontFamily: MONO,
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                cursor: 'pointer',
              }}
            >
              ✓ DONE — CLOSE LOG
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── CONVENIENCE HOOK — manages all logbook state ─────────────────────────────
//
//  useLogbook() gives you everything you need to wire up both the 3D plane
//  and the edit overlay without scattering state across BridgeSimulator.
//
//  Usage:
//    const lb = useLogbook();
//    // In JSX (3D scene):
//    <LogbookPlaneMesh ... entries={lb.entries} shipInfo={lb.shipInfo} onOpen={lb.open} />
//    // In JSX (DOM overlay alongside BridgeScene):
//    <LogbookEditOverlay isOpen={lb.isOpen} {...lb.handlers} />
// ══════════════════════════════════════════════════════════════════════════════

export function useLogbook() {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([
    { time: '1100', heading: '120°', speed: '15.6 kts', depth: '62.8m',  visibility: 'Clear', event: "Hourly Position 45°34.8′N 22°03.6′W" },
    { time: '1200', heading: '130°', speed: '15.0 kts', depth: '100.1m', visibility: 'Clear', event: "Noon Position 46°12.4′N 23°01.2′W — Wind F5, Sea 4, Bar 1001" },
    { time: '1207', heading: '131°', speed: '15.1 kts', depth: '98.6m',  visibility: 'Clear', event: "Watch Handover to Deck Cadet" },
  ]);
  const [shipInfo, setShipInfo] = useState<ShipInfo>(() => {
    const d = new Date();
    return {
      shipType: 'C.G.',
      hullNumber: '',
      date:  d.getDate().toString().padStart(2, '0'),
      month: (d.getMonth() + 1).toString().padStart(2, '0'),
      year:  d.getFullYear().toString(),
    };
  });

  const open  = useCallback(() => setIsOpen(true),  []);
  const close = useCallback(() => setIsOpen(false), []);

  const addEntry = useCallback(() => {
    setEntries(prev => [...prev, {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      heading: '', speed: '', depth: '', visibility: '', event: '',
    }]);
  }, []);

  const updateEntry = useCallback((i: number, field: keyof LogEntry, val: string) => {
    setEntries(prev => { const n = [...prev]; n[i] = { ...n[i], [field]: val }; return n; });
  }, []);

  const deleteEntry = useCallback((i: number) => {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const updateShipInfo = useCallback((field: keyof ShipInfo, val: string) => {
    setShipInfo(prev => ({ ...prev, [field]: val }));
  }, []);

  /** Append a quick auto-entry (e.g. from scenario) */
  const addEventToLog = useCallback((event: string) => {
    setEntries(prev => [...prev, {
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      heading: '', speed: '', depth: '', visibility: '', event,
    }]);
  }, []);

  return {
    isOpen,
    entries,
    shipInfo,
    open,
    close,
    addEventToLog,
    handlers: {
      onClose:          close,
      onAddEntry:       addEntry,
      onUpdateEntry:    updateEntry,
      onDeleteEntry:    deleteEntry,
      onUpdateShipInfo: updateShipInfo,
    },
  };
}