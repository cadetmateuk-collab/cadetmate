# CadetMate mobile strategy

Hybrid approach: **Capacitor shell** for fast Android store presence + **Expo RN** for native study UX, with shared domain logic in `@cadet-mate/shared`.

## Repo layout

```
/
  app/ components/ lib/     ← Next.js web (product surface)
  packages/shared/          ← SRS, roles, Supabase factory, URL helpers
  apps/mobile-shell/        ← Capacitor Android wrapper → live web URL
  apps/mobile/              ← Expo React Native (auth + flashcards MVP)
  docs/MOBILE.md
  docs/PLAY_BILLING.md
```

## Phase A — Capacitor Android shell

```bash
npm install
cd apps/mobile-shell
npx cap add android    # once
npx cap sync android
npx cap open android
```

Default WebView URL: `https://cadetmate.co.uk`  
Local emulator: `CADETMATE_WEB_URL=http://10.0.2.2:3000`

The Next root layout mounts `CapacitorBridge` for Android back button + deep links when running inside the shell.

## Auth & deep links (register in Supabase)

**Dashboard → Authentication → URL Configuration**

Site URL: `https://cadetmate.co.uk`

Additional Redirect URLs (also available from code via `supabaseRedirectAllowlist()`):

```
https://cadetmate.co.uk/auth
https://cadetmate.co.uk/reset-password
https://cadetmate.co.uk/auth/callback
cadetmate://auth/callback
cadetmate://reset-password
```

App scheme: `cadetmate`  
Android / iOS package: `uk.co.cadetmate.app`

Password reset from Expo can pass `?source=mobile` so the web auth form uses `cadetmate://reset-password` as `redirectTo`.

Stripe Checkout accepts `{ source: 'mobile' }` so success/cancel URLs include `source=mobile` for return detection.

## Phase B — Shared package

Import from `@cadet-mate/shared` (or keep using `@/lib/algorithms` / `@/lib/types` / `@/lib/auth/roles` which re-export shared).

Rules for shared code: no `next/*`, no DOM APIs; inject Supabase client where needed.

## Phase C — Expo RN

```bash
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile
```

MVP: login, flashcard list, SRS study, simulators via WebView.

## What stays on web

`/bridge`, `/buoyage`, `/simulator`, `/instructor`, `/admin`, `/radar-plotting` — see `WEB_ONLY_PATHS` in `packages/shared/src/config.ts`.
