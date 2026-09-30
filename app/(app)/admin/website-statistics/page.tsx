import { requireAdminPagePermission } from '@/lib/admin/require-page';
import WebsiteStatisticsClient from '@/components/feature/admin/WebsiteStatisticsClient';

export default async function WebsiteStatisticsPage() {
  await requireAdminPagePermission('stats.view');
  return <WebsiteStatisticsClient />;
}
