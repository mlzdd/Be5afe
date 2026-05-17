import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

const NO_HEADER = { headerShown: false } as const;

export function RootNavigator() {
  const { session } = useAuth();
  // Tracks whether the user has passed through the login screen this session
  const [authed, setAuthed] = useState(false);

  // If Firebase restores an existing session, skip the login screen
  useEffect(() => {
    if (session.kind === 'authenticated') setAuthed(true);
  }, [session.kind]);

  if (session.kind === 'loading') {
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
      <Stack.Navigator screenOptions={NO_HEADER}>
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
        <Stack.Screen name="LocationSharing">
          {(props) => <PlaceholderScreen {...props} title="Location Sharing" />}
        </Stack.Screen>
        <Stack.Screen name="NearestHospital" component={NearestHospitalScreen} />
        <Stack.Screen name="TouristSpots">
          {(props) => <PlaceholderScreen {...props} title="Tourist Spots" />}
        </Stack.Screen>
        <Stack.Screen name="Places">
          {(props) => <PlaceholderScreen {...props} title="Places" />}
        </Stack.Screen>
        <Stack.Screen name="Widgets" component={WidgetsScreen} />
        <Stack.Screen name="ESim">
          {(props) => <PlaceholderScreen {...props} title="eSIM" />}
        </Stack.Screen>
        <Stack.Screen name="Insurance">
          {(props) => <PlaceholderScreen {...props} title="Insurance" />}
        </Stack.Screen>
        <Stack.Screen name="HealthGuide" component={HealthGuideScreen} />
        <Stack.Screen name="LocalApps" component={LocalAppsScreen} />
        <Stack.Screen name="Weather" component={WeatherScreen} />
        <Stack.Screen name="Chat" component={ChatAppScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
