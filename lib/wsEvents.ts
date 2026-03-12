// ── Shared event types — used by both client and server ──────────────────────
// lib/wsEvents.ts

export type ScenarioType = 'fire' | 'mob' | 'collision' | 'custom';

// ── Events sent FROM student TO server ───────────────────────────────────────
export type StudentEvent =
  | { type: 'join';           sessionCode: string; studentId: string }
  | { type: 'cameraMove';     node: string }
  // Radio
  | { type: 'radioPTT';       active: boolean; durationMs?: number }
  // Phone — outgoing
  | { type: 'phoneRaised' }
  | { type: 'phoneDialled';   number: string; contact?: string }
  | { type: 'phoneOutgoing';  number: string; contact?: string }
  | { type: 'phoneEnded';     durationSecs: number; direction: 'outgoing' | 'incoming' }
  // Phone — incoming
  | { type: 'phoneIncoming';  from: string }
  | { type: 'phoneAnswered';  from: string; answerTimeSecs: number }
  | { type: 'phoneMissed';    from: string }
  // Generic button
  | { type: 'buttonPress';    buttonId: string; label: string }
  | { type: 'ping' }

// ── Events sent FROM server TO student ───────────────────────────────────────
export type ServerToStudentEvent =
  | { type: 'joined';       sessionCode: string }
  | { type: 'rejected';     reason: string }
  | { type: 'scenario';     scenario: ScenarioType; message?: string }
  | { type: 'incomingCall'; from: string }
  | { type: 'pong' }

// ── Events sent FROM instructor TO server ────────────────────────────────────
export type InstructorEvent =
  | { type: 'createSession' }
  | { type: 'triggerScenario'; sessionCode: string; scenario: ScenarioType; message?: string }
  | { type: 'callStudent';     sessionCode: string; studentId: string; from: string }
  | { type: 'ping' }

// ── Events sent FROM server TO instructor ────────────────────────────────────
export type ServerToInstructorEvent =
  | { type: 'sessionCreated'; sessionCode: string }
  | { type: 'studentJoined';  studentId: string }
  | { type: 'studentLeft';    studentId: string }
  | { type: 'studentEvent';   studentId: string; event: StudentEvent; ts: number }
  | { type: 'pong' }

// ── Log entry (built on instructor side) ─────────────────────────────────────
export interface LogEntry {
  ts:        number;
  studentId: string;
  type:      string;
  detail:    string;
  icon:      string;
}

export function describeEvent(e: StudentEvent): { detail: string; icon: string } {
  switch (e.type) {
    case 'cameraMove':    return { detail: `Moved to ${e.node}`,                                                                  icon: '📍' };
    case 'radioPTT':      return e.active
                            ? { detail: 'PTT — transmitting',                                                                     icon: '📻' }
                            : { detail: `PTT released${e.durationMs != null ? ` (${(e.durationMs/1000).toFixed(1)}s)` : ''}`,    icon: '📻' };
    case 'phoneRaised':   return { detail: 'Raised handset',                                                                      icon: '☎️' };
    case 'phoneDialled':  return { detail: `Dialled ${e.contact ?? e.number}`,                                                   icon: '🔢' };
    case 'phoneOutgoing': return { detail: `Calling ${e.contact ?? e.number}`,                                                   icon: '📲' };
    case 'phoneEnded':    return { detail: `Call ended — ${e.durationSecs}s (${e.direction})`,                                   icon: '📵' };
    case 'phoneIncoming': return { detail: `Incoming call from ${e.from}`,                                                        icon: '📳' };
    case 'phoneAnswered': return { detail: `Answered ${e.from} after ${e.answerTimeSecs}s`,                                      icon: '✅' };
    case 'phoneMissed':   return { detail: `Missed call from ${e.from}`,                                                          icon: '❌' };
    case 'buttonPress':   return { detail: `Pressed ${e.label}`,                                                                  icon: '🔘' };
    case 'join':          return { detail: 'Connected',                                                                           icon: '🟢' };
    default:              return { detail: (e as StudentEvent).type,                                                              icon: '·'  };
  }
}