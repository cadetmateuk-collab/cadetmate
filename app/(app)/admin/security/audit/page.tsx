import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/feature/admin/AdminChrome';
import AdminActivityLogTab from '@/components/feature/admin/AdminActivityLogTab';

export default async function AdminSecurityAuditPage() {
  await requireAdminPagePermission('security.view');
  return (
    <div>
      <AdminPageHeader
        title="Security / Audit Log"
        description="Technical security events — permission failures, auth-related admin actions, and sensitive changes."
      />
      <AdminActivityLogTab scope="security" hideChrome />
    </div>
  );
}
