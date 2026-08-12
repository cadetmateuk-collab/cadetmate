import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import AdminFlashcardsTab from '@/components/AdminFlashcardsTab';

export default async function AdminFlashcardsPage() {
  await requireAdminPagePermission(undefined, ['flashcards.create', 'flashcards.update']);
  return (
    <div>
      <AdminPageHeader
        title="Flashcards"
        description="Packs, cards, publish status, and study content organisation."
      />
      <AdminFlashcardsTab />
    </div>
  );
}
