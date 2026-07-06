import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePost } from '@/lib/community/validation';
import {
  POST_SELECT,
  attachPostTags,
  attachUserVotes,
  asPost,
} from '@/lib/community/queries';
import type { Post } from '@/lib/community/types';

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

  const { data, error } = await supabase
    .from('posts')
    .update({
      title: title.trim(),
      body: postBody.trim(),
      category_id: categoryId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(POST_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: asPost(data) });
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
