import type { ContentKind } from '@cadet-mate/shared';
import { CourseStore } from './CourseStore';
import { rewritePayloadMedia } from './rewriteMedia';

export async function loadLocalContent<T>(kind: ContentKind, idOrSlug: string): Promise<T | null> {
  const installed = await CourseStore.get(kind, idOrSlug);
  if (!installed) return null;
  const payload = await CourseStore.readJson<T>(kind, installed.id);
  if (!payload) return null;
  return rewritePayloadMedia(kind, installed.id, installed.version, payload);
}
