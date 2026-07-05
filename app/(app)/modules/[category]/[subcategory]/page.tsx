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
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const slug = `${category.toLowerCase()}/${subcategory.toLowerCase()}`
  
  const { data: moduleData, error } = await supabase
    .from('modules')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      notFound()
    }
    
    throw new Error(`Database error: ${error.message}`)
  }

  if (!moduleData) {
    notFound()
  }

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
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: modules } = await supabase
    .from('modules')
    .select('category, subcategory')

  return (modules ?? []).map((m) => ({
    category: m.category,
    subcategory: m.subcategory,
  }))
}
