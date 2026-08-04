import type { MetadataRoute } from 'next';
import { createPublicSupabase } from '@/lib/supabase/public';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { absoluteUrl, SITE_URL } from '@/lib/seo/site';

export const revalidate = 3600;

/**
 * Only publicly crawlable, indexable routes.
 * Auth-gated app routes are excluded (see robots.ts).
 */
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
}[] = [
  { path: '/home', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/free-content', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/resources', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/community-preview', priority: 0.75, changeFrequency: 'daily' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/partners', priority: 0.3, changeFrequency: 'yearly' },
];

function safeDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(
    ({ path, priority, changeFrequency }) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency,
      priority,
    }),
  );

  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = createPublicSupabase();
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug, category, category_slug, date, updated_at, image, title')
      .eq('hidden', false)
      .not('slug', 'is', null);

    if (error) {
      console.error('[sitemap] blog_posts query failed:', error.message);
    } else {
      blogEntries = (posts ?? [])
        .filter((post) => typeof post.slug === 'string' && post.slug.length > 0)
        .map((post) => {
          const url = absoluteUrl(buildBlogPostPath(post));
          const lastModified = safeDate(
            post.updated_at ?? post.date,
            now,
          );
          const images =
            typeof post.image === 'string' && post.image.startsWith('http')
              ? [post.image]
              : undefined;

          return {
            url,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
            ...(images ? { images } : {}),
          };
        });
    }
  } catch (err) {
    // Never 500 the sitemap — static URLs must still be crawlable.
    console.error('[sitemap] unexpected error:', err);
  }

  // Deduplicate by URL (safety if category slug collisions occur)
  const seen = new Set<string>();
  const merged = [...staticEntries, ...blogEntries].filter((entry) => {
    if (seen.has(entry.url)) return false;
    // Guard against accidental localhost / wrong host
    if (!entry.url.startsWith(SITE_URL)) return false;
    seen.add(entry.url);
    return true;
  });

  return merged;
}
