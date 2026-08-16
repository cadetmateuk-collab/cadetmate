import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Compass,
  FileText,
  Flame,
  MessageSquare,
  Plus,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/auth/onboarding/UserAvatar';
import { SubscribeButton } from '@/components/billing/SubscribeButton';
import { QuickLinkGlyph, type QuickLinkGlyphName } from '@/components/dashboard/QuickLinkGlyph';
import type { AvatarKind } from '@/lib/onboarding/constants';

export type DashboardAvatar = {
  fullName: string;
  avatarKind: AvatarKind;
  avatarPreset: string | null;
  avatarColor: string | null;
  role: string | null;
};

export type ContinueModuleSection = {
  index: number;
  title: string;
  completed: boolean;
};

export type ContinueModule = {
  id: string;
  title: string;
  category: string | null;
  imageUrl: string | null;
  progress: number;
  href: string;
  sections: ContinueModuleSection[];
  totalLessons?: number;
};

export type CommunityPostPreview = {
  id: string;
  title: string;
  createdAtLabel: string;
  authorName: string;
  author: DashboardAvatar;
  userId: string;
};

export type WeekDayUsage = {
  key: string;
  label: string;
  minutes: number;
};

export type DashboardHomeProps = {
  firstName: string;
  greeting: string;
  isPremium: boolean;
  isGuest?: boolean;
  streakDays: number;
  weeklyMinutes: number;
  dailyGoalMinutes: number;
  todayMinutes: number;
  targetPercent: number;
  avatar: DashboardAvatar;
  weekUsage: WeekDayUsage[];
  inProgressCount: number;
  completedCount: number;
  continueModules: ContinueModule[];
  suggestedModules: ContinueModule[];
  communityPosts: CommunityPostPreview[];
};

function paneCard(className?: string) {
  return cn(
    'rounded-2xl border border-black/[0.06] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]',
    className,
  );
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  colregs: Compass,
  navigation: Compass,
  meteorology: Compass,
  cargo: BookOpen,
};

function categoryKey(category: string | null) {
  return (category ?? '').toLowerCase();
}

function usableCover(url: string | null) {
  if (!url) return null;
  if (url.startsWith('/')) return url;
  try {
    const host = new URL(url).hostname;
    if (
      host.endsWith('supabase.co') ||
      host === 'images.unsplash.com' ||
      host === 'cadetmate.co.uk' ||
      host.endsWith('.cadetmate.co.uk')
    ) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

function ModuleCover({
  title,
  category,
  imageUrl,
  className,
}: {
  title: string;
  category: string | null;
  imageUrl: string | null;
  className?: string;
}) {
  const Icon = CATEGORY_ICON[categoryKey(category)] ?? BookOpen;
  const cover = usableCover(imageUrl);

  return (
    <div className={cn('relative overflow-hidden bg-[#E8EEF9]', className)}>
      {cover ? (
        <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 240px" className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
          <Icon className="h-10 w-10 text-primary/55" strokeWidth={1.4} />
        </div>
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}

function PremiumBanner({
  isPremium,
  isGuest,
}: {
  isPremium: boolean;
  isGuest: boolean;
}) {
  const ctaClass =
    'inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold !text-primary hover:bg-white/90 hover:!text-primary';

  return (
    <section className={paneCard('dashboard-home__hero dashboard-premium-banner relative justify-between gap-4 overflow-hidden border-0 px-6 text-white shadow-[0_12px_32px_rgba(41,102,242,0.22)]')}>
      <div className="min-w-0">
        <h2 className="dashboard-home__hero-title">Full Syllabus:</h2>
        <p className="dashboard-home__hero-status">{isPremium ? 'Unlocked' : 'Locked'}</p>
      </div>
      {isPremium ? (
        <Link href="/unit-modules" className={ctaClass}>
          Browse modules
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
      ) : isGuest ? (
        <Link href="/auth?mode=signup&redirectTo=/store" className={ctaClass}>
          Upgrade to Premium
        </Link>
      ) : (
        <SubscribeButton className={ctaClass} label="Upgrade to Premium" />
      )}
    </section>
  );
}

function QuickLinks({
  inProgressCount,
  completedCount,
  isGuest,
}: {
  inProgressCount: number;
  completedCount: number;
  isGuest: boolean;
}) {
  const moduleHint =
    inProgressCount > 0
      ? `${inProgressCount} in progress`
      : completedCount > 0
        ? `${completedCount} completed`
        : 'Browse the syllabus';

  const items: {
    href: string;
    label: string;
    hint: string;
    icon: QuickLinkGlyphName;
    Watermark: LucideIcon;
  }[] = [
    {
      href: isGuest ? '/pricing' : '/unit-modules',
      label: 'Learn modules',
      hint: moduleHint,
      icon: 'book',
      Watermark: BookOpen,
    },
    {
      href: isGuest ? '/pricing' : '/flashcards',
      label: 'Flashcards',
      hint: 'Spaced repetition packs',
      icon: 'layers',
      Watermark: WalletCards,
    },
    {
      href: isGuest ? '/pricing' : '/trb',
      label: 'TRB',
      hint: 'Training Record Book',
      icon: 'document',
      Watermark: FileText,
    },
  ];

  return (
    <div className="dashboard-home__quicklinks">
      {items.map((item) => {
        const Watermark = item.Watermark;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              paneCard(
                'relative flex h-full flex-col justify-center overflow-hidden px-4 py-3.5 transition-colors hover:border-primary/25 hover:bg-primary/[0.02]',
              ),
            )}
          >
            <QuickLinkGlyph name={item.icon} className="relative z-10 h-9 w-9 text-primary" />
            <span className="relative z-10 mt-2.5 text-[11px] font-medium leading-snug text-muted-foreground">
              {item.hint}
            </span>
            <span className="relative z-10 mt-0.5 text-sm font-bold leading-snug text-foreground">
              {item.label}
            </span>
            <Watermark
              aria-hidden
              className="pointer-events-none absolute -bottom-7 -right-6 h-32 w-32 rotate-[18deg] text-slate-100"
              strokeWidth={1}
            />
          </Link>
        );
      })}
    </div>
  );
}

function ModuleCard({
  module,
  suggested,
}: {
  module: ContinueModule;
  suggested?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(module.progress)));
  const sections = module.sections ?? [];
  const completedSections = sections.filter((section) => section.completed).length;
  const showSections = sections.length > 0;

  return (
    <article className={paneCard('flex h-full min-h-0 flex-col overflow-hidden transition-colors hover:border-primary/25')}>
      <Link href={module.href} className="group flex min-h-0 flex-1 flex-col">
        <ModuleCover
          title={module.title}
          category={module.category}
          imageUrl={module.imageUrl}
          className="min-h-[6.5rem] w-full flex-1"
        />
        <div className="shrink-0 px-3.5 pb-3 pt-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            {module.category || (suggested ? 'Suggested' : 'Module')}
          </span>
          <h3 className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-foreground group-hover:text-primary">
            {module.title}
          </h3>
          {suggested && pct <= 0 ? (
            <p className="mt-2 text-[11px] font-semibold text-primary">Start this module</p>
          ) : (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">{pct}%</span>
            </div>
          )}
        </div>
      </Link>

      {showSections && (
        <details className="group relative z-10 mt-auto flex shrink-0 flex-col border-t border-black/[0.06] bg-white open:min-h-0 open:flex-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-slate-50 px-3.5 py-2.5 text-[11px] font-semibold text-foreground marker:content-none hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
            <span>
              Sections
              <span className="ml-1 font-medium text-muted-foreground">
                {suggested && pct <= 0
                  ? `${sections.length}`
                  : `${completedSections}/${sections.length}`}
              </span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
            {sections.map((section) => (
              <li key={`${module.id}-${section.index}`}>
                <Link
                  href={`${module.href}?section=${section.index + 1}`}
                  className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-[11px] hover:bg-slate-50"
                >
                  <CheckCircle2
                    className={cn(
                      'h-3.5 w-3.5 shrink-0',
                      section.completed ? 'text-primary' : 'text-slate-200',
                    )}
                    strokeWidth={2}
                  />
                  <span className={cn('min-w-0 flex-1 truncate', section.completed ? 'text-foreground' : 'text-muted-foreground')}>
                    {section.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function ContinueSection({
  continueModules,
  suggestedModules,
}: {
  continueModules: ContinueModule[];
  suggestedModules: ContinueModule[];
}) {
  const started = continueModules.filter((m) => m.progress > 0);
  const hasContinue = started.some((m) => m.progress < 100);
  const hasAnyStarted = started.length > 0;
  const continueIds = new Set(started.map((m) => m.id));
  const modules: Array<ContinueModule & { suggested: boolean }> = hasAnyStarted
    ? [
        ...started.map((m) => ({ ...m, suggested: false })),
        ...suggestedModules
          .filter((m) => !continueIds.has(m.id))
          .map((m) => ({ ...m, suggested: true })),
      ].slice(0, 3)
    : suggestedModules.map((m) => ({ ...m, suggested: true })).slice(0, 3);

  return (
    <section className="dashboard-home__modules">
      <div className="mb-2 flex shrink-0 items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            {hasContinue ? 'Continue learning' : hasAnyStarted ? 'Your modules' : 'Suggested for you'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasContinue
              ? 'Pick up modules you have started.'
              : hasAnyStarted
                ? 'Modules you have already worked through.'
                : 'Start with these — they cover the core OOW topics.'}
          </p>
        </div>
        <Link href="/unit-modules" className="shrink-0 text-xs font-semibold text-primary hover:underline">
          See all
        </Link>
      </div>

      {modules.length === 0 ? (
        <div className={paneCard('flex flex-1 flex-col items-center justify-center px-5 py-6 text-center')}>
          <p className="text-sm font-semibold text-foreground">No modules to show yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Browse the library and start your first one.</p>
          <Link
            href="/unit-modules"
            className="mt-3 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Browse modules
          </Link>
        </div>
      ) : (
        <div className="dashboard-home__modules-grid">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} suggested={module.suggested} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProgressRingAvatar({
  avatar,
  percent,
}: {
  avatar: DashboardAvatar;
  percent: number;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));
  const size = 96;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EEF9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2966F2"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <UserAvatar
          fullName={avatar.fullName}
          avatarKind={avatar.avatarKind}
          avatarPreset={avatar.avatarPreset}
          avatarColor={avatar.avatarColor}
          role={avatar.role}
          size={62}
          showRoleBadge={false}
        />
      </div>
      <span className="absolute -right-0.5 top-1 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
        {pct}%
      </span>
    </div>
  );
}

function WeeklyUsageChart({
  weekUsage,
  weeklyMinutes,
  dailyGoalMinutes,
}: {
  weekUsage: WeekDayUsage[];
  weeklyMinutes: number;
  dailyGoalMinutes: number;
}) {
  const max = Math.max(dailyGoalMinutes, ...weekUsage.map((d) => d.minutes), 1);
  const hasAny = weekUsage.some((d) => d.minutes > 0);

  return (
    <section className={paneCard('dashboard-home__week px-4 py-3.5')}>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground">This week</h2>
          <p className="text-[11px] text-muted-foreground">{dailyGoalMinutes} min a day</p>
        </div>
        <p className="text-[11px] font-semibold tabular-nums text-foreground">
          {weeklyMinutes}
          <span className="font-medium text-muted-foreground"> min</span>
        </p>
      </div>
      <div className="flex h-[4.5rem] items-end gap-1.5">
        {weekUsage.map((day) => {
          const height = hasAny ? Math.max(day.minutes > 0 ? 14 : 8, (day.minutes / max) * 100) : 12;
          const isPeak = hasAny && day.minutes === max && day.minutes > 0;
          return (
            <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-12 w-full items-end justify-center">
                <div
                  className={cn(
                    'w-[70%] max-w-[18px] rounded-t-md',
                    isPeak ? 'bg-primary' : day.minutes > 0 ? 'bg-primary/45' : 'bg-slate-100',
                  )}
                  style={{ height: `${height}%` }}
                  title={`${day.label}: ${day.minutes} min`}
                />
              </div>
              <span className="text-[9px] font-medium text-muted-foreground">{day.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CommunityPane({
  posts,
  isGuest,
}: {
  posts: CommunityPostPreview[];
  isGuest: boolean;
}) {
  const composeHref = isGuest
    ? `/auth?mode=signup&redirectTo=${encodeURIComponent('/community?compose=1')}`
    : '/community?compose=1';

  return (
    <section className={cn(paneCard('dashboard-home__community px-4 pb-3 pt-3.5'))}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">Community</h2>
        <Link href="/community" className="text-xs font-semibold text-primary hover:underline">
          See all
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-foreground">No posts yet</p>
          <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
            Share a question or tip with other cadets.
          </p>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                href={`/community/post/${post.id}`}
                className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 hover:bg-slate-50"
              >
                <UserAvatar
                  fullName={post.author.fullName}
                  avatarKind={post.author.avatarKind}
                  avatarPreset={post.author.avatarPreset}
                  avatarColor={post.author.avatarColor}
                  size={32}
                  showRoleBadge={false}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-foreground">
                    {post.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {post.authorName} · {post.createdAtLabel}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={composeHref}
        className="mt-3 inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200/80"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
        Create post
      </Link>
    </section>
  );
}

export function DashboardHome({
  firstName,
  greeting,
  isPremium,
  isGuest = false,
  streakDays,
  weeklyMinutes,
  dailyGoalMinutes,
  todayMinutes,
  targetPercent,
  avatar,
  weekUsage,
  inProgressCount,
  completedCount,
  continueModules,
  suggestedModules,
  communityPosts,
}: DashboardHomeProps) {
  const remaining = Math.max(0, dailyGoalMinutes - todayMinutes);
  const hitTarget = todayMinutes >= dailyGoalMinutes;

  return (
    <div className="dashboard-home">
      <PremiumBanner isPremium={isPremium} isGuest={isGuest} />

      <section className={paneCard('dashboard-home__profile px-4 pb-4 pt-4 text-center')}>
        <ProgressRingAvatar avatar={avatar} percent={targetPercent} />
        <h1 className="dashboard-home__greeting">
          {greeting} {firstName}
          {streakDays > 0 && (
            <Flame className="ml-1 inline h-4 w-4 align-[-2px] text-amber-500" strokeWidth={2} />
          )}
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {hitTarget
            ? `Today's ${dailyGoalMinutes}-minute target is done.`
            : `${dailyGoalMinutes} minutes a day — ${remaining} min to go.`}
        </p>
      </section>

      <QuickLinks
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        isGuest={isGuest}
      />

      <WeeklyUsageChart
        weekUsage={weekUsage}
        weeklyMinutes={weeklyMinutes}
        dailyGoalMinutes={dailyGoalMinutes}
      />

      <ContinueSection continueModules={continueModules} suggestedModules={suggestedModules} />

      <CommunityPane posts={communityPosts} isGuest={isGuest} />
    </div>
  );
}
