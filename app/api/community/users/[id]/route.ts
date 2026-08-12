import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { POST_SELECT, attachPostTags, asPost } from '@/lib/community/queries';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10), 30);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      id, full_name, created_at, role, avatar_kind, avatar_preset, avatar_color,
      community_user_profiles(karma_score, post_count, comment_count)
    `)
    .eq('id', id)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const stats = profile.community_user_profiles as {
    karma_score: number;
    post_count: number;
    comment_count: number;
  } | { karma_score: number; post_count: number; comment_count: number }[] | null;
  const communityStats = Array.isArray(stats) ? stats[0] : stats;

  const { data: posts } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('user_id', id)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  let normalizedPosts = (posts ?? []).map((p) => asPost(p));
  normalizedPosts = await attachPostTags(supabase, normalizedPosts);

  const { data: recentComments } = await supabase
    .from('comments')
    .select(`
      id, body, created_at, vote_score,
      post:posts!comments_post_id_fkey(id, title)
    `)
    .eq('user_id', id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  return NextResponse.json({
    profile: {
      id: profile.id,
      full_name: profile.full_name,
      created_at: profile.created_at,
      role: profile.role ?? null,
      avatar_kind: profile.avatar_kind ?? null,
      avatar_preset: profile.avatar_preset ?? null,
      avatar_color: profile.avatar_color ?? null,
      karma_score: communityStats?.karma_score ?? 0,
      post_count: communityStats?.post_count ?? 0,
      comment_count: communityStats?.comment_count ?? 0,
    },
    recentPosts: normalizedPosts,
    recentComments: recentComments ?? [],
  });
}
