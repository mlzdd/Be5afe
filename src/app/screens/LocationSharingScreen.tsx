import React, { useMemo, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@shared/hooks/useTheme';
import { spacing, typography } from '@shared/theme';
import { useAppContext } from '@app/AppContext';
import { useLocation } from '@modules/maps/LocationContext';
import type { ShareDuration, LocationShare } from '@shared/contracts/SocialRepository';

const DURATION_OPTIONS: { value: ShareDuration; label: string }[] = [
  { value: '1h', label: '1 Hour' },
  { value: '3h', label: '3 Hours' },
  { value: '6h', label: '6 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '24h', label: '24 Hours' },
  { value: 'indefinite', label: 'Indefinitely' },
];

function getDurationLabel(d: ShareDuration): string {
  return DURATION_OPTIONS.find((o) => o.value === d)?.label ?? d;
}

function getExpiresLabel(share: LocationShare): string {
  if (share.duration === 'indefinite' || !share.endTime) return 'No expiry';
  const ms = new Date(share.endTime).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}

interface CreateShareModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (duration: ShareDuration) => void;
  friendCount: number;
}

function CreateShareModal({ visible, onClose, onSubmit, friendCount }: CreateShareModalProps) {
  const colors = useTheme();
  const [selected, setSelected] = useState<ShareDuration>('3h');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ ...typography.h3, color: colors.textPrimary, flex: 1, textAlign: 'center' }}>Share Location</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: 4 }}>SHARING WITH</Text>
            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
              {friendCount > 0 ? `All ${friendCount} friends` : 'No friends yet — add friends first'}
            </Text>
          </View>

          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm }}>Duration</Text>
          {DURATION_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSelected(opt.value)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: spacing.md,
                backgroundColor: selected === opt.value ? colors.brandDark : colors.card,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: selected === opt.value ? colors.brandDark : colors.border,
              }}
            >
              <Text style={{ ...typography.body, color: selected === opt.value ? '#fff' : colors.textPrimary }}>{opt.label}</Text>
              {selected === opt.value && <Ionicons name="checkmark" size={18} color="#fff" />}
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={() => { if (friendCount > 0) onSubmit(selected); }}
            disabled={friendCount === 0}
            style={{
              backgroundColor: friendCount > 0 ? colors.brandDark : colors.inputBackground,
              padding: spacing.md,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: spacing.md,
            }}
          >
            <Text style={{ ...typography.body, fontWeight: '700', color: friendCount > 0 ? '#fff' : colors.textTertiary }}>
              Start Sharing
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function LocationSharingScreen() {
  const colors = useTheme();
  const navigation = useNavigation();
  const { locationSharing, friends, auth } = useAppContext();
  const { location } = useLocation();
  const [showCreate, setShowCreate] = useState(false);

  const coords = location?.coordinates ?? { lat: 37.7749, lng: -122.4194 };
  const acceptedFriends = friends.friends.filter((f) => f.status === 'accepted');

  async function handleCreate(duration: ShareDuration) {
    if (!auth.user?.uid) {
      Alert.alert('Sign in required', 'Please sign in to share your location.');
      return;
    }
    const recipients: import('@shared/contracts/SocialRepository').ShareRecipient[] = acceptedFriends.map((f) => ({
      id: f.userId,
      name: f.displayName,
      contact: f.email,
      type: 'friend' as const,
    }));
    try {
      await locationSharing.createShare(recipients, duration);
      setShowCreate(false);
      Alert.alert(
        'Sharing started',
        `Location shared with ${recipients.length} ${recipients.length === 1 ? 'friend' : 'friends'} for ${getDurationLabel(duration).toLowerCase()}.`
      );
    } catch {
      Alert.alert('Error', 'Failed to start location sharing. Please try again.');
    }
  }

  async function handleStop(shareId: string) {
    Alert.alert('Stop sharing?', 'Your contacts will no longer see your location.', [
      {
        text: 'Stop',
        style: 'destructive',
        onPress: async () => {
          try {
            await locationSharing.stopShare(shareId);
          } catch {
            Alert.alert('Error', 'Failed to stop sharing.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleExtend(shareId: string) {
    Alert.alert('Extend sharing', 'Choose how long to extend', [
      ...DURATION_OPTIONS.map((opt) => ({
        text: opt.label,
        onPress: async () => {
          try {
            await locationSharing.extendShare(shareId, opt.value);
            Alert.alert('Extended', `Sharing extended by ${opt.label.toLowerCase()}.`);
          } catch {
            Alert.alert('Error', 'Failed to extend sharing.');
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const s = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          backgroundColor: colors.brandDark,
          gap: spacing.sm,
        },
        backBtn: { padding: 4 },
        headerTitle: { ...typography.h2, color: '#fff', flex: 1 },
        listContent: { padding: spacing.md, paddingBottom: 120 },
        locationCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        locationHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
        locationTitle: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
        map: { height: 150, borderRadius: 8, overflow: 'hidden', marginBottom: spacing.sm },
        markerDot: {
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: colors.brandDark,
          borderWidth: 2,
          borderColor: '#fff',
        },
        locationSub: { ...typography.caption, color: colors.textSecondary },
        sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
        shareCard: {
          backgroundColor: colors.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
        shareHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
        shareName: { ...typography.body, fontWeight: '600', color: colors.textPrimary },
        shareActive: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
        shareExpiry: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
        shareActions: { flexDirection: 'row', gap: spacing.sm },
        actionBtn: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.inputBackground,
        },
        actionBtnDanger: { borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.08)' },
        actionText: { ...typography.caption, fontWeight: '600', color: colors.textPrimary },
        actionTextDanger: { color: '#F44336' },
        emptyState: { alignItems: 'center', paddingVertical: 48, gap: spacing.sm },
        emptyTitle: { ...typography.h3, color: colors.textSecondary },
        emptyText: { ...typography.caption, color: colors.textTertiary, textAlign: 'center', lineHeight: 20 },
        footer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: spacing.md,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        shareBtn: {
          backgroundColor: colors.brandDark,
          paddingVertical: spacing.md,
          borderRadius: 12,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: spacing.sm,
        },
        shareBtnText: { ...typography.body, fontWeight: '700', color: '#fff' },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Location Sharing</Text>
      </View>

      <FlatList
        data={locationSharing.activeShares}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={s.locationCard}>
              <View style={s.locationHeader}>
                <Ionicons name="location" size={22} color={colors.brandDark} />
                <Text style={s.locationTitle}>Your Current Location</Text>
              </View>
              <View style={s.map}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={{ flex: 1 }}
                  region={{
                    latitude: coords.lat,
                    longitude: coords.lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker coordinate={{ latitude: coords.lat, longitude: coords.lng }}>
                    <View style={s.markerDot} />
                  </Marker>
                </MapView>
              </View>
              <Text style={s.locationSub}>Updated just now</Text>
            </View>

            <Text style={s.sectionTitle}>
              Active Shares ({locationSharing.activeShares.length})
            </Text>
          </>
        }
        renderItem={({ item }: { item: LocationShare }) => (
          <View style={s.shareCard}>
            <View style={s.shareHeader}>
              <Text style={s.shareName}>
                {item.recipients.length === 1
                  ? item.recipients[0].name
                  : `${item.recipients.length} contacts`}
              </Text>
              <View style={s.shareActive} />
            </View>
            <Text style={s.shareExpiry}>{getExpiresLabel(item)}</Text>
            <View style={s.shareActions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => handleExtend(item.id)}>
                <Ionicons name="time-outline" size={14} color={colors.textPrimary} />
                <Text style={s.actionText}>Extend</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => handleStop(item.id)}>
                <Ionicons name="stop-circle-outline" size={14} color="#F44336" />
                <Text style={[s.actionText, s.actionTextDanger]}>Stop</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="shield-outline" size={56} color={colors.textTertiary} />
            <Text style={s.emptyTitle}>Not sharing your location</Text>
            <Text style={s.emptyText}>
              Share your real-time location with trusted contacts for safety
            </Text>
          </View>
        }
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.shareBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="share-social" size={18} color="#fff" />
          <Text style={s.shareBtnText}>Share My Location</Text>
        </TouchableOpacity>
      </View>

      <CreateShareModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        friendCount={acceptedFriends.length}
      />
    </SafeAreaView>
  );
}
