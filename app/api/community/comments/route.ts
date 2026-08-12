import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderateContent } from '@/lib/community/moderation';
import { validateComment } from '@/lib/community/validation';
import { AUTHOR_SELECT } from '@/lib/community/queries';
import type { Comment } from '@/lib/community/types';

const COMMENT_SELECT = `
  id, post_id, parent_id, user_id, body, vote_score, depth,
  status, is_deleted, created_at, updated_at,
  author:profiles!comments_user_id_fkey(${AUTHOR_SELECT})
`;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const postId = request.nextUrl.searchParams.get('postId');
  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const comments = (data ?? []).map((c) => {
    const raw = c.author as unknown;
    const author = Array.isArray(raw) ? raw[0] : raw;
    return { ...c, author } as Comment;
  });

  if (user && comments.length > 0) {
    const ids = comments.map((c) => c.id);
    const { data: votes } = await supabase
      .from('votes')
      .select('target_id, value')
      .eq('user_id', user.id)
      .eq('target_type', 'comment')
      .in('target_id', ids);

    const voteMap = new Map((votes ?? []).map((v) => [v.target_id, v.value]));
    for (const c of comments) {
      c.user_vote = voteMap.get(c.id) ?? null;
    }
  }

  return NextResponse.json({ comments: buildCommentTree(comments) });
}

function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of flat) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { postId, parentId, body } = await request.json();
  const validationError = validateComment(body ?? '');
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data: allowed } = await supabase.rpc('community_check_rate_limit', {
    p_user_id: user.id,
    p_action: 'comment',
    p_max_count: 20,
    p_window_minutes: 30,
  });
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait before commenting again.' }, { status: 429 });
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id, is_deleted')
    .eq('id', postId)
    .single();

  if (!post || post.is_deleted) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  if (parentId) {
    const { data: parent } = await supabase
      .from('comments')
      .select('id, depth, post_id')
      .eq('id', parentId)
      .single();
    if (!parent || parent.post_id !== postId) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
    }
    if (parent.depth >= 10) {
      return NextResponse.json({ error: 'Maximum reply depth reached' }, { status: 400 });
    }
  }

  const moderation = await moderateContent(body);
  if (moderation.action === 'blocked') {
    await supabase.from('moderation_logs').insert({
      content_type: 'comment',
      user_id: user.id,
      provider: moderation.provider,
      action: 'blocked',
      categories: moderation.categories,
      toxicity_score: moderation.toxicityScore,
      explanation: moderation.explanation,
      raw_response: moderation.raw ?? null,
    });
    return NextResponse.json({ error: moderation.explanation }, { status: 422 });
  }

  const status = moderation.action === 'flagged' ? 'flagged' : 'published';

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      parent_id: parentId || null,
      user_id: user.id,
      body: body.trim(),
      status,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('moderation_logs').insert({
    content_type: 'comment',
    content_id: comment.id,
    user_id: user.id,
    provider: moderation.provider,
    action: moderation.action,
    categories: moderation.categories,
    toxicity_score: moderation.toxicityScore,
    explanation: moderation.explanation,
    raw_response: moderation.raw ?? null,
  });

  if (moderation.action === 'flagged') {
    const { notifyAdminsOfFlaggedContent } = await import('@/lib/community/notify-admins');
    void notifyAdminsOfFlaggedContent({
      contentType: 'comment',
      contentId: comment.id,
      authorId: user.id,
      excerpt: body.trim(),
      categories: moderation.categories,
    });
  }

  const raw = comment.author as unknown;
  const author = Array.isArray(raw) ? raw[0] : raw;

  return NextResponse.json({
    comment: { ...comment, author, replies: [] } as Comment,
    warning: moderation.action === 'flagged' ? moderation.explanation : undefined,
  });
}
