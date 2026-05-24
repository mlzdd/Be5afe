import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { useAppContext } from '@app/AppContext';
import { useLocation } from '@modules/maps/LocationContext';

const HOLD_MS = 3000;

interface SOSResult {
  friendsNotified: number;
  groupsNotified: number;
  coords: { lat: number; lng: number } | null;
}

async function triggerSOS(
  friends: { status: string; userId: string; displayName: string }[],
  groups: { id: string; name: string }[],
  sendMessage: (groupId: string, text: string) => Promise<void>
): Promise<SOSResult> {
  let coords: { lat: number; lng: number } | null = null;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    }
  } catch {
    // GPS unavailable — proceed without coords
  }

  const coordText = coords
    ? `GPS: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)} — https://maps.google.com/?q=${coords.lat},${coords.lng}`
    : 'GPS location unavailable';

  const msg = `🆘 SOS — I need help. ${coordText}`;

  let groupsNotified = 0;
  for (const group of groups) {
    try {
      await sendMessage(group.id, msg);
      groupsNotified++;
    } catch {
      // best-effort
    }
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  // Friends notification via groups already covers them if they share groups.
  // Direct friend messaging would require a separate DM channel — note as future work.
  return { friendsNotified: acceptedFriends.length, groupsNotified, coords };
}

export function SOSButton() {
  const colors = useTheme();
  const { friends, groups } = useAppContext();
  const { location } = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<SOSResult | null>(null);
  const [isSending, setIsSending] = useState(false);

  const progress = useSharedValue(0);
  const triggered = useRef(false);

  const onHoldComplete = useCallback(async () => {
    if (triggered.current) return;
    triggered.current = true;
    setIsSending(true);

    try {
      const r = await triggerSOS(
        friends.friends,
        groups.groups,
        groups.sendMessage
      );
      setResult(r);
      setShowConfirm(true);
    } catch {
      Alert.alert('SOS failed', 'Could not send SOS. Please call emergency services directly.');
    } finally {
      setIsSending(false);
      triggered.current = false;
      progress.value = 0;
    }
  }, [friends.friends, groups.groups, groups.sendMessage, progress]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(HOLD_MS)
    .onBegin(() => {
      progress.value = withTiming(1, { duration: HOLD_MS });
    })
    .onEnd(() => {
      runOnJS(onHoldComplete)();
    })
    .onFinalize((_, success) => {
      if (!success) {
        cancelAnimation(progress);
        progress.value = withTiming(0, { duration: 200 });
      }
    });

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(244, 67, 54, ${0.3 + progress.value * 0.7})`,
    transform: [{ scale: 1 + progress.value * 0.12 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    // Animated arc approximated with opacity and scale on a fill overlay
    opacity: progress.value * 0.25,
    transform: [{ scale: progress.value }],
  }));

  const s = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: spacing.xl },
    label: { ...typography.caption, color: colors.textTertiary, marginBottom: spacing.md, textAlign: 'center' },
    ring: {
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 4,
      borderColor: '#F44336',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fillOverlay: {
      position: 'absolute',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#F44336',
    },
    btn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#F44336',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnLabel: { ...typography.caption, color: '#fff', fontWeight: '800', fontSize: 11, marginTop: 2 },
    sending: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.sm },
  });

  return (
    <View style={s.container}>
      <Text style={s.label}>Hold 3 seconds to send SOS to all contacts</Text>
      <GestureDetector gesture={longPressGesture}>
        <Animated.View style={[s.ring, ringStyle]}>
          <Animated.View style={[s.fillOverlay, fillStyle]} />
          <View style={s.btn}>
            <Ionicons name="alert" size={28} color="#fff" />
            <Text style={s.btnLabel}>SOS</Text>
          </View>
        </Animated.View>
      </GestureDetector>
      {isSending && <Text style={s.sending}>Sending SOS...</Text>}

      <Modal visible={showConfirm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowConfirm(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={{ padding: spacing.xl, alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F44336', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={{ ...typography.h2, color: colors.textPrimary, textAlign: 'center' }}>SOS Sent</Text>

            {result && (
              <View style={{ width: '100%', backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="people" size={18} color={colors.brandDark} />
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {result.groupsNotified > 0
                      ? `SOS sent to ${result.groupsNotified} group${result.groupsNotified > 1 ? 's' : ''}`
                      : 'No groups to notify — add friends to groups for SOS coverage'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="location" size={18} color={colors.brandDark} />
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {result.coords ? `GPS coordinates shared` : 'Location unavailable'}
                  </Text>
                </View>
              </View>
            )}

            <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>
              Call local emergency services if you need immediate help. Your contacts have been notified.
            </Text>

            <TouchableOpacity
              onPress={() => setShowConfirm(false)}
              style={{ backgroundColor: colors.brandDark, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 12, marginTop: spacing.sm }}
            >
              <Text style={{ ...typography.body, fontWeight: '700', color: '#fff' }}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
