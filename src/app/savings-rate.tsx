import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useBudgetStore } from '@/store/budget.store';
import { useUserStore } from '@/store/user.store';
import { calcLES } from '@/features/home/utils/lesCalc';

const GROWTH_RATE = 0.07;

// Years to FI: derived from savings rate using Trinity Study / FI math
// FI number = 25x annual expenses (4% rule)
function yearsToFi(savingsRate: number, annualExpenses: number, currentInvested: number): number | null {
  if (savingsRate <= 0 || annualExpenses <= 0) return null;
  const annualSavings = annualExpenses * (savingsRate / (1 - savingsRate));
  const fiNumber = annualExpenses * 25;
  if (currentInvested >= fiNumber) return 0;

  // Newton-ish approach: iterate years until portfolio reaches FI number
  let portfolio = currentInvested;
  for (let y = 1; y <= 100; y++) {
    portfolio = portfolio * (1 + GROWTH_RATE) + annualSavings;
    if (portfolio >= fiNumber) return y;
  }
  return null;
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Stepper({ label, value, step, min, max, onChange }: {
  label: string; value: number; step: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  const tc = useThemeColors();
  return (
    <View style={styles.stepperRow}>
      <ThemedText style={[styles.stepperLabel, { color: tc.textSecondary }]}>{label}</ThemedText>
      <View style={styles.stepperControls}>
        <Pressable style={[styles.stepBtn, { borderColor: tc.borderColor, backgroundColor: tc.background }]} onPress={() => onChange(Math.max(min, value - step))}>
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <ThemedText style={[styles.stepperValue, { color: tc.textPrimary }]}>{fmt(value)}</ThemedText>
        <Pressable style={[styles.stepBtn, { borderColor: tc.borderColor, backgroundColor: tc.background }]} onPress={() => onChange(Math.min(max, value + step))}>
          <ThemedText style={styles.stepBtnText}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const RATE_GRADES = [
  { min: 0,  max: 10,  label: 'CRITICAL',   color: Brand.danger,   desc: 'Below survival threshold. Cut expenses immediately.' },
  { min: 10, max: 20,  label: 'LOW',        color: Brand.warning,  desc: 'Getting started. Push toward 20%.' },
  { min: 20, max: 35,  label: 'SOLID',      color: Brand.accent,   desc: 'On track. FI is achievable within career.' },
  { min: 35, max: 50,  label: 'STRONG',     color: Brand.tactical, desc: 'Ahead of peers. Accelerate to 50%.' },
  { min: 50, max: 100, label: 'FIRE MODE',  color: Brand.success,  desc: 'Financial independence in under 17 years.' },
];

function getRateGrade(pct: number) {
  return RATE_GRADES.find((g) => pct >= g.min && pct < g.max) ?? RATE_GRADES[0];
}

export default function SavingsRateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const payGrade  = useUserStore((s) => s.payGrade);
  const yos       = useUserStore((s) => s.yos);
  const mhaZip    = useUserStore((s) => s.mhaZip);
  const hasSpouse = useUserStore((s) => s.hasSpouse);
  const tspContribPct = useUserStore((s) => s.tspContribPct);
  const rothTspPct    = useUserStore((s) => s.rothTspPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut = useUserStore((s) => s.sglOptOut);
  const stateResidence = useUserStore((s) => s.stateResidence);
  const specialPays = useUserStore((s) => s.specialPays);
  const budgetCategories = useBudgetStore((s) => s.categories);

  const specialPaysTotal = useMemo(
    () => specialPays.reduce((sum, p) => sum + p.monthlyAmount, 0),
    [specialPays],
  );

  const breakdown = useMemo(() => {
    if (!payGrade) return null;
    return calcLES({ payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence });
  }, [payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence]);

  const netPayFromStore = breakdown?.netPay ?? 0;
  const budgetTotal = useMemo(
    () => budgetCategories.reduce((sum, c) => sum + c.monthlyBudget, 0),
    [budgetCategories],
  );

  const [monthlyIncome,   setMonthlyIncome]   = useState(netPayFromStore || 2500);
  const [monthlyExpenses, setMonthlyExpenses] = useState(budgetTotal || 1500);
  const [invested,        setInvested]        = useState(10000);

  React.useEffect(() => {
    if (netPayFromStore > 0) setMonthlyIncome(netPayFromStore);
  }, [netPayFromStore]);

  React.useEffect(() => {
    if (budgetTotal > 0) setMonthlyExpenses(budgetTotal);
  }, [budgetTotal]);

  const annualIncome   = monthlyIncome * 12;
  const annualExpenses = monthlyExpenses * 12;
  const annualSavings  = Math.max(0, annualIncome - annualExpenses);
  const savingsRate    = annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;
  const fiNumber       = annualExpenses * 25;
  const ytfi           = yearsToFi(savingsRate / 100, annualExpenses, invested);
  const grade          = getRateGrade(savingsRate);

  const progressToFi = fiNumber > 0 ? Math.min(1, invested / fiNumber) : 0;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Savings Rate & FI</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>FINANCIAL INDEPENDENCE TRACKER</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>Savings Rate Mission</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textSecondary }]}>
            Your savings rate determines your FI date more than any other variable. One number to rule them all.
          </ThemedText>
        </ThemedView>

        {/* Inputs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR NUMBERS</ThemedText>
          {breakdown && (
            <View style={styles.autoFillNote}>
              <ThemedText style={styles.autoFillText}>
                ✓ Income auto-filled from your pay profile. Expenses auto-filled from budget.
              </ThemedText>
            </View>
          )}
          <Stepper label="Monthly take-home income" value={monthlyIncome} step={100} min={0} max={20000} onChange={setMonthlyIncome} />
          <Stepper label="Monthly expenses" value={monthlyExpenses} step={50} min={0} max={15000} onChange={setMonthlyExpenses} />
          <Stepper label="Total invested assets" value={invested} step={1000} min={0} max={500000} onChange={setInvested} />
        </ThemedView>

        {/* Savings rate gauge */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR SAVINGS RATE</ThemedText>
          <View style={styles.rateCenter}>
            <ThemedText style={[styles.rateBig, { color: grade.color }]}>
              {savingsRate.toFixed(1)}%
            </ThemedText>
            <View style={[styles.gradeBadge, { backgroundColor: grade.color + '20', borderColor: grade.color }]}>
              <ThemedText style={[styles.gradeText, { color: grade.color }]}>{grade.label}</ThemedText>
            </View>
            <ThemedText style={[styles.gradeDesc, { color: tc.textSecondary }]}>{grade.desc}</ThemedText>
          </View>
          <View style={[styles.rateTrack, { backgroundColor: tc.surfaceInner }]}>
            <View style={[styles.rateFill, { width: `${Math.min(100, savingsRate)}%` as any, backgroundColor: grade.color }]} />
            {/* Markers */}
            {[10, 20, 35, 50].map((m) => (
              <View key={m} style={[styles.rateMarker, { left: `${m}%` as any, backgroundColor: tc.borderColor }]} />
            ))}
          </View>
          <View style={styles.rateMarkerLabels}>
            {[10, 20, 35, 50].map((m) => (
              <ThemedText key={m} style={[styles.rateMarkerLabel, { left: `${m}%` as any, color: tc.textMuted }]}>{m}%</ThemedText>
            ))}
          </View>
        </ThemedView>

        {/* FI Number */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR FI NUMBER (25× ANNUAL EXPENSES)</ThemedText>
          <View style={styles.fiRow}>
            <View style={[styles.fiBox, { backgroundColor: tc.background }]}>
              <ThemedText style={[styles.fiBoxLabel, { color: tc.textMuted }]}>FI TARGET</ThemedText>
              <ThemedText style={[styles.fiBoxValue, { color: Brand.accent }]}>{fmt(fiNumber)}</ThemedText>
            </View>
            <View style={[styles.fiBox, { backgroundColor: tc.background }]}>
              <ThemedText style={[styles.fiBoxLabel, { color: tc.textMuted }]}>INVESTED NOW</ThemedText>
              <ThemedText style={[styles.fiBoxValue, { color: Brand.tactical }]}>{fmt(invested)}</ThemedText>
            </View>
            <View style={[styles.fiBox, { backgroundColor: tc.background }]}>
              <ThemedText style={[styles.fiBoxLabel, { color: tc.textMuted }]}>YEARS TO FI</ThemedText>
              <ThemedText style={[styles.fiBoxValue, { color: ytfi === 0 ? Brand.success : tc.textPrimary }]}>
                {ytfi === 0 ? 'NOW' : ytfi !== null ? `${ytfi} yr` : '100+'}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: tc.surfaceInner }]}>
            <View style={[styles.progressFill, { width: `${progressToFi * 100}%` as any }]} />
          </View>
          <ThemedText style={[styles.progressLabel, { color: tc.textSecondary }]}>
            {(progressToFi * 100).toFixed(1)}% of the way to FI
          </ThemedText>
        </ThemedView>

        {/* Rate benchmarks */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>SAVINGS RATE → YEARS TO FI</ThemedText>
          {[
            { rate: 10, years: '~46 years' },
            { rate: 20, years: '~37 years' },
            { rate: 30, years: '~28 years' },
            { rate: 40, years: '~22 years' },
            { rate: 50, years: '~17 years' },
            { rate: 65, years: '~10 years' },
          ].map((item) => {
            const isAbove = savingsRate >= item.rate;
            return (
              <View key={item.rate} style={styles.benchRow}>
                <ThemedText style={[styles.benchRate, { color: tc.textSecondary }, isAbove && { color: Brand.success }]}>
                  {item.rate}%{isAbove ? ' ✓' : ''}
                </ThemedText>
                <View style={[styles.benchBarTrack, { backgroundColor: tc.surfaceInner }]}>
                  <View style={[styles.benchBarFill, {
                    width: `${(item.rate / 65) * 100}%` as any,
                    backgroundColor: isAbove ? Brand.success : tc.borderColor,
                  }]} />
                </View>
                <ThemedText style={[styles.benchYears, { color: tc.textSecondary }, isAbove && { color: Brand.success }]}>{item.years}</ThemedText>
              </View>
            );
          })}
          <ThemedText style={[styles.benchNote, { color: tc.textMuted }]}>*Assumes 7% annual return, starting from $0</ThemedText>
        </ThemedView>

        {/* Actions */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>HOW TO RAISE YOUR RATE</ThemedText>
          {[
            'Live in barracks as long as possible — free housing is the biggest lever available to junior enlisted.',
            'BAH arbitrage: move off-base at E5+ and find housing under your BAH rate.',
            'Cook in the DFAC (free for some grades). Skip the $12 Chili\'s lunch.',
            'Sell the car if you live on post. BAH + no car payment = massive savings rate boost.',
            'Deploy. CZTE pay + zero expenses + SDP = years of savings in months.',
            'Auto-invest: direct deposit into TSP + Roth IRA before you can spend it.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={[styles.tipText, { color: tc.textSecondary }]}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
            FI projections assume constant 7% real return and fixed expenses. Actual results vary. The 4% rule is based on the Trinity Study (1998). Not financial advice.
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </ThemedView>
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.accent,
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.accent },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },

  autoFillNote: {
    backgroundColor: Brand.tactical + '15',
    borderRadius: 3,
    padding: Spacing.two,
    borderLeftWidth: 2,
    borderLeftColor: Brand.tactical,
  },
  autoFillText: { fontSize: 10, color: Brand.tactical },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '300', color: Brand.tactical },
  stepperValue: { fontSize: 13, fontWeight: '700', width: 80, textAlign: 'center', fontFamily: 'Courier New' },

  rateCenter: { alignItems: 'center', gap: Spacing.one },
  rateBig: { fontSize: 26, fontWeight: '900', fontFamily: 'Courier New' },
  gradeBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 3 },
  gradeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  gradeDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },

  rateTrack: { height: 8, borderRadius: 4, overflow: 'visible', marginTop: 4 },
  rateFill: { height: '100%', borderRadius: 4 },
  rateMarker: { position: 'absolute', width: 1, height: 12, top: -2 },
  rateMarkerLabels: { position: 'relative', height: 14 },
  rateMarkerLabel: { position: 'absolute', fontSize: 8, transform: [{ translateX: -8 }] },

  fiRow: { flexDirection: 'row', gap: Spacing.two },
  fiBox: { flex: 1, alignItems: 'center', borderRadius: 4, padding: Spacing.two, gap: 4 },
  fiBoxLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  fiBoxValue: { fontSize: 14, fontWeight: '900', fontFamily: 'Courier New' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: Brand.success, borderRadius: 3 },
  progressLabel: { fontSize: 10, textAlign: 'center' },

  benchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  benchRate: { width: 40, fontSize: 11, fontWeight: '700', fontFamily: 'Courier New' },
  benchBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  benchBarFill: { height: '100%', borderRadius: 3 },
  benchYears: { width: 72, fontSize: 10, textAlign: 'right' },
  benchNote: { fontSize: 9 },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.accent, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
