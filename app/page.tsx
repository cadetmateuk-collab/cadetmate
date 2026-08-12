import { createClient } from '@/lib/supabase/server';
import { permanentRedirect, redirect } from 'next/navigation';

/**
 * Apex `/` — guests land on the marketing homepage; signed-in users go to the app dashboard.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  permanentRedirect('/home');
}
