"use strict";
// ── Shared event types — used by both client and server ──────────────────────
// lib/wsEvents.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeEvent = describeEvent;
function describeEvent(e) {
    var _a, _b;
    switch (e.type) {
        case 'cameraMove': return { detail: `Moved to ${e.node}`, icon: '📍' };
        case 'radioPTT': return e.active
            ? { detail: 'PTT — transmitting', icon: '📻' }
            : { detail: `PTT released${e.durationMs != null ? ` (${(e.durationMs / 1000).toFixed(1)}s)` : ''}`, icon: '📻' };
        case 'phoneRaised': return { detail: 'Raised handset', icon: '☎️' };
        case 'phoneDialled': return { detail: `Dialled ${(_a = e.contact) !== null && _a !== void 0 ? _a : e.number}`, icon: '🔢' };
        case 'phoneOutgoing': return { detail: `Calling ${(_b = e.contact) !== null && _b !== void 0 ? _b : e.number}`, icon: '📲' };
        case 'phoneEnded': return { detail: `Call ended — ${e.durationSecs}s (${e.direction})`, icon: '📵' };
        case 'phoneIncoming': return { detail: `Incoming call from ${e.from}`, icon: '📳' };
        case 'phoneAnswered': return { detail: `Answered ${e.from} after ${e.answerTimeSecs}s`, icon: '✅' };
        case 'phoneMissed': return { detail: `Missed call from ${e.from}`, icon: '❌' };
        case 'buttonPress': return { detail: `Pressed ${e.label}`, icon: '🔘' };
        case 'join': return { detail: 'Connected', icon: '🟢' };
        default: return { detail: e.type, icon: '·' };
    }
}
