# CadetMate Expo app (React Native)

True native Android (and later iOS) client for study-core flows. Shares domain logic with the web app via `@cadet-mate/shared`.

## Features in this MVP

- Email/password auth (Supabase)
- Flashcard pack list + SRS study session (`sm2` from shared package)
- Simulators / store / profile via in-app WebView or system browser

## Setup

```bash
# from repo root
npm install
cp apps/mobile/.env.example apps/mobile/.env
# fill EXPO_PUBLIC_SUPABASE_* from your web .env.local

npm run dev:mobile
# or
npm run android --workspace=@cadet-mate/mobile
```

## Architecture

| Layer | Location |
|-------|----------|
| SRS, roles, URL helpers | `packages/shared` |
| Native UI | `apps/mobile/app` |
| Web (Next.js) | repo root |
| Capacitor shell (full web in stores) | `apps/mobile-shell` |

Heavy 3D routes (`/bridge`, `/buoyage`, `/simulator`, `/instructor`, `/admin`) stay on web — see Simulators tab.
