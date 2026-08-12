import { describe, expect, it } from 'vitest';
import {
  canDeleteContent,
  getPermissionsForRole,
  hasPermission,
  isAdminRole,
  isPremiumRole,
  isStaffRole,
} from '@cadet-mate/shared';
import { filterAdminNav } from '@/lib/admin/nav';
import { filterNavForUser, APP_NAV_GROUPS } from '@/lib/navigation/config';

describe('expanded admin permissions', () => {
  it('denies platform tools to content role', () => {
    expect(hasPermission('content', 'users.view')).toBe(false);
    expect(hasPermission('content', 'support.view')).toBe(false);
    expect(hasPermission('content', 'analytics.view')).toBe(false);
    expect(hasPermission('content', 'stats.view')).toBe(false);
    expect(hasPermission('content', 'security.view')).toBe(false);
    expect(hasPermission('content', 'roles.manage')).toBe(false);
    expect(hasPermission('content', 'settings.manage')).toBe(false);
    expect(canDeleteContent('content')).toBe(false);
  });

  it('grants content CMS create/update and library access', () => {
    const perms = getPermissionsForRole('content');
    expect(perms).toContain('modules.create');
    expect(perms).toContain('homepage.manage');
    expect(perms).toContain('content.library');
    expect(isPremiumRole('content')).toBe(true);
    expect(isStaffRole('content')).toBe(true);
    expect(isAdminRole('content')).toBe(false);
  });

  it('filters admin nav for content vs admin', () => {
    const contentNav = filterAdminNav((p) => hasPermission('content', p));
    const ids = contentNav.flatMap((g) => g.items.map((i) => i.id));
    expect(ids).toContain('dashboard');
    expect(ids).toContain('modules');
    expect(ids).not.toContain('users');
    expect(ids).not.toContain('support');
    expect(ids).not.toContain('community-moderation');
    expect(ids).not.toContain('analytics');
    expect(ids).not.toContain('website-stats');
    expect(ids).not.toContain('activity');
    expect(ids).not.toContain('roles');

    const adminNav = filterAdminNav((p) => hasPermission('admin', p));
    const adminIds = adminNav.flatMap((g) => g.items.map((i) => i.id));
    expect(adminIds).toContain('users');
    expect(adminIds).toContain('community-moderation');
    expect(adminIds).toContain('website-stats');
    expect(adminIds).toContain('audit');
  });
});

describe('app sidebar admin links', () => {
  it('points content staff at the new dashboard route', () => {
    const filtered = filterNavForUser(APP_NAV_GROUPS, 'content');
    const admin = filtered.find((g) => g.id === 'admin');
    expect(admin?.items.some((i) => i.href === '/admin/dashboard')).toBe(true);
  });
});
