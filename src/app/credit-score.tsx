import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

// ── Data ───────────────────────────────────────────────────────────────────────

const SCORE_RANGES = [
  { label: 'EXCEPTIONAL',  min: 800, max: 850, color: '#00C8A8', desc: 'Best rates on everything. VA loan lenders compete for you.' },
  { label: 'VERY GOOD',    min: 740, max: 799, color: '#2A9D8F', desc: 'Near-top rates. Strong VA loan approval odds.' },
  { label: 'GOOD',         min: 670, max: 739, color: '#C8A800', desc: 'Approved for most loans but not the best rates.' },
  { label: 'FAIR',         min: 580, max: 669, color: '#E76F51', desc: 'Higher rates, some lenders may decline.' },
  { label: 'POOR',         min: 300, max: 579, color: '#CC2020', desc: 'Limited access to credit. Focus on rebuilding now.' },
];

const FACTORS = [
  {
    pct: 35,
    label: 'PAYMENT HISTORY',
    icon: '📅',
    color: '#00C8A8',
    tip: 'Pay every bill on time, every month. One late payment can drop your score 50–100 points. Set up autopay for at least the minimum on every account.',
  },
  {
    pct: 30,
    label: 'CREDIT UTILIZATION',
    icon: '💳',
    color: '#C8A800',
    tip: 'Keep your credit card balances below 30% of your limit. If your limit is $5,000, try to stay under $1,500. Under 10% is even better.',
  },
  {
    pct: 15,
    label: 'LENGTH OF HISTORY',
    icon: '📆',
    color: '#2A9D8F',
    tip: "Don't close old credit cards even if you don't use them — as long as they have no annual fee. Closing them shortens your credit history and hurts your score.",
  },
  {
    pct: 10,
    label: 'CREDIT MIX',
    icon: '🗂',
    color: '#E76F51',
    tip: 'Having both revolving credit (credit cards) and installment loans (car, mortgage) shows lenders you can manage different types of debt.',
  },
  {
    pct: 10,
    label: 'NEW CREDIT',
    icon: '🆕',
    color: '#9B59B6',
    tip: "Opening too many new accounts in a short period looks risky. Each application triggers a hard inquiry, which drops your score by ~5 points. Space out applications.",
  },
];

const MILITARY_PROTECTIONS = [
  {
    icon: '🛡',
    title: 'SCRA — 6% Interest Cap',
    body: 'The Servicemembers Civil Relief Act limits interest on debts you had BEFORE active duty — credit cards, car loans, mortgages — to 6% while you are on active duty. You must request it in writing with a copy of your orders.',
  },
  {
    icon: '⚖️',
    title: 'MLA — 36% APR Cap',
    body: 'The Military Lending Act caps interest on new loans (payday loans, title loans, tax refund loans) at 36% APR for active-duty members. Any lender charging more is breaking federal law.',
  },
  {
    icon: '🔒',
    title: 'Free Credit Freeze',
    body: "You can freeze your credit at all three bureaus for free. This stops anyone from opening new accounts in your name. Smart to do during deployment when you can't monitor your credit.",
  },
  {
    icon: '📋',
    title: 'Free Annual Credit Reports',
    body: 'Pull all three reports — Equifax, Experian, TransUnion — free at annualcreditreport.com. Look for accounts you don\'t recognize, wrong balances, or fraudulent activity. Dispute errors in writing.',
  },
];

const ACTION_ITEMS = [
  { icon: '✅', text: 'Set up autopay for at least the minimum on every account', impact: 'HIGH' },
  { icon: '📉', text: 'Pay down credit card balances — target under 30% utilization', impact: 'HIGH' },
  { icon: '🚫', text: "Don't close old accounts with no annual fee", impact: 'MED' },
  { icon: '🔍', text: 'Check your credit report for errors and dispute anything wrong', impact: 'MED' },
  { icon: '⏸', text: 'Avoid applying for new credit unless you need it', impact: 'LOW' },
  { icon: '👥', text: 'Ask a family member to add you as an authorized user on their oldest card', impact: 'MED' },
];

const LIFE_IMPACTS = [
  { icon: '🏠', label: 'VA Loan',     desc: 'A 760+ score gets you the best VA loan rate. A 620 vs 760 can cost $200+/mo on the same house.' },
  { icon: '🚗', label: 'Car Loan',    desc: 'PCS requires a new car for many members. A good score means 3–5% rates vs 10–15%.' },
  { icon: '🔑', label: 'Renting',     desc: 'Landlords near military bases run credit checks. A poor score can lead to denied applications.' },
  { icon: '🔐', label: 'Clearance',   desc: 'Financial stress is the #1 reason clearances are revoked. Debt issues are a security risk.' },
];

// ── Components ─────────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const tc = useThemeColors();
  return (
    <View style={ss.labelRow}>
      <View style={[ss.labelLine, { backgroundColor: tc.borderColor }]} />
      <ThemedText type="label" style={[ss.labelText, { color: tc.textMuted }]}>{text}</ThemedText>
      <View style={[ss.labelLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

function FactorRow({ factor, expanded, onToggle }: { factor: typeof FACTORS[0]; expanded: boolean; onToggle: () => void }) {
  const tc = useThemeColors();
  return (
    <Pressable onPress={onToggle} style={ss.factorRow}>
      <View style={ss.factorTop}>
        <ThemedText style={ss.factorIcon}>{factor.icon}</ThemedText>
        <View style={ss.factorMid}>
          <View style={ss.factorLabelRow}>
            <ThemedText type="label" style={[ss.factorLabel, { color: tc.textPrimary }]}>{factor.label}</ThemedText>
            <ThemedText style={[ss.factorPct, { color: factor.color, fontFamily: Fonts.data }]}>{factor.pct}%</ThemedText>
          </View>
          <View style={[ss.factorTrack, { backgroundColor: tc.surfaceInner }]}>
            <View style={[ss.factorFill, { width: `${factor.pct * 2.86}%` as any, backgroundColor: factor.color }]} />
          </View>
        </View>
        <ThemedText style={[ss.expandChevron, { color: tc.textMuted }, expanded && { transform: [{ rotate: '90deg' }] }]}>›</ThemedText>
      </View>
      {expanded && (
        <ThemedText type="label" style={[ss.factorTip, { color: tc.textHint }]}>{factor.tip}</ThemedText>
      )}
    </Pressable>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CreditScoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const [expandedFactor, setExpandedFactor] = useState<number | null>(null);

  return (
    <ThemedView style={ss.container}>
      <ScrollView
        contentContainerStyle={[ss.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[ss.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.back()} style={ss.backBtn}>
            <ThemedText style={ss.backText}>‹ BACK</ThemedText>
          </Pressable>
          <View style={ss.classBar}>
            <ThemedText type="classified" style={ss.classText}>FOR OFFICIAL USE ONLY</ThemedText>
          </View>
        </View>

        <ThemedText type="label" style={ss.eyebrow}>// FINANCIAL INTEL</ThemedText>
        <ThemedText style={[ss.title, { color: tc.textPrimary }]}>CREDIT SCORE</ThemedText>
        <ThemedText type="label" style={[ss.subtitle, { color: tc.textMuted }]}>UNDERSTANDING · BUILDING · PROTECTING</ThemedText>

        {/* Score ranges */}
        <SectionLabel text="SCORE RANGES" />
        <TacticalCard accentColor={tc.borderColor} style={ss.rangesCard}>
          {SCORE_RANGES.map((r) => (
            <View key={r.label} style={ss.rangeRow}>
              <View style={[ss.rangeDot, { backgroundColor: r.color }]} />
              <View style={ss.rangeInfo}>
                <View style={ss.rangeLabelRow}>
                  <ThemedText type="label" style={[ss.rangeLabel, { color: r.color }]}>{r.label}</ThemedText>
                  <ThemedText style={[ss.rangeScore, { color: r.color, fontFamily: Fonts.data }]}>
                    {r.min}–{r.max}
                  </ThemedText>
                </View>
                <ThemedText type="label" style={[ss.rangeDesc, { color: tc.textHint }]}>{r.desc}</ThemedText>
              </View>
            </View>
          ))}
        </TacticalCard>

        {/* 5 Factors */}
        <SectionLabel text="WHAT MAKES UP YOUR SCORE" />
        <TacticalCard accentColor={Brand.accent} style={ss.factorsCard}>
          <ThemedText type="label" style={[ss.factorsIntro, { color: tc.textHint }]}>
            Tap each factor to learn what it means and how to improve it.
          </ThemedText>
          {FACTORS.map((f, i) => (
            <React.Fragment key={f.label}>
              {i > 0 && <View style={[ss.divider, { backgroundColor: tc.borderColor }]} />}
              <FactorRow
                factor={f}
                expanded={expandedFactor === i}
                onToggle={() => setExpandedFactor(expandedFactor === i ? null : i)}
              />
            </React.Fragment>
          ))}
        </TacticalCard>

        {/* Action Items */}
        <SectionLabel text="HOW TO RAISE YOUR SCORE" />
        <TacticalCard accentColor={Brand.tactical} style={ss.actionsCard}>
          {ACTION_ITEMS.map((item, i) => (
            <View key={i} style={ss.actionRow}>
              <ThemedText style={ss.actionIcon}>{item.icon}</ThemedText>
              <ThemedText type="label" style={[ss.actionText, { color: tc.textPrimary }]}>{item.text}</ThemedText>
              <View style={[ss.impactBadge,
                item.impact === 'HIGH' ? ss.impactHigh :
                item.impact === 'MED' ? ss.impactMed : [ss.impactLow, { backgroundColor: tc.borderColor }]]}>
                <ThemedText type="label" style={ss.impactText}>{item.impact}</ThemedText>
              </View>
            </View>
          ))}
        </TacticalCard>

        {/* Military Protections */}
        <SectionLabel text="YOUR MILITARY PROTECTIONS" />
        <View style={ss.protectionsGrid}>
          {MILITARY_PROTECTIONS.map((p) => (
            <TacticalCard key={p.title} accentColor="#B71C1C" style={ss.protectCard}>
              <View style={ss.protectHeader}>
                <ThemedText style={ss.protectIcon}>{p.icon}</ThemedText>
                <ThemedText type="label" style={[ss.protectTitle, { color: tc.textPrimary }]}>{p.title}</ThemedText>
              </View>
              <ThemedText type="label" style={[ss.protectBody, { color: tc.textHint }]}>{p.body}</ThemedText>
            </TacticalCard>
          ))}
        </View>

        {/* Why It Matters */}
        <SectionLabel text="WHY IT MATTERS FOR MILITARY" />
        <TacticalCard accentColor={tc.borderColor} style={ss.impactCard}>
          {LIFE_IMPACTS.map((item, i) => (
            <React.Fragment key={item.label}>
              {i > 0 && <View style={[ss.divider, { backgroundColor: tc.borderColor }]} />}
              <View style={ss.lifeRow}>
                <View style={[ss.lifeIcon, { backgroundColor: tc.surfaceInner }]}>
                  <ThemedText style={{ fontSize: 20 }}>{item.icon}</ThemedText>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="label" style={ss.lifeLabel}>{item.label}</ThemedText>
                  <ThemedText type="label" style={[ss.lifeDesc, { color: tc.textHint }]}>{item.desc}</ThemedText>
                </View>
              </View>
            </React.Fragment>
          ))}
        </TacticalCard>

        {/* Disclaimer */}
        <View style={[ss.disclaimer, { borderColor: tc.borderColor }]}>
          <ThemedText type="label" style={[ss.disclaimerText, { color: tc.textMuted }]}>
            Credit scores are calculated by third-party bureaus. Check annualcreditreport.com for your official report. This screen is educational only.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.three, paddingHorizontal: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  backBtn: { padding: 4 },
  backText: { color: Brand.tactical, fontSize: 11, fontWeight: '800', letterSpacing: 1, lineHeight: 16 },
  classBar: { backgroundColor: '#1A0000', paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: 2 },
  classText: { color: '#CC2020' },
  eyebrow: { color: Brand.tactical, fontSize: 9 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 4 },
  subtitle: { color: '#3D6080', fontSize: 9, marginTop: 2, marginBottom: Spacing.one },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  labelLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  labelText: { color: '#3D6080', fontSize: 9 },

  rangesCard: { gap: Spacing.two + 2 },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  rangeDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  rangeInfo: { flex: 1, gap: 2 },
  rangeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rangeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rangeScore: { fontSize: 12, fontWeight: '700' },
  rangeDesc: { color: '#4D7A9A', fontSize: 9, lineHeight: 14 },

  factorsCard: { gap: 0 },
  factorsIntro: { color: '#4D7A9A', fontSize: 9, marginBottom: Spacing.two },
  factorRow: { paddingVertical: Spacing.two, gap: Spacing.one },
  factorTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  factorIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  factorMid: { flex: 1, gap: 4 },
  factorLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factorLabel: { color: '#C8D8E8', fontSize: 10 },
  factorPct: { fontSize: 14, fontWeight: '800' },
  factorTrack: { height: 4, backgroundColor: '#0D1E30', borderRadius: 2, overflow: 'hidden' },
  factorFill: { height: '100%', borderRadius: 2 },
  expandChevron: { color: '#3D6080', fontSize: 18, width: 16, textAlign: 'center' },
  factorTip: { color: '#4D7A9A', fontSize: 9, lineHeight: 15, marginLeft: 36, marginTop: 4 },

  actionsCard: { gap: Spacing.two },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  actionIcon: { fontSize: 16, width: 24, textAlign: 'center' },
  actionText: { flex: 1, color: '#C8D8E8', fontSize: 9, lineHeight: 14 },
  impactBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2 },
  impactHigh: { backgroundColor: '#00C8A820' },
  impactMed: { backgroundColor: '#C8A80020' },
  impactLow: { backgroundColor: '#1A3A5C' },
  impactText: { fontSize: 8 },

  protectionsGrid: { gap: Spacing.two },
  protectCard: { gap: Spacing.one + 2 },
  protectHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  protectIcon: { fontSize: 18 },
  protectTitle: { color: '#C8D8E8', fontSize: 10, flex: 1 },
  protectBody: { color: '#4D7A9A', fontSize: 9, lineHeight: 14 },

  impactCard: { gap: 0 },
  lifeRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.two, gap: Spacing.two },
  lifeIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: '#0D1E30', alignItems: 'center', justifyContent: 'center' },
  lifeLabel: { color: Brand.accent, fontSize: 10 },
  lifeDesc: { color: '#4D7A9A', fontSize: 9, lineHeight: 14 },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  disclaimer: { borderWidth: StyleSheet.hairlineWidth, borderColor: Brand.border, borderRadius: 4, padding: Spacing.two + 4 },
  disclaimerText: { color: '#3D6080', fontSize: 8, textAlign: 'center', lineHeight: 13 },
});
