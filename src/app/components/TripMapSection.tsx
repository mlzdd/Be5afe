import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import type { LatLng } from '@shared/contracts/PlacesClient';
import type { Activity, Trip } from '@products/bsafe/trips/types';

interface TripMapSectionProps {
  trip: Trip;
}

interface Pin {
  id: string;
  title: string;
  coordinate: LatLng;
}

export function TripMapSection({ trip }: TripMapSectionProps) {
  const colors = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'day' | 'full'>('day');
  const pins = useMemo(() => {
    const days = mode === 'day' ? trip.itinerary.slice(0, 1) : trip.itinerary;
    return days.flatMap((day) => day.activities.flatMap(activityToPins));
  }, [mode, trip.itinerary]);

  if (pins.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="map-outline" size={28} color={colors.textTertiary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Add activity locations to map this trip</Text>
      </View>
    );
  }

  const region = regionForPins(pins);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          onPress={() => setMode('day')}
          style={[styles.segment, mode === 'day' && { backgroundColor: colors.brandDark }]}
        >
          <Text style={[styles.segmentText, { color: mode === 'day' ? colors.textInverse : colors.textSecondary }]}>Day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('full')}
          style={[styles.segment, mode === 'full' && { backgroundColor: colors.brandDark }]}
        >
          <Text style={[styles.segmentText, { color: mode === 'full' ? colors.textInverse : colors.textSecondary }]}>Full trip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setExpanded((value) => !value)} style={styles.expandButton}>
          <Ionicons name={expanded ? 'contract' : 'expand'} size={16} color={colors.brandDark} />
        </TouchableOpacity>
      </View>
      <MapView
        style={[styles.map, { height: expanded ? 340 : 200 }]}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.coordinate.lat, longitude: pin.coordinate.lng }}
            title={pin.title}
          />
        ))}
        {pins.length > 1 ? (
          <Polyline
            coordinates={pins.map((pin) => ({ latitude: pin.coordinate.lat, longitude: pin.coordinate.lng }))}
            strokeColor={colors.brandDark}
            strokeWidth={3}
          />
        ) : null}
      </MapView>
    </View>
  );
}

function activityToPins(activity: Activity): Pin[] {
  const pins: Pin[] = [];
  if (activity.locationCoordinates) {
    pins.push({ id: `${activity.id}-location`, title: activity.title, coordinate: activity.locationCoordinates });
  }
  if (activity.originLocation) {
    pins.push({ id: `${activity.id}-origin`, title: activity.origin ?? `${activity.title} origin`, coordinate: activity.originLocation });
  }
  if (activity.destinationLocation) {
    pins.push({ id: `${activity.id}-destination`, title: activity.destination ?? `${activity.title} destination`, coordinate: activity.destinationLocation });
  }
  return pins;
}

function regionForPins(pins: Pin[]) {
  const latitudes = pins.map((pin) => pin.coordinate.lat);
  const longitudes = pins.map((pin) => pin.coordinate.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.03, (maxLat - minLat) * 1.6),
    longitudeDelta: Math.max(0.03, (maxLng - minLng) * 1.6),
  };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    margin: spacing.base,
    overflow: 'hidden',
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  segment: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  segmentText: {
    ...typography.caption,
    fontWeight: '600',
  },
  expandButton: {
    marginLeft: 'auto',
    padding: spacing.xs,
  },
  map: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    borderRadius: radius.lg,
    gap: spacing.xs,
    margin: spacing.base,
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
