'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { prefersReducedMotion } from '@/lib/motion/constants';
import { cn } from '@/lib/utils';

export const Reveal = memo(function Reveal({
  children,
  className,
  delay = 0,
  eager = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager || prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -16px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  if (eager) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={cn('lp-reveal', visible && 'is-visible', className)}
      style={visible || prefersReducedMotion() ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

export const CountUp = memo(function CountUp({
  value,
  suffix = '',
}: {
  value: number | string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string | number>(
    typeof value === 'number' ? 0 : value,
  );
  const started = useRef(false);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }
    if (prefersReducedMotion()) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let rafId = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const target = value;
        const duration = 700;
        const start = performance.now();

        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(target * eased));
          if (progress < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
});
