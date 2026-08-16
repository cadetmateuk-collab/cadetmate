import type { ContentKind, ContentManifest } from '@cadet-mate/shared';
import { courseDir } from './CourseStore';
import { bytesToBase64, mimeForPath, readSealedFile, readSealedJson } from './contentCrypto';

export async function rewritePayloadMedia<T>(kind: ContentKind, id: string, version: number, payload: T): Promise<T> {
  const manifest = await readSealedJson<ContentManifest>(`${courseDir(kind, id, version)}manifest.json`);
  if (!manifest) return payload;
  const map = new Map<string, string>();
  for (const file of manifest.files) {
    if (file.sourceUrl === 'inline') continue;
    const bytes = await readSealedFile(`${courseDir(kind, id, version)}${file.path}`);
    if (!bytes) continue;
    map.set(file.sourceUrl, `data:${mimeForPath(file.path)};base64,${bytesToBase64(bytes)}`);
  }
  return replaceUrls(payload, map);
}

function replaceUrls<T>(value: T, map: Map<string, string>): T {
  if (typeof value === 'string') {
    return (map.get(value) ?? value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceUrls(item, map)) as T;
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      next[key] = replaceUrls(nested, map);
    }
    return next as T;
  }
  return value;
}
