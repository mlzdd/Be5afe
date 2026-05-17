export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: 'Family' | 'Friend' | 'Embassy' | 'Hotel' | 'Other';
  createdAt: string;
}

export interface CountryEmergencyNumbers {
  countryCode: string;
  countryName: string;
  police: string;
  ambulance: string;
  fire: string;
  touristPolice?: string | null;
  coastGuard?: string | null;
}
