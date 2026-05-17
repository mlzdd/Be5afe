// countryId = ISO2 lowercase (e.g. 'fr'), cityId = '{iso2}-{kebab-name}' (e.g. 'fr-paris')
// Callers in modules/maps cast these to CountryId/CityId from regional-data
export interface SelectedLocation {
  countryId: string;
  cityId: string;
}

export interface LocationRepository {
  load(userId: string): Promise<SelectedLocation | null>;
  save(userId: string, location: SelectedLocation): Promise<void>;
}
