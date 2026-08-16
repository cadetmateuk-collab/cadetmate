import type { OfflineLicenceClaims } from '@cadet-mate/shared';
import { decodeJwtPayload } from './decodeJwt';
import { secureStorage } from './secureStorage';

const TOKEN_KEY = 'cm.offlineLicence';
const CLAIMS_KEY = 'cm.offlineLicenceClaims';
const DEVICE_TIME_KEY = 'cm.licenceDeviceTime';

function claimsFromToken(token: string): OfflineLicenceClaims {
  const payload = decodeJwtPayload(token);
  const entitlements = Array.isArray(payload.entitlements)
    ? payload.entitlements.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    sub: String(payload.sub ?? ''),
    subscriptionId: typeof payload.subscriptionId === 'string' ? payload.subscriptionId : null,
    entitlements,
    iat: Number(payload.iat) || 0,
    exp: Number(payload.exp) || 0,
    jti: String(payload.jti ?? ''),
  };
}

export const LicenceManager = {
  async save(token: string, claims?: OfflineLicenceClaims) {
    const next = claims ?? claimsFromToken(token);
    await secureStorage.setItem(TOKEN_KEY, token);
    await secureStorage.setItem(CLAIMS_KEY, JSON.stringify(next));
    await secureStorage.setItem(DEVICE_TIME_KEY, String(Date.now()));
  },

  async clear() {
    await secureStorage.removeItem(TOKEN_KEY);
    await secureStorage.removeItem(CLAIMS_KEY);
    await secureStorage.removeItem(DEVICE_TIME_KEY);
  },

  async read(): Promise<{ token: string; claims: OfflineLicenceClaims; clockTampered: boolean } | null> {
    const token = await secureStorage.getItem(TOKEN_KEY);
    const raw = await secureStorage.getItem(CLAIMS_KEY);
    if (!token || !raw) return null;
    try {
      const claims = JSON.parse(raw) as OfflineLicenceClaims;
      const issuedDevice = Number((await secureStorage.getItem(DEVICE_TIME_KEY)) ?? '0');
      const clockTampered = issuedDevice > 0 && Date.now() + 5 * 60 * 1000 < issuedDevice;
      return { token, claims, clockTampered };
    } catch {
      return null;
    }
  },

  async entitlements(): Promise<string[]> {
    const licence = await this.read();
    return licence?.claims.entitlements ?? [];
  },

  async hasPremium(): Promise<boolean> {
    const entitlements = await this.entitlements();
    return entitlements.includes('premium');
  },

  isExpired(claims: OfflineLicenceClaims, clockTampered = false) {
    if (clockTampered) return true;
    return Date.now() / 1000 > claims.exp;
  },
};
