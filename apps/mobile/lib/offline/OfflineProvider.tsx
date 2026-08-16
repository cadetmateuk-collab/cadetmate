import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as Network from 'expo-network';
import type { SessionCheckResponse } from '@cadet-mate/shared';
import { ConnectivityManager } from './ConnectivityManager';
import { LicenceManager } from './LicenceManager';
import { CourseStore } from './CourseStore';
import { ProgressStore } from './ProgressStore';
import { apiRequest } from './APIClient';
import { kvGet, kvSet } from './db';

type OfflineContextValue = {
  ready: boolean;
  offlineMode: boolean;
  canUseNetwork: boolean;
  deviceHasInternet: boolean;
  lastConnectedAt: string | null;
  licenceUntil: string | null;
  licenceExpired: boolean;
  downloadedCount: number;
  lastCheck: SessionCheckResponse | null;
  setOfflineMode: (on: boolean) => Promise<void>;
  runSessionCheck: () => Promise<SessionCheckResponse>;
  refreshMeta: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [offlineMode, setMode] = useState(false);
  const [deviceHasInternet, setDeviceHasInternet] = useState(false);
  const [lastConnectedAt, setLastConnectedAt] = useState<string | null>(null);
  const [licenceUntil, setLicenceUntil] = useState<string | null>(null);
  const [licenceExpired, setLicenceExpired] = useState(false);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [lastCheck, setLastCheck] = useState<SessionCheckResponse | null>(null);

  const refreshMeta = useCallback(async () => {
    await ConnectivityManager.hydrate();
    setMode(ConnectivityManager.isOfflineMode());
    setLastConnectedAt(await ConnectivityManager.lastConnectedAt());
    try {
      const licence = await LicenceManager.read();
      if (licence) {
        setLicenceUntil(new Date(licence.claims.exp * 1000).toISOString());
        setLicenceExpired(LicenceManager.isExpired(licence.claims, licence.clockTampered));
      } else {
        setLicenceUntil(null);
        setLicenceExpired(false);
      }
    } catch {
      setLicenceUntil(null);
      setLicenceExpired(false);
    }
    try {
      const installed = await CourseStore.list();
      setDownloadedCount(installed.length);
    } catch {
      setDownloadedCount(0);
    }
    try {
      const cached = await kvGet('lastSessionCheck');
      if (cached) {
        setLastCheck(JSON.parse(cached) as SessionCheckResponse);
      }
    } catch {
      /* ignore */
    }
    try {
      const net = await Network.getNetworkStateAsync();
      setDeviceHasInternet(Boolean(net.isConnected && net.isInternetReachable !== false));
    } catch {
      setDeviceHasInternet(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await ConnectivityManager.hydrate();
        await refreshMeta();
      } catch {
        /* Login must still work if SQLite/network probes fail. */
      } finally {
        setReady(true);
      }
    })();
    return ConnectivityManager.subscribe(() => {
      void refreshMeta();
    });
  }, [refreshMeta]);

  const runSessionCheck = useCallback(async () => {
    const installed = (await CourseStore.list()).map((row) => ({
      kind: row.kind,
      id: row.id,
      slug: row.slug,
      version: Number(row.version),
    }));
    const pendingProgressRows = await ProgressStore.unsyncedCount();
    const result = await apiRequest<SessionCheckResponse>('/api/mobile/session-check', {
      method: 'POST',
      body: { installed, pendingProgressRows },
    });
    if (result.licence?.token) {
      await LicenceManager.save(result.licence.token);
    }
    await ConnectivityManager.markConnected();
    await kvSet('lastSessionCheck', JSON.stringify(result));
    setLastCheck(result);
    await refreshMeta();
    return result;
  }, [refreshMeta]);

  const value = useMemo<OfflineContextValue>(
    () => ({
      ready,
      offlineMode,
      canUseNetwork: !offlineMode,
      deviceHasInternet,
      lastConnectedAt,
      licenceUntil,
      licenceExpired,
      downloadedCount,
      lastCheck,
      async setOfflineMode(on: boolean) {
        await ConnectivityManager.setOfflineMode(on);
        await refreshMeta();
      },
      runSessionCheck,
      refreshMeta,
    }),
    [
      ready,
      offlineMode,
      deviceHasInternet,
      lastConnectedAt,
      licenceUntil,
      licenceExpired,
      downloadedCount,
      lastCheck,
      refreshMeta,
      runSessionCheck,
    ],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
}
