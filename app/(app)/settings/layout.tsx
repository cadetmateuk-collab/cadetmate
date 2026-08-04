import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Settings', '/settings');

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
