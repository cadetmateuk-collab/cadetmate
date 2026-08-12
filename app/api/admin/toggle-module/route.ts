import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermissionApi } from '@/lib/auth/require-permission-api';
import { logActivityEvent, requestContext } from '@/lib/activity/log-event';

export async function POST(request: Request) {
  const auth = await requirePermissionApi('modules.update');
  if ('error' in auth) return auth.error;

  try {
    const { moduleId, hidden } = await request.json();

    const { data, error } = await supabaseAdmin
      .from('modules')
      .update({ hidden })
      .eq('id', moduleId)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Module not found or not updated' }, { status: 404 });
    }

    const ctx = requestContext(request);
    void logActivityEvent({
      actorId: auth.user.id,
      actorRole: auth.role,
      action: 'module.visibility_updated',
      entityType: 'module',
      entityId: moduleId,
      entityTitle: data[0]?.title ?? null,
      metadata: { hidden },
      ...ctx,
    });

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermissionApi('modules.delete');
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('id');

    if (!moduleId) {
      return NextResponse.json({ error: 'Module ID required' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('modules')
      .select('id, title')
      .eq('id', moduleId)
      .maybeSingle();

    const { error } = await supabaseAdmin.from('modules').delete().eq('id', moduleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const ctx = requestContext(request);
    void logActivityEvent({
      actorId: auth.user.id,
      actorRole: auth.role,
      action: 'module.deleted',
      entityType: 'module',
      entityId: moduleId,
      entityTitle: existing?.title ?? null,
      ...ctx,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
