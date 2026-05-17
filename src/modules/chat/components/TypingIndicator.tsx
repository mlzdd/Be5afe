import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { spacing } from '@shared/theme';
import { useTheme } from '@shared/hooks/useTheme';
import type { Colors } from '@shared/theme/colors';

export function TypingIndicator() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const anim = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0, { duration: 400 })), -1, false);
    dot1.value = anim;
    dot2.value = withDelay(150, anim);
    dot3.value = withDelay(300, anim);
  }, []);

  const d1 = useAnimatedStyle(() => ({ opacity: 0.3 + dot1.value * 0.7, transform: [{ translateY: -dot1.value * 4 }] }));
  const d2 = useAnimatedStyle(() => ({ opacity: 0.3 + dot2.value * 0.7, transform: [{ translateY: -dot2.value * 4 }] }));
  const d3 = useAnimatedStyle(() => ({ opacity: 0.3 + dot3.value * 0.7, transform: [{ translateY: -dot3.value * 4 }] }));

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Animated.View style={[styles.dot, d1]} />
        <Animated.View style={[styles.dot, d2]} />
        <Animated.View style={[styles.dot, d3]} />
      </View>
    </View>
  );
}

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    alignItems: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    backgroundColor: colors.inputBackground,
    borderRadius: 20, borderBottomLeftRadius: 4,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    gap: spacing.xs, alignItems: 'center', minWidth: 60,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
});
