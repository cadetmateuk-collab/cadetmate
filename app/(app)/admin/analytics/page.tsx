import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/feature/admin/AdminChrome';
import AdminAnalyticsTab from '@/components/feature/admin/AdminAnalyticsTab';

export default async function AdminAnalyticsPage() {
  await requireAdminPagePermission('analytics.view');
  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="User growth, role mix, and engagement signals from CadetMate accounts."
      />
      <AdminAnalyticsTab />
    </div>
  );
}
