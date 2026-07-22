import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { PAY_GRADES, PayGrade } from '@/data/bah-rates';
import { getBasicPay } from '@/data/basic-pay-rates';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

function fmt(n: number) { return '$' + Math.round(n).toLocaleString(); }
function fmtSign(n: number) { return (n >= 0 ? '+' : '') + fmt(n); }

// Typical promotion timelines (YOS) by grade
const TYPICAL_YOS: Partial<Record<PayGrade, string>> = {
  E2: '1 yr', E3: '2 yrs', E4: '3 yrs', E5: '4–6 yrs',
  E6: '10–12 yrs', E7: '16–19 yrs', E8: '19–23 yrs', E9: '22–26 yrs',
  O2: '2 yrs', O3: '4 yrs', O4: '10 yrs', O5: '16 yrs', O6: '22 yrs',
  W2: '2 yrs', W3: '6 yrs', W4: '12 yrs', W5: '22 yrs',
};

export default function PromotionCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const profileGrade = useUserStore((s) => s.payGrade);
  const profileYos   = useUserStore((s) => s.yos);

  const [currentGrade, setCurrentGrade] = useState<PayGrade>(profileGrade ?? 'E4');
  const [targetGrade,  setTargetGrade]  = useState<PayGrade>(() => {
    const idx = PAY_GRADES.indexOf(profileGrade ?? 'E4');
    return (PAY_GRADES[idx + 1] ?? profileGrade ?? 'E5') as PayGrade;
  });
  const [yos, setYos] = useState(profileYos ?? 6);
  const [projYos, setProjYos] = useState(Math.min(40, (profileYos ?? 6) + 2));
  const [retirementSystem, setRetirementSystem] = useState<'brs' | 'high3'>('brs');

  const currentPay = useMemo(() => getBasicPay(currentGrade, yos),     [currentGrade, yos]);
  const targetPay  = useMemo(() => getBasicPay(targetGrade, projYos),  [targetGrade, projYos]);

  const monthlyDiff = targetPay - currentPay;
  const annualDiff  = monthlyDiff * 12;

  // Pension impact at a 20-yr retirement: extra monthly pension =
  // monthlyDiff × multiplier-per-YOS × 20 years. High-3 (legacy, joined
  // on/before Dec 31, 2017) uses 2.5%/YOS; BRS (joined on/after Jan 1,
  // 2018 — the default for most currently serving members) uses 2.0%/YOS.
  const pensionImpact = useMemo(() => {
    const retYos = 20;
    const pct = retirementSystem === 'high3' ? 0.025 : 0.020;
    return Math.round(monthlyDiff * pct * retYos);
  }, [monthlyDiff, retirementSystem]);

  // 5-year cumulative pay increase
  const fiveYearTotal = annualDiff * 5;

  const positive = monthlyDiff >= 0;
  const accent = positive ? Brand.success : Brand.danger;

  return (
    <ThemedView style={s.container}>
      <SafeAreaView edges={['top']}>
        <View style={[s.header, { borderBottomColor: tc.borderColor }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <ThemedText style={s.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[s.title, { color: tc.textPrimary }]}>PROMOTION PAY PREDICTOR</ThemedText>
          <View style={s.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <View style={s.sourceBar}>
          <ThemedText style={s.sourceText}>🟢 FY2026 DFAS Official Rates · militarypay.defense.gov</ThemedText>
        </View>

        {/* Current Grade */}
        <View style={[s.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={s.sectionEyebrow}>// CURRENT RANK</ThemedText>
          <GradePicker selected={currentGrade} onSelect={setCurrentGrade} />
          <NumberStepper label="Current Years of Service" value={yos} min={0} max={40} onChange={setYos} unit="yrs" />
          <View style={s.payRow}>
            <ThemedText style={[s.payLabel, { color: tc.textSecondary }]}>Current Monthly Base Pay</ThemedText>
            <ThemedText style={[s.payValue, { color: tc.textPrimary }]}>{fmt(currentPay)}</ThemedText>
          </View>
        </View>

        {/* Target Grade */}
        <View style={[s.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={s.sectionEyebrow}>// PROMOTION TARGET</ThemedText>
          <GradePicker selected={targetGrade} onSelect={setTargetGrade} />
          {TYPICAL_YOS[targetGrade] && (
            <ThemedText style={[s.hint, { color: tc.textHint }]}>Typical promotion to {targetGrade}: ~{TYPICAL_YOS[targetGrade]}</ThemedText>
          )}
          <NumberStepper label="Projected YOS at Promotion" value={projYos} min={0} max={40} onChange={setProjYos} unit="yrs" />
          <View style={s.payRow}>
            <ThemedText style={[s.payLabel, { color: tc.textSecondary }]}>Projected Monthly Base Pay</ThemedText>
            <ThemedText style={[s.payValue, { color: Brand.tactical }]}>{fmt(targetPay)}</ThemedText>
          </View>
        </View>

        {/* Results */}
        <View style={[s.resultsCard, { backgroundColor: tc.surface, borderColor: accent + '40' }]}>
          <ThemedText style={[s.resultsTitle, { color: accent }]}>PROMOTION IMPACT</ThemedText>

          <View style={s.resultRow}>
            <ThemedText style={[s.resultLabel, { color: tc.textSecondary }]}>Monthly Pay Increase</ThemedText>
            <ThemedText style={[s.resultValue, { color: accent }]}>{fmtSign(monthlyDiff)}/mo</ThemedText>
          </View>
          <View style={[s.divider, { backgroundColor: tc.borderColor }]} />
          <View style={s.resultRow}>
            <ThemedText style={[s.resultLabel, { color: tc.textSecondary }]}>Annual Pay Increase</ThemedText>
            <ThemedText style={[s.resultValue, { color: accent }]}>{fmtSign(annualDiff)}/yr</ThemedText>
          </View>
          <View style={[s.divider, { backgroundColor: tc.borderColor }]} />
          <View style={s.resultRow}>
            <ThemedText style={[s.resultLabel, { color: tc.textSecondary }]}>5-Year Cumulative Increase</ThemedText>
            <ThemedText style={[s.resultValue, { color: accent }]}>{fmtSign(fiveYearTotal)}</ThemedText>
          </View>
          <View style={[s.divider, { backgroundColor: tc.borderColor }]} />
          <View style={s.resultRow}>
            <ThemedText style={[s.resultLabel, { color: tc.textSecondary }]}>
              Estimated Pension Impact (20-yr {retirementSystem === 'high3' ? 'High-3' : 'BRS'})
            </ThemedText>
            <ThemedText style={[s.resultValue, { color: Brand.accent }]}>{fmtSign(pensionImpact)}/mo</ThemedText>
          </View>
          <View style={s.retirementToggleRow}>
            {(['brs', 'high3'] as const).map((sys) => (
              <Pressable
                key={sys}
                onPress={() => setRetirementSystem(sys)}
                style={[
                  s.retirementToggleBtn,
                  { borderColor: tc.borderColor },
                  retirementSystem === sys && { backgroundColor: Brand.accent + '20', borderColor: Brand.accent },
                ]}>
                <ThemedText style={[s.retirementToggleText, { color: tc.textHint }, retirementSystem === sys && { color: Brand.accent }]}>
                  {sys === 'brs' ? 'BRS (2.0%/yr)' : 'High-3 (2.5%/yr)'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText style={[s.hint, { color: tc.textHint }]}>
            BRS applies if you joined on/after Jan 1, 2018 — the default for most currently serving members. High-3 applies if you joined on/before Dec 31, 2017 and didn't opt into BRS.
          </ThemedText>
        </View>

        {/* Hero number */}
        <View style={[s.heroCard, { backgroundColor: tc.surface }]}>
          <ThemedText style={[s.heroEyebrow, { color: tc.textMuted }]}>// TOTAL VALUE OF THIS PROMOTION</ThemedText>
          <ThemedText style={[s.heroValue, { color: accent }]}>{fmtSign(fiveYearTotal)}</ThemedText>
          <ThemedText style={[s.heroSub, { color: tc.textHint }]}>Over 5 years in base pay alone — before allowances, special pays, or retirement impact</ThemedText>
        </View>

        {/* Disclaimer */}
        <View style={[s.disclaimer, { backgroundColor: tc.surfaceInner }]}>
          <ThemedText style={[s.disclaimerText, { color: tc.textHint }]}>
            🟡 Estimates only. Actual pay depends on promotion sequence, time in grade, and official DoD pay tables. Pension estimates use a simplified {retirementSystem === 'high3' ? 'High-3 (2.5%' : 'BRS (2.0%'} × years × average base pay) approximation. Does not include BAH, BAS, or special pays. Verify at DFAS.mil.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical },
  title: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },

  sourceBar: {
    backgroundColor: Brand.success + '10', borderWidth: 1,
    borderColor: Brand.success + '30', borderRadius: 6, padding: Spacing.two,
  },
  sourceText: { fontSize: 10, color: Brand.success, fontWeight: '700' },

  card: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 8,
    padding: Spacing.three, gap: Spacing.three,
  },
  sectionEyebrow: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  hint: { fontSize: 10, marginTop: -Spacing.one },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payLabel: { fontSize: 12 },
  payValue: { fontSize: 15, fontWeight: '900', fontFamily: 'Courier New' },

  resultsCard: {
    borderWidth: 1,
    borderRadius: 8, padding: Spacing.three, gap: Spacing.two,
  },
  resultsTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 12, flex: 1 },
  resultValue: { fontSize: 14, fontWeight: '800', fontFamily: 'Courier New' },
  divider: { height: StyleSheet.hairlineWidth },

  retirementToggleRow: { flexDirection: 'row', gap: Spacing.two },
  retirementToggleBtn: {
    flex: 1, borderWidth: 1, borderRadius: 6,
    paddingVertical: Spacing.one, alignItems: 'center',
  },
  retirementToggleText: { fontSize: 10, fontWeight: '700' },

  heroCard: {
    borderWidth: 1, borderColor: Brand.accent + '30',
    borderRadius: 8, padding: Spacing.four, alignItems: 'center', gap: Spacing.one,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  heroValue: { fontSize: 34, fontWeight: '900', fontFamily: 'Courier New' },
  heroSub: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 4 },

  disclaimer: {
    borderRadius: 6,
    padding: Spacing.two + 2, borderLeftWidth: 3, borderLeftColor: '#C8A800',
  },
  disclaimerText: { fontSize: 12, lineHeight: 17 },
});
