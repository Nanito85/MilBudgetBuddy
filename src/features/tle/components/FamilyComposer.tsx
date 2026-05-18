import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';

interface Props {
  hasSpouse: boolean;
  numChildren: number;
  onSpouseChange: (val: boolean) => void;
  onChildrenChange: (val: number) => void;
}

export function FamilyComposer({ hasSpouse, numChildren, onSpouseChange, onChildrenChange }: Props) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.row}>
        <ThemedText style={styles.label}>Spouse / Domestic Partner</ThemedText>
        <View style={styles.toggle}>
          {([false, true] as const).map((val) => (
            <Pressable
              key={String(val)}
              onPress={() => onSpouseChange(val)}
              style={[styles.toggleBtn, hasSpouse === val && styles.toggleBtnActive]}>
              <ThemedText style={[styles.toggleText, hasSpouse === val && styles.toggleTextActive]}>
                {val ? 'Yes' : 'No'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.stepperWrap}>
        <NumberStepper
          label="Dependent children"
          value={numChildren}
          min={0}
          max={8}
          onChange={onChildrenChange}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  label: { fontSize: 15, fontWeight: '500', flex: 1 },
  toggle: { flexDirection: 'row', gap: Spacing.one },
  toggleBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 99,
    backgroundColor: 'rgba(128,128,128,0.12)',
    minWidth: 52,
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: Brand.primary },
  toggleText: { fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginHorizontal: Spacing.three,
  },
  stepperWrap: { padding: Spacing.three },
});
