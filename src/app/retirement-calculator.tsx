import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PayGrade } from '@/data/bah-rates';
import { BASIC_PAY_DATA_YEAR, getBasicPay } from '@/data/basic-pay-rates';
import { BreakEvenChart } from '@/features/retirement/components/BreakEvenChart';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BRSCard, High3Card } from '@/features/retirement/components/RetirementSummaryCard';
import { calcRetirement, formatMoney, govtMatchRate } from '@/features/retirement/utils/retirementCalc';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';

type RetirementSystem = 'both' | 'high3' | 'brs';

const CONTRIB_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15];
const RETURN_STEPS  = [4, 5, 6, 7, 8, 9, 10];
const VA_RATINGS    = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// FY2026 VA disability monthly compensation (veteran alone, no dependents)
const VA_MONTHLY: Record<number, number> = {
  0: 0, 10: 175.51, 20: 346.95, 30: 537.42, 40: 773.80,
  50: 1102.04, 60: 1395.93, 70: 1759.19, 80: 2044.89, 90: 2297.96, 100: 3831.30,
};

export default function RetirementCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [grade, setGrade] = useState<PayGrade>('E7');
  const [currentAge, setCurrentAge] = useState(30);
  const [currentYOS, setCurrentYOS] = useState(10);
  const [yearsAtGrade, setYearsAtGrade] = useState(3);
  const [retirementYOS, setRetirementYOS] = useState(20);
  const [system, setSystem] = useState<RetirementSystem>('both');
  const [tspContribIdx, setTspContribIdx] = useState(4);  // 5%
  const [tspReturnIdx, setTspReturnIdx] = useState(3);    // 7%
  const [vaRating, setVaRating] = useState(0);

  const tspContribRate = CONTRIB_STEPS[tspContribIdx] / 100;
  const tspAnnualReturn = RETURN_STEPS[tspReturnIdx] / 100;
  const gMatchPct = govtMatchRate(tspContribRate) * 100;

  const result = calcRetirement({
    grade,
    retirementYOS,
    currentAge,
    currentYOS,
    tspContribRate,
    tspAnnualReturn,
  });

  const showHigh3 = system === 'both' || system === 'high3';
  const showBRS   = system === 'both' || system === 'brs';

  const currentPay = getBasicPay(grade, currentYOS);

  // VA disability
  const vaMonthly = VA_MONTHLY[vaRating] ?? 0;
  const pensionMonthly = showHigh3 ? result.high3.monthlyPension : result.brs.monthlyPension;
  // CRDP: ≥50% rating = full pension + full VA (concurrent receipt, no offset)
  // <50% rating = retirement pay offset by VA amount; net income same as pension (VA portion is tax-free)
  const crdpEligible = vaRating >= 50;
  const combinedMonthly = crdpEligible ? pensionMonthly + vaMonthly : pensionMonthly;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            TOOLS
          </ThemedText>
          <ThemedText style={styles.title}>Retirement Calculator</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* YOUR SERVICE */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            YOUR SERVICE
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Grade at Retirement
              </ThemedText>
              <GradePicker selected={grade} onSelect={setGrade} />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Current Basic Pay
              </ThemedText>
              <ThemedText style={styles.payPreview}>
                {formatMoney(currentPay)}/mo
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={[styles.cardPadded, styles.stepperGroup]}>
              <NumberStepper
                label="Current age"
                value={currentAge}
                min={18}
                max={60}
                onChange={setCurrentAge}
                unit="yrs"
              />
              <NumberStepper
                label="Current years of service"
                value={currentYOS}
                min={0}
                max={39}
                onChange={(v) => {
                  setCurrentYOS(v);
                  if (retirementYOS <= v) setRetirementYOS(v + 1);
                }}
                unit="YOS"
              />
              <NumberStepper
                label={`Years at ${grade} (date of rank)`}
                value={yearsAtGrade}
                min={0}
                max={currentYOS}
                onChange={setYearsAtGrade}
                unit="yrs"
              />
              <NumberStepper
                label="Planned years at retirement"
                value={retirementYOS}
                min={Math.max(20, currentYOS + 1)}
                max={40}
                onChange={setRetirementYOS}
                unit="YOS"
              />
            </View>
            {yearsAtGrade < 3 && (
              <View style={[styles.cardPadded, { paddingTop: 0 }]}>
                <View style={[styles.matchBanner, { backgroundColor: `${Brand.warning}15` }]}>
                  <ThemedText type="small" style={{ color: Brand.warning, fontWeight: '600' }}>
                    High-3 note: You've been at {grade} for {yearsAtGrade} yr{yearsAtGrade !== 1 ? 's' : ''}. Your High-3 average will include time at a lower grade, slightly reducing your estimated pension.
                  </ThemedText>
                </View>
              </View>
            )}
          </ThemedView>

          {/* Quick stats */}
          <View style={styles.quickStats}>
            <ThemedView type="backgroundElement" style={styles.quickStat}>
              <ThemedText style={[styles.quickStatVal, { color: Brand.primary }]}>
                {result.retirementAge}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Age at retirement</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.quickStat}>
              <ThemedText style={[styles.quickStatVal, { color: Brand.primary }]}>
                {result.yearsToRetirement}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Years remaining</ThemedText>
            </ThemedView>
          </View>
        </View>

        {/* RETIREMENT SYSTEM */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            RETIREMENT SYSTEM
          </ThemedText>
          <View style={styles.systemToggle}>
            {([['both','Compare Both'],['high3','High-3 Only'],['brs','BRS Only']] as [RetirementSystem, string][]).map(([val, label]) => (
              <Pressable
                key={val}
                onPress={() => setSystem(val)}
                style={[styles.systemBtn, system === val && styles.systemBtnActive]}>
                <ThemedText style={[styles.systemBtnText, system === val && styles.systemBtnTextActive]}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.systemNote}>
            Members entering on/after Jan 1, 2018 are automatically in BRS.
            Members entering before Jan 1, 2006 are in High-3.
            Members Jan 2006 – Dec 2017 had a one-time election.
          </ThemedText>
        </View>

        {/* TSP SETTINGS (BRS) */}
        {showBRS && (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              TSP SETTINGS (BRS)
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={[styles.cardPadded, styles.stepperGroup]}>
                {/* Contribution rate */}
                <View style={styles.sliderRow}>
                  <View style={styles.sliderLabelBlock}>
                    <ThemedText style={styles.sliderLabel}>Your contribution</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {formatMoney(currentPay * tspContribRate)}/mo
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.sliderValue, { color: Brand.primary }]}>
                    {CONTRIB_STEPS[tspContribIdx]}%
                  </ThemedText>
                </View>
                <View style={styles.chipRow}>
                  {CONTRIB_STEPS.map((pct, idx) => (
                    <Pressable
                      key={pct}
                      onPress={() => setTspContribIdx(idx)}
                      style={[styles.pctChip, tspContribIdx === idx && styles.pctChipActive]}>
                      <ThemedText style={[styles.pctChipText, tspContribIdx === idx && styles.pctChipTextActive]}>
                        {pct}%
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                {/* Government match */}
                <View style={[styles.matchBanner, { backgroundColor: `${Brand.success}15` }]}>
                  <ThemedText type="small" style={{ color: Brand.success, fontWeight: '600' }}>
                    Gov't match: {gMatchPct.toFixed(1)}% → +{formatMoney(currentPay * govtMatchRate(tspContribRate))}/mo free money
                  </ThemedText>
                </View>

                <View style={styles.divider} />

                {/* Return rate */}
                <View style={styles.sliderRow}>
                  <View style={styles.sliderLabelBlock}>
                    <ThemedText style={styles.sliderLabel}>Expected annual return</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      S&P 500 historical avg ≈ 10% (7% inflation-adjusted)
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.sliderValue, { color: Brand.primary }]}>
                    {RETURN_STEPS[tspReturnIdx]}%
                  </ThemedText>
                </View>
                <View style={styles.chipRow}>
                  {RETURN_STEPS.map((pct, idx) => (
                    <Pressable
                      key={pct}
                      onPress={() => setTspReturnIdx(idx)}
                      style={[styles.pctChip, tspReturnIdx === idx && styles.pctChipActive]}>
                      <ThemedText style={[styles.pctChipText, tspReturnIdx === idx && styles.pctChipTextActive]}>
                        {pct}%
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ThemedView>
          </View>
        )}

        {/* RESULTS */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            RESULTS
          </ThemedText>

          {showHigh3 && (
            <High3Card result={result.high3} retirementAge={result.retirementAge} />
          )}

          {showBRS && (
            <BRSCard
              result={result.brs}
              retirementAge={result.retirementAge}
              monthlyDiff={result.monthlyPensionDiff}
            />
          )}

          {system === 'both' && (
            <BreakEvenChart
              retirementAge={result.retirementAge}
              breakEvenAge={result.breakEvenAge}
              breakEvenYears={result.breakEvenYearsAfterRetirement}
            />
          )}
        </View>

        {/* VA DISABILITY */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            VA DISABILITY (OPTIONAL)
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Combined VA Rating (FY2026 rates, no dependents)
              </ThemedText>
              <View style={styles.chipRow}>
                {VA_RATINGS.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setVaRating(r)}
                    style={[styles.pctChip, vaRating === r && styles.pctChipActive]}>
                    <ThemedText style={[styles.pctChipText, vaRating === r && styles.pctChipTextActive]}>
                      {r}%
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              {vaRating > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.sliderRow}>
                    <View style={styles.sliderLabelBlock}>
                      <ThemedText style={styles.sliderLabel}>VA Compensation ({vaRating}%)</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        Tax-free monthly payment
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.sliderValue, { color: Brand.tactical, fontSize: 20 }]}>
                      {formatMoney(vaMonthly)}/mo
                    </ThemedText>
                  </View>

                  <View style={[styles.matchBanner, { backgroundColor: crdpEligible ? `${Brand.success}15` : `${Brand.warning}15` }]}>
                    <ThemedText type="small" style={{ color: crdpEligible ? Brand.success : Brand.warning, fontWeight: '600' }}>
                      {crdpEligible
                        ? `✓ CRDP eligible (≥50%): Full retirement + Full VA — no offset. You receive both.`
                        : `⚠ Rating <50%: Retirement pay is offset by VA amount. Net income ≈ pension amount (but VA portion is tax-free).`}
                    </ThemedText>
                  </View>

                  <View style={styles.divider} />
                  <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                    COMBINED MONTHLY INCOME AT RETIREMENT
                  </ThemedText>
                  <View style={styles.sliderRow}>
                    <ThemedText style={styles.sliderLabel}>
                      {crdpEligible ? 'Pension + VA' : 'Net income (offset)'}
                    </ThemedText>
                    <ThemedText style={[styles.sliderValue, { color: Brand.accent }]}>
                      {formatMoney(combinedMonthly)}/mo
                    </ThemedText>
                  </View>
                  {crdpEligible && (
                    <View style={styles.quickStats}>
                      <ThemedView type="backgroundElement" style={styles.quickStat}>
                        <ThemedText style={[styles.quickStatVal, { fontSize: 18, color: Brand.primary }]}>
                          {formatMoney(pensionMonthly)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">Pension/mo</ThemedText>
                      </ThemedView>
                      <ThemedView type="backgroundElement" style={styles.quickStat}>
                        <ThemedText style={[styles.quickStatVal, { fontSize: 18, color: Brand.tactical }]}>
                          {formatMoney(vaMonthly)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">VA comp/mo</ThemedText>
                      </ThemedView>
                      <ThemedView type="backgroundElement" style={styles.quickStat}>
                        <ThemedText style={[styles.quickStatVal, { fontSize: 18, color: Brand.accent }]}>
                          {formatMoney(combinedMonthly)}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">Total/mo</ThemedText>
                      </ThemedView>
                    </View>
                  )}
                </>
              )}
            </View>
          </ThemedView>
        </View>

        {/* Disclaimer */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          Pay data is from {BASIC_PAY_DATA_YEAR} DoD tables. Projections use your current pay grade
          as a proxy for the high-3 average (assumes same grade for last 3 years). TSP projections
          assume constant monthly contributions and a fixed annual return. Actual results depend
          on promotions, grade changes, and market performance. Consult your installation's
          financial readiness office for official guidance.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', lineHeight: 34 },
  headerText: { gap: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  pressed: { opacity: 0.6 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: Spacing.one },
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two + 2 },
  stepperGroup: { gap: Spacing.three },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },
  payPreview: { fontSize: 20, fontWeight: '700', color: Brand.primary },
  quickStats: { flexDirection: 'row', gap: Spacing.two },
  quickStat: { flex: 1, borderRadius: Spacing.three, padding: Spacing.three, alignItems: 'center', gap: Spacing.one },
  quickStatVal: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  systemToggle: { flexDirection: 'row', gap: Spacing.two },
  systemBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  systemBtnActive: { backgroundColor: Brand.primary },
  systemBtnText: { fontSize: 12, fontWeight: '600' },
  systemBtnTextActive: { color: '#FFFFFF' },
  systemNote: { lineHeight: 18 },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sliderLabelBlock: { flex: 1, gap: 2 },
  sliderLabel: { fontSize: 15, fontWeight: '500' },
  sliderValue: { fontSize: 22, fontWeight: '800' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  pctChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.25)',
  },
  pctChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  pctChipText: { fontSize: 13, fontWeight: '500' },
  pctChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  matchBanner: { borderRadius: Spacing.two, padding: Spacing.two },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
});
