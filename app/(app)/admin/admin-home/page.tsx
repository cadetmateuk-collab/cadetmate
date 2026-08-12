import { redirect } from 'next/navigation';
import { LEGACY_TAB_REDIRECTS } from '@/lib/admin/nav';

/** Legacy tabbed admin hub — redirect to the new IA routes. */
export default async function AdminHomeRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const target = (tab && LEGACY_TAB_REDIRECTS[tab]) || '/admin/dashboard';
  redirect(target);
}
