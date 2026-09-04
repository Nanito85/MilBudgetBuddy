import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

// FY2026 hostile fire / IDP
const IDP_MONTHLY = 225;
// Savings Deposit Program: 10% annual on deposits up to $10,000
const SDP_RATE = 0.10;

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Stepper({ label, value, step, min, max, onChange, unit }: {
  label: string; value: number; step: number; min: number; max: number;
  onChange: (v: number) => void; unit?: string;
}) {
  const tc = useThemeColors();
  return (
    <View style={styles.stepperRow}>
      <ThemedText style={[styles.stepperLabel, { color: tc.textSecondary }]}>{label}</ThemedText>
      <View style={styles.stepperControls}>
        <Pressable style={[styles.stepBtn, { borderColor: tc.borderColor, backgroundColor: tc.background }]} onPress={() => onChange(Math.max(min, value - step))}>
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <ThemedText style={[styles.stepperValue, { color: tc.textPrimary }]}>{unit === 'mo' ? `${value} mo` : fmt(value)}</ThemedText>
        <Pressable style={[styles.stepBtn, { borderColor: tc.borderColor, backgroundColor: tc.background }]} onPress={() => onChange(Math.min(max, value + step))}>
          <ThemedText style={styles.stepBtnText}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value, bold, color, sub }: {
  label: string; value: string; bold?: boolean; color?: string; sub?: string;
}) {
  const tc = useThemeColors();
  return (
    <View style={styles.dataRow}>
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.dataLabel, { color: tc.textHint }]}>{label}</ThemedText>
        {sub && <ThemedText style={[styles.dataSub, { color: tc.textMuted }]}>{sub}</ThemedText>}
      </View>
      <ThemedText style={[styles.dataValue, { color: tc.textSecondary }, bold && { fontWeight: '700', color: color ?? tc.textPrimary }]}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function DeploymentSavingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [czte, setCzte]           = useState(true);
  const [idp,  setIdp]            = useState(true);
  const [months, setMonths]       = useState(9);
  const [basePay, setBasePay]     = useState(2500);
  const [homeCosts, setHomeCosts] = useState(1200);
  const [goal, setGoal]           = useState(10000);

  const specialPaysTotal = useUserStore((s) => s.specialPays).reduce((s, p) => s + p.monthlyAmount, 0);

  const idpMonthly  = idp ? IDP_MONTHLY : 0;
  const taxSavings  = czte ? basePay * 0.20 : 0; // rough estimate: ~20% effective rate

  const deployIncome  = basePay + idpMonthly + specialPaysTotal;
  const deployExpenses = homeCosts;
  const deployMonthlySavings = deployIncome - deployExpenses;
  const totalSavings = deployMonthlySavings * months;

  // SDP: can deposit up to $10K during deployment, earns 10% annual
  // annualized at months/12 of deployment
  const sdpPrincipal = Math.min(10000, totalSavings);
  const sdpInterest  = sdpPrincipal * SDP_RATE * (months / 12);

  const totalWithSdp = totalSavings + sdpInterest + taxSavings * months;
  const goalPct = goal > 0 ? Math.min(1, totalWithSdp / goal) : 0;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Deployment Savings</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>SINGLE SERVICE MEMBER</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>Deployment Wealth Builder</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
            Deployment is your best financial opportunity. Low expenses, extra pay, tax breaks. Make it count.
          </ThemedText>
        </ThemedView>

        {/* Toggles */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>DEPLOYMENT TYPE</ThemedText>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <ThemedText style={[styles.toggleTitle, { color: tc.textPrimary }]}>Combat Zone (CZTE)</ThemedText>
              <ThemedText style={[styles.toggleDesc, { color: tc.textHint }]}>
                All military pay is excluded from federal income tax while in a designated CZTE.
              </ThemedText>
            </View>
            <Switch
              value={czte}
              onValueChange={setCzte}
              trackColor={{ true: Brand.success }}
              thumbColor={czte ? '#fff' : '#555'}
            />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <ThemedText style={[styles.toggleTitle, { color: tc.textPrimary }]}>Hostile Fire / IDP</ThemedText>
              <ThemedText style={[styles.toggleDesc, { color: tc.textHint }]}>
                Imminent Danger Pay: $225/month for qualifying locations.
              </ThemedText>
            </View>
            <Switch
              value={idp}
              onValueChange={setIdp}
              trackColor={{ true: Brand.success }}
              thumbColor={idp ? '#fff' : '#555'}
            />
          </View>
        </ThemedView>

        {/* Inputs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR DEPLOYMENT NUMBERS</ThemedText>
          <Stepper label="Deployment length" value={months} step={1} min={1} max={18} onChange={setMonths} unit="mo" />
          <Stepper label="Monthly base pay" value={basePay} step={100} min={0} max={15000} onChange={setBasePay} />
          <Stepper label="Monthly expenses (back home)" value={homeCosts} step={50} min={0} max={5000} onChange={setHomeCosts} />
          <Stepper label="Savings goal" value={goal} step={1000} min={0} max={100000} onChange={setGoal} />
        </ThemedView>

        {/* Monthly breakdown */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>MONTHLY INCOME BREAKDOWN</ThemedText>
          <Row label="Base pay" value={fmt(basePay)} />
          {idp && <Row label="IDP / Hostile Fire Pay" value={fmt(IDP_MONTHLY)} color={Brand.success} />}
          {specialPaysTotal > 0 && <Row label="Special pays (from profile)" value={fmt(specialPaysTotal)} />}
          {czte && <Row label="Tax savings est. (CZTE)" value={fmt(taxSavings)} color={Brand.success} sub="~20% of base pay not withheld" />}
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Row label="Monthly expenses" value={`−${fmt(homeCosts)}`} />
          <Row
            label="Monthly surplus"
            value={fmt(deployMonthlySavings)}
            bold
            color={deployMonthlySavings >= 0 ? Brand.tactical : Brand.danger}
          />
        </ThemedView>

        {/* Total projection */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>DEPLOYMENT TOTAL PROJECTION ({months} MONTHS)</ThemedText>

          <View style={[styles.bigNumCard, { backgroundColor: tc.background }]}>
            <ThemedText style={styles.bigNumLabel}>ESTIMATED SAVED</ThemedText>
            <ThemedText style={styles.bigNum}>{fmt(totalWithSdp)}</ThemedText>
          </View>

          <Row label="Base savings (surplus × months)" value={fmt(totalSavings)} />
          {czte && <Row label="Tax savings (CZTE)" value={fmt(taxSavings * months)} color={Brand.success} />}
          <Row
            label="SDP interest earned"
            value={fmt(sdpInterest)}
            color={Brand.accent}
            sub={`On ${fmt(sdpPrincipal)} deposit at 10% APR`}
          />
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Row label="Total estimated saved" value={fmt(totalWithSdp)} bold color={Brand.tactical} />
        </ThemedView>

        {/* Goal tracker */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>GOAL TRACKER</ThemedText>
          <View style={styles.goalHeader}>
            <ThemedText style={[styles.goalLabel, { color: tc.textSecondary }]}>Target: {fmt(goal)}</ThemedText>
            <ThemedText style={[styles.goalPct, { color: goalPct >= 1 ? Brand.success : Brand.accent }]}>
              {Math.round(goalPct * 100)}%
            </ThemedText>
          </View>
          <View style={[styles.goalTrack, { backgroundColor: tc.surfaceInner }]}>
            <View style={[styles.goalFill, {
              width: `${Math.min(100, goalPct * 100)}%` as any,
              backgroundColor: goalPct >= 1 ? Brand.success : Brand.tactical,
            }]} />
          </View>
          {goalPct >= 1 && (
            <ThemedText style={styles.goalAchieved}>🎖️ Goal achieved this deployment.</ThemedText>
          )}
          {goalPct < 1 && (
            <ThemedText style={[styles.goalGap, { color: tc.textHint }]}>
              {fmt(goal - totalWithSdp)} remaining — adjust monthly expenses or deployment length.
            </ThemedText>
          )}
        </ThemedView>

        {/* SDP explainer */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>SAVINGS DEPOSIT PROGRAM (SDP)</ThemedText>
          {[
            'Available to service members deployed to a designated combat zone.',
            'Earns 10% annual interest — guaranteed by the government. No market risk.',
            'You can deposit up to $10,000 during a single deployment.',
            'Interest accrues at 10% from deposit until 90 days after you leave the combat zone.',
            'Apply through your finance office or myPay. Start early in deployment.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={[styles.tipText, { color: tc.textHint }]}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {/* Tax tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>CZTE MONEY MOVES</ThemedText>
          {[
            'Max your Roth IRA during deployment — CZTE pay does NOT count toward MAGI for Roth eligibility.',
            'Increase TSP to the combat zone limit ($72K/yr) — all contributions while in CZ are tax-free.',
            'Pay down high-interest debt aggressively — you have zero expense friction.',
            'Build your 6-month emergency fund if you haven\'t already.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={[styles.tipText, { color: tc.textHint }]}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
            Estimates only. Tax savings depend on your actual bracket, filing status, and deployment orders. Verify SDP eligibility with your finance office. IDP rates per DoD FY2026.
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
    borderLeftColor: '#2E7D32',
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#4CAF50' },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: 13, fontWeight: '700' },
  toggleDesc: { fontSize: 10, lineHeight: 15 },

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

  divider: { height: StyleSheet.hairlineWidth },

  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dataLabel: { fontSize: 12 },
  dataSub: { fontSize: 9 },
  dataValue: { fontSize: 13, fontFamily: 'Courier New' },

  bigNumCard: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.tactical + '40',
    borderRadius: 4,
    padding: Spacing.three,
    gap: 4,
  },
  bigNumLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical },
  bigNum: { fontSize: 26, lineHeight: 32, fontWeight: '900', color: Brand.tactical, fontFamily: 'Courier New' },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { fontSize: 12 },
  goalPct: { fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  goalTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },
  goalAchieved: { fontSize: 12, color: Brand.success, fontWeight: '700', textAlign: 'center' },
  goalGap: { fontSize: 11 },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.success, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
