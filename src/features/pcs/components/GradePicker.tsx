import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { PAY_GRADES, PayGrade } from '@/data/bah-rates';

interface Props {
  selected: PayGrade;
  onSelect: (grade: PayGrade) => void;
}

const GROUPS: { label: string; grades: PayGrade[] }[] = [
  { label: 'Enlisted', grades: ['E1','E2','E3','E4','E5','E6','E7','E8','E9'] },
  { label: 'Warrant',  grades: ['W1','W2','W3','W4','W5'] },
  { label: 'Officer',  grades: ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'] },
];

export function GradePicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {GROUPS.map((group) => (
        <View key={group.label} style={styles.group}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.groupLabel}>
            {group.label}
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.row}>
            {group.grades.map((grade) => {
              const active = grade === selected;
              return (
                <Pressable
                  key={grade}
                  onPress={() => onSelect(grade)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                    {grade}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  group: { gap: Spacing.one },
  groupLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 10,
    paddingHorizontal: Spacing.one,
  },
  row: { flexDirection: 'row', gap: Spacing.one, paddingHorizontal: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    minWidth: 40,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
});
