import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  BookOpen, Flame, Target, TrendingUp, MessageSquare, Newspaper,
  Zap, ArrowRight, Trophy, Clock, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DashboardCard,
  PremiumTeaser,
  StatCard,
  ProgressBar,
  SegmentedProgressBar,
  EmptyState,
} from '@/components/dashboard/DashboardWidgets';
import QuestionOfDay from '@/components/QuestionOfDay';
import { rankForXP } from '@/lib/algorithms';
import { getRecentBlogPosts, getRecentCommunityPosts } from '@/lib/data/cached-queries';
import { buildBlogPostPath } from '@/lib/blog/paths';
import { WaveFlagIcon } from '@/components/icons/MaritimeIcons';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Your personalised maritime training dashboard.',
  path: '/dashboard',
  noIndex: true,
});

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
  const recentModules = recentModulesResult.data ?? [];
  const xp = xpResult.data;
  const gamification = gamificationResult.data;

  const totalXp = (xp?.xp ?? 0) + (gamification?.total_xp ?? 0);
  const rank = rankForXP(totalXp);
  const streak = stats?.daily_streak ?? xp?.current_streak ?? 0;
  const examReadiness = Number(gamification?.exam_readiness_score ?? 0);
  const dailyGoal = gamification?.daily_goal_minutes ?? 30;
  const dailyMinutes = gamification?.daily_minutes_today ?? Math.floor((stats?.total_time_seconds ?? 0) % 86400 / 60) % dailyGoal;
  const firstName = user.profile?.full_name?.split(' ')[0] || 'Cadet';

  return (
    <div className="min-h-full">
      {/* Welcome hero */}
      <div className="hero-block border-b border-border relative">
        <div className="py-6 md:py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-caption text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                Welcome back
              </p>
              <h1 className="flex items-center gap-2">
                Good to see you, {firstName}
                <WaveFlagIcon className="h-7 w-7 text-brass shrink-0" />
              </h1>
              <p className="text-muted-foreground mt-2 text-caption md:text-body max-w-lg">
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

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <StatCard
              label="Study Streak"
              value={streak}
              sub="days in a row"
              icon={Flame}
              variant="streak"
            />
            <StatCard
              label="Level"
              value={rank.current}
              sub={`${totalXp} XP`}
              icon={Trophy}
              variant="level"
            />
            <StatCard
              label="Modules Done"
              value={stats?.modules_completed ?? 0}
              sub={`${stats?.modules_started ?? 0} started`}
              icon={GraduationCap}
              variant="modules"
            />
            <StatCard
              label="Exam Readiness"
              value={`${examReadiness}%`}
              icon={Target}
              variant="readiness"
              readinessPct={examReadiness}
            />
          </div>
        </div>
      </div>

      <div className="py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard
              title="Continue Studying"
              description="Pick up where you left off"
              icon={BookOpen}
              accent="navy"
              href="/learn"
            >
              {recentModules.length > 0 ? (
                <div className="space-y-2">
                  {recentModules.map((m: { module_id: string; progress?: number; modules?: { title?: string; category?: string; subcategory?: string } }) => (
                    <Link
                      key={m.module_id}
                      href={`/modules/${m.modules?.category}/${m.modules?.subcategory}`}
                      className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/60 transition-colors group min-h-[44px]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.modules?.title ?? 'Module'}</p>
                        <ProgressBar value={m.progress ?? 0} label="Progress" variant="starboard" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
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
            </DashboardCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DashboardCard title="Daily Study Goal" icon={Target} accent="amber">
                <ProgressBar
                  value={dailyMinutes}
                  max={dailyGoal}
                  label={`${dailyMinutes} / ${dailyGoal} min today`}
                  variant="brass"
                />
                <p className="text-caption text-muted-foreground mt-3">
                  Complete lessons, flashcards, or quizzes to hit your goal.
                </p>
              </DashboardCard>

              <DashboardCard title="Weekly Progress" icon={TrendingUp} accent="starboard" href="/progress">
                <ProgressBar
                  value={gamification?.weekly_minutes ?? 0}
                  max={gamification?.weekly_goal_minutes ?? 180}
                  label="Minutes this week"
                  variant="starboard"
                />
              </DashboardCard>
            </div>

            {!isPremium && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PremiumTeaser
                  title="Unlock all 2,500+ oral questions"
                  description="Full question bank with explanations and mock oral exam mode."
                />
                <PremiumTeaser
                  title="Complete all emergency scenarios"
                  description="Practice real-world emergency responses in our simulator."
                  previewLabel="Try preview"
                />
              </div>
            )}

            <DashboardCard
              title="Daily Challenge"
              description="Question of the day"
              icon={Zap}
              accent="challenge"
            >
              <QuestionOfDay />
              <Button size="sm" variant="outline" className="mt-3 min-h-[44px]" asChild>
                <Link href="/practice#daily-quiz">More practice</Link>
              </Button>
            </DashboardCard>
          </div>

          {/* Sidebar column — drops below on mobile */}
          <div className="space-y-6">
            <DashboardCard title="XP & Level" icon={Trophy} accent="brass">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md bg-brass/15 flex items-center justify-center text-lg font-bold text-brass border border-brass/20">
                  {rank.current[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{rank.current}</p>
                  <p className="text-caption text-muted-foreground">{totalXp} XP total</p>
                  <div className="mt-2">
                    <SegmentedProgressBar
                      value={rank.pct * 100}
                      label={rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Max rank'}
                    />
                  </div>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Study Streak" icon={Flame} accent="amber" href="/progress?tab=streak">
              <div className="text-center py-2">
                <p className="text-4xl font-bold text-amber-signal animate-streak-pulse">{streak}</p>
                <p className="text-caption text-muted-foreground mt-1">consecutive days</p>
              </div>
            </DashboardCard>

            <DashboardCard title="Community Activity" icon={MessageSquare} accent="navy" href="/community">
              {recentPosts.length > 0 ? (
                <div className="space-y-2">
                  {recentPosts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/community/post/${p.id}`}
                      className="block p-2 rounded-md hover:bg-muted/60 transition-colors min-h-[44px]"
                    >
                      <p className="text-caption font-medium line-clamp-2">{p.title}</p>
                      <p className="text-label text-muted-foreground mt-0.5">
                        {p.vote_score ?? 0} votes · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No posts yet"
                  description="Be the first to start a discussion."
                  illustrated={false}
                />
              )}
            </DashboardCard>

            <DashboardCard title="Latest from the Blog" icon={Newspaper} accent="default" href="/free-content">
              <div className="space-y-2">
                {blogPosts.map((b) => (
                  <Link
                    key={b.slug}
                    href={buildBlogPostPath(b)}
                    className="block p-2 rounded-md hover:bg-muted/60 transition-colors min-h-[44px]"
                  >
                    <p className="text-caption font-medium line-clamp-2">{b.title}</p>
                  </Link>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Time Studied" icon={Clock} accent="navy" href="/progress?tab=statistics">
              <p className="text-2xl font-bold">
                {Math.floor((stats?.total_time_seconds ?? 0) / 3600)}h{' '}
                {Math.floor(((stats?.total_time_seconds ?? 0) % 3600) / 60)}m
              </p>
              <p className="text-caption text-muted-foreground">total on platform</p>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
