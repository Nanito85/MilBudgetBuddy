import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
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
  return (
    <View style={styles.stepperRow}>
      <ThemedText style={styles.stepperLabel}>{label}</ThemedText>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))}>
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepperValue}>{unit === 'mo' ? `${value} mo` : fmt(value)}</ThemedText>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + step))}>
          <ThemedText style={styles.stepBtnText}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function Row({ label, value, bold, color, sub }: {
  label: string; value: string; bold?: boolean; color?: string; sub?: string;
}) {
  return (
    <View style={styles.dataRow}>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.dataLabel}>{label}</ThemedText>
        {sub && <ThemedText style={styles.dataSub}>{sub}</ThemedText>}
      </View>
      <ThemedText style={[styles.dataValue, bold && { fontWeight: '700', color: color ?? '#C8D8E8' }]}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function DeploymentSavingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
  const sdpReturn    = sdpPrincipal + sdpInterest;

  const totalWithSdp = totalSavings + sdpInterest + taxSavings * months;
  const goalPct = goal > 0 ? Math.min(1, totalWithSdp / goal) : 0;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.push('/tools'))}
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
          <ThemedText style={styles.heroTitle}>Deployment Wealth Builder</ThemedText>
          <ThemedText style={styles.heroBody}>
            Deployment is your best financial opportunity. Low expenses, extra pay, tax breaks. Make it count.
          </ThemedText>
        </ThemedView>

        {/* Toggles */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>DEPLOYMENT TYPE</ThemedText>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <ThemedText style={styles.toggleTitle}>Combat Zone (CZTE)</ThemedText>
              <ThemedText style={styles.toggleDesc}>
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
              <ThemedText style={styles.toggleTitle}>Hostile Fire / IDP</ThemedText>
              <ThemedText style={styles.toggleDesc}>
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
          <View style={styles.divider} />
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

          <View style={styles.bigNumCard}>
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
          <View style={styles.divider} />
          <Row label="Total estimated saved" value={fmt(totalWithSdp)} bold color={Brand.tactical} />
        </ThemedView>

        {/* Goal tracker */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>GOAL TRACKER</ThemedText>
          <View style={styles.goalHeader}>
            <ThemedText style={styles.goalLabel}>Target: {fmt(goal)}</ThemedText>
            <ThemedText style={[styles.goalPct, { color: goalPct >= 1 ? Brand.success : Brand.accent }]}>
              {Math.round(goalPct * 100)}%
            </ThemedText>
          </View>
          <View style={styles.goalTrack}>
            <View style={[styles.goalFill, {
              width: `${Math.min(100, goalPct * 100)}%` as any,
              backgroundColor: goalPct >= 1 ? Brand.success : Brand.tactical,
            }]} />
          </View>
          {goalPct >= 1 && (
            <ThemedText style={styles.goalAchieved}>🎖️ Goal achieved this deployment.</ThemedText>
          )}
          {goalPct < 1 && (
            <ThemedText style={styles.goalGap}>
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
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {/* Tax tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>CZTE MONEY MOVES</ThemedText>
          {[
            'Max your Roth IRA during deployment — CZTE pay does NOT count toward MAGI for Roth eligibility.',
            'Increase TSP to the combat zone limit ($70K/yr) — all contributions while in CZ are tax-free.',
            'Pay down high-interest debt aggressively — you have zero expense friction.',
            'Build your 6-month emergency fund if you haven\'t already.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
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
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: 13, fontWeight: '700', color: '#C8D8E8' },
  toggleDesc: { fontSize: 10, color: '#4D7A9A', lineHeight: 15 },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, color: '#8AA8C0', flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#04080F',
  },
  stepBtnText: { fontSize: 18, fontWeight: '300', color: Brand.tactical },
  stepperValue: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', width: 80, textAlign: 'center', fontFamily: 'Courier New' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },

  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dataLabel: { fontSize: 12, color: '#4D7A9A' },
  dataSub: { fontSize: 9, color: '#3D6080' },
  dataValue: { fontSize: 13, color: '#8AA8C0', fontFamily: 'Courier New' },

  bigNumCard: {
    alignItems: 'center',
    backgroundColor: '#04080F',
    borderWidth: 1,
    borderColor: Brand.tactical + '40',
    borderRadius: 4,
    padding: Spacing.three,
    gap: 4,
  },
  bigNumLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical },
  bigNum: { fontSize: 26, lineHeight: 32, fontWeight: '900', color: Brand.tactical, fontFamily: 'Courier New' },

  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { fontSize: 12, color: '#8AA8C0' },
  goalPct: { fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  goalTrack: { height: 8, backgroundColor: '#0D1E30', borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },
  goalAchieved: { fontSize: 12, color: Brand.success, fontWeight: '700', textAlign: 'center' },
  goalGap: { fontSize: 11, color: '#4D7A9A' },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.success, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#4D7A9A' },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, color: '#3D6080', textAlign: 'center' },
});
