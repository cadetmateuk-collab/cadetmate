import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth/get-user';
import { isPremiumRole } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';
import { buildPageMetadata } from '@/lib/seo/metadata';
import {
  DashboardHome,
  type CommunityPostPreview,
  type ContinueModule,
  type DashboardAvatar,
} from '@/components/dashboard/DashboardHome';
import { displayName, timeAgo } from '@/lib/community/utils';
import type { AvatarKind } from '@/lib/onboarding/constants';
import { fallbackModuleSections, listModuleSections } from '@/lib/modules/sections';
import {
  DAILY_STUDY_GOAL_MINUTES,
  buildWeekUsage,
  londonDateKey,
} from '@/lib/study/time';

export const metadata: Metadata = buildPageMetadata({
  title: 'Dashboard',
  description: 'Your personalised maritime training dashboard.',
  path: '/dashboard',
  noIndex: true,
});

type ModuleJoin = {
  id?: string | null;
  title?: string | null;
  category?: string | null;
  subcategory?: string | null;
  image_url?: string | null;
  total_lessons?: number | null;
};

type RecentRow = {
  module_id: string;
  progress?: number | null;
  last_accessed?: string | null;
  completed?: boolean | null;
  modules?: ModuleJoin | ModuleJoin[] | null;
};

type PostRow = {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  author?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    avatar_kind?: string | null;
    avatar_preset?: string | null;
    avatar_color?: string | null;
    role?: string | null;
  } | Array<{
    id?: string;
    full_name?: string | null;
    email?: string | null;
    avatar_kind?: string | null;
    avatar_preset?: string | null;
    avatar_color?: string | null;
    role?: string | null;
  }> | null;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function moduleHref(category?: string | null, subcategory?: string | null) {
  if (category && subcategory) return `/modules/${category}/${subcategory}`;
  return '/unit-modules';
}

function toAvatar(input: {
  fullName: string;
  avatarKind?: string | null;
  avatarPreset?: string | null;
  avatarColor?: string | null;
  role?: string | null;
}): DashboardAvatar {
  const kind: AvatarKind = input.avatarKind === 'preset' ? 'preset' : 'initials';
  return {
    fullName: input.fullName,
    avatarKind: kind,
    avatarPreset: kind === 'preset' ? input.avatarPreset ?? null : null,
    avatarColor: input.avatarColor ?? null,
    role: input.role ?? null,
  };
}

function resolveModuleProgress(
  stored: number | null | undefined,
  completedFlag: boolean | null | undefined,
  sectionCount: number,
  totalLessons: number | null | undefined,
) {
  if (completedFlag) return 100;
  const storedNum = Number(stored ?? 0);
  if (storedNum > 0) return Math.min(100, storedNum);
  if (sectionCount <= 0) return 0;
  if (totalLessons && totalLessons > 0) {
    return Math.min(100, Math.round((sectionCount / totalLessons) * 100));
  }
  return Math.min(99, Math.max(8, sectionCount * 10));
}

function toContinueModule(
  row: RecentRow | { modules: ModuleJoin | null; progress?: number; id?: string },
): ContinueModule | null {
  const mod = 'modules' in row ? firstJoin(row.modules) : null;
  if (!mod?.title) return null;
  const id = ('module_id' in row ? row.module_id : mod.id) || mod.title;
  return {
    id,
    title: mod.title,
    category: mod.category ?? null,
    imageUrl: mod.image_url ?? null,
    progress: 'progress' in row ? Number(row.progress ?? 0) : 0,
    href: moduleHref(mod.category, mod.subcategory),
    sections: [],
    totalLessons: Number(mod.total_lessons ?? 0) || undefined,
  };
}

function greetingForLondon(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/London',
    }).format(now),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const isPremium = isPremiumRole(user.profile?.role);
  const activitySince = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

  const [
    statsResult,
    recentModulesResult,
    sectionProgressResult,
    suggestedResult,
    postsResult,
    activityResult,
  ] = await Promise.all([
    supabase.from('user_statistics').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('user_module_progress')
      .select('module_id, progress, last_accessed, completed, modules(id, title, category, subcategory, image_url, total_lessons)')
      .eq('user_id', user.id)
      .order('last_accessed', { ascending: false })
      .limit(24),
    supabase
      .from('user_section_progress')
      .select('module_id, section_index')
      .eq('user_id', user.id),
    supabase
      .from('modules_catalog')
      .select('id, title, category, subcategory, image_url, is_featured, total_lessons')
      .order('is_featured', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('posts')
      .select('id, title, created_at, user_id')
      .eq('is_deleted', false)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('user_activity_log')
      .select('session_start, duration_seconds')
      .eq('user_id', user.id)
      .gte('session_start', activitySince),
  ]);

  const stats = statsResult.data;
  const firstName = user.profile?.full_name?.split(' ')[0] || 'Cadet';

  const sectionIndexes = new Map<string, Set<number>>();
  for (const row of sectionProgressResult.data ?? []) {
    if (!row.module_id) continue;
    const set = sectionIndexes.get(row.module_id) ?? new Set<number>();
    set.add(row.section_index);
    sectionIndexes.set(row.module_id, set);
  }

  const progressByModule = new Map<string, RecentRow>();
  for (const row of (recentModulesResult.data ?? []) as RecentRow[]) {
    if (row.module_id) progressByModule.set(row.module_id, row);
  }

  const missingModuleIds = [...sectionIndexes.keys()].filter((id) => !progressByModule.has(id));
  if (missingModuleIds.length > 0) {
    const { data: extraModules } = await supabase
      .from('modules_catalog')
      .select('id, title, category, subcategory, image_url, total_lessons')
      .in('id', missingModuleIds);
    for (const mod of (extraModules ?? []) as ModuleJoin[]) {
      if (!mod.id) continue;
      progressByModule.set(mod.id, {
        module_id: mod.id,
        progress: 0,
        last_accessed: null,
        completed: false,
        modules: mod,
      });
    }
  }

  const continueModules = [...progressByModule.values()]
    .map((row) => {
      const mod = firstJoin(row.modules);
      const progress = resolveModuleProgress(
        row.progress,
        row.completed,
        sectionIndexes.get(row.module_id)?.size ?? 0,
        mod?.total_lessons,
      );
      return toContinueModule({ ...row, progress });
    })
    .filter((row): row is ContinueModule => row != null && row.progress > 0)
    .sort((a, b) => {
      const aDone = a.progress >= 100 ? 1 : 0;
      const bDone = b.progress >= 100 ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return b.progress - a.progress;
    });

  const recentIds = new Set(continueModules.map((mod) => mod.id));
  const inProgressCount = continueModules.filter((mod) => mod.progress > 0 && mod.progress < 100).length;
  const completedCount = Math.max(
    stats?.modules_completed ?? 0,
    continueModules.filter((mod) => mod.progress >= 100).length,
  );

  const suggestedModules = ((suggestedResult.data ?? []) as ModuleJoin[])
    .filter((mod) => mod.id && !recentIds.has(mod.id))
    .slice(0, 3)
    .map((mod) =>
      toContinueModule({
        id: mod.id ?? undefined,
        progress: 0,
        modules: mod,
      }),
    )
    .filter((row): row is ContinueModule => Boolean(row));

  const sectionCandidateIds = [
    ...new Set([
      ...continueModules.slice(0, 3).map((mod) => mod.id),
      ...suggestedModules.map((mod) => mod.id),
    ]),
  ];

  if (sectionCandidateIds.length > 0) {
    const { data: contentRows, error: contentError } = await supabase
      .from('modules')
      .select('*')
      .in('id', sectionCandidateIds);

    const contentById = new Map(
      ((contentError ? [] : contentRows) ?? []).map((row) => [String(row.id), row]),
    );

    const withSections = (mod: ContinueModule): ContinueModule => {
      const content = contentById.get(mod.id);
      const completedSet = sectionIndexes.get(mod.id) ?? new Set<number>();
      let sections = content
        ? listModuleSections({
            pages: content.pages,
            content: content.content,
            blocks: content.blocks,
            total_lessons: content.total_lessons,
          })
        : [];

      if (sections.length === 0) {
        const fallbackCount = Math.max(
          Number(content?.total_lessons ?? mod.totalLessons ?? 0),
          completedSet.size > 0 ? Math.max(...completedSet) + 1 : 0,
          1,
        );
        sections = fallbackModuleSections(fallbackCount);
      }

      const withDone = sections.map((section) => ({
        ...section,
        completed: completedSet.has(section.index),
      }));
      const done = withDone.filter((section) => section.completed).length;
      const derived = Math.round((done / withDone.length) * 100);
      return {
        ...mod,
        sections: withDone,
        progress: Math.max(mod.progress, derived),
      };
    };

    continueModules.forEach((mod, i) => {
      continueModules[i] = withSections(mod);
    });
    suggestedModules.forEach((mod, i) => {
      suggestedModules[i] = withSections(mod);
    });
  }

  const postRows = (postsResult.data ?? []) as PostRow[];
  const authorIds = [...new Set(postRows.map((p) => p.user_id).filter(Boolean))];
  const { data: publicAuthors } = authorIds.length
    ? await supabase
        .from('profiles_public')
        .select('id, full_name, avatar_kind, avatar_preset, avatar_color')
        .in('id', authorIds)
    : { data: [] as { id: string; full_name: string | null; avatar_kind: string | null; avatar_preset: string | null; avatar_color: string | null }[] };
  const authorsById = new Map((publicAuthors ?? []).map((row) => [row.id, row]));

  const communityPosts: CommunityPostPreview[] = postRows.map((post) => {
    const author = authorsById.get(post.user_id);
    const name = displayName(author);
    return {
      id: post.id,
      title: post.title,
      createdAtLabel: timeAgo(post.created_at),
      authorName: name,
      userId: post.user_id,
      author: toAvatar({
        fullName: name,
        avatarKind: author?.avatar_kind,
        avatarPreset: author?.avatar_preset,
        avatarColor: author?.avatar_color,
        role: null,
      }),
    };
  });

  const weekUsage = buildWeekUsage(activityResult.data ?? []);
  const weeklyMinutes = weekUsage.reduce((sum, day) => sum + day.minutes, 0);
  const todayKey = londonDateKey();
  const todayMinutes = weekUsage.find((day) => day.key === todayKey)?.minutes ?? 0;
  const targetPercent = Math.min(100, Math.round((todayMinutes / DAILY_STUDY_GOAL_MINUTES) * 100));

  return (
    <DashboardHome
      firstName={firstName}
      greeting={greetingForLondon()}
      isPremium={isPremium}
      streakDays={stats?.daily_streak ?? 0}
      weeklyMinutes={weeklyMinutes}
      dailyGoalMinutes={DAILY_STUDY_GOAL_MINUTES}
      todayMinutes={todayMinutes}
      targetPercent={targetPercent}
      avatar={toAvatar({
        fullName: user.profile?.full_name || firstName,
        avatarKind: user.profile?.avatar_kind,
        avatarPreset: user.profile?.avatar_preset,
        avatarColor: user.profile?.avatar_color,
        role: user.profile?.role,
      })}
      weekUsage={weekUsage}
      inProgressCount={inProgressCount}
      completedCount={completedCount}
      continueModules={continueModules}
      suggestedModules={suggestedModules}
      communityPosts={communityPosts}
    />
  );
}
