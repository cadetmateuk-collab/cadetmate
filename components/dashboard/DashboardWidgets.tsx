import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DashboardCard({
  title,
  description,
  href,
  icon: Icon,
  className,
  children,
  action,
}: {
  title: string;
  description?: string;
  href?: string;
  icon?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const content = (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-sm">{title}</h3>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  if (href) {
    return <Link href={href} className="block group">{content}</Link>;
  }
  return content;
}

export function PremiumTeaser({
  title,
  description,
  previewLabel = 'Preview available',
}: {
  title: string;
  description: string;
  previewLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-5 relative overflow-hidden">
      <div className="absolute top-3 right-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full flex items-center gap-1">
          <Lock className="h-3 w-3" /> {previewLabel}
        </span>
      </div>
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 pr-16">
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
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

export function StatPill({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-8 px-4">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{pct}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
