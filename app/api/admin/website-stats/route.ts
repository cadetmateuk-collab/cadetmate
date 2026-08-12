import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionApi } from '@/lib/auth/require-permission-api';
import { getWebsiteStats } from '@/lib/admin/metrics';

export async function GET(request: NextRequest) {
  const auth = await requirePermissionApi('stats.view');
  if ('error' in auth) return auth.error;

  const days = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('days') ?? 30) || 30, 1),
    365,
  );

  const stats = await getWebsiteStats(days);
  return NextResponse.json(stats);
}
