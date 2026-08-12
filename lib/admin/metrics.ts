import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export type DashboardMetrics = {
  totalUsers: number;
  newUsers7d: number;
  activeUsers7d: number;
  premiumUsers: number;
  contentUsers: number;
  openTickets: number;
  modulesCompleted7d: number;
  recentUsers: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    role: string | null;
    created_at: string | null;
  }>;
  recentActivity: Array<{
    id: string;
    created_at: string;
    action: string;
    actor_role: string | null;
    entity_title: string | null;
    entity_type: string | null;
  }>;
  recentPosts: Array<{
    id: string;
    title: string;
    created_at: string;
    status: string | null;
  }>;
  signupTrend: Array<{ date: string; count: number }>;
};

function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();
  const weekAgo = daysAgo(7);

  const [
    profilesRes,
    ticketsRes,
    progressRes,
    activityRes,
    postsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, last_seen_at')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('support_tickets')
      .select('id, status', { count: 'exact' })
      .in('status', ['open', 'in_progress']),
    supabase
      .from('user_module_progress')
      .select('id', { count: 'exact', head: true })
      .eq('completed', true)
      .gte('last_accessed', weekAgo),
    supabase
      .from('activity_events')
      .select('id, created_at, action, actor_role, entity_title, entity_type')
      .order('created_at', { ascending: false })
      .limit(12),
    supabase
      .from('posts')
      .select('id, title, created_at, status')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const profiles = profilesRes.data ?? [];
  const week = new Date(weekAgo);

  const signupTrend: Array<{ date: string; count: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    signupTrend.push({
      date: key,
      count: profiles.filter((p) => p.created_at?.slice(0, 10) === key).length,
    });
  }

  return {
    totalUsers: profiles.length,
    newUsers7d: profiles.filter((p) => p.created_at && new Date(p.created_at) >= week).length,
    activeUsers7d: profiles.filter(
      (p) => p.last_seen_at && new Date(p.last_seen_at) >= week,
    ).length,
    premiumUsers: profiles.filter((p) => p.role === 'premium').length,
    contentUsers: profiles.filter((p) => p.role === 'content').length,
    openTickets: ticketsRes.count ?? ticketsRes.data?.length ?? 0,
    modulesCompleted7d: progressRes.count ?? 0,
    recentUsers: profiles.slice(0, 8).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      role: p.role,
      created_at: p.created_at,
    })),
    recentActivity: (activityRes.data ?? []) as DashboardMetrics['recentActivity'],
    recentPosts: (postsRes.data ?? []) as DashboardMetrics['recentPosts'],
    signupTrend,
  };
}

/** Best-effort site stats from first-party page view events. */
export async function getWebsiteStats(rangeDays: number) {
  const since = daysAgo(rangeDays);
  try {
    const { data, error } = await supabaseAdmin
      .from('site_page_views')
      .select('id, created_at, path, referrer, device, browser, os, country, session_id, visitor_hash, duration_ms')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error || !data) {
      return { available: false as const, reason: error?.message ?? 'No data', rangeDays };
    }

    const visitors = new Set(data.map((r) => r.visitor_hash).filter(Boolean));
    const sessions = new Set(data.map((r) => r.session_id).filter(Boolean));
    const pageCounts = new Map<string, number>();
    const deviceCounts = new Map<string, number>();
    const browserCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();

    let durationSum = 0;
    let durationN = 0;

    for (const row of data) {
      pageCounts.set(row.path, (pageCounts.get(row.path) ?? 0) + 1);
      if (row.device) deviceCounts.set(row.device, (deviceCounts.get(row.device) ?? 0) + 1);
      if (row.browser) browserCounts.set(row.browser, (browserCounts.get(row.browser) ?? 0) + 1);
      const ref = row.referrer ? (() => {
        try { return new URL(row.referrer).hostname; } catch { return 'referral'; }
      })() : 'direct';
      referrerCounts.set(ref, (referrerCounts.get(ref) ?? 0) + 1);
      const day = row.created_at?.slice(0, 10);
      if (day) dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
      if (typeof row.duration_ms === 'number' && row.duration_ms > 0) {
        durationSum += row.duration_ms;
        durationN += 1;
      }
    }

    const top = (map: Map<string, number>, n = 8) =>
      [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([name, count]) => ({ name, count }));

    return {
      available: true as const,
      rangeDays,
      pageViews: data.length,
      uniqueVisitors: visitors.size,
      sessions: sessions.size,
      avgSessionPages: sessions.size ? Math.round((data.length / sessions.size) * 10) / 10 : 0,
      avgDurationSec: durationN ? Math.round(durationSum / durationN / 1000) : null,
      topPages: top(pageCounts),
      devices: top(deviceCounts),
      browsers: top(browserCounts),
      referrers: top(referrerCounts),
      byDay: [...dayCounts.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count })),
    };
  } catch (err) {
    return {
      available: false as const,
      reason: err instanceof Error ? err.message : 'Unavailable',
      rangeDays,
    };
  }
}
