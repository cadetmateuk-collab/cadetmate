/** Inline SVG maritime illustrations — consistent stroke width (1.5) */

const STROKE = 1.5;

export function WaveFlagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 14c2-1 3-1 5 0s3 1 5 0 3-1 5 0"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
      />
      <path
        d="M3 18c2-1 3-1 5 0s3 1 5 0 3-1 5 0"
        stroke="currentColor"
        strokeWidth={STROKE}
        strokeLinecap="round"
        opacity={0.6}
      />
      <path d="M5 4v8M5 4l4 2-4 2" stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="round" />
    </svg>
  );
}

export function CompassEmptyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth={STROKE} opacity={0.25} />
      <circle cx="40" cy="40" r="24" stroke="currentColor" strokeWidth={STROKE} opacity={0.15} />
      <path d="M40 8v8M40 64v8M8 40h8M64 40h8" stroke="currentColor" strokeWidth={STROKE} opacity={0.3} />
      <path
        d="M40 18 L46 46 L40 40 L34 46 Z"
        fill="currentColor"
        opacity={0.35}
      />
      <path
        d="M40 62 L34 34 L40 40 L46 34 Z"
        fill="currentColor"
        opacity={0.2}
      />
      <circle cx="40" cy="40" r="3" fill="currentColor" opacity={0.5} />
    </svg>
  );
}

export function CompassWatermark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth={1} opacity={0.08} />
      <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth={1} opacity={0.06} />
      <path d="M100 20v16M100 164v16M20 100h16M164 100h16" stroke="currentColor" strokeWidth={1} opacity={0.08} />
      <path d="M100 35 L112 112 L100 100 L88 112 Z" fill="currentColor" opacity={0.06} />
      <path d="M100 165 L88 88 L100 100 L112 88 Z" fill="currentColor" opacity={0.04} />
    </svg>
  );
}
