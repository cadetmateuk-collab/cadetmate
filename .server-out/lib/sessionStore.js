"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenMap = exports.sessions = void 0;
exports.generateCode = generateCode;
exports.getOrCreateSession = getOrCreateSession;
exports.getSession = getSession;
exports.removeSession = removeSession;
exports.destroySession = destroySession;
// Persist across Next.js hot-reloads in dev via globalThis
const g = globalThis;
if (!g.__bridgeSessions)
    g.__bridgeSessions = new Map();
if (!g.__bridgeTokens)
    g.__bridgeTokens = new Map();
exports.sessions = g.__bridgeSessions;
exports.tokenMap = g.__bridgeTokens;
function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++)
        code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}
/**
 * Get existing session for this token, or create a new one.
 * This means hot-reloads / reconnects always get the same code back.
 */
function getOrCreateSession(token, instructorWs) {
    const existingCode = exports.tokenMap.get(token);
    if (existingCode) {
        const existing = exports.sessions.get(existingCode);
        if (existing) {
            // Reconnect — update the ws reference, keep students + code
            existing.instructorWs = instructorWs;
            console.log(`[session] instructor reconnected, reusing code ${existingCode}`);
            return existing;
        }
    }
    // New session
    let code = generateCode();
    while (exports.sessions.has(code))
        code = generateCode();
    const session = { code, createdAt: Date.now(), instructorWs, students: new Map() };
    exports.sessions.set(code, session);
    exports.tokenMap.set(token, code);
    console.log(`[session] new session created: ${code} for token ${token.slice(0, 8)}…`);
    return session;
}
function getSession(code) {
    return exports.sessions.get(code);
}
function removeSession(code) {
    // Don't delete the session — just clear the instructor WS so students
    // stay registered and the same code is reused on reconnect.
    const session = exports.sessions.get(code);
    if (session)
        session.instructorWs = null;
}
function destroySession(code) {
    const session = exports.sessions.get(code);
    if (session) {
        exports.tokenMap.forEach((c, t) => { if (c === code)
            exports.tokenMap.delete(t); });
    }
    exports.sessions.delete(code);
}
