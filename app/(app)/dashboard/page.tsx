import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  BookOpen, Flame, Target, TrendingUp, MessageSquare, Newspaper,
  Zap, ArrowRight, Trophy, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardCard, PremiumTeaser, StatPill, ProgressBar, EmptyState } from '@/components/dashboard/DashboardWidgets';
import QuestionOfDay from '@/components/QuestionOfDay';
import { rankForXP } from '@/lib/algorithms';
import { getRecentBlogPosts, getRecentCommunityPosts } from '@/lib/data/cached-queries';

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
      <div className="border-b border-border bg-background">
        <div className="py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
              <h1 className="text-3xl font-bold tracking-tight">Good to see you, {firstName} 👋</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {streak > 0
                  ? `You're on a ${streak}-day study streak — keep it going!`
                  : 'Start a study streak today — complete any lesson or quiz.'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/learn">Continue Learning</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/practice">Daily Practice</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <StatPill label="Study Streak" value={streak} sub="days in a row" />
            <StatPill label="Level" value={rank.current} sub={`${totalXp} XP`} />
            <StatPill label="Modules Done" value={stats?.modules_completed ?? 0} sub={`${stats?.modules_started ?? 0} started`} />
            <StatPill label="Exam Readiness" value={`${examReadiness}%`} sub="overall score" />
          </div>
        </div>
      </div>

      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <DashboardCard title="Continue Studying" description="Pick up where you left off" icon={BookOpen} href="/learn">
              {recentModules.length > 0 ? (
                <div className="space-y-2">
                  {recentModules.map((m: any) => (
                    <Link
                      key={m.module_id}
                      href={`/modules/${m.modules?.category}/${m.modules?.subcategory}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.modules?.title ?? 'Module'}</p>
                        <ProgressBar value={m.progress ?? 0} label="Progress" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No modules started yet"
                  description="Browse learning modules and start your first lesson."
                  action={<Button size="sm" asChild><Link href="/unit-modules">Browse Modules</Link></Button>}
                />
              )}
            </DashboardCard>

            <div className="grid sm:grid-cols-2 gap-4">
              <DashboardCard title="Daily Study Goal" icon={Target}>
                <ProgressBar value={dailyMinutes} max={dailyGoal} label={`${dailyMinutes} / ${dailyGoal} min today`} />
                <p className="text-xs text-muted-foreground mt-3">
                  Complete lessons, flashcards, or quizzes to hit your goal.
                </p>
              </DashboardCard>

              <DashboardCard title="Weekly Progress" icon={TrendingUp} href="/progress">
                <ProgressBar
                  value={gamification?.weekly_minutes ?? 0}
                  max={gamification?.weekly_goal_minutes ?? 180}
                  label="Minutes this week"
                />
              </DashboardCard>
            </div>

            {!isPremium && (
              <div className="grid sm:grid-cols-2 gap-4">
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

            <DashboardCard title="Daily Challenge" description="Question of the day" icon={Zap}>
              <QuestionOfDay />
              <Button size="sm" variant="outline" className="mt-3" asChild>
                <Link href="/practice#daily-quiz">More practice</Link>
              </Button>
            </DashboardCard>
          </div>

          {/* Right column — 1/3 */}
          <div className="space-y-6">
            <DashboardCard title="XP & Level" icon={Trophy}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {rank.current[0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{rank.current}</p>
                  <p className="text-xs text-muted-foreground">{totalXp} XP total</p>
                  <ProgressBar value={rank.pct * 100} label={rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Max rank'} />
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Study Streak" icon={Flame} href="/progress?tab=streak">
              <div className="text-center py-2">
                <p className="text-4xl font-bold text-orange-500">{streak}</p>
                <p className="text-xs text-muted-foreground mt-1">consecutive days</p>
              </div>
            </DashboardCard>

            <DashboardCard title="Community Activity" icon={MessageSquare} href="/community">
              {recentPosts.length > 0 ? (
                <div className="space-y-2">
                  {recentPosts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/community/post/${p.id}`}
                      className="block p-2 rounded-lg hover:bg-muted/60 transition-colors"
                    >
                      <p className="text-xs font-medium line-clamp-2">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {p.vote_score ?? 0} votes · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState title="No posts yet" description="Be the first to start a discussion." />
              )}
            </DashboardCard>

            <DashboardCard title="Latest from the Blog" icon={Newspaper} href="/free-content">
              <div className="space-y-2">
                {blogPosts.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/free-content/${b.slug}`}
                    className="block p-2 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <p className="text-xs font-medium line-clamp-2">{b.title}</p>
                  </Link>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Time Studied" icon={Clock} href="/progress?tab=statistics">
              <p className="text-2xl font-bold">
                {Math.floor((stats?.total_time_seconds ?? 0) / 3600)}h{' '}
                {Math.floor(((stats?.total_time_seconds ?? 0) % 3600) / 60)}m
              </p>
              <p className="text-xs text-muted-foreground">total on platform</p>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
}
