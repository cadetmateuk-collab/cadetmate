'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Phonebook ─────────────────────────────────────────────────────────────────
export const PHONEBOOK: { name: string; number: string; dept: string }[] = [
  { name: 'ENGINE ROOM',     number: '100', dept: 'Engineering' },
  { name: 'CHIEF ENGINEER',  number: '101', dept: 'Engineering' },
  { name: 'CARGO CONTROL',   number: '200', dept: 'Deck'        },
  { name: 'BOSUN',           number: '201', dept: 'Deck'        },
  { name: 'GALLEY',          number: '300', dept: 'Catering'    },
  { name: 'CAPTAIN CABIN',   number: '400', dept: 'Officers'    },
  { name: 'OFFICERS MESS',   number: '401', dept: 'Officers'    },
  { name: 'MOORING STATION', number: '500', dept: 'Deck'        },
  { name: 'SAFETY OFFICER',  number: '501', dept: 'Safety'      },
  { name: 'PORT AGENT',      number: '999', dept: 'External'    },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode =
  | 'hidden' | 'pending'   // pending = ringing but arm not raised yet
  | 'raising'
  | 'dial' | 'connecting' | 'outgoing'
  | 'ringing' | 'answered'
  | 'ending' | 'lowering';

export interface PhoneArmHandle {
  /** Rings audibly — player must press P to raise phone and answer */
  triggerIncoming: (name: string) => void;
}

interface OverlayPos {
  top?: string; left?: string; bottom?: string; right?: string;
  width?: string; height?: string;
  rotate?: string;   // 2D spin, e.g. '-3deg'
  rotateX?: string;  // tilt forward/back, e.g. '-20deg'
  rotateY?: string;  // tilt left/right,   e.g. '10deg'
  perspective?: string; // defaults to '800px' when rotateX/Y used
}

interface PhoneArmProps {
  imagePath?:    string;
  /** Overlay positions — tweak these until they line up with your image */
  screenPos?:    OverlayPos;   // the info / dial screen area
  keypadPos?:    OverlayPos;   // the keypad grid area
  answerPos?:    OverlayPos;   // answer button hit area
  endPos?:       OverlayPos;   // end/hang-up button hit area
  /** false = borders hidden for final build */
  debugBorders?: boolean;
  handleRef?:    React.MutableRefObject<PhoneArmHandle | null>;
  /** Called when the arm is raised to answer an incoming call — use to stop ring audio */
  onPickUp?:        () => void;
  onPhoneRaised?:   () => void;
  onPhoneDialled?:  (number: string, contact?: string) => void;
  onPhoneOutgoing?: (number: string, contact?: string) => void;
  onPhoneAnswered?: (from: string) => void;
  onPhoneEnded?:    () => void;
  onPhoneMissed?:   (from: string) => void;
  onPhoneIncoming?: (from: string) => void;
}

const KEYPAD = [['1','2','3'],['4','5','6'],['7','8','9'],['*','0','#']];

// posStyle returns TWO style objects:
//   wrapper — position + perspective (must be on parent for 3D to work)
//   inner   — the actual transforms
function posStyle(p: OverlayPos): { wrapper: React.CSSProperties; inner: React.CSSProperties } {
  const { rotate, rotateX, rotateY, perspective, top, left, bottom, right, width, height, ...rest } = p;
  const transforms: string[] = [];
  if (rotate)  transforms.push(`rotate(${rotate})`);
  if (rotateX) transforms.push(`rotateX(${rotateX})`);
  if (rotateY) transforms.push(`rotateY(${rotateY})`);
  const has3d = !!(rotateX || rotateY);
  return {
    wrapper: {
      position: 'absolute', top, left, bottom, right, width, height,
      ...(has3d ? { perspective: perspective ?? '600px' } : {}),
      ...rest,
    },
    inner: {
      // Only fill parent dimensions if they were explicitly set
      ...(width  ? { width:  '100%' } : {}),
      ...(height ? { height: '100%' } : {}),
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      ...(transforms.length ? { transform: transforms.join(' ') } : {}),
      ...(has3d ? { transformStyle: 'preserve-3d' as const } : {}),
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PhoneArm({
  imagePath    = '/shipimages/',
  screenPos    = { top: '16%', left: '18%', width: '64%' },
  keypadPos    = { top: '38%', left: '14%', width: '72%' },
  answerPos    = { bottom: '18%', left: '16%', width: '28%', height: '10%' },
  endPos       = { bottom: '18%', right: '16%', width: '28%', height: '10%' },
  debugBorders = true,
  handleRef,
  onPickUp,
  onPhoneRaised,
  onPhoneDialled,
  onPhoneOutgoing,
  onPhoneAnswered,
  onPhoneEnded,
  onPhoneMissed,
  onPhoneIncoming,
}: PhoneArmProps) {

  const [mode, setMode]             = useState<Mode>('hidden');
  const [dialedNumber, setDialed]   = useState('');
  const [activeCaller, setCaller]   = useState('');
  const [callTimer, setCallTimer]   = useState(0);
  const [cursorOn, setCursorOn]     = useState(true);

  const modeRef    = useRef<Mode>('hidden');
  const incomingRef = useRef(false);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const cursorRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  modeRef.current  = mode;

  // ── External incoming trigger ─────────────────────────────────────────────
  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      triggerIncoming: (name: string) => {
        const m = modeRef.current;
        if (m === 'ringing' || m === 'answered' || m === 'outgoing' || m === 'connecting') return;
        setCaller(name);
        incomingRef.current = true;
        setMode('pending');
        onPhoneIncoming?.(name);
      },
    };
    return () => { if (handleRef) handleRef.current = null; };
  }, [handleRef]);

  // ── P key — outgoing dial only ────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key.toLowerCase() !== 'p') return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const m = modeRef.current;
    if (m === 'pending') {
      onPickUp?.();
      onPhoneRaised?.();
      setMode('raising');
    } else if (m === 'hidden' || m === 'lowering') {
      incomingRef.current = false;
      setDialed('');
      onPhoneRaised?.();
      setMode('raising');
    } else if (m === 'dial') {
      setMode('ending');
      setTimeout(() => setMode('lowering'), 600);
    }
  }, []);

  // ── Physical keyboard input while dialling ────────────────────────────────
  const handleDialKey = useCallback((e: KeyboardEvent) => {
    if (modeRef.current !== 'dial') return;
    if (e.repeat) return;
    if (/^[0-9*#]$/.test(e.key)) setDialed(n => n.length < 12 ? n + e.key : n);
    if (e.key === 'Backspace')    setDialed(n => n.slice(0, -1));
    if (e.key === 'Enter')        dialOut();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keydown', handleDialKey);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keydown', handleDialKey);
    };
  }, [handleKeyDown, handleDialKey]);

  // ── Cursor blink ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'dial') {
      cursorRef.current = setInterval(() => setCursorOn(v => !v), 530);
    } else {
      if (cursorRef.current) { clearInterval(cursorRef.current); cursorRef.current = null; }
      setCursorOn(true);
    }
    return () => { if (cursorRef.current) clearInterval(cursorRef.current); };
  }, [mode]);

  // ── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'answered' || mode === 'outgoing') {
      setCallTimer(0);
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode]);

  // ── Anim end ──────────────────────────────────────────────────────────────
  const onAnimEnd = useCallback(() => {
    setMode(prev => {
      if (prev === 'raising')  return incomingRef.current ? 'ringing' : 'dial';
      if (prev === 'lowering') return 'hidden';
      return prev;
    });
  }, []);

  // ── Dial out ──────────────────────────────────────────────────────────────
  const dialOut = useCallback(() => {
    if (modeRef.current !== 'dial') return;
    const num = dialedNumber.trim();
    if (!num) return;
    const contact = PHONEBOOK.find(c => c.number === num);
    const contactName = contact?.name;
    setCaller(contactName ?? num);
    onPhoneDialled?.(num, contactName);
    setMode('connecting');
    setTimeout(() => {
      if (modeRef.current === 'connecting') {
        setMode('outgoing');
        onPhoneOutgoing?.(num, contactName);
      }
    }, 2500);
  }, [dialedNumber, onPhoneDialled, onPhoneOutgoing]);

  const handleAnswer = useCallback(() => {
    if (modeRef.current === 'ringing') {
      onPickUp?.();
      onPhoneAnswered?.(activeCaller);
      setMode('answered');
    }
  }, [onPickUp, onPhoneAnswered, activeCaller]);

  const handleEnd = useCallback(() => {
    const m = modeRef.current;
    if (['ringing','answered','connecting','outgoing','dial'].includes(m)) {
      if (m === 'ringing') onPhoneMissed?.(activeCaller);
      else onPhoneEnded?.();
      setMode('ending');
      setTimeout(() => setMode('lowering'), 800);
    }
  }, [onPhoneEnded, onPhoneMissed, activeCaller]);

  if (mode === 'hidden' || mode === 'pending') return null;

  const isRaising    = mode === 'raising';
  const isLowering   = mode === 'lowering';
  const isMoving     = isRaising || isLowering;
  const isDialMode   = mode === 'dial';
  const isConnecting = mode === 'connecting';
  const isOutgoing   = mode === 'outgoing';
  const isRinging    = mode === 'ringing';
  const isAnswered   = mode === 'answered';
  const isEnding     = mode === 'ending';
  const isLive       = isAnswered || isOutgoing;

  const imgSrc = `${imagePath}phone-arm.webp`;

  const mins = String(Math.floor(callTimer / 60)).padStart(2, '0');
  const secs = String(callTimer % 60).padStart(2, '0');

  const db = debugBorders;

  return (
    <>
      <style>{`
        @keyframes phoneSlideUp {
          from { transform: translateY(110%); }
          to   { transform: translateY(0%);   }
        }
        @keyframes phoneSlideDown {
          from { transform: translateY(0%);   }
          to   { transform: translateY(110%); }
        }
        @keyframes phoneRotateIn {
          from { transform: rotate(40deg); }
          to   { transform: rotate(0deg);  }
        }
        @keyframes phoneRotateOut {
          from { transform: rotate(0deg);  }
          to   { transform: rotate(40deg); }
        }
        @keyframes phoneRingPulse {
          0%,100% { opacity:1; } 50% { opacity:0.4; }
        }
        @keyframes phoneFadeIn {
          from { opacity:0; transform:translateY(-4px); }
          to   { opacity:1; transform:translateY(0);    }
        }
        @keyframes phoneConnecting {
          0%,100% { opacity:0.35; } 50% { opacity:1; }
        }
      `}</style>

      {/* OUTER — slide */}
      <div
        onAnimationEnd={onAnimEnd}
        style={{
          position:      'fixed',
          bottom:        0,
          left:          0,
          zIndex:        90,
          pointerEvents: 'none',
          animation:     isRaising  ? 'phoneSlideUp   0.7s  cubic-bezier(0.4,0,0.2,1) forwards'
                       : isLowering ? 'phoneSlideDown 0.55s cubic-bezier(0.4,0,0.2,1) forwards'
                       : 'none',
          transform:     !isMoving ? 'translateY(0%)' : undefined,
        }}
      >
        {/* INNER — rotate */}
        <div
          style={{
            transformOrigin: 'bottom left',
            animation:       isRaising  ? 'phoneRotateIn  0.7s  cubic-bezier(0.4,0,0.2,1) forwards'
                           : isLowering ? 'phoneRotateOut 0.55s cubic-bezier(0.4,0,0.2,1) forwards'
                           : 'none',
            transform:       !isMoving ? 'rotate(0deg)' : undefined,
            position:        'relative',
            display:         'inline-block',
          }}
        >
          {/* ── Phone image ── */}
          <img
            src={imgSrc}
            alt="Phone handset"
            draggable={false}
            style={{
              display:       'block',
              height:        'min(110vh, 1100px)',
              width:         'auto',
              userSelect:    'none',
              pointerEvents: 'none',
              transition:    'filter 0.2s ease',
              filter:        'drop-shadow(0 6px 28px rgba(0,0,0,0.8))',
            }}
          />

          {/* ══════════════════════════════════════════════════
              SCREEN OVERLAY — caller info / dial display
          ══════════════════════════════════════════════════ */}
          {(!isMoving && !isEnding) && (() => { const s = posStyle(screenPos); return (
          <div style={{ ...s.wrapper, pointerEvents: 'none' }}>
            <div style={{
              ...s.inner,
              border:        db ? '1px dashed rgba(56,189,248,0.5)' : 'none',
              display:       'flex',
              flexDirection: 'column',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '0.25rem',
              animation:     'phoneFadeIn 0.3s ease forwards',
              boxSizing:     'border-box',
              padding:       '4px',
            }}>

              {/* Dial: number + cursor */}
              {isDialMode && (
                <div style={{
                  fontFamily:    '"IBM Plex Mono", monospace',
                  fontSize:      'clamp(0.65rem, 1.3vw, 1rem)',
                  fontWeight:    700,
                  letterSpacing: '0.25em',
                  color:         '#e2e8f0',
                  textShadow:    '0 1px 8px rgba(0,0,0,0.95)',
                  display:       'flex',
                  alignItems:    'center',
                }}>
                  {dialedNumber || <span style={{ opacity: 0.3 }}>DIAL</span>}
                  <span style={{
                    display:    'inline-block',
                    width:      '2px',
                    height:     '0.9em',
                    background: '#38bdf8',
                    marginLeft: '2px',
                    opacity:    cursorOn ? 1 : 0,
                    transition: 'opacity 0.05s',
                  }} />
                </div>
              )}

              {isConnecting && <>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.6rem,1.2vw,0.9rem)', fontWeight:700, letterSpacing:'0.2em', color:'#e2e8f0', textShadow:'0 1px 8px rgba(0,0,0,0.95)', whiteSpace:'nowrap' }}>{activeCaller}</div>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.42rem,0.85vw,0.6rem)', letterSpacing:'0.3em', color:'#fbbf24', animation:'phoneConnecting 1s ease-in-out infinite' }}>CONNECTING…</div>
              </>}
              {isOutgoing && <>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.6rem,1.2vw,0.9rem)', fontWeight:700, letterSpacing:'0.2em', color:'#e2e8f0', textShadow:'0 1px 8px rgba(0,0,0,0.95)', whiteSpace:'nowrap' }}>{activeCaller}</div>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.45rem,0.9vw,0.7rem)', letterSpacing:'0.25em', color:'#34d399' }}>{mins}:{secs}</div>
              </>}
              {isRinging && <>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.6rem,1.2vw,0.9rem)', fontWeight:700, letterSpacing:'0.2em', color:'#e2e8f0', textShadow:'0 1px 8px rgba(0,0,0,0.95)', whiteSpace:'nowrap' }}>{activeCaller}</div>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.42rem,0.85vw,0.6rem)', letterSpacing:'0.3em', color:'#94a3b8' }}>INCOMING CALL</div>
              </>}
              {isAnswered && <>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.6rem,1.2vw,0.9rem)', fontWeight:700, letterSpacing:'0.2em', color:'#e2e8f0', textShadow:'0 1px 8px rgba(0,0,0,0.95)', whiteSpace:'nowrap' }}>{activeCaller}</div>
                <div style={{ fontFamily:'"IBM Plex Mono",monospace', fontSize:'clamp(0.45rem,0.9vw,0.7rem)', letterSpacing:'0.25em', color:'#34d399' }}>{mins}:{secs}</div>
              </>}

            </div>
          </div>
          ); })()}

          {/* ══════════════════════════════════════════════════
              KEYPAD OVERLAY — only in dial mode
          ══════════════════════════════════════════════════ */}
          {isDialMode && (() => { const k = posStyle(keypadPos); return (
          <div style={{ ...k.wrapper }}>
            <div style={{
              ...k.inner,
              border:              db ? '1px dashed rgba(251,191,36,0.5)' : 'none',
              display:             'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows:    'repeat(4, 1fr)',
              gap:                 '3px',
              boxSizing:           'border-box',
              padding:             '2px',
            }}>
              {KEYPAD.flat().map(key => (
                <button
                  key={key}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === '#') { dialOut(); return; }
                    setDialed(n => n.length < 12 ? n + key : n);
                  }}
                  style={{
                    background:    'transparent',
                    border:        db ? '1px solid rgba(255,255,255,0.2)' : 'none',
                    borderRadius:  '3px',
                    color:         db ? (key === '#' ? '#34d399' : 'rgba(255,255,255,0.5)') : 'transparent',
                    fontFamily:    '"IBM Plex Mono", monospace',
                    fontSize:      'clamp(0.4rem, 0.8vw, 0.6rem)',
                    fontWeight:    700,
                    cursor:        'pointer',
                    outline:       'none',
                    pointerEvents: 'auto',
                    padding:       0,
                    width:         '100%',
                    height:        '100%',
                  }}
                  title={key === '#' ? 'Call' : key}
                >
                  {db ? (key === '#' ? '↵' : key) : ''}
                </button>
              ))}
            </div>
          </div>
          ); })()}

          {/* ANSWER / CALL button */}
          {(() => { const a = posStyle(answerPos); return (
          <div style={{ ...a.wrapper, pointerEvents: (isRinging || isDialMode) ? 'auto' : 'none', opacity: (isRinging || isDialMode) ? 1 : 0 }}>
            <div
              onMouseDown={(e) => { e.stopPropagation(); if (modeRef.current === 'ringing') handleAnswer(); else if (modeRef.current === 'dial') dialOut(); }}
              style={{ ...a.inner, cursor: 'pointer', border: db ? '2px solid rgba(52,211,153,0.8)' : 'none', borderRadius: '6px', background: 'transparent', boxSizing: 'border-box' }}
              title={isDialMode ? 'Call' : 'Answer'}
            />
          </div>
          ); })()}

          {/* END / HANG UP button */}
          {(() => { const e = posStyle(endPos); return (
          <div style={{ ...e.wrapper, pointerEvents: (isRinging || isAnswered || isConnecting || isOutgoing || isDialMode) ? 'auto' : 'none', opacity: (isRinging || isAnswered || isConnecting || isOutgoing || isDialMode) ? 1 : 0 }}>
            <div
              onMouseDown={(ev) => { ev.stopPropagation(); handleEnd(); }}
              style={{ ...e.inner, cursor: 'pointer', border: db ? '2px solid rgba(239,68,68,0.8)' : 'none', borderRadius: '6px', background: 'transparent', boxSizing: 'border-box' }}
              title="End / Hang up"
            />
          </div>
          ); })()}

        </div>
      </div>
    </>
  );
}