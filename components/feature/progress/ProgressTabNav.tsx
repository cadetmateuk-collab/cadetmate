'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'overview', label: 'Overview', href: '/progress' },
  { id: 'statistics', label: 'Statistics', href: '/progress?tab=statistics' },
  { id: 'streak', label: 'Study Streak', href: '/progress?tab=streak' },
  { id: 'achievements', label: 'Achievements', href: '/progress?tab=achievements' },
  { id: 'completed', label: 'Completed', href: '/progress?tab=completed' },
  { id: 'quizzes', label: 'Quiz History', href: '/progress?tab=quizzes' },
  { id: 'readiness', label: 'Exam Readiness', href: '/progress?tab=readiness' },
];

export function ProgressTabNav() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
