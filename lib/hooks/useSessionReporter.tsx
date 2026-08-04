// ── Student-side session reporter — lib/useSessionReporter.ts ────────────────
'use client';

// ── Set to false to disable all session/WS reporting (e.g. during local dev) ─
const SESSION_ENABLED = true;

import { useEffect, useRef, useCallback } from 'react';
import type { StudentEvent, ServerToStudentEvent } from '../wsEvents';

interface Options {
  onIncomingCall?: (from: string) => void;
  onScenario?: (scenario: string, message?: string) => void;
}

const WS_URL = (code: string, studentId: string) => {
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/api/ws?role=student&code=${code}&studentId=${encodeURIComponent(studentId)}`;
};

export function useSessionReporter(opts: Options = {}) {
  const wsRef     = useRef<WebSocket | null>(null);
  const pingRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const optsRef   = useRef(opts);
  optsRef.current = opts;

  // Timing refs
  const pttPressedAt  = useRef<number | null>(null);
  const incomingAt    = useRef<number | null>(null);
  const callStartedAt = useRef<number | null>(null);
  const callDirection = useRef<'outgoing' | 'incoming'>('outgoing');

  useEffect(() => {
    if (!SESSION_ENABLED) return;

    const params    = new URLSearchParams(window.location.search);
    const code      = params.get('code')?.toUpperCase();
    const studentId = params.get('student') ?? `student-${Math.random().toString(36).slice(2,7)}`;
    if (!code) return;

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;

    let cancelled = false;
    const ws = new WebSocket(WS_URL(code, studentId));
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) { ws.close(); return; }
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 25000);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerToStudentEvent;
        if (msg.type === 'incomingCall') {
          incomingAt.current = Date.now();
          optsRef.current.onIncomingCall?.(msg.from);
        }
        if (msg.type === 'scenario') optsRef.current.onScenario?.(msg.scenario, msg.message);
      } catch { /* ignore */ }
    };

    ws.onclose = () => { if (pingRef.current) clearInterval(pingRef.current); };

    return () => {
      cancelled = true;
      if (pingRef.current) clearInterval(pingRef.current);
      // Don't close on HMR/StrictMode unmount
    };
  }, []);

  const emit = useCallback((event: StudentEvent) => {
    if (!SESSION_ENABLED) return;
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
  }, []);

  // ── Camera ──────────────────────────────────────────────────────────────────
  const reportCameraMove = useCallback((node: string) => {
    emit({ type: 'cameraMove', node });
  }, [emit]);

  // ── Radio PTT — tracks hold duration ────────────────────────────────────────
  const reportPTT = useCallback((active: boolean) => {
    if (active) {
      pttPressedAt.current = Date.now();
      emit({ type: 'radioPTT', active: true });
    } else {
      const durationMs = pttPressedAt.current != null ? Date.now() - pttPressedAt.current : undefined;
      pttPressedAt.current = null;
      emit({ type: 'radioPTT', active: false, durationMs });
    }
  }, [emit]);

  // ── Phone ────────────────────────────────────────────────────────────────────
  const reportPhoneRaised = useCallback(() => {
    emit({ type: 'phoneRaised' });
  }, [emit]);

  const reportPhoneDialled = useCallback((number: string, contact?: string) => {
    emit({ type: 'phoneDialled', number, contact });
  }, [emit]);

  const reportPhoneOutgoing = useCallback((number: string, contact?: string) => {
    callDirection.current = 'outgoing';
    callStartedAt.current = Date.now();
    emit({ type: 'phoneOutgoing', number, contact });
  }, [emit]);

  const reportPhoneAnswered = useCallback((from: string) => {
    callDirection.current = 'incoming';
    callStartedAt.current = Date.now();
    const answerTimeSecs = incomingAt.current != null
      ? Math.round((Date.now() - incomingAt.current) / 1000)
      : 0;
    incomingAt.current = null;
    emit({ type: 'phoneAnswered', from, answerTimeSecs });
  }, [emit]);

  const reportPhoneEnded = useCallback(() => {
    const durationSecs = callStartedAt.current != null
      ? Math.round((Date.now() - callStartedAt.current) / 1000)
      : 0;
    callStartedAt.current = null;
    emit({ type: 'phoneEnded', durationSecs, direction: callDirection.current });
  }, [emit]);

  const reportPhoneMissed = useCallback((from: string) => {
    incomingAt.current = null;
    emit({ type: 'phoneMissed', from });
  }, [emit]);

  const reportPhoneIncoming = useCallback((from: string) => {
    emit({ type: 'phoneIncoming', from });
  }, [emit]);

  // ── Generic button ───────────────────────────────────────────────────────────
  const reportButtonPress = useCallback((buttonId: string, label: string) => {
    emit({ type: 'buttonPress', buttonId, label });
  }, [emit]);

  return {
    reportCameraMove,
    reportPTT,
    reportPhoneRaised,
    reportPhoneDialled,
    reportPhoneOutgoing,
    reportPhoneAnswered,
    reportPhoneEnded,
    reportPhoneMissed,
    reportPhoneIncoming,
    reportButtonPress,
  };
}