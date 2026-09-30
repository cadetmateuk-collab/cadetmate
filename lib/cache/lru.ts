type Entry<T> = { value: T; expiresAt: number };

/** Process-local LRU with a TTL. Used for tiny config lookups so they skip Redis. */
export function createLru<T>(maxEntries: number, ttlMs: number) {
  const map = new Map<string, Entry<T>>();

  function get(key: string): T | undefined {
    const hit = map.get(key);
    if (!hit) return undefined;
    if (Date.now() >= hit.expiresAt) {
      map.delete(key);
      return undefined;
    }
    map.delete(key);
    map.set(key, hit);
    return hit.value;
  }

  function set(key: string, value: T) {
    if (map.has(key)) map.delete(key);
    map.set(key, { value, expiresAt: Date.now() + ttlMs });
    while (map.size > maxEntries) {
      const oldest = map.keys().next().value;
      if (oldest === undefined) break;
      map.delete(oldest);
    }
  }

  function del(key: string) {
    map.delete(key);
  }

  return { get, set, del };
}
