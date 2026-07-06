'use client';

import { cn } from '@/lib/utils';

const PAGE_SHELL_CSS = `
@keyframes cm-fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cm-page-shell {
  min-height: 100dvh;
  background-color: hsl(var(--background));
  position: relative;
  overflow-x: hidden;
  color: hsl(var(--foreground));
}

.cm-dot-grid {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: radial-gradient(circle, hsl(var(--foreground) / 0.07) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 85% 85% at 50% 30%, black 40%, transparent 100%);
}

.cm-glow {
  pointer-events: none;
  position: fixed;
  top: -200px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 0;
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle, hsl(var(--primary) / 0.055) 0%, transparent 66%);
}

.cm-noise {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 180px 180px;
  opacity: 0.025;
  mix-blend-mode: multiply;
}

.cm-content {
  position: relative;
  z-index: 1;
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.25rem 5rem;
}

.cm-content-wide {
  max-width: 68rem;
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
  .cm-content { padding: 2.5rem 2rem 6rem; }
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
        <div className="cm-dot-grid" aria-hidden="true" />
        <div className="cm-glow" aria-hidden="true" />
        <div className="cm-noise" aria-hidden="true" />
        <div className={cn('cm-content', wide && 'cm-content-wide', className)}>
          {children}
        </div>
      </div>
    </>
  );
}

export { PAGE_SHELL_CSS };
