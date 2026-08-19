import { describe, expect, it } from 'vitest';
import {
  isNavItemActive,
  isGroupActive,
  filterNavForUser,
  APP_NAV_GROUPS,
} from '@/lib/navigation/config';
import { House } from 'lucide-react';
import type { NavGroupConfig } from '@/lib/navigation/types';

describe('isNavItemActive', () => {
  it('matches exact paths when exact=true', () => {
    expect(isNavItemActive('/dashboard', '/dashboard', true)).toBe(true);
    expect(isNavItemActive('/dashboard/settings', '/dashboard', true)).toBe(
      false,
    );
  });

  it('matches prefixes when exact is false', () => {
    expect(isNavItemActive('/flashcards/colregs', '/flashcards')).toBe(true);
    expect(isNavItemActive('/learn', '/flashcards')).toBe(false);
  });
});

describe('isGroupActive', () => {
  it('is true when any item path matches', () => {
    const items = [
      { id: 'a', label: 'A', href: '/learn', icon: House },
      { id: 'b', label: 'B', href: '/practice', icon: House },
    ];
    expect(isGroupActive('/practice/orals', items)).toBe(true);
    expect(isGroupActive('/store', items)).toBe(false);
  });
});

describe('filterNavForUser', () => {
  const groups: NavGroupConfig[] = [
    {
      id: 'main',
      label: 'Main',
      items: [{ id: 'dash', label: 'Home', href: '/dashboard', icon: House }],
    },
    {
      id: 'admin',
      label: 'Admin',
      adminOnly: true,
      items: [{ id: 'admin-home', label: 'Admin', href: '/admin', icon: House, adminOnly: true }],
    },
  ];

  it('hides admin groups for free users', () => {
    const filtered = filterNavForUser(groups, 'free');
    expect(filtered.map((g) => g.id)).toEqual(['main']);
  });

  it('keeps admin groups for admins', () => {
    const filtered = filterNavForUser(groups, 'admin');
    expect(filtered.map((g) => g.id)).toContain('admin');
  });

  it('keeps staff groups for content role', () => {
    const staffGroups: NavGroupConfig[] = [
      {
        id: 'main',
        label: 'Main',
        items: [{ id: 'dash', label: 'Home', href: '/dashboard', icon: House }],
      },
      {
        id: 'admin',
        label: 'Admin',
        staffOnly: true,
        items: [
          { id: 'admin-home', label: 'Admin', href: '/admin', icon: House, staffOnly: true },
          { id: 'activity', label: 'Activity', href: '/admin?tab=activity', icon: House, adminOnly: true },
        ],
      },
    ];
    const filtered = filterNavForUser(staffGroups, 'content');
    expect(filtered.map((g) => g.id)).toContain('admin');
    expect(filtered.find((g) => g.id === 'admin')?.items.map((i) => i.id)).toEqual([
      'admin-home',
    ]);
  });

  it('APP_NAV_GROUPS always has a main dashboard entry', () => {
    const main = APP_NAV_GROUPS.find((g) => g.id === 'main');
    expect(main?.items.some((i) => i.href === '/dashboard')).toBe(true);
  });
});
