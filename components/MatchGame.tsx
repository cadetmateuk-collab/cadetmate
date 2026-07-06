'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Flashcard } from '../lib/types';

interface Tile { id: string; cardId: string; text: string; side: 'front' | 'back'; }

export function MatchGame({ cards, onComplete }: {
  cards: Flashcard[]; onComplete: (correct: number, total: number, ms: number) => void;
}) {
  const round = useMemo(() => cards.slice(0, 6), [cards]);
  const total = round.length;

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<Tile | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [start] = useState(() => Date.now());
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const fronts: Tile[] = round.map((c) => ({ id: `f:${c.id}`, cardId: c.id, text: c.front, side: 'front' }));
    const backs: Tile[]  = round.map((c) => ({ id: `b:${c.id}`, cardId: c.id, text: c.back,  side: 'back'  }));
    setTiles([...fronts, ...backs].sort(() => Math.random() - 0.5));
    setMatched(new Set());
    setCorrect(0);
    setSelected(null);
    completedRef.current = false;
  }, [round]);

  useEffect(() => {
    if (completedRef.current || matched.size / 2 !== total || total === 0) return;
    completedRef.current = true;
    onCompleteRef.current(correct, total, Date.now() - start);
  }, [matched, total, correct, start]);

  function pick(t: Tile) {
    if (matched.has(t.cardId)) return;
    if (!selected) { setSelected(t); return; }
    if (selected.id === t.id) { setSelected(null); return; }
    if (selected.cardId === t.cardId && selected.side !== t.side) {
      setMatched((s) => new Set(s).add(t.cardId));
      setCorrect((n) => n + 1);
      setSelected(null);
    } else {
      setWrong(t.id);
      setTimeout(() => { setWrong(null); setSelected(null); }, 500);
    }
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 10, padding: '8px 0',
    }}>
      {tiles.map((t) => {
        const isMatched = matched.has(t.cardId);
        const isSel = selected?.id === t.id;
        const isWrong = wrong === t.id;
        return (
          <button key={t.id} onClick={() => pick(t)} disabled={isMatched}
            style={{
              minHeight: 80, padding: '10px 12px', borderRadius: 12,
              border: `1.5px solid ${isWrong ? 'hsl(var(--destructive))' :
                isSel ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
              background: isMatched ? 'hsl(var(--primary) / 0.08)' :
                          isWrong  ? 'hsl(var(--destructive) / 0.08)' :
                          'hsl(var(--card, var(--background)) / 0.9)',
              color: 'hsl(var(--foreground))',
              fontSize: 13, lineHeight: 1.4,
              cursor: isMatched ? 'default' : 'pointer',
              opacity: isMatched ? 0.45 : 1,
              transition: 'all .15s ease', textAlign: 'center',
            }}>{t.text}</button>
        );
      })}
    </div>
  );
}
