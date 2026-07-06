'use client';
import { useEffect, useState } from 'react';
import type { Flashcard } from '../lib/types';

/** Timed mode — 60s, multiple-choice if available, else self-rated. */
export function QuickFire({ cards, onDone }: {
  cards: Flashcard[]; onDone: (correct: number, total: number) => void;
}) {
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [left, setLeft] = useState(60);
  const c = cards[i % cards.length];

  useEffect(() => {
    if (left <= 0) { onDone(correct, i); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  function answer(ok: boolean) {
    if (ok) setCorrect((n) => n + 1);
    setI((n) => n + 1);
  }

  const choices = c?.options?.choices ?? [c?.back ?? '', 'Skip'];
  const correctIx = c?.options?.correctIndex ?? 0;

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 700, color: 'hsl(var(--muted-foreground))',
        marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        <span>⚡ Quick Fire</span>
        <span style={{ color: left < 10 ? 'hsl(var(--destructive))' : undefined }}>{left}s</span>
        <span>✓ {correct}</span>
      </div>
      <div style={{
        padding: '22px 20px', borderRadius: 16,
        background: 'hsl(var(--card, var(--background)))',
        border: '1px solid hsl(var(--border))',
        fontSize: 18, lineHeight: 1.5,
        marginBottom: 14, minHeight: 100,
      }}>{c?.front}</div>
      {c?.card_type === 'multiple_choice' ? (
        <div style={{ display: 'grid', gap: 8 }}>
          {choices.map((ch, ix) => (
            <button key={ix} onClick={() => answer(ix === correctIx)} className="fc-btn fc-btn-skip"
              style={{ flex: 'none', justifyContent: 'flex-start' }}>{ch}</button>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="fc-btn fc-btn-skip" onClick={() => answer(false)}>Missed</button>
          <button className="fc-btn fc-btn-flip" onClick={() => answer(true)}>Got it</button>
        </div>
      )}
    </div>
  );
}
