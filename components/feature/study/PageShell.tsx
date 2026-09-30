import { cn } from '@/lib/utils';

const PAGE_SHELL_CSS = `
@keyframes cm-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cm-page-shell {
  min-height: 0;
  background-color: transparent;
  position: relative;
  overflow-x: hidden;
  color: hsl(var(--foreground));
}

.cm-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 0 5rem;
}

.cm-content-wide {
  max-width: none;
}

.cm-anim-1 { animation: cm-fadeUp 0.4s ease both 0.05s; }
.cm-anim-2 { animation: cm-fadeUp 0.4s ease both 0.12s; }
.cm-anim-3 { animation: cm-fadeUp 0.4s ease both 0.2s; }

.cm-page-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 0.5rem;
  color: hsl(var(--foreground));
}

.cm-page-subtitle {
  font-size: 0.9375rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.6;
}

.cm-back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground) / 0.7);
  text-decoration: none;
  transition: color 0.15s;
  margin-bottom: 1.25rem;
}
.cm-back-link:hover { color: hsl(var(--primary)); }

@media (min-width: 640px) {
  .cm-content { padding: 0 0 6rem; }
}
`;

interface PageShellProps {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}

export function PageShell({ children, wide = false, className }: PageShellProps) {
  return (
    <>
      <style>{PAGE_SHELL_CSS}</style>
      <div className="cm-page-shell">
        <div className={cn('cm-content', wide && 'cm-content-wide', className)}>
          {children}
        </div>
      </div>
    </>
  );
}

export { PAGE_SHELL_CSS };
