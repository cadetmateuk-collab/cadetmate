// @ts-nocheck
'use client';
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Search, ClipboardList } from 'lucide-react';
import { AdminBtn, AdminCard, AdminInput, AdminSelect, adminColors } from '@/components/admin/ui';

type ActivityEvent = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown> | null;
  profiles?: { full_name: string | null; email: string | null } | null;
};

const ROLE_FILTERS = ['', 'admin', 'content', 'premium', 'basic', 'free'];
const ENTITY_FILTERS = [
  '',
  'module',
  'blog_post',
  'notice',
  'daily_question',
  'trb_task',
  'sea_survival',
  'flashcard_pack',
  'post',
  'category',
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actorLabel(event: ActivityEvent) {
  const name = event.profiles?.full_name || event.profiles?.email;
  if (name) return name;
  if (event.actor_id) return event.actor_id.slice(0, 8) + '…';
  return 'System';
}

export default function AdminActivityLogTab({
  scope = 'all',
  hideChrome = false,
}: {
  scope?: 'all' | 'admin' | 'security';
  hideChrome?: boolean;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '75', scope });
      if (q.trim()) params.set('q', q.trim());
      if (role) params.set('role', role);
      if (entityType) params.set('entityType', entityType);
      if (action.trim()) params.set('action', action.trim());

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load activity');
      setEvents(json.events ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
      setEvents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, role, entityType, action, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={hideChrome ? 'w-full' : 'mx-auto w-full max-w-6xl px-4 sm:px-8'}>
      {!hideChrome && (
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <ClipboardList size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Audit trail</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Activity Log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Site-wide actions from learners and content staff. {total} event{total === 1 ? '' : 's'} matched.
          </p>
        </div>
        <AdminBtn onClick={() => void load()} variant="ghost">
          <RefreshCw size={14} /> Refresh
        </AdminBtn>
      </div>
      )}
      {hideChrome && (
        <div className="mb-4 flex justify-end">
          <AdminBtn onClick={() => void load()} variant="ghost">
            <RefreshCw size={14} /> Refresh
          </AdminBtn>
        </div>
      )}

      <AdminCard style={{ marginBottom: 16, padding: 16 }}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Search
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <AdminInput
                value={q}
                onChange={(v) => setQ(v)}
                placeholder="Title, action, id…"
                style={{ paddingLeft: 40 }}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Role
            <AdminSelect value={role} onChange={(v) => setRole(v)}>
              {ROLE_FILTERS.map((r) => (
                <option key={r || 'all'} value={r}>
                  {r || 'All roles'}
                </option>
              ))}
            </AdminSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Entity
            <AdminSelect value={entityType} onChange={(v) => setEntityType(v)}>
              {ENTITY_FILTERS.map((r) => (
                <option key={r || 'all'} value={r}>
                  {r || 'All entities'}
                </option>
              ))}
            </AdminSelect>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            Action
            <AdminInput
              value={action}
              onChange={(v) => setAction(v)}
              placeholder="e.g. module.created"
            />
          </label>
        </div>
      </AdminCard>

      {error && (
        <div
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
          {error.toLowerCase().includes('activity_events') || error.toLowerCase().includes('relation') ? (
            <span className="mt-1 block text-muted-foreground">
              If the table is missing, apply{' '}
              <code>supabase/migrations/20260809180000_content_role_and_activity_events.sql</code>.
              For actor profile joins, also apply{' '}
              <code>supabase/migrations/20260810190000_activity_events_actor_profiles_fk.sql</code>.
            </span>
          ) : null}
        </div>
      )}

      <AdminCard style={{ padding: 0, overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-bold">When</th>
                <th className="px-4 py-3 font-bold">User</th>
                <th className="px-4 py-3 font-bold">Role</th>
                <th className="px-4 py-3 font-bold">Action</th>
                <th className="px-4 py-3 font-bold">Affected</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    Loading activity…
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    No activity events yet. Content and learner actions will appear here as they happen.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="border-b border-border/70 last:border-0 hover:bg-accent/40">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatWhen(event.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{actorLabel(event)}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                          background: 'hsl(var(--primary) / 0.1)',
                          color: adminColors.primary,
                        }}
                      >
                        {event.actor_role ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{event.action}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {event.entity_title || event.entity_id || '—'}
                      </div>
                      {event.entity_type && (
                        <div className="text-xs text-muted-foreground">{event.entity_type}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
