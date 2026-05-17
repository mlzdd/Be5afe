import type { PlacesClient, Place, PlaceCategory, LatLng, PlacesSearchOptions } from '../../../shared/contracts/PlacesClient';

const MOCK_NAMES: Record<PlaceCategory, string[]> = {
  hospital:      ['City General Hospital', 'St. Mary\'s Medical Centre'],
  pharmacy:      ['Central Pharmacy', 'MedPlus Chemist'],
  doctor:        ['Dr. Smith Clinic', 'Family Health Centre'],
  airport:       ['International Airport', 'Regional Airport'],
  train_station: ['Central Station', 'North Station'],
  bus_station:   ['Main Bus Terminal', 'South Bus Stop'],
  restaurant:    ['The Local Kitchen', 'Traveller\'s Bistro'],
  cafe:          ['Corner Café', 'The Daily Grind'],
  atm:           ['ATM (Visa/MC)', 'Airport ATM'],
  bank:          ['National Bank', 'Traveller\'s Bank'],
  police:        ['Central Police Station', 'Tourist Police Post'],
  gas_station:   ['Shell Station', 'BP Fuel Stop'],
  embassy:       ['Australian Embassy', 'British Consulate'],
};

export class MockPlacesClient implements PlacesClient {
  async searchNearby(
    center: LatLng,
    category: PlaceCategory,
    options: PlacesSearchOptions = {},
  ): Promise<Place[]> {
    await new Promise((r) => setTimeout(r, 300));
    const names = MOCK_NAMES[category];
    const limit = options.limit ?? 2;
    return names.slice(0, limit).map((name, i) => ({
      id: `mock-${category}-${i}`,
      name,
      category,
      location: {
        lat: center.lat + (i + 1) * 0.002,
        lng: center.lng + (i + 1) * 0.002,
      },
      address: `${100 + i * 10} Main St`,
      distanceMeters: (i + 1) * 400,
      rating: 4.0 + i * 0.2,
      isOpen: true,
    }));
  }
}
