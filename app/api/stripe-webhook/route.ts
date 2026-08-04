import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  grantPremium,
  isPremiumCheckout,
  resolveUserIdFromCheckout,
  revokePremium,
} from '@/lib/stripe/entitlements';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error('[stripe-webhook]', event.type, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function lineItemPriceIds(session: Stripe.Checkout.Session): Promise<string[]> {
  if (!session.id) return [];
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 20 });
    return items.data
      .map((li) => (typeof li.price === 'string' ? li.price : li.price?.id))
      .filter((id): id is string => !!id);
  } catch {
    return [];
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = await resolveUserIdFromCheckout(session);
  const packId = session.metadata?.pack_id;
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id ?? null;

  // Flashcard pack one-offs — verify paid line item matches pack.stripe_price_id
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
      await supabaseAdmin.from('flashcard_pack_ownership').upsert(
        {
          user_id: userId,
          pack_id: packId,
          source: 'stripe',
          stripe_session_id: session.id,
        },
        { onConflict: 'user_id,pack_id' },
      );
    } else {
      console.error('[stripe-webhook] Pack grant rejected — price mismatch', {
        packId,
        prices,
        expected: pack?.stripe_price_id,
      });
    }
  }

  const prices = await lineItemPriceIds(session);
  if (userId && isPremiumCheckout(session, prices)) {
    await grantPremium({
      userId,
      customerId,
      subscriptionId,
    });
  } else if (userId && customerId) {
    // Remember customer for later subscription events even if not premium yet
    await supabaseAdmin
      .from('profiles')
      .update({
        stripe_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const status = sub.status;
  const active = status === 'active' || status === 'trialing';

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  let userId = profile?.id ?? null;
  if (!userId && sub.metadata?.user_id) userId = sub.metadata.user_id;

  if (!userId) return;

  if (active) {
    await grantPremium({
      userId,
      customerId,
      subscriptionId: sub.id,
      notify: false,
    });
  } else if (status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') {
    await revokePremium({ userId, customerId, subscriptionId: sub.id });
  } else {
    await supabaseAdmin
      .from('profiles')
      .update({
        premium_status: status,
        stripe_subscription_id: sub.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  await revokePremium({
    customerId,
    subscriptionId: sub.id,
    userId: sub.metadata?.user_id,
  });
}
