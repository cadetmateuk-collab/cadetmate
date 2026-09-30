import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/feature/admin/AdminChrome';
import AdminBlogTab from '@/components/feature/admin/AdminBlogTab';

export default async function AdminFreeContentPage() {
  await requireAdminPagePermission(undefined, ['blog.create', 'blog.update']);
  return (
    <div>
      <AdminPageHeader
        title="Free Content"
        description="Create and organise public articles and guides. Content role cannot delete protected free content."
      />
      <AdminBlogTab />
    </div>
  );
}
