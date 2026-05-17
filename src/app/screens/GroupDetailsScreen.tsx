import React, { useState, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '@shared/theme';
import { useAppContext } from '../AppContext';
import type { RootStackParamList } from '../navigation/types';
import type { GroupMessage } from '@shared/contracts/SocialRepository';

type Route = RouteProp<RootStackParamList, 'GroupDetails'>;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageBubble({ msg, isOwn }: { msg: GroupMessage; isOwn: boolean }) {
  return (
    <View style={[bubble.row, isOwn && bubble.rowOwn]}>
      {!isOwn && (
        <View style={bubble.avatar}>
          <Text style={bubble.avatarText}>{msg.senderName[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      )}
      <View style={[bubble.box, isOwn && bubble.boxOwn]}>
        {!isOwn && <Text style={bubble.sender}>{msg.senderName}</Text>}
        <Text style={[bubble.text, isOwn && bubble.textOwn]}>{msg.text}</Text>
        <Text style={[bubble.time, isOwn && bubble.timeOwn]}>{formatTime(msg.createdAt)}</Text>
      </View>
    </View>
  );
}

export function GroupDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { groupId } = route.params;
  const { groups, auth } = useAppContext();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList>(null);

  const group = groups.groups.find((g) => g.id === groupId);
  const messages = groups.getMessages(groupId);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !group) return;
    setText('');
    await groups.sendMessage(groupId, trimmed);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group</Text>
        </View>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <Text style={styles.headerSub}>{group.memberIds.length} members</Text>
        </View>
        <TouchableOpacity style={styles.memberBtn}>
          <Ionicons name="people" size={22} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <MessageBubble msg={item} isOwn={item.senderId === auth.user?.uid} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyChatText}>No messages yet</Text>
              <Text style={styles.emptyChatSub}>Say hi to the group!</Text>
            </View>
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Message the group..."
            placeholderTextColor={colors.placeholder}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={20} color={text.trim() ? colors.textInverse : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.brandDark, gap: spacing.md },
  back: { padding: 4 },
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.h3, color: colors.textInverse },
  headerSub: { ...typography.caption, color: colors.brandLight },
  memberBtn: { padding: 4 },
  messageList: { padding: spacing.base, gap: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm, backgroundColor: colors.background },
  input: { flex: 1, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxHeight: 100, ...typography.body, color: colors.textPrimary, backgroundColor: colors.inputBackground },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandDark, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.border },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { ...typography.body, color: colors.textSecondary },
  emptyChat: { paddingTop: 60, alignItems: 'center', gap: spacing.md },
  emptyChatText: { ...typography.body, color: colors.textSecondary },
  emptyChatSub: { ...typography.bodySmall, color: colors.textTertiary },
});

const bubble = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.sm },
  rowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  box: { maxWidth: '72%', backgroundColor: colors.card, borderRadius: 16, borderBottomLeftRadius: 4, padding: spacing.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  boxOwn: { backgroundColor: colors.brandDark, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  sender: { ...typography.caption, color: colors.brandDark, fontWeight: '700', marginBottom: 2 },
  text: { ...typography.body, color: colors.textPrimary },
  textOwn: { color: colors.textInverse },
  time: { ...typography.caption, color: colors.textTertiary, marginTop: 4, alignSelf: 'flex-end' },
  timeOwn: { color: colors.brandLight },
});
