import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminActivityLogTab from '@/components/AdminActivityLogTab';

export default async function AdminActivityPage() {
  await requireAdminPagePermission('activity.view');
  return (
    <div>
      <AdminPageHeader
        title="Activity Log"
        description="Human-friendly overview of learner, content, and admin actions across the site."
      />
      <AdminActivityLogTab hideChrome />
    </div>
  );
}
