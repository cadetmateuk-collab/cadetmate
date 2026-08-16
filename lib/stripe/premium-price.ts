import { unstable_cache } from 'next/cache';
import { getPremiumPriceId } from '@/lib/security/env';
import { getStripe } from '@/lib/stripe/client';

export type PremiumPrice = {
  priceId: string;
  amountCents: number;
  currency: string;
  interval: string | null;
  formatted: string;
  formattedWithInterval: string;
};

function formatAmount(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

async function fetchPremiumPrice(priceId: string): Promise<PremiumPrice | null> {
  try {
    const price = await getStripe().prices.retrieve(priceId);
    const amountCents = price.unit_amount ?? 0;
    const currency = price.currency || 'gbp';
    const interval = price.recurring?.interval ?? null;
    const formatted = formatAmount(amountCents, currency);
    return {
      priceId,
      amountCents,
      currency,
      interval,
      formatted,
      formattedWithInterval: interval ? `${formatted} / ${interval}` : formatted,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[stripe] Failed to load premium price:', message);
    return null;
  }
}

export async function getPremiumPrice(): Promise<PremiumPrice | null> {
  const priceId = getPremiumPriceId();
  if (!priceId) return null;

  const cached = unstable_cache(
    () => fetchPremiumPrice(priceId),
    ['stripe-premium-price', priceId],
    { revalidate: 3600 },
  );

  const price = await cached();
  // Do not keep a failed lookup in the data cache (wrong key mode, missing price, etc.)
  if (!price) {
    return fetchPremiumPrice(priceId);
  }
  return price;
}
