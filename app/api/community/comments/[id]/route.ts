import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateComment } from '@/lib/community/validation';
import { moderateContent } from '@/lib/community/moderation';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { body } = await request.json();
  const validationError = validateComment(body ?? '');
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data: existing } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const moderation = await moderateContent(body);
  if (moderation.action === 'blocked') {
    await supabase.from('moderation_logs').insert({
      content_type: 'comment',
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
    .from('comments')
    .update({
      body: body.trim(),
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, body, status, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (moderation.action === 'flagged') {
    await supabase.from('moderation_logs').insert({
      content_type: 'comment',
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
      contentType: 'comment',
      contentId: id,
      authorId: user.id,
      excerpt: String(body).trim(),
      categories: moderation.categories,
    });
  }

  return NextResponse.json({
    comment: data,
    warning: moderation.action === 'flagged' ? moderation.explanation : undefined,
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: existing } = await supabase
    .from('comments')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  if (existing.user_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from('comments')
    .update({ is_deleted: true, status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
