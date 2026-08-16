import { ConnectivityManager } from './ConnectivityManager';

/** Remote images must not load while Offline Mode is on. */
export function resolveMediaUri(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('file://') || url.startsWith('content://') || url.startsWith('data:')) return url;
  if (/^https?:\/\//i.test(url)) {
    return ConnectivityManager.canUseNetwork() ? url : null;
  }
  return null;
}
