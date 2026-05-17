export { colors, darkColors, type Colors, type ColorKey } from './colors';
export { ThemeProvider, useThemeScheme, type ThemeMode, type ResolvedScheme } from './ThemeContext';
export { fontSizes, fontWeights, lineHeights, typography, type FontSize, type FontWeight, type TypographyVariant } from './typography';
export { spacing, layout, radius, type SpacingKey, type RadiusKey } from './spacing';
export { shadows, type ShadowKey } from './shadows';
export { icons, getIcon, type IconName } from './icons';
export { animations, durations, easings, animationValues, type AnimationType } from './animations';

import { colors } from './colors';
import { fontSizes, fontWeights, lineHeights, typography } from './typography';
import { spacing, layout, radius } from './spacing';
import { shadows } from './shadows';
import { icons } from './icons';
import { animations, durations, easings } from './animations';

export const theme = {
  colors,
  fontSizes,
  fontWeights,
  lineHeights,
  typography,
  spacing,
  layout,
  radius,
  shadows,
  icons,
  animations,
  durations,
  easings,
} as const;

export type Theme = typeof theme;
