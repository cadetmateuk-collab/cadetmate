import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { createPublicSupabase } from '@/lib/supabase/public';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { requireAuth } from '@/lib/auth/get-user';
import { isPremiumRole } from '@/lib/auth/roles';

const ModuleViewer = dynamic(() => import('@/components/ModuleViewer'), {
  loading: () => (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center text-sm text-muted-foreground">
      Loading module…
    </div>
  ),
});

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

function moduleSlug(category: string, subcategory: string) {
  return `${category.toLowerCase()}/${subcategory.toLowerCase()}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  const slug = moduleSlug(category, subcategory);
  const supabase = createPublicSupabase();

  const { data: moduleData } = await supabase
    .from('modules_catalog')
    .select('title, description, category, subcategory')
    .eq('slug', slug)
    .maybeSingle();

  if (!moduleData) return {};

  return buildPageMetadata({
    title: moduleData.title,
    description: moduleData.description || `${moduleData.category} training module for deck cadets.`,
    path: `/modules/${category}/${subcategory}`,
    noIndex: true,
  });
}

export default async function ModulePage({ params }: PageProps) {
  const user = await requireAuth();
  const { category, subcategory } = await params;
  const supabase = await createClient();
  const slug = moduleSlug(category, subcategory);

  const { data: catalog } = await supabase
    .from('modules_catalog')
    .select('id, title, description, category, subcategory, is_premium, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!catalog) {
    notFound();
  }

  if (catalog.is_premium && !isPremiumRole(user.profile?.role)) {
    redirect('/store');
  }

  const { data: moduleData, error } = await supabase
    .from('modules')
    .select('id, title, description, category, subcategory, blocks')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !moduleData) {
    notFound();
  }

  const transformedModule = {
    id: moduleData.id,
    title: moduleData.title,
    description: moduleData.description || '',
    category: moduleData.category,
    subcategory: moduleData.subcategory,
    blocks: moduleData.blocks,
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ModuleViewer
        moduleId={transformedModule.id}
        moduleData={transformedModule}
        userEmail={user.email}
      />
    </div>
  );
}

export async function generateStaticParams() {
  const supabase = createPublicSupabase();
  const { data: modules } = await supabase.from('modules_catalog').select('category, subcategory');

  return (modules ?? []).map((m) => ({
    category: m.category,
    subcategory: m.subcategory,
  }));
}
