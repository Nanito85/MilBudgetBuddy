import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { PAY_GRADES, PayGrade } from '@/data/bah-rates';
import { getBasicPay } from '@/data/basic-pay-rates';
import { useUserStore } from '@/store/user.store';

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT:  PayGrade[] = ['W1','W2','W3','W4','W5'];
const OFFICER:  PayGrade[] = ['O1','O2','O3','O4','O5','O6'];

const TERMS = [24, 36, 48, 60, 72, 84];

// Recommended max car payment as % of monthly take-home
const SAFE_PCT  = 0.10; // green
const WARN_PCT  = 0.15; // amber
const DANGER_PCT = 0.20; // red

function calcPayment(principal: number, annualRate: number, months: number): number {
  if (months === 0 || principal <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 100 / 12;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtD(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Benchmark max car price by grade (≈ 25% of gross annual pay)
const GRADE_BENCHMARKS: Partial<Record<PayGrade, { max: number; note: string }>> = {
  E1: { max: 8000,  note: 'Used, under $10K' },
  E2: { max: 9000,  note: 'Used, under $10K' },
  E3: { max: 10000, note: 'Used, reliable' },
  E4: { max: 12000, note: 'Used, under $15K' },
  E5: { max: 16000, note: 'Used or entry new' },
  E6: { max: 20000, note: 'New or certified used' },
  E7: { max: 25000, note: 'Mid-range new' },
  E8: { max: 30000, note: 'Mid-range new' },
  E9: { max: 35000, note: 'Most new vehicles' },
};

export default function CarLoanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const storeGrade = useUserStore((s) => s.payGrade);
  const storeYos   = useUserStore((s) => s.yos);

  const [grade, setGrade]       = useState<PayGrade>(storeGrade ?? 'E4');
  const [price, setPrice]       = useState(20000);
  const [downPmt, setDownPmt]   = useState(2000);
  const [apr, setApr]           = useState(8.9);
  const [term, setTerm]         = useState(60);

  const basePay    = useMemo(() => getBasicPay(grade, storeYos ?? 4), [grade, storeYos]);
  // Rough net take-home: base pay * 0.78 (approx after taxes/FICA)
  const takeHome   = Math.round(basePay * 0.78);
  const principal  = Math.max(0, price - downPmt);
  const payment    = calcPayment(principal, apr, term);
  const totalPaid  = payment * term;
  const totalInt   = totalPaid - principal;
  const pct        = takeHome > 0 ? payment / takeHome : 0;

  // TSP equivalent: if they invested the payment at 7% for 20 years
  const tspMonths  = 240;
  const tspRate    = 7 / 100 / 12;
  const tspVal     = payment * ((Math.pow(1 + tspRate, tspMonths) - 1) / tspRate);

  const riskColor  = pct > DANGER_PCT ? Brand.danger : pct > WARN_PCT ? Brand.warning : Brand.tactical;
  const riskLabel  = pct > DANGER_PCT ? 'DANGER ZONE' : pct > WARN_PCT ? 'STRETCHED' : 'MANAGEABLE';

  const benchmark  = GRADE_BENCHMARKS[grade];

  function GradeChip({ g }: { g: PayGrade }) {
    const active = grade === g;
    return (
      <Pressable onPress={() => setGrade(g)} style={[s.chip, active && { backgroundColor: Brand.accent, borderColor: Brand.accent }]}>
        <ThemedText style={[s.chipTxt, active && { color: '#000' }]}>{g}</ThemedText>
      </Pressable>
    );
  }

  function PriceBtn({ amount, label }: { amount: number; label: string }) {
    return (
      <Pressable onPress={() => setPrice(amount)} style={[s.presetBtn, price === amount && s.presetActive]}>
        <ThemedText style={[s.presetTxt, price === amount && s.presetActiveTxt]}>{label}</ThemedText>
      </Pressable>
    );
  }

  function AprBtn({ rate }: { rate: number }) {
    const active = apr === rate;
    return (
      <Pressable onPress={() => setApr(rate)} style={[s.chip, active && { backgroundColor: Brand.primary, borderColor: Brand.primary }]}>
        <ThemedText style={[s.chipTxt, active && { color: '#fff' }]}>{rate}%</ThemedText>
      </Pressable>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/tools')} style={s.back}>
          <ThemedText style={s.chevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={s.title}>Car Loan Check</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.five }]} showsVerticalScrollIndicator={false}>

        {/* Grade */}
        <ThemedView type="backgroundElement" style={s.card}>
          <ThemedText style={s.cardLabel}>YOUR PAY GRADE</ThemedText>
          <ThemedText style={s.cardHint}>Affects estimated take-home pay</ThemedText>
          {[ENLISTED, WARRANT, OFFICER].map((group, gi) => (
            <View key={gi} style={s.chipRow}>
              {group.map((g) => <GradeChip key={g} g={g} />)}
            </View>
          ))}
          <View style={s.takeHomeRow}>
            <ThemedText style={s.takeHomeLabel}>EST. MONTHLY TAKE-HOME</ThemedText>
            <ThemedText style={[s.takeHomeVal, { color: Brand.tactical }]}>{fmt(takeHome)}</ThemedText>
          </View>
        </ThemedView>

        {/* Car price */}
        <ThemedView type="backgroundElement" style={s.card}>
          <ThemedText style={s.cardLabel}>VEHICLE PRICE</ThemedText>
          <View style={s.presetRow}>
            <PriceBtn amount={8000}  label="$8K" />
            <PriceBtn amount={12000} label="$12K" />
            <PriceBtn amount={18000} label="$18K" />
            <PriceBtn amount={25000} label="$25K" />
            <PriceBtn amount={35000} label="$35K" />
            <PriceBtn amount={50000} label="$50K" />
          </View>
          <View style={s.inlineRow}>
            <ThemedText style={s.inlineLabel}>Vehicle Price</ThemedText>
            <View style={s.stepCtrl}>
              <Pressable onPress={() => setPrice(Math.max(1000, price - 1000))} style={s.stepBtn}>
                <ThemedText style={s.stepTxt}>−</ThemedText>
              </Pressable>
              <ThemedText style={s.stepVal}>{fmt(price)}</ThemedText>
              <Pressable onPress={() => setPrice(Math.min(150000, price + 1000))} style={s.stepBtn}>
                <ThemedText style={s.stepTxt}>+</ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={s.inlineRow}>
            <ThemedText style={s.inlineLabel}>Down Payment</ThemedText>
            <View style={s.stepCtrl}>
              <Pressable onPress={() => setDownPmt(Math.max(0, downPmt - 500))} style={s.stepBtn}>
                <ThemedText style={s.stepTxt}>−</ThemedText>
              </Pressable>
              <ThemedText style={s.stepVal}>{fmt(downPmt)}</ThemedText>
              <Pressable onPress={() => setDownPmt(Math.min(price, downPmt + 500))} style={s.stepBtn}>
                <ThemedText style={s.stepTxt}>+</ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={[s.inlineRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border, paddingTop: Spacing.two }]}>
            <ThemedText style={[s.inlineLabel, { color: '#4D7A9A' }]}>Loan Amount</ThemedText>
            <ThemedText style={[s.stepVal, { color: Brand.accent }]}>{fmt(principal)}</ThemedText>
          </View>
        </ThemedView>

        {/* APR + term */}
        <ThemedView type="backgroundElement" style={s.card}>
          <ThemedText style={s.cardLabel}>INTEREST RATE (APR)</ThemedText>
          <ThemedText style={s.cardHint}>Junior enlisted often see 10–24% at dealer lots near bases</ThemedText>
          <View style={s.chipRow}>
            {[3.9, 5.9, 8.9, 12.9, 18.9, 24.9].map((r) => <AprBtn key={r} rate={r} />)}
          </View>

          <ThemedText style={[s.cardLabel, { marginTop: Spacing.two }]}>LOAN TERM</ThemedText>
          <View style={s.chipRow}>
            {TERMS.map((t) => (
              <Pressable key={t} onPress={() => setTerm(t)} style={[s.chip, term === t && { backgroundColor: Brand.primary, borderColor: Brand.primary }]}>
                <ThemedText style={[s.chipTxt, term === t && { color: '#fff' }]}>{t}mo</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        {/* Results */}
        <ThemedView type="backgroundElement" style={[s.resultCard, { borderLeftColor: riskColor }]}>
          <View style={s.riskBadge}>
            <View style={[s.riskDot, { backgroundColor: riskColor }]} />
            <ThemedText style={[s.riskLabel, { color: riskColor }]}>{riskLabel}</ThemedText>
          </View>

          <View style={s.bigRow}>
            <View>
              <ThemedText style={s.bigEyebrow}>MONTHLY PAYMENT</ThemedText>
              <ThemedText style={[s.bigNum, { color: riskColor, fontFamily: Fonts.data }]}>{fmt(payment)}</ThemedText>
              <ThemedText style={s.bigSub}>per month for {term} months</ThemedText>
            </View>
            <View style={s.pctCircle}>
              <ThemedText style={[s.pctNum, { color: riskColor }]}>{Math.round(pct * 100)}%</ThemedText>
              <ThemedText style={s.pctLabel}>of take-home</ThemedText>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.barTrack}>
            <View style={[s.barFill, { width: `${Math.min(pct / DANGER_PCT, 1) * 100}%` as any, backgroundColor: riskColor }]} />
            <View style={[s.barMark, { left: `${(SAFE_PCT / DANGER_PCT) * 100}%` as any }]} />
            <View style={[s.barMark, { left: `${(WARN_PCT / DANGER_PCT) * 100}%` as any }]} />
          </View>
          <View style={s.barLabels}>
            <ThemedText style={s.barLabelTxt}>0%</ThemedText>
            <ThemedText style={[s.barLabelTxt, { color: Brand.tactical }]}>10% safe</ThemedText>
            <ThemedText style={[s.barLabelTxt, { color: Brand.warning }]}>15% limit</ThemedText>
            <ThemedText style={[s.barLabelTxt, { color: Brand.danger }]}>20%+</ThemedText>
          </View>
        </ThemedView>

        {/* Cost breakdown */}
        <ThemedView type="backgroundElement" style={s.card}>
          <ThemedText style={s.cardLabel}>TOTAL COST BREAKDOWN</ThemedText>
          {[
            { label: 'Vehicle price', val: fmt(price), color: '#C8D8E8' },
            { label: 'Down payment', val: `−${fmt(downPmt)}`, color: Brand.tactical },
            { label: 'Amount financed', val: fmt(principal), color: '#C8D8E8' },
            { label: `Interest (${term} months @ ${apr}%)`, val: fmt(totalInt), color: Brand.danger },
            { label: 'Total you pay', val: fmt(price - downPmt + totalInt + downPmt), color: Brand.accent },
          ].map((row) => (
            <View key={row.label} style={s.breakRow}>
              <ThemedText style={s.breakLabel}>{row.label}</ThemedText>
              <ThemedText style={[s.breakVal, { color: row.color }]}>{row.val}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {/* Opportunity cost */}
        <ThemedView type="backgroundElement" style={[s.card, { borderLeftWidth: 3, borderLeftColor: Brand.accent }]}>
          <ThemedText style={s.cardLabel}>OPPORTUNITY COST</ThemedText>
          <ThemedText style={s.cardHint}>
            If you invested that {fmt(payment)}/mo into TSP at 7% for 20 years instead:
          </ThemedText>
          <ThemedText style={[s.bigNum, { color: Brand.accent, marginTop: Spacing.one }]}>{fmt(tspVal)}</ThemedText>
          <ThemedText style={s.cardHint}>That car loan could cost you {fmt(tspVal - price)} in long-term wealth.</ThemedText>
        </ThemedView>

        {/* Grade benchmark */}
        {benchmark && (
          <ThemedView type="backgroundElement" style={s.card}>
            <ThemedText style={s.cardLabel}>RECOMMENDED FOR {grade}</ThemedText>
            <View style={s.benchRow}>
              <View style={[s.benchBadge, price <= benchmark.max ? { backgroundColor: Brand.tactical + '20', borderColor: Brand.tactical } : { backgroundColor: Brand.danger + '20', borderColor: Brand.danger }]}>
                <ThemedText style={[s.benchLabel, { color: price <= benchmark.max ? Brand.tactical : Brand.danger }]}>
                  {price <= benchmark.max ? '✓ WITHIN RANGE' : '✗ OVER BUDGET'}
                </ThemedText>
              </View>
              <ThemedText style={s.benchVal}>Max recommended: {fmt(benchmark.max)}</ThemedText>
            </View>
            <ThemedText style={s.cardHint}>{benchmark.note} — roughly 25% of your annual base pay.</ThemedText>
          </ThemedView>
        )}

        <ThemedView type="backgroundElement" style={s.tipCard}>
          <ThemedText style={s.tipLabel}>💡 DEALER SURVIVAL TIPS</ThemedText>
          {[
            'Get pre-approved at your base credit union BEFORE visiting a dealer.',
            'Negotiate price first, financing second. Never discuss monthly payment.',
            'Avoid add-ons: GAP insurance (get it from insurance co.), extended warranty, paint protection.',
            'The Military Lending Act caps APR at 36% — know your rights.',
          ].map((tip, i) => (
            <View key={i} style={s.tipRow}>
              <ThemedText style={s.tipBullet}>›</ThemedText>
              <ThemedText style={s.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  back: { width: 40, justifyContent: 'center' },
  chevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  cardHint: { fontSize: 11, color: '#3D6080', lineHeight: 16 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  chipTxt: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },

  takeHomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Brand.border, paddingTop: Spacing.two },
  takeHomeLabel: { fontSize: 9, fontWeight: '700', color: '#4D7A9A', letterSpacing: 0.8 },
  takeHomeVal: { fontSize: 16, fontWeight: '800', fontFamily: Fonts.data },

  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  presetBtn: { paddingHorizontal: Spacing.two + 2, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  presetActive: { backgroundColor: Brand.accent + '30', borderColor: Brand.accent },
  presetTxt: { fontSize: 12, fontWeight: '700', color: '#4D7A9A' },
  presetActiveTxt: { color: Brand.accent },

  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inlineLabel: { fontSize: 13, color: '#C8D8E8', flex: 1 },
  stepCtrl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Brand.primary, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 22, marginTop: -2 },
  stepVal: { fontSize: 15, fontWeight: '700', color: '#C8D8E8', minWidth: 72, textAlign: 'center', fontFamily: Fonts.data },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  riskBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  riskDot: { width: 6, height: 6, borderRadius: 3 },
  riskLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  bigRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  bigEyebrow: { fontSize: 8, fontWeight: '700', color: '#4D7A9A', letterSpacing: 1, marginBottom: 2 },
  bigNum: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  bigSub: { fontSize: 10, color: '#3D6080', marginTop: 2 },
  pctCircle: { alignItems: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: Brand.border, justifyContent: 'center' },
  pctNum: { fontSize: 22, fontWeight: '900', lineHeight: 26 },
  pctLabel: { fontSize: 8, color: '#3D6080', fontWeight: '600', textAlign: 'center' },
  barTrack: { height: 8, backgroundColor: Brand.border, borderRadius: 4, overflow: 'visible', position: 'relative' },
  barFill: { height: '100%', borderRadius: 4, position: 'absolute', top: 0, left: 0 },
  barMark: { position: 'absolute', top: -2, width: 1.5, height: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabelTxt: { fontSize: 8, color: '#3D6080' },

  breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakLabel: { fontSize: 12, color: '#7A9AB5' },
  breakVal: { fontSize: 13, fontWeight: '700', fontFamily: Fonts.data },

  benchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  benchBadge: { borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 4, borderWidth: 1 },
  benchLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  benchVal: { fontSize: 12, color: '#4D7A9A' },

  tipCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one + 2 },
  tipLabel: { fontSize: 9, fontWeight: '800', color: Brand.accent, letterSpacing: 1, marginBottom: Spacing.one },
  tipRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  tipBullet: { color: Brand.accent, fontSize: 13, fontWeight: '700', width: 12 },
  tipText: { flex: 1, fontSize: 12, color: '#7A9AB5', lineHeight: 17 },
});
