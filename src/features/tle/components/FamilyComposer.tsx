import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

interface Props {
  hasSpouse: boolean;
  childAges: number[];            // array of each child's age
  onSpouseChange: (val: boolean) => void;
  onChildAgesChange: (ages: number[]) => void;
}

function childLabel(age: number): string {
  return age < 12 ? `Age ${age} · under 12 (5.42%)` : `Age ${age} · 12+ (8.125%)`;
}

export function FamilyComposer({ hasSpouse, childAges, onSpouseChange, onChildAgesChange }: Props) {
  const addChild = () => onChildAgesChange([...childAges, 8]);

  const updateAge = (idx: number, age: number) => {
    const next = [...childAges];
    next[idx] = age;
    onChildAgesChange(next);
  };

  const removeChild = (idx: number) => {
    onChildAgesChange(childAges.filter((_, i) => i !== idx));
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Spouse toggle */}
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

      {/* Children section header */}
      <View style={styles.childrenHeader}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.label}>
            Dependent Children ({childAges.length})
          </ThemedText>
          <ThemedText style={styles.ageNote}>
            Age affects JTR per diem factor (under 12 = 5.42%, 12+ = 8.125%)
          </ThemedText>
        </View>
        {childAges.length < 8 && (
          <Pressable onPress={addChild} style={styles.addChildBtn}>
            <ThemedText style={styles.addChildBtnText}>+ Add</ThemedText>
          </Pressable>
        )}
      </View>

      {/* Individual children */}
      {childAges.map((age, idx) => (
        <View key={idx}>
          <View style={styles.divider} />
          <View style={styles.childRow}>
            <View style={styles.childLeft}>
              <ThemedText style={styles.childNum}>Child {idx + 1}</ThemedText>
              <ThemedText style={[
                styles.childFactor,
                { color: age < 12 ? Brand.warning : Brand.success },
              ]}>
                {childLabel(age)}
              </ThemedText>
            </View>
            <View style={styles.childRight}>
              <View style={styles.ageCtrl}>
                <Pressable
                  onPress={() => updateAge(idx, Math.max(0, age - 1))}
                  style={styles.ageBtn}>
                  <ThemedText style={styles.ageBtnTxt}>−</ThemedText>
                </Pressable>
                <ThemedText style={styles.ageVal}>{age} yrs</ThemedText>
                <Pressable
                  onPress={() => updateAge(idx, Math.min(17, age + 1))}
                  style={styles.ageBtn}>
                  <ThemedText style={styles.ageBtnTxt}>+</ThemedText>
                </Pressable>
              </View>
              <Pressable onPress={() => removeChild(idx)} style={styles.removeBtn}>
                <ThemedText style={styles.removeBtnText}>✕</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      ))}

      {childAges.length === 0 && (
        <View style={styles.divider} />
      )}
      {childAges.length === 0 && (
        <View style={styles.emptyChildren}>
          <ThemedText style={styles.emptyChildrenText}>No dependent children added.</ThemedText>
        </View>
      )}
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
  ageNote: { fontSize: 11, color: '#4D7A9A', marginTop: 2, lineHeight: 15 },

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

  childrenHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  addChildBtn: {
    backgroundColor: Brand.primary + '20',
    borderWidth: 1,
    borderColor: Brand.primary + '60',
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  addChildBtnText: { fontSize: 13, fontWeight: '700', color: Brand.primary },

  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  childLeft: { flex: 1, gap: 2 },
  childNum: { fontSize: 14, fontWeight: '600' },
  childFactor: { fontSize: 11, fontWeight: '600' },
  childRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },

  ageCtrl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(128,128,128,0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  ageBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 22, marginTop: -1 },
  ageVal: { fontSize: 14, fontWeight: '700', minWidth: 48, textAlign: 'center' },

  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Brand.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { fontSize: 12, color: Brand.danger, fontWeight: '700' },

  emptyChildren: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  emptyChildrenText: { fontSize: 13, color: '#4D7A9A' },
});
