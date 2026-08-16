import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { ProductDetail } from '@/components/store/ProductDetail';
import type { StorePack } from '@/components/store/types';

const PACK_COLUMNS =
  'id, slug, title, description, category, card_count, is_premium, price_cents, stripe_price_id, thumbnail_url, tags, difficulty';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: pack } = await supabase
    .from('flashcard_packs')
    .select('title, description, thumbnail_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pack) {
    return buildPageMetadata({
      title: 'Product',
      path: `/store/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: pack.title,
    description: pack.description || `Unlock ${pack.title} in the CadetMate store.`,
    path: `/store/${slug}`,
    image: pack.thumbnail_url ?? undefined,
    imageAlt: pack.title,
    noIndex: true,
  });
}

export default async function StoreProductPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: pack } = await supabase
    .from('flashcard_packs')
    .select(PACK_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!pack) notFound();

  const { data: ownership } = await supabase
    .from('flashcard_pack_ownership')
    .select('pack_id')
    .eq('user_id', user.id)
    .eq('pack_id', pack.id)
    .maybeSingle();

  return <ProductDetail pack={pack as StorePack} owned={!!ownership} />;
}
