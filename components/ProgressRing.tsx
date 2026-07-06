'use client';
/** Circular progress ring used on the library cards. */
export function ProgressRing({
  value, size = 56, stroke = 5, label,
}: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r}
          stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r}
          stroke="hsl(var(--primary))" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray .6s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 13,
        color: 'hsl(var(--foreground))',
      }}>
        {label ?? `${Math.round(value * 100)}%`}
      </div>
    </div>
  );
}
