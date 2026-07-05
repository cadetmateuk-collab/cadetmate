'use client';
import { memo, useEffect, useState } from 'react';
import type { Flashcard } from '../lib/types';
import { FormattedCardText } from '../lib/formatCardText';

/** 3D-flip card matching the bp-* styling from the study page. */
export const FlashcardView = memo(function FlashcardView({
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
          <div className="fc-body">
            {card.image_url && (
              <img src={card.image_url} alt=""
                className="fc-img" />
            )}
            <FormattedCardText text={card.front} className="fc-q" />
            {card.hint && <div className="fc-hint">Hint: {card.hint}</div>}
          </div>
          <div className="fc-footer fc-cue">Tap or press Space to reveal</div>
        </div>
        <div className="fc-face fc-back">
          {category && <span className="fc-cat">{category}</span>}
          <div className="fc-body">
            <FormattedCardText text={card.back} className="fc-a" />
          </div>
          <div className="fc-footer fc-corner">Rate your recall ↓</div>
        </div>
      </div>
    </div>
  );
});
