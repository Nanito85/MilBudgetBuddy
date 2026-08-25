import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

// SBP constants (FY2026)
const SBP_ANNUITY_PCT   = 0.55;   // spouse receives 55% of covered base
const SBP_PREMIUM_PCT   = 0.065;  // 6.5% of covered base
const SBP_MAX_BASE_PCT  = 1.0;    // covered base up to 100% of retirement pay

function fmtDollar(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtPct(n: number) {
  return (n * 100).toFixed(1) + '%';
}

interface SbpResult {
  coveredBase: number;
  monthlyPremium: number;
  annualPremium: number;
  monthlyAnnuity: number;
  annualAnnuity: number;
  breakEvenMonths: number;
  breakEvenYears: number;
  totalPremiums30yr: number;
  totalAnnuity30yr: number;
  netBenefit30yr: number;
}

function calcSbp(retirementPay: number, coveragePct: number): SbpResult {
  const coveredBase    = retirementPay * coveragePct;
  const monthlyPremium = coveredBase * SBP_PREMIUM_PCT;
  const annualPremium  = monthlyPremium * 12;
  const monthlyAnnuity = coveredBase * SBP_ANNUITY_PCT;
  const annualAnnuity  = monthlyAnnuity * 12;

  // Break-even: total premiums paid = first annuity payment
  // Months of annuity to recover total premiums paid up to death
  // Simplified: at break-even, premiums_paid = annuity received
  // If retiree lives to collect N months of premium:
  //   premiums_paid = N * monthlyPremium
  //   annuity_received (by spouse) = breakEvenMonths * monthlyAnnuity
  //   breakEvenMonths = premiums_paid / monthlyAnnuity
  //   But we don't know N. Standard industry break-even:
  //   "how many months of annuity does the spouse need to recoup all premiums?"
  //   Assume 30yr premium payment period → total premiums / monthlyAnnuity
  const totalPremiums30yr = annualPremium * 30;
  const totalAnnuity30yr  = annualAnnuity * 30;
  const netBenefit30yr    = totalAnnuity30yr - totalPremiums30yr;
  const breakEvenMonths   = totalPremiums30yr / monthlyAnnuity;
  const breakEvenYears    = breakEvenMonths / 12;

  return {
    coveredBase,
    monthlyPremium,
    annualPremium,
    monthlyAnnuity,
    annualAnnuity,
    breakEvenMonths,
    breakEvenYears,
    totalPremiums30yr,
    totalAnnuity30yr,
    netBenefit30yr,
  };
}

const COVERAGE_OPTIONS = [
  { label: 'Full (100%)', value: 1.0 },
  { label: '75%', value: 0.75 },
  { label: '50%', value: 0.5 },
  { label: '25%', value: 0.25 },
];

export default function SbpCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const storeGrade = useUserStore((s) => s.payGrade);
  const storeYos   = useUserStore((s) => s.yos);

  // Estimated retirement pay = 2.5% × YOS × basic pay (High-3 proxy)
  // User can override
  const [retirementPay, setRetirementPay] = useState<number>(() => {
    try {
      const { getBasicPay } = require('@/data/basic-pay-rates');
      const pay = getBasicPay(storeGrade ?? 'E7', storeYos ?? 20);
      return Math.round(pay * 0.025 * (storeYos ?? 20));
    } catch {
      return 2000;
    }
  });
  const [coverage, setCoverage] = useState(1.0);
  const [spouseAge, setSpouseAge] = useState(45);
  const [retireeAge, setRetireeAge] = useState(45);

  const result = useMemo(() => calcSbp(retirementPay, coverage), [retirementPay, coverage]);

  // Estimated life expectancy — spouse collects after retiree dies
  // If retiree dies at 75 and spouse is 5yr younger → spouse collects from 75 to ~82 (avg female LE)
  const spouseAgeDiff = retireeAge - spouseAge;
  const estRetireeDeathAge = 78;
  const spouseAgeAtClaim = estRetireeDeathAge - spouseAgeDiff;
  const spouseLE = 84;
  const estCollectYears = Math.max(0, spouseLE - spouseAgeAtClaim);
  const estAnnuityTotal = result.monthlyAnnuity * 12 * estCollectYears;
  // Premiums stop once SBP is "paid-up" (30 years of premiums — same cap the
  // break-even card above assumes, and what the "What is SBP?" card states).
  // Without this cap, a retiree who retires young at 38-45 (this screen's
  // own age-input range) and lives to 78 would be charged 33-40 years of
  // premiums here while every other card on this same screen assumes 30.
  const premiumYears = Math.min(Math.max(0, estRetireeDeathAge - retireeAge), 30);
  const estPremiumTotal = result.annualPremium * premiumYears;
  const estNetBenefit = estAnnuityTotal - estPremiumTotal;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>SBP Calculator</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* What is SBP */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>WHAT IS SBP?</ThemedText>
          <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
            The Survivor Benefit Plan pays your spouse 55% of your covered retirement base if you die first. You pay a 6.5% monthly premium deducted from your retirement pay. After 30 years of premiums (age 70+ and 30yr service), coverage is paid-up — free for life.
          </ThemedText>
        </ThemedView>

        {/* Inputs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>YOUR INPUTS</ThemedText>

          <NumberStepper
            label={`Monthly Retirement Pay: ${fmtDollar(retirementPay)}`}
            value={retirementPay}
            onChange={setRetirementPay}
            min={500}
            max={15000}
            step={50}
          />

          <View style={{ gap: Spacing.one }}>
            <ThemedText style={[styles.fieldLabel, { color: tc.textHint }]}>COVERAGE BASE</ThemedText>
            <View style={styles.chipRow}>
              {COVERAGE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setCoverage(opt.value)}
                  style={[styles.chip, { borderColor: tc.borderColor }, coverage === opt.value && styles.chipActive]}>
                  <ThemedText style={[styles.chipText, { color: tc.textHint }, coverage === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <NumberStepper
            label={`Your Age: ${retireeAge}`}
            value={retireeAge}
            onChange={setRetireeAge}
            min={38}
            max={80}
            step={1}
          />
          <NumberStepper
            label={`Spouse Age: ${spouseAge}`}
            value={spouseAge}
            onChange={setSpouseAge}
            min={20}
            max={80}
            step={1}
          />
        </ThemedView>

        {/* Results */}
        <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: Brand.tactical }]}>
          <ThemedText style={styles.resultEyebrow}>MONTHLY BREAKDOWN</ThemedText>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Covered base</ThemedText>
            <ThemedText style={[styles.resultValue, { color: tc.textPrimary }]}>{fmtDollar(result.coveredBase)}/mo</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Your premium (6.5%)</ThemedText>
            <ThemedText style={[styles.resultValue, { color: Brand.danger }]}>−{fmtDollar(result.monthlyPremium)}/mo</ThemedText>
          </View>
          <View style={[styles.resultRow, styles.resultRowHighlight]}>
            <ThemedText style={[styles.resultLabel, { color: Brand.tactical }]}>Spouse annuity (55%)</ThemedText>
            <ThemedText style={[styles.resultValue, { color: Brand.tactical }]}>{fmtDollar(result.monthlyAnnuity)}/mo</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Annual premium</ThemedText>
            <ThemedText style={[styles.resultValue, { color: tc.textPrimary }]}>{fmtDollar(result.annualPremium)}/yr</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Annual annuity (to spouse)</ThemedText>
            <ThemedText style={[styles.resultValue, { color: tc.textPrimary }]}>{fmtDollar(result.annualAnnuity)}/yr</ThemedText>
          </View>
        </ThemedView>

        {/* Break-even & projection */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>BREAK-EVEN ANALYSIS (30-YR PREMIUMS)</ThemedText>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Total premiums (30 yr)</ThemedText>
            <ThemedText style={[styles.resultValue, { color: tc.textPrimary }]}>{fmtDollar(result.totalPremiums30yr)}</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Break-even for spouse</ThemedText>
            <ThemedText style={[styles.resultValue, { color: tc.textPrimary }]}>{result.breakEvenYears.toFixed(1)} yrs of annuity</ThemedText>
          </View>
          <ThemedText style={[styles.hintText, { color: tc.textMuted }]}>
            Your spouse must receive the annuity for at least {result.breakEvenYears.toFixed(1)} years to recoup all premiums paid.
          </ThemedText>
        </ThemedView>

        {/* Age-based projection */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>ESTIMATED SCENARIO (ACTUARIAL)</ThemedText>
          <ThemedText style={[styles.hintText, { color: tc.textMuted }]}>
            Assumes you die at 78, spouse lives to 84. Adjust ages above to model different scenarios.
          </ThemedText>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Premiums you pay</ThemedText>
            <ThemedText style={[styles.resultValue, { color: Brand.danger }]}>{fmtDollar(estPremiumTotal)}</ThemedText>
          </View>
          <View style={styles.resultRow}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Spouse collects (~{estCollectYears} yrs)</ThemedText>
            <ThemedText style={[styles.resultValue, { color: Brand.tactical }]}>{fmtDollar(estAnnuityTotal)}</ThemedText>
          </View>
          <View style={[styles.resultRow, styles.resultRowHighlight]}>
            <ThemedText style={[styles.resultLabel, { color: tc.textSecondary, fontWeight: '700' }]}>Net benefit to family</ThemedText>
            <ThemedText style={[styles.resultValue, { color: estNetBenefit >= 0 ? Brand.success : Brand.danger, fontWeight: '700' }]}>
              {estNetBenefit >= 0 ? '+' : ''}{fmtDollar(estNetBenefit)}
            </ThemedText>
          </View>
        </ThemedView>

        {/* Key considerations */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>KEY CONSIDERATIONS</ThemedText>
          {[
            { icon: '✅', text: 'Paid-up after 30 years of premiums AND age 70 — coverage continues free.' },
            { icon: 'ℹ️', text: 'The SBP-DIC offset ("Widow\'s Tax") was fully repealed effective Jan 1, 2023. Spouses who qualify for both SBP and VA DIC now receive both in full — no reduction to either.' },
            { icon: '📋', text: 'You must elect SBP at retirement. The window closes — you cannot add it later without a qualifying life event.' },
            { icon: '💰', text: 'Premiums are pre-tax, reducing your taxable income. The annuity is taxable income to your spouse.' },
            { icon: '🔄', text: 'If your spouse dies before you, SBP coverage is suspended and premiums stop (no eligible beneficiary). If you remarry, coverage automatically reactivates for your new spouse after 1 year of marriage (or sooner if you have a child together) — notify DFAS promptly or you may owe back premiums.' },
          ].map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <ThemedText style={styles.bulletIcon}>{item.icon}</ThemedText>
              <ThemedText style={[styles.bulletText, { color: tc.textSecondary }]}>{item.text}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.noteCard}>
          <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
            Estimates only. SBP annuity rates and DIC amounts are subject to COLA adjustments. Consult your installation finance office or a military financial advisor before making an SBP election.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  bodyText: { fontSize: 13, lineHeight: 20 },
  hintText: { fontSize: 11, lineHeight: 16 },

  fieldLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4,
    borderWidth: 1,
  },
  chipActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  chipText: { fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: '#000' },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one + 2, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  resultRowHighlight: {
    backgroundColor: Brand.tactical + '12',
    borderRadius: 4,
    paddingHorizontal: Spacing.one,
    marginHorizontal: -Spacing.one,
  },
  resultLabel: { fontSize: 13, flex: 1 },
  resultValue: { fontSize: 14, fontWeight: '700' },

  bulletRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  bulletIcon: { fontSize: 14, width: 22 },
  bulletText: { flex: 1, fontSize: 12, lineHeight: 18 },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, lineHeight: 16 },
});
