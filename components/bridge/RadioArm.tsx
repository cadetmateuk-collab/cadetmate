'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type RadioArmState = 'hidden' | 'raising' | 'visible' | 'lowering';

interface RadioArmProps {
  imagePath?: string;
  /** Position of the PTT hit zone over the radio body. Adjust until it sits over the talk button. */
  pttPos?:    { bottom?: string; top?: string; right?: string; left?: string; width?: string; height?: string };
  /** Show debug border on PTT zone */
  debugBorder?: boolean;
  /** Called when PTT state changes */
  onPTTChange?: (active: boolean) => void;
}

export function RadioArm({
  imagePath   = '/shipimages/',
  pttPos      = { bottom: '52%', right: '8%', width: '28%', height: '12%' },
  debugBorder = true,
  onPTTChange,
}: RadioArmProps) {
  const [armState, setArmState] = useState<RadioArmState>('hidden');
  const [isActive, setIsActive] = useState(false);
  const stateRef = useRef<RadioArmState>('hidden');
  stateRef.current = armState;

  // ── R key: toggle arm in / out ──────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.key.toLowerCase() !== 'r') return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const s = stateRef.current;
    if (s === 'hidden' || s === 'lowering') setArmState('raising');
    else if (s === 'visible' || s === 'raising') setArmState('lowering');
  }, []);

  // Release PTT if window loses focus
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) setIsActive(false);
  }, []);

  // Release PTT if mouse button released anywhere (in case pointer leaves image)
  const handleGlobalMouseUp = useCallback(() => {
    setIsActive(prev => {
      if (prev) onPTTChange?.(false);
      return false;
    });
  }, [onPTTChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleKeyDown, handleGlobalMouseUp, handleVisibilityChange]);

  // ── Animation end ────────────────────────────────────────────────────────────
  const onAnimEnd = useCallback(() => {
    setArmState(prev => {
      if (prev === 'raising')  return 'visible';
      if (prev === 'lowering') return 'hidden';
      return prev;
    });
  }, []);

  if (armState === 'hidden') return null;

  const isRaising  = armState === 'raising';
  const isLowering = armState === 'lowering';
  const isMoving   = isRaising || isLowering;
  const imgSrc     = isActive
    ? `${imagePath}radio-arm-active.webp`
    : `${imagePath}radio-arm-inactive.webp`;

  return (
    <>
      <style>{`
        @keyframes radioSlideUp {
          from { transform: translateY(110%); }
          to   { transform: translateY(0%);   }
        }
        @keyframes radioSlideDown {
          from { transform: translateY(0%);   }
          to   { transform: translateY(110%); }
        }
        @keyframes radioRotateIn {
          from { transform: rotate(-40deg); }
          to   { transform: rotate(0deg);   }
        }
        @keyframes radioRotateOut {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(-40deg); }
        }
      `}</style>

      {/* PTT badge */}
      {(armState === 'visible' || armState === 'raising') && (
        <div style={{
          position:       'absolute',
          bottom:         '6rem',
          right:          '1.25rem',
          zIndex:         90,
          display:        'flex',
          alignItems:     'center',
          gap:            '0.5rem',
          background:     isActive ? 'rgba(56,189,248,0.12)' : 'rgba(2,11,24,0.75)',
          border:         isActive ? '1px solid rgba(56,189,248,0.5)' : '1px solid rgba(255,255,255,0.07)',
          borderRadius:   '0.3rem',
          padding:        '0.3rem 0.75rem',
          backdropFilter: 'blur(12px)',
          fontFamily:     '"IBM Plex Mono", "Courier New", monospace',
          fontSize:       '0.52rem',
          letterSpacing:  '0.2em',
          color:          isActive ? '#38bdf8' : '#475569',
          pointerEvents:  'none',
          transition:     'all 0.15s ease',
          boxShadow:      isActive ? '0 0 14px rgba(56,189,248,0.25)' : 'none',
        }}>
          <div style={{
            width:        '5px',
            height:       '5px',
            borderRadius: '50%',
            background:   isActive ? '#38bdf8' : '#334155',
            boxShadow:    isActive ? '0 0 8px #38bdf8' : 'none',
            transition:   'background 0.15s',
          }} />
          {isActive ? 'TX' : 'CLICK · PTT'}
        </div>
      )}

      {/* OUTER — slide vertically */}
      <div
        onAnimationEnd={onAnimEnd}
        style={{
          position:      'fixed',
          bottom:        0,
          right:         0,
          zIndex:        90,
          pointerEvents: 'none',
          animation:     isRaising  ? 'radioSlideUp   0.7s cubic-bezier(0.4,0,0.2,1) forwards'
                       : isLowering ? 'radioSlideDown 0.55s cubic-bezier(0.4,0,0.2,1) forwards'
                       : 'none',
          transform:     !isMoving ? 'translateY(0%)' : undefined,
        }}
      >
        {/* INNER — rotate around bottom-right pivot */}
        <div
          style={{
            transformOrigin: 'bottom right',
            animation:       isRaising  ? 'radioRotateIn  0.7s cubic-bezier(0.4,0,0.2,1) forwards'
                           : isLowering ? 'radioRotateOut 0.55s cubic-bezier(0.4,0,0.2,1) forwards'
                           : 'none',
            transform:       !isMoving ? 'rotate(0deg)' : undefined,
            position:        'relative',
            display:         'inline-block',
          }}
        >
          <img
            src={imgSrc}
            alt={isActive ? 'Radio — transmitting' : 'Radio — standby'}
            draggable={false}
            style={{
              display:       'block',
              height:        'min(110vh, 1100px)',
              width:         'auto',
              userSelect:    'none',
              pointerEvents: 'none',
              transition:    'filter 0.12s ease',
              filter:        isActive
                ? 'drop-shadow(0 0 26px rgba(56,189,248,0.55)) brightness(1.1)'
                : 'drop-shadow(0 6px 28px rgba(0,0,0,0.8))',
            }}
          />

          {/* PTT hit zone — position with pttPos prop, invisible in production */}
          {(armState === 'visible' || armState === 'raising') && (
            <div
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsActive(true); onPTTChange?.(true); }}
              style={{
                position:      'absolute',
                ...pttPos,
                cursor:        isActive ? 'grabbing' : 'grab',
                pointerEvents: 'auto',
                border:        debugBorder ? '2px solid rgba(56,189,248,0.7)' : 'none',
                borderRadius:  '6px',
                background:    isActive ? 'rgba(56,189,248,0.08)' : 'transparent',
                boxSizing:     'border-box',
                transition:    'background 0.1s',
              }}
              title="PTT — hold to transmit"
            />
          )}
        </div>
      </div>
    </>
  );
}