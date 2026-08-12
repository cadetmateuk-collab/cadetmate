import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

function parseUa(ua: string | null) {
  const s = ua ?? '';
  const device = /Mobile|Android|iPhone|iPad/i.test(s)
    ? /iPad|Tablet/i.test(s)
      ? 'tablet'
      : 'mobile'
    : 'desktop';
  let browser = 'other';
  if (/Edg\//.test(s)) browser = 'edge';
  else if (/Chrome\//.test(s)) browser = 'chrome';
  else if (/Firefox\//.test(s)) browser = 'firefox';
  else if (/Safari\//.test(s)) browser = 'safari';
  let os = 'other';
  if (/Windows/i.test(s)) os = 'windows';
  else if (/Mac OS|Macintosh/i.test(s)) os = 'macos';
  else if (/Android/i.test(s)) os = 'android';
  else if (/iPhone|iPad|iOS/i.test(s)) os = 'ios';
  else if (/Linux/i.test(s)) os = 'linux';
  return { device, browser, os };
}

/**
 * Privacy-conscious page view collector.
 * Stores hashed visitor id (IP+UA salt) — not raw IP — and coarse UA fields only.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : null;
    if (!path || path.startsWith('/admin')) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const ua = request.headers.get('user-agent');
    const { device, browser, os } = parseUa(ua);
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
    const salt = process.env.SITE_ANALYTICS_SALT || process.env.NEXT_PUBLIC_SUPABASE_URL || 'cadetmate';
    const visitorHash = createHash('sha256')
      .update(`${salt}|${forwarded}|${ua ?? ''}`)
      .digest('hex')
      .slice(0, 32);

    const sessionId =
      (typeof body.sessionId === 'string' && body.sessionId.slice(0, 64)) || randomUUID();

    const referrer =
      typeof body.referrer === 'string' && body.referrer
        ? body.referrer.slice(0, 500)
        : null;

    const screen =
      typeof body.screen === 'string' ? body.screen.slice(0, 32) : null;

    const durationMs =
      typeof body.durationMs === 'number' && body.durationMs > 0
        ? Math.min(Math.round(body.durationMs), 30 * 60 * 1000)
        : null;

    await supabaseAdmin.from('site_page_views').insert({
      path,
      referrer,
      device,
      browser,
      os,
      screen,
      session_id: sessionId,
      visitor_hash: visitorHash,
      duration_ms: durationMs,
    });

    return NextResponse.json({ ok: true, sessionId });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
