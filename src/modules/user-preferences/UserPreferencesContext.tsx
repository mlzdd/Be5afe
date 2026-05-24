import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserPreferences, Currency, ThemeMode } from './types';
import { DEFAULT_PREFERENCES } from './types';

const STORAGE_KEY = '@be5afe_user_preferences';

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  isLoaded: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setDisplayCurrency: (currency: Currency) => void;
  setDefaultLocation: (countryId: string | null, cityId: string | null) => void;
  setNotifications: (notifications: UserPreferences['notifications']) => void;
  setLocale: (locale: string) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function UserPreferencesProvider({ children }: Props) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<UserPreferences>;
          setPreferences({ ...DEFAULT_PREFERENCES, ...saved });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setPreferences((prev) => {
      const next = { ...prev, themeMode: mode };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setDisplayCurrency = useCallback((currency: Currency) => {
    setPreferences((prev) => {
      const next = { ...prev, displayCurrency: currency };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setDefaultLocation = useCallback((countryId: string | null, cityId: string | null) => {
    setPreferences((prev) => {
      const next = { ...prev, defaultCountryId: countryId, defaultCityId: cityId };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setNotifications = useCallback((notifications: UserPreferences['notifications']) => {
    setPreferences((prev) => {
      const next = { ...prev, notifications };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setLocale = useCallback((locale: string) => {
    setPreferences((prev) => {
      const next = { ...prev, locale };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoaded,
        setThemeMode,
        setDisplayCurrency,
        setDefaultLocation,
        setNotifications,
        setLocale,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextValue {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  return ctx;
}
