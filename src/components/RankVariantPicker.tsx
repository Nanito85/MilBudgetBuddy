import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PayGrade } from '@/data/bah-rates';
import { RankVariant, RankVariantOption, getDualVariants } from '@/data/rank-insignia';
import { BRANCH_COLORS, MilitaryBranch } from '@/types/user.types';
import { Brand, Spacing } from '@/constants/theme';

import { ThemedText } from './themed-text';

interface Props {
  branch: MilitaryBranch | undefined;
  grade: PayGrade | undefined;
  selected: RankVariant;
  onSelect: (variant: RankVariant) => void;
}

export function RankVariantPicker({ branch, grade, selected, onSelect }: Props) {
  if (!branch || !grade) return null;

  const options: RankVariantOption[] | null = getDualVariants(branch, grade);
  if (!options) return null;

  const color = BRANCH_COLORS[branch] ?? Brand.accent;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>WHICH {grade}?</ThemedText>
      <View style={styles.row}>
        {options.map((opt) => {
          const isActive = selected === opt.variant;
          return (
            <Pressable
              key={opt.variant}
              onPress={() => onSelect(opt.variant)}
              style={[
                styles.chip,
                isActive && { borderColor: color, backgroundColor: color + '20' },
              ]}>
              <ThemedText style={[styles.chipAbbrev, isActive && { color }]}>
                {opt.abbrev}
              </ThemedText>
              <ThemedText style={[styles.chipFull, isActive && { color: color + 'CC' }]}>
                {opt.fullName}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one + 2 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#3D6080' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  chip: {
    borderWidth: 1.5,
    borderColor: '#1E2D3D',
    borderRadius: 4,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    alignItems: 'center',
    gap: 2,
    minWidth: 80,
  },
  chipAbbrev: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: '#4D7A9A' },
  chipFull: { fontSize: 8, fontWeight: '600', letterSpacing: 0.3, color: '#3D6080', textAlign: 'center' },
});
