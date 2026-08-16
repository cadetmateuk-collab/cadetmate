import { AdaptiveShell } from '@/components/layout/AdaptiveShell';

/**
 * Same chrome as other public pages: logged-in users keep the app sidebar,
 * guests see the public sidebar.
 */
export default function FreeContentLayout({ children }: { children: React.ReactNode }) {
  return <AdaptiveShell>{children}</AdaptiveShell>;
}
