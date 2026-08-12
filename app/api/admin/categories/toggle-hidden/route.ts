import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requirePermissionApi } from '@/lib/auth/require-permission-api';

export async function POST(request: Request) {
  const auth = await requirePermissionApi('categories.update');
  if ('error' in auth) return auth.error;

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const hidden = typeof body.hidden === 'boolean' ? body.hidden : null;

    if (!name || hidden === null) {
      return NextResponse.json(
        { error: 'name (string) and hidden (boolean) are required' },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ hidden })
      .eq('name', name)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Category not found or not updated' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
