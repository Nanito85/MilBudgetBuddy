import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

interface Step {
  id: string;
  order: number;
  icon: string;
  title: string;
  why: string;
  how: string;
  target: string;
  color: string;
}

const STEPS: Step[] = [
  {
    id: 'tsp_match',
    order: 1,
    icon: '🎯',
    title: 'Max TSP BRS Match (5%)',
    why: 'Free money. The DoD matches up to 5% of base pay under BRS. Every dollar you skip is a 100% loss.',
    how: 'Log into MyPay or your HR system. Set TSP contribution to at least 5% of base pay. This is automatic for BRS soldiers — verify it\'s active.',
    target: 'Minimum 5% of base pay — period.',
    color: '#00B27A',
  },
  {
    id: 'e_fund',
    order: 2,
    icon: '🏦',
    title: 'Build $1,000 Emergency Fund',
    why: 'One car repair without savings = credit card debt at 20%+ APR. Even a small buffer breaks the debt cycle.',
    how: 'Open a free high-yield savings account (Ally, Marcus, SoFi). Auto-transfer $50–$100 after each payday until you hit $1,000. Do not touch it.',
    target: '$1,000 cash (then grow to 3 months of expenses later)',
    color: '#1565C0',
  },
  {
    id: 'hid',
    order: 3,
    icon: '💳',
    title: 'Eliminate High-Interest Debt',
    why: 'Any debt above 7% APR (credit cards, payday loans, some car loans) is guaranteed -7% to -29% return on your money.',
    how: 'List all debts with balances and APRs. Pay minimums on everything. Throw every extra dollar at the highest APR first (avalanche method).',
    target: 'Zero balances on cards >7% APR',
    color: '#D32F2F',
  },
  {
    id: 'roth',
    order: 4,
    icon: '📈',
    title: 'Max Roth IRA ($7,500/year)',
    why: 'Your military income is likely low enough for Roth eligibility. Tax-free growth forever. $7.5K/yr from E3 to 20 YOS = ~$500K tax-free by retirement.',
    how: 'Open a Roth IRA at Fidelity, Vanguard, or Schwab (all free). Buy a total market index fund (e.g. FSKAX, VTI). Set auto-invest for $625/month.',
    target: '$7,500/year ($625/month)',
    color: '#6A1B9A',
  },
  {
    id: 'tsp_max',
    order: 5,
    icon: '🚀',
    title: 'Max TSP ($24,500/year)',
    why: 'Once Roth IRA is maxed, TSP is the next best tax-advantaged account. Traditional TSP gives you a tax deduction now.',
    how: 'In MyPay, increase TSP contribution to reach the IRS limit ($24,500 for FY2026). Combat zone contributions can go up to $72,000/year.',
    target: '$24,500/year (or $72K if deployed to CZ)',
    color: '#00695C',
  },
  {
    id: 'taxable',
    order: 6,
    icon: '🌐',
    title: 'Taxable Brokerage Investing',
    why: 'After maxing tax-advantaged accounts, a taxable brokerage lets you invest with no contribution limits.',
    how: 'Open a brokerage account at Fidelity or Schwab. Invest in low-cost index funds. Focus on buy-and-hold — no day trading.',
    target: 'Any amount above your monthly needs',
    color: '#C8A800',
  },
];

function StepCard({ step, checked, onToggle }: {
  step: Step;
  checked: boolean;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tc = useThemeColors();

  return (
    <View style={[styles.stepCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }, checked && styles.stepCardDone]}>
      {/* Step number bar */}
      <View style={[styles.stepBar, { backgroundColor: step.color }]} />

      <View style={styles.stepContent}>
        {/* Header row */}
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={styles.stepHeader}>
          <View style={[styles.stepNum, { borderColor: step.color }]}>
            <ThemedText style={[styles.stepNumText, { color: step.color }]}>{step.order}</ThemedText>
          </View>
          <ThemedText style={styles.stepIcon}>{step.icon}</ThemedText>
          <View style={styles.stepMeta}>
            <ThemedText style={[styles.stepTitle, { color: tc.textPrimary }, checked && [styles.stepTitleDone, { color: tc.textMuted }]]}>
              {step.title.toUpperCase()}
            </ThemedText>
            <ThemedText style={[styles.stepTarget, { color: tc.textHint }]}>{step.target}</ThemedText>
          </View>
          <Pressable
            onPress={onToggle}
            style={[styles.checkBox, { borderColor: tc.borderColor }, checked && { backgroundColor: step.color, borderColor: step.color }]}>
            {checked && <ThemedText style={styles.checkMark}>✓</ThemedText>}
          </Pressable>
        </Pressable>

        {/* Expanded detail */}
        {expanded && (
          <View style={styles.stepDetail}>
            <View style={[styles.detailDivider, { backgroundColor: tc.borderColor }]} />
            <View style={styles.detailBlock}>
              <ThemedText style={[styles.detailLabel, { color: step.color }]}>WHY THIS MATTERS</ThemedText>
              <ThemedText style={[styles.detailText, { color: tc.textSecondary }]}>{step.why}</ThemedText>
            </View>
            <View style={styles.detailBlock}>
              <ThemedText style={[styles.detailLabel, { color: step.color }]}>HOW TO DO IT</ThemedText>
              <ThemedText style={[styles.detailText, { color: tc.textSecondary }]}>{step.how}</ThemedText>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

export default function MoneyFlowchartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const completedCount = Object.values(checked).filter(Boolean).length;
  const progressPct = (completedCount / STEPS.length) * 100;

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Money Flowchart</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>SINGLE SERVICE MEMBER</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>The Military Money Order</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
            Six steps in priority order. Do Step 1 before Step 2. Check each off as you complete it.
          </ThemedText>
        </ThemedView>

        {/* Progress */}
        <ThemedView type="backgroundElement" style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressLabel}>MISSION STATUS</ThemedText>
            <ThemedText style={[styles.progressCount, { color: tc.textPrimary }]}>{completedCount}/{STEPS.length} STEPS</ThemedText>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: tc.surfaceInner }]}>
            <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          {completedCount === STEPS.length && (
            <ThemedText style={styles.progressComplete}>
              🎖️ MISSION ACCOMPLISHED — Financial independence protocol engaged.
            </ThemedText>
          )}
        </ThemedView>

        {/* Steps */}
        {STEPS.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            checked={!!checked[step.id]}
            onToggle={() => toggle(step.id)}
          />
        ))}

        {/* Note */}
        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerTitle}>⚠ Deployment Exception</ThemedText>
          <ThemedText style={[styles.disclaimerText, { color: tc.textHint }]}>
            If you are deployed to a Combat Zone (CZTE), skip to Step 5 first. Your income is tax-exempt and TSP contributions jump to $72K/yr. Attack it.
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
    borderLeftColor: Brand.tactical,
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.tactical },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  progressCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical },
  progressCount: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier New' },
  progressTrack: { height: 6, backgroundColor: '#0D1E30', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Brand.success, borderRadius: 3 },
  progressComplete: { fontSize: 12, color: Brand.success, textAlign: 'center', fontWeight: '700' },

  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepCardDone: { opacity: 0.65 },
  stepBar: { width: 4 },
  stepContent: { flex: 1, padding: Spacing.two },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 11, fontWeight: '800' },
  stepIcon: { fontSize: 20 },
  stepMeta: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  stepTitleDone: { textDecorationLine: 'line-through' },
  stepTarget: { fontSize: 9 },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 14, fontWeight: '900', color: '#04080F' },

  stepDetail: { gap: Spacing.two, marginTop: Spacing.one },
  detailDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  detailBlock: { gap: 4 },
  detailLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  detailText: { fontSize: 12, lineHeight: 18 },

  disclaimer: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.warning,
    gap: 6,
  },
  disclaimerTitle: { fontSize: 12, fontWeight: '700', color: Brand.warning },
  disclaimerText: { fontSize: 11, lineHeight: 17 },
});
