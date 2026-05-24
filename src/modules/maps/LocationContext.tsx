import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { CountryId, CityId } from '@modules/regional-data';
import { getAllCountries, getCountryByIso2, getCityById, getCitiesForCountry, getCountryById } from '@modules/regional-data';
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
  defaultLocation?: { countryId: string | null; cityId: string | null };
  children: ReactNode;
}

export function LocationProvider({ repository, gpsService, userId, defaultLocation, children }: Props) {
  const [location, setLocationState] = useState<ResolvedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      try {
        // 1. Try saved preference
        const saved = userId ? await repository.load(userId) : null;
        if (saved && !cancelled) {
          const resolved = resolveLocation(saved.countryId as CountryId, saved.cityId as CityId);
          if (resolved) { setLocationState(resolved); setIsLoading(false); return; }
        }

        // 2. Try user default preference
        if (defaultLocation?.countryId && defaultLocation.cityId && !cancelled) {
          const resolved = resolveLocation(defaultLocation.countryId as CountryId, defaultLocation.cityId as CityId);
          if (resolved) { setLocationState(resolved); setIsLoading(false); return; }
        }

        // 3. Try GPS detection
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
                if (userId) {
                  await repository.save(userId, { countryId: country.id, cityId: city.id });
                }
                setIsLoading(false);
                return;
              }
            }
          }
        }
      } catch {
        // fall through to default
      }

      if (!cancelled) {
        setLocationState(getDefaultLocation());
        setIsLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [userId, repository, gpsService, defaultLocation?.countryId, defaultLocation?.cityId]);

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
  if (!country || !city) return null;
  return {
    countryId,
    cityId,
    coordinates: city.coordinates ?? getCountryFallbackCoordinates(countryId),
  };
}

function getCountryFallbackCoordinates(countryId: CountryId) {
  const city = getCitiesForCountry(countryId).find((item) => item.coordinates);
  return city?.coordinates ?? getDefaultLocation().coordinates;
}

function getDefaultLocation(): ResolvedLocation {
  for (const country of getAllCountries()) {
    const city = getCitiesForCountry(country.id).find((item) => item.coordinates);
    if (city?.coordinates) {
      return { countryId: country.id, cityId: city.id, coordinates: city.coordinates };
    }
  }

  return {
    countryId: 'gb' as CountryId,
    cityId: 'gb-london' as CityId,
    coordinates: { lat: 51.5074, lng: -0.1278 },
  };
}
