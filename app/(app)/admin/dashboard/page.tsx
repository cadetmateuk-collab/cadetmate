import Link from 'next/link';
import { requireStaff } from '@/lib/auth/get-user';
import { getDashboardMetrics } from '@/lib/admin/metrics';
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from '@/components/admin/AdminChrome';
import { hasPermission } from '@/lib/auth/roles';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function MiniBars({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm bg-primary/80 transition-all"
            style={{ height: `${Math.max(4, (d.count / max) * 100)}%` }}
            title={`${d.date}: ${d.count}`}
          />
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const role = user.profile?.role;
  const metrics = await getDashboardMetrics();
  const canUsers = hasPermission(role, 'users.view');
  const canSupport = hasPermission(role, 'support.view');
  const canActivity = hasPermission(role, 'activity.view');

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="At-a-glance health of CadetMate — users, content activity, and items needing attention."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/module-builder"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
            >
              New module
            </Link>
            <Link
              href="/admin/free-content"
              className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground"
            >
              Free content
            </Link>
            {canSupport ? (
              <Link
                href="/admin/support"
                className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground"
              >
                Support inbox
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="Total users" value={metrics.totalUsers} tone="primary" />
        <AdminStatCard label="New (7d)" value={metrics.newUsers7d} />
        <AdminStatCard label="Active (7d)" value={metrics.activeUsers7d} tone="success" />
        <AdminStatCard label="Premium" value={metrics.premiumUsers} />
        <AdminStatCard label="Content staff" value={metrics.contentUsers} />
        <AdminStatCard
          label="Open tickets"
          value={metrics.openTickets}
          tone={metrics.openTickets > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <AdminPanel
          className="lg:col-span-2"
          title="Signups — last 14 days"
          description="New account registrations by day"
        >
          <MiniBars data={metrics.signupTrend} />
        </AdminPanel>
        <AdminPanel title="Learning pulse" description="Completions in the last 7 days">
          <div className="text-3xl font-extrabold tracking-tight text-foreground">
            {metrics.modulesCompleted7d}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Modules marked complete</p>
          <Link
            href="/admin/modules"
            className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            Manage modules →
          </Link>
        </AdminPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {canUsers ? (
          <AdminPanel
            title="Recent registrations"
            actions={
              <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">
                View all
              </Link>
            }
          >
            {metrics.recentUsers.length === 0 ? (
              <AdminEmptyState title="No users yet" />
            ) : (
              <ul className="divide-y divide-border">
                {metrics.recentUsers.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {u.full_name || u.email || 'User'}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-primary">
                        {u.role ?? 'free'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDate(u.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        ) : (
          <AdminPanel title="Recent registrations">
            <AdminEmptyState
              title="Restricted"
              description="User lists are only available to admins."
            />
          </AdminPanel>
        )}

        {canActivity ? (
          <AdminPanel
            title="Recent activity"
            actions={
              <Link href="/admin/activity" className="text-xs font-semibold text-primary hover:underline">
                Full log
              </Link>
            }
          >
            {metrics.recentActivity.length === 0 ? (
              <AdminEmptyState
                title="No events yet"
                description="Activity will appear as users and staff take actions."
              />
            ) : (
              <ul className="divide-y divide-border">
                {metrics.recentActivity.map((e) => (
                  <li key={e.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-xs font-semibold text-foreground">
                          {e.action}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {e.entity_title || e.entity_type || '—'}
                        </div>
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                        <div className="font-bold uppercase text-primary/80">{e.actor_role ?? '—'}</div>
                        <div>{formatDate(e.created_at)}</div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        ) : (
          <AdminPanel title="Community pulse">
            {metrics.recentPosts.length === 0 ? (
              <AdminEmptyState title="No recent posts" />
            ) : (
              <ul className="divide-y divide-border">
                {metrics.recentPosts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="truncate text-sm font-medium text-foreground">{p.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDate(p.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminPanel>
        )}
      </div>
    </div>
  );
}
