import type Stripe from 'stripe';
import { isProtectedStaffRole } from '@cadet-mate/shared';
import { getPremiumPriceId } from '@/lib/security/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkoutIsPremium, parsePremiumPriceIds } from '@/lib/stripe/access';

/** Stripe Price IDs that grant Premium (singular env + optional extra allowlist). */
export function premiumPriceIds(): Set<string> {
  return new Set(parsePremiumPriceIds(getPremiumPriceId(), process.env.STRIPE_PREMIUM_PRICE_IDS));
}

export function isPremiumCheckout(
  session: Stripe.Checkout.Session,
  linePriceIds: string[],
): boolean {
  return checkoutIsPremium({
    packId: session.metadata?.pack_id,
    linePriceIds,
    allowedPriceIds: premiumPriceIds(),
  });
}

export async function resolveUserIdFromCheckout(
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const metaUser = session.metadata?.user_id;
  if (metaUser) return metaUser;
  if (session.client_reference_id) return session.client_reference_id;

  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (customerId) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

export async function grantPremium(opts: {
  userId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  notify?: boolean;
}) {
  const { userId, customerId, subscriptionId, notify = true } = opts;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, premium_status')
    .eq('id', userId)
    .maybeSingle();

  const alreadyActive = profile?.premium_status === 'active';
  const shouldNotify = notify && !alreadyActive;

  const patch: Record<string, unknown> = {
    premium_status: 'active',
    updated_at: new Date().toISOString(),
  };
  if (customerId) patch.stripe_customer_id = customerId;
  if (subscriptionId) patch.stripe_subscription_id = subscriptionId;
  if (!isProtectedStaffRole(profile?.role)) patch.role = 'premium';

  await supabaseAdmin.from('profiles').update(patch).eq('id', userId);

  if (shouldNotify) {
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('in_app_billing')
      .eq('user_id', userId)
      .maybeSingle();

    if (prefs?.in_app_billing !== false) {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'billing',
        title: 'Premium unlocked',
        body: 'Your CadetMate Premium subscription is active.',
        href: '/dashboard',
      });
    }
  }

  await supabaseAdmin.from('user_achievements').upsert(
    {
      user_id: userId,
      achievement_id: 'premium_member',
    },
    { onConflict: 'user_id,achievement_id', ignoreDuplicates: true },
  );
}

export async function revokePremium(opts: {
  userId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
}) {
  let userId = opts.userId ?? null;

  if (!userId && opts.subscriptionId) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('stripe_subscription_id', opts.subscriptionId)
      .maybeSingle();
    userId = data?.id ?? null;
    if (isProtectedStaffRole(data?.role)) return;
  }

  if (!userId && opts.customerId) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('stripe_customer_id', opts.customerId)
      .maybeSingle();
    userId = data?.id ?? null;
    if (isProtectedStaffRole(data?.role)) return;
  }

  if (!userId) return;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  if (isProtectedStaffRole(profile?.role)) return;

  await supabaseAdmin
    .from('profiles')
    .update({
      role: 'free',
      stripe_subscription_id: null,
      premium_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'billing',
    title: 'Premium ended',
    body: 'Your Premium access has ended. Resubscribe anytime from the store.',
    href: '/store',
  });
}
