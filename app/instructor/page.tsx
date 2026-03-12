// ── Instructor dashboard — app/instructor/page.tsx ───────────────────────────
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ServerToInstructorEvent, InstructorEvent, ScenarioType, LogEntry } from '@/lib/wsEvents';
import { describeEvent } from '@/lib/wsEvents';

// ── Types ─────────────────────────────────────────────────────────────────────
interface StudentState {
  studentId:   string;
  online:      boolean;
  lastNode:    string;
  lastSeen:    number;
  logs:        LogEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (ts: number) => new Date(ts).toLocaleTimeString('en-GB', { hour12: false });

const WS_URL = (token: string) => {
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}/api/ws?role=instructor&token=${token}`;
};

function getOrCreateToken(): string {
  const stored = localStorage.getItem('bridge-instructor-token');
  if (stored) return stored;
  const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  localStorage.setItem('bridge-instructor-token', token);
  return token;
}

const SCENARIO_LABELS: Record<ScenarioType, { label: string; color: string; icon: string }> = {
  fire:      { label: 'FIRE ALARM',       color: '#ef4444', icon: '🔥' },
  mob:       { label: 'MAN OVERBOARD',    color: '#f97316', icon: '🆘' },
  collision: { label: 'COLLISION ALERT',  color: '#eab308', icon: '⚠️' },
  custom:    { label: 'CUSTOM MESSAGE',   color: '#8b5cf6', icon: '📢' },
};

const NODE_LABELS: Record<string, string> = {
  back: 'AFT', helm: 'HELM', psWing: 'PS WING', sbWing: 'SB WING',
  psEcdis: 'ECDIS', psRadio: 'GMDSS', psLookout: 'PS LOOK', psSofa: 'SOFA',
  sbDesk: 'SB DESK', sbLogbook: 'LOGBOOK', sbLookout: 'SB LOOK', radar: 'RADAR',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function InstructorPage() {
  const wsRef          = useRef<WebSocket | null>(null);
  const pingRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sessionCode, setSessionCode]   = useState<string | null>(null);
  const [connected, setConnected]       = useState(false);
  const [students, setStudents]         = useState<Map<string, StudentState>>(new Map());
  const [customMsg, setCustomMsg]       = useState('');
  const [activeScenario, setActiveScen] = useState<ScenarioType | null>(null);
  const [selectedStudent, setSelected]  = useState<string | null>(null);
  const [callFrom, setCallFrom]         = useState('CAPTAIN');
  const studentsRef = useRef(students);
  studentsRef.current = students;

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const send = useCallback((msg: InstructorEvent) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) return;
    const token = getOrCreateToken();
    const ws = new WebSocket(WS_URL(token));
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) { ws.close(); return; }
      setConnected(true);
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 25000);
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingRef.current) clearInterval(pingRef.current);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as ServerToInstructorEvent;

        if (msg.type === 'sessionCreated') {
          setSessionCode(msg.sessionCode);
        }

        if (msg.type === 'studentJoined') {
          setStudents(prev => {
            const next = new Map(prev);
            if (!next.has(msg.studentId)) {
              next.set(msg.studentId, {
                studentId: msg.studentId, online: true,
                lastNode: 'back', lastSeen: Date.now(), logs: [],
              });
            } else {
              next.get(msg.studentId)!.online = true;
            }
            return next;
          });
        }

        if (msg.type === 'studentLeft') {
          setStudents(prev => {
            const next = new Map(prev);
            const s = next.get(msg.studentId);
            if (s) s.online = false;
            return new Map(next);
          });
        }

        if (msg.type === 'studentEvent') {
          const { studentId, event, ts } = msg;
          const { detail, icon } = describeEvent(event);
          const entry: LogEntry = { ts, studentId, type: event.type, detail, icon };

          setStudents(prev => {
            const next = new Map(prev);
            const s = next.get(studentId);
            if (s) {
              s.lastSeen = ts;
              if (event.type === 'cameraMove') s.lastNode = (event as any).node;
              s.logs = [...s.logs.slice(-199), entry]; // keep last 200 per student
            }
            return new Map(next);
          });
        }
      } catch { /* ignore */ }
    };

    return () => {
      cancelled = true;
      if (pingRef.current) clearInterval(pingRef.current);
      // Don't close the ws — StrictMode will remount immediately and we want
      // to keep the same connection. The socket closes naturally on navigation.
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const triggerScenario = useCallback((scenario: ScenarioType) => {
    if (!sessionCode) return;
    send({ type: 'triggerScenario', sessionCode, scenario, message: scenario === 'custom' ? customMsg : undefined });
    setActiveScen(scenario);
    setTimeout(() => setActiveScen(null), 4000);
  }, [sessionCode, customMsg, send]);

  const callStudent = useCallback((studentId: string) => {
    if (!sessionCode) return;
    send({ type: 'callStudent', sessionCode, studentId, from: callFrom });
  }, [sessionCode, callFrom, send]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const studentList = Array.from(students.values());
  const onlineCount = studentList.filter(s => s.online).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:   '100vh',
      background:  '#020b18',
      color:       '#e2e8f0',
      fontFamily:  '"IBM Plex Mono", "Courier New", monospace',
      display:     'flex',
      flexDirection: 'column',
    }}>

      {/* ── Header ── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding:      '0.85rem 1.5rem',
        display:      'flex',
        alignItems:   'center',
        gap:          '1.5rem',
        background:   'rgba(2,11,24,0.95)',
        position:     'sticky',
        top:          0,
        zIndex:       50,
      }}>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.3em', color: '#38bdf8', opacity: 0.7 }}>BRIDGE SIM</span>
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: '#e2e8f0', fontWeight: 700 }}>INSTRUCTOR</span>

        <div style={{ flex: 1 }} />

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: connected ? '#34d399' : '#ef4444',
            boxShadow:  connected ? '0 0 8px #34d399' : 'none',
          }} />
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: connected ? '#34d399' : '#ef4444' }}>
            {connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Online count */}
        <div style={{
          background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '0.25rem', padding: '0.25rem 0.65rem',
          fontSize: '0.55rem', letterSpacing: '0.2em', color: '#38bdf8',
        }}>
          {onlineCount} ONLINE
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>

        {/* ── Left sidebar — session + scenario controls ── */}
        <div style={{
          width:        '260px',
          flexShrink:   0,
          borderRight:  '1px solid rgba(255,255,255,0.07)',
          padding:      '1.25rem',
          display:      'flex',
          flexDirection:'column',
          gap:          '1.5rem',
          overflowY:    'auto',
        }}>

          {/* Session code */}
          <div>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.3em', color: '#64748b', marginBottom: '0.6rem' }}>SESSION CODE</div>
            {sessionCode ? (
              <>
                <div style={{
                  fontSize:      '2rem',
                  fontWeight:    700,
                  letterSpacing: '0.3em',
                  color:         '#38bdf8',
                  textShadow:    '0 0 20px rgba(56,189,248,0.4)',
                  lineHeight:    1,
                  marginBottom:  '0.5rem',
                }}>{sessionCode}</div>
                <div style={{ fontSize: '0.5rem', letterSpacing: '0.15em', color: '#475569' }}>
                  Students visit the simulator and add<br />
                  <span style={{ color: '#64748b' }}>?code={sessionCode}</span> to the URL
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.15em' }}>
                {connected ? 'Generating…' : 'Waiting for connection…'}
              </div>
            )}
          </div>

          {/* Scenarios */}
          <div>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.3em', color: '#64748b', marginBottom: '0.75rem' }}>TRIGGER SCENARIO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(Object.entries(SCENARIO_LABELS) as [ScenarioType, typeof SCENARIO_LABELS[ScenarioType]][])
                .filter(([k]) => k !== 'custom')
                .map(([key, def]) => (
                <button
                  key={key}
                  onClick={() => triggerScenario(key)}
                  disabled={!sessionCode}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '0.5rem',
                    padding:      '0.55rem 0.75rem',
                    background:   activeScenario === key ? `${def.color}22` : 'rgba(255,255,255,0.03)',
                    border:       `1px solid ${activeScenario === key ? def.color + '66' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '0.3rem',
                    color:        activeScenario === key ? def.color : '#64748b',
                    fontFamily:   '"IBM Plex Mono", monospace',
                    fontSize:     '0.58rem',
                    letterSpacing:'0.18em',
                    cursor:       sessionCode ? 'pointer' : 'not-allowed',
                    transition:   'all 0.2s',
                    outline:      'none',
                    textAlign:    'left',
                  }}
                >
                  <span>{def.icon}</span>
                  <span>{def.label}</span>
                </button>
              ))}

              {/* Custom message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input
                  value={customMsg}
                  onChange={e => setCustomMsg(e.target.value)}
                  placeholder="Custom message…"
                  style={{
                    background:    'rgba(255,255,255,0.04)',
                    border:        '1px solid rgba(255,255,255,0.08)',
                    borderRadius:  '0.25rem',
                    padding:       '0.45rem 0.6rem',
                    color:         '#e2e8f0',
                    fontFamily:    '"IBM Plex Mono", monospace',
                    fontSize:      '0.58rem',
                    outline:       'none',
                    letterSpacing: '0.08em',
                  }}
                />
                <button
                  onClick={() => triggerScenario('custom')}
                  disabled={!sessionCode || !customMsg.trim()}
                  style={{
                    padding:      '0.45rem 0.75rem',
                    background:   'rgba(139,92,246,0.1)',
                    border:       '1px solid rgba(139,92,246,0.3)',
                    borderRadius: '0.25rem',
                    color:        '#8b5cf6',
                    fontFamily:   '"IBM Plex Mono", monospace',
                    fontSize:     '0.55rem',
                    letterSpacing:'0.18em',
                    cursor:       (sessionCode && customMsg.trim()) ? 'pointer' : 'not-allowed',
                    outline:      'none',
                  }}
                >
                  📢 BROADCAST
                </button>
              </div>
            </div>
          </div>

          {/* Call a student */}
          <div>
            <div style={{ fontSize: '0.5rem', letterSpacing: '0.3em', color: '#64748b', marginBottom: '0.75rem' }}>PHONE STUDENT</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <input
                value={callFrom}
                onChange={e => setCallFrom(e.target.value)}
                placeholder="Caller name…"
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '0.25rem', padding: '0.45rem 0.6rem',
                  color: '#e2e8f0', fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: '0.58rem', outline: 'none', letterSpacing: '0.08em',
                }}
              />
              <div style={{ fontSize: '0.5rem', color: '#475569', letterSpacing: '0.1em' }}>
                Select a student below then click their call button
              </div>
            </div>
          </div>
        </div>

        {/* ── Main area — student cards ── */}
        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto' }}>

          {studentList.length === 0 ? (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '100%',
              gap:            '1rem',
              color:          '#1e3a5f',
            }}>
              <div style={{ fontSize: '3rem' }}>⚓</div>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.3em' }}>WAITING FOR STUDENTS</div>
              {sessionCode && (
                <div style={{ fontSize: '0.55rem', color: '#334155', letterSpacing: '0.15em' }}>
                  Share code: <span style={{ color: '#38bdf8' }}>{sessionCode}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display:             'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap:                 '1rem',
              alignContent:        'start',
            }}>
              {studentList.map(student => (
                <StudentCard
                  key={student.studentId}
                  student={student}
                  onCall={() => callStudent(student.studentId)}
                  callFrom={callFrom}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Student card ──────────────────────────────────────────────────────────────
function StudentCard({ student, onCall, callFrom }: {
  student:  StudentState;
  onCall:   () => void;
  callFrom: string;
}) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [student.logs.length]);

  const nodeLabel = NODE_LABELS[student.lastNode] ?? student.lastNode.toUpperCase();
  const color     = student.online ? '#34d399' : '#475569';

  return (
    <div style={{
      background:   'rgba(255,255,255,0.02)',
      border:       `1px solid ${student.online ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: '0.5rem',
      overflow:     'hidden',
      display:      'flex',
      flexDirection:'column',
      transition:   'border-color 0.3s',
    }}>

      {/* Card header */}
      <div style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '0.6rem',
        padding:       '0.65rem 0.85rem',
        borderBottom:  '1px solid rgba(255,255,255,0.05)',
        background:    'rgba(255,255,255,0.02)',
      }}>
        {/* Online pip */}
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
          background: color, boxShadow: student.online ? `0 0 8px ${color}` : 'none',
        }} />

        {/* Student ID */}
        <span style={{
          flex: 1, fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.12em', color: student.online ? '#e2e8f0' : '#475569',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {student.studentId.toUpperCase()}
        </span>

        {/* Current node badge */}
        <div style={{
          fontSize: '0.5rem', letterSpacing: '0.2em',
          color: '#38bdf8', background: 'rgba(56,189,248,0.08)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: '0.2rem', padding: '0.15rem 0.45rem',
        }}>
          {nodeLabel}
        </div>

        {/* Call button */}
        <button
          onClick={onCall}
          disabled={!student.online}
          title={`Call ${student.studentId} as ${callFrom}`}
          style={{
            background:   student.online ? 'rgba(52,211,153,0.1)' : 'transparent',
            border:       `1px solid ${student.online ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '0.2rem',
            color:        student.online ? '#34d399' : '#334155',
            fontFamily:   '"IBM Plex Mono", monospace',
            fontSize:     '0.7rem',
            padding:      '0.2rem 0.45rem',
            cursor:       student.online ? 'pointer' : 'not-allowed',
            outline:      'none',
            lineHeight:   1,
          }}
        >
          📞
        </button>
      </div>

      {/* Log */}
      <div style={{
        height:    '220px',
        overflowY: 'auto',
        padding:   '0.5rem 0.75rem',
        display:   'flex',
        flexDirection: 'column',
        gap:       '0.15rem',
      }}>
        {student.logs.length === 0 ? (
          <div style={{ color: '#1e3a5f', fontSize: '0.52rem', letterSpacing: '0.15em', marginTop: '0.5rem' }}>
            No events yet…
          </div>
        ) : (
          student.logs.map((entry, i) => (
            <div key={i} style={{
              display:    'flex',
              gap:        '0.5rem',
              alignItems: 'baseline',
              fontSize:   '0.52rem',
              letterSpacing: '0.05em',
              lineHeight: 1.6,
            }}>
              <span style={{ color: '#334155', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(entry.ts)}
              </span>
              <span style={{ flexShrink: 0 }}>{entry.icon}</span>
              <span style={{ color: '#94a3b8' }}>{entry.detail}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}