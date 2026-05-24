import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { useAuth } from '@modules/auth/AuthContext';
import { LoginScreen } from '@modules/auth/LoginScreen';
import { colors } from '@shared/theme';

// Screens pushed onto the root stack (full-screen, headerShown: false throughout)
import { EmergencyScreen } from '../screens/EmergencyScreen';
import { ScamAlertsScreen } from '../screens/ScamAlertsScreen';
import { SafeZonesScreen } from '../screens/SafeZonesScreen';
import { LiveAlertsScreen } from '../screens/LiveAlertsScreen';
import { TripDetailsScreen } from '../screens/TripDetailsScreen';
import { FriendsScreen } from '../screens/FriendsScreen';
import { GroupsScreen } from '../screens/GroupsScreen';
import { GroupDetailsScreen } from '../screens/GroupDetailsScreen';
import { WidgetsScreen } from '../screens/WidgetsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { PackingListScreen } from '../screens/PackingListScreen';
import { CurrencyConverterScreen } from '../screens/CurrencyConverterScreen';
import { ChatAppScreen } from '../screens/ChatAppScreen';
import { CountrySafetyScreen } from '../screens/CountrySafetyScreen';
import { CountryDetailsScreen } from '../screens/CountryDetailsScreen';
import { LocalLawsScreen } from '../screens/LocalLawsScreen';
import { EmergencyMedicalCardScreen } from '../screens/EmergencyMedicalCardScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { NearestHospitalScreen } from '../screens/NearestHospitalScreen';
import { WeatherScreen } from '../screens/WeatherScreen';
import { HealthGuideScreen } from '../screens/HealthGuideScreen';
import { LocalAppsScreen } from '../screens/LocalAppsScreen';
import { ReportIncidentScreen } from '../screens/ReportIncidentScreen';
import { LocationSharingScreen } from '../screens/LocationSharingScreen';
import { TouristSpotsScreen } from '../screens/TouristSpotsScreen';
import { ESimScreen } from '../screens/ESimScreen';
import { InsuranceScreen } from '../screens/InsuranceScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { GlobalSearchScreen } from '../screens/GlobalSearchScreen';
import { OnboardingScreen, ONBOARDED_KEY } from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const NO_HEADER = { headerShown: false } as const;

export function RootNavigator() {
  const { session } = useAuth();
  const [authed, setAuthed] = useState(false);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // If Firebase restores an existing session, skip the login screen
  useEffect(() => {
    if (session.kind === 'authenticated') setAuthed(true);
  }, [session.kind]);

  // Check onboarding flag once after auth resolves
  useEffect(() => {
    if (session.kind === 'loading') return;
    AsyncStorage.getItem(ONBOARDED_KEY).then((v) => setOnboarded(v === 'true'));
  }, [session.kind]);

  if (session.kind === 'loading' || onboarded === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandDark }}>
        <ActivityIndicator size="large" color={colors.brandLight} />
      </View>
    );
  }

  if (!authed) {
    return <LoginScreen onComplete={() => setAuthed(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={NO_HEADER}
        initialRouteName={onboarded ? 'HomeTabs' : 'Onboarding'}
      >
        <Stack.Screen name="HomeTabs" component={BottomTabNavigator} />
        <Stack.Screen name="Emergency" component={EmergencyScreen} />
        <Stack.Screen name="EmergencyMedicalCard" component={EmergencyMedicalCardScreen} />
        <Stack.Screen name="ScamAlerts" component={ScamAlertsScreen} />
        <Stack.Screen name="SafeZones" component={SafeZonesScreen} />
        <Stack.Screen name="ReportIncident" component={ReportIncidentScreen} />
        <Stack.Screen name="CountrySafety" component={CountrySafetyScreen} />
        <Stack.Screen name="CountryDetails" component={CountryDetailsScreen} />
        <Stack.Screen name="LocalLaws" component={LocalLawsScreen} />
        <Stack.Screen name="LiveAlerts" component={LiveAlertsScreen} />
        <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
        <Stack.Screen name="CurrencyConverter" component={CurrencyConverterScreen} />
        <Stack.Screen name="Documents" component={DocumentsScreen} />
        <Stack.Screen name="PackingList" component={PackingListScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Groups" component={GroupsScreen} />
        <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
        <Stack.Screen name="LocationSharing" component={LocationSharingScreen} />
        <Stack.Screen name="NearestHospital" component={NearestHospitalScreen} />
        <Stack.Screen name="TouristSpots" component={TouristSpotsScreen} />
        <Stack.Screen name="Places">
          {(props) => <PlaceholderScreen {...props} title="Places" />}
        </Stack.Screen>
        <Stack.Screen name="Widgets" component={WidgetsScreen} />
        <Stack.Screen name="ESim" component={ESimScreen} />
        <Stack.Screen name="Insurance" component={InsuranceScreen} />
        <Stack.Screen name="HealthGuide" component={HealthGuideScreen} />
        <Stack.Screen name="LocalApps" component={LocalAppsScreen} />
        <Stack.Screen name="Weather" component={WeatherScreen} />
        <Stack.Screen name="Chat" component={ChatAppScreen} />
        <Stack.Screen name="Expenses" component={ExpensesScreen} />
        <Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
