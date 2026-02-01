import { createClient } from '@/lib/supabase/server'
import ModuleViewer from '@/components/ModuleViewer'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    category: string
    subcategory: string
  }>
}

export default async function ModulePage({ params }: PageProps) {
  // Await the params (Next.js 15+ requirement)
  const { category, subcategory } = await params
  
  const supabase = await createClient()
  
  // Construct the slug from URL params (lowercase)
  const slug = `${category.toLowerCase()}/${subcategory.toLowerCase()}`
  
  console.log('🔍 Looking for module:')
  console.log('  - Category:', category)
  console.log('  - Subcategory:', subcategory)
  console.log('  - Constructed slug:', slug)
  
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
    
    // PGRST116 = no rows returned
    if (error.code === 'PGRST116') {
      console.log('📝 No module found with slug:', slug)
      
      // Let's check what modules DO exist
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

  return <ModuleViewer moduleId={transformedModule.id} moduleData={transformedModule} />
}

// Optional: Generate static params for better performance
import { supabaseStatic } from '@/lib/supabase/static'

export async function generateStaticParams() {
  const { data: modules } = await supabaseStatic
    .from('modules')
    .select('slug')

  if (!modules) return []

  return modules.map((module) => {
    const [category, subcategory] = module.slug.split('/')
    return { category, subcategory }
  })
}
