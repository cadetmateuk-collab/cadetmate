import { NextResponse } from 'next/server';
import { getPremiumPrice } from '@/lib/stripe/premium-price';

export async function GET() {
  const price = await getPremiumPrice();
  if (!price) {
    return NextResponse.json({ error: 'Premium price not configured' }, { status: 503 });
  }
  return NextResponse.json(price);
}
