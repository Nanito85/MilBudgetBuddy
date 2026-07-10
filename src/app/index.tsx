import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useDebtStore } from '@/store/debt.store';
import { useSavingsGoalsStore } from '@/store/savings-goals.store';
import { BRANCH_LABELS, getRankAbbrev } from '@/types/user.types';
import { TutorialModal } from '@/components/TutorialModal';

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
import { useThemeColors } from '@/hooks/use-theme';

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
  const tc = useThemeColors();
  return (
    <View style={[shStyles.row, { borderLeftColor: accentColor }]}>
      <View style={[shStyles.dot, { backgroundColor: accentColor }]} />
      <ThemedText style={[shStyles.label, { color: accentColor }]}>{label}</ThemedText>
      <View style={[shStyles.line, { backgroundColor: tc.borderColor }]} />
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
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  action: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
});

// ── Budget snapshot bars ──────────────────────────────────────────────────────

function BudgetSnapshotBar({
  name, emoji, amount, total,
}: {
  name: string; emoji: string; amount: number; total: number;
}) {
  const tc = useThemeColors();
  const pct = total > 0 ? Math.min(1, amount / total) : 0;
  const barColor = pct > 0.7 ? Brand.tactical : pct > 0.4 ? Brand.accent : '#2A8C6C';
  return (
    <View style={bsStyles.row}>
      <ThemedText style={bsStyles.emoji}>{emoji}</ThemedText>
      <View style={bsStyles.details}>
        <View style={bsStyles.topRow}>
          <ThemedText style={[bsStyles.name, { color: tc.textHint }]}>{name.toUpperCase()}</ThemedText>
          <ThemedText style={[bsStyles.amount, { color: Brand.accent }]}>
            ${Math.round(amount).toLocaleString()}
          </ThemedText>
        </View>
        <View style={[bsStyles.track, { backgroundColor: tc.surfaceInner }]}>
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
  name: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  amount: { fontSize: 11, fontWeight: '700', fontFamily: 'Courier New' },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [editProfileDismissed, setEditProfileDismissed] = React.useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const hasSeenTutorial = useUserStore((s) => s.hasSeenTutorial);
  const setHasSeenTutorial = useUserStore((s) => s.setHasSeenTutorial);
  const disclaimerAcknowledged = useUserStore((s) => s.disclaimerAcknowledged);
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
  const installationName = useUserStore((s) => s.installationName);
  const serviceStatus    = useUserStore((s) => s.serviceStatus);
  const numChildren      = useUserStore((s) => s.numChildren);
  const financialGoal = useUserStore((s) => s.financialGoal);
  const tip = useDailyTip(financialGoal);

  const debtEntries   = useDebtStore((s) => s.debts);
  const savingsGoals  = useSavingsGoalsStore((s) => s.goals);

  React.useEffect(() => {
    useBudgetStore.getState().hydrate();
    useDebtStore.getState().hydrate();
    useSavingsGoalsStore.getState().hydrate();
  }, []);

  // Show tutorial once disclaimer has been acknowledged and tutorial hasn't been seen
  React.useEffect(() => {
    if (disclaimerAcknowledged && !hasSeenTutorial) {
      const timer = setTimeout(() => setShowTutorial(true), 600);
      return () => clearTimeout(timer);
    }
  }, [disclaimerAcknowledged, hasSeenTutorial]);

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

  // ── Mission Readiness Score (0-100) ─────────────────────────────────────────
  const readinessChecks = useMemo(() => {
    const setCats = budgetCategories.filter((c) => c.monthlyBudget > 0).length;
    return [
      { label: 'Profile complete',        done: !!(payGrade && branch && yos > 0), pts: 20 },
      { label: 'Duty station set',        done: !!mhaZip,                           pts: 5  },
      { label: 'State of residence set',  done: !!stateResidence,                   pts: 5  },
      { label: 'Budget configured (3+)',  done: setCats >= 3,                        pts: 15 },
      { label: 'Budget balanced',         done: !!(breakdown && budgetTotal <= breakdown.netPay && budgetTotal > 0), pts: 10 },
      { label: 'TSP contribution set',    done: tspContribPct > 0,                  pts: 10 },
      { label: 'TSP ≥5% (full BRS match)',done: tspContribPct >= 5,                 pts: 5  },
      { label: 'Savings goal created',    done: savingsGoals.length > 0,            pts: 15 },
      { label: 'Debt entries tracked',    done: debtEntries.length > 0,             pts: 5  },
      { label: 'Income & budget linked',  done: !!(breakdown && breakdown.netPay > 0 && budgetTotal > 0), pts: 10 },
    ];
  }, [payGrade, branch, yos, mhaZip, stateResidence, budgetCategories, budgetTotal, breakdown, tspContribPct, savingsGoals, debtEntries]);

  const readinessScore = useMemo(() => {
    if (!payGrade) return null;
    return Math.min(100, readinessChecks.reduce((s, c) => s + (c.done ? c.pts : 0), 0));
  }, [payGrade, readinessChecks]);

  const readinessLabel = readinessScore === null ? null
    : readinessScore >= 80 ? { text: 'MISSION READY',   color: Brand.success }
    : readinessScore >= 60 ? { text: 'CONDITION YELLOW', color: Brand.accent }
    : readinessScore >= 40 ? { text: 'NEEDS ATTENTION',  color: '#E8961A' }
    :                        { text: 'NOT READY',         color: Brand.danger };

  const rankAbbrev = getRankAbbrev(branch, payGrade, rankVariant);

  return (
    <ThemedView style={styles.container}>
      <TutorialModal
        visible={showTutorial}
        onDismiss={() => {
          setShowTutorial(false);
          setHasSeenTutorial();
        }}
      />
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

        {/* ── PERSONNEL PROFILE CARD ───────────────────────────────── */}
        {payGrade ? (
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={({ pressed }) => [styles.personnelCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }, pressed && { opacity: 0.85 }]}>
            <View style={styles.personnelLeft}>
              <ThemedText style={styles.personnelRank}>{rankAbbrev || payGrade}</ThemedText>
              <ThemedText style={[styles.personnelName, { color: tc.textPrimary }]}>{lastName?.toUpperCase() || nickname?.toUpperCase() || 'SERVICEMEMBER'}</ThemedText>
              <ThemedText style={[styles.personnelBranch, { color: tc.textHint }]}>
                {branch ? BRANCH_LABELS[branch] : '—'}{serviceStatus ? ` · ${serviceStatus.toUpperCase()}` : ''}
              </ThemedText>
            </View>
            <View style={styles.personnelRight}>
              <View style={styles.personnelStat}>
                <ThemedText style={[styles.personnelStatVal, { color: tc.textPrimary }]}>{yos}</ThemedText>
                <ThemedText style={[styles.personnelStatLabel, { color: tc.textMuted }]}>YOS</ThemedText>
              </View>
              {numChildren > 0 && (
                <View style={styles.personnelStat}>
                  <ThemedText style={[styles.personnelStatVal, { color: tc.textPrimary }]}>{numChildren}</ThemedText>
                  <ThemedText style={[styles.personnelStatLabel, { color: tc.textMuted }]}>DEPS</ThemedText>
                </View>
              )}
              <View style={styles.personnelEditBtn}>
                <ThemedText style={styles.personnelEditText}>EDIT ›</ThemedText>
              </View>
            </View>
            {installationName ? (
              <View style={styles.personnelStation}>
                <ThemedText style={[styles.personnelStationText, { color: tc.textMuted }]}>📍 {installationName}</ThemedText>
              </View>
            ) : null}
          </Pressable>
        ) : (
          !editProfileDismissed && (
            <View style={styles.editProfileRow}>
              <Pressable
                onPress={() => router.push('/profile' as any)}
                style={({ pressed }) => [styles.editProfileChip, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }, pressed && { opacity: 0.75 }]}>
                <ThemedText style={[styles.editProfileText, { color: tc.textSecondary }]}>✏️  Set Up Profile</ThemedText>
              </Pressable>
              <Pressable onPress={() => setEditProfileDismissed(true)} hitSlop={10} style={styles.editProfileClose}>
                <ThemedText style={[styles.editProfileCloseText, { color: tc.textMuted }]}>✕</ThemedText>
              </Pressable>
            </View>
          )
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
              style={({ pressed }) => [styles.setupPrompt, { backgroundColor: tc.surface }, pressed && { opacity: 0.8 }]}>
              <View style={styles.setupLeft}>
                <ThemedText style={styles.setupIcon}>🪖</ThemedText>
              </View>
              <View style={styles.setupRight}>
                <ThemedText type="label" style={styles.setupTitle}>SET UP YOUR PROFILE</ThemedText>
                <ThemedText type="small" style={[styles.setupBody, { color: tc.textSecondary }]}>
                  Enter your rank and duty station to see your personalized pay breakdown.
                </ThemedText>
                <View style={styles.setupCta}>
                  <ThemedText style={styles.setupCtaText}>COMPLETE PROFILE →</ThemedText>
                </View>
              </View>
            </Pressable>
          )}
        </View>

        {/* ── MISSION READINESS SCORE ──────────────────────────────── */}
        {readinessScore !== null && readinessLabel && (
          <View style={[styles.readinessCard, { backgroundColor: tc.surface, borderColor: readinessLabel.color + '40' }]}>
            {/* Score + bar */}
            <View style={styles.readinessTop}>
              <View style={styles.readinessLeft}>
                <ThemedText style={[styles.readinessEyebrow, { color: tc.textMuted }]}>// FINANCIAL READINESS</ThemedText>
                <View style={styles.readinessScoreRow}>
                  <ThemedText style={[styles.readinessScore, { color: readinessLabel.color }]}>{readinessScore}</ThemedText>
                  <ThemedText style={[styles.readinessScoreMax, { color: tc.textMuted }]}>/100</ThemedText>
                </View>
                <ThemedText style={[styles.readinessLabel, { color: readinessLabel.color }]}>{readinessLabel.text}</ThemedText>
              </View>
              <View style={styles.readinessBarWrap}>
                <View style={[styles.readinessTrack, { backgroundColor: tc.surfaceInner }]}>
                  <View style={[styles.readinessFill, { height: `${readinessScore}%` as any, backgroundColor: readinessLabel.color }]} />
                </View>
              </View>
            </View>
            {/* Steps to 100 — show uncompleted items */}
            {readinessScore < 100 && (
              <View style={[styles.readinessSteps, { borderTopColor: tc.borderColor }]}>
                <ThemedText style={[styles.readinessStepsTitle, { color: tc.textMuted }]}>STEPS TO REACH 100</ThemedText>
                {readinessChecks.filter((c) => !c.done).map((c) => (
                  <Pressable
                    key={c.label}
                    onPress={() => router.push('/profile' as any)}
                    style={styles.readinessStep}>
                    <ThemedText style={[styles.readinessStepIcon, { color: tc.textMuted }]}>○</ThemedText>
                    <ThemedText style={[styles.readinessStepLabel, { color: tc.textSecondary }]}>{c.label}</ThemedText>
                    <ThemedText style={styles.readinessStepPts}>+{c.pts}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

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
                style={[styles.budgetSnapshot, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
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
  setupBody: { fontSize: 12, lineHeight: 18 },
  setupCta: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.accent,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    marginTop: 2,
  },
  setupCtaText: { color: '#000', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // Personnel card
  personnelCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  personnelLeft: { flex: 1, gap: 2 },
  personnelRank: { fontSize: 10, fontWeight: '800', color: Brand.accent, letterSpacing: 1 },
  personnelName: { fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  personnelBranch: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  personnelRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  personnelStat: { alignItems: 'center', gap: 1 },
  personnelStatVal: { fontSize: 18, fontWeight: '900' },
  personnelStatLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  personnelEditBtn: {
    backgroundColor: Brand.tactical + '20',
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  personnelEditText: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },
  personnelStation: { width: '100%', marginTop: -Spacing.one },
  personnelStationText: { fontSize: 10, fontWeight: '600' },

  // Readiness score
  readinessCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  readinessTop: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.three },
  readinessLeft: { flex: 1, gap: 4, justifyContent: 'center' },
  readinessEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  readinessScoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  readinessScore: { fontSize: 40, fontWeight: '900', lineHeight: 44 },
  readinessScoreMax: { fontSize: 14, fontWeight: '600' },
  readinessLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  readinessBarWrap: { width: 12, justifyContent: 'center' },
  readinessTrack: {
    width: 12, height: 80,
    borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end',
  },
  readinessFill: { width: '100%', borderRadius: 6 },
  readinessSteps: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two, gap: Spacing.one + 2,
  },
  readinessStepsTitle: { fontSize: 8, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  readinessStep: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  readinessStepIcon: { fontSize: 10, width: 14 },
  readinessStepLabel: { flex: 1, fontSize: 11 },
  readinessStepPts: { fontSize: 10, fontWeight: '800', color: Brand.accent },

  editProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
  },
  editProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
  },
  editProfileText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  editProfileClose: { padding: 4 },
  editProfileCloseText: { fontSize: 11, fontWeight: '700' },

  budgetSnapshot: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  budgetBars: { gap: Spacing.two },
  budgetTapHint: { color: Brand.tactical, fontSize: 10, textAlign: 'right', marginTop: 2 },
});
