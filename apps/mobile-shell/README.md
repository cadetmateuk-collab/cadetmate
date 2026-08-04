# CadetMate Capacitor shell (Android)

Wraps the live web app (`https://cadetmate.co.uk` by default) in a native Android container so Play Store builds can ship while product work continues on Next.js.

## Setup

```bash
# from repo root
npm install
cd apps/mobile-shell
npx cap add android   # first time only
npx cap sync android
npx cap open android  # opens Android Studio
```

### Point at local / staging web

```bash
# Android emulator → host machine
set CADETMATE_WEB_URL=http://10.0.2.2:3000
npx cap sync android
```

Physical device: use your LAN IP, e.g. `http://192.168.1.10:3000`.

## Deep links

App id: `uk.co.cadetmate.app`  
Scheme: `cadetmate://`

Register intent filters in Android Studio (or via Capacitor) for:

- `cadetmate://auth/callback`
- `cadetmate://reset-password`
- `https://cadetmate.co.uk/...` (App Links — optional later)

See `docs/MOBILE.md` for Supabase redirect allowlist.

## Native tweaks

| Concern | Where |
|---------|--------|
| Splash / status bar | `capacitor.config.ts` |
| Back button | `www/js/native.js` |
| Deep links | `www/js/native.js` + Android intent filters |
| Icons | `android/app/src/main/res/` after `cap add android` |
