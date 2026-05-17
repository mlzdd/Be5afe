import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing } from '@shared/theme';
import { useTheme } from '@shared/hooks/useTheme';
import type { Colors } from '@shared/theme/colors';

interface Props {
  message: string;
  role: 'user' | 'assistant';
  timestamp?: Date;
}

function formatTime(date?: Date): string {
  if (!date) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function ChatBubble({ message, role, timestamp }: Props) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isUser = role === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {!isUser && <View style={styles.avatar} />}
      <View style={styles.messageWrapper}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {message}
          </Text>
        </View>
        {timestamp && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
      {isUser && <View style={styles.avatarPlaceholder} />}
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'flex-end',
  },
  userContainer: { justifyContent: 'flex-end' },
  assistantContainer: { justifyContent: 'flex-start' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.accentLight,
    marginRight: spacing.sm, marginBottom: spacing.xs,
  },
  avatarPlaceholder: { width: 32, marginLeft: spacing.sm },
  messageWrapper: { maxWidth: '80%', alignItems: 'flex-start' },
  bubble: {
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  userBubble: { backgroundColor: colors.brandDark, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: colors.inputBackground, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, lineHeight: 22 },
  userText: { color: colors.textInverse },
  assistantText: { color: colors.textPrimary },
  timestamp: { fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  userTimestamp: { alignSelf: 'flex-end' },
  assistantTimestamp: { alignSelf: 'flex-start' },
});
