import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePost } from '@/lib/community/validation';
import { moderateContent } from '@/lib/community/moderation';
import {
  POST_SELECT,
  attachPostTags,
  attachUserVotes,
  asPost,
} from '@/lib/community/queries';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.is_deleted) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  let post = asPost(data);
  [post] = await attachPostTags(supabase, [post]);
  [post] = await attachUserVotes(supabase, user?.id, [post]);

  return NextResponse.json({ post });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { title, body: postBody, categoryId } = await request.json();
  const validationError = validatePost(title ?? '', postBody ?? '');
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data: existing } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const moderation = await moderateContent(`${title}\n\n${postBody}`);
  if (moderation.action === 'blocked') {
    await supabase.from('moderation_logs').insert({
      content_type: 'post',
      content_id: id,
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

  const { data, error } = await supabase
    .from('posts')
    .update({
      title: title.trim(),
      body: postBody.trim(),
      category_id: categoryId || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(POST_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (moderation.action === 'flagged') {
    await supabase.from('moderation_logs').insert({
      content_type: 'post',
      content_id: id,
      user_id: user.id,
      provider: moderation.provider,
      action: 'flagged',
      categories: moderation.categories,
      toxicity_score: moderation.toxicityScore,
      explanation: moderation.explanation,
      raw_response: moderation.raw ?? null,
    });

    const { notifyAdminsOfFlaggedContent } = await import('@/lib/community/notify-admins');
    void notifyAdminsOfFlaggedContent({
      contentType: 'post',
      contentId: id,
      authorId: user.id,
      excerpt: `${String(title).trim()}: ${String(postBody).trim()}`,
      categories: moderation.categories,
    });
  }

  return NextResponse.json({
    post: asPost(data),
    warning: moderation.action === 'flagged' ? moderation.explanation : undefined,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: existing } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  if (existing.user_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from('posts')
    .update({ is_deleted: true, status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
