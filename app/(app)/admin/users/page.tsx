import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/feature/admin/AdminChrome';
import AdminUsersTab from '@/components/feature/admin/AdminUsersTab';

export default async function AdminUsersPage() {
  await requireAdminPagePermission('users.view');
  return (
    <div>
      <AdminPageHeader
        title="Users"
        description="Search, filter, and manage member roles. Content staff cannot access this area."
      />
      <AdminUsersTab />
    </div>
  );
}
