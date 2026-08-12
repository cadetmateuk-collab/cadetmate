import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminModuleManagementTab from '@/components/AdminModuleManagementTab';

export default async function ModulesPage() {
  await requireAdminPagePermission(undefined, ['modules.create', 'modules.update']);
  return (
    <div>
      <AdminPageHeader
        title="Modules"
        description="Organise learning modules, visibility, and metadata. Open Module Builder to edit lessons."
      />
      <AdminModuleManagementTab />
    </div>
  );
}
