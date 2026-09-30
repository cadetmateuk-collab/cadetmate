# Caching

Public article and free-module reads go through Redis before Supabase. Anonymous HTML for public GET routes can be cached by Nginx. Signed-in requests skip that HTML cache.

`REDIS_URL` defaults to unset. With it unset, every cache read falls through to Supabase and rate limits stay in the Node process.

## Layers

| Layer | What | TTL | Where |
|---|---|---|---|
| Process LRU | Public nav links and blog category names | 10 minutes, 32 entries | `lib/cache/lru.ts`, filled from `getCachedPublicNav()` and `getBlogCategories()` |
| Redis | Article JSON, free module JSON, public listing queries, rate-limit counters | Content: 4 hours. Missing slugs: 60 seconds. Rate limits: the window passed by the caller | `REDIS_URL`, keys prefixed `cm:` |
| Next revalidation | `/home`, `/free-content`, article pages, `/resources`, `/community-preview` export `revalidate = 14400` | 4 hours | The public layout still reads the session hint, so these pages are not fully static. Nginx is the anonymous HTML cache |
| Nginx | Anonymous GET/HEAD HTML outside app, auth, and API paths | 10 minutes for HTTP 200 | `deploy/nginx/cadetmate.conf` |
| Browser / Nginx | `/_next/static/*` and `/images/*` | 1 year, `immutable` | Hashed filenames plus `next.config.ts` headers |

## Redis keys

- `cm:articles:list` — free article summaries
- `cm:articles:slug:<slug>` — one article
- `cm:articles:path:<category>:<slug>` — article resolved with its category
- `cm:articles:related:<category>:<slug>:<limit>`
- `cm:articles:slugs` — paths for static generation
- `cm:articles:sitemap` — sitemap rows
- `cm:modules:free:<slug>` — a non-premium module row. Premium and hidden modules are not stored
- `cm:public:landing-stats`, `cm:public:top-posts`, `cm:public:recent-posts`, `cm:public:recent-blog`, `cm:public:community-preview`
- `cm:rl:<key>` — rate-limit counter. Phase 4 should keep using `rateLimit()` in `lib/security/rate-limit.ts`

## Invalidation

Admin article saves already POST `/api/admin/free-content/revalidate`. That route deletes `cm:articles:*` and `cm:public:*` and revalidates the Next paths.

Module create, update, delete, and visibility changes delete `cm:modules:*`. The module admin screen also POSTs the same route with `{ "scope": "modules" }`.

### Bust by hand

Redis, on the VPS:

```bash
redis-cli --scan --pattern 'cm:articles:*' | xargs -r redis-cli del
redis-cli --scan --pattern 'cm:modules:*' | xargs -r redis-cli del
redis-cli --scan --pattern 'cm:public:*' | xargs -r redis-cli del
```

Next, while the app is running, as a staff user:

```bash
curl -X POST https://cadetmate.co.uk/api/admin/free-content/revalidate \
  -H 'content-type: application/json' \
  -H "cookie: <your staff session cookie>" \
  -d '{"scope":"all"}'
```

`scope` is `articles` (default), `modules`, or `all`.

Nginx:

```bash
sudo rm -rf /var/cache/nginx/cadetmate/*
sudo nginx -s reload
```

The in-process LRU clears when the Node process restarts, and when article keys are invalidated in that same process. Another process still keeps its own LRU until the 10 minute TTL.

## Install Redis on the VPS

```bash
sudo bash deploy/redis/install-redis.sh
```

Then set `REDIS_URL=redis://127.0.0.1:6379` for the Next process and restart it. Redis listens on localhost only.

## Nginx

`deploy/nginx/cadetmate.conf` caches public GET/HEAD responses for 10 minutes. A request is not cached when:

- the cookie header contains a Supabase `sb-...-auth-token` cookie
- the method is not GET or HEAD
- the path is an app, auth, or API route
- the upstream response sets a cookie

`/_next/static/` and `/images/` are not in that short cache. They are proxied with `Cache-Control: public, max-age=31536000, immutable`. Next already content-hashes those files (`/_next/static/chunks/<name>-<hash>.js`) and `next.config.ts` sends the same immutable header in production.

`X-Cache-Status` on an HTML response is `HIT`, `MISS`, or `BYPASS`.

## Verify Redis locally

Start Redis, then from PowerShell:

```powershell
$env:TS_NODE_COMPILER_OPTIONS = '{"module":"commonjs","moduleResolution":"node"}'
$env:REDIS_URL = 'redis://127.0.0.1:6379'
npx ts-node --transpile-only -r tsconfig-paths/register scripts/verify-content-cache.ts
```

The script checks that a loader runs once, then loads the public article list from Supabase and reads it back from Redis.
