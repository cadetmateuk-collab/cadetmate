import { requireAdminPagePermission } from '@/lib/admin/require-page';
import ContentLibraryClient from '@/components/admin/ContentLibraryClient';

export default async function ContentReviewsPage() {
  await requireAdminPagePermission(undefined, [
    'content.review',
    'content.publish',
    'content.library',
  ]);
  return <ContentLibraryClient mode="reviews" />;
}
