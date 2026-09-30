import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/auth/require-permission-api';
import { invalidateArticles, invalidateModules } from '@/lib/cache/content';

/** Bust Next and Redis caches after an admin content save. */
export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if ('error' in auth) return auth.error;

  let scope: 'articles' | 'modules' | 'all' = 'articles';
  try {
    const body = (await request.json()) as { scope?: string };
    if (body.scope === 'modules' || body.scope === 'all') scope = body.scope;
  } catch {
    /* blog admin posts with an empty body */
  }

  if (scope !== 'modules') {
    revalidateTag('blog-posts', 'max');
    revalidatePath('/free-content');
    revalidatePath('/free-content', 'layout');
    revalidatePath('/resources');
    revalidatePath('/home');
    revalidatePath('/community-preview');
    await invalidateArticles();
  }

  if (scope !== 'articles') {
    await invalidateModules();
  }

  return NextResponse.json({ ok: true, scope });
}
