import React from 'react';

import { Chip } from '@shared/ui';
import { useTheme } from '@shared/hooks/useTheme';

interface AlertCountChipProps {
  count: number;
  countryName: string;
  onPress: () => void;
}

export function AlertCountChip({ count, countryName, onPress }: AlertCountChipProps) {
  const colors = useTheme();

  if (count <= 0) return null;

  return (
    <Chip
      label={`${count} active ${count === 1 ? 'alert' : 'alerts'} for ${countryName}`}
      icon="alert-circle"
      color={colors.warning}
      onPress={onPress}
    />
  );
}
