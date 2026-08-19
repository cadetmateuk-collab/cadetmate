import { NextRequest, NextResponse } from 'next/server'
import { requireUserApi } from '@/lib/auth/require-user-api'
import { isPremiumRole } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const auth = await requireUserApi()
  if (auth.error) return auth.error

  const supabase = await createClient()
  const { slug } = await params

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  const { data: catalog } = await supabase
    .from('modules_catalog')
    .select('slug, is_premium')
    .eq('slug', slug)
    .maybeSingle()

  if (!catalog) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  if (catalog.is_premium && !isPremiumRole(profile?.role)) {
    return NextResponse.json({ error: 'Premium required' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
