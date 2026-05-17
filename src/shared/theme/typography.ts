export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 48,
} as const;

export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeights = {
  tight: 20,
  normal: 24,
  relaxed: 28,
  loose: 32,
} as const;

export const typography = {
  brand:     { fontSize: fontSizes['5xl'], fontWeight: fontWeights.extrabold, lineHeight: 42 },
  h1:        { fontSize: fontSizes['4xl'], fontWeight: fontWeights.bold,      lineHeight: 38 },
  h2:        { fontSize: fontSizes['3xl'], fontWeight: fontWeights.bold,      lineHeight: 34 },
  h3:        { fontSize: fontSizes['2xl'], fontWeight: fontWeights.semibold,  lineHeight: 30 },
  h4:        { fontSize: fontSizes.xl,    fontWeight: fontWeights.semibold,  lineHeight: 26 },
  body:      { fontSize: fontSizes.base,  fontWeight: fontWeights.normal,    lineHeight: 24 },
  bodyLarge: { fontSize: fontSizes.lg,    fontWeight: fontWeights.normal,    lineHeight: 26 },
  bodySmall: { fontSize: fontSizes.md,    fontWeight: fontWeights.normal,    lineHeight: 20 },
  caption:   { fontSize: fontSizes.sm,    fontWeight: fontWeights.normal,    lineHeight: 18 },
  button:    { fontSize: fontSizes.base,  fontWeight: fontWeights.semibold,  lineHeight: 20 },
  label:     { fontSize: fontSizes.sm,    fontWeight: fontWeights.medium,    lineHeight: 18 },
} as const;

export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
export type TypographyVariant = keyof typeof typography;
