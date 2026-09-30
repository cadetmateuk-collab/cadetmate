/**
 * Confirms Redis cache-aside: the loader runs once, the second read is a hit,
 * then a real public article list is fetched from Supabase and served from Redis.
 *
 * Usage (PowerShell):
 *   $env:TS_NODE_COMPILER_OPTIONS = '{"module":"commonjs","moduleResolution":"node"}'
 *   $env:REDIS_URL = 'redis://127.0.0.1:6379'
 *   npx ts-node --transpile-only -r tsconfig-paths/register scripts/verify-content-cache.ts
 */
import fs from 'fs';
import { cacheAside, invalidateArticles } from '../lib/cache/content';
import { getRedis } from '../lib/cache/redis';
import { getAllBlogPosts } from '../lib/blog/queries';

function loadEnvFile(path: string) {
  if (!fs.existsSync(path)) return;
  for (const line of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadEnvFile('.env.local');
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

  const redis = getRedis();
  if (!redis) throw new Error('Redis client was not created');
  const pong = await redis.ping();
  if (pong !== 'PONG') throw new Error(`Unexpected ping: ${pong}`);

  let loads = 0;
  await redis.del('cm:verify:ping');
  await cacheAside('cm:verify:ping', 60, async () => {
    loads += 1;
    return { ok: true };
  });
  await cacheAside('cm:verify:ping', 60, async () => {
    loads += 1;
    return { ok: false };
  });
  if (loads !== 1) throw new Error(`cache-aside called the loader ${loads} times`);
  await redis.del('cm:verify:ping');
  console.log('cache-aside hit: loader ran once');

  await invalidateArticles();
  const first = await getAllBlogPosts();
  const listKey = await redis.get('cm:articles:list');
  if (!listKey) throw new Error('cm:articles:list was not written');
  const second = await getAllBlogPosts();
  if (first.length !== second.length) {
    throw new Error(`list length changed across cache hit (${first.length} vs ${second.length})`);
  }
  console.log(`articles cached: ${first.length} posts, second read served from Redis`);
  await redis.quit();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
