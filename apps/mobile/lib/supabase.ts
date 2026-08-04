import { createCadetMateClient, type CadetMateSupabase } from '@cadet-mate/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: CadetMateSupabase | null = null;

export function getSupabase(): CadetMateSupabase {
  if (!client) {
    if (!url || !anonKey) {
      throw new Error(
        'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy apps/mobile/.env.example to .env',
      );
    }
    client = createCadetMateClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

/** Convenience proxy used by screens — initializes on first property access after env is present. */
export const supabase = new Proxy({} as CadetMateSupabase, {
  get(_target, prop, receiver) {
    const real = getSupabase();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
