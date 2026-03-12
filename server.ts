// server.ts — project root (next to package.json)
// npm install -D ts-node tsconfig-paths
// package.json dev script: "ts-node --project tsconfig.server.json -r tsconfig-paths/register server.ts"

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { getOrCreateSession, getSession, removeSession, sessions } from './lib/sessionStore';
import { describeEvent } from './lib/wsEvents';
import type { StudentRecord } from './lib/sessionStore';
import type { StudentEvent, InstructorEvent, ServerToStudentEvent, ServerToInstructorEvent } from './lib/wsEvents';

const dev  = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3000', 10);
const app  = next({ dev });
const handle = app.getRequestHandler();

function send<T>(ws: WebSocket, data: T) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url!, true));
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url ?? '');
    if (pathname === '/api/ws') {
      wss.handleUpgrade(req, socket as import('net').Socket, head, ws => {
        wss.emit('connection', ws, req);
      });
    }
    // Do NOT destroy other upgrades — Next.js HMR uses /_next/webpack-hmr
    // and destroying it causes constant page refreshes in dev
  });

  wss.on('connection', (ws: WebSocket, req: import('http').IncomingMessage) => {
    const url  = new URL(req.url ?? '', `http://localhost:${port}`);
    const role = url.searchParams.get('role');
    const code = url.searchParams.get('code')?.toUpperCase();
    const sId  = url.searchParams.get('studentId');

    const token = url.searchParams.get('token') ?? 'default';

    console.log(`[WS] new connection role=${role} code=${code} sId=${sId}`);

    // ── Instructor ──────────────────────────────────────────────────────────
    if (role === 'instructor') {
      const session = getOrCreateSession(token, ws);
      console.log(`[WS] instructor session created: ${session.code}`);
      send<ServerToInstructorEvent>(ws, { type: 'sessionCreated', sessionCode: session.code });

      ws.on('message', raw => {
        try {
          const msg = JSON.parse(raw.toString()) as InstructorEvent;
          if (msg.type === 'ping') { send(ws, { type: 'pong' }); return; }

          if (msg.type === 'triggerScenario') {
            const sess = getSession(msg.sessionCode);
            sess?.students.forEach(s => {
              if (s.online) send<ServerToStudentEvent>(s.ws, { type: 'scenario', scenario: msg.scenario, message: msg.message });
            });
          }

          if (msg.type === 'callStudent') {
            const student = getSession(msg.sessionCode)?.students.get(msg.studentId);
            if (student?.online) send<ServerToStudentEvent>(student.ws, { type: 'incomingCall', from: msg.from });
          }
        } catch (e) { console.error('[WS] instructor message error', e); }
      });

      ws.on('close', () => {
        sessions.forEach((sess, c) => {
          if (sess.instructorWs === ws) { removeSession(c); console.log(`[WS] session ${c} removed`); }
        });
      });

      ws.on('error', e => console.error('[WS] instructor error', e));
      return;
    }

    // ── Student ─────────────────────────────────────────────────────────────
    if (role === 'student' && code && sId) {
      const session = getSession(code);
      if (!session) {
        console.log(`[WS] student rejected — session ${code} not found`);
        send<ServerToStudentEvent>(ws, { type: 'rejected', reason: 'Session not found' });
        ws.close();
        return;
      }

      const record: StudentRecord = { studentId: sId, ws, connectedAt: Date.now(), lastNode: 'back', online: true };
      session.students.set(sId, record);
      console.log(`[WS] student "${sId}" joined ${code}`);

      send<ServerToStudentEvent>(ws, { type: 'joined', sessionCode: code });

      if (session.instructorWs) {
        send<ServerToInstructorEvent>(session.instructorWs, { type: 'studentJoined', studentId: sId });
        send<ServerToInstructorEvent>(session.instructorWs, {
          type: 'studentEvent', studentId: sId,
          event: { type: 'join', sessionCode: code, studentId: sId }, ts: Date.now(),
        });
      }

      ws.on('message', raw => {
        try {
          const msg = JSON.parse(raw.toString()) as StudentEvent;
          if (msg.type === 'ping') { send(ws, { type: 'pong' }); return; }
          if (msg.type === 'cameraMove') record.lastNode = msg.node;
          if (session.instructorWs) {
            send<ServerToInstructorEvent>(session.instructorWs, {
              type: 'studentEvent', studentId: sId, event: msg, ts: Date.now(),
            });
          }
        } catch (e) { console.error('[WS] student message error', e); }
      });

      ws.on('close', () => {
        record.online = false;
        console.log(`[WS] student "${sId}" disconnected`);
        if (session.instructorWs) send<ServerToInstructorEvent>(session.instructorWs, { type: 'studentLeft', studentId: sId });
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