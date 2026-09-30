import { requireAdminPagePermission } from '@/lib/admin/require-page';
import HomepageAdminClient from '@/components/feature/admin/HomepageAdminClient';

export default async function AdminHomepagePage() {
  await requireAdminPagePermission('homepage.manage');
  return <HomepageAdminClient />;
}
