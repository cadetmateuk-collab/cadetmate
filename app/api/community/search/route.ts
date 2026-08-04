import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { POST_SELECT, attachPostTags, asPost } from '@/lib/community/queries';
import type { Post } from '@/lib/community/types';
import { escapeIlike } from '@/lib/security/env';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const type = request.nextUrl.searchParams.get('type') ?? 'all';
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 });
  }

  const pattern = `%${escapeIlike(q)}%`;

  const results: {
    posts: Post[];
    users: { id: string; full_name: string | null; karma_score: number }[];
    categories: { id: string; name: string; slug: string; color: string | null }[];
  } = { posts: [], users: [], categories: [] };

  if (type === 'all' || type === 'posts') {
    const { data: byTitle } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('is_deleted', false)
      .eq('status', 'published')
      .ilike('title', pattern)
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data: byBody } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('is_deleted', false)
      .eq('status', 'published')
      .ilike('body', pattern)
      .order('created_at', { ascending: false })
      .limit(limit);

    const merged = new Map<string, Post>();
    for (const row of [...(byTitle ?? []), ...(byBody ?? [])]) {
      const post = asPost(row);
      merged.set(post.id, post);
    }
    let posts = Array.from(merged.values()).slice(0, limit);
    posts = await attachPostTags(supabase, posts);
    results.posts = posts;
  }

  if (type === 'all' || type === 'users') {
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, community_user_profiles(karma_score)')
      .ilike('full_name', pattern)
      .limit(limit);

    results.users = (users ?? []).map((u) => {
      const stats = u.community_user_profiles as { karma_score: number } | { karma_score: number }[] | null;
      const karma = Array.isArray(stats) ? stats[0]?.karma_score : stats?.karma_score;
      return {
        id: u.id,
        full_name: u.full_name,
        karma_score: karma ?? 0,
      };
    });
  }

  if (type === 'all' || type === 'categories') {
    const { data: byName } = await supabase
      .from('post_categories')
      .select('id, name, slug, color')
      .ilike('name', pattern)
      .limit(limit);

    results.categories = byName ?? [];
  }

  return NextResponse.json(results);
}
