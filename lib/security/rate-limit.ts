import { getRedis } from '@/lib/cache/redis';

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

/**
 * Shared window counter. Uses Redis when REDIS_URL is set so limits hold
 * across Node processes. Falls back to this process's memory if Redis is down.
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return rateLimitMemory(key, limit, windowMs);

  const redisKey = `cm:rl:${key}`;
  try {
    await redis.set(redisKey, '0', 'PX', windowMs, 'NX');
    const count = await redis.incr(redisKey);
    return count <= limit;
  } catch {
    return rateLimitMemory(key, limit, windowMs);
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}
