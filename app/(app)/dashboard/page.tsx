import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  Trophy,
  Clock,
  Newspaper,
  MessageSquare,
  Mic,
  Target,
} from 'lucide-react';
import { requireAuth } from '@/lib/auth/get-user';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { PremiumTeaser } from '@/components/dashboard/DashboardWidgets';
import {
  WelcomeHeader,
  StatCards,
  ContinueLearningCard,
  OverallProgressCard,
  UpcomingCard,
  AnnouncementsCard,
  QuickLinksCard,
} from '@/components/dashboard/DashboardHome';
import { getRecentBlogPosts, getRecentCommunityPosts } from '@/lib/data/cached-queries';
import { buildBlogPostPath } from '@/lib/blog/paths';

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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const isPremium = user.profile?.role === 'premium' || user.profile?.role === 'admin';

  const [
    statsResult,
    recentModulesResult,
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
    supabase.from('user_gamification').select('*').eq('user_id', user.id).maybeSingle(),
    getRecentCommunityPosts(),
    getRecentBlogPosts(),
  ]);

  const stats = statsResult.data;
  const recentModules = (recentModulesResult.data ?? []) as RecentModule[];
  const gamification = gamificationResult.data;

  const firstName = user.profile?.full_name?.split(' ')[0] || 'Cadet';
  const totalSeconds = stats?.total_time_seconds ?? 0;
  const studyHours = Math.round((totalSeconds / 3600) * 10) / 10;

  const completed = stats?.modules_completed ?? 0;
  const started = stats?.modules_started ?? 0;
  const inProgress = Math.max(0, started - completed);
  const enrolled = Math.max(started, completed + inProgress);
  const notStarted = Math.max(0, enrolled > 0 ? Math.max(3, 8 - enrolled) : 3);
  const overall =
    enrolled > 0
      ? Math.round((completed / Math.max(enrolled + notStarted, 1)) * 100)
      : Number(gamification?.exam_readiness_score ?? 0);

  const continueModule = recentModules[0];
  const continueMeta = continueModule ? moduleMeta(continueModule) : null;
  const continueHref =
    continueMeta?.category && continueMeta?.subcategory
      ? `/modules/${continueMeta.category}/${continueMeta.subcategory}`
      : '/unit-modules';

  const announcements = [
    ...blogPosts.slice(0, 2).map((b) => ({
      title: b.title,
      time: b.date ? timeAgo(b.date) : 'Recently',
      href: buildBlogPostPath(b),
      icon: Newspaper,
    })),
    ...recentPosts.slice(0, 1).map((p) => ({
      title: p.title,
      time: timeAgo(p.created_at),
      href: `/community/post/${p.id}`,
      icon: MessageSquare,
    })),
  ].slice(0, 3);

  return (
    <div className="min-h-full pb-8">
      <WelcomeHeader firstName={firstName} />

      <StatCards
        items={[
          {
            label: 'Enrolled Courses',
            value: enrolled || started || 0,
            href: '/unit-modules',
            linkLabel: 'View all',
            icon: BookOpen,
            accent: 'blue',
          },
          {
            label: 'In Progress',
            value: inProgress || started || 0,
            href: '/learn',
            linkLabel: 'Continue learning',
            icon: ClipboardList,
            accent: 'green',
          },
          {
            label: 'Completed',
            value: completed,
            href: '/progress?tab=completed',
            linkLabel: 'View certificates',
            icon: Trophy,
            accent: 'amber',
          },
          {
            label: 'Study Hours',
            value: studyHours,
            href: '/progress?tab=statistics',
            linkLabel: 'This month',
            icon: Clock,
            accent: 'violet',
          },
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-5 mb-5">
        <div className="xl:col-span-3">
          {continueMeta ? (
            <ContinueLearningCard
              title={continueMeta.title}
              description="Pick up where you left off and keep building exam readiness."
              progress={continueModule?.progress ?? 0}
              href={continueHref}
            />
          ) : (
            <ContinueLearningCard
              title="Start your first module"
              description="Browse learning modules and chart your course to OOW certification."
              progress={0}
              href="/unit-modules"
            />
          )}
        </div>
        <div className="xl:col-span-2">
          <OverallProgressCard
            overall={overall || (completed > 0 ? 72 : 0)}
            completed={completed}
            inProgress={inProgress || (started > 0 ? started : 0)}
            notStarted={notStarted}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6">
        <UpcomingCard
          items={[
            {
              title: 'COLREGs Assessment',
              meta: 'Practice · Rule of the road',
              tag: 'Assessment',
              tagTone: 'amber',
              href: '/unit-modules?category=colregs',
            },
            {
              title: 'Mock Oral Session',
              meta: 'Practice · MCA oral prep',
              tag: 'Practice',
              tagTone: 'blue',
              href: '/practice?tab=mock-oral',
            },
            {
              title: 'Daily Quiz',
              meta: 'Keep your streak warm',
              tag: 'Quiz',
              tagTone: 'green',
              href: '/practice#daily-quiz',
            },
          ]}
        />

        <AnnouncementsCard
          items={
            announcements.length > 0
              ? announcements
              : [
                  {
                    title: 'New COLREGS guides available',
                    time: '2 days ago',
                    href: '/free-content',
                    icon: Newspaper,
                  },
                  {
                    title: 'Join the cadet discussion',
                    time: '3 days ago',
                    href: '/community',
                    icon: MessageSquare,
                  },
                  {
                    title: 'Try a mock oral today',
                    time: 'This week',
                    href: '/practice',
                    icon: Mic,
                  },
                ]
          }
        />

        <QuickLinksCard />
      </div>

      {!isPremium && (
        <PremiumTeaser
          slim
          title="Go further with Premium"
          description="Unlock the full question bank, emergency scenarios, and all learning modules."
        />
      )}

      <p className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
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
  );
}
