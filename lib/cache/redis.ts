import Redis from 'ioredis';

let client: Redis | null | undefined;

/**
 * Shared Redis connection. Returns null when REDIS_URL is unset so callers
 * fall through to Supabase. Connection errors fail open per command.
 */
export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return null;
  }

  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1_000,
    retryStrategy(times) {
      return times > 1 ? null : 200;
    },
  });
  redis.on('error', () => {
    // Callers catch command failures and read from Supabase.
  });
  client = redis;
  return redis;
}

export async function redisGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch {
    /* cache write is optional */
  }
}

export async function redisDeleteByPrefix(prefix: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  let cursor = '0';
  let removed = 0;
  try {
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        removed += await redis.del(...keys);
      }
    } while (cursor !== '0');
  } catch {
    return removed;
  }
  return removed;
}
