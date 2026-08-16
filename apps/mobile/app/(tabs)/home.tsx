import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flame,
  MessageSquare,
  Plus,
  WalletCards,
} from 'lucide-react-native';
import { useAuth, type CadetProfile } from '../../lib/AuthContext';
import { connectHref, href, moduleHref } from '../../lib/href';
import { supabase } from '../../lib/supabase';
import { modulePages, type ModuleRow } from '../../lib/modules';
import { ConnectivityManager } from '../../lib/offline/ConnectivityManager';
import { CourseStore } from '../../lib/offline/CourseStore';
import { ProgressStore } from '../../lib/offline/ProgressStore';
import { isOfflineModeError, loadLocalContent, resolveMediaUri, useOffline } from '../../lib/offline';
import {
  DAILY_STUDY_GOAL_MINUTES,
  buildWeekUsage,
  greetingForLondon,
  londonDateKey,
  type WeekDayMinutes,
} from '../../lib/studyTime';
import { Card, LoadingScreen, Screen } from '../../components/ui';
import { UserAvatar } from '../../components/UserAvatar';
import { QuickLinkTile } from '../../components/QuickLinkTile';
import { BRAND_SOURCES } from '../../lib/brandAssets';
import { colors, fonts, radius, shadow, type } from '../../theme';

type ModuleJoin = {
  id?: string | null;
  title?: string | null;
  category?: string | null;
  subcategory?: string | null;
  image_url?: string | null;
  total_lessons?: number | null;
};

type ProgressRow = {
  module_id: string;
  progress?: number | null;
  last_accessed?: string | null;
  completed?: boolean | null;
  modules?: ModuleJoin | ModuleJoin[] | null;
};

type ContinueSection = {
  index: number;
  title: string;
  completed: boolean;
};

type ContinueCard = {
  id: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  progress: number;
  suggested: boolean;
  sections: ContinueSection[];
};

type CommunityPost = {
  id: string;
  title: string;
  authorName: string;
  createdAtLabel: string;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function usableCover(url: string | null) {
  return resolveMediaUri(url);
}

function resolveProgress(
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

function ProgressRing({ percent, profile }: { percent: number; profile: CadetProfile | null }) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  const size = 96;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E8EEF9" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={styles.ringAvatar}>
        <UserAvatar
          fullName={profile?.full_name || 'Cadet'}
          avatarKind={profile?.avatar_kind}
          avatarPreset={profile?.avatar_preset}
          avatarColor={profile?.avatar_color}
          size={62}
        />
      </View>
      <View style={styles.ringBadge}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: colors.primary }}>{pct}%</Text>
      </View>
    </View>
  );
}

function WeekBars({ weekUsage }: { weekUsage: WeekDayMinutes[] }) {
  const max = Math.max(DAILY_STUDY_GOAL_MINUTES, ...weekUsage.map((d) => d.minutes), 1);
  const todayKey = londonDateKey();
  const track = 72;

  return (
    <View style={{ width: 108, justifyContent: 'center', gap: 5 }}>
      {weekUsage.map((day) => {
        const width = day.minutes > 0 ? Math.max(6, (day.minutes / max) * track) : 4;
        const isToday = day.key === todayKey;
        const isPeak = day.minutes === max && day.minutes > 0;
        return (
          <View key={day.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            <View style={{ width: track, height: 6, alignItems: 'flex-end', justifyContent: 'center' }}>
              <View
                style={{
                  width,
                  height: 6,
                  borderRadius: 99,
                  backgroundColor: isToday || isPeak ? colors.primary : day.minutes > 0 ? 'rgba(41,102,242,0.45)' : '#E8EEF9',
                }}
              />
            </View>
            <Text
              style={{
                width: 26,
                fontFamily: fonts.semibold,
                fontSize: 9,
                color: isToday ? colors.primary : colors.textMuted,
                textAlign: 'right',
              }}
            >
              {day.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ModuleCard({
  module,
  expanded,
  onToggle,
  onOpen,
  onOpenSection,
}: {
  module: ContinueCard;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onOpenSection: (index: number) => void;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(module.progress)));
  const cover = usableCover(module.imageUrl);
  const done = module.sections.filter((s) => s.completed).length;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <Pressable onPress={onOpen}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.moduleCover} />
        ) : (
          <View style={[styles.moduleCover, { backgroundColor: '#E8EEF9', alignItems: 'center', justifyContent: 'center' }]}>
            <BookOpen size={36} color="rgba(41,102,242,0.55)" strokeWidth={1.4} />
          </View>
        )}
        <View style={{ padding: 14 }}>
          <Text style={styles.tag}>{module.category || (module.suggested ? 'Suggested' : 'Module')}</Text>
          <Text style={[type.h3, { marginTop: 4 }]} numberOfLines={2}>
            {module.title}
          </Text>
          {module.suggested && pct <= 0 ? (
            <Text style={{ marginTop: 8, fontFamily: fonts.semibold, fontSize: 12, color: colors.primary }}>
              Start this module
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted }}>{pct}%</Text>
            </View>
          )}
        </View>
      </Pressable>
      {module.sections.length > 0 ? (
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
          <Pressable onPress={onToggle} style={styles.sectionSummary}>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: colors.text }}>
              Sections{' '}
              <Text style={{ fontFamily: fonts.medium, color: colors.textMuted }}>
                {module.suggested && pct <= 0 ? module.sections.length : `${done}/${module.sections.length}`}
              </Text>
            </Text>
            <ChevronDown
              size={16}
              color={colors.textMuted}
              strokeWidth={2}
              style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          {expanded
            ? module.sections.map((section) => (
                <Pressable
                  key={`${module.id}-${section.index}`}
                  onPress={() => onOpenSection(section.index)}
                  style={styles.sectionRow}
                >
                  <CheckCircle2
                    size={14}
                    color={section.completed ? colors.primary : '#E2E8F0'}
                    strokeWidth={2}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontFamily: fonts.medium,
                      fontSize: 12,
                      color: section.completed ? colors.text : colors.textMuted,
                    }}
                  >
                    {section.title}
                  </Text>
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function HomeScreen() {
  const { profile, session, isPremium } = useAuth();
  const { canUseNetwork, downloadedCount } = useOffline();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weekUsage, setWeekUsage] = useState<WeekDayMinutes[]>([]);
  const [continueCards, setContinueCards] = useState<ContinueCard[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [openModuleId, setOpenModuleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user.id) {
      setLoading(false);
      return;
    }
    const userId = session.user.id;
    await ConnectivityManager.hydrate();
    if (!ConnectivityManager.canUseNetwork()) {
      const [progressRows, sectionRows, activityRows, installed] = await Promise.all([
        ProgressStore.allModules(),
        ProgressStore.sections(),
        ProgressStore.weekActivity(),
        CourseStore.list(),
      ]);
      const sectionIndexes = new Map<string, Set<number>>();
      for (const row of sectionRows) {
        const set = sectionIndexes.get(row.module_id) ?? new Set<number>();
        set.add(row.section_index);
        sectionIndexes.set(row.module_id, set);
      }
      const cards: ContinueCard[] = [];
      for (const row of progressRows) {
        const pack = installed.find((item) => item.kind === 'module' && item.id === row.module_id);
        const local = await loadLocalContent<ModuleRow>('module', row.module_id);
        const title = local?.title ?? pack?.title;
        if (!title) continue;
        const pages = local ? modulePages(local) : [];
        cards.push({
          id: row.module_id,
          title,
          category: local?.category ?? null,
          imageUrl: local?.image_url ?? null,
          progress: row.progress,
          suggested: false,
          sections: pages.map((page, index) => ({
            index,
            title: page.title,
            completed: sectionIndexes.get(row.module_id)?.has(index) ?? false,
          })),
        });
      }
      const week = buildWeekUsage(activityRows);
      const todayKey = londonDateKey();
      const today = week.find((d) => d.key === todayKey)?.minutes ?? 0;
      setStreakDays(0);
      setWeekUsage(week);
      setTodayMinutes(today);
      setContinueCards(cards.slice(0, 3));
      setCommunityPosts([]);
      setLoading(false);
      return;
    }

    const activitySince = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

    try {
    const [
      statsResult,
      recentModulesResult,
      sectionProgressResult,
      suggestedResult,
      postsResult,
      activityResult,
    ] = await Promise.all([
      supabase.from('user_statistics').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('user_module_progress')
        .select('module_id, progress, last_accessed, completed, modules(id, title, category, subcategory, image_url, total_lessons)')
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false })
        .limit(24),
      supabase.from('user_section_progress').select('module_id, section_index').eq('user_id', userId),
      supabase
        .from('modules')
        .select('id, title, category, subcategory, image_url, is_featured, total_lessons')
        .or('hidden.eq.false,hidden.is.null')
        .order('is_featured', { ascending: false })
        .limit(6),
      supabase
        .from('posts')
        .select('id, title, created_at, author:profiles!posts_user_id_fkey(full_name)')
        .eq('is_deleted', false)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('user_activity_log')
        .select('session_start, duration_seconds')
        .eq('user_id', userId)
        .gte('session_start', activitySince),
    ]);

    const stats = statsResult.data as {
      daily_streak?: number;
      study_streak?: number;
      modules_completed?: number;
    } | null;

    const sectionIndexes = new Map<string, Set<number>>();
    for (const row of sectionProgressResult.data ?? []) {
      if (!row.module_id) continue;
      const set = sectionIndexes.get(row.module_id) ?? new Set<number>();
      set.add(row.section_index);
      sectionIndexes.set(row.module_id, set);
    }

    const progressByModule = new Map<string, ProgressRow>();
    for (const row of (recentModulesResult.data ?? []) as ProgressRow[]) {
      if (row.module_id) progressByModule.set(row.module_id, row);
    }

    const mappedContinue: ContinueCard[] = [];
    for (const row of progressByModule.values()) {
      const mod = firstJoin(row.modules);
      if (!mod?.title || !row.module_id) continue;
      const progress = resolveProgress(
        row.progress,
        row.completed,
        sectionIndexes.get(row.module_id)?.size ?? 0,
        mod.total_lessons,
      );
      if (progress <= 0) continue;
      mappedContinue.push({
        id: row.module_id,
        title: mod.title,
        category: mod.category ?? null,
        imageUrl: mod.image_url ?? null,
        progress,
        suggested: false,
        sections: [],
      });
    }
    mappedContinue.sort((a, b) => {
      const aDone = a.progress >= 100 ? 1 : 0;
      const bDone = b.progress >= 100 ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      return b.progress - a.progress;
    });

    const recentIds = new Set(mappedContinue.map((m) => m.id));
    const suggested: ContinueCard[] = ((suggestedResult.data ?? []) as ModuleJoin[])
      .filter((mod) => mod.id && !recentIds.has(mod.id))
      .slice(0, 3)
      .map((mod) => ({
        id: mod.id as string,
        title: mod.title ?? 'Module',
        category: mod.category ?? null,
        imageUrl: mod.image_url ?? null,
        progress: 0,
        suggested: true,
        sections: [],
      }));

    const started = mappedContinue.filter((m) => m.progress > 0);
    const picked = (started.length > 0 ? [...started, ...suggested] : suggested).slice(0, 3);
    const candidateIds = picked.map((m) => m.id);

    if (candidateIds.length > 0) {
      const contentById = new Map<string, ModuleRow>();
      for (const cardId of candidateIds) {
        const local = await loadLocalContent<ModuleRow>('module', cardId);
        if (local) contentById.set(local.id, local);
      }
      for (const card of picked) {
        const content = contentById.get(card.id);
        const completedSet = sectionIndexes.get(card.id) ?? new Set<number>();
        const pages = content ? modulePages(content) : [];
        const sections =
          pages.length > 0
            ? pages.map((page, index) => ({
                index,
                title: page.title || `Page ${index + 1}`,
                completed: completedSet.has(index),
              }))
            : [{ index: 0, title: 'Page 1', completed: completedSet.has(0) }];
        card.sections = sections;
        if (!card.suggested) {
          const done = sections.filter((s) => s.completed).length;
          card.progress = Math.max(card.progress, Math.round((done / sections.length) * 100));
        }
      }
    }

    const localUnsynced = await ProgressStore.unsyncedActivity();
    const week = buildWeekUsage([...(activityResult.data ?? []), ...localUnsynced]);
    const todayKey = londonDateKey();
    const today = week.find((d) => d.key === todayKey)?.minutes ?? 0;

    setStreakDays(stats?.daily_streak ?? stats?.study_streak ?? 0);
    setWeekUsage(week);
    setTodayMinutes(today);
    setContinueCards(picked);
    setCommunityPosts(
      ((postsResult.data ?? []) as Array<{
        id: string;
        title: string;
        created_at: string;
        author?: { full_name?: string | null } | { full_name?: string | null }[] | null;
      }>).map((post) => {
        const author = firstJoin(post.author);
        return {
          id: post.id,
          title: post.title,
          authorName: author?.full_name || 'Cadet',
          createdAtLabel: timeAgo(post.created_at),
        };
      }),
    );
    } catch (err) {
      if (!isOfflineModeError(err)) throw err;
      setCommunityPosts([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const firstName = profile?.full_name?.split(' ')[0] || 'Cadet';
  const greeting = greetingForLondon();
  const targetPercent = Math.min(100, Math.round((todayMinutes / DAILY_STUDY_GOAL_MINUTES) * 100));
  const remaining = Math.max(0, DAILY_STUDY_GOAL_MINUTES - todayMinutes);
  const hitTarget = todayMinutes >= DAILY_STUDY_GOAL_MINUTES;
  const hasContinue = continueCards.some((m) => !m.suggested && m.progress > 0 && m.progress < 100);
  const hasStarted = continueCards.some((m) => !m.suggested);

  const quickLinks = [
    { label: 'Modules', glyph: 'book' as const, Watermark: BookOpen, href: '/learn/modules' as const },
    { label: 'Flashcards', glyph: 'layers' as const, Watermark: WalletCards, href: '/learn/flashcards' as const },
    { label: 'TRB', glyph: 'document' as const, Watermark: FileText, href: '/trb' as const },
  ];

  if (!session) return <Redirect href="/(auth)/login" />;
  if (loading) return <LoadingScreen />;

  return (
    <Screen scroll safeTop>
      <View style={styles.banner}>
        <Image source={BRAND_SOURCES.backgroundBar} style={styles.bannerImage} resizeMode="cover" />
        <View style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
          <Text style={styles.bannerKicker}>Full Syllabus:</Text>
          <Text style={styles.bannerStatus}>{isPremium ? 'Unlocked' : 'Locked'}</Text>
        </View>
        <Pressable
          onPress={() => router.push(href(isPremium ? '/learn/modules' : '/profile/store'))}
          style={({ pressed }) => [styles.bannerCta, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.bannerCtaText}>{isPremium ? 'Browse modules' : 'Upgrade to Premium'}</Text>
        </Pressable>
      </View>

      {canUseNetwork && downloadedCount === 0 ? (
        <Card>
          <Text style={type.h3}>Download courses before you go to sea</Text>
          <Text style={[type.muted, { marginTop: 6 }]}>
            Nothing downloads until you review the size. Ship internet can be expensive.
          </Text>
          <Pressable
            onPress={() => router.push(connectHref('check'))}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          >
            <Text style={[type.body, { color: colors.primary, fontFamily: fonts.semibold }]}>Review downloads</Text>
          </Pressable>
        </Card>
      ) : null}

      <Card style={{ paddingVertical: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
            <ProgressRing percent={targetPercent} profile={profile} />
            <Text style={[type.h3, { marginTop: 8, textAlign: 'center' }]} numberOfLines={1}>
              {greeting} {firstName}
            </Text>
            {streakDays > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Flame size={14} color="#F59E0B" strokeWidth={2} />
                <Text style={type.caption}>{streakDays}-day streak</Text>
              </View>
            ) : null}
            <Text style={[type.caption, { marginTop: 6, textAlign: 'center' }]}>
              {hitTarget
                ? `Today's ${DAILY_STUDY_GOAL_MINUTES}-minute target is done.`
                : `${DAILY_STUDY_GOAL_MINUTES} minutes a day — ${remaining} min to go.`}
            </Text>
          </View>
          <WeekBars weekUsage={weekUsage} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {quickLinks.map((item) => (
          <QuickLinkTile
            key={item.label}
            label={item.label}
            glyph={item.glyph}
            Watermark={item.Watermark}
            onPress={() => router.push(href(item.href))}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.cardTitle}>
            {hasContinue ? 'Continue learning' : hasStarted ? 'Your modules' : 'Suggested for you'}
          </Text>
          <Text style={type.caption}>
            {hasContinue
              ? 'Pick up modules you have started.'
              : hasStarted
                ? 'Modules you have already worked through.'
                : 'Start with these — they cover the core OOW topics.'}
          </Text>
        </View>
        <Pressable onPress={() => router.push(href('/learn/modules'))}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>

      {continueCards.length === 0 ? (
        <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={type.h3}>No modules to show yet</Text>
          <Text style={[type.muted, { textAlign: 'center', marginTop: 4 }]}>Browse the library and start your first one.</Text>
        </Card>
      ) : (
        continueCards.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            expanded={openModuleId === module.id}
            onToggle={() => setOpenModuleId((id) => (id === module.id ? null : module.id))}
            onOpen={() => router.push(moduleHref(module.id))}
            onOpenSection={(index) => router.push(moduleHref(module.id, index + 1))}
          />
        ))
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.cardTitle}>Community</Text>
        <Pressable onPress={() => router.push('/community')}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>

      <Card>
        {communityPosts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={styles.communityIcon}>
              <MessageSquare size={16} color={colors.primary} strokeWidth={1.75} />
            </View>
            <Text style={[type.h3, { marginTop: 10 }]}>No posts yet</Text>
            <Text style={[type.caption, { textAlign: 'center', marginTop: 4 }]}>
              Share a question or tip with other cadets.
            </Text>
          </View>
        ) : (
          communityPosts.map((post) => (
            <Pressable
              key={post.id}
              onPress={() => router.push(`/community/${post.id}`)}
              style={styles.communityRow}
            >
              <View style={styles.communityAvatar}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: colors.primary }}>
                  {post.authorName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: colors.text }} numberOfLines={1}>
                  {post.title}
                </Text>
                <Text style={type.caption} numberOfLines={1}>
                  {post.authorName} · {post.createdAtLabel}
                </Text>
              </View>
            </Pressable>
          ))
        )}
        <Pressable
          onPress={() => router.push('/community/compose')}
          style={({ pressed }) => [styles.createPost, pressed && { opacity: 0.88 }]}
        >
          <Plus size={14} color="#475569" strokeWidth={2.2} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: '#475569' }}>Create post</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = {
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    overflow: 'hidden' as const,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
    position: 'relative' as const,
    minHeight: 96,
    ...shadow.card,
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none' as const,
  },
  bannerKicker: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
  },
  bannerStatus: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  bannerCta: {
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 1,
  },
  bannerCtaText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.primary,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primary,
  },
  tag: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  ringAvatar: {
    position: 'absolute' as const,
    top: 17,
    left: 17,
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ringBadge: {
    position: 'absolute' as const,
    right: -2,
    top: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    ...shadow.card,
  },
  moduleCover: {
    width: '100%' as const,
    height: 132,
    backgroundColor: '#E8EEF9',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 99,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 99,
    backgroundColor: colors.primary,
  },
  sectionSummary: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  communityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  communityRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 8,
  },
  communityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  createPost: {
    marginTop: 8,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
};
