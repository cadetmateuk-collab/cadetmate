import Link from 'next/link';
import {
  BookOpen,
  ClipboardList,
  Trophy,
  Clock,
  ArrowRight,
  Anchor,
  ChevronRight,
  LayoutGrid,
  PenLine,
  MessageSquare,
  Newspaper,
  GraduationCap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-white shadow-[0_2px_12px_rgba(41,102,242,0.06)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WelcomeHeader({
  firstName,
  quote = 'A smooth sea never made a skilled sailor.',
}: {
  firstName: string;
  quote?: string;
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl md:text-[1.75rem] font-bold tracking-tight text-foreground">
          Welcome back, {firstName}!
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xl leading-relaxed">
          Keep learning. Keep growing. Your journey to becoming a competent officer continues.
        </p>
      </div>
      <div className="shrink-0 rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3 max-w-sm">
        <div className="flex items-start gap-2.5">
          <Anchor className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={1.75} />
          <p className="text-sm italic text-foreground/80 leading-snug">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  href: string;
  linkLabel: string;
  icon: LucideIcon;
  accent: 'blue' | 'green' | 'amber' | 'violet';
};

const STAT_ACCENTS = {
  blue: { wrap: 'bg-primary/10 text-primary', value: 'text-primary' },
  green: { wrap: 'bg-emerald-500/10 text-emerald-600', value: 'text-emerald-600' },
  amber: { wrap: 'bg-amber-500/10 text-amber-600', value: 'text-amber-600' },
  violet: { wrap: 'bg-violet-500/10 text-violet-600', value: 'text-violet-600' },
} as const;

export function StatCards({ items }: { items: StatCardProps[] }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
      {items.map((item) => {
        const Icon = item.icon;
        const accent = STAT_ACCENTS[item.accent];
        return (
          <DashCard key={item.label} className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-2">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  accent.wrap,
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.label}
            </p>
            <p className={cn('mt-1 text-3xl font-extrabold tabular-nums tracking-tight', accent.value)}>
              {item.value}
            </p>
            <Link
              href={item.href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              {item.linkLabel}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </DashCard>
        );
      })}
    </div>
  );
}

export function ContinueLearningCard({
  title,
  description,
  progress,
  href,
  buttonLabel = 'Continue Course',
}: {
  title: string;
  description: string;
  progress: number;
  href: string;
  buttonLabel?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <DashCard className="overflow-hidden p-0">
      <div className="flex flex-col sm:flex-row">
        <div
          className="relative sm:w-[42%] min-h-[140px] sm:min-h-[200px] shrink-0"
          style={{
            background:
              'linear-gradient(145deg, #1638B0 0%, #2966F2 55%, #5B8CFF 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap className="h-16 w-16 text-white/80" strokeWidth={1.25} />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-5 md:p-6">
          <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            In Progress
          </span>
          <h2 className="mt-3 text-lg font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-muted-foreground">{pct}% Complete</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Link
            href={href}
            className="mt-5 inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors min-h-[44px]"
          >
            {buttonLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DashCard>
  );
}

export function OverallProgressCard({
  overall,
  completed,
  inProgress,
  notStarted,
}: {
  overall: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(overall)));
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <DashCard className="p-5 md:p-6 h-full">
      <h2 className="text-base font-bold tracking-tight text-foreground">Overall Progress</h2>
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-5">
        <div className="relative h-36 w-36 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
            <circle cx="64" cy="64" r={r} fill="none" stroke="#E8EEF9" strokeWidth="12" />
            <circle
              cx="64"
              cy="64"
              r={r}
              fill="none"
              stroke="#2966F2"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-primary tabular-nums">{pct}%</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Overall
            </span>
          </div>
        </div>
        <ul className="w-full space-y-3 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Courses Completed
            </span>
            <span className="font-bold tabular-nums">{completed}</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              In Progress
            </span>
            <span className="font-bold tabular-nums">{inProgress}</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              Not Started
            </span>
            <span className="font-bold tabular-nums">{notStarted}</span>
          </li>
        </ul>
      </div>
    </DashCard>
  );
}

type UpcomingItem = {
  title: string;
  meta: string;
  tag: string;
  tagTone: 'amber' | 'blue' | 'green';
  href: string;
};

const TAG_TONES = {
  amber: 'bg-amber-500/10 text-amber-700',
  blue: 'bg-primary/10 text-primary',
  green: 'bg-emerald-500/10 text-emerald-700',
} as const;

export function UpcomingCard({ items }: { items: UpcomingItem[] }) {
  return (
    <DashCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-tight">Upcoming</h2>
        <Link href="/practice" className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.title} className="flex gap-3">
            <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div className="min-w-0 flex-1">
              <Link href={item.href} className="text-sm font-semibold text-foreground hover:text-primary">
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>
              <span
                className={cn(
                  'mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                  TAG_TONES[item.tagTone],
                )}
              >
                {item.tag}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}

type AnnouncementItem = {
  title: string;
  time: string;
  href: string;
  icon: LucideIcon;
};

export function AnnouncementsCard({ items }: { items: AnnouncementItem[] }) {
  return (
    <DashCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold tracking-tight">Announcements</h2>
        <Link href="/free-content" className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.title}>
              <Link href={item.href} className="flex items-start gap-3 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.time}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </DashCard>
  );
}

const QUICK_LINKS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Browse Courses', href: '/unit-modules', icon: BookOpen },
  { label: 'Practice Orals', href: '/practice', icon: PenLine },
  { label: 'View Progress', href: '/progress', icon: ClipboardList },
  { label: 'Community', href: '/community', icon: MessageSquare },
  { label: 'Free Articles', href: '/free-content', icon: Newspaper },
  { label: 'Resources', href: '/resources', icon: LayoutGrid },
];

export function QuickLinksCard({ links = QUICK_LINKS }: { links?: typeof QUICK_LINKS }) {
  return (
    <DashCard className="p-5 h-full">
      <h2 className="text-base font-bold tracking-tight mb-4">Quick Links</h2>
      <ul className="space-y-1">
        {links.map(({ label, href, icon: Icon }) => (
          <li key={label}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors min-h-[44px]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}

export const DASH_STAT_ICONS = {
  BookOpen,
  ClipboardList,
  Trophy,
  Clock,
} as const;
