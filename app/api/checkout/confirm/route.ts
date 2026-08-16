import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { getStripe } from '@/lib/stripe/client';
import { fulfillCheckoutSession, findLatestPaidSessionForUser } from '@/lib/stripe/fulfill';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUserApi();
    if (auth.error) return auth.error;

    let sessionId = '';
    try {
      const body = (await req.json()) as { sessionId?: string };
      sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
    } catch {
      sessionId = '';
    }

    const stripe = getStripe();
    let session = sessionId.startsWith('cs_')
      ? await stripe.checkout.sessions.retrieve(sessionId)
      : null;

    if (!session) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('stripe_customer_id, email')
        .eq('id', auth.user.id)
        .maybeSingle();

      session = await findLatestPaidSessionForUser({
        userId: auth.user.id,
        email: auth.user.email ?? profile?.email ?? null,
        customerId: profile?.stripe_customer_id ?? null,
      });
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No completed checkout found for this account yet.' },
        { status: 404 },
      );
    }

    const belongsToUser =
      session.metadata?.user_id === auth.user.id ||
      session.client_reference_id === auth.user.id;
    if (!belongsToUser) {
      return NextResponse.json({ error: 'Checkout does not belong to this account' }, { status: 403 });
    }

    const result = await fulfillCheckoutSession(session);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'unpaid' ? 'Payment is not complete yet' : 'Could not activate Premium' },
        { status: 402 },
      );
    }

    return NextResponse.json({
      ok: true,
      premium: result.premium,
      packId: result.packId,
    });
  } catch (err: unknown) {
    console.error('Stripe checkout confirm error:', err);
    const message = err instanceof Error ? err.message : 'Stripe error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
