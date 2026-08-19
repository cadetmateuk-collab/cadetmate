import type Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { sessionPaid } from '@/lib/stripe/access';
import {
  grantPremium,
  isPremiumCheckout,
  resolveUserIdFromCheckout,
} from '@/lib/stripe/entitlements';
import { packOwnershipGrantRow } from '@/lib/stripe/webhook-ledger';

export type FulfillResult = {
  ok: boolean;
  userId: string | null;
  premium: boolean;
  packId: string | null;
  reason?: string;
};

async function lineItemPriceIds(session: Stripe.Checkout.Session): Promise<string[]> {
  if (!session.id) return [];
  try {
    const items = await getStripe().checkout.sessions.listLineItems(session.id, { limit: 20 });
    return items.data
      .map((li) => (typeof li.price === 'string' ? li.price : li.price?.id))
      .filter((id): id is string => !!id);
  } catch {
    return [];
  }
}

function checkoutSessionPaid(session: Stripe.Checkout.Session): boolean {
  return sessionPaid(session.payment_status);
}

/** Grant pack ownership and/or Premium from a completed Checkout session. Idempotent. */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  if (!checkoutSessionPaid(session)) {
    return { ok: false, userId: null, premium: false, packId: null, reason: 'unpaid' };
  }

  const userId = await resolveUserIdFromCheckout(session);
  const packId = session.metadata?.pack_id ?? null;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  if (packId && userId) {
    const { data: pack } = await supabaseAdmin
      .from('flashcard_packs')
      .select('id, stripe_price_id, price_cents')
      .eq('id', packId)
      .maybeSingle();

    const prices = await lineItemPriceIds(session);
    const priceOk =
      !!pack?.stripe_price_id &&
      prices.includes(pack.stripe_price_id) &&
      (pack.price_cents ?? 0) > 0;

    if (priceOk) {
      const { error: grantError } = await supabaseAdmin.from('flashcard_pack_ownership').upsert(
        packOwnershipGrantRow({ userId, packId, sessionId: session.id }),
        { onConflict: 'user_id,pack_id' },
      );
      if (grantError) {
        console.error('[stripe] Pack grant failed', { packId, userId, message: grantError.message });
        return { ok: false, userId, premium: false, packId, reason: 'pack_grant_failed' };
      }
    } else {
      console.error('[stripe] Pack grant rejected — price mismatch', {
        packId,
        prices,
        expected: pack?.stripe_price_id,
      });
    }
  }

  const prices = await lineItemPriceIds(session);
  const premium = !!(userId && isPremiumCheckout(session, prices));
  if (premium && userId) {
    await grantPremium({
      userId,
      customerId,
      subscriptionId,
    });
  } else if (userId && customerId) {
    await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  return { ok: true, userId, premium, packId };
}

export async function revokePackOwnership(opts: {
  userId: string;
  packId: string;
}): Promise<void> {
  await supabaseAdmin
    .from('flashcard_pack_ownership')
    .delete()
    .eq('user_id', opts.userId)
    .eq('pack_id', opts.packId);
}

export async function findLatestPaidSessionForUser(opts: {
  userId: string;
  email?: string | null;
  customerId?: string | null;
}): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
  const customerIds: string[] = [];
  if (opts.customerId) customerIds.push(opts.customerId);

  if (opts.email) {
    const customers = await stripe.customers.list({ email: opts.email, limit: 5 });
    for (const c of customers.data) {
      if (!customerIds.includes(c.id)) customerIds.push(c.id);
    }
  }

  for (const customer of customerIds) {
    const listed = await stripe.checkout.sessions.list({ customer, limit: 10 });
    const match = listed.data.find(
      (s) =>
        sessionPaid(s.payment_status) &&
        (s.metadata?.user_id === opts.userId || s.client_reference_id === opts.userId),
    );
    if (match) return match;
  }

  return null;
}
