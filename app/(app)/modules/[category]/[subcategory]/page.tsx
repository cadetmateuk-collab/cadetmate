import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import ModuleViewer from '@/components/ModuleViewer'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    category: string
    subcategory: string
  }>
}

export default async function ModulePage({ params }: PageProps) {
  const { category, subcategory } = await params
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  const slug = `${category.toLowerCase()}/${subcategory.toLowerCase()}`
  
  console.log('🔍 Looking for module:')
  console.log('  - Category:', category)
  console.log('  - Subcategory:', subcategory)
  console.log('  - Constructed slug:', slug)
  console.log('  - User:', user?.email || 'Not authenticated')
  
  const { data: moduleData, error } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('❌ Supabase error:', {
      message: error.message,
      code: error.code,
      searchedSlug: slug
    })
    
    if (error.code === 'PGRST116') {
      console.log('📝 No module found with slug:', slug)
      
      const { data: allModules } = await supabase
        .from('modules')
        .select('slug, title')
      
      console.log('📚 Available modules:', allModules)
      notFound()
    }
    
    throw new Error(`Database error: ${error.message}`)
  }

  if (!moduleData) {
    console.log('📝 Query succeeded but no data returned')
    notFound()
  }

  console.log('✅ Module found:', {
    title: moduleData.title,
    slug: moduleData.slug
  })

  const transformedModule = {
    id: moduleData.id,
    title: moduleData.title,
    description: moduleData.description || '',
    category: moduleData.category,
    subcategory: moduleData.subcategory,
    blocks: moduleData.blocks,
  }

  return (
    <ModuleViewer 
      moduleId={transformedModule.id} 
      moduleData={transformedModule}
      userEmail={user?.email}
    />
  )
}

export async function generateStaticParams() {
  // Use service role client for build-time static generation
  // This doesn't require cookies/auth since it runs at build time
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: modules } = await supabase
    .from('modules')
    .select('slug')

  if (!modules) return []

  return modules.map((module) => {
    const [category, subcategory] = module.slug.split('/')
    return { category, subcategory }
  })
}