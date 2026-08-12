import { supabaseAdmin } from '@/lib/supabase/admin';

export type ActivityEventInput = {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  entityTitle?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Append an audit event. Never throws — logging must not break primary UX.
 */
export async function logActivityEvent(input: ActivityEventInput): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('activity_events').insert({
      actor_id: input.actorId ?? null,
      actor_role: input.actorRole ?? null,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      entity_title: input.entityTitle ?? null,
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
      user_agent: input.userAgent ?? null,
    });
    if (error) {
      console.error('[activity_events] insert failed:', error.message);
    }
  } catch (err) {
    console.error('[activity_events] unexpected error:', err);
  }
}

export function requestContext(request: Request): { ip: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  return {
    ip: ip || null,
    userAgent: request.headers.get('user-agent'),
  };
}
