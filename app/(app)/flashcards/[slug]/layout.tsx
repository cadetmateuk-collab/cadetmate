import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: pack } = await supabase
    .from('flashcard_packs')
    .select('title, description, thumbnail_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pack) return {};

  return buildPageMetadata({
    title: pack.title,
    description: pack.description || `Study ${pack.title} flashcards on CadetMate.`,
    path: `/flashcards/${slug}`,
    image: pack.thumbnail_url ?? undefined,
    imageAlt: pack.title,
    noIndex: true,
  });
}

export default async function FlashcardPackLayout({ params, children }: Props) {
  const { slug } = await params;
  const { data: pack } = await supabase
    .from('flashcard_packs')
    .select('slug')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pack) notFound();

  return children;
}
