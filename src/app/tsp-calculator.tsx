import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { PayGrade } from '@/data/bah-rates';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { annualLimit, calcTspProjection, L_FUNDS, TSP_FUNDS } from '@/features/tsp/utils/tspCalc';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

type Tab = 'calc' | 'funds' | 'brs';

const RETURN_STEPS = [3, 4, 5, 6, 7, 8, 9, 10];
const YEARS_STEPS  = [5, 10, 15, 20, 25, 30];
const AGE_STEPS    = [20, 22, 25, 28, 30, 32, 35, 38, 40, 45, 50, 55, 60, 63, 65];

function fmtM(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}>
      <ThemedText style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={styles.miniBarTrack}>
      <View style={[styles.miniBarFill, { width: `${Math.min(100, pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <ThemedText style={styles.sectionLabel}>{children}</ThemedText>;
}

export default function TspCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const storeGrade = useUserStore((s) => s.payGrade);
  const storeYos = useUserStore((s) => s.yos);

  const [tab, setTab] = useState<Tab>('calc');
  const [grade, setGrade] = useState<PayGrade>(storeGrade ?? 'E5');
  const [yos, setYos] = useState(storeYos ?? 6);
  const [contribPct, setContribPct] = useState(5);
  const [returnIdx, setReturnIdx] = useState(4);   // 7%
  const [yearsIdx, setYearsIdx] = useState(2);      // 15 years
  const [age, setAge] = useState(30);

  const annualReturn = RETURN_STEPS[returnIdx] / 100;
  const years = YEARS_STEPS[yearsIdx];
  const limit = annualLimit(age);

  const result = useMemo(
    () => calcTspProjection(grade, yos, contribPct, annualReturn, years, age),
    [grade, yos, contribPct, annualReturn, years, age],
  );

  const atMaxMatch = contribPct >= 5;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools'))}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>TSP Deep Dive</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TabBtn label="CALCULATOR" active={tab === 'calc'} onPress={() => setTab('calc')} />
        <TabBtn label="FUNDS"      active={tab === 'funds'} onPress={() => setTab('funds')} />
        <TabBtn label="BRS MATCH"  active={tab === 'brs'}   onPress={() => setTab('brs')} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── CALCULATOR TAB ── */}
        {tab === 'calc' && (
          <>
            {/* Pay Profile */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <SectionLabel>PAY PROFILE</SectionLabel>
              <ThemedText style={[styles.subLabel, { color: tc.textSecondary }]}>Select your rank and years of service</ThemedText>
              <GradePicker selected={grade} onSelect={setGrade} />
              <NumberStepper label={`Years of Service: ${yos}`} value={yos} min={0} max={30} step={1} onChange={setYos} />
              <NumberStepper label={`Current Age: ${age}`} value={age} min={18} max={65} step={1} onChange={setAge} />
            </ThemedView>

            {/* Contribution */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <SectionLabel>CONTRIBUTION</SectionLabel>
              <ThemedText style={[styles.subLabel, { color: tc.textSecondary }]}>
                Minimum 5% captures the full BRS government match
              </ThemedText>
              <NumberStepper
                label={`Contribution: ${contribPct}% of basic pay`}
                value={contribPct}
                min={0} max={100} step={1}
                onChange={setContribPct}
              />
              {!atMaxMatch && (
                <View style={[styles.warningBox, { backgroundColor: Brand.warning + '18', borderColor: Brand.warning + '60' }]}>
                  <ThemedText style={[styles.warningText, { color: Brand.warning }]}>
                    ⚠  Contributing less than 5% — you're leaving ${Math.round(result.matchLeftOnTable).toLocaleString()}/mo in free match on the table.
                  </ThemedText>
                </View>
              )}
              {atMaxMatch && (
                <View style={[styles.successBox, { backgroundColor: Brand.success + '18', borderColor: Brand.success + '60' }]}>
                  <ThemedText style={[styles.successText, { color: Brand.success }]}>
                    ✓  Capturing full government match
                  </ThemedText>
                </View>
              )}
            </ThemedView>

            {/* Projection Settings */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <SectionLabel>PROJECTION SETTINGS</SectionLabel>
              <NumberStepper
                label={`Expected Return: ${RETURN_STEPS[returnIdx]}% per year`}
                value={returnIdx}
                min={0} max={RETURN_STEPS.length - 1} step={1}
                onChange={setReturnIdx}
              />
              <NumberStepper
                label={`Grow for: ${years} years`}
                value={yearsIdx}
                min={0} max={YEARS_STEPS.length - 1} step={1}
                onChange={setYearsIdx}
              />
            </ThemedView>

            {/* Result */}
            <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: Brand.tactical }]}>
              <ThemedText style={styles.resultEyebrow}>PROJECTED BALANCE IN {years} YEARS</ThemedText>
              <ThemedText style={styles.resultBig}>{fmtM(result.finalBalance)}</ThemedText>

              <View style={[styles.resultDivider, { backgroundColor: tc.borderColor }]} />

              <View style={styles.resultRows}>
                <View style={styles.resultRow}>
                  <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Your contributions</ThemedText>
                  <ThemedText style={styles.resultVal}>${Math.round(result.memberMonthly).toLocaleString()}/mo</ThemedText>
                </View>
                <View style={styles.resultRow}>
                  <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Government match</ThemedText>
                  <ThemedText style={[styles.resultVal, { color: Brand.tactical }]}>${Math.round(result.govtMatchMonthly).toLocaleString()}/mo</ThemedText>
                </View>
                <View style={styles.resultRow}>
                  <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Annual contribution</ThemedText>
                  <ThemedText style={styles.resultVal}>${Math.round(result.annualContrib).toLocaleString()}</ThemedText>
                </View>
                <View style={styles.resultRow}>
                  <ThemedText style={[styles.resultLabel, { color: tc.textSecondary }]}>Annual IRS limit (age {age})</ThemedText>
                  <ThemedText style={[styles.resultVal, result.atLimit && { color: Brand.warning }]}>
                    ${limit.toLocaleString()}{result.atLimit ? ' ✓' : ''}
                  </ThemedText>
                </View>
              </View>
            </ThemedView>

            {/* Growth Projection */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <SectionLabel>GROWTH PROJECTION</SectionLabel>
              {result.points
                .filter((p) => p.year > 0 && p.year % (years <= 10 ? 1 : 5) === 0)
                .map((p) => (
                  <View key={p.year} style={styles.chartRow}>
                    <ThemedText style={[styles.chartYear, { color: tc.textHint }]}>Yr {p.year}</ThemedText>
                    <View style={styles.chartBarArea}>
                      <MiniBar pct={p.totalBalance / result.finalBalance} color={Brand.tactical} />
                    </View>
                    <ThemedText style={styles.chartAmt}>{fmtM(p.totalBalance)}</ThemedText>
                  </View>
                ))}
            </ThemedView>

            <View style={[styles.noteCard, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
              <ThemedText style={[styles.noteText, { color: tc.textSecondary }]}>
                Projection assumes a constant contribution rate and annual return. Actual results will vary. Does not account for pay raises, fund changes, or withdrawals. Verify IRS contribution limits at tsp.gov.
              </ThemedText>
            </View>
          </>
        )}

        {/* ── FUNDS TAB ── */}
        {tab === 'funds' && (
          <>
            <View style={[styles.noteCard, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
              <ThemedText style={[styles.noteText, { color: tc.textSecondary }]}>
                TSP offers five core funds and a suite of Lifecycle (L) funds that automatically rebalance as your target retirement date approaches.
              </ThemedText>
            </View>

            <SectionLabel>CORE FUNDS</SectionLabel>

            {TSP_FUNDS.map((fund) => (
              <ThemedView key={fund.id} type="backgroundElement" style={[styles.fundCard, { borderLeftColor: fund.color }]}>
                <View style={styles.fundHeader}>
                  <View style={[styles.fundBadge, { backgroundColor: fund.color + '25' }]}>
                    <ThemedText style={[styles.fundId, { color: fund.color }]}>{fund.id}</ThemedText>
                  </View>
                  <View style={styles.fundTitleArea}>
                    <ThemedText style={styles.fundName}>{fund.name}</ThemedText>
                    <ThemedText style={[styles.fundFullName, { color: tc.textSecondary }]}>{fund.fullName}</ThemedText>
                  </View>
                </View>

                <View style={styles.fundMeta}>
                  <View style={[styles.fundMetaItem, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
                    <ThemedText style={[styles.fundMetaLabel, { color: tc.textHint }]}>AVG RETURN</ThemedText>
                    <ThemedText style={[styles.fundMetaVal, { color: fund.color }]}>{fund.avgReturn}</ThemedText>
                  </View>
                  <View style={[styles.fundMetaItem, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
                    <ThemedText style={[styles.fundMetaLabel, { color: tc.textHint }]}>RISK LEVEL</ThemedText>
                    <ThemedText style={[styles.fundMetaVal, { color: fund.color }]}>{fund.risk}</ThemedText>
                  </View>
                </View>

                <ThemedText style={[styles.fundDesc, { color: tc.textSecondary }]}>{fund.description}</ThemedText>

                <View style={[styles.fundBestFor, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
                  <ThemedText style={[styles.fundBestForLabel, { color: Brand.tactical }]}>BEST FOR</ThemedText>
                  <ThemedText style={[styles.fundBestForText, { color: tc.textPrimary }]}>{fund.bestFor}</ThemedText>
                </View>
              </ThemedView>
            ))}

            <SectionLabel>L FUNDS — LIFECYCLE</SectionLabel>
            <View style={[styles.noteCard, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
              <ThemedText style={[styles.noteText, { color: tc.textSecondary }]}>
                L Funds automatically shift from aggressive to conservative as you approach your target date. Pick the fund closest to when you plan to withdraw.
              </ThemedText>
            </View>

            {L_FUNDS.map((lf) => (
              <ThemedView key={lf.id} type="backgroundElement" style={styles.lFundCard}>
                <View style={styles.lFundHeader}>
                  <ThemedText style={[styles.lFundId, { color: Brand.accent }]}>{lf.id}</ThemedText>
                  <ThemedText style={[styles.lFundTarget, { color: tc.textSecondary }]}>{lf.targetDate}</ThemedText>
                </View>
                <ThemedText style={[styles.lFundDesc, { color: tc.textSecondary }]}>{lf.description}</ThemedText>
                <View style={styles.lAllocRow}>
                  {lf.allocations.map((a) => {
                    const fund = TSP_FUNDS.find((f) => f.id === a.fund);
                    return (
                      <View key={a.fund} style={styles.lAllocItem}>
                        <ThemedText style={[styles.lAllocFund, { color: fund?.color ?? tc.textPrimary }]}>{a.fund}</ThemedText>
                        <ThemedText style={[styles.lAllocPct, { color: tc.textHint }]}>{a.pct}%</ThemedText>
                        <View style={[styles.lAllocBar, { height: Math.max(4, a.pct / 2), backgroundColor: fund?.color ?? tc.textPrimary }]} />
                      </View>
                    );
                  })}
                </View>
              </ThemedView>
            ))}
          </>
        )}

        {/* ── BRS MATCH TAB ── */}
        {tab === 'brs' && (
          <>
            <ThemedView type="backgroundElement" style={[styles.card, { borderLeftWidth: 3, borderLeftColor: Brand.tactical }]}>
              <ThemedText style={styles.heroEyebrow}>BRS GOVERNMENT MATCH</ThemedText>
              <ThemedText style={styles.heroTitle}>Don&apos;t leave free money behind</ThemedText>
              <ThemedText style={[styles.heroBody, { color: tc.textSecondary }]}>
                Under the Blended Retirement System, the government automatically contributes 1% of your basic pay to your TSP. They then match your contributions dollar-for-dollar up to 3%, and 50 cents per dollar on the next 2%. Contribute at least 5% to capture the full match.
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <SectionLabel>PAY PROFILE</SectionLabel>
              <GradePicker selected={grade} onSelect={setGrade} />
              <NumberStepper label={`Years of Service: ${yos}`} value={yos} min={0} max={30} step={1} onChange={setYos} />
            </ThemedView>

            <SectionLabel>CONTRIBUTION COMPARISON</SectionLabel>
            <ThemedText style={[styles.subLabel, { color: tc.textSecondary, marginTop: -Spacing.one, marginBottom: Spacing.one }]}>
              Tap a row to select that contribution rate
            </ThemedText>

            {[0, 1, 2, 3, 4, 5, 6, 8, 10].map((pct) => {
              const r2 = calcTspProjection(grade, yos, pct, 0.07, 20, age);
              const maxR = calcTspProjection(grade, yos, 5, 0.07, 20, age);
              const isCurrent = pct === contribPct;
              const isOptimal = pct >= 5;
              return (
                <Pressable key={pct} onPress={() => setContribPct(pct)}>
                  <ThemedView
                    type="backgroundElement"
                    style={[
                      styles.matchRow,
                      { borderColor: tc.borderColor },
                      isCurrent && { borderColor: Brand.tactical, borderWidth: 2 },
                    ]}>
                    <View style={[
                      styles.matchPctBadge,
                      { backgroundColor: isOptimal ? Brand.tactical + '20' : tc.surfaceInner },
                    ]}>
                      <ThemedText style={[
                        styles.matchPctText,
                        { color: isOptimal ? Brand.tactical : tc.textPrimary },
                        isCurrent && { color: Brand.tactical },
                      ]}>
                        {pct}%
                      </ThemedText>
                    </View>
                    <View style={styles.matchDetails}>
                      <View style={styles.matchDetailRow}>
                        <ThemedText style={[styles.matchDetailLabel, { color: tc.textSecondary }]}>Your contribution</ThemedText>
                        <ThemedText style={styles.matchDetailVal}>${Math.round(r2.memberMonthly).toLocaleString()}/mo</ThemedText>
                      </View>
                      <View style={styles.matchDetailRow}>
                        <ThemedText style={[styles.matchDetailLabel, { color: tc.textSecondary }]}>Govt match</ThemedText>
                        <ThemedText style={[styles.matchDetailVal, { color: Brand.tactical }]}>${Math.round(r2.govtMatchMonthly).toLocaleString()}/mo</ThemedText>
                      </View>
                      <View style={[styles.matchDivider, { backgroundColor: tc.borderColor }]} />
                      {pct < 5 ? (
                        <ThemedText style={[styles.matchNote, { color: Brand.warning }]}>
                          💸  Forfeiting ${Math.round(r2.matchLeftOnTable).toLocaleString()}/mo · ~{fmtM(maxR.finalBalance - r2.finalBalance)} over 20 yrs
                        </ThemedText>
                      ) : (
                        <ThemedText style={[styles.matchNote, { color: Brand.success }]}>
                          ✓  Full match captured
                        </ThemedText>
                      )}
                    </View>
                  </ThemedView>
                </Pressable>
              );
            })}

            <View style={[styles.noteCard, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
              <ThemedText style={[styles.noteText, { color: tc.textSecondary }]}>
                BRS matching applies only to members who enrolled in BRS (joined after Jan 1, 2018, or opted in during the open enrollment window). Legacy/High-3 members do not receive government matching contributions.
              </ThemedText>
            </View>
          </>
        )}
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

  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.two, borderRadius: 4,
    borderWidth: 1, borderColor: Brand.border, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Brand.tactical, borderColor: Brand.tactical },
  tabBtnText: { fontSize: 11, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  tabBtnTextActive: { color: '#000' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two + 2 },

  // Section labels
  sectionLabel: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5, textTransform: 'uppercase' },
  subLabel: { fontSize: 12, lineHeight: 17, marginTop: -Spacing.one },

  card: { borderRadius: 6, padding: Spacing.three, gap: Spacing.two + 2 },

  // Warning / success banners
  warningBox: { borderRadius: 4, borderWidth: 1, padding: Spacing.two },
  warningText: { fontSize: 12, lineHeight: 17 },
  successBox: { borderRadius: 4, borderWidth: 1, padding: Spacing.two },
  successText: { fontSize: 12, fontWeight: '700' },

  // Result card
  resultCard: { borderRadius: 6, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultBig: { fontSize: 36, fontWeight: '900', color: Brand.tactical, lineHeight: 40 },
  resultDivider: { height: 1, marginVertical: Spacing.one },
  resultRows: { gap: Spacing.one + 2 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { fontSize: 13 },
  resultVal: { fontSize: 13, fontWeight: '700' },

  // Chart
  chartRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chartYear: { fontSize: 12, width: 40 },
  chartBarArea: { flex: 1 },
  chartAmt: { fontSize: 12, fontWeight: '700', color: Brand.tactical, width: 64, textAlign: 'right' },
  miniBarTrack: { height: 6, backgroundColor: Brand.border, borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 3 },

  // Note card
  noteCard: { borderRadius: 6, borderWidth: 1, padding: Spacing.three },
  noteText: { fontSize: 12, lineHeight: 18 },

  // Fund cards
  fundCard: { borderRadius: 6, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  fundHeader: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  fundBadge: { width: 44, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  fundId: { fontSize: 20, fontWeight: '900' },
  fundTitleArea: { flex: 1, gap: 3 },
  fundName: { fontSize: 15, fontWeight: '800' },
  fundFullName: { fontSize: 12 },
  fundMeta: { flexDirection: 'row', gap: Spacing.two },
  fundMetaItem: { flex: 1, borderRadius: 4, borderWidth: 1, padding: Spacing.two, gap: 3 },
  fundMetaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  fundMetaVal: { fontSize: 16, fontWeight: '800' },
  fundDesc: { fontSize: 13, lineHeight: 19 },
  fundBestFor: { borderRadius: 4, borderWidth: 1, padding: Spacing.two, gap: 4 },
  fundBestForLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  fundBestForText: { fontSize: 12, lineHeight: 17 },

  // L Fund cards
  lFundCard: { borderRadius: 6, padding: Spacing.three, gap: Spacing.two },
  lFundHeader: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  lFundId: { fontSize: 16, fontWeight: '900' },
  lFundTarget: { fontSize: 13 },
  lFundDesc: { fontSize: 13, lineHeight: 18 },
  lAllocRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end', marginTop: Spacing.one },
  lAllocItem: { flex: 1, alignItems: 'center', gap: 3 },
  lAllocFund: { fontSize: 11, fontWeight: '800' },
  lAllocPct: { fontSize: 11 },
  lAllocBar: { width: '100%', borderRadius: 2 },

  // BRS match hero
  heroEyebrow: { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroBody: { fontSize: 13, lineHeight: 20 },

  // BRS match rows
  matchRow: {
    borderRadius: 6, padding: Spacing.two + 4, flexDirection: 'row', gap: Spacing.two,
    borderWidth: 1,
  },
  matchPctBadge: { width: 48, height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  matchPctText: { fontSize: 20, fontWeight: '900' },
  matchDetails: { flex: 1, gap: Spacing.one },
  matchDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  matchDetailLabel: { fontSize: 12 },
  matchDetailVal: { fontSize: 12, fontWeight: '700' },
  matchDivider: { height: 1, marginVertical: 2 },
  matchNote: { fontSize: 12, lineHeight: 16 },
});
