import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  BookOpen, Target, MessageSquare, Newspaper, Flame, Trophy, GraduationCap, Clock,
  Zap, ArrowRight, WalletCards, FileText, PenLine, LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PremiumTeaser,
  ProgressBar,
  EmptyState,
  SectionHeader,
  StatsStrip,
  ActionHub,
} from '@/components/dashboard/DashboardWidgets';
import QuestionOfDay from '@/components/QuestionOfDay';
import { rankForXP } from '@/lib/algorithms';
import { unifiedTotalXp } from '@/lib/gamification';
import { getRecentBlogPosts, getRecentCommunityPosts } from '@/lib/data/cached-queries';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { WaveFlagIcon } from '@/components/icons/MaritimeIcons';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Your personalised maritime training dashboard.',
  path: '/dashboard',
  noIndex: true,
});

type RecentModule = {
  module_id: string;
  progress?: number | null;
  modules?:
    | { title?: string | null; category?: string | null; subcategory?: string | null }
    | { title?: string | null; category?: string | null; subcategory?: string | null }[]
    | null;
};

function moduleMeta(m: RecentModule) {
  const mod = Array.isArray(m.modules) ? m.modules[0] : m.modules;
  return {
    title: mod?.title ?? 'Module',
    category: mod?.category,
    subcategory: mod?.subcategory,
  };
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const isPremium = user.profile?.role === 'premium' || user.profile?.role === 'admin';

  const [
    statsResult,
    recentModulesResult,
    xpResult,
    gamificationResult,
    recentPosts,
    blogPosts,
  ] = await Promise.all([
    supabase.from('user_statistics').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('user_module_progress')
      .select('module_id, progress, last_accessed, modules(title, category, subcategory)')
      .eq('user_id', user.id)
      .order('last_accessed', { ascending: false })
      .limit(4),
    supabase.from('flashcard_user_xp').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_gamification').select('*').eq('user_id', user.id).maybeSingle(),
    getRecentCommunityPosts(),
    getRecentBlogPosts(),
  ]);

  const stats = statsResult.data;
  const recentModules = (recentModulesResult.data ?? []) as RecentModule[];
  const xp = xpResult.data;
  const gamification = gamificationResult.data;

  const totalXp = unifiedTotalXp(gamification?.total_xp, xp?.xp);
  const rank = rankForXP(totalXp);
  const streak = stats?.daily_streak ?? xp?.current_streak ?? 0;
  const examReadiness = Number(gamification?.exam_readiness_score ?? 0);
  const dailyGoal = gamification?.daily_goal_minutes ?? 30;
  const dailyMinutes =
    gamification?.daily_minutes_today ??
    Math.floor(((stats?.total_time_seconds ?? 0) % 86400) / 60) % dailyGoal;
  const firstName = user.profile?.full_name?.split(' ')[0] || 'Cadet';
  const totalSeconds = stats?.total_time_seconds ?? 0;
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);

  return (
    <div className="min-h-full pb-10">
      {/* Welcome */}
      <div className="border-b border-border/60 py-5 md:py-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
              Welcome back
            </p>
            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold tracking-tight">
              Good to see you, {firstName}
              <WaveFlagIcon className="h-6 w-6 text-brass shrink-0" />
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm max-w-lg">
              {streak > 0
                ? `You're on a ${streak}-day study streak — keep it going!`
                : 'Start a study streak today — complete any lesson or quiz.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="min-h-[44px]" asChild>
              <Link href="/learn">Continue Learning</Link>
            </Button>
            <Button size="sm" className="min-h-[44px]" asChild>
              <Link href="/practice">Daily Practice</Link>
            </Button>
          </div>
        </div>

        {/* Condensed stats */}
        <div className="mt-6">
          <StatsStrip
            items={[
              {
                label: 'Streak',
                value: streak,
                sub: streak === 1 ? 'day in a row' : 'days in a row',
                href: '/progress?tab=streak',
                icon: Flame,
                accent: 'amber',
              },
              {
                label: 'Level',
                value: rank.current,
                sub: `${totalXp.toLocaleString()} XP`,
                href: '/progress',
                icon: Trophy,
                accent: 'brass',
              },
              {
                label: 'Modules',
                value: stats?.modules_completed ?? 0,
                sub: `${stats?.modules_started ?? 0} started`,
                href: '/unit-modules',
                icon: GraduationCap,
                accent: 'primary',
              },
              {
                label: 'Readiness',
                value: `${examReadiness}%`,
                sub: 'exam score',
                href: '/progress',
                icon: Target,
                accent: 'starboard',
                progress: examReadiness,
              },
              {
                label: 'Time',
                value: `${hours}h ${mins}m`,
                sub: 'studied total',
                href: '/progress?tab=statistics',
                icon: Clock,
                accent: 'muted',
              },
              {
                label: 'Today',
                value: `${dailyMinutes}m`,
                sub: `of ${dailyGoal}m goal`,
                icon: Zap,
                accent: 'brass',
                progress: dailyGoal > 0 ? (dailyMinutes / dailyGoal) * 100 : 0,
              },
            ]}
          />
        </div>
      </div>

      <div className="space-y-8 pt-6 md:pt-8">
        {/* Action hub */}
        <section>
          <SectionHeader title="Jump in" description="Pick a task and keep moving" />
          <ActionHub
            items={[
              { label: 'Learn', href: '/learn', icon: BookOpen },
              { label: 'Practice', href: '/practice', icon: PenLine },
              { label: 'Flashcards', href: '/flashcards', icon: WalletCards },
              { label: 'TRB', href: '/trb', icon: FileText },
              { label: 'Modules', href: '/unit-modules', icon: LayoutGrid },
            ]}
          />
        </section>

        {/* Continue studying */}
        <section className="border-t border-border/60 pt-6">
          <SectionHeader
            title="Continue studying"
            description="Pick up where you left off"
            href="/learn"
            hrefLabel="All learning"
          />
          {recentModules.length > 0 ? (
            <ul className="divide-y divide-border/60">
              {recentModules.map((m) => {
                const meta = moduleMeta(m);
                const href =
                  meta.category && meta.subcategory
                    ? `/modules/${meta.category}/${meta.subcategory}`
                    : '/unit-modules';
                return (
                  <li key={m.module_id}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 py-3 group min-h-[44px] hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meta.title}</p>
                        <div className="mt-1.5">
                          <ProgressBar
                            value={m.progress ?? 0}
                            label="Progress"
                            variant="starboard"
                          />
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="No modules started yet"
              description="Browse learning modules and chart your course to certification."
              action={
                <Button size="sm" className="min-h-[44px]" asChild>
                  <Link href="/unit-modules">Browse Modules</Link>
                </Button>
              }
            />
          )}
        </section>

        {/* Daily challenge */}
        <section className="border-t border-border/60 pt-6">
          <SectionHeader
            title="Daily challenge"
            description="Question of the day"
            href="/practice#daily-quiz"
            hrefLabel="More practice"
          />
          <div className="flex items-start gap-2 mb-3 text-amber-signal">
            <Zap className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={1.75} />
            <p className="text-caption text-muted-foreground">
              Answer today&apos;s question to keep your streak warm.
            </p>
          </div>
          <QuestionOfDay />
        </section>

        {/* Read / catch up */}
        <section className="border-t border-border/60 pt-6">
          <SectionHeader title="Read & catch up" description="Articles and community" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Latest articles
                </h3>
                <Link
                  href="/free-content"
                  className="ml-auto text-xs font-semibold text-primary hover:underline"
                >
                  All
                </Link>
              </div>
              <ul className="divide-y divide-border/50">
                {blogPosts.length > 0 ? (
                  blogPosts.map((b) => (
                    <li key={b.slug}>
                      <Link
                        href={buildBlogPostPath(b)}
                        className="block py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 min-h-[44px]"
                      >
                        {b.title}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="py-3 text-caption text-muted-foreground">No articles yet.</li>
                )}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Community
                </h3>
                <Link
                  href="/community"
                  className="ml-auto text-xs font-semibold text-primary hover:underline"
                >
                  All
                </Link>
              </div>
              {recentPosts.length > 0 ? (
                <ul className="divide-y divide-border/50">
                  {recentPosts.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/community/post/${p.id}`}
                        className="block py-2.5 min-h-[44px] hover:opacity-80 transition-opacity"
                      >
                        <p className="text-sm font-medium line-clamp-2">{p.title}</p>
                        <p className="text-label text-muted-foreground mt-0.5">
                          {p.vote_score ?? 0} votes · {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="No posts yet"
                  description="Be the first to start a discussion."
                  illustrated={false}
                />
              )}
            </div>
          </div>
        </section>

        {!isPremium && (
          <section className="border-t border-border/60 pt-6">
            <PremiumTeaser
              slim
              title="Go further with Premium"
              description="Unlock the full question bank, emergency scenarios, and all learning modules."
            />
          </section>
        )}

        {/* Subtle weekly nod without a card */}
        <p className="text-caption text-muted-foreground flex items-center gap-1.5 pt-1">
          <Target className="h-3.5 w-3.5" />
          This week:{' '}
          <span className="font-medium text-foreground">
            {gamification?.weekly_minutes ?? 0} / {gamification?.weekly_goal_minutes ?? 180} min
          </span>
          <Link href="/progress" className="ml-1 text-primary hover:underline font-semibold">
            Progress
          </Link>
        </p>
      </div>
    </div>
  );
}
