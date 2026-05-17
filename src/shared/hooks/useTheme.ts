import { useThemeScheme } from '../theme/ThemeContext';
import { colors, darkColors } from '../theme/colors';
import type { Colors } from '../theme/colors';

export function useTheme(): Colors {
  const { scheme } = useThemeScheme();
  return scheme === 'dark' ? darkColors : colors;
}
