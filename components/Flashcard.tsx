'use client';
import { memo, useEffect, useState, useCallback } from 'react';
import type { Flashcard } from '../lib/types';
import { FormattedCardText } from '../lib/formatCardText';

/** 3D-flip card with markdown support on front and back. */
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

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onFlip();
      }
    },
    [onFlip],
  );

  const imageAlt =
    card.front?.trim()
      ? `Illustration for: ${card.front.replace(/[#*_`]/g, '').slice(0, 120)}`
      : 'Flashcard illustration';

  return (
    <button
      type="button"
      className={`fc-scene clickable${flipped ? ' is-showing-back' : ''}`}
      onClick={onFlip}
      onKeyDown={onKeyDown}
      aria-label={flipped ? 'Flip to question' : 'Flip to answer'}
      aria-pressed={flipped}
    >
      <div className={`fc-enter${entering ? ' is-entering' : ''}`}>
        <div className={`fc-card${flipped ? ' is-flipped' : ''}`}>
        <div className="fc-face fc-front" aria-hidden={flipped}>
          <div className="fc-face-inner">
            {category && <span className="fc-cat">{category}</span>}
            <div className="fc-body">
              {card.image_url && (
                <img src={card.image_url} alt={imageAlt} className="fc-img" />
              )}
              <FormattedCardText text={card.front} variant="question" className="fc-q" />
              {card.hint && <div className="fc-hint">Hint: {card.hint}</div>}
            </div>
            <div className="fc-footer fc-cue">Tap or press Space to reveal</div>
          </div>
        </div>

        <div className="fc-face fc-back" aria-hidden={!flipped}>
          <div className="fc-face-inner">
            {category && <span className="fc-cat">{category}</span>}
            <div className="fc-body">
              <FormattedCardText text={card.back} variant="answer" className="fc-a" />
            </div>
            <div className="fc-footer fc-corner">Rate your recall ↓</div>
          </div>
        </div>
        </div>
      </div>
    </button>
  );
});
