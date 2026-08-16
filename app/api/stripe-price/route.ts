import { NextRequest, NextResponse } from 'next/server';
import { requireStaffApi } from '@/lib/auth/require-permission-api';
import { getStripe } from '@/lib/stripe/client';

export async function GET(req: NextRequest) {
  const auth = await requireStaffApi();
  if ('error' in auth) return auth.error;

  const priceId = req.nextUrl.searchParams.get('priceId');
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });

  try {
    const price = await getStripe().prices.retrieve(priceId);
    const currency = (price.currency || 'gbp').toUpperCase();
    const amount = (price.unit_amount ?? 0) / 100;
    const display = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
    }).format(amount);

    return NextResponse.json({
      unit_amount: price.unit_amount,
      currency: price.currency,
      display,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
