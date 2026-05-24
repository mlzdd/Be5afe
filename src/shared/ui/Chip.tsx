import React, { ComponentProps } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ChipProps {
  label: string;
  color: string;
  icon?: IconName;
  size?: 'sm' | 'md';
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

function alphaColor(color: string, alpha: string) {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}${alpha}` : color;
}

export function Chip({
  label,
  color,
  icon,
  size = 'md',
  selected = false,
  onPress,
  style,
  textStyle,
}: ChipProps) {
  const colors = useTheme();
  const isSmall = size === 'sm';
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={isSmall ? 12 : 14}
          color={selected ? colors.textInverse : color}
          style={styles.icon}
        />
      ) : null}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          isSmall ? styles.smallLabel : null,
          { color: selected ? colors.textInverse : color },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </>
  );
  const chipStyle = [
    styles.chip,
    isSmall ? styles.smallChip : null,
    {
      backgroundColor: selected ? color : alphaColor(color, '20'),
      borderColor: color,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.8}
        onPress={onPress}
        style={chipStyle}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={chipStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 30,
    paddingHorizontal: spacing.md,
  },
  smallChip: {
    minHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  label: {
    ...typography.label,
  },
  smallLabel: {
    ...typography.caption,
  },
  icon: {
    marginLeft: -2,
  },
});
