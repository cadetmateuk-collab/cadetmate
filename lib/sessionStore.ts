// ── In-memory session store — lib/sessionStore.ts ────────────────────────────
import { WebSocket } from 'ws';

export interface StudentRecord {
  studentId:   string;
  ws:          WebSocket;
  connectedAt: number;
  lastNode:    string;
  online:      boolean;
}

export interface Session {
  code:         string;
  createdAt:    number;
  instructorWs: WebSocket | null;
  students:     Map<string, StudentRecord>;
}

// Persist across Next.js hot-reloads in dev via globalThis
const g = globalThis as unknown as {
  __bridgeSessions?: Map<string, Session>;
  __bridgeTokens?:   Map<string, string>;  // instructor token → session code
};
if (!g.__bridgeSessions) g.__bridgeSessions = new Map();
if (!g.__bridgeTokens)   g.__bridgeTokens   = new Map();

export const sessions: Map<string, Session> = g.__bridgeSessions;
export const tokenMap: Map<string, string>  = g.__bridgeTokens;

export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Get existing session for this token, or create a new one.
 * This means hot-reloads / reconnects always get the same code back.
 */
export function getOrCreateSession(token: string, instructorWs: WebSocket): Session {
  const existingCode = tokenMap.get(token);
  if (existingCode) {
    const existing = sessions.get(existingCode);
    if (existing) {
      // Reconnect — update the ws reference, keep students + code
      existing.instructorWs = instructorWs;
      console.log(`[session] instructor reconnected, reusing code ${existingCode}`);
      return existing;
    }
  }
  // New session
  let code = generateCode();
  while (sessions.has(code)) code = generateCode();
  const session: Session = { code, createdAt: Date.now(), instructorWs, students: new Map() };
  sessions.set(code, session);
  tokenMap.set(token, code);
  console.log(`[session] new session created: ${code} for token ${token.slice(0, 8)}…`);
  return session;
}

export function getSession(code: string): Session | undefined {
  return sessions.get(code);
}

export function removeSession(code: string) {
  // Don't delete the session — just clear the instructor WS so students
  // stay registered and the same code is reused on reconnect.
  const session = sessions.get(code);
  if (session) session.instructorWs = null;
}

export function destroySession(code: string) {
  const session = sessions.get(code);
  if (session) {
    tokenMap.forEach((c, t) => { if (c === code) tokenMap.delete(t); });
  }
  sessions.delete(code);
}