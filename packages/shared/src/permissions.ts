import type { UserRole } from './types';

/** Granular capabilities used by admin/CMS surfaces and APIs. */
export type Permission =
  | 'users.view'
  | 'users.manage'
  | 'support.view'
  | 'support.manage'
  | 'analytics.view'
  | 'stats.view'
  | 'activity.view'
  | 'security.view'
  | 'settings.view'
  | 'settings.manage'
  | 'roles.view'
  | 'roles.manage'
  | 'homepage.manage'
  | 'content.library'
  | 'content.publish'
  | 'content.review'
  | 'community.moderate'
  | 'modules.create'
  | 'modules.update'
  | 'modules.delete'
  | 'categories.create'
  | 'categories.update'
  | 'categories.delete'
  | 'blog.create'
  | 'blog.update'
  | 'blog.delete'
  | 'notices.create'
  | 'notices.update'
  | 'notices.delete'
  | 'questions.create'
  | 'questions.update'
  | 'questions.delete'
  | 'trb.create'
  | 'trb.update'
  | 'trb.delete'
  | 'sea_survival.create'
  | 'sea_survival.update'
  | 'sea_survival.delete'
  | 'flashcards.create'
  | 'flashcards.update'
  | 'flashcards.delete';

export const ALL_PERMISSIONS: Permission[] = [
  'users.view',
  'users.manage',
  'support.view',
  'support.manage',
  'analytics.view',
  'stats.view',
  'activity.view',
  'security.view',
  'settings.view',
  'settings.manage',
  'roles.view',
  'roles.manage',
  'homepage.manage',
  'content.library',
  'content.publish',
  'content.review',
  'community.moderate',
  'modules.create',
  'modules.update',
  'modules.delete',
  'categories.create',
  'categories.update',
  'categories.delete',
  'blog.create',
  'blog.update',
  'blog.delete',
  'notices.create',
  'notices.update',
  'notices.delete',
  'questions.create',
  'questions.update',
  'questions.delete',
  'trb.create',
  'trb.update',
  'trb.delete',
  'sea_survival.create',
  'sea_survival.update',
  'sea_survival.delete',
  'flashcards.create',
  'flashcards.update',
  'flashcards.delete',
];

/** Content role: create/update CMS only — never delete or platform admin tools. */
export const CONTENT_PERMISSIONS: Permission[] = [
  'homepage.manage',
  'content.library',
  'modules.create',
  'modules.update',
  'categories.create',
  'categories.update',
  'blog.create',
  'blog.update',
  'notices.create',
  'notices.update',
  'questions.create',
  'questions.update',
  'trb.create',
  'trb.update',
  'sea_survival.create',
  'sea_survival.update',
  'flashcards.create',
  'flashcards.update',
];

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  free: [],
  basic: [],
  premium: [],
  content: CONTENT_PERMISSIONS,
  admin: ALL_PERMISSIONS,
};

export const PERMISSION_LABELS: Record<Permission, string> = {
  'users.view': 'View users',
  'users.manage': 'Manage users',
  'support.view': 'View support',
  'support.manage': 'Manage support',
  'analytics.view': 'View analytics',
  'stats.view': 'View website statistics',
  'activity.view': 'View activity log',
  'security.view': 'View security / audit logs',
  'settings.view': 'View settings',
  'settings.manage': 'Manage settings',
  'roles.view': 'View roles',
  'roles.manage': 'Manage roles',
  'homepage.manage': 'Manage homepage',
  'content.library': 'Content library',
  'content.publish': 'Publish content',
  'content.review': 'Review content',
  'community.moderate': 'Moderate community',
  'modules.create': 'Create modules',
  'modules.update': 'Update modules',
  'modules.delete': 'Delete modules',
  'categories.create': 'Create categories',
  'categories.update': 'Update categories',
  'categories.delete': 'Delete categories',
  'blog.create': 'Create free content',
  'blog.update': 'Update free content',
  'blog.delete': 'Delete free content',
  'notices.create': 'Create notices',
  'notices.update': 'Update notices',
  'notices.delete': 'Delete notices',
  'questions.create': 'Create questions',
  'questions.update': 'Update questions',
  'questions.delete': 'Delete questions',
  'trb.create': 'Create TRB tasks',
  'trb.update': 'Update TRB tasks',
  'trb.delete': 'Delete TRB tasks',
  'sea_survival.create': 'Create sea survival',
  'sea_survival.update': 'Update sea survival',
  'sea_survival.delete': 'Delete sea survival',
  'flashcards.create': 'Create flashcards',
  'flashcards.update': 'Update flashcards',
  'flashcards.delete': 'Delete flashcards',
};

export function getPermissionsForRole(
  role: string | null | undefined,
): readonly Permission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) return [];
  return ROLE_PERMISSIONS[role as UserRole];
}

export function hasPermission(
  role: string | null | undefined,
  permission: Permission,
): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(
  role: string | null | undefined,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function canDeleteContent(role: string | null | undefined): boolean {
  return (
    hasPermission(role, 'modules.delete') ||
    hasPermission(role, 'blog.delete') ||
    hasPermission(role, 'notices.delete') ||
    hasPermission(role, 'questions.delete') ||
    hasPermission(role, 'trb.delete') ||
    hasPermission(role, 'sea_survival.delete') ||
    hasPermission(role, 'flashcards.delete') ||
    hasPermission(role, 'categories.delete')
  );
}
