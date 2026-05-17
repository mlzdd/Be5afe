import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CountryId, CityId } from '@modules/regional-data';
import { getCountryByIso2, getCityById, getCitiesForCountry, getCountryById } from '@modules/regional-data';
import type { LocationRepository } from '@shared/contracts/LocationRepository';
import type { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';
import type { ResolvedLocation } from './types';

interface LocationContextValue {
  location: ResolvedLocation | null;
  isLoading: boolean;
  setLocation: (countryId: CountryId, cityId: CityId) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

interface Props {
  repository: LocationRepository;
  gpsService: ExpoLocationService;
  userId: string | null;
  children: ReactNode;
}

export function LocationProvider({ repository, gpsService, userId, children }: Props) {
  const [location, setLocationState] = useState<ResolvedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        // 1. Try saved preference
        const saved = await repository.load(userId);
        if (saved && !cancelled) {
          const resolved = resolveLocation(saved.countryId as CountryId, saved.cityId as CityId);
          if (resolved) { setLocationState(resolved); setIsLoading(false); return; }
        }

        // 2. Try GPS detection
        const coords = await gpsService.getCurrentPosition();
        if (coords && !cancelled) {
          const geocoded = await gpsService.reverseGeocode(coords);
          if (geocoded?.isoCountryCode) {
            const country = getCountryByIso2(geocoded.isoCountryCode);
            if (country) {
              const cities = getCitiesForCountry(country.id);
              const city = geocoded.city
                ? cities.find((c) => c.name.toLowerCase() === geocoded.city!.toLowerCase())
                : cities[0];

              if (city && !cancelled) {
                const resolved: ResolvedLocation = { countryId: country.id, cityId: city.id, coordinates: coords };
                setLocationState(resolved);
                await repository.save(userId, { countryId: country.id, cityId: city.id });
                setIsLoading(false);
                return;
              }
            }
          }
        }
      } catch {
        // fall through to default
      }

      if (!cancelled) setIsLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [userId, repository, gpsService]);

  const setLocation = useCallback((countryId: CountryId, cityId: CityId) => {
    const resolved = resolveLocation(countryId, cityId);
    if (!resolved) return;
    setLocationState(resolved);
    if (userId) repository.save(userId, { countryId, cityId }).catch(() => {});
  }, [userId, repository]);

  return (
    <LocationContext.Provider value={{ location, isLoading, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}

function resolveLocation(countryId: CountryId, cityId: CityId): ResolvedLocation | null {
  const country = getCountryById(countryId);
  const city = getCityById(cityId);
  if (!country || !city?.coordinates) return null;
  return { countryId, cityId, coordinates: city.coordinates };
}
