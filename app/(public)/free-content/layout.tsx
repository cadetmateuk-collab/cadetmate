import type { Metadata } from 'next';
import { AdaptiveShell } from '@/components/layout/AdaptiveShell';

export default function FreeContentLayout({ children }: { children: React.ReactNode }) {
  return <AdaptiveShell>{children}</AdaptiveShell>;
}
