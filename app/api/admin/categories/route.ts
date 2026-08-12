import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermissionApi } from '@/lib/auth/require-permission-api';
import { logActivityEvent, requestContext } from '@/lib/activity/log-event';

export async function GET() {
  const auth = await requirePermissionApi('categories.update');
  if ('error' in auth) return auth.error;

  try {
    const { data, error } = await supabaseAdmin.from('categories').select('*').order('name');

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requirePermissionApi('categories.create');
  if ('error' in auth) return auth.error;

  try {
    const { name, description } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ name: name.trim(), description: description?.trim() || null }])
      .select();

    if (error) throw error;

    const ctx = requestContext(request);
    void logActivityEvent({
      actorId: auth.user.id,
      actorRole: auth.role,
      action: 'category.created',
      entityType: 'category',
      entityId: data[0]?.id ?? name.trim(),
      entityTitle: name.trim(),
      ...ctx,
    });

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requirePermissionApi('categories.update');
  if ('error' in auth) return auth.error;

  try {
    const { oldName, newName, description } = await request.json();

    if (!oldName || !newName || !newName.trim()) {
      return NextResponse.json({ error: 'Old name and new name are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ name: newName.trim(), description: description?.trim() || null })
      .eq('name', oldName)
      .select();

    if (error) throw error;

    const ctx = requestContext(request);
    void logActivityEvent({
      actorId: auth.user.id,
      actorRole: auth.role,
      action: 'category.updated',
      entityType: 'category',
      entityId: data[0]?.id ?? newName.trim(),
      entityTitle: newName.trim(),
      metadata: { oldName },
      ...ctx,
    });

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requirePermissionApi('categories.delete');
  if ('error' in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('categories').delete().eq('name', name);

    if (error) throw error;

    const ctx = requestContext(request);
    void logActivityEvent({
      actorId: auth.user.id,
      actorRole: auth.role,
      action: 'category.deleted',
      entityType: 'category',
      entityId: name,
      entityTitle: name,
      ...ctx,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
