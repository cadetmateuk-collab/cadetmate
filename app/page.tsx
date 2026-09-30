import { permanentRedirect } from 'next/navigation';

/**
 * Apex `/`. Signed-in visitors are sent to the dashboard by middleware.
 * Guests land on the marketing homepage.
 */
export default function RootPage() {
  permanentRedirect('/home');
}
