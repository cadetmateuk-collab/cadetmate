import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  BookOpen, WalletCards, FileText, Anchor, Compass, Navigation, Cloud, Package, Search, ArrowRight, Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { PremiumTeaser } from '@/components/dashboard/DashboardWidgets';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = buildPageMetadata({
  title: 'Learn',
  description: 'All maritime learning resources in one place.',
  path: '/learn',
  noIndex: true,
});

const LEARN_SECTIONS = [
  { href: '/flashcards', label: 'Flashcards', icon: WalletCards, premium: true, description: 'Spaced repetition study packs' },
  { href: '/unit-modules', label: 'Learning Modules', icon: BookOpen, premium: true, description: 'Interactive unit modules' },
  { href: '/trb', label: 'TRB', icon: FileText, premium: true, description: 'Training Record Book tasks' },
  { href: '/sea-survival', label: 'Sea Survival', icon: Anchor, premium: true, description: 'STCW sea survival articles' },
  { href: '/unit-modules?category=colregs', label: 'COLREGs', icon: Compass, description: 'Collision regulations' },
  { href: '/unit-modules?category=navigation', label: 'Navigation', icon: Navigation, description: 'Chart work & passage planning' },
  { href: '/unit-modules?category=meteorology', label: 'Meteorology', icon: Cloud, description: 'Weather & meteorology' },
  { href: '/unit-modules?category=cargo', label: 'Cargo', icon: Package, description: 'Cargo operations' },
];

export default async function LearnPage() {
  const user = await getCurrentUser();
  const isPremium = user?.profile?.role === 'premium' || user?.profile?.role === 'admin';
  const supabase = await createClient();

  const { data: recentModules } = user
    ? await supabase
        .from('user_module_progress')
        .select('progress, modules(title, category, subcategory)')
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false })
        .limit(5)
    : { data: [] };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Learn</h1>
        <p className="text-muted-foreground mt-1">All your maritime learning resources in one place</p>
      </div>

      {recentModules && recentModules.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Continue Learning</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentModules.map((m: any, i: number) => (
              <Link
                key={i}
                href={`/modules/${m.modules?.category}/${m.modules?.subcategory}`}
                className="flex items-center gap-3 p-4 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-all group"
              >
                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{m.modules?.title}</p>
                  <p className="text-xs text-muted-foreground">{m.progress ?? 0}% complete</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">All Resources</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEARN_SECTIONS.map((section) => {
            const locked = section.premium && !isPremium;
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={locked ? '/store' : section.href}
                className="relative p-5 rounded-2xl border border-border/60 bg-card hover:shadow-md hover:border-primary/30 transition-all group"
              >
                {locked && (
                  <span className="absolute top-3 right-3 text-primary">
                    <Lock className="h-3.5 w-3.5" />
                  </span>
                )}
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{section.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                {locked && <p className="text-[10px] text-primary font-medium mt-2">Preview available</p>}
              </Link>
            );
          })}
        </div>
      </section>

      {!isPremium && (
        <section className="grid sm:grid-cols-2 gap-4 mb-8">
          <PremiumTeaser title="Full Learning Modules" description="Unlock all interactive modules with quizzes, PDFs, and progress tracking." />
          <PremiumTeaser title="Unlimited Flashcards" description="Access every flashcard pack with spaced repetition and XP rewards." />
        </section>
      )}

      <div className="rounded-2xl border border-dashed border-border p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">Search all learning content</p>
            <p className="text-xs text-muted-foreground">Press ⌘K anywhere in the app</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/unit-modules">Browse All Modules</Link>
        </Button>
      </div>
    </div>
  );
}
