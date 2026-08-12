import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/get-user';
import { hasAnyPermission, hasPermission, type Permission } from '@/lib/auth/roles';

/** Server-side gate for an admin page. Redirects to unauthorized if missing permission. */
export async function requireAdminPagePermission(
  permission?: Permission,
  anyOf?: Permission[],
) {
  const user = await requireAuth();
  const role = user.profile?.role;

  if (permission && !hasPermission(role, permission)) {
    redirect('/unauthorized');
  }
  if (anyOf && anyOf.length > 0 && !hasAnyPermission(role, anyOf)) {
    redirect('/unauthorized');
  }

  return user;
}
