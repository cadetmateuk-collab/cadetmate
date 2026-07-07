import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Mic, HelpCircle, Zap, Target, GraduationCap, Lock, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { PremiumTeaser } from '@/components/dashboard/DashboardWidgets';
import QuestionOfDay from '@/components/QuestionOfDay';
import { HashScrollSync } from '@/components/navigation/HashScrollSync';

export const metadata: Metadata = buildPageMetadata({
  title: 'Practice',
  description: 'Test your knowledge with quizzes, mock exams, and simulators.',
  path: '/practice',
  noIndex: true,
});

const PRACTICE_ITEMS = [
  {
    href: '/practice?tab=mock-oral',
    label: 'Mock Oral Exams',
    icon: Mic,
    premium: true,
    description: 'Simulated MCA oral exam sessions',
    stats: '2,500+ questions',
  },
  {
    href: '/practice?tab=oral-questions',
    label: 'Oral Questions',
    icon: HelpCircle,
    premium: true,
    description: 'Browse the full oral question bank',
    stats: 'By topic',
  },
  {
    href: '/simulator',
    label: 'Emergency Simulators',
    icon: Zap,
    premium: true,
    description: 'Real-world emergency scenario training',
    stats: '12 scenarios',
  },
  {
    href: '/practice#daily-quiz',
    label: 'Quick Quiz',
    icon: Target,
    description: 'Daily question of the day',
    stats: 'Free daily',
  },
  {
    href: '/modules/signals/morse-receiver-quiz',
    label: 'Morse Code Quiz',
    icon: Target,
    description: 'Test your morse signal recognition',
    stats: 'Signals',
  },
  {
    href: '/practice?tab=scenarios',
    label: 'Scenario Challenges',
    icon: GraduationCap,
    premium: true,
    description: 'Timed scenario-based challenges',
    stats: 'Coming soon',
  },
];

export default async function PracticePage() {
  const user = await getCurrentUser();
  const isPremium = user?.profile?.role === 'premium' || user?.profile?.role === 'admin';

  return (
    <div className="py-8">
      <Suspense fallback={null}>
        <HashScrollSync />
      </Suspense>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Practice</h1>
        <p className="text-muted-foreground mt-1">Separate learning from testing — challenge yourself</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {PRACTICE_ITEMS.map((item) => {
          const locked = item.premium && !isPremium;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={locked ? '/store' : item.href}
              className="relative p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all group"
            >
              {locked && (
                <span className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                  <Lock className="h-3 w-3" /> Premium
                </span>
              )}
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <p className="font-semibold">{item.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{item.stats}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {!isPremium && (
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <PremiumTeaser
            title="Unlock all 2,500 oral questions"
            description="Full question bank with timed mock oral exams and detailed feedback."
          />
          <PremiumTeaser
            title="Complete all emergency scenarios"
            description="Practice bridge team management during emergencies."
          />
        </div>
      )}

      <section id="daily-quiz" className="scroll-mt-24 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold mb-1">Daily Challenge</h2>
        <p className="text-sm text-muted-foreground mb-4">Question of the day — answer to keep your streak going.</p>
        <QuestionOfDay />
      </section>
    </div>
  );
}
