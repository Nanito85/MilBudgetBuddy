import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { BRANCH_LABELS, MilitaryBranch } from '@/types/user.types';

const BRANCHES = Object.keys(BRANCH_LABELS) as MilitaryBranch[];

interface BranchSelectorProps {
  selected?: MilitaryBranch;
  onSelect: (branch: MilitaryBranch) => void;
}

export function BranchSelector({ selected, onSelect }: BranchSelectorProps) {
  const tc = useThemeColors();

  return (
    <View style={styles.grid}>
      {BRANCHES.map((branch) => {
        const isSelected = selected === branch;
        return (
          <Pressable
            key={branch}
            onPress={() => onSelect(branch)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: isSelected ? Brand.primary : tc.surface,
                borderColor: isSelected ? Brand.primary : 'transparent',
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <ThemedText
              type="small"
              style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
              {BRANCH_LABELS[branch]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: 99,
    borderWidth: 1.5,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
  },
  chipLabel: {
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#FFFFFF',
  },
});
