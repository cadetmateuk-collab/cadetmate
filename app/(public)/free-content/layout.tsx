import { PublicShell } from '@/components/layout/PublicShell';

/**
 * Free Content always uses public chrome (no AdaptiveShell / auth headers).
 * AdaptiveShell + force-dynamic was contributing to continuous RSC refetch loops.
 */
export default function FreeContentLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
