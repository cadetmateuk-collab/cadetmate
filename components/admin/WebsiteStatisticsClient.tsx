'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPageHeader,
  AdminPanel,
  AdminStatCard,
} from '@/components/admin/AdminChrome';

const RANGES = [
  { id: '1', label: 'Today', days: 1 },
  { id: '7', label: '7 days', days: 7 },
  { id: '30', label: '30 days', days: 30 },
  { id: '90', label: '90 days', days: 90 },
  { id: '365', label: '12 months', days: 365 },
] as const;

type StatsResponse =
  | {
      available: true;
      rangeDays: number;
      pageViews: number;
      uniqueVisitors: number;
      sessions: number;
      avgSessionPages: number;
      avgDurationSec: number | null;
      topPages: Array<{ name: string; count: number }>;
      devices: Array<{ name: string; count: number }>;
      browsers: Array<{ name: string; count: number }>;
      referrers: Array<{ name: string; count: number }>;
      byDay: Array<{ date: string; count: number }>;
    }
  | { available: false; reason: string; rangeDays: number };

function BarList({ items }: { items: Array<{ name: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No data in this range.</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium text-foreground">{item.name}</span>
            <span className="shrink-0 text-muted-foreground">{item.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-36 items-end gap-1">
      {data.map((d) => (
        <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t bg-primary/75"
            style={{ height: `${Math.max(3, (d.count / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function WebsiteStatisticsClient() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(RANGES[2]);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/website-stats?days=${range.days}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load');
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const subtitle = useMemo(
    () =>
      'Privacy-conscious first-party analytics — hashed visitors, no unnecessary PII.',
    [],
  );

  return (
    <div>
      <AdminPageHeader
        title="Website Statistics"
        description={subtitle}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
                  range.id === r.id
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {loading ? <AdminLoadingState label="Loading website statistics…" /> : null}
      {error ? <AdminEmptyState title="Failed to load stats" description={error} /> : null}

      {data && !data.available ? (
        <AdminPanel>
          <AdminEmptyState
            title="Statistics not available yet"
            description={
              data.reason.includes('site_page_views') ||
              data.reason.toLowerCase().includes('relation')
                ? 'Apply supabase/migrations/20260809190000_admin_stats_and_homepage.sql, then browse the site to collect page views.'
                : data.reason
            }
          />
        </AdminPanel>
      ) : null}

      {data && data.available ? (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard label="Page views" value={data.pageViews} tone="primary" />
            <AdminStatCard label="Unique visitors" value={data.uniqueVisitors} />
            <AdminStatCard label="Sessions" value={data.sessions} />
            <AdminStatCard
              label="Avg pages / session"
              value={data.avgSessionPages}
              hint={
                data.avgDurationSec != null
                  ? `Avg dwell ~${data.avgDurationSec}s`
                  : 'Duration accumulates as people navigate'
              }
            />
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <AdminPanel
              className="lg:col-span-2"
              title="Traffic by day"
              description={`Last ${range.label.toLowerCase()}`}
            >
              <TrendChart data={data.byDay} />
            </AdminPanel>
            <AdminPanel title="Devices">
              <BarList items={data.devices} />
            </AdminPanel>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <AdminPanel title="Most visited pages">
              <BarList items={data.topPages} />
            </AdminPanel>
            <AdminPanel title="Browsers">
              <BarList items={data.browsers} />
            </AdminPanel>
            <AdminPanel title="Traffic sources">
              <BarList items={data.referrers} />
            </AdminPanel>
          </div>
        </>
      ) : null}
    </div>
  );
}
