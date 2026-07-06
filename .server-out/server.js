"use strict";
// server.ts — project root (next to package.json)
// npm install -D ts-node tsconfig-paths
// package.json dev script: "ts-node --project tsconfig.server.json -r tsconfig-paths/register server.ts"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const ws_1 = require("ws");
const sessionStore_1 = require("./lib/sessionStore");
const dev = process.env.NODE_ENV !== 'production';
const port = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '3000', 10);
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
function send(ws, data) {
    if (ws.readyState === ws_1.WebSocket.OPEN)
        ws.send(JSON.stringify(data));
}
app.prepare().then(() => {
    const server = (0, http_1.createServer)((req, res) => {
        handle(req, res, (0, url_1.parse)(req.url, true));
    });
    const wss = new ws_1.WebSocketServer({ noServer: true });
    server.on('upgrade', (req, socket, head) => {
        var _a;
        const { pathname } = (0, url_1.parse)((_a = req.url) !== null && _a !== void 0 ? _a : '');
        if (pathname === '/api/ws') {
            wss.handleUpgrade(req, socket, head, ws => {
                wss.emit('connection', ws, req);
            });
        }
        // Do NOT destroy other upgrades — Next.js HMR uses /_next/webpack-hmr
        // and destroying it causes constant page refreshes in dev
    });
    wss.on('connection', (ws, req) => {
        var _a, _b, _c;
        const url = new URL((_a = req.url) !== null && _a !== void 0 ? _a : '', `http://localhost:${port}`);
        const role = url.searchParams.get('role');
        const code = (_b = url.searchParams.get('code')) === null || _b === void 0 ? void 0 : _b.toUpperCase();
        const sId = url.searchParams.get('studentId');
        const token = (_c = url.searchParams.get('token')) !== null && _c !== void 0 ? _c : 'default';
        console.log(`[WS] new connection role=${role} code=${code} sId=${sId}`);
        // ── Instructor ──────────────────────────────────────────────────────────
        if (role === 'instructor') {
            const session = (0, sessionStore_1.getOrCreateSession)(token, ws);
            console.log(`[WS] instructor session created: ${session.code}`);
            send(ws, { type: 'sessionCreated', sessionCode: session.code });
            ws.on('message', raw => {
                var _a;
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.type === 'ping') {
                        send(ws, { type: 'pong' });
                        return;
                    }
                    if (msg.type === 'triggerScenario') {
                        const sess = (0, sessionStore_1.getSession)(msg.sessionCode);
                        sess === null || sess === void 0 ? void 0 : sess.students.forEach(s => {
                            if (s.online)
                                send(s.ws, { type: 'scenario', scenario: msg.scenario, message: msg.message });
                        });
                    }
                    if (msg.type === 'callStudent') {
                        const student = (_a = (0, sessionStore_1.getSession)(msg.sessionCode)) === null || _a === void 0 ? void 0 : _a.students.get(msg.studentId);
                        if (student === null || student === void 0 ? void 0 : student.online)
                            send(student.ws, { type: 'incomingCall', from: msg.from });
                    }
                }
                catch (e) {
                    console.error('[WS] instructor message error', e);
                }
            });
            ws.on('close', () => {
                sessionStore_1.sessions.forEach((sess, c) => {
                    if (sess.instructorWs === ws) {
                        (0, sessionStore_1.removeSession)(c);
                        console.log(`[WS] session ${c} removed`);
                    }
                });
            });
            ws.on('error', e => console.error('[WS] instructor error', e));
            return;
        }
        // ── Student ─────────────────────────────────────────────────────────────
        if (role === 'student' && code && sId) {
            const session = (0, sessionStore_1.getSession)(code);
            if (!session) {
                console.log(`[WS] student rejected — session ${code} not found`);
                send(ws, { type: 'rejected', reason: 'Session not found' });
                ws.close();
                return;
            }
            const record = { studentId: sId, ws, connectedAt: Date.now(), lastNode: 'back', online: true };
            session.students.set(sId, record);
            console.log(`[WS] student "${sId}" joined ${code}`);
            send(ws, { type: 'joined', sessionCode: code });
            if (session.instructorWs) {
                send(session.instructorWs, { type: 'studentJoined', studentId: sId });
                send(session.instructorWs, {
                    type: 'studentEvent', studentId: sId,
                    event: { type: 'join', sessionCode: code, studentId: sId }, ts: Date.now(),
                });
            }
            ws.on('message', raw => {
                try {
                    const msg = JSON.parse(raw.toString());
                    if (msg.type === 'ping') {
                        send(ws, { type: 'pong' });
                        return;
                    }
                    if (msg.type === 'cameraMove')
                        record.lastNode = msg.node;
                    if (session.instructorWs) {
                        send(session.instructorWs, {
                            type: 'studentEvent', studentId: sId, event: msg, ts: Date.now(),
                        });
                    }
                }
                catch (e) {
                    console.error('[WS] student message error', e);
                }
            });
            ws.on('close', () => {
                record.online = false;
                console.log(`[WS] student "${sId}" disconnected`);
                if (session.instructorWs)
                    send(session.instructorWs, { type: 'studentLeft', studentId: sId });
            });
            ws.on('error', e => console.error('[WS] student error', e));
            return;
        }
        console.log('[WS] unrecognised connection, closing');
        ws.close();
    });
    server.listen(port, () => {
        console.log(`> Ready on http://localhost:${port} [${dev ? 'dev' : 'prod'}]`);
    });
});
