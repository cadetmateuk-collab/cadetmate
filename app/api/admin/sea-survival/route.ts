import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { hasPermission, type Permission } from '@/lib/auth/roles';
import { logActivityEvent, requestContext } from '@/lib/activity/log-event';

async function getSessionProfile(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const {
    data: { user },
  } = await anonClient.auth.getUser(token);
  if (!user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return { user, role: profile?.role ?? 'free' };
}

function denyUnless(role: string, permission: Permission) {
  if (!hasPermission(role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getSessionProfile(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const denied = denyUnless(session.role, 'sea_survival.create');
  if (denied) return denied;

  const body = await req.json();
  const { error, data } = await supabaseAdmin.from('sea_survival').insert([body]).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ctx = requestContext(req);
  void logActivityEvent({
    actorId: session.user.id,
    actorRole: session.role,
    action: 'sea_survival.created',
    entityType: 'sea_survival',
    entityId: data.id,
    entityTitle: data.title ?? data.slug ?? null,
    ...ctx,
  });

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionProfile(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const denied = denyUnless(session.role, 'sea_survival.update');
  if (denied) return denied;

  const { id, ...payload } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { error, data } = await supabaseAdmin
    .from('sea_survival')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ctx = requestContext(req);
  void logActivityEvent({
    actorId: session.user.id,
    actorRole: session.role,
    action: 'sea_survival.updated',
    entityType: 'sea_survival',
    entityId: data.id,
    entityTitle: data.title ?? data.slug ?? null,
    ...ctx,
  });

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionProfile(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  const denied = denyUnless(session.role, 'sea_survival.delete');
  if (denied) return denied;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from('sea_survival')
    .select('id, title, slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from('sea_survival').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ctx = requestContext(req);
  void logActivityEvent({
    actorId: session.user.id,
    actorRole: session.role,
    action: 'sea_survival.deleted',
    entityType: 'sea_survival',
    entityId: id,
    entityTitle: existing?.title ?? existing?.slug ?? null,
    ...ctx,
  });

  return NextResponse.json({ ok: true });
}
