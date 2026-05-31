'use client';
import { useEffect, useState } from 'react';
import type { Flashcard } from '../lib/types';

/** 3D-flip card matching the bp-* styling from the study page. */
export function FlashcardView({
  card, flipped, onFlip, category,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  category?: string;
}) {
  const [entering, setEntering] = useState(true);
  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 360);
    return () => clearTimeout(t);
  }, [card.id]);

  return (
    <div className="fc-scene clickable" onClick={onFlip} role="button" aria-label="Flip card">
      <div className={`fc-card${flipped ? ' is-flipped' : ''}${entering ? ' is-entering' : ''}`}>
        <div className="fc-face fc-front">
          {category && <span className="fc-cat">{category}</span>}
          {card.image_url && (
            <img src={card.image_url} alt=""
              style={{ maxHeight: 110, maxWidth: '100%', objectFit: 'contain', marginBottom: 12, borderRadius: 8 }} />
          )}
          <div className="fc-q">{card.front}</div>
          {card.hint && <div className="fc-hint">Hint: {card.hint}</div>}
          <div className="fc-cue">Tap or press Space to reveal</div>
        </div>
        <div className="fc-face fc-back">
          {category && <span className="fc-cat">{category}</span>}
          <div className="fc-a">{card.back}</div>
          <div className="fc-corner">Rate your recall ↓</div>
        </div>
      </div>
    </div>
  );
}
