import { requireAdminPagePermission } from '@/lib/admin/require-page';
import {
  ALL_PERMISSIONS,
  CONTENT_PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from '@cadet-mate/shared';
import {
  AdminPageHeader,
  AdminPanel,
} from '@/components/admin/AdminChrome';
import Link from 'next/link';

function RoleCard({
  role,
  description,
  permissions,
}: {
  role: string;
  description: string;
  permissions: readonly Permission[];
}) {
  return (
    <AdminPanel title={role} description={description}>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {permissions.map((p) => (
          <li
            key={p}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
          >
            <span className="font-semibold">{PERMISSION_LABELS[p]}</span>
            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">{p}</span>
          </li>
        ))}
      </ul>
    </AdminPanel>
  );
}

export default async function AdminRolesPage() {
  await requireAdminPagePermission('roles.view');

  const contentDenied = ALL_PERMISSIONS.filter((p) => !CONTENT_PERMISSIONS.includes(p));

  return (
    <div>
      <AdminPageHeader
        title="Roles & Permissions"
        description="Granular capability matrix. Assign Content via Users — Admin cannot be self-granted in the UI."
        actions={
          <Link
            href="/admin/users"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
          >
            Manage user roles
          </Link>
        }
      />

      <div className="mb-6 space-y-4">
        <RoleCard
          role="Admin"
          description="Full platform access including users, support, analytics, statistics, security, settings, and deletes."
          permissions={ALL_PERMISSIONS}
        />
        <RoleCard
          role="Content"
          description="Premium access + create/update CMS tools. No users, support, analytics, stats, roles, security, or deletes."
          permissions={CONTENT_PERMISSIONS}
        />
      </div>

      <AdminPanel
        title="Explicitly denied to Content"
        description="These capabilities remain Admin-only by design."
      >
        <div className="flex flex-wrap gap-2">
          {contentDenied.map((p) => (
            <span
              key={p}
              className="rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-[11px] font-semibold text-destructive"
            >
              {PERMISSION_LABELS[p]}
            </span>
          ))}
        </div>
      </AdminPanel>
    </div>
  );
}
