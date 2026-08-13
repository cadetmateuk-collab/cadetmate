import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/auth/require-permission-api';

/** Bust the public Free Content listing after an admin save. */
export async function POST() {
  const auth = await requireStaffApi();
  if ('error' in auth) return auth.error;

  revalidateTag('blog-posts', 'max');
  revalidatePath('/free-content');
  revalidatePath('/free-content', 'layout');
  revalidatePath('/resources');

  return NextResponse.json({ ok: true });
}
