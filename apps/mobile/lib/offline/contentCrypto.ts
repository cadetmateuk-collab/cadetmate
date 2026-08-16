import nacl from 'tweetnacl';
import * as FileSystem from 'expo-file-system/legacy';
import { secureStorage } from './secureStorage';

const KEY_ID = 'cm.contentEncKey';
const MAGIC = new Uint8Array([0x43, 0x4d, 0x45, 0x31]);

let prngReady = false;
let keyPromise: Promise<Uint8Array> | null = null;

function ensurePrng() {
  if (prngReady) return;
  nacl.setPRNG((buffer) => {
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(buffer);
      return;
    }
    for (let i = 0; i < buffer.length; i++) buffer[i] = Math.floor(Math.random() * 256);
  });
  prngReady = true;
}

export function bytesToBase64(buffer: Uint8Array): string {
  const chunk = 0x2000;
  let binary = '';
  for (let i = 0; i < buffer.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(buffer.subarray(i, i + chunk)));
  }
  return globalThis.btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export async function getContentKey(): Promise<Uint8Array> {
  if (!keyPromise) {
    keyPromise = (async () => {
      ensurePrng();
      const existing = await secureStorage.getItem(KEY_ID);
      if (existing) return base64ToBytes(existing);
      const key = nacl.randomBytes(nacl.secretbox.keyLength);
      await secureStorage.setItem(KEY_ID, bytesToBase64(key));
      return key;
    })();
  }
  return keyPromise;
}

export function encryptBytes(plain: Uint8Array, key: Uint8Array): Uint8Array {
  ensurePrng();
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const boxed = nacl.secretbox(plain, nonce, key);
  const out = new Uint8Array(MAGIC.length + nonce.length + boxed.length);
  out.set(MAGIC, 0);
  out.set(nonce, MAGIC.length);
  out.set(boxed, MAGIC.length + nonce.length);
  return out;
}

export function decryptBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  if (data.length < MAGIC.length + nacl.secretbox.nonceLength + nacl.secretbox.overheadLength) {
    return data;
  }
  for (let i = 0; i < MAGIC.length; i++) {
    if (data[i] !== MAGIC[i]) return data;
  }
  const nonce = data.slice(MAGIC.length, MAGIC.length + nacl.secretbox.nonceLength);
  const boxed = data.slice(MAGIC.length + nacl.secretbox.nonceLength);
  const plain = nacl.secretbox.open(boxed, nonce, key);
  if (!plain) throw new Error('Offline content could not be decrypted on this device.');
  return plain;
}

export async function encryptBuffer(plain: Uint8Array): Promise<Uint8Array> {
  return encryptBytes(plain, await getContentKey());
}

export async function decryptBuffer(data: Uint8Array): Promise<Uint8Array> {
  return decryptBytes(data, await getContentKey());
}

export async function readSealedFile(path: string): Promise<Uint8Array | null> {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  const b64 = await FileSystem.readAsStringAsync(path, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decryptBuffer(base64ToBytes(b64));
}

export async function readSealedJson<T>(path: string): Promise<T | null> {
  const bytes = await readSealedFile(path);
  if (!bytes) return null;
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

export async function writeSealedFile(path: string, plain: Uint8Array): Promise<void> {
  const sealed = await encryptBuffer(plain);
  await FileSystem.makeDirectoryAsync(path.replace(/\/[^/]+$/, '/'), { intermediates: true });
  await FileSystem.writeAsStringAsync(path, bytesToBase64(sealed), {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export async function writeSealedJson(path: string, value: unknown): Promise<void> {
  await writeSealedFile(path, new TextEncoder().encode(JSON.stringify(value)));
}

export function mimeForPath(path: string): string {
  const lower = path.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.avif')) return 'image/avif';
  return 'image/jpeg';
}
