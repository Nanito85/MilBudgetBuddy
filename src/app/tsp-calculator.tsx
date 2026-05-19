import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PayGrade } from '@/data/bah-rates';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { annualLimit, calcTspProjection, L_FUNDS, TSP_FUNDS } from '@/features/tsp/utils/tspCalc';
import { Brand, Spacing } from '@/constants/theme';
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

export default function TspCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
          onPress={() => (router.canGoBack() ? router.back() : router.push('/'))}
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
            {/* Inputs */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>PAY GRADE</ThemedText>
              <GradePicker selected={grade} onSelect={setGrade} />

              <View style={styles.row}>
                <View style={styles.half}>
                  <NumberStepper label={`YOS: ${yos}`} value={yos} min={0} max={30} step={1} onChange={setYos} />
                </View>
                <View style={styles.half}>
                  <NumberStepper label={`Age: ${age}`} value={age} min={18} max={65} step={1} onChange={setAge} />
                </View>
              </View>

              <NumberStepper label={`Contribution: ${contribPct}% of basic pay`} value={contribPct} min={0} max={100} step={1} onChange={setContribPct} />
              {!atMaxMatch && (
                <ThemedText style={styles.warningNote}>
                  ⚠ Contributing less than 5% — you&apos;re leaving ${Math.round(result.matchLeftOnTable).toLocaleString()}/mo in free match on the table.
                </ThemedText>
              )}

              <View style={styles.row}>
                <View style={styles.half}>
                  <NumberStepper
                    label={`Return: ${RETURN_STEPS[returnIdx]}%/yr`}
                    value={returnIdx}
                    min={0} max={RETURN_STEPS.length - 1} step={1}
                    onChange={setReturnIdx}
                  />
                </View>
                <View style={styles.half}>
                  <NumberStepper
                    label={`Grow for: ${years} yrs`}
                    value={yearsIdx}
                    min={0} max={YEARS_STEPS.length - 1} step={1}
                    onChange={setYearsIdx}
                  />
                </View>
              </View>
            </ThemedView>

            {/* Result */}
            <ThemedView type="backgroundElement" style={styles.resultCard}>
              <ThemedText style={styles.resultEyebrow}>PROJECTED BALANCE IN {years} YEARS</ThemedText>
              <ThemedText style={styles.resultBig}>{fmtM(result.finalBalance)}</ThemedText>

              <View style={styles.resultRows}>
                <View style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>Your contributions/mo</ThemedText>
                  <ThemedText style={styles.resultVal}>${Math.round(result.memberMonthly).toLocaleString()}</ThemedText>
                </View>
                <View style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>Govt match/mo</ThemedText>
                  <ThemedText style={[styles.resultVal, { color: Brand.tactical }]}>${Math.round(result.govtMatchMonthly).toLocaleString()}</ThemedText>
                </View>
                <View style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>Annual contribution</ThemedText>
                  <ThemedText style={styles.resultVal}>${Math.round(result.annualContrib).toLocaleString()}</ThemedText>
                </View>
                <View style={styles.resultRow}>
                  <ThemedText style={styles.resultLabel}>Annual limit (age {age})</ThemedText>
                  <ThemedText style={[styles.resultVal, result.atLimit && { color: Brand.warning }]}>
                    ${limit.toLocaleString()} {result.atLimit ? '✓ AT LIMIT' : ''}
                  </ThemedText>
                </View>
              </View>
            </ThemedView>

            {/* Simple projection chart — text bars */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>GROWTH PROJECTION</ThemedText>
              {result.points
                .filter((p) => p.year > 0 && p.year % (years <= 10 ? 1 : 5) === 0)
                .map((p) => (
                  <View key={p.year} style={styles.chartRow}>
                    <ThemedText style={styles.chartYear}>Yr {p.year}</ThemedText>
                    <View style={styles.chartBarArea}>
                      <MiniBar pct={p.totalBalance / result.finalBalance} color={Brand.tactical} />
                    </View>
                    <ThemedText style={styles.chartAmt}>{fmtM(p.totalBalance)}</ThemedText>
                  </View>
                ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.noteCard}>
              <ThemedText style={styles.noteText}>
                Projection assumes constant contribution rate and annual return. Actual results will vary. Does not account for pay raises, fund changes, or withdrawals. Verify contribution limits at tsp.gov.
              </ThemedText>
            </ThemedView>
          </>
        )}

        {/* ── FUNDS TAB ── */}
        {tab === 'funds' && (
          <>
            {TSP_FUNDS.map((fund) => (
              <ThemedView key={fund.id} type="backgroundElement" style={[styles.fundCard, { borderLeftColor: fund.color }]}>
                <View style={styles.fundHeader}>
                  <View style={[styles.fundBadge, { backgroundColor: fund.color + '25' }]}>
                    <ThemedText style={[styles.fundId, { color: fund.color }]}>{fund.id}</ThemedText>
                  </View>
                  <View style={styles.fundTitleArea}>
                    <ThemedText style={styles.fundName}>{fund.name}</ThemedText>
                    <ThemedText style={styles.fundFullName}>{fund.fullName}</ThemedText>
                  </View>
                </View>
                <View style={styles.fundMeta}>
                  <View style={styles.fundMetaItem}>
                    <ThemedText style={styles.fundMetaLabel}>AVG RETURN</ThemedText>
                    <ThemedText style={[styles.fundMetaVal, { color: fund.color }]}>{fund.avgReturn}</ThemedText>
                  </View>
                  <View style={styles.fundMetaItem}>
                    <ThemedText style={styles.fundMetaLabel}>RISK</ThemedText>
                    <ThemedText style={[styles.fundMetaVal, { color: fund.color }]}>{fund.risk}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.fundDesc}>{fund.description}</ThemedText>
                <View style={styles.fundBestFor}>
                  <ThemedText style={styles.fundBestForLabel}>BEST FOR</ThemedText>
                  <ThemedText style={styles.fundBestForText}>{fund.bestFor}</ThemedText>
                </View>
              </ThemedView>
            ))}

            <ThemedText style={styles.sectionDivider}>L FUNDS (LIFECYCLE)</ThemedText>
            {L_FUNDS.map((lf) => (
              <ThemedView key={lf.id} type="backgroundElement" style={styles.lFundCard}>
                <View style={styles.lFundHeader}>
                  <ThemedText style={styles.lFundId}>{lf.id}</ThemedText>
                  <ThemedText style={styles.lFundTarget}>{lf.targetDate}</ThemedText>
                </View>
                <ThemedText style={styles.lFundDesc}>{lf.description}</ThemedText>
                <View style={styles.lAllocRow}>
                  {lf.allocations.map((a) => {
                    const fund = TSP_FUNDS.find((f) => f.id === a.fund);
                    return (
                      <View key={a.fund} style={styles.lAllocItem}>
                        <ThemedText style={[styles.lAllocFund, { color: fund?.color ?? '#fff' }]}>{a.fund}</ThemedText>
                        <ThemedText style={styles.lAllocPct}>{a.pct}%</ThemedText>
                        <View style={[styles.lAllocBar, { height: Math.max(4, a.pct / 2), backgroundColor: fund?.color ?? '#fff' }]} />
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
              <ThemedText style={styles.heroBody}>
                Under the Blended Retirement System, the government automatically contributes 1% of your basic pay to your TSP. Then they match your contributions dollar-for-dollar up to 3%, and 50 cents per dollar on the next 2%. To capture the full match, you must contribute at least 5%.
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>PAY GRADE</ThemedText>
              <GradePicker selected={grade} onSelect={setGrade} />
              <NumberStepper label={`YOS: ${yos}`} value={yos} min={0} max={30} step={1} onChange={setYos} />
            </ThemedView>

            {[0, 1, 2, 3, 4, 5, 6, 8, 10].map((pct) => {
              const r2 = calcTspProjection(grade, yos, pct, 0.07, 20, age);
              const maxR = calcTspProjection(grade, yos, 5, 0.07, 20, age);
              const isCurrent = pct === contribPct;
              return (
                <Pressable key={pct} onPress={() => setContribPct(pct)}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.matchRow, isCurrent && { borderColor: Brand.tactical, borderWidth: 1.5 }]}>
                    <View style={styles.matchPct}>
                      <ThemedText style={[styles.matchPctText, isCurrent && { color: Brand.tactical }]}>{pct}%</ThemedText>
                    </View>
                    <View style={styles.matchDetails}>
                      <View style={styles.matchDetailRow}>
                        <ThemedText style={styles.matchDetailLabel}>Your contribution</ThemedText>
                        <ThemedText style={styles.matchDetailVal}>${Math.round(r2.memberMonthly).toLocaleString()}/mo</ThemedText>
                      </View>
                      <View style={styles.matchDetailRow}>
                        <ThemedText style={styles.matchDetailLabel}>Govt match</ThemedText>
                        <ThemedText style={[styles.matchDetailVal, { color: Brand.tactical }]}>${Math.round(r2.govtMatchMonthly).toLocaleString()}/mo</ThemedText>
                      </View>
                      {pct < 5 && (
                        <ThemedText style={styles.matchLost}>
                          💸 Losing ${Math.round(r2.matchLeftOnTable).toLocaleString()}/mo · ~{fmtM(maxR.finalBalance - r2.finalBalance)} over 20yr
                        </ThemedText>
                      )}
                      {pct >= 5 && (
                        <ThemedText style={[styles.matchLost, { color: Brand.tactical }]}>
                          ✓ Capturing full government match
                        </ThemedText>
                      )}
                    </View>
                  </ThemedView>
                </Pressable>
              );
            })}

            <ThemedView type="backgroundElement" style={styles.noteCard}>
              <ThemedText style={styles.noteText}>
                BRS matching applies only to service members who enrolled in BRS (joined after 1 Jan 2018, or opted in during the enrollment window). Legacy/High-3 members do not receive matching contributions.
              </ThemedText>
            </ThemedView>
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  tabBtn: {
    flex: 1, paddingVertical: Spacing.one + 2, borderRadius: 4,
    borderWidth: 1, borderColor: Brand.border, alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: Brand.tactical, borderColor: Brand.tactical },
  tabBtnText: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  tabBtnTextActive: { color: '#000' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1, marginBottom: 2 },
  row: { flexDirection: 'row', gap: Spacing.two },
  half: { flex: 1 },

  warningNote: { fontSize: 11, color: Brand.warning, lineHeight: 16 },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3, borderLeftColor: Brand.tactical },
  resultEyebrow: { fontSize: 8, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultBig: { fontSize: 26, fontWeight: '900', color: '#C8D8E8' },
  resultRows: { gap: Spacing.one },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resultLabel: { fontSize: 12, color: '#4D7A9A' },
  resultVal: { fontSize: 12, fontWeight: '700', color: '#C8D8E8' },

  chartRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  chartYear: { fontSize: 10, color: '#4D7A9A', width: 36 },
  chartBarArea: { flex: 1 },
  chartAmt: { fontSize: 11, fontWeight: '700', color: Brand.tactical, width: 60, textAlign: 'right' },
  miniBarTrack: { height: 6, backgroundColor: Brand.border, borderRadius: 3, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 3 },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, color: '#3D6080', lineHeight: 16 },

  sectionDivider: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 1, textAlign: 'center', marginTop: Spacing.one },

  fundCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  fundHeader: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  fundBadge: { width: 40, height: 40, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  fundId: { fontSize: 18, fontWeight: '900' },
  fundTitleArea: { flex: 1, gap: 2 },
  fundName: { fontSize: 14, fontWeight: '800', color: '#C8D8E8' },
  fundFullName: { fontSize: 10, color: '#4D7A9A' },
  fundMeta: { flexDirection: 'row', gap: Spacing.three },
  fundMetaItem: { gap: 2 },
  fundMetaLabel: { fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8 },
  fundMetaVal: { fontSize: 14, fontWeight: '800' },
  fundDesc: { fontSize: 12, color: '#6A8AA8', lineHeight: 18 },
  fundBestFor: { backgroundColor: Brand.border + '40', borderRadius: 4, padding: Spacing.two, gap: 3 },
  fundBestForLabel: { fontSize: 8, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  fundBestForText: { fontSize: 11, color: '#C8D8E8', lineHeight: 16 },

  lFundCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  lFundHeader: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  lFundId: { fontSize: 14, fontWeight: '900', color: Brand.accent },
  lFundTarget: { fontSize: 12, color: '#4D7A9A' },
  lFundDesc: { fontSize: 11, color: '#6A8AA8' },
  lAllocRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-end' },
  lAllocItem: { flex: 1, alignItems: 'center', gap: 2 },
  lAllocFund: { fontSize: 10, fontWeight: '800' },
  lAllocPct: { fontSize: 9, color: '#4D7A9A' },
  lAllocBar: { width: '100%', borderRadius: 2 },

  heroEyebrow: { fontSize: 8, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, color: '#4D7A9A', lineHeight: 18 },

  matchRow: {
    borderRadius: 4, padding: Spacing.two + 4, flexDirection: 'row', gap: Spacing.two,
    borderWidth: 1, borderColor: Brand.border,
  },
  matchPct: { width: 36, alignItems: 'center', justifyContent: 'center' },
  matchPctText: { fontSize: 18, fontWeight: '900', color: '#C8D8E8' },
  matchDetails: { flex: 1, gap: 3 },
  matchDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  matchDetailLabel: { fontSize: 11, color: '#4D7A9A' },
  matchDetailVal: { fontSize: 11, fontWeight: '700', color: '#C8D8E8' },
  matchLost: { fontSize: 10, color: Brand.warning, marginTop: 2 },
});
