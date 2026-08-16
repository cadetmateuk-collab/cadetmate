export const DAILY_STUDY_GOAL_MINUTES = 15;

export type WeekDayMinutes = {
  key: string;
  label: string;
  minutes: number;
};

export function londonDateKey(date: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addCalendarDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function currentWeekMondayKey(now = new Date()) {
  const today = londonDateKey(now);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/London',
    weekday: 'short',
  }).format(now);
  const weekdayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
  const mondayOffset = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;
  return addCalendarDays(today, mondayOffset);
}

export function greetingForLondon(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      hour: 'numeric',
      hour12: false,
      timeZone: 'Europe/London',
    }).format(now),
  );
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function buildWeekUsage(
  activityRows: Array<{ session_start?: string | null; duration_seconds?: number | null }>,
): WeekDayMinutes[] {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
  const monday = currentWeekMondayKey();
  const buckets = labels.map((label, i) => ({
    key: addCalendarDays(monday, i),
    label,
    minutes: 0,
  }));
  const index = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const row of activityRows) {
    if (!row.session_start) continue;
    const bucket = index.get(londonDateKey(new Date(row.session_start)));
    if (bucket) bucket.minutes += Math.max(0, row.duration_seconds ?? 0);
  }

  for (const bucket of buckets) {
    bucket.minutes = Math.round(bucket.minutes / 60);
  }

  return buckets;
}
