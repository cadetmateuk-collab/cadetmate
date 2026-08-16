import * as SecureStore from 'expo-secure-store';

const CHUNK = 1800;
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

let chain: Promise<void> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = chain.then(work, work);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** Chunked Keychain adapter — Supabase sessions can exceed SecureStore's 2KB limit. */
export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return enqueue(async () => {
      const countRaw = await SecureStore.getItemAsync(`${key}.n`, OPTIONS);
      if (!countRaw) return SecureStore.getItemAsync(key, OPTIONS);
      const count = Number(countRaw);
      if (!Number.isFinite(count) || count < 1) return null;
      const parts = await Promise.all(
        Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`, OPTIONS)),
      );
      if (parts.some((part) => part == null)) return null;
      return parts.join('');
    });
  },
  async setItem(key: string, value: string): Promise<void> {
    return enqueue(async () => {
      const previous = Number((await SecureStore.getItemAsync(`${key}.n`, OPTIONS)) ?? '0');
      const chunks = Math.max(1, Math.ceil(value.length / CHUNK));
      for (let i = 0; i < chunks; i++) {
        await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK), OPTIONS);
      }
      await SecureStore.setItemAsync(`${key}.n`, String(chunks), OPTIONS);
      await SecureStore.deleteItemAsync(key, OPTIONS).catch(() => undefined);
      for (let i = chunks; i < previous; i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`, OPTIONS).catch(() => undefined);
      }
    });
  },
  async removeItem(key: string): Promise<void> {
    return enqueue(async () => {
      const countRaw = await SecureStore.getItemAsync(`${key}.n`, OPTIONS);
      const count = Number(countRaw) || 0;
      await SecureStore.deleteItemAsync(`${key}.n`, OPTIONS).catch(() => undefined);
      await SecureStore.deleteItemAsync(key, OPTIONS).catch(() => undefined);
      for (let i = 0; i < Math.max(count, 8); i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`, OPTIONS).catch(() => undefined);
      }
    });
  },
};
