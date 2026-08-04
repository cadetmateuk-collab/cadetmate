import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { escapeIlike } from '@/lib/security/env';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '8', 10), 20);

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const supabase = await createClient();
  const pattern = `%${escapeIlike(q)}%`;
  const results: Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    href: string;
  }> = [];

  const [modules, flashcards, posts, blogs, users] = await Promise.all([
    supabase
      .from('modules')
      .select('id, title, category, subcategory')
      .ilike('title', pattern)
      .eq('hidden', false)
      .limit(limit),

    supabase
      .from('flashcard_packs')
      .select('id, title, slug, description')
      .ilike('title', pattern)
      .limit(limit),

    supabase
      .from('posts')
      .select('id, title, body')
      .ilike('title', pattern)
      .limit(limit),

    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, category, category_slug')
      .eq('hidden', false)
      .ilike('title', pattern)
      .limit(limit),

    // Never search or return emails publicly
    supabase
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', pattern)
      .limit(5),
  ]);

  for (const m of modules.data ?? []) {
    results.push({
      id: m.id,
      type: 'module',
      title: m.title,
      subtitle: [m.category, m.subcategory].filter(Boolean).join(' › '),
      href: `/modules/${m.category}/${m.subcategory}`,
    });
  }

  for (const p of flashcards.data ?? []) {
    results.push({
      id: p.id,
      type: 'flashcard',
      title: p.title,
      subtitle: p.description ?? undefined,
      href: `/flashcards/${p.slug}`,
    });
  }

  for (const p of posts.data ?? []) {
    results.push({
      id: p.id,
      type: 'post',
      title: p.title,
      subtitle: p.body?.slice(0, 80),
      href: `/community/post/${p.id}`,
    });
  }

  for (const b of blogs.data ?? []) {
    results.push({
      id: b.id,
      type: 'blog',
      title: b.title,
      subtitle: b.excerpt ?? undefined,
      href: buildBlogPostPath(b),
    });
  }

  for (const u of users.data ?? []) {
    results.push({
      id: u.id,
      type: 'user',
      title: u.full_name || 'Cadet',
      href: `/community/user/${u.id}`,
    });
  }

  return NextResponse.json({ results: results.slice(0, limit) });
}
