import type { Href } from 'expo-router';

/** Typed-routes lag behind file moves; keep a single cast. */
export function href(path: string): Href {
  return path as Href;
}

export function moduleHref(id: string, section?: number): Href {
  return {
    pathname: '/(tabs)/learn/modules/[id]',
    params: section != null ? { id, section: String(section) } : { id },
  } as Href;
}

export function articleHref(slug: string): Href {
  return {
    pathname: '/(tabs)/learn/articles/[slug]',
    params: { slug },
  } as Href;
}

export function connectHref(intent: 'offline' | 'online' | 'check' = 'online'): Href {
  return {
    pathname: '/(tabs)/profile/connect',
    params: { intent },
  } as Href;
}
