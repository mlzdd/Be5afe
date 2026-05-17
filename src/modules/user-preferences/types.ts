export type { ThemeMode } from '@shared/theme/ThemeContext';
import type { ThemeMode } from '@shared/theme/ThemeContext';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // relative to USD
}

export interface UserPreferences {
  themeMode: ThemeMode;
  displayCurrency: Currency;
  locale: string; // BCP-47, e.g. 'en-AU'
}

export const DEFAULT_CURRENCY: Currency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar',
  exchangeRate: 1,
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: 'system',
  displayCurrency: DEFAULT_CURRENCY,
  locale: 'en-US',
};
