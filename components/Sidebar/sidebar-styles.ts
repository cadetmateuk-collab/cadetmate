/** Shared sidebar visual tokens — used by AppSidebar and legacy CadetMateSidebar */

export const SIDEBAR_COLORS = {
  primary: '#2966F4',
  yellow: '#F8E9A1',
} as const;

export const SIDEBAR_TEXT = {
  idle: 'text-white/90',
  border: 'border-white/10',
  label: 'text-white text-[10px] font-semibold uppercase tracking-[1.4px]',
} as const;

export type GlassStrength = 'idle' | 'hover' | 'active';

export function glassStyle(strength: GlassStrength): React.CSSProperties {
  return {
    background:
      strength === 'active'
        ? 'rgba(255,255,255,0.18)'
        : strength === 'hover'
          ? 'rgba(255,255,255,0.11)'
          : 'transparent',
    backdropFilter: strength !== 'idle' ? 'blur(8px)' : undefined,
    WebkitBackdropFilter: strength !== 'idle' ? 'blur(8px)' : undefined,
    border: `1px solid rgba(255,255,255,${strength === 'active' ? '0.22' : strength === 'hover' ? '0.13' : '0'})`,
    boxShadow:
      strength === 'active'
        ? '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.25)'
        : strength === 'hover'
          ? 'inset 0 1px 0 rgba(255,255,255,0.14)'
          : undefined,
  };
}

export const SIDEBAR_NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;
