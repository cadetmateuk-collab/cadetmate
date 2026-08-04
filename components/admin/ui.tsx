/**
 * Shared admin UI primitives used across Admin*Tab screens.
 * Prefer these over copy-pasted local Btn/Input/Badge helpers.
 */

import type { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

/** Inline-style admin palette (legacy hex tabs). Prefer CSS tokens in new work. */
export const C = {
  bg: '#ffffff',
  fg: '#000000',
  primary: '#2966f4',
  primaryLight: '#eef2fe',
  muted: '#f5f5f5',
  mutedFg: '#737373',
  border: '#ededed',
  green: '#16a34a',
  greenLight: '#f0fdf4',
  greenBorder: '#bbf7d0',
  red: '#dc2626',
  redLight: '#fef2f2',
  amber: '#d97706',
  amberLight: '#fffbeb',
  purple: '#7c3aed',
  purpleLight: '#f5f3ff',
  gold: '#f59e0b',
  radius: '8px',
  radiusSm: '6px',
} as const;

/** Token-aligned colors for newer admin surfaces */
export const adminColors = {
  bg: 'hsl(var(--background))',
  fg: 'hsl(var(--foreground))',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  card: 'hsl(var(--card))',
  primary: 'hsl(var(--primary))',
  primarySolid: '#2A61FA',
  danger: 'hsl(var(--destructive))',
  success: '#16a34a',
} as const;

export function AdminBtn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  type = 'button',
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'default';
  disabled?: boolean;
  type?: 'button' | 'submit';
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '6px 12px',
    minHeight: 36,
    borderRadius: C.radius,
    fontSize: 12,
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s',
    fontFamily: 'inherit',
    ...style,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: C.primary, color: '#fff' },
    default: { background: C.bg, color: C.fg, border: `1px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.mutedFg, border: `1px solid ${C.border}` },
    danger: { background: C.redLight, color: C.red, border: `1px solid ${C.red}33` },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function AdminBadge({
  children,
  variant = 'muted',
  tone,
}: {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'muted' | 'danger' | 'neutral';
  /** @deprecated use variant */
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
}) {
  const v = tone === 'neutral' ? 'muted' : tone ?? variant;
  const styles: Record<string, CSSProperties> = {
    primary: { background: C.primaryLight, color: C.primary, border: `1px solid ${C.primary}33` },
    success: { background: C.greenLight, color: C.green, border: `1px solid ${C.greenBorder}` },
    muted: { background: C.muted, color: C.mutedFg, border: `1px solid ${C.border}` },
    neutral: { background: C.muted, color: C.mutedFg, border: `1px solid ${C.border}` },
    danger: { background: C.redLight, color: C.red, border: `1px solid ${C.red}33` },
  };
  return (
    <span
      style={{
        ...styles[v],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

export function AdminLabel({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: C.mutedFg,
        marginBottom: 6,
      }}
    >
      {children}
    </p>
  );
}

export function AdminInfoBanner({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 16px',
        borderRadius: C.radius,
        background: C.primaryLight,
        border: `1px solid ${C.primary}22`,
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 12, color: C.mutedFg, lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}

export function AdminIconBtn({
  onClick,
  title,
  children,
  color,
}: {
  onClick: () => void;
  title?: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: 6,
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        color: color ?? C.mutedFg,
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = C.muted;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export function AdminInput({
  value,
  onChange,
  disabled,
  type = 'text',
  placeholder,
  style,
  ...rest
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  type?: string;
  placeholder?: string;
  style?: CSSProperties;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: C.radius,
        fontSize: 12,
        border: `1px solid ${C.border}`,
        background: disabled ? C.muted : C.bg,
        color: C.fg,
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = C.primary;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
      {...rest}
    />
  );
}

export function AdminTextarea({
  value,
  onChange,
  disabled,
  rows = 2,
  placeholder,
  style,
  ...rest
}: {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  rows?: number;
  placeholder?: string;
  style?: CSSProperties;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'>) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: C.radius,
        fontSize: 12,
        border: `1px solid ${C.border}`,
        background: disabled ? C.muted : C.bg,
        color: C.fg,
        fontFamily: 'inherit',
        outline: 'none',
        resize: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => {
        if (!disabled) e.currentTarget.style.borderColor = C.primary;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
      {...rest}
    />
  );
}

export function AdminSelect({
  value,
  onChange,
  disabled,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: C.radius,
        fontSize: 12,
        border: `1px solid ${C.border}`,
        background: disabled ? C.muted : C.bg,
        color: C.fg,
        fontFamily: 'inherit',
        outline: 'none',
        boxSizing: 'border-box',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function AdminCard({
  children,
  highlighted = false,
}: {
  children: ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${highlighted ? C.primary : C.border}`,
        borderRadius: C.radius,
        padding: 16,
        boxShadow: highlighted ? `0 0 0 1px ${C.primary}22` : undefined,
      }}
    >
      {children}
    </div>
  );
}
