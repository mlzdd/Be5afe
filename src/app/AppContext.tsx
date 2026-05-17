import React, { createContext, useContext, ReactNode } from 'react';
import type { AuthUser } from '@shared/contracts/AuthRepository';
import type { useTrips } from '@products/bsafe/trips/useTrips';
import type { useEmergency } from '@products/bsafe/emergency/useEmergency';
import type { useFriends } from '@modules/social/useFriends';
import type { useGroups } from '@modules/social/useGroups';
import type { useWidgets } from '@products/bsafe/widgets/useWidgets';
import type { useDocuments } from '@products/bsafe/travel-tools/useDocuments';
import type { usePackingList } from '@products/bsafe/travel-tools/usePackingList';
import type { useLocationSharing } from '@modules/social/useLocationSharing';

type TripsState = ReturnType<typeof useTrips>;
type EmergencyState = ReturnType<typeof useEmergency>;
type FriendsState = ReturnType<typeof useFriends>;
type GroupsState = ReturnType<typeof useGroups>;
type WidgetsState = ReturnType<typeof useWidgets>;
type DocumentsState = ReturnType<typeof useDocuments>;
type PackingListState = ReturnType<typeof usePackingList>;
type LocationSharingState = ReturnType<typeof useLocationSharing>;

export interface TravelToolsContext {
  documents: DocumentsState['documents'];
  addDocument: DocumentsState['addDocument'];
  updateDocument: DocumentsState['updateDocument'];
  deleteDocument: DocumentsState['deleteDocument'];
  getDocument: DocumentsState['getDocument'];
  getDocumentsByType: DocumentsState['getDocumentsByType'];
  items: PackingListState['items'];
  addItem: PackingListState['addItem'];
  updateItem: PackingListState['updateItem'];
  deleteItem: PackingListState['deleteItem'];
  togglePacked: PackingListState['togglePacked'];
  addItemsFromTemplate: PackingListState['addItemsFromTemplate'];
  clearAllItems: PackingListState['clearAllItems'];
  getProgress: PackingListState['getProgress'];
  getItemsByCategory: PackingListState['getItemsByCategory'];
}

// Minimal auth surface exposed to screens
export interface AppAuthContext {
  user: AuthUser | null;
  signOut(): Promise<void>;
}

// Location context exposed to screens
export interface AppLocationContext {
  selectedCountryName: string | null;
  selectedCityName: string | null;
}

export interface AppContextValue {
  auth: AppAuthContext;
  location: AppLocationContext;
  trips: TripsState;
  emergency: EmergencyState;
  friends: FriendsState;
  groups: GroupsState;
  widgets: WidgetsState;
  travelTools: TravelToolsContext;
  locationSharing: LocationSharingState;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppContextProvider({ value, children }: { value: AppContextValue; children: ReactNode }) {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContextProvider');
  return ctx;
}
