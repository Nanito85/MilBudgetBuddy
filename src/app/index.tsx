import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { TIPS } from '@/data/tips';
import { BudgetCard } from '@/features/home/components/BudgetCard';
import { DashboardHeader } from '@/features/home/components/DashboardHeader';
import { PayDayCountdown } from '@/features/home/components/PayDayCountdown';
import { PaySummaryCard } from '@/features/home/components/PaySummaryCard';
import { QuickActionsGrid } from '@/features/home/components/QuickActionsGrid';
import { calcLES } from '@/features/home/utils/lesCalc';
import { CategoryBadge } from '@/features/daily-tip/components/CategoryBadge';
import { TipCard } from '@/features/daily-tip/components/TipCard';
import { useDailyTip } from '@/features/daily-tip/hooks/useDailyTip';
import { useBudgetStore } from '@/store/budget.store';
import { useUserStore } from '@/store/user.store';

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({
  label,
  accentColor,
  route,
  routeLabel,
}: {
  label: string;
  accentColor: string;
  route?: string;
  routeLabel?: string;
}) {
  const router = useRouter();
  return (
    <View style={[shStyles.row, { borderLeftColor: accentColor }]}>
      <View style={[shStyles.dot, { backgroundColor: accentColor }]} />
      <ThemedText style={[shStyles.label, { color: accentColor }]}>{label}</ThemedText>
      <View style={shStyles.line} />
      {route && routeLabel && (
        <Pressable onPress={() => router.push(route as any)} hitSlop={8}>
          <ThemedText style={[shStyles.action, { color: accentColor }]}>{routeLabel} ›</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const shStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderLeftWidth: 3,
    paddingLeft: Spacing.two,
  },
  dot: { width: 6, height: 6, borderRadius: 2 },
  label: { fontSize: 14, fontWeight: '800', letterSpacing: 0.8 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#0D2030' },
  action: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});

// ── Budget snapshot bars ──────────────────────────────────────────────────────

function BudgetSnapshotBar({
  name, emoji, amount, total,
}: {
  name: string; emoji: string; amount: number; total: number;
}) {
  const pct = total > 0 ? Math.min(1, amount / total) : 0;
  const barColor = pct > 0.7 ? Brand.tactical : pct > 0.4 ? Brand.accent : '#2A8C6C';
  return (
    <View style={bsStyles.row}>
      <ThemedText style={bsStyles.emoji}>{emoji}</ThemedText>
      <View style={bsStyles.details}>
        <View style={bsStyles.topRow}>
          <ThemedText style={bsStyles.name}>{name.toUpperCase()}</ThemedText>
          <ThemedText style={[bsStyles.amount, { color: Brand.accent }]}>
            ${Math.round(amount).toLocaleString()}
          </ThemedText>
        </View>
        <View style={bsStyles.track}>
          <View style={[bsStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

const bsStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 16, width: 24, textAlign: 'center', lineHeight: 22 },
  details: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: '#4D7A9A' },
  amount: { fontSize: 11, fontWeight: '700', fontFamily: 'Courier New' },
  track: { height: 3, backgroundColor: '#0D1E30', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const branch = useUserStore((s) => s.branch);
  const payGrade = useUserStore((s) => s.payGrade);
  const rankVariant = useUserStore((s) => s.rankVariant);
  const lastName = useUserStore((s) => s.lastName);
  const nickname = useUserStore((s) => s.nickname);
  const greetingStyle = useUserStore((s) => s.greetingStyle);
  const specialPays = useUserStore((s) => s.specialPays);
  const yos = useUserStore((s) => s.yos);
  const mhaZip = useUserStore((s) => s.mhaZip);
  const hasSpouse = useUserStore((s) => s.hasSpouse);
  const tspContribPct = useUserStore((s) => s.tspContribPct);
  const rothTspPct    = useUserStore((s) => s.rothTspPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut = useUserStore((s) => s.sglOptOut);
  const stateResidence = useUserStore((s) => s.stateResidence);
  const lesOverrides = useUserStore((s) => s.lesOverrides);
  const financialGoal = useUserStore((s) => s.financialGoal);
  const tip = useDailyTip(financialGoal);

  React.useEffect(() => {
    useBudgetStore.getState().hydrate();
  }, []);

  const specialPaysTotal = useMemo(
    () => specialPays.reduce((sum, p) => sum + p.monthlyAmount, 0),
    [specialPays],
  );

  const budgetCategories = useBudgetStore((s) => s.categories);
  const budgetTop3 = useMemo(
    () =>
      [...budgetCategories]
        .filter((c) => c.monthlyBudget > 0)
        .sort((a, b) => b.monthlyBudget - a.monthlyBudget)
        .slice(0, 3),
    [budgetCategories],
  );
  const budgetTotal = useMemo(
    () => budgetCategories.reduce((sum, c) => sum + c.monthlyBudget, 0),
    [budgetCategories],
  );

  const breakdown = useMemo(() => {
    if (!payGrade) return null;
    return calcLES({
      payGrade, yos, mhaZip, hasSpouse, specialPaysTotal,
      tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence,
      overrides: lesOverrides,
    });
  }, [payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence, lesOverrides]);

  return (
    <ThemedView style={styles.container}>
      <DashboardHeader
        branch={branch}
        payGrade={payGrade}
        rankVariant={rankVariant}
        lastName={lastName}
        nickname={nickname}
        greetingStyle={greetingStyle}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">

        {/* ── PROFILE COMPLETION NUDGE ─────────────────────────────── */}
        {payGrade && specialPays.length === 0 && (
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={({ pressed }) => [styles.nudgeBanner, pressed && { opacity: 0.75 }]}>
            <ThemedText style={styles.nudgeIcon}>⚠️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.nudgeTitle}>PAY ESTIMATE MAY BE INCOMPLETE</ThemedText>
              <ThemedText style={styles.nudgeBody}>Add special pays (flight, dive, jump, sea pay, etc.) to your profile for an accurate statement.</ThemedText>
            </View>
            <ThemedText style={styles.nudgeChevron}>›</ThemedText>
          </Pressable>
        )}

        {/* ── PAY STATEMENT ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            label="PAY STATEMENT"
            accentColor={Brand.accent}
            route="/pay-chart"
            routeLabel="PAY CHART"
          />
          {breakdown ? (
            <>
              <PaySummaryCard breakdown={breakdown} />
              <PayDayCountdown netPay={breakdown.netPay} />
            </>
          ) : (
            <Pressable
              onPress={() => router.push('/profile' as any)}
              style={({ pressed }) => [styles.setupPrompt, pressed && { opacity: 0.8 }]}>
              <View style={styles.setupLeft}>
                <ThemedText style={styles.setupIcon}>🪖</ThemedText>
              </View>
              <View style={styles.setupRight}>
                <ThemedText type="label" style={styles.setupTitle}>SET UP YOUR PROFILE</ThemedText>
                <ThemedText type="small" style={styles.setupBody}>
                  Enter your rank and duty station to see your personalized pay breakdown.
                </ThemedText>
                <View style={styles.setupCta}>
                  <ThemedText style={styles.setupCtaText}>COMPLETE PROFILE →</ThemedText>
                </View>
              </View>
            </Pressable>
          )}
        </View>

        {/* ── BUDGET OPS ────────────────────────────────────────────── */}
        {breakdown && (
          <View style={styles.section}>
            <SectionHeader
              label="BUDGET OPS"
              accentColor={Brand.tactical}
              route="/budget"
              routeLabel="MANAGE"
            />
            <BudgetCard netPay={breakdown.netPay} />
            {budgetTop3.length > 0 && (
              <Pressable
                onPress={() => router.push('/budget' as any)}
                style={styles.budgetSnapshot}>
                <View style={styles.budgetBars}>
                  {budgetTop3.map((cat) => (
                    <BudgetSnapshotBar
                      key={cat.id}
                      name={cat.name}
                      emoji={cat.emoji}
                      amount={cat.monthlyBudget}
                      total={budgetTotal}
                    />
                  ))}
                </View>
                <ThemedText type="label" style={styles.budgetTapHint}>
                  TAP TO LOG EXPENSES ›
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {/* ── QUICK ACCESS ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            label="QUICK ACCESS"
            accentColor="#208AEF"
            route="/tools"
            routeLabel="ALL TOOLS"
          />
          <QuickActionsGrid />
        </View>

        {/* ── INTEL BRIEF ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader label="INTEL BRIEF" accentColor={Brand.success} />
          <TipCard tip={tip} />
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },

  // Each section is visually grouped
  section: {
    gap: Spacing.two,
  },

  setupPrompt: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.accent + '50',
    borderRadius: 4,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  setupLeft: { width: 32, alignItems: 'center', paddingTop: 2 },
  setupRight: { flex: 1, gap: 6 },
  setupIcon: { fontSize: 22 },
  setupTitle: { color: Brand.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  setupBody: { fontSize: 12, lineHeight: 18, color: '#6B92B0' },
  setupCta: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.accent,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    marginTop: 2,
  },
  setupCtaText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#1A1000',
    borderWidth: 1,
    borderColor: '#C9A84C50',
    borderRadius: 4,
    padding: Spacing.two + 4,
  },
  nudgeIcon: { fontSize: 16, lineHeight: 20 },
  nudgeTitle: { fontSize: 10, fontWeight: '800', color: '#C9A84C', letterSpacing: 0.3, marginBottom: 2 },
  nudgeBody: { fontSize: 11, color: '#8A7040', lineHeight: 15 },
  nudgeChevron: { fontSize: 20, color: '#C9A84C', fontWeight: '300' },

  budgetSnapshot: {
    backgroundColor: '#050B14',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  budgetBars: { gap: Spacing.two },
  budgetTapHint: { color: Brand.tactical, fontSize: 10, textAlign: 'right', marginTop: 2 },
});
