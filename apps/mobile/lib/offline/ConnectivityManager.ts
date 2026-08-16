import { secureStorage } from './secureStorage';

const OFFLINE_KEY = 'cm.offlineMode';
const LAST_CONNECTED_KEY = 'cm.lastConnectedAt';

type Listener = () => void;

let offlineMode = false;
let loaded = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export const ConnectivityManager = {
  async hydrate() {
    if (loaded) return;
    const stored = await secureStorage.getItem(OFFLINE_KEY);
    offlineMode = stored === '1';
    loaded = true;
    await this.applyAuthRefresh();
  },

  isOfflineMode() {
    return offlineMode;
  },

  canUseNetwork() {
    return !offlineMode;
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  async setOfflineMode(next: boolean) {
    await this.hydrate();
    offlineMode = next;
    await secureStorage.setItem(OFFLINE_KEY, next ? '1' : '0');
    if (!next) await this.markConnected();
    await this.applyAuthRefresh();
    emit();
  },

  async markConnected() {
    await secureStorage.setItem(LAST_CONNECTED_KEY, new Date().toISOString());
  },

  async lastConnectedAt(): Promise<string | null> {
    return secureStorage.getItem(LAST_CONNECTED_KEY);
  },

  async applyAuthRefresh() {
    try {
      const { getSupabase } = await import('../supabase');
      const client = getSupabase();
      if (offlineMode) client.auth.stopAutoRefresh();
      else client.auth.startAutoRefresh();
    } catch {
      /* client may not be ready during first import */
    }
  },
};
