import type { Permission } from '@/lib/auth/roles';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Globe2,
  Users,
  LifeBuoy,
  Home,
  Newspaper,
  HelpCircle,
  Pin,
  BookOpen,
  FileText,
  Anchor,
  WalletCards,
  Library,
  FileEdit,
  CheckCircle2,
  Settings,
  Shield,
  ShieldAlert,
  KeyRound,
  PenLine,
  Flag,
} from 'lucide-react';

export type AdminNavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  /** Permission required; omit = any staff */
  permission?: Permission;
  /** Alias permissions — any one grants access */
  anyOf?: Permission[];
};

export type AdminNavGroup = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { id: 'activity', label: 'Activity Log', href: '/admin/activity', icon: ClipboardList, permission: 'activity.view' },
      { id: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics.view' },
      { id: 'website-stats', label: 'Website Statistics', href: '/admin/website-statistics', icon: Globe2, permission: 'stats.view' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { id: 'users', label: 'Users', href: '/admin/users', icon: Users, permission: 'users.view' },
      { id: 'support', label: 'Support', href: '/admin/support', icon: LifeBuoy, permission: 'support.view' },
      {
        id: 'community-moderation',
        label: 'Community Moderation',
        href: '/admin/community/moderation',
        icon: Flag,
        permission: 'community.moderate',
      },
    ],
  },
  {
    id: 'free',
    label: 'Free',
    items: [
      { id: 'homepage', label: 'Homepage', href: '/admin/homepage', icon: Home, permission: 'homepage.manage' },
      { id: 'free-content', label: 'Free Content', href: '/admin/free-content', icon: Newspaper, anyOf: ['blog.create', 'blog.update'] },
      { id: 'questions', label: 'Questions', href: '/admin/questions', icon: HelpCircle, anyOf: ['questions.create', 'questions.update'] },
      { id: 'noticeboard', label: 'Noticeboard', href: '/admin/noticeboard', icon: Pin, anyOf: ['notices.create', 'notices.update'] },
    ],
  },
  {
    id: 'paid',
    label: 'Paid Content',
    items: [
      { id: 'modules', label: 'Modules', href: '/admin/modules', icon: BookOpen, anyOf: ['modules.create', 'modules.update'] },
      { id: 'module-builder', label: 'Module Builder', href: '/admin/module-builder', icon: PenLine, anyOf: ['modules.create', 'modules.update'] },
      { id: 'trb', label: 'TRB Tasks', href: '/admin/trb', icon: FileText, anyOf: ['trb.create', 'trb.update'] },
      { id: 'sea-survival', label: 'Sea Survival', href: '/admin/sea-survival', icon: Anchor, anyOf: ['sea_survival.create', 'sea_survival.update'] },
      { id: 'flashcards', label: 'Flashcards', href: '/admin/flashcards', icon: WalletCards, anyOf: ['flashcards.create', 'flashcards.update'] },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    items: [
      { id: 'library', label: 'Content Library', href: '/admin/content/library', icon: Library, permission: 'content.library' },
      { id: 'drafts', label: 'Drafts', href: '/admin/content/drafts', icon: FileEdit, permission: 'content.library' },
      { id: 'reviews', label: 'Publishing / Reviews', href: '/admin/content/reviews', icon: CheckCircle2, anyOf: ['content.review', 'content.publish', 'content.library'] },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.view' },
      { id: 'roles', label: 'Roles & Permissions', href: '/admin/roles', icon: KeyRound, permission: 'roles.view' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { id: 'admin-activity', label: 'Admin Activity', href: '/admin/security/admin-activity', icon: Shield, permission: 'security.view' },
      { id: 'audit', label: 'Security / Audit Log', href: '/admin/security/audit', icon: ShieldAlert, permission: 'security.view' },
    ],
  },
];

export function canAccessAdminNavItem(
  item: AdminNavItem,
  can: (p: Permission) => boolean,
): boolean {
  if (item.permission && !can(item.permission)) return false;
  if (item.anyOf && !item.anyOf.some((p) => can(p))) return false;
  return true;
}

export function filterAdminNav(
  can: (p: Permission) => boolean,
): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessAdminNavItem(item, can)),
  })).filter((g) => g.items.length > 0);
}

/** Map legacy admin-home tab ids → new routes for redirects */
export const LEGACY_TAB_REDIRECTS: Record<string, string> = {
  analytics: '/admin/analytics',
  users: '/admin/users',
  support: '/admin/support',
  activity: '/admin/activity',
  noticeboard: '/admin/noticeboard',
  questions: '/admin/questions',
  blog: '/admin/free-content',
  modules: '/admin/modules',
  trb: '/admin/trb',
  'sea-survival': '/admin/sea-survival',
  flashcards: '/admin/flashcards',
};
