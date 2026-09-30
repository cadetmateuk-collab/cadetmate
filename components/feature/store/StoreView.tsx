'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { PremiumPrice } from '@/lib/stripe/premium-price';
import { StoreHeader } from './StoreHeader';
import { PremiumBanner } from './PremiumBanner';
import { StoreCategoryTabs } from './StoreCategoryTabs';
import { ProductGrid } from './ProductGrid';
import { DigitalProductCard } from './DigitalProductCard';
import { PhysicalProductCard } from './PhysicalProductCard';
import { EmptyState } from './EmptyState';
import { StoreCheckoutStatus } from './StoreCheckoutStatus';
import { StoreTrustBar } from './StoreTrustBar';
import { getPhysicalProducts } from './physical-products';
import type { StoreKindFilter, StorePack } from './types';

export type { StorePack };

function matchesQuery(pack: StorePack, query: string) {
  if (!query) return true;
  const haystack = `${pack.title} ${pack.description} ${pack.category} ${(pack.tags ?? []).join(' ')}`.toLowerCase();
  return haystack.includes(query);
}

function scrollToId(id: string) {
  const reduce =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({
    behavior: reduce ? 'auto' : 'smooth',
    block: 'start',
  });
}

export function StoreView({
  packs,
  ownedPackIds,
  isPremium,
  price,
  pendingPremium,
  checkoutSessionId,
  loadError,
}: {
  packs: StorePack[];
  ownedPackIds: string[];
  isPremium: boolean;
  price: PremiumPrice | null;
  pendingPremium: boolean;
  checkoutSessionId: string | null;
  loadError?: string | null;
}) {
  const router = useRouter();
  const physical = useMemo(() => getPhysicalProducts(), []);
  const owned = useMemo(() => new Set(ownedPackIds), [ownedPackIds]);

  const [kind, setKind] = useState<StoreKindFilter>('all');
  const [subject, setSubject] = useState('all');
  const [query, setQuery] = useState('');
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  const [premiumReady, setPremiumReady] = useState(isPremium);
  const [activating, setActivating] = useState(pendingPremium && !isPremium);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingPremium || isPremium) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: checkoutSessionId ?? '' }),
        });
        const data = (await res.json()) as { premium?: boolean; error?: string };
        if (cancelled) return;
        if (res.ok && data.premium) {
          setPremiumReady(true);
          setActivating(false);
          setConfirmError(null);
          router.replace('/store');
          router.refresh();
          return;
        }
        setActivating(false);
        setConfirmError(
          data.error ??
            'Payment succeeded at Stripe, but Premium is not active on this account yet. Retry, or refresh this page.',
        );
      } catch {
        if (!cancelled) {
          setActivating(false);
          setConfirmError('Could not confirm checkout. Retry in a moment.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingPremium, isPremium, checkoutSessionId, router]);

  useEffect(() => {
    if (!pendingScroll) return;
    const id = pendingScroll;
    const frame = requestAnimationFrame(() => {
      scrollToId(id);
      setPendingScroll(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [kind, pendingScroll]);

  const subjects = useMemo(() => {
    const unique = Array.from(new Set(packs.map((pack) => pack.category).filter(Boolean)));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [packs]);

  const q = query.trim().toLowerCase();

  const digitalPacks = useMemo(() => {
    return packs.filter((pack) => {
      if (subject !== 'all' && pack.category !== subject) return false;
      return matchesQuery(pack, q);
    });
  }, [packs, subject, q]);

  const physicalProducts = useMemo(() => {
    if (!q) return physical;
    return physical.filter((product) =>
      `${product.name} ${product.description} ${product.category ?? ''}`.toLowerCase().includes(q),
    );
  }, [physical, q]);

  const showDigital = kind === 'all' || kind === 'digital';
  const showPhysical = kind === 'all' || kind === 'physical';

  function browseDigital() {
    setKind('digital');
    setPendingScroll('digital-resources');
  }

  function browsePhysical() {
    setKind('physical');
    setPendingScroll('physical-products');
  }

  function handleKindChange(next: StoreKindFilter) {
    setKind(next);
    if (next === 'physical') setSubject('all');
  }

  if (loadError) {
    return (
      <div className="pb-10">
        <StoreHeader onBrowseDigital={browseDigital} onBrowsePhysical={browsePhysical} />
        <EmptyState
          title="We couldn't load the store"
          description="Please try again."
          action={
            <Button type="button" onClick={() => window.location.reload()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  const nothingVisible =
    (showDigital ? digitalPacks.length === 0 : true) &&
    (showPhysical ? physicalProducts.length === 0 : true);

  return (
    <div className="pb-10">
      <StoreHeader onBrowseDigital={browseDigital} onBrowsePhysical={browsePhysical} />

      <StoreCheckoutStatus
        activating={activating}
        confirmError={confirmError}
        showSuccess={premiumReady && pendingPremium && !activating && !confirmError}
        onRetry={() => window.location.reload()}
      />

      <PremiumBanner isPremium={premiumReady} price={price} />

      <StoreCategoryTabs
        kind={kind}
        onKindChange={handleKindChange}
        subjects={subjects}
        subject={subject}
        onSubjectChange={setSubject}
        query={query}
        onQueryChange={setQuery}
        digitalCount={packs.length}
        physicalCount={physical.length}
      />

      {nothingVisible && (q || subject !== 'all') ? (
        <EmptyState
          title="Nothing here yet"
          description="No products match your filters. Try another category or search term."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery('');
                setSubject('all');
                setKind('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {kind === 'physical'
              ? `${physicalProducts.length} physical products`
              : `${digitalPacks.length} digital resources`}
          </p>
          {showDigital && (
            <section id="digital-resources" className="scroll-mt-24" aria-labelledby="digital-heading">
              <div className="mb-5">
                <h2 id="digital-heading" className="text-h3 font-bold tracking-tight">
                  Digital resources
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Instantly unlock resources directly in the app. Flashcard packs are sold separately from Premium.
                </p>
              </div>

              {digitalPacks.length === 0 ? (
                <EmptyState
                  title="Nothing here yet"
                  description="We're adding more products soon."
                />
              ) : (
                <ProductGrid>
                  {digitalPacks.map((pack) => (
                    <DigitalProductCard key={pack.id} pack={pack} owned={owned.has(pack.id)} />
                  ))}
                </ProductGrid>
              )}
            </section>
          )}

          {showPhysical && (
            <section
              id="physical-products"
              className={showDigital ? 'mt-12 scroll-mt-24' : 'scroll-mt-24'}
              aria-labelledby="physical-heading"
            >
              <div className="mb-5">
                <h2 id="physical-heading" className="text-h3 font-bold tracking-tight">
                  Physical products
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Study essentials, made for everyday use.
                </p>
              </div>

              {physicalProducts.length === 0 ? (
                <EmptyState
                  title="Nothing here yet"
                  description="We're adding more products soon. Digital study resources are available in the store now."
                  action={
                    <Button type="button" variant="outline" onClick={browseDigital}>
                      Browse digital resources
                    </Button>
                  }
                />
              ) : (
                <ProductGrid className="md:grid-cols-3 lg:grid-cols-4">
                  {physicalProducts.map((product) => (
                    <PhysicalProductCard key={product.id} product={product} />
                  ))}
                </ProductGrid>
              )}
            </section>
          )}
        </>
      )}

      <StoreTrustBar />
    </div>
  );
}
