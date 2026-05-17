import { ViewStyle } from 'react-native';

export const shadows = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0,    shadowRadius: 0,  elevation: 0 },
  sm:   { shadowColor: '#000',        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,  elevation: 1 },
  md:   { shadowColor: '#000',        shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,  elevation: 2 },
  lg:   { shadowColor: '#000',        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1,  shadowRadius: 8,  elevation: 4 },
  xl:   { shadowColor: '#000',        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
} as const satisfies Record<string, ViewStyle>;

export type ShadowKey = keyof typeof shadows;
