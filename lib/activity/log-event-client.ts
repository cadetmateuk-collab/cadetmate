import { createClient } from '@/lib/supabase/client';

export type ClientActivityInput = {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  entityTitle?: string | null;
  metadata?: Record<string, unknown>;
};

/** Fire-and-forget client audit insert. Never throws. */
export async function logClientActivity(input: ClientActivityInput): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    await supabase.from('activity_events').insert({
      actor_id: user.id,
      actor_role: profile?.role ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      entity_title: input.entityTitle ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error('[activity_events] client insert failed:', err);
  }
}
