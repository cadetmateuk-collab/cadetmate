'use client';
import { memo } from 'react';
import { rankForXP } from '../lib/algorithms';
import { Flame } from 'lucide-react';
import type { UserXP } from '../lib/types';

export const XPBar = memo(function XPBar({ xp }: { xp: UserXP | null }) {
  const total = xp?.xp ?? 0;
  const r = rankForXP(total);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 14px', borderRadius: 14,
      background: 'hsl(var(--card, var(--background)) / 0.85)',
      border: '1px solid hsl(var(--border))', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: 'hsl(var(--primary) / 0.12)',
        color: 'hsl(var(--primary))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800,
      }}>{r.current[0]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 11, color: 'hsl(var(--muted-foreground))',
          fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase',
        }}>
          <span>{r.current}</span>
          <span>{total} XP{r.next && ` · ${r.toNext} to ${r.next}`}</span>
        </div>
        <div style={{
          marginTop: 6, height: 5, borderRadius: 99,
          background: 'hsl(var(--border))', overflow: 'hidden',
        }}>
          <div style={{
            width: `${r.pct * 100}%`, height: '100%',
            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
            transition: 'width .5s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 99,
        background: 'hsl(var(--destructive) / 0.08)',
        color: 'hsl(var(--destructive))',
        fontWeight: 700, fontSize: 12,
      }}>
        <Flame size={13} /> {xp?.current_streak ?? 0}
      </div>
    </div>
  );
});
