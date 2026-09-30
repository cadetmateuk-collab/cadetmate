'use client';

/** Client chrome for authenticated routes. */
import { ActivityTrackerProvider } from '@/components/feature/study/ActivityTrackerProvider';
import { SiteAnalyticsBeacon } from '@/components/feature/analytics/SiteAnalyticsBeacon';

export function AuthenticatedClientChrome() {
  return (
    <>
      <ActivityTrackerProvider />
      <SiteAnalyticsBeacon />
    </>
  );
}
