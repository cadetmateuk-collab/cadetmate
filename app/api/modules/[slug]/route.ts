import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()
  
  // The slug will be like "navigation-basics", so we need to handle it
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Module not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}