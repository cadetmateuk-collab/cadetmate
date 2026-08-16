import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { stripeReturnUrls } from '@/lib/mobile/urls';
import { getPremiumPriceId, getCheckoutReturnOrigin } from '@/lib/security/env';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { isPremiumRole } from '@/lib/auth/roles';
import { getStripe } from '@/lib/stripe/client';

type CheckoutBody = {
  product?: string;
  packId?: string;
  slug?: string;
  source?: string;
  priceId?: string;
};

async function loadBillingProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('role, stripe_customer_id, email')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

function customerFields(opts: {
  customerId?: string | null;
  email?: string | null;
}): { customer: string } | { customer_email: string } | Record<string, never> {
  if (opts.customerId) return { customer: opts.customerId };
  if (opts.email) return { customer_email: opts.email };
  return {};
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUserApi();
    if (auth.error) return auth.error;
    const user = auth.user;

    let body: CheckoutBody = {};
    try {
      body = (await req.json()) as CheckoutBody;
    } catch {
      body = {};
    }

    const source = body.source === 'mobile' ? 'mobile' : 'web';
    const profile = await loadBillingProfile(user.id);
    const customer = customerFields({
      customerId: profile?.stripe_customer_id,
      email: user.email ?? profile?.email ?? null,
    });

    if (body.product === 'premium') {
      return createPremiumCheckout({
        userId: user.id,
        role: profile?.role,
        customer,
        source,
        origin: getCheckoutReturnOrigin(req),
      });
    }

    const packId = typeof body.packId === 'string' ? body.packId : '';
    const slug = typeof body.slug === 'string' ? body.slug : '';

    if (!packId) {
      return NextResponse.json({ error: 'packId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: pack, error: packError } = await supabase
      .from('flashcard_packs')
      .select('id, slug, stripe_price_id, price_cents, is_premium, title')
      .eq('id', packId)
      .maybeSingle();

    if (packError || !pack) {
      return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
    }

    if (!pack.stripe_price_id || (pack.price_cents ?? 0) <= 0) {
      return NextResponse.json(
        { error: 'This pack is free or has no Stripe price configured' },
        { status: 400 },
      );
    }

    if (typeof body.priceId === 'string' && body.priceId !== pack.stripe_price_id) {
      return NextResponse.json({ error: 'Invalid price for pack' }, { status: 400 });
    }

    const webOrigin = getCheckoutReturnOrigin(req);
    const packSlug = slug || pack.slug;
    const returns =
      source === 'mobile'
        ? stripeReturnUrls(packSlug, webOrigin)
        : {
            success_url: `${webOrigin}/flashcards/${packSlug}?success=1&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${webOrigin}/flashcards/${packSlug}`,
          };

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pack.stripe_price_id, quantity: 1 }],
      success_url: returns.success_url,
      cancel_url: returns.cancel_url,
      client_reference_id: user.id,
      ...customer,
      metadata: {
        user_id: user.id,
        pack_id: pack.id,
        source,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Stripe checkout error:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function createPremiumCheckout(opts: {
  userId: string;
  role?: string | null;
  customer: { customer: string } | { customer_email: string } | Record<string, never>;
  source: string;
  origin: string;
}) {
  if (isPremiumRole(opts.role)) {
    return NextResponse.json({ error: 'You already have Premium' }, { status: 400 });
  }

  const priceId = getPremiumPriceId();
  if (!priceId) {
    return NextResponse.json({ error: 'Premium is not configured' }, { status: 503 });
  }

  const metadata = {
    user_id: opts.userId,
    product_type: 'premium',
    source: opts.source,
  };

  const session = await getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${opts.origin}/store?premium=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${opts.origin}/pricing`,
    client_reference_id: opts.userId,
    ...opts.customer,
    metadata,
    subscription_data: { metadata },
  });

  return NextResponse.json({ url: session.url });
}
