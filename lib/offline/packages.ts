import { createHash } from 'crypto';
import { shouldDownloadAsset, type CatalogItem, type ContentKind, type ContentManifest, type ManifestFile } from '@cadet-mate/shared';

const IMAGE_SIZE_FALLBACK = 100_000;

type Blockish = {
  type?: string;
  content?: Record<string, unknown> | null;
};

export function contentVersionFromUpdatedAt(updatedAt: string | null | undefined, id: string): number {
  if (!updatedAt) return 1;
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return 1;
  return Math.max(1, Math.floor(t / 1000));
}

export function extractHttpUrls(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) into.add(value);
    return into;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractHttpUrls(item, into);
    return into;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) extractHttpUrls(nested, into);
  }
  return into;
}

export function moduleHasVideo(row: Record<string, unknown>): boolean {
  const blocks = collectBlocks(row);
  return blocks.some((block) => block.type === 'video');
}

function collectBlocks(row: Record<string, unknown>): Blockish[] {
  const pages = (row.pages as { blocks?: Blockish[] }[] | null) ?? (row.content as { pages?: { blocks?: Blockish[] }[] } | null)?.pages;
  if (Array.isArray(pages)) {
    return pages.flatMap((page) => page.blocks ?? []);
  }
  const blocks =
    (row.blocks as Blockish[] | null) ??
    (row.content as { blocks?: Blockish[] } | null)?.blocks ??
    [];
  return Array.isArray(blocks) ? blocks : [];
}

export function fileNameForUrl(url: string, index: number): string {
  try {
    const parsed = new URL(url);
    const base = parsed.pathname.split('/').filter(Boolean).pop() || `asset-${index}`;
    return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  } catch {
    return `asset-${index}`;
  }
}

export async function buildManifest(opts: {
  kind: ContentKind;
  id: string;
  slug: string;
  title: string;
  isPremium: boolean;
  version: number;
  payload: unknown;
  extraUrls?: string[];
}): Promise<ContentManifest> {
  const urls = collectAssetUrls(opts);
  const payloadJson = JSON.stringify(opts.payload);
  const payloadBytes = Buffer.byteLength(payloadJson, 'utf8');
  const files: ManifestFile[] = [
    {
      path: 'course.json',
      sourceUrl: 'inline',
      bytes: payloadBytes,
      sha256: createHash('sha256').update(payloadJson).digest('hex'),
    },
  ];

  let index = 0;
  for (const url of urls) {
    const name = fileNameForUrl(url, index);
    files.push({
      path: `images/${index}-${name}`,
      sourceUrl: url,
      bytes: IMAGE_SIZE_FALLBACK,
      sha256: null,
    });
    index += 1;
  }

  const bytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const skippedVideo =
    opts.kind === 'module' && typeof opts.payload === 'object' && opts.payload
      ? moduleHasVideo(opts.payload as Record<string, unknown>)
      : false;

  return {
    kind: opts.kind,
    id: opts.id,
    slug: opts.slug,
    title: opts.title,
    version: opts.version,
    bytes,
    bytesEstimated: urls.size > 0,
    isPremium: opts.isPremium,
    skippedVideo,
    files,
  };
}

export function estimateCatalogItem(opts: {
  kind: ContentKind;
  id: string;
  slug: string;
  title: string;
  isPremium: boolean;
  version: number;
  payload?: unknown;
  extraUrls?: string[];
  extraBytes?: number;
}): CatalogItem {
  const urls = collectAssetUrls(opts);
  const payloadBytes = opts.payload ? Buffer.byteLength(JSON.stringify(opts.payload), 'utf8') : 0;
  const bytes = payloadBytes + (opts.extraBytes ?? 0) + urls.size * IMAGE_SIZE_FALLBACK;
  return {
    kind: opts.kind,
    id: opts.id,
    slug: opts.slug,
    title: opts.title,
    version: opts.version,
    bytes,
    bytesEstimated: true,
    isPremium: opts.isPremium,
    skippedVideo:
      opts.kind === 'module' && opts.payload && typeof opts.payload === 'object'
        ? moduleHasVideo(opts.payload as Record<string, unknown>)
        : false,
  };
}

function collectAssetUrls(opts: { kind: ContentKind; payload?: unknown; extraUrls?: string[] }) {
  const urls = new Set<string>();
  if (opts.kind === 'module' && opts.payload && typeof opts.payload === 'object') {
    for (const block of collectBlocks(opts.payload as Record<string, unknown>)) {
      if (block.type === 'video') continue;
      extractHttpUrls(block.content, urls);
    }
  } else if (opts.payload) {
    extractHttpUrls(opts.payload, urls);
  }
  for (const extra of opts.extraUrls ?? []) {
    if (extra) urls.add(extra);
  }
  return new Set([...urls].filter(shouldDownloadAsset));
}

export function catalogFromManifest(manifest: ContentManifest): CatalogItem {
  return {
    kind: manifest.kind,
    id: manifest.id,
    slug: manifest.slug,
    title: manifest.title,
    version: manifest.version,
    bytes: manifest.bytes,
    bytesEstimated: manifest.bytesEstimated,
    isPremium: manifest.isPremium,
    skippedVideo: manifest.skippedVideo,
  };
}
