import { NextRequest, NextResponse } from 'next/server';

/**
 * Lightweight client-error sink for monitoring.
 * Logs structured errors server-side; optionally forwards to a webhook.
 * Does not store PII.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const message =
      typeof (body as { message?: unknown }).message === 'string'
        ? (body as { message: string }).message.slice(0, 1000)
        : 'unknown';
    const path =
      typeof (body as { path?: unknown }).path === 'string'
        ? (body as { path: string }).path.slice(0, 200)
        : '';
    const fatal = Boolean((body as { fatal?: unknown }).fatal);

    console.error('[client-error]', {
      message,
      path,
      fatal,
      ua: req.headers.get('user-agent')?.slice(0, 200),
    });

    const webhook = process.env.ERROR_WEBHOOK_URL?.trim();
    if (webhook) {
      void fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'cadetmate-client',
          message,
          path,
          fatal,
          at: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
