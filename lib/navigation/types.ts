import type { LucideIcon } from 'lucide-react';

export type UserRole = 'free' | 'premium' | 'admin';

export type NavItemConfig = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Show lock icon and trigger premium modal for free users */
  premiumOnly?: boolean;
  /** Only visible to admins */
  adminOnly?: boolean;
  /** Exact match instead of startsWith */
  exact?: boolean;
  badge?: string;
};

export type NavGroupConfig = {
  id: string;
  label: string;
  icon?: LucideIcon;
  items: NavItemConfig[];
  /** Collapsed by default unless a child is active */
  defaultOpen?: boolean;
  adminOnly?: boolean;
};

export type MobileNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};
