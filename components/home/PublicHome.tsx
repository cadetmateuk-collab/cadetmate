'use client';

import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  Trophy,
  Clock,
  Newspaper,
  MessageSquare,
  Mic,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  WelcomeHeader,
  StatCards,
  ContinueLearningCard,
  OverallProgressCard,
  UpcomingCard,
  AnnouncementsCard,
  QuickLinksCard,
} from '@/components/dashboard/DashboardHome';

export type PublicHomeData = {
  stats: {
    users: number;
    modules: number;
    flashcards: number;
    posts: number;
    questions: number;
    simulators: number;
  };
  posts: Array<{
    id: string;
    title: string;
    body: string;
    vote_score: number;
    created_at: string;
  }>;
};

/** Public home — same dashboard composition as the mockup, with guest CTAs */
export function PublicHome({ data }: { data: PublicHomeData }) {
  const { stats, posts } = data;

  return (
    <div className="min-h-full pb-8">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] px-4 py-3.5">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Train for COLREGS, TRB &amp; MCA orals in one place
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Free guides to start — upgrade when you&apos;re ready for full modules and practice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link
            href="/auth?mode=signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 min-h-[44px]"
          >
            <Sparkles className="h-4 w-4" />
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-slate-50 min-h-[44px]"
          >
            View pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <WelcomeHeader firstName="Cadet" />

      <StatCards
        items={[
          {
            label: 'Learning Modules',
            value: stats.modules || 40,
            href: '/pricing',
            linkLabel: 'Explore',
            icon: BookOpen,
            accent: 'blue',
          },
          {
            label: 'Practice Tools',
            value: stats.simulators || 12,
            href: '/pricing',
            linkLabel: 'See tools',
            icon: ClipboardList,
            accent: 'green',
          },
          {
            label: 'Flashcards',
            value: stats.flashcards || 500,
            href: '/pricing',
            linkLabel: 'Preview',
            icon: Trophy,
            accent: 'amber',
          },
          {
            label: 'Cadets Learning',
            value: stats.users || 100,
            href: '/community-preview',
            linkLabel: 'Community',
            icon: Clock,
            accent: 'violet',
          },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-5 mb-5">
        <div className="xl:col-span-3">
          <ContinueLearningCard
            title="Bridge Watchkeeping (OOW)"
            description="Master lookout duties, watch handovers, and bridge procedures for your oral exam."
            progress={65}
            href="/auth?mode=signup"
            buttonLabel="Start Learning Free"
          />
        </div>
        <div className="xl:col-span-2">
          <OverallProgressCard
            overall={72}
            completed={12}
            inProgress={5}
            notStarted={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
        <UpcomingCard
          items={[
            {
              title: 'COLREGs Assessment',
              meta: 'Rule of the road practice',
              tag: 'Assessment',
              tagTone: 'amber',
              href: '/free-content?q=COLREGS',
            },
            {
              title: 'Mock Oral Prep',
              meta: 'MCA oral exam training',
              tag: 'Practice',
              tagTone: 'blue',
              href: '/pricing',
            },
            {
              title: 'TRB Guidance',
              meta: 'Sea-phase task support',
              tag: 'Guide',
              tagTone: 'green',
              href: '/free-content?q=TRB',
            },
          ]}
        />

        <AnnouncementsCard
          items={
            posts.length > 0
              ? posts.slice(0, 3).map((p) => ({
                  title: p.title,
                  time: new Date(p.created_at).toLocaleDateString(),
                  href: '/community-preview',
                  icon: MessageSquare,
                }))
              : [
                  {
                    title: 'New COLREGS guides available',
                    time: '2 days ago',
                    href: '/free-content',
                    icon: Newspaper,
                  },
                  {
                    title: 'Join the cadet community',
                    time: 'This week',
                    href: '/community-preview',
                    icon: MessageSquare,
                  },
                  {
                    title: 'Try premium practice tools',
                    time: 'New',
                    href: '/pricing',
                    icon: Mic,
                  },
                ]
          }
        />

        <QuickLinksCard
          links={[
            { label: 'Browse Free Content', href: '/free-content', icon: Newspaper },
            { label: 'Free Resources', href: '/resources', icon: BookOpen },
            { label: 'Community Preview', href: '/community-preview', icon: MessageSquare },
            { label: 'Pricing', href: '/pricing', icon: Trophy },
            { label: 'About CadetMate', href: '/about', icon: ClipboardList },
            { label: 'Contact Support', href: '/contact', icon: Mic },
          ]}
        />
      </div>
    </div>
  );
}
