export type RootStackParamList = {
  HomeTabs: undefined;
  // Safety
  ScamAlerts: undefined;
  SafeZones: undefined;
  ReportIncident: undefined;
  CountrySafety: { countryName?: string };
  CountryDetails: { countryId: string };
  LocalLaws: { countryName?: string };
  LiveAlerts: undefined;
  // Emergency
  Emergency: undefined;
  EmergencyMedicalCard: undefined;
  // Trips
  TripDetails: { tripId: string };
  // Travel tools
  CurrencyConverter: undefined;
  Documents: undefined;
  PackingList: undefined;
  // Social
  Friends: undefined;
  Groups: undefined;
  GroupDetails: { groupId: string };
  LocationSharing: undefined;
  // Places / Map
  NearestHospital: undefined;
  TouristSpots: undefined;
  Places: { category: string };
  // Misc
  Widgets: undefined;
  ESim: undefined;
  Insurance: undefined;
  HealthGuide: undefined;
  LocalApps: undefined;
  Weather: undefined;
  Chat: { groupId: string };
  Expenses: undefined;
  GlobalSearch: undefined;
  Onboarding: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Guides: undefined;
  Map: undefined;
  MyTrips: undefined;
  Settings: undefined;
};
