import { AdaptiveShell } from '@/components/layout/AdaptiveShell';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AdaptiveShell>{children}</AdaptiveShell>;
}
