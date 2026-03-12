'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Detects mouse panning and returns a small lagging offset to apply
 * to arm overlays — simulating physical inertia. No blur.
 */
export function useArmSway() {
  const [sway, setSway]  = useState({ x: 0, y: 0 });
  const dragging         = useRef(false);
  const lastPos          = useRef({ x: 0, y: 0 });
  const decayRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDecay = useCallback(() => {
    if (decayRef.current) clearInterval(decayRef.current);
    decayRef.current = setInterval(() => {
      setSway(prev => {
        const x = prev.x * 0.84;
        const y = prev.y * 0.84;
        if (Math.abs(x) < 0.05 && Math.abs(y) < 0.05) {
          if (decayRef.current) clearInterval(decayRef.current);
          return { x: 0, y: 0 };
        }
        return { x, y };
      });
    }, 16);
  }, []);

  const onMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    lastPos.current  = { x: e.clientX, y: e.clientY };
    if (decayRef.current) clearInterval(decayRef.current);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setSway(prev => ({
      x: Math.max(-8, Math.min(8, prev.x - dx * 0.12)),
      y: Math.max(-5, Math.min(5, prev.y - dy * 0.07)),
    }));
  }, []);

  const onMouseUp = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return;
    dragging.current = false;
    startDecay();
  }, [startDecay]);

  useEffect(() => {
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
      if (decayRef.current) clearInterval(decayRef.current);
    };
  }, [onMouseDown, onMouseMove, onMouseUp]);

  const swayStyle: React.CSSProperties = {
    transform:  `translate(${sway.x}px, ${sway.y}px)`,
    transition: dragging.current
      ? 'transform 0.3s cubic-bezier(0.2,0,0.8,1)'
      : 'transform 0.7s cubic-bezier(0.2,0,0,1)',
    willChange: 'transform',
  };

  return swayStyle;
}