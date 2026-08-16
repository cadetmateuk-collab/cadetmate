import * as FileSystem from 'expo-file-system/legacy';
import type { ContentKind, ContentManifest } from '@cadet-mate/shared';
import { getDb } from './db';
import { readSealedJson } from './contentCrypto';

export type InstalledRow = {
  kind: ContentKind;
  id: string;
  slug: string;
  title: string;
  version: number;
  bytes: number;
  is_premium: number;
  last_updated: string;
};

function rootDir() {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('No document directory');
  return `${base}courses/`;
}

export function courseDir(kind: ContentKind, id: string, version: number) {
  return `${rootDir()}${kind}/${id}/v${version}/`;
}

export const CourseStore = {
  async list(): Promise<InstalledRow[]> {
    const db = await getDb();
    return db.getAllAsync<InstalledRow>('SELECT * FROM installed_content ORDER BY title');
  },

  async get(kind: ContentKind, idOrSlug: string): Promise<InstalledRow | null> {
    const db = await getDb();
    return (
      (await db.getFirstAsync<InstalledRow>(
        'SELECT * FROM installed_content WHERE kind = ? AND (id = ? OR slug = ?)',
        [kind, idOrSlug, idOrSlug],
      )) ?? null
    );
  },

  async readJson<T>(kind: ContentKind, idOrSlug: string): Promise<T | null> {
    const installed = await this.get(kind, idOrSlug);
    if (!installed) return null;
    const path = `${courseDir(installed.kind, installed.id, installed.version)}course.json`;
    return readSealedJson<T>(path);
  },

  async localUri(kind: ContentKind, id: string, version: number, relativePath: string): Promise<string> {
    return `${courseDir(kind, id, version)}${relativePath}`;
  },

  async saveInstall(manifest: ContentManifest) {
    const previous = await this.get(manifest.kind, manifest.id);
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO installed_content (kind, id, slug, title, version, bytes, is_premium, last_updated)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        manifest.kind,
        manifest.id,
        manifest.slug,
        manifest.title,
        manifest.version,
        manifest.bytes,
        manifest.isPremium ? 1 : 0,
        new Date().toISOString(),
      ],
    );
    if (previous && Number(previous.version) !== Number(manifest.version)) {
      await FileSystem.deleteAsync(courseDir(previous.kind, previous.id, previous.version), { idempotent: true });
    }
  },

  async remove(kind: ContentKind, id: string) {
    const installed = await this.get(kind, id);
    const db = await getDb();
    await db.runAsync('DELETE FROM installed_content WHERE kind = ? AND id = ?', [kind, id]);
    if (installed) {
      await FileSystem.deleteAsync(courseDir(kind, id, installed.version), { idempotent: true });
    }
  },
};
