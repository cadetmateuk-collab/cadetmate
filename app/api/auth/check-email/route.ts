import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isValidEmail } from '@/lib/onboarding/constants';

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() ?? '';
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Look up via profiles (synced from auth) — avoids listing all auth users.
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    console.error('[check-email]', error.message);
    return NextResponse.json({ error: 'Unable to check email' }, { status: 500 });
  }

  return NextResponse.json({ available: !data });
}
