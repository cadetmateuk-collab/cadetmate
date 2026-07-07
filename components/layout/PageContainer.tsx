import { cn } from '@/lib/utils';

/** Matches the header bar column — keep in sync with AppTopNav / PublicHeader */
export const PAGE_SHELL_CLASS = 'mx-auto w-full max-w-7xl px-4 sm:px-6';

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_SHELL_CLASS, className)}>{children}</div>;
}
