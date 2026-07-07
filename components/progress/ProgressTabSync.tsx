'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const TAB_SECTIONS: Record<string, string> = {
  statistics: 'progress-statistics',
  streak: 'progress-streak',
  achievements: 'progress-achievements',
  completed: 'progress-completed',
  quizzes: 'progress-quizzes',
  readiness: 'progress-readiness',
};

export function ProgressTabSync() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  useEffect(() => {
    if (!tab) return;
    const sectionId = TAB_SECTIONS[tab];
    if (!sectionId) return;

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [tab]);

  return null;
}
