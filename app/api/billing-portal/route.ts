import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getCheckoutReturnOrigin } from '@/lib/security/env';
import { requireUserApi } from '@/lib/auth/require-user-api';
import { getStripe } from '@/lib/stripe/client';
import { stripePublicError } from '@/lib/stripe/public-error';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUserApi();
    if (auth.error) return auth.error;

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', auth.user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account yet. Subscribe to Premium first.' },
        { status: 400 },
      );
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getCheckoutReturnOrigin(req)}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Stripe billing portal error:', err);
    return NextResponse.json({ error: stripePublicError() }, { status: 500 });
  }
}
