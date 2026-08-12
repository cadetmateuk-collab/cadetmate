import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import { ModuleBuilder } from './ModuleBuilder';

export default async function ModuleBuilderPage() {
  await requireAdminPagePermission(undefined, ['modules.create', 'modules.update']);
  return (
    <div>
      <AdminPageHeader
        title="Module Builder"
        description="Create and edit module lessons, pages, and interactive blocks."
      />
      <ModuleBuilder />
    </div>
  );
}
