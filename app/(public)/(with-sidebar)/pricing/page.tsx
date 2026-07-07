import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'Pricing',
  description: 'Simple, transparent pricing for maritime cadets. Start free, upgrade when you are ready.',
  path: '/pricing',
});

const FREE_FEATURES = [
  'Community access — post, comment, vote',
  'Daily quiz & question of the day',
  'Progress tracking & study streaks',
  'Limited flashcard packs',
  'Free blog & learning articles',
  'Community leaderboard',
];

const PREMIUM_FEATURES = [
  'All learning modules & unit guides',
  'Unlimited flashcards with spaced repetition',
  'Full oral question bank (2,500+ questions)',
  'Mock oral exams & timed quizzes',
  'Emergency scenario simulators',
  'TRB & Sea Survival resources',
  'Advanced progress analytics',
  'Certificates & premium badges',
  'Priority support',
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Simple, honest pricing</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          Start free. Upgrade when you are ready to unlock the full maritime training ecosystem.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="rounded-2xl border border-border p-8">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Free</p>
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
            <Link href="/auth?mode=signup">Create Free Account</Link>
          </Button>
        </div>

        <div className="rounded-2xl border-2 border-primary p-8 relative bg-primary/5">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Most Popular
            </span>
          </div>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Premium</p>
          <p className="text-4xl font-bold mt-2">See plans</p>
          <p className="text-sm text-muted-foreground mt-1">Full access to everything</p>
          <ul className="mt-6 space-y-3">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Button className="w-full mt-8" asChild>
            <Link href="/store">
              View Premium Plans <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-10">
        Premium content is always visible with previews — never hidden behind opaque paywalls.
      </p>
    </div>
  );
}
