import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SourceBanner } from '@/components/SourceBanner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PayGrade } from '@/data/bah-rates';
import { BASIC_PAY_DATA_YEAR, getBasicPay } from '@/data/basic-pay-rates';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT:  PayGrade[] = ['W1','W2','W3','W4','W5'];
const OFFICER:  PayGrade[] = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];

const ALL_YOS = [0,2,3,4,6,8,10,12,14,16,18,20,22,24,26,28,30];

function fmtPay(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

type ViewMode = 'lookup' | 'table' | 'reserve';

export default function PayChartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const storeGrade = useUserStore((s) => s.payGrade);
  const storeYos   = useUserStore((s) => s.yos);

  const [selectedGrade, setSelectedGrade] = useState<PayGrade>(storeGrade ?? 'E5');
  const [selectedYos,   setSelectedYos]   = useState(storeYos ?? 6);
  const [mode, setMode] = useState<ViewMode>('lookup');

  const monthlyPay = useMemo(() => getBasicPay(selectedGrade, selectedYos), [selectedGrade, selectedYos]);
  const annualPay  = monthlyPay * 12;

  // Build full YOS row for the selected grade
  const tableRows = ALL_YOS.map((yos) => ({
    yos,
    pay: getBasicPay(selectedGrade, yos),
  })).filter((row, i, arr) => i === 0 || row.pay !== arr[i - 1].pay);

  function GradeGroup({ label, grades }: { label: string; grades: PayGrade[] }) {
    return (
      <View style={styles.gradeGroup}>
        <ThemedText style={[styles.gradeGroupLabel, { color: tc.textMuted }]}>{label}</ThemedText>
        <View style={styles.gradeRow}>
          {grades.map((g) => (
            <Pressable
              key={g}
              onPress={() => setSelectedGrade(g)}
              style={[styles.gradeChip, { borderColor: tc.borderColor }, selectedGrade === g && styles.gradeChipActive]}>
              <ThemedText style={[styles.gradeChipText, { color: tc.textSecondary }, selectedGrade === g && styles.gradeChipTextActive]}>
                {g}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Pay Chart</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <Pressable onPress={() => setMode('lookup')} style={[styles.modeBtn, { borderColor: tc.borderColor }, mode === 'lookup' && styles.modeBtnActive]}>
          <ThemedText style={[styles.modeBtnText, { color: tc.textMuted }, mode === 'lookup' && styles.modeBtnTextActive]}>LOOKUP</ThemedText>
        </Pressable>
        <Pressable onPress={() => setMode('table')} style={[styles.modeBtn, { borderColor: tc.borderColor }, mode === 'table' && styles.modeBtnActive]}>
          <ThemedText style={[styles.modeBtnText, { color: tc.textMuted }, mode === 'table' && styles.modeBtnTextActive]}>FULL TABLE</ThemedText>
        </Pressable>
        <Pressable onPress={() => setMode('reserve')} style={[styles.modeBtn, { borderColor: tc.borderColor }, mode === 'reserve' && styles.modeBtnActive]}>
          <ThemedText style={[styles.modeBtnText, { color: tc.textMuted }, mode === 'reserve' && styles.modeBtnTextActive]}>RESERVE/DRILL</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <SourceBanner
          sources={[
            { label: 'DFAS FY2026 Military Pay Tables — effective January 1, 2026', confidence: 'official', year: 2026, url: 'https://www.dfas.mil/MilitaryMembers/payentitlements/Pay-Tables/' },
          ]}
          disclaimer="These are gross base pay amounts before taxes and deductions. BAS, BAH, and special pays are not included."
        />

        {/* Grade picker — always visible */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>FY{BASIC_PAY_DATA_YEAR} BASIC PAY — SELECT GRADE</ThemedText>
          <GradeGroup label="ENLISTED" grades={ENLISTED} />
          <GradeGroup label="WARRANT"  grades={WARRANT} />
          <GradeGroup label="OFFICER"  grades={OFFICER} />
        </ThemedView>

        {mode === 'lookup' && (
          <>
            {/* YOS stepper */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>YEARS OF SERVICE</ThemedText>
              <View style={styles.yosRow}>
                {[0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30].map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => setSelectedYos(y)}
                    style={[styles.yosChip, { borderColor: tc.borderColor }, selectedYos >= y && selectedYos < y + 2 && styles.yosChipActive]}>
                    <ThemedText style={[styles.yosChipText, { color: tc.textSecondary }, selectedYos >= y && selectedYos < y + 2 && styles.yosChipTextActive]}>
                      {y}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>

            {/* Result */}
            <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: Brand.tactical }]}>
              <ThemedText style={styles.resultEyebrow}>{selectedGrade} · {selectedYos} YOS</ThemedText>
              <ThemedText style={[styles.resultMonthly, { color: tc.textPrimary }]}>{fmtPay(monthlyPay)}<ThemedText style={[styles.resultUnit, { color: tc.textHint }]}>/mo</ThemedText></ThemedText>
              <ThemedText style={[styles.resultAnnual, { color: tc.textHint }]}>{fmtPay(annualPay)}/yr</ThemedText>
              <ThemedText style={[styles.resultNote, { color: tc.textMuted }]}>Basic pay only — does not include BAH, BAS, or special pays. Pre-tax.</ThemedText>
            </ThemedView>

            {/* YOS brackets for selected grade */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>{selectedGrade} — ALL YOS BRACKETS</ThemedText>
              {tableRows.map((row) => (
                <View key={row.yos} style={[styles.bracketRow, row.yos <= selectedYos && styles.bracketRowActive]}>
                  <ThemedText style={[styles.bracketYos, { color: tc.textHint }, row.yos <= selectedYos && { color: Brand.tactical }]}>
                    {row.yos}+ yrs
                  </ThemedText>
                  <ThemedText style={[styles.bracketPay, { color: tc.textPrimary }, row.yos <= selectedYos && { color: Brand.tactical }]}>
                    {fmtPay(row.pay)}/mo
                  </ThemedText>
                  <ThemedText style={[styles.bracketAnnual, { color: tc.textMuted }]}>{fmtPay(row.pay * 12)}/yr</ThemedText>
                </View>
              ))}
            </ThemedView>
          </>
        )}

        {mode === 'table' && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>FY{BASIC_PAY_DATA_YEAR} BASIC PAY — {selectedGrade}</ThemedText>
              <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>Monthly basic pay by years of service. Tap a grade above to switch.</ThemedText>

              {/* Table header */}
              <View style={[styles.tableHeader, { borderBottomColor: tc.borderColor }]}>
                <ThemedText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1, color: tc.textMuted }]}>YOS</ThemedText>
                <ThemedText style={[styles.tableCell, styles.tableHeaderCell, { flex: 2, color: tc.textMuted }]}>MONTHLY</ThemedText>
                <ThemedText style={[styles.tableCell, styles.tableHeaderCell, { flex: 2, color: tc.textMuted }]}>ANNUAL</ThemedText>
              </View>

              {tableRows.map((row, i) => (
                <View key={row.yos} style={[styles.tableRow, i % 2 === 1 && { backgroundColor: tc.borderColor + '30' }]}>
                  <ThemedText style={[styles.tableCell, { flex: 1, color: tc.textHint }]}>{row.yos}+</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 2, fontWeight: '700', color: tc.textPrimary }]}>{fmtPay(row.pay)}</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 2, color: tc.textHint }]}>{fmtPay(row.pay * 12)}</ThemedText>
                </View>
              ))}
            </ThemedView>

            {/* All grades at a YOS */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>ALL GRADES AT {selectedYos} YOS</ThemedText>
              {([...ENLISTED, ...WARRANT, ...OFFICER] as PayGrade[]).map((g) => {
                const pay = getBasicPay(g, selectedYos);
                return (
                  <Pressable key={g} onPress={() => setSelectedGrade(g)}>
                    <View style={[styles.allGradeRow, g === selectedGrade && styles.allGradeRowActive]}>
                      <ThemedText style={[styles.allGradeLabel, { color: tc.textSecondary }, g === selectedGrade && { color: Brand.tactical }]}>{g}</ThemedText>
                      <ThemedText style={[styles.allGradePay, { color: tc.textPrimary }, g === selectedGrade && { color: Brand.tactical }]}>{fmtPay(pay)}/mo</ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ThemedView>
          </>
        )}

        {mode === 'reserve' && (
          <>
            <ThemedView type="backgroundElement" style={styles.resultCard}>
              <ThemedText style={styles.resultEyebrow}>{selectedGrade} — RESERVE / GUARD DRILL PAY</ThemedText>
              <ThemedText style={[styles.resultMonthly, { color: tc.textPrimary }]}>{fmtPay(Math.round(monthlyPay / 30))}<ThemedText style={[styles.resultUnit, { color: tc.textHint }]}> / drill period</ThemedText></ThemedText>
              <ThemedText style={[styles.resultAnnual, { color: tc.textHint }]}>{fmtPay(Math.round(monthlyPay / 30 * 4))} / drill weekend (4 IDTs)</ThemedText>
              <ThemedText style={[styles.resultNote, { color: tc.textMuted }]}>1 IDT = 1/30 of active-duty monthly basic pay.</ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>ANNUAL RESERVE PAY BREAKDOWN — {selectedGrade}</ThemedText>
              {[
                { label: 'Active Duty Monthly Pay', value: fmtPay(monthlyPay) + '/mo' },
                { label: 'Pay Per IDT (1 drill period)', value: fmtPay(Math.round(monthlyPay / 30)) },
                { label: 'Drill Weekend (4 IDTs)', value: fmtPay(Math.round(monthlyPay / 30 * 4)) },
                { label: 'Typical Annual Drills (48 IDTs)', value: fmtPay(Math.round(monthlyPay / 30 * 48)) },
                { label: 'Annual Training ~15 days (ADT)', value: fmtPay(Math.round(monthlyPay / 30 * 15)) },
                { label: 'Est. Total Annual Reserve Pay', value: fmtPay(Math.round(monthlyPay / 30 * 48 + monthlyPay / 30 * 15)) },
              ].map((row, i) => (
                <View key={i} style={[styles.allGradeRow, i === 5 && styles.allGradeRowActive]}>
                  <ThemedText style={[styles.allGradeLabel, { width: 'auto', flex: 1, color: i === 5 ? Brand.tactical : tc.textSecondary, fontSize: 11 }]}>{row.label}</ThemedText>
                  <ThemedText style={[styles.allGradePay, { color: tc.textPrimary }, i === 5 && { color: Brand.tactical }]}>{row.value}</ThemedText>
                </View>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>ALL ENLISTED GRADES — DRILL PAY (4 IDTs)</ThemedText>
              {ENLISTED.map((g) => {
                const pay = getBasicPay(g, selectedYos);
                const weekend = Math.round(pay / 30 * 4);
                return (
                  <Pressable key={g} onPress={() => setSelectedGrade(g)}>
                    <View style={[styles.allGradeRow, g === selectedGrade && styles.allGradeRowActive]}>
                      <ThemedText style={[styles.allGradeLabel, { color: tc.textSecondary }, g === selectedGrade && { color: Brand.tactical }]}>{g}</ThemedText>
                      <ThemedText style={[styles.allGradePay, { color: tc.textPrimary }, g === selectedGrade && { color: Brand.tactical }]}>{fmtPay(weekend)}/weekend</ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>ALL OFFICER GRADES — DRILL PAY (4 IDTs)</ThemedText>
              {OFFICER.map((g) => {
                const pay = getBasicPay(g, selectedYos);
                const weekend = Math.round(pay / 30 * 4);
                return (
                  <Pressable key={g} onPress={() => setSelectedGrade(g)}>
                    <View style={[styles.allGradeRow, g === selectedGrade && styles.allGradeRowActive]}>
                      <ThemedText style={[styles.allGradeLabel, { color: tc.textSecondary }, g === selectedGrade && { color: Brand.tactical }]}>{g}</ThemedText>
                      <ThemedText style={[styles.allGradePay, { color: tc.textPrimary }, g === selectedGrade && { color: Brand.tactical }]}>{fmtPay(weekend)}/weekend</ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ThemedView>
          </>
        )}

        <ThemedView type="backgroundElement" style={styles.noteCard}>
          <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
            FY{BASIC_PAY_DATA_YEAR} rates effective January 1, {BASIC_PAY_DATA_YEAR} (3.8% raise). Basic pay is subject to federal income tax. BAH, BAS, and most allowances are tax-free. Verify at militarypay.defense.gov.
          </ThemedText>
        </ThemedView>
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

  modeRow: { flexDirection: 'row', paddingHorizontal: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  modeBtn: { flex: 1, paddingVertical: Spacing.one + 2, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  modeBtnText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  modeBtnTextActive: { color: '#000' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardHint: { fontSize: 11, lineHeight: 16 },

  gradeGroup: { gap: Spacing.one },
  gradeGroupLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  gradeChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  gradeChipActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  gradeChipText: { fontSize: 11, fontWeight: '700' },
  gradeChipTextActive: { color: '#000' },

  yosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  yosChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, minWidth: 36, alignItems: 'center' },
  yosChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  yosChipText: { fontSize: 11, fontWeight: '700' },
  yosChipTextActive: { color: '#fff' },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultMonthly: { fontSize: 26, fontWeight: '900', lineHeight: 32 },
  resultUnit: { fontSize: 13, fontWeight: '400' },
  resultAnnual: { fontSize: 16, fontWeight: '600' },
  resultNote: { fontSize: 10, marginTop: 2 },

  bracketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: Spacing.two },
  bracketRowActive: { backgroundColor: Brand.tactical + '10', borderRadius: 4, paddingHorizontal: Spacing.one },
  bracketYos: { width: 52, fontSize: 11, fontWeight: '600' },
  bracketPay: { flex: 1, fontSize: 13, fontWeight: '700' },
  bracketAnnual: { fontSize: 11 },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Brand.border, paddingBottom: Spacing.one },
  tableHeaderCell: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  tableRowAlt: { backgroundColor: Brand.border + '30' },
  tableCell: { fontSize: 12, paddingHorizontal: 2 },

  allGradeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  allGradeRowActive: { backgroundColor: Brand.tactical + '10', borderRadius: 4, paddingHorizontal: Spacing.one },
  allGradeLabel: { fontSize: 12, fontWeight: '700', width: 36 },
  allGradePay: { fontSize: 13, fontWeight: '700' },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, lineHeight: 16 },
});
