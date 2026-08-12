'use client';

/** Client chrome for authenticated routes. */
import { ActivityTrackerProvider } from '@/components/ActivityTrackerProvider';
import { SiteAnalyticsBeacon } from '@/components/analytics/SiteAnalyticsBeacon';

export function AuthenticatedClientChrome() {
  return (
    <>
      <ActivityTrackerProvider />
      <SiteAnalyticsBeacon />
    </>
  );
}
