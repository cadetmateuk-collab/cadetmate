'use client';
import { useState } from 'react';
import type { Flashcard } from '../lib/types';
import { Heart } from 'lucide-react';
import { FlashcardView } from './Flashcard';

export function Survival({ cards, lives = 3, onDone }: {
  cards: Flashcard[]; lives?: number; onDone: (cleared: number) => void;
}) {
  const [i, setI] = useState(0);
  const [hp, setHp] = useState(lives);
  const [flipped, setFlipped] = useState(false);
  const c = cards[i % cards.length];

  function rate(ok: boolean) {
    if (!ok) {
      const next = hp - 1;
      setHp(next);
      if (next <= 0) { onDone(i); return; }
    }
    setFlipped(false);
    setI((n) => n + 1);
  }

  return (
    <div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, fontWeight: 700, marginBottom: 10,
        color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        <span>🛟 Survival</span>
        <span style={{ display: 'inline-flex', gap: 4 }}>
          {Array.from({ length: lives }).map((_, ix) => (
            <Heart key={ix} size={14}
              fill={ix < hp ? 'hsl(var(--destructive))' : 'transparent'}
              color="hsl(var(--destructive))" />
          ))}
        </span>
        <span>Cleared {i}</span>
      </div>
      <FlashcardView card={c} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      {flipped && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="fc-btn fc-btn-skip" onClick={() => rate(false)}>Missed</button>
          <button className="fc-btn fc-btn-flip" onClick={() => rate(true)}>Got it</button>
        </div>
      )}
    </div>
  );
}
