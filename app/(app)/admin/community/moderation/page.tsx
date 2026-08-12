import { Suspense } from 'react';
import { requireAdminPagePermission } from '@/lib/admin/require-page';
import { AdminPageHeader } from '@/components/admin/AdminChrome';
import { CommunityModerationClient } from '@/components/admin/CommunityModerationClient';

export default async function AdminCommunityModerationPage() {
  await requireAdminPagePermission('community.moderate');

  return (
    <div>
      <AdminPageHeader
        title="Community Moderation"
        description="Review flagged posts and comments. Approve to publish, or delete to remove."
      />
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading queue…</p>}>
        <CommunityModerationClient />
      </Suspense>
    </div>
  );
}
