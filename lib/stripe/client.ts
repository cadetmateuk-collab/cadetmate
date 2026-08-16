import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/security/env';

let stripe: Stripe | null = null;

/** Lazy Stripe SDK — avoids throwing at import time when env is missing. */
export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(getStripeSecretKey());
  }
  return stripe;
}
