import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Flashcards',
  description: 'Spaced-repetition flashcard decks for merchant navy and deck cadet training.',
  path: '/flashcards',
  noIndex: true,
});

export default function FlashcardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
