import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PAY_GRADES, PayGrade } from '@/data/bah-rates';
import { BASIC_PAY, BASIC_PAY_DATA_YEAR, getBasicPay } from '@/data/basic-pay-rates';
import { Brand, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/user.store';

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT:  PayGrade[] = ['W1','W2','W3','W4','W5'];
const OFFICER:  PayGrade[] = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];

const ALL_YOS = [0,2,3,4,6,8,10,12,14,16,18,20,22,24,26,28,30];

function fmtPay(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

type ViewMode = 'lookup' | 'table';

export default function PayChartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const storeGrade = useUserStore((s) => s.payGrade);
  const storeYos   = useUserStore((s) => s.yos);

  const [selectedGrade, setSelectedGrade] = useState<PayGrade>(storeGrade ?? 'E5');
  const [selectedYos,   setSelectedYos]   = useState(storeYos ?? 6);
  const [mode, setMode] = useState<ViewMode>('lookup');

  const monthlyPay = useMemo(() => getBasicPay(selectedGrade, selectedYos), [selectedGrade, selectedYos]);
  const annualPay  = monthlyPay * 12;

  // Build full YOS row for the selected grade
  const brackets = BASIC_PAY[selectedGrade];
  const tableRows = ALL_YOS.map((yos) => ({
    yos,
    pay: getBasicPay(selectedGrade, yos),
  })).filter((row, i, arr) => i === 0 || row.pay !== arr[i - 1].pay);

  function GradeGroup({ label, grades }: { label: string; grades: PayGrade[] }) {
    return (
      <View style={styles.gradeGroup}>
        <ThemedText style={styles.gradeGroupLabel}>{label}</ThemedText>
        <View style={styles.gradeRow}>
          {grades.map((g) => (
            <Pressable
              key={g}
              onPress={() => setSelectedGrade(g)}
              style={[styles.gradeChip, selectedGrade === g && styles.gradeChipActive]}>
              <ThemedText style={[styles.gradeChipText, selectedGrade === g && styles.gradeChipTextActive]}>
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
          onPress={() => (router.canGoBack() ? router.back() : router.push('/'))}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Pay Chart</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        <Pressable onPress={() => setMode('lookup')} style={[styles.modeBtn, mode === 'lookup' && styles.modeBtnActive]}>
          <ThemedText style={[styles.modeBtnText, mode === 'lookup' && styles.modeBtnTextActive]}>LOOKUP</ThemedText>
        </Pressable>
        <Pressable onPress={() => setMode('table')} style={[styles.modeBtn, mode === 'table' && styles.modeBtnActive]}>
          <ThemedText style={[styles.modeBtnText, mode === 'table' && styles.modeBtnTextActive]}>FULL TABLE</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Grade picker — always visible */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>FY{BASIC_PAY_DATA_YEAR} BASIC PAY — SELECT GRADE</ThemedText>
          <GradeGroup label="ENLISTED" grades={ENLISTED} />
          <GradeGroup label="WARRANT"  grades={WARRANT} />
          <GradeGroup label="OFFICER"  grades={OFFICER} />
        </ThemedView>

        {mode === 'lookup' && (
          <>
            {/* YOS stepper */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>YEARS OF SERVICE</ThemedText>
              <View style={styles.yosRow}>
                {[0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30].map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => setSelectedYos(y)}
                    style={[styles.yosChip, selectedYos >= y && selectedYos < y + 2 && styles.yosChipActive]}>
                    <ThemedText style={[styles.yosChipText, selectedYos >= y && selectedYos < y + 2 && styles.yosChipTextActive]}>
                      {y}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>

            {/* Result */}
            <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: Brand.tactical }]}>
              <ThemedText style={styles.resultEyebrow}>{selectedGrade} · {selectedYos} YOS</ThemedText>
              <ThemedText style={styles.resultMonthly}>{fmtPay(monthlyPay)}<ThemedText style={styles.resultUnit}>/mo</ThemedText></ThemedText>
              <ThemedText style={styles.resultAnnual}>{fmtPay(annualPay)}/yr</ThemedText>
              <ThemedText style={styles.resultNote}>Basic pay only — does not include BAH, BAS, or special pays. Pre-tax.</ThemedText>
            </ThemedView>

            {/* YOS brackets for selected grade */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>{selectedGrade} — ALL YOS BRACKETS</ThemedText>
              {tableRows.map((row) => (
                <View key={row.yos} style={[styles.bracketRow, row.yos <= selectedYos && styles.bracketRowActive]}>
                  <ThemedText style={[styles.bracketYos, row.yos <= selectedYos && { color: Brand.tactical }]}>
                    {row.yos}+ yrs
                  </ThemedText>
                  <ThemedText style={[styles.bracketPay, row.yos <= selectedYos && { color: Brand.tactical }]}>
                    {fmtPay(row.pay)}/mo
                  </ThemedText>
                  <ThemedText style={styles.bracketAnnual}>{fmtPay(row.pay * 12)}/yr</ThemedText>
                </View>
              ))}
            </ThemedView>
          </>
        )}

        {mode === 'table' && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>FY{BASIC_PAY_DATA_YEAR} BASIC PAY — {selectedGrade}</ThemedText>
              <ThemedText style={styles.cardHint}>Monthly basic pay by years of service. Tap a grade above to switch.</ThemedText>

              {/* Table header */}
              <View style={styles.tableHeader}>
                <ThemedText style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>YOS</ThemedText>
                <ThemedText style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>MONTHLY</ThemedText>
                <ThemedText style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>ANNUAL</ThemedText>
              </View>

              {tableRows.map((row, i) => (
                <View key={row.yos} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                  <ThemedText style={[styles.tableCell, { flex: 1, color: '#4D7A9A' }]}>{row.yos}+</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 2, fontWeight: '700', color: '#C8D8E8' }]}>{fmtPay(row.pay)}</ThemedText>
                  <ThemedText style={[styles.tableCell, { flex: 2, color: '#4D7A9A' }]}>{fmtPay(row.pay * 12)}</ThemedText>
                </View>
              ))}
            </ThemedView>

            {/* All grades at a YOS */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>ALL GRADES AT {selectedYos} YOS</ThemedText>
              {([...ENLISTED, ...WARRANT, ...OFFICER] as PayGrade[]).map((g) => {
                const pay = getBasicPay(g, selectedYos);
                return (
                  <Pressable key={g} onPress={() => setSelectedGrade(g)}>
                    <View style={[styles.allGradeRow, g === selectedGrade && styles.allGradeRowActive]}>
                      <ThemedText style={[styles.allGradeLabel, g === selectedGrade && { color: Brand.tactical }]}>{g}</ThemedText>
                      <ThemedText style={[styles.allGradePay, g === selectedGrade && { color: Brand.tactical }]}>{fmtPay(pay)}/mo</ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ThemedView>
          </>
        )}

        <ThemedView type="backgroundElement" style={styles.noteCard}>
          <ThemedText style={styles.noteText}>
            FY{BASIC_PAY_DATA_YEAR} rates effective January 1, {BASIC_PAY_DATA_YEAR} (4.5% raise). Basic pay is subject to federal income tax. BAH, BAS, and most allowances are tax-free. Verify at militarypay.defense.gov.
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  modeRow: { flexDirection: 'row', paddingHorizontal: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  modeBtn: { flex: 1, paddingVertical: Spacing.one + 2, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, alignItems: 'center' },
  modeBtnActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  modeBtnText: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  modeBtnTextActive: { color: '#000' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  cardHint: { fontSize: 11, color: '#3D6080', lineHeight: 16 },

  gradeGroup: { gap: Spacing.one },
  gradeGroupLabel: { fontSize: 8, fontWeight: '700', color: '#3D6080', letterSpacing: 0.8 },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  gradeChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  gradeChipActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  gradeChipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  gradeChipTextActive: { color: '#000' },

  yosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  yosChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, minWidth: 36, alignItems: 'center' },
  yosChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  yosChipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  yosChipTextActive: { color: '#fff' },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.one, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultMonthly: { fontSize: 26, fontWeight: '900', color: '#C8D8E8', lineHeight: 32 },
  resultUnit: { fontSize: 13, fontWeight: '400', color: '#4D7A9A' },
  resultAnnual: { fontSize: 16, color: '#4D7A9A', fontWeight: '600' },
  resultNote: { fontSize: 10, color: '#3D6080', marginTop: 2 },

  bracketRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: Spacing.two },
  bracketRowActive: { backgroundColor: Brand.tactical + '10', borderRadius: 4, paddingHorizontal: Spacing.one },
  bracketYos: { width: 52, fontSize: 11, color: '#4D7A9A', fontWeight: '600' },
  bracketPay: { flex: 1, fontSize: 13, fontWeight: '700', color: '#C8D8E8' },
  bracketAnnual: { fontSize: 11, color: '#3D6080' },

  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Brand.border, paddingBottom: Spacing.one },
  tableHeaderCell: { fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', paddingVertical: 6 },
  tableRowAlt: { backgroundColor: Brand.border + '30' },
  tableCell: { fontSize: 12, paddingHorizontal: 2 },

  allGradeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  allGradeRowActive: { backgroundColor: Brand.tactical + '10', borderRadius: 4, paddingHorizontal: Spacing.one },
  allGradeLabel: { fontSize: 12, fontWeight: '700', color: '#4D7A9A', width: 36 },
  allGradePay: { fontSize: 13, fontWeight: '700', color: '#C8D8E8' },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, color: '#3D6080', lineHeight: 16 },
});
