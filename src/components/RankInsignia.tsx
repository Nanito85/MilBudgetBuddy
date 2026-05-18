import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PayGrade } from '@/data/bah-rates';
import { RankVariant, getInsigniaRows } from '@/data/rank-insignia';
import { BRANCH_COLORS, MilitaryBranch } from '@/types/user.types';

import { ThemedText } from './themed-text';

interface Props {
  branch: MilitaryBranch | undefined;
  grade: PayGrade | undefined;
  variant?: RankVariant;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { font: 11, padding: 5, gap: 1, minWidth: 36 },
  md: { font: 15, padding: 7, gap: 2, minWidth: 48 },
  lg: { font: 20, padding: 10, gap: 3, minWidth: 60 },
};

export function RankInsignia({ branch, grade, variant = 'default', size = 'md' }: Props) {
  if (!branch || branch === 'other' || !grade) return null;

  const rows = getInsigniaRows(branch, grade, variant);
  if (rows.length === 0) return null;

  const color = BRANCH_COLORS[branch] ?? '#4A7C59';
  const s = SIZES[size];

  return (
    <View style={[
      styles.badge,
      {
        borderColor: color + '60',
        backgroundColor: color + '18',
        padding: s.padding,
        gap: s.gap,
        minWidth: s.minWidth,
      },
    ]}>
      {rows.map((row, i) => (
        <ThemedText
          key={i}
          style={[styles.row, { fontSize: s.font, color }]}
        >
          {row}
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 18,
  },
});
