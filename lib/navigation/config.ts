import {
  House,
  BookOpen,
  WalletCards,
  FileText,
  Anchor,
  Compass,
  Navigation as NavigationIcon,
  Cloud,
  Package,
  Search,
  Mic,
  HelpCircle,
  Zap,
  Target,
  Users,
  TrendingUp,
  Flame,
  Trophy,
  BarChart3,
  History,
  GraduationCap,
  ShoppingBag,
  User,
  CreditCard,
  Bell,
  Settings,
  Shield,
  PenLine,
  MessageSquare,
  Sparkles,
  Newspaper,
  DollarSign,
  Info,
  Mail,
  LogIn,
  Bookmark,
  LifeBuoy,
  ClipboardList,
} from 'lucide-react';
import type { MobileNavItem, NavGroupConfig, NavItemConfig, UserRole } from './types';
import { isAdminRole, isStaffRole } from '@cadet-mate/shared';

/** Public marketing site navigation */
export const PUBLIC_NAV: NavItemConfig[] = [
  { id: 'home', label: 'Home', href: '/home', icon: House },
  { id: 'blog', label: 'Free Content', href: '/free-content', icon: Newspaper },
  { id: 'resources', label: 'Free Resources', href: '/resources', icon: BookOpen },
  { id: 'community', label: 'Community', href: '/community-preview', icon: MessageSquare },
  { id: 'pricing', label: 'Pricing', href: '/pricing', icon: DollarSign },
  { id: 'about', label: 'About', href: '/about', icon: Info },
  { id: 'contact', label: 'Contact', href: '/contact', icon: Mail },
];

export const PUBLIC_AUTH_NAV: NavItemConfig[] = [
  { id: 'login', label: 'Log In', href: '/auth', icon: LogIn },
  { id: 'signup', label: 'Sign Up', href: '/auth?mode=signup', icon: Sparkles },
];

/** Free content nav group — visible to all account types */
export const APP_FREE_CONTENT_GROUP: NavGroupConfig = {
  id: 'free-content',
  label: 'Free Content',
  icon: Newspaper,
  defaultOpen: true,
  items: [
    { id: 'articles', label: 'Articles & Guides', href: '/free-content', icon: Newspaper },
    { id: 'resources', label: 'Free Resources', href: '/resources', icon: BookOpen },
  ],
};

/** Logged-in application sidebar */
export const APP_NAV_GROUPS: NavGroupConfig[] = [
  {
    id: 'main',
    label: 'Home',
    icon: House,
    defaultOpen: true,
    items: [
      { id: 'dashboard', label: 'Home', href: '/dashboard', icon: House, exact: true },
    ],
  },
  APP_FREE_CONTENT_GROUP,
  {
    id: 'learn',
    label: 'Learn',
    icon: BookOpen,
    defaultOpen: true,
    items: [
      { id: 'flashcards', label: 'Flashcards', href: '/flashcards', icon: WalletCards, premiumOnly: true },
      { id: 'modules', label: 'Learning Modules', href: '/unit-modules', icon: BookOpen, premiumOnly: true },
      { id: 'trb', label: 'TRB', href: '/trb', icon: FileText, premiumOnly: true },
      { id: 'sea-survival', label: 'Sea Survival', href: '/sea-survival', icon: Anchor, premiumOnly: true },
      { id: 'colregs', label: 'COLREGs', href: '/unit-modules?category=colregs', icon: Compass },
      { id: 'navigation', label: 'Navigation', href: '/unit-modules?category=navigation', icon: NavigationIcon },
      { id: 'meteorology', label: 'Meteorology', href: '/unit-modules?category=meteorology', icon: Cloud },
      { id: 'cargo', label: 'Cargo', href: '/unit-modules?category=cargo', icon: Package },
      { id: 'learn-hub', label: 'Search All Learning', href: '/learn', icon: Search },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: PenLine,
    items: [
      { id: 'mock-oral', label: 'Mock Oral Exams', href: '/practice?tab=mock-oral', icon: Mic, premiumOnly: true },
      { id: 'oral-questions', label: 'Oral Questions', href: '/practice?tab=oral-questions', icon: HelpCircle, premiumOnly: true },
      { id: 'simulators', label: 'Emergency Simulators', href: '/simulator', icon: Zap, premiumOnly: true },
      { id: 'buoyage', label: 'Buoyage Simulator', href: '/buoyage', icon: LifeBuoy, premiumOnly: true },
      { id: 'quick-quiz', label: 'Quick Quiz', href: '/practice#daily-quiz', icon: Target },
      { id: 'scenarios', label: 'Scenario Challenges', href: '/practice?tab=scenarios', icon: GraduationCap, premiumOnly: true },
      { id: 'practice-hub', label: 'All Practice', href: '/practice', icon: PenLine },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    icon: MessageSquare,
    items: [
      { id: 'feed', label: 'Feed', href: '/community', icon: MessageSquare, exact: true },
      { id: 'latest', label: 'Latest', href: '/community?sort=new', icon: Sparkles },
      { id: 'popular', label: 'Popular', href: '/community?sort=top', icon: TrendingUp },
      { id: 'my-posts', label: 'My Posts', href: '/community?filter=mine', icon: User },
      { id: 'saved', label: 'Saved', href: '/community?filter=saved', icon: Bookmark },
      { id: 'leaderboard', label: 'Leaderboard', href: '/community?tab=leaderboard', icon: Trophy },
    ],
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: BarChart3,
    items: [
      { id: 'progress-dashboard', label: 'Dashboard', href: '/progress', icon: BarChart3, exact: true },
      { id: 'statistics', label: 'Statistics', href: '/progress?tab=statistics', icon: TrendingUp },
      { id: 'streak', label: 'Study Streak', href: '/progress?tab=streak', icon: Flame },
      { id: 'achievements', label: 'Achievements', href: '/progress?tab=achievements', icon: Trophy },
      { id: 'completed', label: 'Completed Modules', href: '/progress?tab=completed', icon: GraduationCap },
      { id: 'quiz-history', label: 'Quiz History', href: '/progress?tab=quizzes', icon: History },
      { id: 'exam-readiness', label: 'Exam Readiness', href: '/progress?tab=readiness', icon: Target },
    ],
  },
  {
    id: 'store',
    label: 'Store',
    icon: ShoppingBag,
    items: [
      { id: 'store', label: 'Store', href: '/store', icon: ShoppingBag },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    items: [
      { id: 'account', label: 'Account', href: '/profile', icon: User, exact: true },
      { id: 'subscription', label: 'Subscription', href: '/profile?tab=subscription', icon: Sparkles },
      { id: 'billing', label: 'Billing', href: '/profile?tab=billing', icon: CreditCard },
      { id: 'notifications', label: 'Notifications', href: '/profile?tab=notifications', icon: Bell },
      { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: Shield,
    staffOnly: true,
    items: [
      { id: 'admin-home', label: 'Dashboard', href: '/admin/dashboard', icon: Shield, staffOnly: true },
      { id: 'admin-activity', label: 'Activity Log', href: '/admin/activity', icon: ClipboardList, adminOnly: true },
      { id: 'admin-modules', label: 'Modules', href: '/admin/modules', icon: BookOpen, staffOnly: true },
      { id: 'admin-builder', label: 'Module Builder', href: '/admin/module-builder', icon: PenLine, staffOnly: true },
      { id: 'admin-content', label: 'Free Content', href: '/admin/free-content', icon: FileText, staffOnly: true },
    ],
  },
];

/** Mobile bottom navigation for logged-in app */
export const MOBILE_BOTTOM_NAV: MobileNavItem[] = [
  { id: 'dashboard', label: 'Home', href: '/dashboard', icon: House },
  { id: 'learn', label: 'Learn', href: '/learn', icon: BookOpen },
  { id: 'practice', label: 'Practice', href: '/practice', icon: Target },
  { id: 'community', label: 'Community', href: '/community', icon: Users },
  { id: 'profile', label: 'Profile', href: '/profile', icon: User },
];

export function isNavItemActive(pathname: string, href: string, exact?: boolean): boolean {
  const cleanPath = (pathname.replace(/\/$/, '') || '/').split('#')[0];
  const [rawPath] = href.split('?');
  const path = (rawPath.split('#')[0].replace(/\/$/, '') || '/');

  if (path === '/home' || path === '/dashboard') {
    return cleanPath === '/home' || cleanPath === '/dashboard' || cleanPath === '/';
  }

  if (exact) return cleanPath === path;
  if (cleanPath === path) return true;
  if (!cleanPath.startsWith(path + '/')) return false;
  return true;
}

export function isGroupActive(pathname: string, items: NavItemConfig[]): boolean {
  return items.some((item) => isNavItemActive(pathname, item.href, item.exact));
}

export function filterNavForUser(
  groups: NavGroupConfig[],
  role: UserRole | undefined,
): NavGroupConfig[] {
  const isAdmin = isAdminRole(role);
  const isStaff = isStaffRole(role);

  return groups
    .filter((g) => {
      if (g.adminOnly && !isAdmin) return false;
      if (g.staffOnly && !isStaff) return false;
      return true;
    })
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.staffOnly && !isStaff) return false;
        return true;
      }),
    }))
    .filter((g) => g.items.length > 0);
}
