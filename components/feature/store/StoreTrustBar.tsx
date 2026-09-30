import { Anchor, BookOpen, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

const ITEMS = [
  { icon: ShieldCheck, label: 'Secure payments via Stripe' },
  { icon: GraduationCap, label: 'Instant unlock after payment' },
  { icon: BookOpen, label: 'Packs sold separately from Premium' },
  { icon: Sparkles, label: 'Cancel Premium anytime in billing' },
  { icon: Anchor, label: 'Built for UK deck cadets' },
] as const;

export function StoreTrustBar() {
  return (
    <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-8 text-caption text-muted-foreground">
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="inline-flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
