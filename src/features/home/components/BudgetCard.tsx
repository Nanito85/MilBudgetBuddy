import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { fmtPay } from '@/features/home/utils/lesCalc';
import { useThemeColors } from '@/hooks/use-theme';
import { useBudgetStore } from '@/store/budget.store';

interface Props {
  netPay: number;
}

export function BudgetCard({ netPay }: Props) {
  const router = useRouter();
  const tc = useThemeColors();
  const categories = useBudgetStore((s) => s.categories);
  const totalBudgeted = useBudgetStore((s) => s.totalBudgeted)();

  const hasData = categories.some((c) => c.monthlyBudget > 0);
  const remaining = netPay - totalBudgeted;
  const pct = netPay > 0 ? Math.min(100, (totalBudgeted / netPay) * 100) : 0;
  const overBudget = remaining < 0;
  const barColor = overBudget ? Brand.danger : pct > 75 ? Brand.warning : Brand.tactical;

  return (
    <Pressable onPress={() => router.push('/budget')} style={({ pressed }) => pressed && styles.pressed}>
      <TacticalCard accentColor={Brand.tactical} cornerSize={10} style={styles.card}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={[styles.dot, { backgroundColor: Brand.tactical }]} />
            <ThemedText type="label" style={styles.headerLabel}>BUDGET OPS // MONTHLY</ThemedText>
          </View>
          <ThemedText type="label" style={styles.chevron}>›</ThemedText>
        </View>

        {hasData ? (
          <View style={styles.body}>
            <View style={styles.amountRow}>
              <View>
                <ThemedText type="label" style={[styles.subLabel, { color: tc.textMuted }]}>ALLOCATED</ThemedText>
                <ThemedText style={[styles.amount, { color: Brand.tactical }]}>{fmtPay(totalBudgeted)}</ThemedText>
              </View>
              <View style={[styles.sep, { backgroundColor: tc.borderColor }]} />
              <View>
                <ThemedText type="label" style={[styles.subLabel, { color: tc.textMuted }]}>REMAINING</ThemedText>
                <ThemedText style={[styles.amount, { color: overBudget ? Brand.danger : tc.textPrimary }]}>
                  {overBudget ? `-${fmtPay(Math.abs(remaining))}` : fmtPay(remaining)}
                </ThemedText>
              </View>
              <View style={[styles.sep, { backgroundColor: tc.borderColor }]} />
              <View>
                <ThemedText type="label" style={[styles.subLabel, { color: tc.textMuted }]}>OF INCOME</ThemedText>
                <ThemedText style={[styles.amount, { color: barColor }]}>{Math.round(pct)}%</ThemedText>
              </View>
            </View>

            <View style={[styles.barTrack, { backgroundColor: tc.borderColor }]}>
              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
            </View>
          </View>
        ) : (
          <View style={styles.emptyBody}>
            <ThemedText type="label" style={[styles.emptyText, { color: tc.textMuted }]}>AWAITING BUDGET CONFIGURATION →</ThemedText>
          </View>
        )}
      </TacticalCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: { borderRadius: 4 },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,200,168,0.06)',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,200,168,0.2)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 1 },
  headerLabel: { color: Brand.tactical, fontSize: 9 },
  chevron: { color: Brand.tactical, fontSize: 14 },
  body: { padding: Spacing.three, gap: Spacing.two },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  subLabel: { fontSize: 8, marginBottom: 3 },
  amount: { fontSize: 15, fontWeight: '800', fontFamily: Fonts.data, letterSpacing: 0.5 },
  sep: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    marginHorizontal: Spacing.three,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
  emptyBody: {
    padding: Spacing.three,
    alignItems: 'center',
  },
  emptyText: {},
});
