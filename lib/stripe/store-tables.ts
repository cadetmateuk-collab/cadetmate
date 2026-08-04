/**
 * Stripe Pricing Table config for the store.
 * Requires NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — no hardcoded account keys.
 *
 * Env:
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (required for store UI)
 *   NEXT_PUBLIC_STRIPE_PRICING_TABLE_ALL
 *   NEXT_PUBLIC_STRIPE_PRICING_TABLE_PREMIUM
 */

import { getStripePublishableKey } from '@/lib/security/env';

export type StoreTableId = 'all' | 'premium';

export type StoreTableConfig = {
  id: StoreTableId;
  label: string;
  description: string;
  pricingTableId: string;
  publishableKey: string;
};

function publishableKey(): string {
  const key = getStripePublishableKey();
  if (!key) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured');
  }
  return key;
}

/** Active store tables. Returns empty list if Stripe public key is missing. */
export function getStoreTables(): StoreTableConfig[] {
  let key: string;
  try {
    key = publishableKey();
  } catch {
    return [];
  }

  const allId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ALL?.trim();
  const premiumId = process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_PREMIUM?.trim();

  const tables: StoreTableConfig[] = [];
  if (allId) {
    tables.push({
      id: 'all',
      label: 'All Plans',
      description: 'Premium subscription and à-la-carte products',
      pricingTableId: allId,
      publishableKey: key,
    });
  }
  if (premiumId) {
    tables.push({
      id: 'premium',
      label: 'Premium',
      description: 'Full platform access — modules, sims, TRB tools',
      pricingTableId: premiumId,
      publishableKey: key,
    });
  }
  return tables;
}

export function getPremiumPricingTable(): StoreTableConfig {
  const tables = getStoreTables();
  const premium = tables.find((t) => t.id === 'premium') ?? tables[0];
  if (!premium) {
    // Safe placeholder so UI does not crash — checkout still requires env
    return {
      id: 'premium',
      label: 'Premium',
      description: 'Configure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and pricing table IDs',
      pricingTableId: '',
      publishableKey: '',
    };
  }
  return premium;
}
