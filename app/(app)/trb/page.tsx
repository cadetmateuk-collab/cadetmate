import { createClient } from '@/lib/db/server';
import TrbBrowser from './TrbBrowser';
import type { TRBTask } from './data/trbTasks';

export default async function TrbPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('trb_tasks').select('*').order('code');

  return (
    <TrbBrowser
      tasks={(data ?? []) as TRBTask[]}
      error={error?.message ?? null}
    />
  );
}
