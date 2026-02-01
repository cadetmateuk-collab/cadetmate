"use client";

import { useActivityTracker } from "@/lib/hooks/useActivityTracker";

export function ActivityTrackerProvider() {
  useActivityTracker();
  return null; // or children later if needed
}
