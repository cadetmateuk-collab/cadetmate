import { requireAdminPagePermission } from '@/lib/admin/require-page';
import WebsiteStatisticsClient from '@/components/admin/WebsiteStatisticsClient';

export default async function WebsiteStatisticsPage() {
  await requireAdminPagePermission('stats.view');
  return <WebsiteStatisticsClient />;
}
