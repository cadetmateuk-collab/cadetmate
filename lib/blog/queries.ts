import { unstable_cache } from 'next/cache';
import { createPublicSupabase } from '@/lib/supabase/public';
import { ENABLE_DATA_CACHE, REVALIDATE_SECONDS } from '@/lib/dev-cache';
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

  if (error) {
    console.error('[blog] failed to load posts:', error.message);
    return [];
  }
  return (data ?? []) as BlogPostSummary[];
}

export const getAllBlogPosts = ENABLE_DATA_CACHE
  ? unstable_cache(fetchAllBlogPosts, ['all-blog-posts'], {
      revalidate: REVALIDATE_SECONDS,
      tags: ['blog-posts'],
    })
  : fetchAllBlogPosts;

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('hidden', false)
    .single();
  return (data as BlogPost) ?? null;
}

export async function getBlogPostByCategoryAndSlug(
  categorySlug: string,
  slug: string,
): Promise<BlogPost | null> {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('hidden', false);

  const posts = (data ?? []) as BlogPost[];
  return posts.find((p) => resolveCategorySlug(p) === categorySlug) ?? null;
}

export async function getRelatedBlogPosts(
  currentSlug: string,
  category: string,
  limit = 3,
): Promise<BlogPostSummary[]> {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('blog_posts')
    .select(SUMMARY_FIELDS)
    .eq('hidden', false)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('date', { ascending: false })
    .limit(limit);

  const related = (data ?? []) as BlogPostSummary[];
  if (related.length >= limit) return related;

  const { data: fallback } = await supabase
    .from('blog_posts')
    .select(SUMMARY_FIELDS)
    .eq('hidden', false)
    .neq('slug', currentSlug)
    .order('date', { ascending: false })
    .limit(limit);

  const merged = [...related];
  for (const post of (fallback ?? []) as BlogPostSummary[]) {
    if (merged.length >= limit) break;
    if (!merged.some((p) => p.slug === post.slug)) merged.push(post);
  }
  return merged.slice(0, limit);
}

export async function getBlogPostSlugs(): Promise<{ category: string; slug: string }[]> {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, category, category_slug')
    .eq('hidden', false);
  return (data ?? []).map((p) => ({
    category: resolveCategorySlug(p as { category_slug?: string | null; category: string }),
    slug: p.slug,
  }));
}
