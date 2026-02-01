import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient()
  const { slug } = await params
  
  // The slug will be like "navigation-basics", so we need to handle it
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}