'use client';

import { timeAgo } from '@/lib/community/utils';
import {
  DashboardHome,
  type CommunityPostPreview,
  type ContinueModule,
  type WeekDayUsage,
} from '@/components/dashboard/DashboardHome';
import { DAILY_STUDY_GOAL_MINUTES } from '@/lib/study/time';

export type PublicHomeData = {
  stats: {
    users: number;
    modules: number;
    flashcards: number;
    posts: number;
    questions: number;
    simulators: number;
  };
  posts: Array<{
    id: string;
    title: string;
    body: string;
    vote_score: number;
    created_at: string;
  }>;
};

const SUGGESTED: ContinueModule[] = [
  {
    id: 'colregs',
    title: 'COLREGS for deck cadets',
    category: 'COLREGS',
    imageUrl: null,
    progress: 0,
    href: '/auth?mode=signup',
    sections: [],
  },
  {
    id: 'navigation',
    title: 'Chartwork & navigation',
    category: 'Navigation',
    imageUrl: null,
    progress: 0,
    href: '/auth?mode=signup',
    sections: [],
  },
  {
    id: 'watchkeeping',
    title: 'Bridge watchkeeping (OOW)',
    category: 'Seamanship',
    imageUrl: null,
    progress: 0,
    href: '/auth?mode=signup',
    sections: [],
  },
];

const EMPTY_WEEK: WeekDayUsage[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
  (label) => ({ key: label, label, minutes: 0 }),
);

export function PublicHome({ data }: { data: PublicHomeData }) {
  const communityPosts: CommunityPostPreview[] = data.posts.slice(0, 4).map((post) => ({
    id: post.id,
    title: post.title,
    createdAtLabel: timeAgo(post.created_at),
    authorName: 'Cadet',
    userId: post.id,
    author: {
      fullName: 'Cadet',
      avatarKind: 'initials',
      avatarPreset: null,
      avatarColor: null,
      role: null,
    },
  }));

  return (
    <DashboardHome
      firstName="Cadet"
      greeting="Welcome"
      isPremium={false}
      isGuest
      streakDays={0}
      weeklyMinutes={0}
      dailyGoalMinutes={DAILY_STUDY_GOAL_MINUTES}
      todayMinutes={0}
      targetPercent={0}
      avatar={{
        fullName: 'Cadet',
        avatarKind: 'initials',
        avatarPreset: null,
        avatarColor: null,
        role: null,
      }}
      weekUsage={EMPTY_WEEK}
      inProgressCount={0}
      completedCount={0}
      continueModules={[]}
      suggestedModules={SUGGESTED}
      communityPosts={communityPosts}
    />
  );
}
