import { NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { runSessionCheck } from '@/lib/offline/session-check';
import type { SessionCheckRequest } from '@cadet-mate/shared';

export async function POST(request: Request) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  let body: SessionCheckRequest = { installed: [] };
  try {
    body = (await request.json()) as SessionCheckRequest;
  } catch {
    /* empty body is fine */
  }

  try {
    const result = await runSessionCheck({
      userId: auth.user.id,
      installed: Array.isArray(body.installed) ? body.installed : [],
      pendingProgressRows: Number(body.pendingProgressRows) || 0,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[mobile/session-check]', err);
    return NextResponse.json({ error: 'Could not complete session check' }, { status: 500 });
  }
}
