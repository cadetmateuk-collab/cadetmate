import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasPermission, isPremiumRole, isStaffRole } from '@/lib/auth/roles'
import { logActivityEvent, requestContext } from '@/lib/activity/log-event'
import { getCurrentUser } from '@/lib/auth/get-user'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const staff = isStaffRole(user.profile?.role)

    if (id || slug) {
      if (staff) {
        let fullQuery = supabaseAdmin.from('modules').select('*')
        fullQuery = id ? fullQuery.eq('id', id) : fullQuery.eq('slug', slug as string)
        const { data, error } = await fullQuery.maybeSingle()
        if (error || !data) {
          return NextResponse.json({ error: 'Module not found' }, { status: 404 })
        }
        return NextResponse.json(data)
      }

      let catalogQuery = supabase.from('modules_catalog').select('id, slug, is_premium')
      catalogQuery = id ? catalogQuery.eq('id', id) : catalogQuery.eq('slug', slug)
      const { data: catalog } = await catalogQuery.maybeSingle()

      if (!catalog) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 })
      }

      if (catalog.is_premium && !isPremiumRole(user.profile?.role)) {
        return NextResponse.json({ error: 'Premium required' }, { status: 403 })
      }

      let fullQuery = supabase.from('modules').select('*')
      fullQuery = id ? fullQuery.eq('id', id) : fullQuery.eq('slug', slug as string)
      const { data, error } = await fullQuery.maybeSingle()

      if (error || !data) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 })
      }

      return NextResponse.json(data)
    }

    if (staff) {
      const { data, error } = await supabaseAdmin
        .from('modules')
        .select('id, title, description, category, subcategory, slug, is_premium, image_url, tags, difficulty, total_lessons, hidden')
        .order('category', { ascending: true })
      if (error) {
        return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 })
      }
      return NextResponse.json(data || [])
    }

    const { data, error } = await supabase
      .from('modules_catalog')
      .select('id, title, description, category, subcategory, slug, is_premium, image_url, tags, difficulty, total_lessons')
      .order('category', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Could not verify user role' }, { status: 500 })
    }

    const role = profile?.role
    const moduleData = await request.json()
    const isUpdate = Boolean(moduleData.id)
    const needed = isUpdate ? 'modules.update' : 'modules.create'

    if (!hasPermission(role, needed as 'modules.create' | 'modules.update')) {
      return NextResponse.json(
        { error: `Forbidden - ${needed} required. Your role: ${role || 'none'}` },
        { status: 403 },
      )
    }

    const blocks: any[] = moduleData.blocks || []
    const pageBreaks = blocks.filter((b: any) => b.type === 'page-break')
    const totalLessons = pageBreaks.length + 1
    const totalMinutes =
      pageBreaks.reduce((sum: number, b: any) => sum + (b.content?.estimatedMinutes || 5), 0) + 5
    const estimatedHours = Math.max(0.1, Math.round((totalMinutes / 60) * 10) / 10)

    const categorySlug = moduleData.category.toLowerCase().replace(/\s+/g, '-')
    const subcategorySlug = moduleData.subcategory
      ? moduleData.subcategory.toLowerCase().replace(/\s+/g, '-')
      : moduleData.title.toLowerCase().replace(/\s+/g, '-')

    const slug = `${categorySlug}/${subcategorySlug}`

    if (!moduleData.id) {
      moduleData.id = `${slug}-${Date.now()}`
    }

    const { data, error } = await supabase
      .from('modules')
      .upsert({
        id: moduleData.id,
        title: moduleData.title,
        description: moduleData.description,
        category: moduleData.category,
        subcategory: moduleData.subcategory,
        slug: slug,
        blocks: moduleData.blocks,
        total_lessons: totalLessons,
        estimated_hours: estimatedHours,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const ctx = requestContext(request)
    void logActivityEvent({
      actorId: user.id,
      actorRole: role,
      action: isUpdate ? 'module.updated' : 'module.created',
      entityType: 'module',
      entityId: data.id,
      entityTitle: data.title,
      metadata: { slug: data.slug, category: data.category },
      ...ctx,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Could not verify user role' }, { status: 500 })
    }

    if (!hasPermission(profile?.role, 'modules.delete')) {
      return NextResponse.json(
        {
          error:
            'Forbidden - modules.delete required. Your role: ' + (profile?.role || 'none'),
        },
        { status: 403 },
      )
    }

    const { data: existing } = await supabase
      .from('modules')
      .select('id, title')
      .eq('id', id)
      .maybeSingle()

    const { error: deleteError } = await supabase.from('modules').delete().eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    const ctx = requestContext(request)
    void logActivityEvent({
      actorId: user.id,
      actorRole: profile?.role,
      action: 'module.deleted',
      entityType: 'module',
      entityId: id,
      entityTitle: existing?.title ?? null,
      ...ctx,
    })

    return NextResponse.json({
      success: true,
      message: 'Module deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    )
  }
}
