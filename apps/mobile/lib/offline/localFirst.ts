import type { ContentKind } from '@cadet-mate/shared';
import { ConnectivityManager } from './ConnectivityManager';
import { CourseStore, type InstalledRow } from './CourseStore';
import { isOfflineModeError } from './errors';
import { loadLocalContent } from './loadLocalContent';

export async function listInstalledOfKind(kind: ContentKind): Promise<InstalledRow[]> {
  return (await CourseStore.list()).filter((row) => row.kind === kind);
}

export async function loadInstalledPayloads<T>(kind: ContentKind): Promise<T[]> {
  const rows = await listInstalledOfKind(kind);
  const out: T[] = [];
  for (const row of rows) {
    const payload = await loadLocalContent<T>(kind, row.id);
    if (payload) out.push(payload);
  }
  return out;
}

export async function withNetworkFallback<T>(offlineValue: () => Promise<T>, onlineValue: () => Promise<T>): Promise<T> {
  await ConnectivityManager.hydrate();
  if (!ConnectivityManager.canUseNetwork()) return offlineValue();
  try {
    return await onlineValue();
  } catch (err) {
    if (isOfflineModeError(err)) return offlineValue();
    throw err;
  }
}
