import { supabaseAdmin } from '@/lib/supabase/admin';

type ModerationLog = {
  content_type: string;
  content_id?: string | null;
  user_id: string;
  provider?: string | null;
  action: string;
  categories?: unknown;
  toxicity_score?: number | null;
  explanation?: string | null;
  raw_response?: unknown;
};

export async function insertModerationLog(row: ModerationLog) {
  const { error } = await supabaseAdmin.from('moderation_logs').insert(row);
  if (error) {
    console.error('[moderation-log]', error.message);
  }
}
