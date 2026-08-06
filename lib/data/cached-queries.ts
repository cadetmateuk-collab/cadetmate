import { unstable_cache } from 'next/cache';
import { createPublicSupabase } from '@/lib/supabase/public';
import { ENABLE_DATA_CACHE, REVALIDATE_SECONDS } from '@/lib/dev-cache';

async function fetchLandingPageStats() {
  const supabase = createPublicSupabase();
  const [users, modules, flashcards, posts] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('modules').select('*', { count: 'exact', head: true }).eq('hidden', false),
    supabase.from('flashcard_packs').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
  ]);

  return {
    users: users.count ?? 0,
    modules: modules.count ?? 0,
    flashcards: flashcards.count ?? 0,
    posts: posts.count ?? 0,
  };
}

async function fetchTopCommunityPosts() {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('posts')
    .select('id, title, body, vote_score, created_at')
    .order('vote_score', { ascending: false })
    .limit(5);
  return data ?? [];
}

async function fetchRecentCommunityPosts() {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('posts')
    .select('id, title, created_at, vote_score')
    .order('created_at', { ascending: false })
    .limit(3);
  return data ?? [];
}

async function fetchRecentBlogPosts() {
  const supabase = createPublicSupabase();
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, date, category, category_slug')
    .eq('hidden', false)
    .order('date', { ascending: false })
    .limit(3);
  return data ?? [];
}

export const getLandingPageStats = ENABLE_DATA_CACHE
  ? unstable_cache(fetchLandingPageStats, ['landing-page-stats'], {
      revalidate: REVALIDATE_SECONDS,
    })
  : fetchLandingPageStats;

export const getTopCommunityPosts = ENABLE_DATA_CACHE
  ? unstable_cache(fetchTopCommunityPosts, ['top-community-posts'], {
      revalidate: REVALIDATE_SECONDS,
    })
  : fetchTopCommunityPosts;

export const getRecentCommunityPosts = ENABLE_DATA_CACHE
  ? unstable_cache(fetchRecentCommunityPosts, ['recent-community-posts'], {
      revalidate: REVALIDATE_SECONDS,
    })
  : fetchRecentCommunityPosts;

export const getRecentBlogPosts = ENABLE_DATA_CACHE
  ? unstable_cache(fetchRecentBlogPosts, ['recent-blog-posts'], {
      revalidate: REVALIDATE_SECONDS,
    })
  : fetchRecentBlogPosts;
