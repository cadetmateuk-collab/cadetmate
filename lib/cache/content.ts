import { redisDeleteByPrefix, redisGet, redisSet } from '@/lib/cache/redis';
import { createLru } from '@/lib/cache/lru';
import { PUBLIC_NAV } from '@/lib/navigation/config';

/** A few hours. Admin save deletes keys immediately. */
export const CONTENT_TTL_SECONDS = 4 * 60 * 60;
const MISS_TTL_SECONDS = 60;
const MISS = '{"__cache":"miss"}';

const configLru = createLru<unknown>(32, 10 * 60 * 1000);

export type PublicNavLink = { id: string; label: string; href: string };

export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const cached = await redisGet(key);
  if (cached === MISS) return null as T;
  if (cached != null) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      /* fall through and refresh */
    }
  }

  const value = await load();
  if (value == null) {
    await redisSet(key, MISS, MISS_TTL_SECONDS);
  } else {
    await redisSet(key, JSON.stringify(value), ttlSeconds);
  }
  return value;
}

export function getCachedPublicNav(): PublicNavLink[] {
  const hit = configLru.get('public-nav') as PublicNavLink[] | undefined;
  if (hit) return hit;
  const links = PUBLIC_NAV.map(({ id, label, href }) => ({ id, label, href }));
  configLru.set('public-nav', links);
  return links;
}

export function rememberBlogCategories(categories: string[]) {
  configLru.set('blog-categories', categories);
}

export function readBlogCategories(): string[] | undefined {
  return configLru.get('blog-categories') as string[] | undefined;
}

export function clearConfigMemory() {
  configLru.del('blog-categories');
  configLru.del('public-nav');
}

export async function invalidateArticles(): Promise<void> {
  clearConfigMemory();
  await redisDeleteByPrefix('cm:articles:');
  await redisDeleteByPrefix('cm:public:');
}

export async function invalidateModules(): Promise<void> {
  await redisDeleteByPrefix('cm:modules:');
}
