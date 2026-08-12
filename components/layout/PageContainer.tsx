import { cn } from '@/lib/utils';

/** Horizontal padding for chrome rows (header / footer) — full width of the column */
export const PAGE_SHELL_CLASS = 'w-full px-4 sm:px-6 md:px-8';

/**
 * Main content column inside the app/admin/public main area (not header/sidebar).
 * 80% of the main column, centered. Module viewers / full-bleed tools bypass this via AppShell.
 */
export const PAGE_CONTENT_CLASS = 'page-col-80';

const PAGE_COL_STYLE = {
  width: '80%',
  maxWidth: '80%',
  marginLeft: 'auto',
  marginRight: 'auto',
  boxSizing: 'border-box',
  alignSelf: 'center',
} as const;

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(PAGE_CONTENT_CLASS, className)} style={PAGE_COL_STYLE}>
      {children}
    </div>
  );
}
