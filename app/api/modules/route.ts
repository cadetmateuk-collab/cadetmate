import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('GET /api/modules called')
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const slug = searchParams.get('slug')
    
    const supabase = await createClient()
    
    if (id) {
      // Get specific module by ID
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(data)
    } else if (slug) {
      // Get specific module by slug
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(data)
    } else {
      // Get all modules
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('category', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log('Modules found:', data?.length || 0)
      return NextResponse.json(data || [])
    }
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  console.log('POST /api/modules called')
  
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }
    
    console.log('User authenticated:', user.id)
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Could not verify user role' }, { status: 500 })
    }
    
    console.log('User role:', profile?.role)
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required. Your role: ' + (profile?.role || 'none') 
      }, { status: 403 })
    }
    
    // Get module data
    const moduleData = await request.json()
    console.log('Module data received:', {
      title: moduleData.title,
      category: moduleData.category,
      subcategory: moduleData.subcategory,
      blocksCount: moduleData.blocks?.length || 0
    })
    
    // Generate slug
    const categorySlug = moduleData.category.toLowerCase().replace(/\s+/g, '-');
    const subcategorySlug = moduleData.subcategory 
      ? moduleData.subcategory.toLowerCase().replace(/\s+/g, '-')
      : moduleData.title.toLowerCase().replace(/\s+/g, '-');
    
    const slug = `${categorySlug}/${subcategorySlug}`;
    
    // Generate ID if not provided
    if (!moduleData.id) {
      moduleData.id = `${slug}-${Date.now()}`
    }
    
    console.log('Saving module with slug:', slug)
    
    // Save to database
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
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('Module saved successfully:', data.id)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  console.log('DELETE /api/modules called')
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Module ID is required' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }
    
    console.log('User authenticated:', user.id)
    
    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError) {
      console.error('Profile error:', profileError)
      return NextResponse.json({ error: 'Could not verify user role' }, { status: 500 })
    }
    
    console.log('User role:', profile?.role)
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Forbidden - Admin access required. Your role: ' + (profile?.role || 'none') 
      }, { status: 403 })
    }
    
    console.log('Deleting module:', id)
    
    // Delete the module
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    
    console.log('Module deleted successfully:', id)
    return NextResponse.json({ 
      success: true, 
      message: 'Module deleted successfully' 
    })
    
  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}