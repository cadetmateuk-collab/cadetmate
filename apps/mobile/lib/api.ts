import { apiRequest, getAccessToken, getWebBase } from './offline/APIClient';

export { getAccessToken, getWebBase };

export async function webApi<T = Record<string, unknown>>(
  path: string,
  options: Omit<RequestInit, 'body' | 'signal'> & { body?: unknown; timeoutMs?: number } = {},
): Promise<T> {
  return apiRequest<T>(path, options);
}
