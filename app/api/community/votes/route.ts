import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { targetType, targetId, value } = await request.json() as {
    targetType: 'post' | 'comment';
    targetId: string;
    value: -1 | 1 | 0;
  };

  if (!['post', 'comment'].includes(targetType) || !targetId) {
    return NextResponse.json({ error: 'Invalid vote target' }, { status: 400 });
  }

  if (value === 0) {
    const { error } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ userVote: null });
  }

  if (value !== 1 && value !== -1) {
    return NextResponse.json({ error: 'Vote value must be 1, -1, or 0' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('votes')
    .upsert(
      {
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,target_type,target_id' },
    )
    .select('value')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ userVote: data.value });
}
