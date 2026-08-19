// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  user_id: string;
  karma_score: number;
  post_count: number;
  comment_count: number;
  profiles?: { full_name: string | null } | null;
}

export function CommunityLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('community_user_profiles')
        .select('user_id, karma_score, post_count, comment_count, profiles(full_name)')
        .order('karma_score', { ascending: false })
        .limit(20);

      setEntries((data as LeaderboardEntry[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-muted" />;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No leaderboard data yet. Start posting to climb the ranks!
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold">Community Leaderboard</h2>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry, index) => (
          <Link
            key={entry.user_id}
            href={`/community/user/${entry.user_id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="w-6 text-center text-xs font-bold text-muted-foreground">{index + 1}</span>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {(entry.profiles?.full_name ?? 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.profiles?.full_name ?? 'Cadet'}</p>
              <p className="text-xs text-muted-foreground">
                {entry.post_count} posts · {entry.comment_count} comments
              </p>
            </div>
            <span className="text-sm font-semibold text-primary">{entry.karma_score} karma</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
