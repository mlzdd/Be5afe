import React, { useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { spacing } from '@shared/theme';
import { useTheme } from '@shared/hooks/useTheme';
import type { Colors } from '@shared/theme/colors';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { TypingIndicator } from './components/TypingIndicator';
import { useChat } from './useChat';
import type { ChatCompletionClient } from '@shared/contracts/ChatCompletionClient';

const BSAFE_SYSTEM_PROMPT = `You are BE5 Travel Assistant, a helpful AI for the BSafe travel safety app.

Help travellers stay safe by providing:
- Travel safety information and advice
- Emergency procedures and contact information
- Local laws, customs, and cultural norms
- Scam awareness and prevention tips
- Country-specific safety recommendations
- Health and medical travel advice

Guidelines:
1. Keep answers concise and actionable (2-4 paragraphs max)
2. Prioritise safety and accuracy
3. Be friendly but honest about risks
4. Recommend official sources for critical information
5. Use bullet points for lists`;

interface Props {
  client: ChatCompletionClient;
  onClose?: () => void;
}

export function ChatScreen({ client, onClose }: Props) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const flatListRef = useRef<FlatList>(null);
  const { messages, isTyping, sendMessage } = useChat(client, BSAFE_SYSTEM_PROMPT);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🤖</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.headerTitle}>BE5 Travel Assistant</Text>
            <Text style={styles.headerSubtitle}>{isTyping ? 'Typing...' : 'Ask me anything'}</Text>
          </View>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={{ color: colors.textSecondary, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          style={styles.flex}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item.content} role={item.role} timestamp={item.timestamp} />
          )}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          contentContainerStyle={{ paddingVertical: spacing.sm }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <ChatInput
          onSend={sendMessage}
          placeholder="Ask about safety, emergencies, or local info..."
          disabled={isTyping}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accentLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.md,
  },
  headerIconText: { fontSize: 24 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  closeButton: { padding: spacing.xs },
});
