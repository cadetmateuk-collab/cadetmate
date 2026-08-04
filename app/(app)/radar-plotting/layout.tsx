import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata('Radar Plotting', '/radar-plotting');

export default function RadarPlottingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
