import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';
import type { LatLng } from '@shared/contracts/PlacesClient';
import { regionFromCoords } from '@modules/maps/types';

interface MiniMapProps {
  coordinate: LatLng | null;
  label: string;
  onPress: () => void;
}

export function MiniMap({ coordinate, label, onPress }: MiniMapProps) {
  const colors = useTheme();
  const region = useMemo(
    () => coordinate ? regionFromCoords(coordinate, 0.06) : null,
    [coordinate],
  );

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.wrapper}>
      {region ? (
        <MapView
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          region={region}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          toolbarEnabled={false}
          pointerEvents="none"
        >
          <Marker coordinate={{ latitude: coordinate!.lat, longitude: coordinate!.lng }} />
        </MapView>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="map-outline" size={34} color={colors.textTertiary} />
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>Select a location</Text>
        </View>
      )}
      <View style={styles.overlay}>
        <View style={[styles.label, { backgroundColor: colors.card }]}>
          <Ionicons name="location" size={14} color={colors.brandDark} />
          <Text numberOfLines={1} style={[styles.labelText, { color: colors.textPrimary }]}>
            {label}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.xl,
    height: 160,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  placeholderText: {
    ...typography.bodySmall,
  },
  overlay: {
    bottom: spacing.sm,
    left: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
  },
  label: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    flexDirection: 'row',
    gap: spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  labelText: {
    ...typography.caption,
    flexShrink: 1,
  },
});
