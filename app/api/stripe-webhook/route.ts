import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getStripeWebhookSecret } from '@/lib/security/env';
import { grantPremium, revokePremium } from '@/lib/stripe/entitlements';
import { fulfillCheckoutSession } from '@/lib/stripe/fulfill';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, getStripeWebhookSecret());
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session);
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
