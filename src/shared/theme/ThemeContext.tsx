import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Owned here in shared so modules/user-preferences can reference it without a circular dep
export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

interface ThemeContextValue {
  scheme: ResolvedScheme;
}

const ThemeContext = createContext<ThemeContextValue>({ scheme: 'light' });

interface Props {
  mode: ThemeMode;
  children: ReactNode;
}

export function ThemeProvider({ mode, children }: Props) {
  const systemScheme = useColorScheme();

  const scheme: ResolvedScheme =
    mode === 'system'
      ? systemScheme === 'dark' ? 'dark' : 'light'
      : mode;

  return (
    <ThemeContext.Provider value={{ scheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeScheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
