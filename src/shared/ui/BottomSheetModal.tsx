import React, { ReactNode, forwardRef, useCallback } from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@shared/hooks/useTheme';
import { radius, spacing, typography } from '@shared/theme';

interface BottomSheetModalProps {
  children: ReactNode;
  snapPoints: Array<string | number>;
  title?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onClose?: () => void;
}

export const BottomSheetModal = forwardRef<BottomSheet, BottomSheetModalProps>(
  ({ children, snapPoints, title, style, contentStyle, onClose }, ref) => {
    const colors = useTheme();
    const insets = useSafeAreaInsets();

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.35}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={[
          styles.background,
          { backgroundColor: colors.card },
          style,
        ]}
        handleIndicatorStyle={{ backgroundColor: colors.textTertiary }}
        onClose={onClose}
      >
        <BottomSheetView style={[styles.content, { paddingBottom: insets.bottom + spacing.base }, contentStyle]}>
          {title ? (
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
          ) : null}
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

BottomSheetModal.displayName = 'BottomSheetModal';

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  title: {
    ...typography.h4,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
});
