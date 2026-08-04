import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { Flame, Trophy, BookOpen, Target, History, TrendingUp } from 'lucide-react';
import { StatPill, ProgressBar, DashboardCard } from '@/components/dashboard/DashboardWidgets';
import { rankForXP } from '@/lib/algorithms';
import { unifiedTotalXp } from '@/lib/gamification';
import { ProgressTabNav } from '@/components/progress/ProgressTabNav';
import { ProgressTabSync } from '@/components/progress/ProgressTabSync';

export const metadata: Metadata = buildPageMetadata({
  title: 'Progress',
  description: 'Track your maritime training progress, streaks, and achievements.',
  path: '/progress',
  noIndex: true,
});

export default async function ProgressPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const [statsResult, xpResult, gamificationResult, completedResult, achievementsResult] = await Promise.all([
    supabase.from('user_statistics').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('flashcard_user_xp').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_gamification').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('user_module_progress')
      .select('progress, completed_at, modules(title)')
      .eq('user_id', user.id)
      .gte('progress', 100)
      .order('completed_at', { ascending: false })
      .limit(10),
    supabase
      .from('user_achievements')
      .select('unlocked_at, achievements(title, description, icon, xp_reward)')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(12),
  ]);

  const stats = statsResult.data;
  const xp = xpResult.data;
  const gamification = gamificationResult.data;
  const completed = completedResult.data ?? [];
  const achievements = achievementsResult.data ?? [];

  const totalXp = unifiedTotalXp(gamification?.total_xp, xp?.xp);
  const rank = rankForXP(totalXp);
  const streak = stats?.daily_streak ?? xp?.current_streak ?? 0;
  const examReadiness = Number(gamification?.exam_readiness_score ?? 0);
  const totalHours = Math.floor((stats?.total_time_seconds ?? 0) / 3600);
  const totalMins = Math.floor(((stats?.total_time_seconds ?? 0) % 3600) / 60);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">Your training journey at a glance</p>
      </div>

      <Suspense fallback={null}>
        <ProgressTabNav />
        <ProgressTabSync />
      </Suspense>

      <div id="progress-statistics" className="scroll-mt-24 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatPill label="Total XP" value={totalXp} sub={rank.current} />
        <StatPill label="Study Streak" value={`${streak} days`} />
        <StatPill label="Time Studied" value={`${totalHours}h ${totalMins}m`} />
        <StatPill label="Exam Readiness" value={`${examReadiness}%`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div id="progress-readiness" className="scroll-mt-24">
        <DashboardCard title="Exam Readiness" icon={Target}>
          <ProgressBar value={examReadiness} label="Overall readiness score" />
          <p className="text-xs text-muted-foreground mt-3">
            Based on module completion, quiz scores, and practice activity.
          </p>
        </DashboardCard>
        </div>

        <DashboardCard title="Weekly Progress" icon={TrendingUp}>
          <ProgressBar
            value={gamification?.weekly_minutes ?? 0}
            max={gamification?.weekly_goal_minutes ?? 180}
            label="Minutes studied this week"
          />
        </DashboardCard>

        <div id="progress-streak" className="scroll-mt-24">
        <DashboardCard title="Study Streak" icon={Flame}>
          <div className="text-center py-4">
            <p className="text-5xl font-bold text-orange-500">{streak}</p>
            <p className="text-sm text-muted-foreground mt-2">consecutive study days</p>
            {streak === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Complete any lesson today to start your streak!</p>
            )}
          </div>
        </DashboardCard>
        </div>

        <DashboardCard title="Level & XP" icon={Trophy}>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {rank.current[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{rank.current}</p>
              <ProgressBar value={rank.pct * 100} label={rank.next ? `${rank.toNext} XP to ${rank.next}` : 'Maximum rank'} />
            </div>
          </div>
        </DashboardCard>

        <div id="progress-completed" className="scroll-mt-24 lg:col-span-2">
        <DashboardCard title="Completed Modules" icon={BookOpen} className="lg:col-span-2">
          {completed.length > 0 ? (
            <div className="space-y-2">
              {completed.map((m: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <p className="text-sm font-medium">{m.modules?.title ?? 'Module'}</p>
                  {m.completed_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No completed modules yet</p>
          )}
        </DashboardCard>
        </div>

        <div id="progress-achievements" className="scroll-mt-24 lg:col-span-2">
        <DashboardCard title="Achievements" icon={Trophy} className="lg:col-span-2">
          {achievements.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((a: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-border/60 bg-muted/30">
                  <p className="text-sm font-medium">{a.achievements?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.achievements?.description}</p>
                  <p className="text-[10px] text-primary font-medium mt-1">+{a.achievements?.xp_reward} XP</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">No achievements unlocked yet</p>
              <p className="text-xs text-muted-foreground mt-1">Study, post, and engage to earn badges</p>
            </div>
          )}
        </DashboardCard>
        </div>

        <div id="progress-quizzes" className="scroll-mt-24 lg:col-span-2">
        <DashboardCard title="Quiz History" icon={History} className="lg:col-span-2">
          <p className="text-sm text-muted-foreground text-center py-6">
            Quiz history will appear here as you complete practice sessions.
          </p>
          <div className="text-center">
            <Link href="/practice" className="text-sm text-primary hover:underline">Start practicing →</Link>
          </div>
        </DashboardCard>
        </div>
      </div>
    </div>
  );
}
