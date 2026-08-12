import type { UserRole } from './types';
import { hasPermission, type Permission } from './permissions';

export type { UserRole };

/** Staff roles that may enter the admin/CMS area. */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'content';
}

export function isPremiumRole(role: string | null | undefined): boolean {
  return role === 'premium' || role === 'content' || role === 'admin';
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function isContentRole(role: string | null | undefined): boolean {
  return role === 'content';
}

/** Roles that must never be overwritten by Stripe grant/revoke. */
export function isProtectedStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'content';
}

export function getAccessLevel(
  role: string | null | undefined,
): 'free' | 'premium' | 'admin' | 'content' {
  if (role === 'admin') return 'admin';
  if (role === 'content') return 'content';
  if (isPremiumRole(role)) return 'premium';
  return 'free';
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return hasPermission(role, permission);
}
