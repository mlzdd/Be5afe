import React, { ReactNode, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Shared
import { ThemeProvider } from '@shared/theme';
import { useAuth, AuthProvider } from '@modules/auth/AuthContext';
import { UserPreferencesProvider, useUserPreferences } from '@modules/user-preferences/UserPreferencesContext';
import { LocationProvider, useLocation } from '@modules/maps';
import { getCityById, getCountryById } from '@modules/regional-data';
import { useUserProfile } from '@modules/user-profile';

// Hooks
import { useTrips } from '@products/bsafe/trips/useTrips';
import { useEmergency } from '@products/bsafe/emergency/useEmergency';
import { useFriends } from '@modules/social/useFriends';
import { useGroups } from '@modules/social/useGroups';
import { useLocationSharing } from '@modules/social/useLocationSharing';
import { useWidgets } from '@products/bsafe/widgets/useWidgets';
import { useDocuments } from '@products/bsafe/travel-tools/useDocuments';
import { usePackingList } from '@products/bsafe/travel-tools/usePackingList';
import { useMedicalCard } from '@products/bsafe/travel-tools/useMedicalCard';
import { useAlerts } from '@products/bsafe/alerts/useAlerts';
import { useScamReports } from '@products/bsafe/scam-reports/useScamReports';

// Infra
import { FirebaseAuthRepository } from '@infra/auth/firebase/FirebaseAuthRepository';
import { FirestoreTripsRepository } from '@infra/trips/firestore/FirestoreTripsRepository';
import { AsyncStorageEmergencyRepository } from '@infra/emergency/asyncstorage/AsyncStorageEmergencyRepository';
import { FirestoreFriendsRepository, FirestoreGroupsRepository, FirestoreLocationSharingRepository } from '@infra/social/firestore';
import { ExpoLocationService } from '@infra/location/expo/ExpoLocationService';
import { HybridLocationRepository } from '@infra/location/HybridLocationRepository';
import { HybridUserProfileRepository } from '@infra/profile/HybridUserProfileRepository';
import { FirestoreAlertRepository, FirestoreScamReportRepository } from '@infra/realtime/firestore';
import { HybridMedicalCardRepository, HybridPackingListRepository } from '@infra/travel-tools';

// Infra — sync
import { runContentSync } from '@infra/sync/ContentSyncService';

// App
import { AppContextProvider, type AppContextValue } from './AppContext';
import { ErrorBoundary } from './ErrorBoundary';

// Singletons — created once at module load
const authRepo = new FirebaseAuthRepository();
const tripsRepo = new FirestoreTripsRepository();
const emergencyRepo = new AsyncStorageEmergencyRepository();
const friendsRepo = new FirestoreFriendsRepository();
const groupsRepo = new FirestoreGroupsRepository();
const locationSharingRepo = new FirestoreLocationSharingRepository();
const locationRepo = new HybridLocationRepository();
const userProfileRepo = new HybridUserProfileRepository();
const gpsService = new ExpoLocationService();
const alertsRepo = new FirestoreAlertRepository();
const scamReportsRepo = new FirestoreScamReportRepository();
const packingRepo = new HybridPackingListRepository();
const medicalCardRepo = new HybridMedicalCardRepository();

function InnerProviders({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth();
  const { preferences } = useUserPreferences();
  const selectedLocation = useLocation();

  const user = session.kind === 'authenticated' ? session.user : null;
  const selectedCountry = selectedLocation.location ? getCountryById(selectedLocation.location.countryId) : undefined;
  const selectedCity = selectedLocation.location ? getCityById(selectedLocation.location.cityId) : undefined;

  const trips = useTrips(tripsRepo, user);
  const emergency = useEmergency(emergencyRepo, user);
  const friends = useFriends(friendsRepo, user);
  const groups = useGroups(groupsRepo, user);
  const locationSharing = useLocationSharing(locationSharingRepo, gpsService, user?.uid ?? null);
  const widgets = useWidgets();
  const docs = useDocuments();
  const packing = usePackingList(packingRepo, user);
  const medicalCard = useMedicalCard(medicalCardRepo, user);
  const alerts = useAlerts(alertsRepo);
  const scamReports = useScamReports(scamReportsRepo, user);
  const userProfile = useUserProfile(userProfileRepo, user);

  useEffect(() => {
    void runContentSync();
  }, []);

  const ctx: AppContextValue = {
    auth: { user, signOut },
    userProfile,
    location: {
      selectedCountryId: selectedCountry?.id ?? null,
      selectedCountryName: selectedCountry?.name ?? null,
      selectedCityId: selectedCity?.id ?? null,
      selectedCityName: selectedCity?.name ?? null,
    },
    trips,
    emergency,
    friends,
    groups,
    widgets,
    locationSharing,
    alerts,
    scamReports,
    travelTools: {
      documents: docs.documents,
      addDocument: docs.addDocument,
      updateDocument: docs.updateDocument,
      deleteDocument: docs.deleteDocument,
      getDocument: docs.getDocument,
      getDocumentsByType: docs.getDocumentsByType,
      items: packing.items,
      addItem: packing.addItem,
      updateItem: packing.updateItem,
      deleteItem: packing.deleteItem,
      togglePacked: packing.togglePacked,
      addItemsFromTemplate: packing.addItemsFromTemplate,
      clearAllItems: packing.clearAllItems,
      getProgress: packing.getProgress,
      getItemsByCategory: packing.getItemsByCategory,
      medicalCard: medicalCard.card,
      isMedicalCardLoading: medicalCard.isLoading,
      saveMedicalCard: medicalCard.saveCard,
    },
  };

  return (
    <ThemeProvider mode={preferences.themeMode}>
      <AppContextProvider value={ctx}>
        {children}
      </AppContextProvider>
    </ThemeProvider>
  );
}

function LocationScopedProviders({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { preferences } = useUserPreferences();
  const userId = session.kind === 'authenticated' ? session.user.uid : 'guest';

  return (
    <LocationProvider
      repository={locationRepo}
      gpsService={gpsService}
      userId={userId}
      defaultLocation={{
        countryId: preferences.defaultCountryId,
        cityId: preferences.defaultCityId,
      }}
    >
      {children}
    </LocationProvider>
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider repository={authRepo}>
            <UserPreferencesProvider>
              <LocationScopedProviders>
                <InnerProviders>
                  {children}
                </InnerProviders>
              </LocationScopedProviders>
            </UserPreferencesProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
