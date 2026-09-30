import { createPublicSupabase } from '@/lib/db/public';
import {
  cacheAside,
  CONTENT_TTL_SECONDS,
  readBlogCategories,
  rememberBlogCategories,
} from '@/lib/cache/content';
import { resolveCategorySlug } from '@/lib/blog/paths';
import type { BlogPost, BlogPostSummary } from './types';

const SUMMARY_FIELDS =
  'id, title, excerpt, slug, author, author_avatar, date, category, category_slug, image, read_time, featured';

async function fetchAllBlogPosts(): Promise<BlogPostSummary[]> {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SUMMARY_FIELDS)
    .eq('hidden', false)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BlogPostSummary[];
}

export async function getAllBlogPosts(): Promise<BlogPostSummary[]> {
  try {
    const posts = await cacheAside('cm:articles:list', CONTENT_TTL_SECONDS, fetchAllBlogPosts);
    const categories = [...new Set(posts.map((post) => post.category).filter(Boolean))].sort();
    rememberBlogCategories(categories);
    return posts;
  } catch (error) {
    console.error('[blog] failed to load posts:', error);
    return [];
  }
}

export function getBlogCategories(): string[] {
  return readBlogCategories() ?? [];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  return cacheAside(`cm:articles:slug:${slug}`, CONTENT_TTL_SECONDS, async () => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('hidden', false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as BlogPost | null) ?? null;
  });
}

export async function getBlogPostByCategoryAndSlug(
  categorySlug: string,
  slug: string,
): Promise<BlogPost | null> {
  return cacheAside(`cm:articles:path:${categorySlug}:${slug}`, CONTENT_TTL_SECONDS, async () => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('hidden', false);
    if (error) throw new Error(error.message);
    const posts = (data ?? []) as BlogPost[];
    return posts.find((post) => resolveCategorySlug(post) === categorySlug) ?? null;
  });
}

export async function getRelatedBlogPosts(
  currentSlug: string,
  category: string,
  limit = 3,
): Promise<BlogPostSummary[]> {
  return cacheAside(
    `cm:articles:related:${category}:${currentSlug}:${limit}`,
    CONTENT_TTL_SECONDS,
    () => loadRelatedBlogPosts(currentSlug, category, limit),
  );
}

async function loadRelatedBlogPosts(
  currentSlug: string,
  category: string,
  limit: number,
): Promise<BlogPostSummary[]> {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SUMMARY_FIELDS)
    .eq('hidden', false)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  const related = (data ?? []) as BlogPostSummary[];
  if (related.length >= limit) return related;

  const { data: fallback, error: fallbackError } = await supabase
    .from('blog_posts')
    .select(SUMMARY_FIELDS)
    .eq('hidden', false)
    .neq('slug', currentSlug)
    .order('date', { ascending: false })
    .limit(limit);
  if (fallbackError) throw new Error(fallbackError.message);

  const merged = [...related];
  for (const post of (fallback ?? []) as BlogPostSummary[]) {
    if (merged.length >= limit) break;
    if (!merged.some((item) => item.slug === post.slug)) merged.push(post);
  }
  return merged.slice(0, limit);
}

export async function getBlogPostSlugs(): Promise<{ category: string; slug: string }[]> {
  return cacheAside('cm:articles:slugs', CONTENT_TTL_SECONDS, async () => {
    const supabase = createPublicSupabase();
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug, category, category_slug')
      .eq('hidden', false);
    if (error) throw new Error(error.message);
    return (data ?? []).map((post) => ({
      category: resolveCategorySlug(post as { category_slug?: string | null; category: string }),
      slug: post.slug,
    }));
  });
}
