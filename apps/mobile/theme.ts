/** CadetMate native tokens — matches app/tokens.css light cadet UI. */

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
} as const;

export const colors = {
  bg: '#F5F7FB',
  parchment: '#F6F7F9',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8E6E0',
  text: '#292C33',
  textMuted: '#555960',
  textSoft: '#555960',
  primary: '#2966F2',
  primaryBright: '#5586F6',
  primaryText: '#FFFFFF',
  primarySoft: 'rgba(41,102,242,0.10)',
  brass: '#C6993F',
  brassSoft: 'rgba(198,153,63,0.15)',
  danger: '#E23B32',
  dangerText: '#E23B32',
  dangerSoft: '#FBECEC',
  success: '#2C9664',
  successSoft: '#E8F6EF',
  warning: '#D2851E',
  warningSoft: '#FBF1E3',
  tabInactive: '#555960',
  shadow: 'rgba(41,102,242,0.09)',
};

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 16,
};

export const shadow = {
  card: {
    shadowColor: '#2966F2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const type = {
  h1: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.text,
    letterSpacing: -0.56,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.44,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 17,
    fontWeight: '700' as const,
    color: colors.text,
    letterSpacing: -0.34,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.66,
    textTransform: 'uppercase' as const,
  },
};
