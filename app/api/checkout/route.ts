import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { packId, priceId, slug } = await req.json();

    if (!priceId) return NextResponse.json({ error: 'No price ID' }, { status: 400 });

    const supabase = await createClient();  // ← await added
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_URL}/flashcards/${slug}?success=1`,
      cancel_url:  `${process.env.NEXT_PUBLIC_URL}/flashcards/${slug}`,
      metadata: { user_id: user.id, pack_id: packId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: err.message ?? 'Stripe error' }, { status: 500 });
  }
}