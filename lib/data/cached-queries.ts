import { unstable_cache } from 'next/cache';
import { createPublicSupabase } from '@/lib/supabase/public';

const REVALIDATE_SECONDS = process.env.NODE_ENV === 'development' ? 120 : 300;

export const getLandingPageStats = unstable_cache(
  async () => {
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
  },
  ['landing-page-stats'],
  { revalidate: REVALIDATE_SECONDS },
);

export const getTopCommunityPosts = unstable_cache(
  async () => {
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from('posts')
      .select('id, title, body, vote_score, created_at')
      .order('vote_score', { ascending: false })
      .limit(5);
    return data ?? [];
  },
  ['top-community-posts'],
  { revalidate: REVALIDATE_SECONDS },
);

export const getRecentCommunityPosts = unstable_cache(
  async () => {
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from('posts')
      .select('id, title, created_at, vote_score')
      .order('created_at', { ascending: false })
      .limit(3);
    return data ?? [];
  },
  ['recent-community-posts'],
  { revalidate: REVALIDATE_SECONDS },
);

export const getRecentBlogPosts = unstable_cache(
  async () => {
    const supabase = createPublicSupabase();
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, title, excerpt, date')
      .eq('hidden', false)
      .order('date', { ascending: false })
      .limit(3);
    return data ?? [];
  },
  ['recent-blog-posts'],
  { revalidate: REVALIDATE_SECONDS },
);
