'use client';

import { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatScore } from '@/lib/community/utils';

interface VoteControlsProps {
  targetType: 'post' | 'comment';
  targetId: string;
  score: number;
  userVote?: number | null;
  onVote?: (newScore: number, userVote: number | null) => void;
  compact?: boolean;
}

export function VoteControls({
  targetType,
  targetId,
  score,
  userVote: initialVote,
  onVote,
  compact = false,
}: VoteControlsProps) {
  const [currentScore, setCurrentScore] = useState(score);
  const [userVote, setUserVote] = useState<number | null>(initialVote ?? null);
  const [loading, setLoading] = useState(false);

  const castVote = useCallback(
    async (value: -1 | 1 | 0) => {
      if (loading) return;

      const prevVote = userVote;
      const prevScore = currentScore;
      let newVote: number | null = value === 0 ? null : value;
      let delta = 0;

      if (value === 0) {
        delta = -(prevVote ?? 0);
      } else if (prevVote === value) {
        newVote = null;
        delta = -value;
      } else if (prevVote === null) {
        delta = value;
      } else {
        delta = value - prevVote;
      }

      setUserVote(newVote);
      setCurrentScore(prevScore + delta);
      setLoading(true);

      try {
        const res = await fetch('/api/community/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId, value: newVote === null ? 0 : newVote }),
        });

        if (!res.ok) {
          setUserVote(prevVote);
          setCurrentScore(prevScore);
          return;
        }

        const data = await res.json();
        setUserVote(data.userVote);
        onVote?.(prevScore + delta, data.userVote);
      } catch {
        setUserVote(prevVote);
        setCurrentScore(prevScore);
      } finally {
        setLoading(false);
      }
    },
    [loading, userVote, currentScore, targetType, targetId, onVote],
  );

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-lg bg-muted/80 border border-border',
        compact ? 'p-1' : 'p-1.5',
      )}
    >
      <button
        type="button"
        onClick={() => castVote(1)}
        disabled={loading}
        aria-label="Upvote"
        className={cn(
          'rounded p-0.5 transition-colors hover:bg-orange-100',
          userVote === 1 ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500',
        )}
      >
        <ChevronUp className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.5} />
      </button>
      <span
        className={cn(
          'text-xs font-bold tabular-nums',
          userVote === 1 && 'text-orange-500',
          userVote === -1 && 'text-blue-500',
          userVote === null && 'text-muted-foreground',
        )}
      >
        {formatScore(currentScore)}
      </span>
      <button
        type="button"
        onClick={() => castVote(-1)}
        disabled={loading}
        aria-label="Downvote"
        className={cn(
          'rounded p-0.5 transition-colors hover:bg-blue-100',
          userVote === -1 ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500',
        )}
      >
        <ChevronDown className={compact ? 'h-4 w-4' : 'h-5 w-5'} strokeWidth={2.5} />
      </button>
    </div>
  );
}
