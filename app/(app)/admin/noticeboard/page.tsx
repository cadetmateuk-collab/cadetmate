import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/feature/admin/AdminChrome';
import AdminNoticeboardTab from '@/components/feature/admin/AdminNoticeboardTab';

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
