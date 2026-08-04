import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Lock, Sparkles, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompassEmptyIcon } from '@/components/icons/MaritimeIcons';

/** Section label + optional link — no card chrome */
export function SectionHeader({
  title,
  description,
  href,
  hrefLabel = 'View all',
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-primary hover:gap-1.5 transition-all"
        >
          {hrefLabel}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export type StatStripAccent = 'amber' | 'brass' | 'primary' | 'starboard' | 'muted';

export type StatStripItem = {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  icon?: LucideIcon;
  accent?: StatStripAccent;
  /** 0–100 optional mini bar under the value (e.g. daily goal) */
  progress?: number;
};

const STAT_ACCENT: Record<
  StatStripAccent,
  { iconWrap: string; icon: string; value: string; bar: string }
> = {
  amber: {
    iconWrap: 'bg-amber-signal-light',
    icon: 'text-amber-signal',
    value: 'text-amber-signal',
    bar: 'bg-amber-signal',
  },
  brass: {
    iconWrap: 'bg-brass/15',
    icon: 'text-brass',
    value: 'text-brass',
    bar: 'bg-brass',
  },
  primary: {
    iconWrap: 'bg-primary/10',
    icon: 'text-primary',
    value: 'text-primary',
    bar: 'bg-primary',
  },
  starboard: {
    iconWrap: 'bg-starboard-light',
    icon: 'text-starboard',
    value: 'text-starboard',
    bar: 'bg-starboard',
  },
  muted: {
    iconWrap: 'bg-muted',
    icon: 'text-muted-foreground',
    value: 'text-foreground',
    bar: 'bg-muted-foreground/50',
  },
};

/** Condensed stats with icon accents — soft strip, not boxed cards */
export function StatsStrip({ items }: { items: StatStripItem[] }) {
  return (
    <div className="rounded-xl bg-muted/35 ring-1 ring-border/50 px-2 py-3 sm:px-3 sm:py-3.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 sm:gap-0">
        {items.map((item) => {
          const accent = STAT_ACCENT[item.accent ?? 'muted'];
          const Icon = item.icon;
          const progress = item.progress != null ? Math.min(100, Math.max(0, item.progress)) : null;

          const inner = (
            <div className="flex items-start gap-2.5 px-2.5 py-2 sm:px-3 rounded-lg transition-colors group-hover:bg-background/60">
              {Icon && (
                <div
                  className={cn(
                    'mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0',
                    accent.iconWrap,
                    item.accent === 'amber' && 'animate-streak-pulse',
                  )}
                >
                  <Icon className={cn('h-4 w-4', accent.icon)} strokeWidth={1.75} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  {item.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-xl font-extrabold tracking-tight tabular-nums leading-none sm:text-[1.35rem]',
                    accent.value,
                  )}
                >
                  {item.value}
                </p>
                {item.sub && (
                  <p className="mt-1 text-[0.7rem] text-muted-foreground leading-snug truncate">
                    {item.sub}
                  </p>
                )}
                {progress != null && (
                  <div className="mt-2 h-1 w-full max-w-[4.5rem] rounded-full bg-border/80 overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', accent.bar)}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );

          return (
            <div key={item.label} className="min-w-0">
              {item.href ? (
                <Link href={item.href} className="block group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                  {inner}
                </Link>
              ) : (
                <div className="group">{inner}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type ActionHubItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/** Compact destination row — icon + label, no cards */
export function ActionHub({ items }: { items: ActionHubItem[] }) {
  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Quick actions"
    >
      {items.map(({ label, href, icon: Icon }) => (
        <Link
          key={href + label}
          href={href}
          className="inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-foreground
            bg-background ring-1 ring-border/70 shadow-sm
            hover:ring-primary/35 hover:bg-primary/[0.04] hover:text-primary
            transition-all duration-150 min-h-[44px]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
          {label}
        </Link>
      ))}
    </nav>
  );
}

type CardAccent = 'default' | 'amber' | 'starboard' | 'navy' | 'brass' | 'challenge';

const ACCENT_STYLES: Record<CardAccent, { icon: string }> = {
  default: { icon: 'bg-primary/10 text-primary' },
  amber: { icon: 'bg-amber-signal-light text-amber-signal' },
  starboard: { icon: 'bg-starboard-light text-starboard' },
  navy: { icon: 'bg-primary/10 text-primary' },
  brass: { icon: 'bg-brass/15 text-brass' },
  challenge: { icon: 'bg-amber-signal-light text-amber-signal' },
};

export function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  accent = 'default',
  className,
  children,
  action,
}: {
  title: string;
  description?: string;
  href?: string;
  icon?: LucideIcon;
  accent?: CardAccent;
  className?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  challenge?: boolean;
}) {
  const styles = ACCENT_STYLES[accent];
  const accentBorder =
    accent === 'amber' ? 'border-l-amber-signal' :
    accent === 'starboard' ? 'border-l-starboard' :
    accent === 'brass' ? 'border-l-brass' :
    accent === 'challenge' ? 'border-l-amber-signal' :
    accent === 'navy' ? 'border-l-primary' :
    undefined;

  const content = (
    <div
      className={cn(
        'card card-hover',
        accentBorder && `border-l-[3px] ${accentBorder}`,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div
              className={cn(
                'h-10 w-10 rounded-md flex items-center justify-center shrink-0',
                styles.icon,
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground">{title}</h3>
            {description && (
              <p className="text-caption text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {action}
        {href && !action && (
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      {children}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }
  return content;
}

export function PremiumTeaser({
  title,
  description,
  previewLabel = 'Preview available',
  slim = false,
}: {
  title: string;
  description: string;
  previewLabel?: string;
  /** Inline strip without heavy card chrome */
  slim?: boolean;
}) {
  if (slim) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border border-brass/25 bg-brass/[0.06] px-4 py-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Sparkles className="h-4 w-4 text-brass shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-caption text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <Button size="sm" className="shrink-0 min-h-[44px] sm:min-h-0" asChild>
          <Link href="/store">
            Upgrade <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="card border-l-[3px] border-l-brass relative overflow-hidden">
      <div className="absolute top-3 right-3">
        <span className="badge badge--brass">
          <Lock className="h-3 w-3" /> {previewLabel}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-brass/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-brass" strokeWidth={1.75} />
        </div>
        <div className="flex-1 pr-16">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-caption text-muted-foreground mt-1">{description}</p>
          <Button size="sm" className="mt-3" asChild>
            <Link href="/store">
              Upgrade to Premium <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

type StatVariant = 'streak' | 'level' | 'modules' | 'readiness';

const STAT_VARIANTS: Record<
  StatVariant,
  { accent: string; iconBg: string; iconColor: string }
> = {
  streak: {
    accent: 'hsl(var(--signal-amber))',
    iconBg: 'bg-amber-signal-light',
    iconColor: 'text-amber-signal',
  },
  level: {
    accent: 'hsl(var(--brass))',
    iconBg: 'bg-brass/15',
    iconColor: 'text-brass',
  },
  modules: {
    accent: 'hsl(var(--primary))',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  readiness: {
    accent: 'hsl(var(--starboard))',
    iconBg: 'bg-starboard-light',
    iconColor: 'text-starboard',
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  variant,
  readinessPct,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  variant: StatVariant;
  readinessPct?: number;
}) {
  const v = STAT_VARIANTS[variant];

  return (
    <div
      className="stat-card"
      style={{ '--stat-accent': v.accent } as React.CSSProperties}
    >
      <div className="flex items-start gap-3 pl-2">
        <div
          className={cn(
            'h-9 w-9 rounded-md flex items-center justify-center shrink-0',
            v.iconBg,
            variant === 'streak' && 'animate-streak-pulse',
          )}
        >
          <Icon className={cn('h-4 w-4', v.iconColor)} strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-label font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {variant === 'readiness' && readinessPct !== undefined ? (
            <ReadinessGauge pct={readinessPct} />
          ) : (
            <p className="text-2xl font-bold mt-0.5 tracking-tight">{value}</p>
          )}
          {sub && <p className="text-caption text-muted-foreground">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function ReadinessGauge({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 70
      ? 'hsl(var(--starboard))'
      : clamped >= 40
        ? 'hsl(var(--signal-amber))'
        : 'hsl(var(--port))';

  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-3 mt-1">
      <div className="relative h-12 w-12 shrink-0">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
          />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {clamped}%
        </span>
      </div>
      <p className="text-caption text-muted-foreground">overall score</p>
    </div>
  );
}

/** @deprecated Use StatCard instead */
export function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="stat-card" style={{ '--stat-accent': 'hsl(var(--primary))' } as React.CSSProperties}>
      <p className="text-label font-semibold uppercase tracking-wider text-muted-foreground pl-2">{label}</p>
      <p className="text-2xl font-bold mt-0.5 pl-2">{value}</p>
      {sub && <p className="text-caption text-muted-foreground pl-2">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  illustrated = true,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  illustrated?: boolean;
}) {
  return (
    <div className="text-center py-8 px-4">
      {illustrated && (
        <div className="flex justify-center mb-4 text-muted-foreground/40">
          <CompassEmptyIcon className="h-20 w-20" />
        </div>
      )}
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-caption text-muted-foreground mt-1 max-w-xs mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  variant = 'brass',
}: {
  value: number;
  max?: number;
  label?: string;
  variant?: 'brass' | 'primary' | 'starboard';
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const fillClass =
    variant === 'primary'
      ? 'progress-bar__fill--primary'
      : variant === 'starboard'
        ? 'progress-bar__fill--starboard'
        : 'progress-bar__fill';

  return (
    <div>
      {label && (
        <div className="flex justify-between text-caption mb-1.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{pct}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className={cn('progress-bar__fill animate-progress-fill', fillClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function SegmentedProgressBar({
  value,
  max = 100,
  segments = 10,
  label,
}: {
  value: number;
  max?: number;
  segments?: number;
  label?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const filled = Math.round((pct / 100) * segments);

  return (
    <div>
      {label && (
        <p className="text-caption text-muted-foreground mb-1.5">{label}</p>
      )}
      <div className="progress-bar progress-bar--segmented">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={cn('progress-segment', i < filled && 'is-filled')}
          />
        ))}
      </div>
    </div>
  );
}
