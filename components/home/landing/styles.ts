export const LANDING_STYLES = `
@keyframes lp-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes lp-pulse-ring {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.15; transform: scale(1.08); }
}

.lp-root {
  position: relative;
  overflow-x: clip;
  background: transparent;
}

.lp-content { position: relative; z-index: 1; }

.lp-section {
  position: relative;
  isolation: isolate;
}

.lp-section-fade::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background: linear-gradient(
    180deg,
    hsl(var(--background)) 0%,
    transparent 12%,
    transparent 88%,
    hsl(var(--background)) 100%
  );
}

.lp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: hsl(var(--primary));
}

.lp-headline {
  font-size: clamp(2.5rem, 6vw, 4.25rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
  color: hsl(var(--foreground));
}

.lp-headline-sm {
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.lp-lead {
  font-size: clamp(1.0625rem, 1.5vw, 1.25rem);
  line-height: 1.65;
  color: hsl(var(--muted-foreground));
  max-width: 34rem;
}

.lp-card {
  border-radius: 1rem;
  border: 1px solid hsl(var(--foreground) / 0.06);
  background: hsl(var(--background) / 0.7);
  backdrop-filter: blur(8px);
  box-shadow:
    0 0 0 1px hsl(var(--foreground) / 0.02),
    0 1px 2px hsl(var(--foreground) / 0.04),
    0 8px 24px hsl(var(--foreground) / 0.04);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1),
              border-color 0.25s ease;
}

.lp-card:hover {
  transform: translateY(-3px);
  border-color: hsl(var(--primary) / 0.15);
  box-shadow:
    0 0 0 1px hsl(var(--primary) / 0.06),
    0 4px 12px hsl(var(--primary) / 0.06),
    0 20px 48px hsl(var(--foreground) / 0.07);
}

.lp-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.75rem;
  padding: 0 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: white;
  background: hsl(var(--primary));
  border-radius: 0.625rem;
  border: 1px solid hsl(var(--primary));
  box-shadow: 0 1px 2px hsl(var(--primary) / 0.2), 0 8px 20px hsl(var(--primary) / 0.22);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.lp-btn-primary:hover {
  transform: translateY(-1px) scale(1.01);
  color: white;
  box-shadow: 0 2px 4px hsl(var(--primary) / 0.25), 0 12px 28px hsl(var(--primary) / 0.28);
}

.lp-btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 2.75rem;
  padding: 0 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: hsl(var(--foreground));
  background: hsl(var(--background) / 0.8);
  border-radius: 0.625rem;
  border: 1px solid hsl(var(--foreground) / 0.1);
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}
.lp-btn-ghost:hover {
  transform: translateY(-1px);
  background: hsl(var(--muted) / 0.5);
  border-color: hsl(var(--foreground) / 0.15);
}

.lp-browser {
  border-radius: 0.875rem;
  border: 1px solid hsl(var(--foreground) / 0.08);
  background: hsl(var(--background));
  box-shadow:
    0 0 0 1px hsl(var(--foreground) / 0.03),
    0 24px 80px hsl(var(--foreground) / 0.1),
    0 8px 24px hsl(var(--foreground) / 0.06);
  overflow: hidden;
}

.lp-browser-bar {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid hsl(var(--foreground) / 0.06);
  background: hsl(var(--muted) / 0.35);
}

.lp-browser-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  background: hsl(var(--foreground) / 0.12);
}

@media (prefers-reduced-motion: reduce) {
  .lp-glow, .lp-glow-secondary { animation: none; }
  .lp-card:hover { transform: none; }
  .lp-btn-primary:hover, .lp-btn-ghost:hover { transform: none; }
}
`;
