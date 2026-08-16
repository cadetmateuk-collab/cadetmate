'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  Layers,
  Lock,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { redirectToPackCheckout } from '@/lib/stripe/client-actions';
import { ProductCover } from './ProductCover';
import { difficultyLabel, packPriceLabel } from './format';
import type { StorePack } from './types';

const INCLUDED = [
  'Full flashcard pack with spaced-repetition study modes',
  'Progress tracking across your account',
  'Instant unlock in the CadetMate app after purchase',
];

export function ProductDetail({
  pack,
  owned,
}: {
  pack: StorePack;
  owned: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [ownedNow, setOwnedNow] = useState(owned);
  const [error, setError] = useState<string | null>(null);

  const isFree = !pack.price_cents;
  const canBuy = !ownedNow && !isFree && !!pack.stripe_price_id;
  const price = packPriceLabel(pack);
  const difficulty = difficultyLabel(pack.difficulty);

  async function purchase() {
    setError(null);
    setBusy(true);
    try {
      if (isFree) {
        const supabase = createClient();
        const { error: claimError } = await supabase.rpc('claim_free_flashcard_pack', {
          p_pack_id: pack.id,
        });
        if (claimError) throw new Error(claimError.message ?? 'Could not unlock pack.');
        setOwnedNow(true);
        router.refresh();
        setBusy(false);
        return;
      }

      void import('@/lib/analytics').then(({ trackConversion, trackClick }) => {
        trackClick('unlock_flashcard_pack', {
          pack_id: pack.id,
          slug: pack.slug,
          location: 'store_detail',
        });
        trackConversion('begin_checkout', {
          content_type: 'flashcard_pack',
          item_id: pack.id,
          item_name: pack.title,
          value: pack.price_cents / 100,
          currency: 'GBP',
        });
      });
      await redirectToPackCheckout(pack.id, pack.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setBusy(false);
    }
  }

  return (
    <div className="pb-10">
      <Link
        href="/store"
        className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to store
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:items-start">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <ProductCover
            src={pack.thumbnail_url}
            alt={`${pack.title} cover`}
            title={pack.title}
            className="aspect-[4/3] sm:aspect-[16/10]"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge border border-border bg-card text-foreground">Digital</span>
            <span className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground">
              <Smartphone className="h-3.5 w-3.5" aria-hidden />
              Unlocks in app
            </span>
          </div>

          <p className="mt-4 text-label font-semibold uppercase tracking-wider text-muted-foreground">
            Flashcard pack — {pack.category}
          </p>
          <h1 className="mt-1 text-balance text-h2 font-extrabold tracking-tight">{pack.title}</h1>
          {pack.description ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-body">
              {pack.description}
            </p>
          ) : null}

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <DetailStat label="Cards" value={`${pack.card_count}`} />
            <DetailStat label="Subject" value={pack.category} />
            {difficulty ? <DetailStat label="Level" value={difficulty} /> : null}
          </dl>

          {pack.tags && pack.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
              {pack.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-label font-medium text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-6 border-t border-border pt-5">
            <p className="text-2xl font-extrabold tabular-nums tracking-tight">{ownedNow ? 'Owned' : price}</p>
            <p className="mt-1 text-caption text-muted-foreground">
              {ownedNow
                ? 'This pack is unlocked on your account.'
                : isFree
                  ? 'Free to claim. Available immediately in your flashcard library.'
                  : 'One-time purchase. Premium subscription does not include flashcard packs.'}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {ownedNow ? (
                <Button className="w-full sm:w-auto" asChild>
                  <Link href={`/flashcards/${pack.slug}`}>Study pack</Link>
                </Button>
              ) : canBuy || isFree ? (
                <Button className="w-full sm:w-auto" onClick={purchase} disabled={busy}>
                  {busy
                    ? isFree
                      ? 'Unlocking…'
                      : 'Redirecting…'
                    : isFree
                      ? 'Claim free pack'
                      : `Buy now · ${price}`}
                </Button>
              ) : (
                <Button className="w-full sm:w-auto" variant="outline" disabled>
                  <Lock className="h-4 w-4" aria-hidden />
                  Price not configured
                </Button>
              )}
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/flashcards">Flashcard library</Link>
              </Button>
            </div>
            {error ? (
              <p role="alert" className="mt-3 text-sm text-port">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">What is included</h2>
          <ul className="mt-4 space-y-3">
            <li className="flex gap-2.5 text-sm text-muted-foreground">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {pack.card_count} {pack.card_count === 1 ? 'flashcard' : 'flashcards'} covering {pack.category}
            </li>
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-base font-semibold tracking-tight">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1. Purchase or claim</span>
              <p className="mt-0.5">Pay securely with Stripe, or claim the pack if it is free.</p>
            </li>
            <li>
              <span className="font-medium text-foreground">2. Unlocks in the app</span>
              <p className="mt-0.5">The pack appears in your flashcard library straight after payment.</p>
            </li>
            <li>
              <span className="font-medium text-foreground">3. Study on any device</span>
              <p className="mt-0.5">Open it on the web or in the CadetMate app and start a session.</p>
            </li>
          </ol>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-base font-semibold tracking-tight">Who it is for</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Built for UK deck cadets revising {pack.category}
          {difficulty ? ` at ${difficulty.toLowerCase()} level` : ''}. Use it alongside modules and oral practice —
          this pack is a focused set of cards, not a substitute for Premium platform access.
        </p>
        {pack.is_premium ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-caption font-medium text-brass">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Paid study resource — sold separately from CadetMate Premium.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5">
      <dt className="text-label font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-semibold text-foreground">{value}</dd>
    </div>
  );
}
