import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminNoticeboardTab from '@/components/AdminNoticeboardTab';

export default async function AdminNoticeboardPage() {
  await requireAdminPagePermission(undefined, ['notices.create', 'notices.update']);
  return (
    <div>
      <AdminPageHeader
        title="Noticeboard"
        description="Announcements and notices shown to cadets across the product."
      />
      <AdminNoticeboardTab />
    </div>
  );
}
