import { describe, expect, it } from 'vitest';
import {
  can,
  canDeleteContent,
  getPermissionsForRole,
  hasPermission,
  isAdminRole,
  isPremiumRole,
  isProtectedStaffRole,
  isStaffRole,
} from '@cadet-mate/shared';
import { filterNavForUser, APP_NAV_GROUPS } from '@/lib/navigation/config';

describe('roles & permissions', () => {
  it('treats content as premium and staff, but not admin', () => {
    expect(isPremiumRole('content')).toBe(true);
    expect(isStaffRole('content')).toBe(true);
    expect(isAdminRole('content')).toBe(false);
    expect(isProtectedStaffRole('content')).toBe(true);
  });

  it('gives content create/update CMS permissions without deletes or admin tools', () => {
    const perms = getPermissionsForRole('content');
    expect(perms).toContain('modules.create');
    expect(perms).toContain('modules.update');
    expect(perms).toContain('blog.create');
    expect(perms).not.toContain('modules.delete');
    expect(perms).not.toContain('blog.delete');
    expect(perms).not.toContain('users.manage');
    expect(perms).not.toContain('support.manage');
    expect(perms).not.toContain('analytics.view');
    expect(perms).not.toContain('activity.view');
    expect(canDeleteContent('content')).toBe(false);
    expect(can('content', 'modules.delete')).toBe(false);
  });

  it('gives admin full permissions including activity and deletes', () => {
    expect(hasPermission('admin', 'activity.view')).toBe(true);
    expect(hasPermission('admin', 'users.manage')).toBe(true);
    expect(hasPermission('admin', 'community.moderate')).toBe(true);
    expect(canDeleteContent('admin')).toBe(true);
  });

  it('does not give content role community moderation', () => {
    expect(hasPermission('content', 'community.moderate')).toBe(false);
  });
});

describe('filterNavForUser with content role', () => {
  it('shows staff admin nav for content, but hides admin-only activity link', () => {
    const filtered = filterNavForUser(APP_NAV_GROUPS, 'content');
    const admin = filtered.find((g) => g.id === 'admin');
    expect(admin).toBeTruthy();
    expect(admin?.items.some((i) => i.id === 'admin-home')).toBe(true);
    expect(admin?.items.some((i) => i.id === 'admin-activity')).toBe(false);
  });

  it('shows activity link for admins', () => {
    const filtered = filterNavForUser(APP_NAV_GROUPS, 'admin');
    const admin = filtered.find((g) => g.id === 'admin');
    expect(admin?.items.some((i) => i.id === 'admin-activity')).toBe(true);
  });

  it('hides admin group for free users', () => {
    const filtered = filterNavForUser(APP_NAV_GROUPS, 'free');
    expect(filtered.some((g) => g.id === 'admin')).toBe(false);
  });
});
