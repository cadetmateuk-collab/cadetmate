# CadetMate native app

Expo (React Native) client for cadet study flows. The Next.js website stays at the repo root. Shared domain logic lives in `@cadet-mate/shared`.

This app is **not** a WebView of cadetmate.co.uk. Auth, learn, practice, community, store, and profile are native screens. Admin CMS, instructor classroom, and 3D labs stay on the website only.

## Features

- Email auth, onboarding, password-reset deep link (`cadetmate://reset-password`)
- Home dashboard and progress (streak, XP, achievements)
- Offline Mode: a user switch that blocks every network request, even if Wi-Fi is available
- Signed 14-day offline licence (issued by the website after a session check)
- Explicit course downloads with size confirmation (modules, flashcards, articles, survival, quiz)
- Local-first progress, synced only when you confirm going online
- Learn: modules reader, flashcards (SRS), TRB, sea survival, free articles
- Practice: daily quiz and oral question bank (no simulators)
- Community: feed, search, posts, comments, votes (requires connectivity)
- Store: opens the website (reader-app; no in-app Stripe Checkout)
- Profile, notifications, billing portal (website)

## Setup

```bash
# from repo root
npm install
cp apps/mobile/.env.example apps/mobile/.env
# fill EXPO_PUBLIC_SUPABASE_* from your web .env.local
# EXPO_PUBLIC_WEB_URL is the Next origin used for session-check, content packs, sync, and billing

npm run dev:mobile
# or
npm run android --workspace=@cadet-mate/mobile
```

## Architecture

| Layer | Location |
|-------|----------|
| SRS, roles, URL helpers | `packages/shared` |
| Native UI + Expo Router | `apps/mobile` |
| Web (Next.js, Stripe webhooks, CMS) | repo root |

Supabase RLS is the data boundary. The app talks to Next APIs for session-check, licence-gated content packs, progress sync, and the billing portal, sending `Authorization: Bearer <jwt>`. Direct Supabase calls are blocked while Offline Mode is on.

## EAS builds

1. `npm i -g eas-cli` then `cd apps/mobile && eas init` (writes a real `extra.eas.projectId` into `app.json`).
2. `eas build --profile preview --platform android` for an internal APK.
3. `eas build --profile production --platform android` (or `ios`) for store binaries.

Register `cadetmate://reset-password` and `cadetmate://auth/callback` in the Supabase Auth redirect allowlist.
