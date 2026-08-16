import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SITE_URL } from '@cadet-mate/shared/config';
import { ConnectivityManager } from './ConnectivityManager';
import { OfflineModeError } from './errors';
import { gatedFetch } from './gatedFetch';
import { LicenceManager } from './LicenceManager';
import { getSupabase } from '../supabase';

function hostnameOf(url: string): string | null {
  try {
    return new URL(url.includes('://') ? url : `http://${url}`).hostname;
  } catch {
    return null;
  }
}

function isLiveSite(url: string): boolean {
  const host = hostnameOf(url);
  return host === 'cadetmate.co.uk' || host === 'www.cadetmate.co.uk';
}

function isLoopback(url: string): boolean {
  const host = hostnameOf(url);
  return host === 'localhost' || host === '127.0.0.1';
}

function loopbackOrigin(): string {
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

/** Metro's machine, used so a phone/emulator can reach local Next.js on port 3000. */
function metroLanOrigin(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0]?.trim();
  if (!host) return null;
  if (
    host.endsWith('.exp.direct') ||
    host.endsWith('.exp.host') ||
    host.endsWith('.expo.dev') ||
    host.includes('ngrok')
  ) {
    return null;
  }
  if (host === 'localhost' || host === '127.0.0.1') return loopbackOrigin();
  return `http://${host}:3000`;
}

export function getWebBase(): string {
  const configured = (process.env.EXPO_PUBLIC_WEB_URL ?? '').trim().replace(/\/$/, '');
  if (__DEV__) {
    // Live site does not have unpublished /api/mobile routes. Loopback in .env
    // is rewritten so a phone/emulator still reaches this machine.
    if (configured && !isLiveSite(configured) && !isLoopback(configured)) return configured;
    return metroLanOrigin() ?? loopbackOrigin();
  }
  return configured && !isLiveSite(configured) ? configured : SITE_URL;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiRequest<T = Record<string, unknown>>(
  path: string,
  options: Omit<RequestInit, 'body' | 'signal'> & { body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  if (!ConnectivityManager.canUseNetwork()) throw new OfflineModeError();
  const token = await getAccessToken();
  const { timeoutMs = 25_000, body, headers: headerInit, ...rest } = options;
  const headers = new Headers(headerInit);
  headers.set('Accept', 'application/json');
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const licence = await LicenceManager.read();
  if (licence?.token) headers.set('X-Offline-Licence', licence.token);

  const base = getWebBase();
  if (hostnameOf(base)?.includes('ngrok')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await gatedFetch(`${base}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          `Could not find ${path} on ${base}. Start the website with npm run dev, then restart Expo.`,
        );
      }
      throw new Error(data.error ?? `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Connection timed out. Check the ship internet and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
