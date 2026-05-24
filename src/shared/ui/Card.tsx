import React, { ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, shadows, spacing, type RadiusKey, type ShadowKey } from '@shared/theme';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const paddingValues: Record<CardPadding, number> = {
  none: 0,
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.base,
};

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  radius?: Extract<RadiusKey, 'md' | 'lg' | 'xl'>;
  shadow?: Extract<ShadowKey, 'none' | 'sm' | 'md' | 'lg'>;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export function Card({
  children,
  padding = 'md',
  radius: radiusKey = 'lg',
  shadow = 'md',
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
}: CardProps) {
  const colors = useTheme();
  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius[radiusKey],
      padding: paddingValues[padding],
    },
    shadows[shadow],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        activeOpacity={0.82}
        disabled={disabled}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
