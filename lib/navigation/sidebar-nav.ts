import type { NavItemConfig, NavGroupConfig, UserRole } from './types';
import { APP_NAV_GROUPS, filterNavForUser } from './config';
import {
  House,
  BookOpen,
  Newspaper,
  MessageSquare,
  DollarSign,
  Info,
  Mail,
} from 'lucide-react';

/** Logged-out sidebar — flat links */
export const PUBLIC_SIDEBAR_NAV: NavItemConfig[] = [
  { id: 'home', label: 'Home', href: '/home', icon: House, exact: true },
  { id: 'blog', label: 'Free Content', href: '/free-content', icon: Newspaper },
  { id: 'resources', label: 'Free Resources', href: '/resources', icon: BookOpen },
  { id: 'community', label: 'Community', href: '/community-preview', icon: MessageSquare },
  { id: 'pricing', label: 'Pricing', href: '/pricing', icon: DollarSign },
  { id: 'about', label: 'About', href: '/about', icon: Info },
  { id: 'contact', label: 'Contact', href: '/contact', icon: Mail },
];

/**
 * Logged-in sidebar groups with dropdowns.
 * Order: Home, Free Content, Learn, Practice, Community, Progress, Store, Profile, Admin.
 */
export function getAppSidebarGroups(role: UserRole | undefined): NavGroupConfig[] {
  return filterNavForUser(APP_NAV_GROUPS, role);
}
