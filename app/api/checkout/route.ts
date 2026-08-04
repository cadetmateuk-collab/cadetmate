import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL, stripeReturnUrls } from '@/lib/mobile/urls';
import { getStripeSecretKey } from '@/lib/security/env';
import { requireUserApi } from '@/lib/auth/require-user-api';

const stripe = new Stripe(getStripeSecretKey());

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUserApi();
    if (auth.error) return auth.error;
    const user = auth.user;

    const body = await req.json();
    const packId = typeof body.packId === 'string' ? body.packId : '';
    const slug = typeof body.slug === 'string' ? body.slug : '';
    const source = body.source === 'mobile' ? 'mobile' : 'web';

    if (!packId) {
      return NextResponse.json({ error: 'packId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Never trust client priceId — load pack from DB
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

    // Reject client-supplied priceId if present and mismatched
    if (typeof body.priceId === 'string' && body.priceId !== pack.stripe_price_id) {
      return NextResponse.json({ error: 'Invalid price for pack' }, { status: 400 });
    }

    const webOrigin = process.env.NEXT_PUBLIC_URL || SITE_URL;
    const packSlug = slug || pack.slug;
    const returns =
      source === 'mobile'
        ? stripeReturnUrls(packSlug, webOrigin)
        : {
            success_url: `${webOrigin}/flashcards/${packSlug}?success=1`,
            cancel_url: `${webOrigin}/flashcards/${packSlug}`,
          };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pack.stripe_price_id, quantity: 1 }],
      success_url: returns.success_url,
      cancel_url: returns.cancel_url,
      client_reference_id: user.id,
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
