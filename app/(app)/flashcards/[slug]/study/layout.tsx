import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Study Session', '/flashcards');

export default function FlashcardStudyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
