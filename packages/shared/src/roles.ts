import type { UserRole } from './types';

export type { UserRole };

export function isPremiumRole(role: string | null | undefined): boolean {
  return role === 'premium' || role === 'admin';
}

export function isAdminRole(role: string | null | undefined): boolean {
  return role === 'admin';
}

export function getAccessLevel(
  role: string | null | undefined,
): 'free' | 'premium' | 'admin' {
  if (role === 'admin') return 'admin';
  if (isPremiumRole(role)) return 'premium';
  return 'free';
}
