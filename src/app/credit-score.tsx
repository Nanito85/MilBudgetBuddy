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

function SectionLabel({ number, text }: { number: number; text: string }) {
  const tc = useThemeColors();
  return (
    <View style={ss.labelRow}>
      <View style={[ss.labelBadge, { borderColor: Brand.accent }]}>
        <ThemedText style={[ss.labelBadgeText, { color: Brand.accent }]}>{number}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={[ss.labelText, { color: tc.textPrimary }]}>{text}</ThemedText>
      <View style={[ss.labelLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

function SectionIntro({ text }: { text: string }) {
  const tc = useThemeColors();
  return (
    <ThemedText type="small" themeColor="textSecondary" style={ss.sectionIntro}>
      {text}
    </ThemedText>
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
            <ThemedText type="smallBold" style={[ss.factorLabel, { color: tc.textPrimary }]}>{factor.label}</ThemedText>
            <ThemedText style={[ss.factorPct, { color: factor.color, fontFamily: Fonts.data }]}>{factor.pct}%</ThemedText>
          </View>
          <View style={[ss.factorTrack, { backgroundColor: tc.surfaceInner }]}>
            <View style={[ss.factorFill, { width: `${factor.pct * 2.86}%` as any, backgroundColor: factor.color }]} />
          </View>
        </View>
        <ThemedText style={[ss.expandChevron, { color: tc.textMuted }, expanded && { transform: [{ rotate: '90deg' }] }]}>›</ThemedText>
      </View>
      {expanded && (
        <ThemedText type="small" themeColor="textSecondary" style={ss.factorTip}>{factor.tip}</ThemedText>
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
        <ThemedText type="small" themeColor="textSecondary" style={ss.subtitle}>
          A simple guide to what your credit score means, what moves it, and how to protect it — no finance background needed.
        </ThemedText>

        {/* 1 — Score ranges */}
        <View style={ss.section}>
          <SectionLabel number={1} text="Score Ranges" />
          <SectionIntro text="Your credit score is a 3-digit number from 300 to 850 that tells lenders how risky it is to lend you money. Higher is always better." />
          <TacticalCard accentColor={tc.borderColor} style={ss.rangesCard}>
            {SCORE_RANGES.map((r) => (
              <View key={r.label} style={ss.rangeRow}>
                <View style={[ss.rangeDot, { backgroundColor: r.color }]} />
                <View style={ss.rangeInfo}>
                  <View style={ss.rangeLabelRow}>
                    <ThemedText type="smallBold" style={[ss.rangeLabel, { color: r.color }]}>{r.label}</ThemedText>
                    <ThemedText style={[ss.rangeScore, { color: r.color, fontFamily: Fonts.data }]}>
                      {r.min}–{r.max}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={ss.rangeDesc}>{r.desc}</ThemedText>
                </View>
              </View>
            ))}
          </TacticalCard>
        </View>

        {/* 2 — 5 Factors */}
        <View style={ss.section}>
          <SectionLabel number={2} text="What Makes Up Your Score" />
          <SectionIntro text="Five factors combine to create your score, each weighted differently. Tap any factor below to see what it means and how to improve it." />
          <TacticalCard accentColor={Brand.accent} style={ss.factorsCard}>
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
        </View>

        {/* 3 — Action Items */}
        <View style={ss.section}>
          <SectionLabel number={3} text="How to Raise Your Score" />
          <SectionIntro text="Concrete steps you can take right now, ranked by how much impact each one has." />
          <TacticalCard accentColor={Brand.tactical} style={ss.actionsCard}>
            {ACTION_ITEMS.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={[ss.divider, { backgroundColor: tc.borderColor }]} />}
                <View style={ss.actionRow}>
                  <ThemedText style={ss.actionIcon}>{item.icon}</ThemedText>
                  <ThemedText type="small" themeColor="text" style={ss.actionText}>{item.text}</ThemedText>
                  <View style={[ss.impactBadge,
                    item.impact === 'HIGH' ? ss.impactHigh :
                    item.impact === 'MED' ? ss.impactMed : [ss.impactLow, { backgroundColor: tc.borderColor }]]}>
                    <ThemedText style={ss.impactText}>{item.impact}</ThemedText>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </TacticalCard>
        </View>

        {/* 4 — Military Protections */}
        <View style={ss.section}>
          <SectionLabel number={4} text="Your Military Protections" />
          <SectionIntro text="Federal laws give servicemembers extra financial protections civilians don't get. Know your rights." />
          <View style={ss.protectionsGrid}>
            {MILITARY_PROTECTIONS.map((p) => (
              <TacticalCard key={p.title} accentColor="#B71C1C" style={ss.protectCard}>
                <View style={ss.protectHeader}>
                  <ThemedText style={ss.protectIcon}>{p.icon}</ThemedText>
                  <ThemedText type="smallBold" style={[ss.protectTitle, { color: tc.textPrimary }]}>{p.title}</ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={ss.protectBody}>{p.body}</ThemedText>
              </TacticalCard>
            ))}
          </View>
        </View>

        {/* 5 — Why It Matters */}
        <View style={ss.section}>
          <SectionLabel number={5} text="Why It Matters for Military" />
          <SectionIntro text="Your score follows you into some of the biggest financial decisions of military life." />
          <TacticalCard accentColor={tc.borderColor} style={ss.impactCard}>
            {LIFE_IMPACTS.map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={[ss.divider, { backgroundColor: tc.borderColor }]} />}
                <View style={ss.lifeRow}>
                  <View style={[ss.lifeIcon, { backgroundColor: tc.surfaceInner }]}>
                    <ThemedText style={{ fontSize: 22 }}>{item.icon}</ThemedText>
                  </View>
                  <View style={{ flex: 1, gap: 3 }}>
                    <ThemedText type="smallBold" style={[ss.lifeLabel, { color: Brand.accent }]}>{item.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={ss.lifeDesc}>{item.desc}</ThemedText>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </TacticalCard>
        </View>

        {/* Disclaimer */}
        <View style={[ss.disclaimer, { borderColor: tc.borderColor }]}>
          <ThemedText type="small" themeColor="textMuted" style={ss.disclaimerText}>
            Credit scores are calculated by third-party bureaus. Check annualcreditreport.com for your official report. This screen is educational only.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const ss = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: Spacing.four, paddingHorizontal: Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  backBtn: { padding: 4 },
  backText: { color: Brand.tactical, fontSize: 12, fontWeight: '800', letterSpacing: 1, lineHeight: 17 },
  classBar: { backgroundColor: '#1A0000', paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: 2 },
  classText: { color: '#CC2020' },
  eyebrow: { color: Brand.tactical, fontSize: 10 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  subtitle: { marginTop: 6, marginBottom: Spacing.one, lineHeight: 20 },

  section: { gap: Spacing.two },

  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  labelBadge: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  labelBadgeText: { fontSize: 12, fontWeight: '800' },
  labelLine: { flex: 1, height: StyleSheet.hairlineWidth },
  labelText: { fontSize: 15, letterSpacing: 0.2, textTransform: 'none' },
  sectionIntro: { lineHeight: 20, paddingLeft: 30 },

  rangesCard: { gap: Spacing.three },
  rangeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  rangeDot: { width: 11, height: 11, borderRadius: 6, marginTop: 5 },
  rangeInfo: { flex: 1, gap: 3 },
  rangeLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rangeLabel: { fontSize: 13, letterSpacing: 0.5, textTransform: 'none' },
  rangeScore: { fontSize: 14, fontWeight: '700' },
  rangeDesc: { lineHeight: 19 },

  factorsCard: { gap: 0 },
  factorRow: { paddingVertical: Spacing.three, gap: Spacing.two },
  factorTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  factorIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  factorMid: { flex: 1, gap: 6 },
  factorLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  factorLabel: { fontSize: 13, textTransform: 'none' },
  factorPct: { fontSize: 15, fontWeight: '800' },
  factorTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  factorFill: { height: '100%', borderRadius: 3 },
  expandChevron: { fontSize: 20, width: 18, textAlign: 'center' },
  factorTip: { lineHeight: 20, marginLeft: 38, marginTop: 2 },

  actionsCard: { gap: Spacing.three },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  actionIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  actionText: { flex: 1, lineHeight: 19 },
  impactBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  impactHigh: { backgroundColor: '#00C8A825' },
  impactMed: { backgroundColor: '#C8A80025' },
  impactLow: {},
  impactText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  protectionsGrid: { gap: Spacing.two },
  protectCard: { gap: Spacing.two },
  protectHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  protectIcon: { fontSize: 20 },
  protectTitle: { fontSize: 14, flex: 1, textTransform: 'none' },
  protectBody: { lineHeight: 20 },

  impactCard: { gap: 0 },
  lifeRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.three, gap: Spacing.two },
  lifeIcon: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  lifeLabel: { fontSize: 14, textTransform: 'none' },
  lifeDesc: { lineHeight: 19 },

  divider: { height: StyleSheet.hairlineWidth },
  disclaimer: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 4, padding: Spacing.three },
  disclaimerText: { textAlign: 'center', lineHeight: 17 },
});
