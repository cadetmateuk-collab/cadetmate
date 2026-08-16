import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth/get-user';
import { isPremiumRole } from '@/lib/auth/roles';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  buildOrganizationSchema,
  buildBreadcrumbSchema,
  buildServiceSchema,
  buildOfferCatalogSchema,
  buildFAQSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrackedLink } from '@/components/analytics/TrackedLink';
import { PricingCta } from '@/components/billing/PricingCta';
import { getPremiumPrice } from '@/lib/stripe/premium-price';

export const metadata: Metadata = buildPageMetadata({
  title: 'Pricing — Free & Premium UK Deck Cadet Training',
  description:
    'CadetMate pricing for UK deck cadets. Free plan: community, quizzes, limited flashcards, free guides. Premium: full modules, COLREGS revision, MCA oral practice, and simulators.',
  path: '/pricing',
  keywords: [
    'CadetMate pricing',
    'deck cadet app cost',
    'maritime training subscription UK',
    'MCA oral prep premium',
    'free cadet learning app',
  ],
});

const FREE_FEATURES = [
  'Community access — post, comment, vote',
  'Daily quiz & question of the day',
  'Progress tracking & study streaks',
  'Limited free flashcard packs',
  'Free blog & learning articles',
  'Community leaderboard',
];

const PREMIUM_FEATURES = [
  'All learning modules & unit guides',
  'Full oral question bank (2,500+ questions)',
  'Mock oral exams & timed quizzes',
  'Emergency scenario simulators',
  'TRB & Sea Survival resources',
  'Advanced progress analytics',
  'Certificates & premium badges',
  'Priority support',
];

const PRICING_FAQS = [
  {
    question: 'Is there a free CadetMate plan?',
    answer:
      'Yes. The free plan includes community access, daily quizzes, progress tracking, limited flashcards, and free learning articles — forever free for cadets.',
  },
  {
    question: 'What does Premium include?',
    answer:
      'Premium unlocks all learning modules, the full oral question bank, mock orals, simulators, TRB and sea survival resources, and advanced analytics. Flashcard packs are sold separately in the store.',
  },
  {
    question: 'Can I try CadetMate before upgrading?',
    answer:
      'Absolutely. Create a free account and explore community features and free content. Upgrade only when you are ready for the full training ecosystem.',
  },
  {
    question: 'Are flashcards included with Premium?',
    answer:
      'No. Flashcard packs are à-la-carte. Free packs can be claimed in the store; paid packs are purchased individually. Premium is for modules, orals, simulators, and TRB tools.',
  },
];

export default async function PricingPage() {
  const [price, user] = await Promise.all([getPremiumPrice(), getCurrentUser()]);
  const isAuthenticated = !!user;
  const isPremium = isPremiumRole(user?.profile?.role);
  const priceLabel = price?.formattedWithInterval ?? null;
  const faqSchema = buildFAQSchema(PRICING_FAQS);

  return (
    <div className="mx-auto w-full py-12 sm:py-16">
      <JsonLd data={buildOrganizationSchema()} />
      <JsonLd data={buildServiceSchema()} />
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: 'Home', path: '/home' },
          { name: 'Pricing', path: '/pricing' },
        ])}
      />
      <JsonLd
        data={buildOfferCatalogSchema([
          {
            name: 'CadetMate Free',
            description: 'Community, quizzes, limited flashcards, and free articles for UK deck cadets.',
            price: '0',
            url: '/auth?mode=signup',
          },
          {
            name: 'CadetMate Premium',
            description:
              'Full modules, oral banks, simulators, and TRB resources. Flashcard packs sold separately.',
            price: price ? (price.amountCents / 100).toFixed(2) : undefined,
            priceCurrency: price?.currency?.toUpperCase(),
            url: '/pricing',
          },
        ])}
      />
      {faqSchema && <JsonLd data={faqSchema} />}

      <div className="text-center mb-12">
        <h1 className="text-h1 font-bold tracking-tight text-balance">Free &amp; Premium plans for UK deck cadets</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Start free for community, quizzes, and guides. Upgrade for full modules, COLREGS revision tools, and MCA oral practice.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full">
        <div className="rounded-2xl border border-border p-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Free</h2>
          <p className="text-4xl font-bold mt-2">£0</p>
          <p className="text-sm text-muted-foreground mt-1">Forever free for cadets</p>
          <ul className="mt-6 space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full mt-8" asChild>
            <TrackedLink href="/auth?mode=signup" trackLabel="pricing_create_free_account" trackParams={{ plan: 'free' }}>
              Create Free Account
            </TrackedLink>
          </Button>
        </div>

        <div className="rounded-2xl border-2 border-primary p-8 relative bg-primary/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Most Popular
            </span>
          </div>
          <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Premium</h2>
          <p className="text-4xl font-bold mt-2">{price?.formatted ?? '—'}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {price?.interval ? `Billed per ${price.interval}` : 'Full access to Premium training'}
          </p>
          <ul className="mt-6 space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <PricingCta
            isAuthenticated={isAuthenticated}
            isPremium={isPremium}
            priceLabel={priceLabel}
          />
        </div>
      </div>

      <section className="mt-16 max-w-3xl mx-auto" aria-labelledby="pricing-faq-heading">
        <h2 id="pricing-faq-heading" className="text-2xl font-bold text-center mb-8">
          Pricing FAQ
        </h2>
        <div className="space-y-6">
          {PRICING_FAQS.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold text-base">{faq.question}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Flashcard packs are sold separately in the store.{' '}
        <TrackedLink href="/store" className="text-primary hover:underline" trackLabel="pricing_open_store">
          Open the store
        </TrackedLink>
        {' · '}
        <TrackedLink href="/free-content" className="text-primary hover:underline" trackLabel="pricing_browse_free_articles">
          Browse free articles
        </TrackedLink>
        {' · '}
        <TrackedLink href="/about" className="text-primary hover:underline" trackLabel="pricing_about">
          About CadetMate
        </TrackedLink>
      </p>
    </div>
  );
}
