import { createPublicSupabase } from '@/lib/db/public';
import { cacheAside, CONTENT_TTL_SECONDS } from '@/lib/cache/content';

async function fetchLandingPageStats() {
  const supabase = createPublicSupabase();
  const [users, modules, flashcards, posts] = await Promise.all([
    supabase.from('profiles_public').select('*', { count: 'exact', head: true }),
    supabase.from('modules_catalog').select('*', { count: 'exact', head: true }),
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

export function getLandingPageStats() {
  return cacheAside('cm:public:landing-stats', CONTENT_TTL_SECONDS, fetchLandingPageStats);
}

export function getTopCommunityPosts() {
  return cacheAside('cm:public:top-posts', CONTENT_TTL_SECONDS, fetchTopCommunityPosts);
}

export function getRecentCommunityPosts() {
  return cacheAside('cm:public:recent-posts', CONTENT_TTL_SECONDS, fetchRecentCommunityPosts);
}

export function getRecentBlogPosts() {
  return cacheAside('cm:public:recent-blog', CONTENT_TTL_SECONDS, fetchRecentBlogPosts);
}

async function fetchCommunityPreviewPosts() {
  const supabase = createPublicSupabase();
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, body, vote_score, created_at')
    .order('vote_score', { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function getCommunityPreviewPosts() {
  return cacheAside('cm:public:community-preview', CONTENT_TTL_SECONDS, fetchCommunityPreviewPosts);
}
