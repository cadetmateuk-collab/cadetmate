import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminSeaSurvivalTab from '@/components/AdminSeaSurvivalTab';

export default async function AdminSeaSurvivalPage() {
  await requireAdminPagePermission(undefined, ['sea_survival.create', 'sea_survival.update']);
  return (
    <div>
      <AdminPageHeader
        title="Sea Survival"
        description="Organise sea survival topics, lessons, and visibility."
      />
      <AdminSeaSurvivalTab />
    </div>
  );
}
