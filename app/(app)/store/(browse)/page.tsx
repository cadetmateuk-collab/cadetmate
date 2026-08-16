import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/get-user';
import { isPremiumRole } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { getPremiumPrice } from '@/lib/stripe/premium-price';
import { StoreView, type StorePack } from '@/components/store/StoreView';

export const metadata: Metadata = buildPageMetadata({
  title: 'Store',
  description:
    'Get digital study resources that unlock instantly in CadetMate, or browse physical products when they are available.',
  path: '/store',
  noIndex: true,
});

const PACK_COLUMNS =
  'id, slug, title, description, category, card_count, is_premium, price_cents, stripe_price_id, thumbnail_url, tags, difficulty';

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ premium?: string; session_id?: string }>;
}) {
  const [{ premium, session_id }, user, price] = await Promise.all([
    searchParams,
    requireAuth(),
    getPremiumPrice(),
  ]);

  const supabase = await createClient();
  const [{ data: packs, error: packsError }, { data: ownership }] = await Promise.all([
    supabase
      .from('flashcard_packs')
      .select(PACK_COLUMNS)
      .eq('status', 'published')
      .order('updated_at', { ascending: false }),
    supabase.from('flashcard_pack_ownership').select('pack_id').eq('user_id', user.id),
  ]);

  return (
    <StoreView
      packs={(packs ?? []) as StorePack[]}
      ownedPackIds={(ownership ?? []).map((row) => row.pack_id)}
      isPremium={isPremiumRole(user.profile?.role)}
      price={price}
      pendingPremium={premium === '1'}
      checkoutSessionId={session_id ?? null}
      loadError={packsError?.message ?? null}
    />
  );
}
