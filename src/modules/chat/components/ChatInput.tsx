import React, { useMemo, useState } from 'react';
import { View, Text as RNText, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing } from '@shared/theme';
import { useTheme } from '@shared/hooks/useTheme';
import type { Colors } from '@shared/theme/colors';

interface Props {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, placeholder = 'Ask me anything...', disabled = false }: Props) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const canSend = message.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline
          maxLength={500}
          editable={!disabled}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendButton, canSend && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.7}
        >
          <RNText style={{ color: canSend ? colors.textInverse : colors.textTertiary, fontSize: 16 }}>
            ➤
          </RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.inputBackground,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.inputBorder,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonActive: {
    backgroundColor: colors.brandDark,
    shadowColor: colors.brandDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
  },
});
