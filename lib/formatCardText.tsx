import type { ReactNode } from 'react';

export type CardTextBlock =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

/** Parse card text with optional bullet lines (`- item`, `* item`, `• item`). */
export function parseCardText(text: string): CardTextBlock[] {
  if (!text?.trim()) return [];

  const blocks: CardTextBlock[] = [];
  let bulletItems: string[] = [];

  const flushBullets = () => {
    if (bulletItems.length) {
      blocks.push({ type: 'ul', items: [...bulletItems] });
      bulletItems = [];
    }
  };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      continue;
    }
    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      bulletItems.push(bullet[1]);
    } else {
      flushBullets();
      blocks.push({ type: 'p', text: trimmed });
    }
  }

  flushBullets();
  return blocks;
}

export function FormattedCardText({ text, className }: { text: string; className?: string }) {
  const blocks = parseCardText(text);
  if (blocks.length === 0) return null;

  const nodes: ReactNode[] = blocks.map((block, i) => {
    if (block.type === 'ul') {
      return (
        <ul key={i} className="fc-list">
          {block.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      );
    }
    return <p key={i}>{block.text}</p>;
  });

  return <div className={['fc-text', className].filter(Boolean).join(' ')}>{nodes}</div>;
}
