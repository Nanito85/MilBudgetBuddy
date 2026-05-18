import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { fmtPay } from '@/features/home/utils/lesCalc';
import { BudgetCategory, useBudgetStore } from '@/store/budget.store';
import { useUserStore } from '@/store/user.store';

function CategoryRow({ cat, netPay }: { cat: BudgetCategory; netPay: number }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(cat.monthlyBudget > 0 ? String(cat.monthlyBudget) : '');
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const removeCategory = useBudgetStore((s) => s.removeCategory);

  const pct = netPay > 0 && cat.monthlyBudget > 0
    ? Math.round((cat.monthlyBudget / netPay) * 100)
    : null;

  const commit = () => {
    const n = parseFloat(val);
    updateCategory(cat.id, isNaN(n) ? 0 : Math.max(0, n));
    setEditing(false);
  };

  const handleLongPress = () => {
    // Only allow removing user-added categories (not defaults with well-known ids)
    Alert.alert('Remove Category', `Remove "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCategory(cat.id) },
    ]);
  };

  return (
    <Pressable onLongPress={handleLongPress}>
      <ThemedView type="backgroundElement" style={styles.catRow}>
        <ThemedText style={styles.catEmoji}>{cat.emoji}</ThemedText>
        <View style={styles.catInfo}>
          <ThemedText style={styles.catName}>{cat.name}</ThemedText>
          {pct !== null && (
            <ThemedText type="small" themeColor="textSecondary">{pct}% of net pay</ThemedText>
          )}
        </View>
        {editing ? (
          <TextInput
            value={val}
            onChangeText={setVal}
            onBlur={commit}
            onSubmitEditing={commit}
            keyboardType="decimal-pad"
            autoFocus
            style={styles.input}
            placeholder="0"
          />
        ) : (
          <Pressable onPress={() => { setVal(cat.monthlyBudget > 0 ? String(cat.monthlyBudget) : ''); setEditing(true); }}>
            <ThemedText style={[styles.catAmount, cat.monthlyBudget === 0 && styles.unset]}>
              {cat.monthlyBudget > 0 ? fmtPay(cat.monthlyBudget) : 'Set'}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </Pressable>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const categories = useBudgetStore((s) => s.categories);
  const totalBudgeted = useBudgetStore((s) => s.totalBudgeted)();

  const payGrade = useUserStore((s) => s.payGrade);
  const yos = useUserStore((s) => s.yos);
  const mhaZip = useUserStore((s) => s.mhaZip);
  const hasSpouse = useUserStore((s) => s.hasSpouse);
  const specialPays = useUserStore((s) => s.specialPays);
  const tspContribPct = useUserStore((s) => s.tspContribPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut = useUserStore((s) => s.sglOptOut);

  useEffect(() => {
    useBudgetStore.getState().hydrate();
  }, []);

  const netPay = React.useMemo(() => {
    if (!payGrade) return 0;
    const { calcLES } = require('@/features/home/utils/lesCalc');
    const specialPaysTotal = specialPays.reduce((s: number, p: any) => s + p.monthlyAmount, 0);
    return calcLES({ payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, hasDentalFamily, sglOptOut }).netPay;
  }, [payGrade, yos, mhaZip, hasSpouse, specialPays, tspContribPct, hasDentalFamily, sglOptOut]);

  const remaining = netPay - totalBudgeted;
  const overBudget = remaining < 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/')} style={styles.back}>
            <ThemedText style={styles.backChevron}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>Monthly Budget</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary bar */}
        <ThemedView type="backgroundElement" style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Net Income</ThemedText>
            <ThemedText style={styles.summaryValue}>{fmtPay(netPay)}</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Budgeted</ThemedText>
            <ThemedText style={styles.summaryValue}>{fmtPay(totalBudgeted)}</ThemedText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <ThemedText type="small" themeColor="textSecondary">Remaining</ThemedText>
            <ThemedText style={[styles.summaryValue, overBudget && styles.over]}>
              {overBudget ? `-${fmtPay(Math.abs(remaining))}` : fmtPay(remaining)}
            </ThemedText>
          </View>
        </ThemedView>

        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.five }]}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Tap an amount to edit. Long-press to remove.
          </ThemedText>
          {categories.map((cat) => (
            <CategoryRow key={cat.id} cat={cat} netPay={netPay} />
          ))}
          {overBudget && (
            <ThemedView type="backgroundElement" style={styles.warningBox}>
              <ThemedText style={styles.warningText}>
                ⚠ You've budgeted {fmtPay(Math.abs(remaining))} more than your estimated net pay. Adjust your categories to balance your budget.
              </ThemedText>
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    paddingVertical: Spacing.two,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 32, backgroundColor: 'rgba(128,128,128,0.3)' },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  over: { color: '#E74C3C' },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  hint: { fontSize: 12, textAlign: 'center', marginBottom: Spacing.one },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    padding: Spacing.two + 4,
    gap: Spacing.two,
  },
  catEmoji: { fontSize: 22, width: 30 },
  catInfo: { flex: 1, gap: 1 },
  catName: { fontSize: 15, fontWeight: '600' },
  catAmount: { fontSize: 16, fontWeight: '700', color: Brand.primary },
  unset: { color: Brand.accent, fontWeight: '600' },
  input: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.primary,
    minWidth: 80,
    textAlign: 'right',
    borderBottomWidth: 2,
    borderBottomColor: Brand.primary,
    paddingVertical: 2,
  },
  warningBox: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderLeftWidth: 4,
    borderLeftColor: '#E67E22',
  },
  warningText: { fontSize: 13, lineHeight: 20 },
});
