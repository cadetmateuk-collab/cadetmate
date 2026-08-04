'use client';

/** Activity tracking for authenticated app/protected routes only. */
import { ActivityTrackerProvider } from '@/components/ActivityTrackerProvider';

export function AuthenticatedClientChrome() {
  return <ActivityTrackerProvider />;
}
