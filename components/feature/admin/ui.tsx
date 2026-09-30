/**
 * Shared admin UI primitives used across Admin*Tab screens.
 * Token-aligned with the site design system (app/tokens.css).
 */

import type {
  ChangeEvent,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';

/** Token-backed palette — black actions, yellow nav accent. */
export const C = {
  bg: 'hsl(var(--card))',
  fg: 'hsl(var(--foreground))',
  primary: '#242423',
  primaryLight: 'rgba(36, 36, 35, 0.08)',
  muted: 'hsl(var(--muted))',
  mutedFg: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  green: 'hsl(var(--starboard))',
  greenLight: 'hsl(var(--starboard-light))',
  greenBorder: 'hsl(var(--starboard) / 0.25)',
  red: 'hsl(var(--destructive))',
  redLight: 'hsl(var(--destructive) / 0.08)',
  amber: '#f5cb5c',
  amberLight: 'rgba(245, 203, 92, 0.18)',
  /** Yellow accent for active tabs / nav (not buttons) */
  accent: '#f5cb5c',
  accentFg: '#242423',
  purple: '#242423',
  purpleLight: 'rgba(36, 36, 35, 0.08)',
  gold: '#f5cb5c',
  radius: 'var(--radius-md, 8px)',
  radiusSm: 'var(--radius-sm, 6px)',
} as const;

export const adminColors = {
  bg: '#e8eddf',
  fg: '#242423',
  muted: '#333533',
  border: '#cfdbd5',
  card: '#ffffff',
  primary: '#242423',
  primarySolid: '#242423',
  danger: 'hsl(var(--destructive))',
  success: 'hsl(var(--starboard))',
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
    transition: 'opacity 0.15s, background 0.15s',
    fontFamily: 'inherit',
    ...style,
  };
  const variants: Record<string, CSSProperties> = {
    primary: { background: '#242423', color: '#ffffff', border: `1px solid #242423` },
    default: { background: C.bg, color: C.fg, border: `1px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.mutedFg, border: `1px solid ${C.border}` },
    danger: { background: C.redLight, color: C.red, border: `1px solid hsl(var(--destructive) / 0.2)` },
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
  variant?: 'primary' | 'success' | 'muted' | 'danger' | 'neutral' | 'warning';
  /** @deprecated use variant */
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
}) {
  const v = tone === 'neutral' ? 'muted' : tone ?? variant;
  const styles: Record<string, CSSProperties> = {
    primary: { background: '#242423', color: '#ffffff', border: `1px solid #242423` },
    success: { background: C.greenLight, color: C.green, border: `1px solid ${C.greenBorder}` },
    muted: { background: C.muted, color: C.mutedFg, border: `1px solid ${C.border}` },
    neutral: { background: C.muted, color: C.mutedFg, border: `1px solid ${C.border}` },
    danger: { background: C.redLight, color: C.red, border: `1px solid hsl(var(--destructive) / 0.2)` },
    warning: {
      background: C.amberLight,
      color: '#242423',
      border: `1px solid hsl(var(--signal-amber) / 0.35)`,
    },
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
        border: `1px solid hsl(var(--primary) / 0.15)`,
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

type InputChange = ((v: string) => void) | ((e: ChangeEvent<HTMLInputElement>) => void);

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
  onChange?: InputChange;
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
      onChange={(e) => {
        if (!onChange) return;
        if (onChange.length >= 1) {
          // Support both (value: string) and event handlers
          try {
            (onChange as (v: string) => void)(e.target.value);
          } catch {
            (onChange as (ev: ChangeEvent<HTMLInputElement>) => void)(e);
          }
        }
      }}
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
  onChange?: ((v: string) => void) | ((e: ChangeEvent<HTMLTextAreaElement>) => void);
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
      onChange={(e) => {
        if (!onChange) return;
        try {
          (onChange as (v: string) => void)(e.target.value);
        } catch {
          (onChange as (ev: ChangeEvent<HTMLTextAreaElement>) => void)(e);
        }
      }}
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
  children,
  style,
  ...rest
}: {
  value: string;
  onChange: ((v: string) => void) | ((e: ChangeEvent<HTMLSelectElement>) => void);
  disabled?: boolean;
  options?: { label: string; value: string }[];
  children?: ReactNode;
  style?: CSSProperties;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'>) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => {
          try {
            (onChange as (v: string) => void)(e.target.value);
          } catch {
            (onChange as (ev: ChangeEvent<HTMLSelectElement>) => void)(e);
          }
        }}
        style={{
          width: '100%',
          padding: '8px 36px 8px 12px',
          borderRadius: C.radius,
          fontSize: 12,
          border: `1px solid ${C.border}`,
          background: disabled ? C.muted : C.bg,
          color: C.fg,
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          ...style,
        }}
        {...rest}
      >
        {children ??
          options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
      </select>
      <ChevronDown
        size={14}
        aria-hidden
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: C.mutedFg,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export function AdminCard({
  children,
  highlighted = false,
  style,
}: {
  children: ReactNode;
  highlighted?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${highlighted ? C.primary : C.border}`,
        borderRadius: C.radius,
        padding: 16,
        boxShadow: highlighted
          ? `0 0 0 1px hsl(var(--primary) / 0.15)`
          : 'var(--shadow-card, 0 1px 2px hsl(var(--primary) / 0.06))',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
