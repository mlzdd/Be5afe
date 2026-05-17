import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '@shared/theme';

export function LoadingSpinner() {
  return (
    <View style={s.container}>
      <ActivityIndicator size="large" color={colors.brandDark} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
