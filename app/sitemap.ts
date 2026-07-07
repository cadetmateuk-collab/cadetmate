import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { SITE_URL, absoluteUrl } from '@/lib/seo/site';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

/** Public indexable static routes (kebab-case, lowercase). */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/home', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/pricing', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/resources', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/community-preview', priority: 0.75, changeFrequency: 'daily' },
  { path: '/partners', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/free-content', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/community', priority: 0.8, changeFrequency: 'daily' },
  { path: '/store', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/flashcards', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/unit-modules', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/trb', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/sea-survival', priority: 0.8, changeFrequency: 'weekly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const [{ data: posts }, { data: articles }] = await Promise.all([
    supabase.from('blog_posts').select('slug, category, category_slug, date, updated_at').eq('hidden', false),
    supabase.from('sea_survival').select('slug, updated_at').eq('hidden', false),
  ]);

  const blogEntries: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: absoluteUrl(buildBlogPostPath(post)),
    lastModified: post.updated_at
      ? new Date(post.updated_at)
      : post.date
        ? new Date(post.date)
        : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const survivalEntries: MetadataRoute.Sitemap = (articles ?? []).map((article) => ({
    url: absoluteUrl(`/sea-survival/${article.slug}`),
    lastModified: article.updated_at ? new Date(article.updated_at) : now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries, ...survivalEntries];
}
