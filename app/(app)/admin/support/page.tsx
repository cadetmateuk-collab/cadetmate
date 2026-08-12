import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminSupportTab from '@/components/AdminSupportTab';

export default async function AdminSupportPage() {
  await requireAdminPagePermission('support.view');
  return (
    <div>
      <AdminPageHeader
        title="Support"
        description="Tickets, status updates, and issues needing attention."
      />
      <AdminSupportTab />
    </div>
  );
}
