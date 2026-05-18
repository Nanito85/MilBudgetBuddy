import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
}

export function NumberStepper({ label, value, min, max, step = 1, unit, onChange }: Props) {
  const decrement = () => onChange(Math.max(min, value - step));
  const increment = () => onChange(Math.min(max, value + step));

  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.control}>
        <Pressable
          onPress={decrement}
          disabled={value <= min}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, value <= min && styles.btnDisabled]}>
          <ThemedText style={styles.btnText}>−</ThemedText>
        </Pressable>
        <ThemedView type="backgroundElement" style={styles.valueBox}>
          <ThemedText style={styles.value}>
            {value}
            {unit && <ThemedText themeColor="textSecondary" style={styles.unit}> {unit}</ThemedText>}
          </ThemedText>
        </ThemedView>
        <Pressable
          onPress={increment}
          disabled={value >= max}
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, value >= max && styles.btnDisabled]}>
          <ThemedText style={styles.btnText}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '500', flex: 1 },
  control: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.7 },
  btnDisabled: { opacity: 0.3 },
  btnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '400', lineHeight: 24, marginTop: -2 },
  valueBox: {
    minWidth: 72,
    height: 36,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  value: { fontSize: 16, fontWeight: '700' },
  unit: { fontSize: 12, fontWeight: '400' },
});
