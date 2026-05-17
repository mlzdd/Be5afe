import type { OfficialEmergencyNumberVerification } from './emergency-number-types';

/**
 * Launch-priority countries manually cross-checked against ITU-T E.129.
 *
 * The seed script treats this file as the explicit human verification pass:
 * Wikidata provides broad seed coverage, but only records represented here
 * are eligible for `confidence: 'high'` publication.
 */
export const ITU_VERIFIED_TOP_40: OfficialEmergencyNumberVerification[] = [
  { countryId: 'US', countryName: 'United States', police: '911', ambulance: '911', fire: '911' },
  { countryId: 'GB', countryName: 'United Kingdom', police: '999', ambulance: '999', fire: '999' },
  { countryId: 'FR', countryName: 'France', police: '17', ambulance: '15', fire: '18' },
  { countryId: 'ES', countryName: 'Spain', police: '091', ambulance: '061', fire: '080' },
  { countryId: 'IT', countryName: 'Italy', police: '113', ambulance: '118', fire: '115' },
  { countryId: 'DE', countryName: 'Germany', police: '110', ambulance: '112', fire: '112' },
  { countryId: 'TR', countryName: 'Turkey', police: '155', ambulance: '112', fire: '110' },
  { countryId: 'TH', countryName: 'Thailand', police: '191', ambulance: '1669', fire: '199' },
  { countryId: 'JP', countryName: 'Japan', police: '110', ambulance: '119', fire: '119' },
  { countryId: 'SG', countryName: 'Singapore', police: '999', ambulance: '995', fire: '995' },
  { countryId: 'MY', countryName: 'Malaysia', police: '999', ambulance: '999', fire: '994' },
  { countryId: 'ID', countryName: 'Indonesia', police: '110', ambulance: '118', fire: '113' },
  { countryId: 'AU', countryName: 'Australia', police: '000', ambulance: '000', fire: '000' },
  { countryId: 'NZ', countryName: 'New Zealand', police: '111', ambulance: '111', fire: '111' },
  { countryId: 'CA', countryName: 'Canada', police: '911', ambulance: '911', fire: '911' },
  { countryId: 'MX', countryName: 'Mexico', police: '911', ambulance: '911', fire: '911' },
  { countryId: 'BR', countryName: 'Brazil', police: '190', ambulance: '192', fire: '193' },
  { countryId: 'AR', countryName: 'Argentina', police: '911', ambulance: '107', fire: '100' },
  { countryId: 'NL', countryName: 'Netherlands', police: '112', ambulance: '112', fire: '112' },
  { countryId: 'BE', countryName: 'Belgium', police: '101', ambulance: '100', fire: '100' },
  { countryId: 'CH', countryName: 'Switzerland', police: '117', ambulance: '144', fire: '118' },
  { countryId: 'AT', countryName: 'Austria', police: '133', ambulance: '144', fire: '122' },
  { countryId: 'PT', countryName: 'Portugal', police: '112', ambulance: '112', fire: '112' },
  { countryId: 'GR', countryName: 'Greece', police: '100', ambulance: '166', fire: '199' },
  { countryId: 'IE', countryName: 'Ireland', police: '999', ambulance: '999', fire: '999' },
  { countryId: 'AE', countryName: 'UAE', police: '999', ambulance: '998', fire: '997' },
  { countryId: 'IN', countryName: 'India', police: '100', ambulance: '108', fire: '101' },
  { countryId: 'CN', countryName: 'China', police: '110', ambulance: '120', fire: '119' },
  { countryId: 'KR', countryName: 'South Korea', police: '112', ambulance: '119', fire: '119' },
  { countryId: 'SA', countryName: 'Saudi Arabia', police: '999', ambulance: '997', fire: '998' },
  { countryId: 'QA', countryName: 'Qatar', police: '999', ambulance: '999', fire: '999' },
  { countryId: 'EG', countryName: 'Egypt', police: '122', ambulance: '123', fire: '180' },
  { countryId: 'ZA', countryName: 'South Africa', police: '10111', ambulance: '10177', fire: '10177' },
  { countryId: 'MA', countryName: 'Morocco', police: '19', ambulance: '15', fire: '15' },
  { countryId: 'VN', countryName: 'Vietnam', police: '113', ambulance: '115', fire: '114' },
  { countryId: 'PH', countryName: 'Philippines', police: '117', ambulance: '911', fire: '911' },
  { countryId: 'PL', countryName: 'Poland', police: '997', ambulance: '999', fire: '998' },
  { countryId: 'SE', countryName: 'Sweden', police: '112', ambulance: '112', fire: '112' },
  { countryId: 'NO', countryName: 'Norway', police: '112', ambulance: '113', fire: '110' },
  { countryId: 'DK', countryName: 'Denmark', police: '114', ambulance: '112', fire: '112' },
];
