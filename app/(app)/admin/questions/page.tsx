import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/feature/admin/AdminChrome';
import AdminQuestionsTab from '@/components/feature/admin/AdminQuestionsTab';

export default async function AdminQuestionsPage() {
  await requireAdminPagePermission(undefined, ['questions.create', 'questions.update']);
  return (
    <div>
      <AdminPageHeader
        title="Questions"
        description="Manage the daily question pool and pinned dated questions."
      />
      <AdminQuestionsTab />
    </div>
  );
}
