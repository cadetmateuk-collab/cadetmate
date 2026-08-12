import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionApi } from '@/lib/auth/require-permission-api';
import { ADMIN_ACTIONS, SECURITY_ACTIONS } from '@/lib/activity/actions';

type ActivityRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_title: string | null;
  metadata: Record<string, unknown> | null;
};

/**
 * Activity log API.
 *
 * Note: `activity_events.actor_id` FKs to `auth.users`, not `profiles`, so PostgREST
 * cannot embed `profiles:actor_id (...)`. We join profiles in a second query.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const scope = searchParams.get('scope') ?? 'all';

  const needed =
    scope === 'security' || scope === 'admin' ? 'security.view' : 'activity.view';
  const auth = await requirePermissionApi(needed);
  if ('error' in auth) return auth.error;

  const limit = Math.min(Number(searchParams.get('limit') ?? 50) || 50, 200);
  const offset = Math.max(Number(searchParams.get('offset') ?? 0) || 0, 0);
  const action = searchParams.get('action');
  const actorRole = searchParams.get('role');
  const entityType = searchParams.get('entityType');
  const q = searchParams.get('q')?.trim();
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = auth.supabase
    .from('activity_events')
    .select(
      `
      id,
      created_at,
      actor_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      entity_title,
      metadata
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (scope === 'security') {
    query = query.in('action', [...SECURITY_ACTIONS]);
  } else if (scope === 'admin') {
    query = query.in('action', [...ADMIN_ACTIONS]);
  }

  if (action) query = query.eq('action', action);
  if (actorRole) query = query.eq('actor_role', actorRole);
  if (entityType) query = query.eq('entity_type', entityType);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  if (q) {
    query = query.or(
      `entity_title.ilike.%${q}%,action.ilike.%${q}%,entity_id.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data ?? []) as ActivityRow[];
  const actorIds = [
    ...new Set(events.map((e) => e.actor_id).filter((id): id is string => Boolean(id))),
  ];

  const profileById = new Map<
    string,
    { full_name: string | null; email: string | null }
  >();

  if (actorIds.length > 0) {
    const { data: profiles } = await auth.supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', actorIds);

    for (const p of profiles ?? []) {
      profileById.set(p.id, { full_name: p.full_name, email: p.email });
    }
  }

  return NextResponse.json({
    events: events.map((e) => ({
      ...e,
      profiles: e.actor_id ? profileById.get(e.actor_id) ?? null : null,
    })),
    total: count ?? 0,
    limit,
    offset,
  });
}
