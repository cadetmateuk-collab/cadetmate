import { createClient } from '@/lib/supabase/server';
import { permanentRedirect, redirect } from 'next/navigation';

/**
 * Apex `/` — permanent redirect to the public homepage for crawlers & guests.
 * Signed-in users go to the dashboard (temporary).
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
