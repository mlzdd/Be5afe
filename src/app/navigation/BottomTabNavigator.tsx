import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabParamList } from './types';
import { colors } from '@shared/theme';

// Tab screens — imported from products/bsafe
import { HomeScreen } from '../screens/HomeScreen';
import { GuidesScreen } from '../screens/GuidesScreen';
import { MapScreen } from '../screens/MapScreen';
import { TripsScreen } from '../screens/TripsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type TabIconKey = keyof BottomTabParamList;

const TAB_ICONS: Record<TabIconKey, string> = {
  Home: 'earth',
  Guides: 'book',
  Map: 'map',
  MyTrips: 'airplane',
  Settings: 'person',
};

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentLight,
        tabBarInactiveTintColor: colors.textInverse,
        tabBarStyle: {
          backgroundColor: colors.brandDark,
          borderTopWidth: 0,
          height: 70,
          overflow: 'visible',
        },
        tabBarLabel: ({ focused, color }) => {
          if (focused) return null;
          const labels: Record<string, string> = {
            Home: 'Home', Guides: 'Guides', Map: 'Map', MyTrips: 'My Trips', Settings: 'Settings',
          };
          return <Text style={{ color, fontSize: 12 }}>{labels[route.name] ?? ''}</Text>;
        },
        tabBarIcon: ({ color, focused }) => {
          const iconName = TAB_ICONS[route.name as TabIconKey] ?? 'ellipse';
          if (focused) {
            return (
              <View style={styles.bumpWrapper}>
                <View style={styles.bumpCircle}>
                  <Ionicons name={iconName as never} size={35} color={colors.accentDark} />
                </View>
              </View>
            );
          }
          return <Ionicons name={iconName as never} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Guides" component={GuidesScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="MyTrips" component={TripsScreen} />
      <Tab.Screen name="Settings" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bumpWrapper: {
    position: 'absolute',
    top: -15,
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bumpCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 5,
    borderColor: colors.brandDark,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
