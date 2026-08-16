import { SignJWT, importPKCS8, jwtVerify, importSPKI, type JWTPayload } from 'jose';
import { randomUUID } from 'crypto';
import { getOfflineLicencePrivateKey, getOfflineLicencePublicKey } from '@/lib/security/env';
import type { OfflineLicenceClaims } from '@cadet-mate/shared';

const ALG = 'ES256';
const ISSUER = 'cadetmate-offline';
const FOURTEEN_DAYS_SEC = 14 * 24 * 60 * 60;
const PERIOD_GRACE_SEC = 2 * 24 * 60 * 60;

let privateKeyPromise: Promise<CryptoKey> | null = null;
let publicKeyPromise: Promise<CryptoKey> | null = null;

function privateKey() {
  privateKeyPromise ??= importPKCS8(getOfflineLicencePrivateKey(), ALG);
  return privateKeyPromise;
}

function publicKey() {
  publicKeyPromise ??= importSPKI(getOfflineLicencePublicKey(), ALG);
  return publicKeyPromise;
}

export function computeOfflineUntil(opts: {
  now: Date;
  stripePeriodEnd: Date | null;
}): Date {
  const fromNow = new Date(opts.now.getTime() + FOURTEEN_DAYS_SEC * 1000);
  if (!opts.stripePeriodEnd) return fromNow;
  const capped = new Date(opts.stripePeriodEnd.getTime() + PERIOD_GRACE_SEC * 1000);
  return fromNow < capped ? fromNow : capped;
}

export async function signOfflineLicence(opts: {
  userId: string;
  subscriptionId: string | null;
  entitlements: string[];
  offlineUntil: Date;
  now?: Date;
}): Promise<{ token: string; claims: OfflineLicenceClaims }> {
  const now = opts.now ?? new Date();
  const iat = Math.floor(now.getTime() / 1000);
  const exp = Math.floor(opts.offlineUntil.getTime() / 1000);
  const jti = randomUUID();
  const key = await privateKey();
  const token = await new SignJWT({
    subscriptionId: opts.subscriptionId,
    entitlements: opts.entitlements,
  })
    .setProtectedHeader({ alg: ALG, kid: 'offline-v1' })
    .setSubject(opts.userId)
    .setIssuer(ISSUER)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setJti(jti)
    .sign(key);

  return {
    token,
    claims: {
      sub: opts.userId,
      subscriptionId: opts.subscriptionId,
      entitlements: opts.entitlements,
      iat,
      exp,
      jti,
    },
  };
}

export async function verifyOfflineLicence(token: string): Promise<OfflineLicenceClaims> {
  const key = await publicKey();
  const { payload } = await jwtVerify(token, key, { issuer: ISSUER, algorithms: [ALG] });
  return claimsFromPayload(payload);
}

function claimsFromPayload(payload: JWTPayload): OfflineLicenceClaims {
  if (!payload.sub || typeof payload.iat !== 'number' || typeof payload.exp !== 'number' || typeof payload.jti !== 'string') {
    throw new Error('Invalid offline licence');
  }
  const entitlements = Array.isArray(payload.entitlements)
    ? payload.entitlements.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    sub: payload.sub,
    subscriptionId: typeof payload.subscriptionId === 'string' ? payload.subscriptionId : null,
    entitlements,
    iat: payload.iat,
    exp: payload.exp,
    jti: payload.jti,
  };
}
