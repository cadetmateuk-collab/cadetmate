// app/api/stripe-price/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  const priceId = req.nextUrl.searchParams.get('priceId');
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });

  try {
    const price = await stripe.prices.retrieve(priceId);
    return NextResponse.json({
      unit_amount: price.unit_amount,       // e.g. 499 for £4.99
      currency: price.currency,             // e.g. "gbp"
      display: `£${((price.unit_amount ?? 0) / 100).toFixed(2)}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}