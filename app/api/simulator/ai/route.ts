import { NextRequest, NextResponse } from 'next/server';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { createClient } from '@/lib/supabase/server';
import { isPremiumRole } from '@/lib/auth/roles';
import { rateLimit, clientIp } from '@/lib/security/rate-limit';

const MAX_TRANSCRIPT = 500;

export async function POST(request: NextRequest) {
  const auth = await requireUserApi();
  if (auth.error) return auth.error;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'AI is not configured' }, { status: 503 });
  }

  if (!rateLimit(`simulator-ai:${auth.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  if (!rateLimit(`simulator-ai-ip:${clientIp(request)}`, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (!isPremiumRole(profile?.role)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 });
  }

  let body: { transcript?: string; system?: string; maxIndex?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const transcript = typeof body.transcript === 'string' ? body.transcript.trim().slice(0, MAX_TRANSCRIPT) : '';
  const system = typeof body.system === 'string' ? body.system.trim().slice(0, 4000) : '';
  const maxIndex = typeof body.maxIndex === 'number' ? Math.min(Math.max(0, Math.floor(body.maxIndex)), 99) : 29;

  if (!transcript || !system) {
    return NextResponse.json({ error: 'transcript and system are required' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Officer said: "${transcript}"\nResponse number:` },
        ],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? '';
    const idx = parseInt(raw, 10);
    if (Number.isNaN(idx) || idx < 0 || idx > maxIndex) {
      return NextResponse.json({ choice: null });
    }
    return NextResponse.json({ choice: String(idx) });
  } catch {
    return NextResponse.json({ error: 'AI request failed' }, { status: 502 });
  }
}
