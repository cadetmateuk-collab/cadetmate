import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminTRBTasksTab from '@/components/AdminTRBTasksTab';

export default async function AdminTRBPage() {
  await requireAdminPagePermission(undefined, ['trb.create', 'trb.update']);
  return (
    <div>
      <AdminPageHeader
        title="TRB Tasks"
        description="Create and organise Training Record Book tasks and step guidance."
      />
      <AdminTRBTasksTab />
    </div>
  );
}
