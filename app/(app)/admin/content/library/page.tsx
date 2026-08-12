import { requireAdminPagePermission } from '@/lib/admin/require-page';
import ContentLibraryClient from '@/components/admin/ContentLibraryClient';

export default async function ContentLibraryPage() {
  await requireAdminPagePermission('content.library');
  return <ContentLibraryClient mode="all" />;
}
