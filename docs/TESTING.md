# CadetMate testing strategy

## Goals

Protect **critical user journeys** with fast feedback on every PR and broader browser coverage before release.

| Layer | Tool | Speed | What it proves |
|---|---|---|---|
| Unit | Vitest | Seconds | Pure logic (security, SEO, nav, paths) |
| Component | Vitest + Testing Library | Seconds | UI contracts (buttons, analytics wrappers) |
| Integration | Vitest | Seconds | Cross-module contracts (metadata, auth redirects) |
| Browser / E2E | Playwright | Minutes | Real journeys across desktop, tablet, mobile & browsers |

## Critical journeys (must stay green)

1. **Anonymous marketing** — `/home`, `/pricing`, `/free-content` load with CTAs
2. **Auth gate** — `/dashboard`, `/buoyage` redirect to `/auth` when logged out
3. **Sign-in surface** — `/auth` shows email/password controls
4. **Safe redirects** — `redirectTo` cannot open-redirect off-site
5. **SEO crawl** — `/robots.txt` + `/sitemap.xml` healthy; home has canonical
6. **Content HTML safety** — `sanitizeHtml` strips XSS vectors
7. **Responsive shell** — header/CTA usable on mobile & tablet viewports

## Commands

```bash
# Unit + component + integration
npm test
npm run test:watch

# Browser matrix (starts next if needed)
npx playwright install   # once per machine
npm run test:e2e

# Faster local E2E (Chromium only)
npm run test:e2e:chromium

# Against an already-running server / ngrok
PLAYWRIGHT_BASE_URL=https://your-tunnel.ngrok-free.app npm run test:e2e
```

## Device & browser matrix (Playwright projects)

| Project | Covers |
|---|---|
| Desktop Chrome | Primary desktop |
| Desktop Firefox | Gecko |
| Desktop Safari | WebKit desktop |
| iPad | Tablet layout |
| Mobile Chrome | Android phone |
| Mobile Safari | iOS phone |

## Folder layout

```
tests/
  setup.ts
  unit/           # pure functions
  component/      # React components
  integration/    # multi-module contracts
e2e/              # Playwright browser tests
vitest.config.ts
playwright.config.ts
```

## Auth E2E (optional)

Set secrets locally / in CI to exercise logged-in flows:

```bash
E2E_USER_EMAIL=...
E2E_USER_PASSWORD=...
```

Then extend `e2e/auth-authenticated.spec.ts` (add when credentials are available). Never commit real passwords.

## CI recommendation

1. `npm test` on every PR (required)
2. `npm run test:e2e:chromium` on every PR (required)
3. Full Playwright matrix on `main` or nightly (Firefox + WebKit + mobile)

## Writing new tests

- Prefer **user-facing assertions** (`getByRole`, visible text) over CSS selectors
- Keep unit tests free of Next.js runtime / Supabase
- Mock `@/lib/analytics` and Supabase in component tests
- Use `data-testid` only when roles/labels are insufficient
- For flaky UI, prefer Playwright auto-waiting over fixed `sleep`

## Coverage priorities (next)

| Priority | Area |
|---|---|
| P0 | Checkout begin → success query param tracking |
| P0 | Flashcard pack unlock gate |
| P1 | Community post create (authenticated) |
| P1 | Buoyage load smoke (authenticated premium) |
| P2 | Admin module list |
| P2 | Visual regression snapshots for `/home` |
