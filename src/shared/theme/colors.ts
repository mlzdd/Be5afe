export const colors = {
  brandLight: '#badcdb',
  brandDark: '#013220',

  accent: '#99c9c9',
  accentDark: '#0b2e23',
  accentLight: '#bfe1d7',

  textPrimary: '#000000',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',

  button: '#eef4f4',
  buttonBorder: '#99c9c9',
  background: '#ffffff',
  card: '#ffffff',
  cardBackground: '#ffffff',

  inputBackground: '#F5F5F5',
  inputBorder: '#E0E0E0',
  inputFocusBorder: '#99c9c9',
  placeholder: '#9E9E9E',

  widgetBackground: '#FAFAFA',
  widgetBorder: '#E0E0E0',

  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  highlight: '#2EC5FF',

  safetyHigh: '#4CAF50',
  safetyMedium: '#FFC107',
  safetyLow: '#FF5722',

  alertCritical: '#D32F2F',
  alertHigh: '#F44336',
  alertMedium: '#FF9800',
  alertLow: '#FFC107',
  alertInfo: '#2196F3',

  transparentBlack30: 'rgba(0, 0, 0, 0.3)',
  transparentWhite50: 'rgba(255, 255, 255, 0.5)',

  border: '#e6e6e6',
  divider: '#e0e0e0',
  separator: '#e0e0e0',

  avoid: '#FF6B6B',
  recommended: '#4ECDC4',
} as const;

export const darkColors = {
  brandLight: '#badcdb',
  brandDark: '#013220',

  accent: '#99c9c9',
  accentDark: '#0b2e23',
  accentLight: '#bfe1d7',

  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#808080',
  textInverse: '#000000',

  button: '#2C2C2C',
  buttonBorder: '#99c9c9',
  background: '#121212',
  card: '#1E1E1E',
  cardBackground: '#1E1E1E',

  inputBackground: '#2C2C2C',
  inputBorder: '#404040',
  inputFocusBorder: '#99c9c9',
  placeholder: '#707070',

  widgetBackground: '#1E1E1E',
  widgetBorder: '#404040',

  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',
  highlight: '#2EC5FF',

  safetyHigh: '#4CAF50',
  safetyMedium: '#FFC107',
  safetyLow: '#FF5722',

  alertCritical: '#D32F2F',
  alertHigh: '#F44336',
  alertMedium: '#FF9800',
  alertLow: '#FFC107',
  alertInfo: '#2196F3',

  transparentBlack30: 'rgba(0, 0, 0, 0.3)',
  transparentWhite50: 'rgba(255, 255, 255, 0.5)',

  border: '#333333',
  divider: '#2C2C2C',
  separator: '#2C2C2C',

  avoid: '#FF6B6B',
  recommended: '#4ECDC4',
} as const;

export type Colors = Record<keyof typeof colors, string>;
export type ColorKey = keyof typeof colors;
