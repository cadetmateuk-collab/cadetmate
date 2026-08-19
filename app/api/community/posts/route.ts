import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { insertModerationLog } from '@/lib/community/log-moderation';
import { moderateContent } from '@/lib/community/moderation';
import { validatePost } from '@/lib/community/validation';
import { slugify, topPeriodToDate } from '@/lib/community/utils';
import {
  POST_SELECT,
  attachPostTags,
  attachAuthors,
  attachUserVotes,
  asPost,
} from '@/lib/community/queries';
import type { Post } from '@/lib/community/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const sort = searchParams.get('sort') ?? 'hot';
  const period = searchParams.get('period') ?? 'all';
  const category = searchParams.get('category');
  const filter = searchParams.get('filter');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('is_deleted', false)
    .eq('status', 'published')
    .limit(limit + 1);

  if (category) {
    const { data: cat } = await supabase
      .from('post_categories')
      .select('id')
      .eq('slug', category)
      .maybeSingle();
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (filter === 'mine') {
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    query = query.eq('user_id', user.id);
  }

  if (filter === 'saved') {
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: saved } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id);
    const postIds = (saved ?? []).map((row) => row.post_id);
    if (postIds.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null, hasMore: false });
    }
    query = query.in('id', postIds);
  }

  const since = sort === 'top' ? topPeriodToDate(period) : null;
  if (since) query = query.gte('created_at', since.toISOString());

  if (sort === 'new') {
    if (cursor) query = query.lt('created_at', cursor);
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'top') {
    if (cursor) query = query.lt('vote_score', parseInt(cursor, 10));
    query = query.order('vote_score', { ascending: false }).order('created_at', { ascending: false });
  } else {
    if (cursor) query = query.lt('hot_score', parseFloat(cursor));
    query = query.order('hot_score', { ascending: false });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []).map((p) => asPost(p));
  const hasMore = rows.length > limit;
  const posts = hasMore ? rows.slice(0, limit) : rows;

  let enriched = await attachPostTags(supabase, posts);
  enriched = await attachAuthors(supabase, enriched);
  enriched = await attachUserVotes(supabase, user?.id, enriched);

  const last = enriched[enriched.length - 1];
  let nextCursor: string | null = null;
  if (hasMore && last) {
    if (sort === 'new') nextCursor = last.created_at;
    else if (sort === 'top') nextCursor = String(last.vote_score);
    else nextCursor = String(last.hot_score);
  }

  return NextResponse.json({ posts: enriched, nextCursor, hasMore });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const body = await request.json();
  const { title, body: postBody, categoryId, tags = [] } = body as {
    title: string;
    body: string;
    categoryId?: string;
    tags?: string[];
  };

  const validationError = validatePost(title ?? '', postBody ?? '');
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { data: allowed } = await supabase.rpc('community_check_rate_limit', {
    p_user_id: user.id,
    p_action: 'post',
    p_max_count: 5,
    p_window_minutes: 30,
  });
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please wait before posting again.' }, { status: 429 });
  }

  const moderation = await moderateContent(`${title}\n\n${postBody}`);
  if (moderation.action === 'blocked') {
    await insertModerationLog({
      content_type: 'post',
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

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      title: title.trim(),
      body: postBody.trim(),
      category_id: categoryId || null,
      status,
    })
    .select(POST_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const { logActivityEvent, requestContext } = await import('@/lib/activity/log-event');
  void logActivityEvent({
    actorId: user.id,
    actorRole: profile?.role ?? null,
    action: 'community.post_created',
    entityType: 'post',
    entityId: post.id,
    entityTitle: title.trim(),
    metadata: { status },
    ...requestContext(request),
  });

  await insertModerationLog({
    content_type: 'post',
    content_id: post.id,
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
      contentType: 'post',
      contentId: post.id,
      authorId: user.id,
      excerpt: `${title.trim()}: ${postBody.trim()}`,
      categories: moderation.categories,
    });
  }

  if (tags.length > 0) {
    for (const tagName of tags.slice(0, 5)) {
      const name = tagName.trim();
      if (!name) continue;
      const slug = slugify(name);
      const { data: tag } = await supabase
        .from('post_tags')
        .upsert({ name, slug }, { onConflict: 'slug' })
        .select('id')
        .single();
      if (tag) {
        await supabase.from('post_tag_assignments').insert({ post_id: post.id, tag_id: tag.id });
      }
    }
  }

  const normalized = asPost(post);
  const [withTags] = await attachPostTags(supabase, [normalized]);
  const [withAuthor] = await attachAuthors(supabase, [withTags]);

  return NextResponse.json({
    post: withAuthor,
    warning: moderation.action === 'flagged' ? moderation.explanation : undefined,
  });
}
