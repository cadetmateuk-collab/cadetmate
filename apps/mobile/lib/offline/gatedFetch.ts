import { ConnectivityManager } from './ConnectivityManager';
import { OfflineModeError } from './errors';

export async function gatedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  await ConnectivityManager.hydrate();
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const isRemote = /^https?:\/\//i.test(url);
  if (isRemote && !ConnectivityManager.canUseNetwork()) {
    throw new OfflineModeError();
  }
  return fetch(input, init);
}
