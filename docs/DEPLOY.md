# Deploying CadetMate (including WebSocket instructor sessions)

CadetMate is a **Next.js app with a custom Node HTTP server** (`server.ts`) that attaches a WebSocket endpoint at `/api/ws` for instructor ↔ student simulator sessions.

## Why not plain `next start` / Vercel serverless?

| Command | Pages / API routes | `/api/ws` instructor sessions |
|---------|--------------------|-------------------------------|
| `npm run dev` / `npm start` (custom server) | Yes | Yes |
| `npm run dev:next` / `next start` | Yes | **No** — upgrade handler missing |
| Vercel serverless / edge | Yes (with limits) | **No** — no sticky long-lived WS |

In-memory session state lives in `lib/sessionStore.ts`. Multiple instances without sticky sessions will drop instructor rooms. Use **one Node process** (or add Redis later).

## Production (recommended)

Long-lived Node host: Railway, Fly.io, Render, DigitalOcean App Platform, or a VPS.

```bash
npm ci
npm run build    # next build + tsc → .server-out/server.js
npm start        # node -r ./tsconfig-paths-bootstrap.js .server-out/server.js
```

Required env (minimum):

```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_URL=https://your-domain
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

Optional Stripe Premium automation:

```
STRIPE_PREMIUM_PRICE_IDS=price_xxx,price_yyy
NEXT_PUBLIC_STRIPE_PRICING_TABLE_ALL=prctbl_...
NEXT_PUBLIC_STRIPE_PRICING_TABLE_PREMIUM=prctbl_...
```

Point Stripe webhooks at `https://your-domain/api/stripe-webhook` and enable:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Health check: `GET /api/ping` (if present) or any public page.

## Local development

```bash
npm run dev          # custom server + WS (instructor works)
npm run dev:next     # Turbopack only — faster UI, no WS
```

## Optional split (advanced)

1. Deploy Next on a platform that does not support custom servers.
2. Run a small WS-only process from `server.ts` (extract later) on Fly/Railway.
3. Set `NEXT_PUBLIC_WS_URL=wss://ws.your-domain` and point `useSessionReporter` / instructor clients at it.

Until that split exists, **keep web + WS on the same custom `npm start` process**.

## Mobile shells

- Capacitor (`apps/mobile-shell`) loads the **deployed web URL** — deploy this Node server (or your CDN fronting it) first.
- Expo (`apps/mobile`) talks to Supabase directly; simulators open the web URL in a WebView.

See also: `docs/MOBILE.md`, `docs/PLAY_BILLING.md`.
