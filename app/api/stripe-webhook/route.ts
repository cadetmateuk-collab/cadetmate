import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const { user_id, pack_id } = session.metadata!;

    const supabase = await createClient();  // ← inside the function, with await
    await supabase.from('flashcard_pack_ownership').upsert(
      { user_id, pack_id, source: 'stripe', stripe_session_id: session.id },
      { onConflict: 'user_id,pack_id' }
    );
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } }; // raw body needed