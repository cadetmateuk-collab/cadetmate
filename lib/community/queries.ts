import { createClient } from '@/lib/supabase/server';
import type { Post, AuthorProfile } from '@/lib/community/types';

export const POST_SELECT = `
  id, user_id, category_id, title, body, vote_score, comment_count,
  hot_score, status, is_deleted, created_at, updated_at,
  author:profiles!posts_user_id_fkey(id, full_name, email, created_at),
  category:post_categories(id, name, slug, description, color)
`;

export async function attachPostTags(supabase: Awaited<ReturnType<typeof createClient>>, posts: Post[]) {
  if (posts.length === 0) return posts;

  const ids = posts.map((p) => p.id);
  const { data: assignments } = await supabase
    .from('post_tag_assignments')
    .select('post_id, tag:post_tags(id, name, slug)')
    .in('post_id', ids);

  const tagMap = new Map<string, Post['tags']>();
  for (const row of assignments ?? []) {
    const list = tagMap.get(row.post_id) ?? [];
    if (row.tag) list.push(row.tag as unknown as NonNullable<Post['tags']>[number]);
    tagMap.set(row.post_id, list);
  }

  return posts.map((p) => ({ ...p, tags: tagMap.get(p.id) ?? [] }));
}

export async function attachUserVotes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined,
  posts: Post[],
) {
  if (!userId || posts.length === 0) return posts;

  const ids = posts.map((p) => p.id);
  const { data: votes } = await supabase
    .from('votes')
    .select('target_id, value')
    .eq('user_id', userId)
    .eq('target_type', 'post')
    .in('target_id', ids);

  const voteMap = new Map((votes ?? []).map((v) => [v.target_id, v.value]));
  return posts.map((p) => ({ ...p, user_vote: voteMap.get(p.id) ?? null }));
}

export function normalizeAuthor(post: Post): Post {
  const raw = post.author as unknown;
  const author = Array.isArray(raw) ? raw[0] : raw;
  const categoryRaw = post.category as unknown;
  const category = Array.isArray(categoryRaw) ? categoryRaw[0] : categoryRaw;
  return { ...post, author: (author as AuthorProfile) ?? null, category: category ?? null };
}

export function asPost(row: unknown): Post {
  return normalizeAuthor(row as Post);
}
