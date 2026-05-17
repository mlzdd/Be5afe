// Canonical identifiers — ISO 3166-1 alpha-2 for countries, kebab-case for cities
export type CountryId = string & { readonly __brand: 'CountryId' };
export type CityId = string & { readonly __brand: 'CityId' };

export interface Country {
  id: CountryId;
  name: string;
  flag: string;
  iso2: string;       // ISO 3166-1 alpha-2, e.g. 'FR'
  dialCode: string;   // e.g. '+33'
}

export interface City {
  id: CityId;
  name: string;
  countryId: CountryId;
  coordinates?: { lat: number; lng: number };
}
