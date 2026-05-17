import {
  getCountryById,
  getCountryByIso2,
  getCountryByName,
  getAllCountries,
  getCitiesForCountry,
  getCityById,
  searchCountries,
  searchCities,
} from '../lookup';
import type { CountryId, CityId } from '../types';

describe('regional-data lookup', () => {
  describe('countries', () => {
    it('returns all countries', () => {
      const all = getAllCountries();
      expect(all.length).toBeGreaterThan(100);
    });

    it('looks up France by id', () => {
      const fr = getCountryById('fr' as CountryId);
      expect(fr).toBeDefined();
      expect(fr!.name).toBe('France');
      expect(fr!.iso2).toBe('FR');
      expect(fr!.dialCode).toBe('+33');
      expect(fr!.flag).toBe('🇫🇷');
    });

    it('looks up by ISO2 (case-insensitive)', () => {
      expect(getCountryByIso2('JP')?.name).toBe('Japan');
      expect(getCountryByIso2('jp')?.name).toBe('Japan');
    });

    it('looks up by display name (case-insensitive)', () => {
      expect(getCountryByName('United Kingdom')?.iso2).toBe('GB');
      expect(getCountryByName('united kingdom')?.iso2).toBe('GB');
    });

    it('returns undefined for unknown id', () => {
      expect(getCountryById('xx' as CountryId)).toBeUndefined();
    });

    it('every country has a unique id equal to lowercase iso2', () => {
      const all = getAllCountries();
      const ids = all.map((c) => c.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(all.length);
      all.forEach((c) => expect(c.id).toBe(c.iso2.toLowerCase()));
    });
  });

  describe('cities', () => {
    it('returns cities for a country', () => {
      const cities = getCitiesForCountry('fr' as CountryId);
      expect(cities.length).toBeGreaterThan(3);
      const names = cities.map((c) => c.name);
      expect(names).toContain('Paris');
    });

    it('returns empty array for unknown country', () => {
      expect(getCitiesForCountry('xx' as CountryId)).toEqual([]);
    });

    it('city ids are namespaced with country iso2', () => {
      const cities = getCitiesForCountry('fr' as CountryId);
      cities.forEach((c) => expect(c.id.startsWith('fr-')).toBe(true));
    });

    it('looks up Paris by id', () => {
      const paris = getCityById('fr-paris' as CityId);
      expect(paris).toBeDefined();
      expect(paris!.name).toBe('Paris');
      expect(paris!.coordinates).toBeDefined();
      expect(paris!.coordinates!.lat).toBeCloseTo(48.8, 0);
    });

    it('city countryId matches parent country id', () => {
      const cities = getCitiesForCountry('jp' as CountryId);
      cities.forEach((c) => expect(c.countryId).toBe('jp'));
    });
  });

  describe('search', () => {
    it('filters countries by partial name', () => {
      const results = searchCountries('aust');
      const names = results.map((c) => c.name);
      expect(names).toContain('Australia');
      expect(names).toContain('Austria');
    });

    it('returns all countries for empty query', () => {
      expect(searchCountries('').length).toBe(getAllCountries().length);
    });

    it('filters cities within a country', () => {
      const results = searchCities('san', 'es' as CountryId);
      expect(results.every((c) => c.countryId === 'es')).toBe(true);
      expect(results.some((c) => c.name.toLowerCase().includes('san'))).toBe(true);
    });

    it('searches cities globally when no countryId given', () => {
      const results = searchCities('london');
      expect(results.some((c) => c.name === 'London')).toBe(true);
    });
  });
});
