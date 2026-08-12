import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminActivityLogTab from '@/components/AdminActivityLogTab';

export default async function AdminSecurityAdminActivityPage() {
  await requireAdminPagePermission('security.view');
  return (
    <div>
      <AdminPageHeader
        title="Admin Activity"
        description="Administrative actions — role changes, publishing, deletions, and settings updates."
      />
      <AdminActivityLogTab scope="admin" hideChrome />
    </div>
  );
}
