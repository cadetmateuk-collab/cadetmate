import * as FileSystem from 'expo-file-system/legacy';
import type { ContentKind, ContentManifest } from '@cadet-mate/shared';
import { shouldDownloadAsset } from '@cadet-mate/shared';
import { apiRequest } from './APIClient';
import { ConnectivityManager } from './ConnectivityManager';
import { courseDir, CourseStore } from './CourseStore';
import { bytesToBase64, writeSealedJson } from './contentCrypto';
import { OfflineModeError } from './errors';
import { gatedFetch } from './gatedFetch';
import { LicenceManager } from './LicenceManager';

type ContentResponse = {
  manifest: ContentManifest;
  payload: unknown;
};

const ASSET_TIMEOUT_MS = 8_000;
const PACKAGE_TIMEOUT_MS = 25_000;
const MAX_ASSET_BYTES = 1_500_000;

function yieldUi() {
  return new Promise<void>((resolve) => setTimeout(resolve, 16));
}

async function fetchAssetBytes(url: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ASSET_TIMEOUT_MS);
  try {
    const res = await gatedFetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_ASSET_BYTES) throw new Error('Asset too large');
    return new Uint8Array(buffer);
  } finally {
    clearTimeout(timer);
  }
}

async function writePlainFile(dest: string, plain: Uint8Array) {
  await FileSystem.makeDirectoryAsync(dest.replace(/\/[^/]+$/, '/'), { intermediates: true });
  await FileSystem.writeAsStringAsync(dest, bytesToBase64(plain), {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export const CourseDownloadManager = {
  async download(kind: ContentKind, id: string, onProgress?: (done: number, total: number) => void, expectedVersion?: number) {
    if (!ConnectivityManager.canUseNetwork()) throw new OfflineModeError();
    const existing = await CourseStore.get(kind, id);
    if (existing && expectedVersion != null && Number(existing.version) === Number(expectedVersion)) {
      onProgress?.(1, 1);
      return null;
    }

    const licence = await LicenceManager.read();
    if (licence?.clockTampered) {
      throw new Error('Device clock appears to have been changed. Reconnect to refresh your licence before downloading.');
    }

    const pack = await apiRequest<ContentResponse>(`/api/mobile/content/${kind}/${encodeURIComponent(id)}`, {
      timeoutMs: PACKAGE_TIMEOUT_MS,
    });
    const entitlements = licence?.claims.entitlements ?? [];
    const entitled = entitlements.includes('premium');
    const allowed =
      pack.manifest.kind === 'article' ||
      pack.manifest.kind === 'quiz_bank' ||
      (pack.manifest.kind === 'flashcard_pack' && entitlements.includes(`pack:${pack.manifest.id}`)) ||
      ((pack.manifest.kind === 'module' ||
        pack.manifest.kind === 'survival' ||
        pack.manifest.kind === 'trb') &&
        entitled &&
        !(licence && LicenceManager.isExpired(licence.claims, licence.clockTampered)));
    if (!allowed) {
      throw new Error('This content is not included in your offline library. Reconnect after renewing on the website.');
    }

    const dir = courseDir(pack.manifest.kind, pack.manifest.id, pack.manifest.version);
    if (existing && Number(existing.version) === pack.manifest.version) {
      onProgress?.(1, 1);
      return pack.manifest;
    }
    await FileSystem.makeDirectoryAsync(`${dir}images`, { intermediates: true });

    const files = pack.manifest.files.filter(
      (file) => file.sourceUrl === 'inline' || shouldDownloadAsset(file.sourceUrl),
    );
    const storedManifest: ContentManifest = { ...pack.manifest, files };
    await writeSealedJson(`${dir}manifest.json`, storedManifest);
    await writeSealedJson(`${dir}course.json`, pack.payload);
    await yieldUi();

    const remoteFiles = files.filter((file) => file.sourceUrl !== 'inline');
    let done = 0;
    const total = remoteFiles.reduce((sum, file) => sum + file.bytes, 0) || 1;
    onProgress?.(0, total);
    for (const file of remoteFiles) {
      try {
        const dest = `${dir}${file.path}`;
        if (file.sourceUrl.startsWith('http')) {
          await writePlainFile(dest, await fetchAssetBytes(file.sourceUrl));
        }
      } catch {
        /* A missing or slow image must not block the rest of the library. */
      }
      done += file.bytes;
      onProgress?.(done, total);
    }
    await CourseStore.saveInstall(storedManifest);
    return storedManifest;
  },
};
