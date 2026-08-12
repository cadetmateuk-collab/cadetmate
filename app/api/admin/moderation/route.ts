import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/auth/roles';
import { logActivityEvent, requestContext } from '@/lib/activity/log-event';
import type { ModerationQueueItem } from '@/lib/community/types';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!hasPermission(profile?.role, 'community.moderate')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [{ data: posts, error: postsError }, { data: comments, error: commentsError }] =
    await Promise.all([
      supabase
        .from('posts')
        .select(
          'id, title, body, created_at, user_id, author:profiles!posts_user_id_fkey(id, full_name, email)',
        )
        .eq('status', 'flagged')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('comments')
        .select(
          'id, body, created_at, post_id, user_id, author:profiles!comments_user_id_fkey(id, full_name, email)',
        )
        .eq('status', 'flagged')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 });
  if (commentsError) return NextResponse.json({ error: commentsError.message }, { status: 500 });

  const postIds = (posts ?? []).map((p) => p.id);
  const commentIds = (comments ?? []).map((c) => c.id);
  const contentIds = [...postIds, ...commentIds];

  const logByContent = new Map<string, ModerationQueueItem['log']>();
  if (contentIds.length > 0) {
    const { data: logs } = await supabase
      .from('moderation_logs')
      .select('content_id, content_type, provider, categories, toxicity_score, explanation, created_at')
      .eq('action', 'flagged')
      .in('content_id', contentIds)
      .order('created_at', { ascending: false });

    for (const log of logs ?? []) {
      if (!log.content_id || logByContent.has(log.content_id)) continue;
      logByContent.set(log.content_id, {
        provider: log.provider,
        categories: log.categories,
        toxicity_score: log.toxicity_score,
        explanation: log.explanation,
        created_at: log.created_at,
      });
    }
  }

  const asAuthor = (raw: unknown): ModerationQueueItem['author'] => {
    const row = Array.isArray(raw) ? raw[0] : raw;
    if (!row || typeof row !== 'object') return null;
    const a = row as { id?: string; full_name?: string | null; email?: string | null };
    if (!a.id) return null;
    return { id: a.id, full_name: a.full_name ?? null, email: a.email ?? null };
  };

  const items: ModerationQueueItem[] = [
    ...(posts ?? []).map((p) => ({
      id: `post:${p.id}`,
      contentType: 'post' as const,
      contentId: p.id,
      title: p.title,
      body: p.body,
      postId: p.id,
      createdAt: p.created_at,
      author: asAuthor(p.author),
      log: logByContent.get(p.id) ?? null,
    })),
    ...(comments ?? []).map((c) => ({
      id: `comment:${c.id}`,
      contentType: 'comment' as const,
      contentId: c.id,
      title: null,
      body: c.body,
      postId: c.post_id,
      createdAt: c.created_at,
      author: asAuthor(c.author),
      log: logByContent.get(c.id) ?? null,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ items, count: items.length });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!hasPermission(profile?.role, 'community.moderate')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const contentType = body.contentType as 'post' | 'comment';
  const contentId = body.contentId as string;
  const action = body.action as 'approve' | 'remove';

  if (
    (contentType !== 'post' && contentType !== 'comment') ||
    !contentId ||
    (action !== 'approve' && action !== 'remove')
  ) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const table = contentType === 'post' ? 'posts' : 'comments';
  const nextStatus = action === 'approve' ? 'published' : 'removed';
  const updates: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };
  if (action === 'remove') updates.is_deleted = true;

  const { data: updated, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', contentId)
    .eq('status', 'flagged')
    .select('id, user_id')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated) {
    return NextResponse.json({ error: 'Flagged content not found' }, { status: 404 });
  }

  await supabase.from('moderation_logs').insert({
    content_type: contentType,
    content_id: contentId,
    user_id: user.id,
    provider: 'admin-review',
    action: action === 'approve' ? 'approved' : 'blocked',
    categories: [],
    toxicity_score: null,
    explanation:
      action === 'approve'
        ? 'Approved by admin and published to the community.'
        : 'Removed by admin after moderation review.',
    raw_response: null,
  });

  void logActivityEvent({
    actorId: user.id,
    actorRole: profile?.role ?? null,
    action: action === 'approve' ? 'community.moderation_approved' : 'community.moderation_removed',
    entityType: contentType,
    entityId: contentId,
    metadata: { previousStatus: 'flagged', status: nextStatus },
    ...requestContext(request),
  });

  // Notify the author of the decision
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    await supabaseAdmin.from('notifications').insert({
      user_id: updated.user_id,
      type: 'community_moderation',
      title:
        action === 'approve'
          ? `Your ${contentType} was approved`
          : `Your ${contentType} was removed`,
      body:
        action === 'approve'
          ? 'An admin approved your flagged content. It is now visible in the community.'
          : 'An admin removed your flagged content after review.',
      href: contentType === 'post' ? `/community/post/${contentId}` : '/community',
    });
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}
