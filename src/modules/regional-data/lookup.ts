import { COUNTRIES } from './data/countries';
import { CITIES } from './data/cities';
import type { Country, City, CountryId, CityId } from './types';

// Pre-built indexes — constructed once at module load
const _byCountryId = new Map<CountryId, Country>(COUNTRIES.map((c) => [c.id, c]));
const _byIso2 = new Map<string, Country>(COUNTRIES.map((c) => [c.iso2.toLowerCase(), c]));
const _byName = new Map<string, Country>(COUNTRIES.map((c) => [c.name.toLowerCase(), c]));
const _citiesByCountry = new Map<CountryId, City[]>();
const _byCityId = new Map<CityId, City>(CITIES.map((city) => [city.id, city]));

for (const city of CITIES) {
  const list = _citiesByCountry.get(city.countryId) ?? [];
  list.push(city);
  _citiesByCountry.set(city.countryId, list);
}

export function getCountryById(id: CountryId): Country | undefined {
  return _byCountryId.get(id);
}

export function getCountryByIso2(iso2: string): Country | undefined {
  return _byIso2.get(iso2.toLowerCase());
}

export function getCountryByName(name: string): Country | undefined {
  return _byName.get(name.toLowerCase());
}

export function getAllCountries(): Country[] {
  return COUNTRIES;
}

export function getCitiesForCountry(countryId: CountryId): City[] {
  return _citiesByCountry.get(countryId) ?? [];
}

export function getCityById(id: CityId): City | undefined {
  return _byCityId.get(id);
}

export function searchCountries(query: string): Country[] {
  const q = query.toLowerCase().trim();
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().startsWith(q),
  );
}

export function searchCities(query: string, countryId?: CountryId): City[] {
  const q = query.toLowerCase().trim();
  const pool = countryId ? (getCitiesForCountry(countryId)) : CITIES;
  if (!q) return pool;
  return pool.filter((c) => c.name.toLowerCase().includes(q));
}
