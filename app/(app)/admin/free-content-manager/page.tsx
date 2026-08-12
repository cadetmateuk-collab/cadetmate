import { redirect } from 'next/navigation';

/** Legacy mock free-content manager — use the live Free Content admin. */
export default function FreeContentManagerRedirect() {
  redirect('/admin/free-content');
}
