import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/ping
// Lightweight endpoint called by ActivityTracker on the client.
// Updates last_seen_at on the authenticated user's profile row.
// Returns 200 with { ok: true } or 401 if not signed in.
export async function POST() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}