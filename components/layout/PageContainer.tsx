import { cn } from '@/lib/utils';

/** Full-width main content padding — fills the area beside the sidebar */
export const PAGE_SHELL_CLASS =
  'w-full px-4 sm:px-6 md:px-8';

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_SHELL_CLASS, className)}>{children}</div>;
}
