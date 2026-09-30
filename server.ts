// server.ts — project root (next to package.json)
// package.json dev script: ts-node --transpile-only --project tsconfig.server.json -r tsconfig-paths/register server.ts

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { ENABLE_HMR } from './lib/cache/dev-cache';

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT ?? '3000', 10);

const app = next({
  dev,
  turbopack: dev,
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const pathname = parse(req.url ?? '', true).pathname ?? '';
    if (
      pathname === '/manifest.webmanifest' ||
      pathname === '/manifest.json' ||
      pathname === '/site.webmanifest'
    ) {
      res.statusCode = 204;
      res.end();
      return;
    }
    handle(req, res, parse(req.url!, true));
  });

  server.on('upgrade', (req, socket, head) => {
    if (ENABLE_HMR) {
      void app.getUpgradeHandler()(req, socket, head);
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port} [${dev ? 'dev' : 'prod'}]`);
  });
});
