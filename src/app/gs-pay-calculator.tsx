import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { estimateAnnualFedTax, FICA_RATE } from '@/data/federal-tax';
import {
  GS_LOCALITIES,
  GS_MILITARY_EQUIV,
  getGSMonthly,
  getGSPay,
  type GSLocality,
} from '@/data/gs-pay-rates';
import { useThemeColors } from '@/hooks/use-theme';

const GRADES = Array.from({ length: 15 }, (_, i) => i + 1);
const STEPS  = Array.from({ length: 10 }, (_, i) => i + 1);

const fmt  = (n: number) => '$' + Math.round(n).toLocaleString();

// Rough federal tax estimate for display only. Bracket table lives in
// data/federal-tax.ts (single source of truth, shared with lesCalc.ts) —
// single-filer only, matching this screen's own disclaimer below.
function estimateAnnualNet(annual: number): number {
  const tax = estimateAnnualFedTax(annual, false);
  const fica = annual * FICA_RATE;
  return Math.round(annual - tax - fica);
}

function GradePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tc = useThemeColors();
  return (
    <View style={pick.row}>
      {GRADES.map((g) => (
        <Pressable
          key={g}
          onPress={() => onChange(g)}
          style={[pick.btn, { backgroundColor: tc.surface, borderColor: tc.borderColor }, value === g && pick.btnActive]}>
          <ThemedText style={[pick.label, { color: tc.textHint }, value === g && pick.labelActive]}>
            {g}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function StepPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tc = useThemeColors();
  return (
    <View style={pick.row}>
      {STEPS.map((s) => (
        <Pressable
          key={s}
          onPress={() => onChange(s)}
          style={[pick.btn, { backgroundColor: tc.surface, borderColor: tc.borderColor }, value === s && pick.btnActive]}>
          <ThemedText style={[pick.label, { color: tc.textHint }, value === s && pick.labelActive]}>
            {s}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const pick = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  btn: {
    width: 36, height: 36, borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  btnActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  label: { fontSize: 12, fontWeight: '700' },
  labelActive: { color: '#FFF' },
});

function LocalityModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (l: GSLocality) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <ThemedView style={[modal.sheet, { backgroundColor: tc.background, paddingBottom: insets.bottom + Spacing.three }]}>
          <View style={[modal.handle, { backgroundColor: tc.borderColor }]} />
          <ThemedText style={modal.title}>SELECT LOCALITY AREA</ThemedText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {GS_LOCALITIES.map((loc) => (
              <TouchableOpacity
                key={loc.key}
                onPress={() => { onSelect(loc); onClose(); }}
                style={[modal.row, { borderBottomColor: tc.borderColor }, selected === loc.key && modal.rowActive]}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={[modal.locLabel, { color: tc.textPrimary }, selected === loc.key && modal.locLabelActive]}>
                    {loc.label}
                  </ThemedText>
                  {loc.notes && (
                    <ThemedText style={[modal.locNote, { color: tc.textHint }]}>{loc.notes}</ThemedText>
                  )}
                </View>
                <ThemedText style={[modal.locRate, { color: tc.textHint }, selected === loc.key && modal.locRateActive]}>
                  +{(loc.rate * 100).toFixed(2)}%
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    maxHeight: '80%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: Brand.tactical, marginBottom: Spacing.two },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowActive: { backgroundColor: Brand.primary + '15' },
  locLabel: { fontSize: 13, fontWeight: '600' },
  locLabelActive: { color: Brand.primary },
  locNote: { fontSize: 10, marginTop: 1 },
  locRate: { fontSize: 12, fontWeight: '700', width: 64, textAlign: 'right' },
  locRateActive: { color: Brand.primary },
});

export default function GSPayCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [grade, setGrade]             = useState(7);
  const [step, setStep]               = useState(1);
  const [localityKey, setLocalityKey] = useState('RUS');
  const [showLocModal, setShowLocModal] = useState(false);

  const locality = useMemo(
    () => GS_LOCALITIES.find((l) => l.key === localityKey) ?? GS_LOCALITIES[0],
    [localityKey],
  );

  const annualPay  = useMemo(() => getGSPay(grade, step, localityKey), [grade, step, localityKey]);
  const monthlyPay = useMemo(() => getGSMonthly(grade, step, localityKey), [grade, step, localityKey]);
  const annualNet  = useMemo(() => estimateAnnualNet(annualPay), [annualPay]);
  const monthlyNet = useMemo(() => Math.round(annualNet / 12), [annualNet]);

  const milEquiv = GS_MILITARY_EQUIV[grade] ?? '—';

  // Next step increase
  const nextStepAnnual = step < 10 ? getGSPay(grade, step + 1, localityKey) : null;
  const nextStepDelta  = nextStepAnnual !== null ? nextStepAnnual - annualPay : null;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>GS Pay Calculator</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero banner */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>FEDERAL CIVILIAN</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>General Schedule Pay</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textSecondary }]}>
            FY2026 GS pay table — base pay plus locality adjustment for your duty area.
          </ThemedText>
        </ThemedView>

        {/* Grade selector */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>GS GRADE</ThemedText>
          <GradePicker value={grade} onChange={setGrade} />
          <ThemedText style={[styles.cardHint, { color: tc.textSecondary }]}>
            {milEquiv ? `≈ Military equivalent: ${milEquiv}` : ''}
          </ThemedText>
        </ThemedView>

        {/* Step selector */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>WITHIN-GRADE STEP</ThemedText>
          <StepPicker value={step} onChange={setStep} />
          {nextStepDelta !== null && (
            <ThemedText style={[styles.cardHint, { color: tc.textSecondary }]}>
              Next step increase: +{fmt(nextStepDelta)}/yr · Step increases typically require 1–3 years depending on step level
            </ThemedText>
          )}
        </ThemedView>

        {/* Locality selector */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>LOCALITY PAY AREA</ThemedText>
          <Pressable
            onPress={() => setShowLocModal(true)}
            style={[styles.localityBtn, { backgroundColor: tc.background, borderColor: tc.borderColor }]}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.localityBtnLabel, { color: tc.textPrimary }]}>{locality.label}</ThemedText>
              {locality.notes && (
                <ThemedText style={[styles.localityBtnNote, { color: tc.textSecondary }]}>{locality.notes}</ThemedText>
              )}
            </View>
            <View style={styles.localityBtnRate}>
              <ThemedText style={styles.localityBtnRateText}>+{(locality.rate * 100).toFixed(2)}%</ThemedText>
            </View>
            <ThemedText style={styles.localityChevron}>›</ThemedText>
          </Pressable>
        </ThemedView>

        {/* Pay result */}
        <ThemedView type="backgroundElement" style={[styles.card, styles.resultCard]}>
          <ThemedText style={styles.resultGrade}>GS-{grade} STEP {step}</ThemedText>
          <ThemedText style={[styles.resultAnnual, { color: tc.textPrimary }]}>{fmt(annualPay)}/yr</ThemedText>
          <ThemedText style={[styles.resultMonthly, { color: tc.textSecondary }]}>{fmt(monthlyPay)}/mo gross</ThemedText>

          <View style={[styles.resultDivider, { backgroundColor: tc.borderColor }]} />

          <View style={styles.resultRow}>
            <View style={styles.resultCol}>
              <ThemedText style={[styles.resultColLabel, { color: tc.textMuted }]}>GROSS MONTHLY</ThemedText>
              <ThemedText style={[styles.resultColValue, { color: tc.textPrimary }]}>{fmt(monthlyPay)}</ThemedText>
            </View>
            <View style={styles.resultCol}>
              <ThemedText style={[styles.resultColLabel, { color: tc.textMuted }]}>EST. NET MONTHLY</ThemedText>
              <ThemedText style={[styles.resultColValue, { color: Brand.success }]}>{fmt(monthlyNet)}</ThemedText>
            </View>
          </View>

          <View style={styles.resultBreakdown}>
            <ThemedText style={[styles.resultBreakdownRow, { color: tc.textMuted }]}>
              Base Pay: {fmt(Math.round(annualPay / (1 + locality.rate)))}/yr
            </ThemedText>
            <ThemedText style={[styles.resultBreakdownRow, { color: tc.textMuted }]}>
              Locality (+{(locality.rate * 100).toFixed(2)}%): +{fmt(annualPay - Math.round(annualPay / (1 + locality.rate)))}/yr
            </ThemedText>
          </View>
        </ThemedView>

        {/* All steps for this grade */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>GS-{grade} ALL STEPS — {locality.label.split('/')[0].trim()}</ThemedText>
          <View style={styles.stepsTable}>
            <View style={[styles.stepsHeader, { borderBottomColor: tc.borderColor }]}>
              <ThemedText style={[styles.stepsCell, styles.stepsCellLabel, { color: tc.textSecondary }]}>STEP</ThemedText>
              <ThemedText style={[styles.stepsCell, styles.stepsCellHeader, { color: tc.textMuted }]}>ANNUAL</ThemedText>
              <ThemedText style={[styles.stepsCell, styles.stepsCellHeader, { color: tc.textMuted }]}>MONTHLY</ThemedText>
            </View>
            {STEPS.map((s) => {
              const ann = getGSPay(grade, s, localityKey);
              const mon = getGSMonthly(grade, s, localityKey);
              const isSelected = s === step;
              return (
                <Pressable
                  key={s}
                  onPress={() => setStep(s)}
                  style={[styles.stepsRow, { borderBottomColor: tc.borderColor + '50' }, isSelected && styles.stepsRowSelected]}>
                  <ThemedText style={[styles.stepsCell, styles.stepsCellLabel, { color: tc.textSecondary }, isSelected && { color: Brand.primary }]}>
                    {s}
                  </ThemedText>
                  <ThemedText style={[styles.stepsCell, styles.stepsCellValue, { color: tc.textSecondary }, isSelected && { color: tc.textPrimary }]}>
                    {fmt(ann)}
                  </ThemedText>
                  <ThemedText style={[styles.stepsCell, styles.stepsCellValue, { color: tc.textSecondary }, isSelected && { color: Brand.success }]}>
                    {fmt(mon)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {/* Federal benefits info */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>FEDERAL EMPLOYEE BENEFITS</ThemedText>
          {[
            { icon: '🏥', label: 'FEHB (Health)', value: 'Multiple plans; avg employee cost ~$200–500/mo' },
            { icon: '🦷', label: 'FEDVIP (Dental/Vision)', value: 'Opt-in; avg ~$25–60/mo dental' },
            { icon: '🛡️', label: 'FEGLI (Life Insurance)', value: 'Basic: $0.15/bi-weekly per $1K coverage' },
            { icon: '📊', label: 'TSP (401k)', value: '5% match under FERS; same funds as military TSP' },
            { icon: '🏁', label: 'FERS Retirement', value: '1.0–1.1% × years × high-3 salary. Eligible at 57–62.' },
            { icon: '📅', label: 'Leave', value: '13 days/yr (0–3 yrs) → 20 → 26 days/yr (15+ yrs)' },
            { icon: '👶', label: 'Paid Parental Leave', value: '12 weeks paid for new child (birth, adoption, foster)' },
          ].map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <ThemedText style={styles.benefitIcon}>{b.icon}</ThemedText>
              <View style={{ flex: 1, gap: 1 }}>
                <ThemedText style={[styles.benefitLabel, { color: tc.textPrimary }]}>{b.label}</ThemedText>
                <ThemedText style={[styles.benefitValue, { color: tc.textSecondary }]}>{b.value}</ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>

        {/* Military comparison */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>MILITARY vs. GS COMPARISON</ThemedText>
          <ThemedText style={[styles.compareNote, { color: tc.textSecondary }]}>
            GS pay does NOT include tax-free allowances (BAH/BAS). Military total compensation is typically 30–50% higher than base pay alone. Compare your military LES net pay against the GS net estimate above — not gross vs. gross.
          </ThemedText>
          <View style={styles.compareRow}>
            <View style={styles.compareCol}>
              <ThemedText style={[styles.compareColTitle, { color: tc.textPrimary }]}>GS-{grade} STEP {step}</ThemedText>
              <ThemedText style={[styles.compareColSub, { color: tc.textMuted }]}>{locality.label.split('/')[0].trim()}</ThemedText>
              <ThemedText style={[styles.compareColValue, { color: Brand.tactical }]}>{fmt(monthlyNet)}/mo net</ThemedText>
            </View>
            <ThemedText style={[styles.compareVs, { color: tc.textMuted }]}>vs.</ThemedText>
            <View style={styles.compareCol}>
              <ThemedText style={[styles.compareColTitle, { color: tc.textPrimary }]}>Military</ThemedText>
              <ThemedText style={[styles.compareColSub, { color: tc.textMuted }]}>{milEquiv}</ThemedText>
              <ThemedText style={[styles.compareColValue, { color: tc.textSecondary }]}>See LES on Home tab</ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.compareNote, { color: tc.textSecondary }]}>
            ★ GS offers FERS pension + FEHB (transferable after 5 yrs) + job security. Military offers TRICARE, BAH/BAS, 20-yr pension (BRS), and geographic mobility. Both are strong — the right choice depends on your career goals.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
            GS pay shown is the official 2026 OPM Salary Table (1.0% base raise from 2025; locality rates are frozen at 2025 levels for 2026 — no locality update was issued). Net pay estimate uses single-filer federal brackets only — state taxes and benefit deductions are not included. Verify exact pay at OPM.gov.
          </ThemedText>
        </ThemedView>

      </ScrollView>

      <LocalityModal
        visible={showLocModal}
        selected={localityKey}
        onSelect={(l) => setLocalityKey(l.key)}
        onClose={() => setShowLocModal(false)}
      />
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
    borderRadius: 4, padding: Spacing.three,
    borderLeftWidth: 3, borderLeftColor: Brand.tactical, gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.tactical },
  heroTitle:   { fontSize: 20, fontWeight: '900' },
  heroBody:    { fontSize: 12, lineHeight: 18, marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  cardHint: { fontSize: 10, lineHeight: 15 },

  localityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  localityBtnLabel: { fontSize: 13, fontWeight: '600' },
  localityBtnNote:  { fontSize: 10, marginTop: 1 },
  localityBtnRate:  { backgroundColor: Brand.tactical + '20', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  localityBtnRateText: { fontSize: 11, fontWeight: '700', color: Brand.tactical },
  localityChevron:  { fontSize: 20, color: Brand.tactical },

  resultCard: { borderColor: Brand.tactical + '50', alignItems: 'center', gap: Spacing.one },
  resultGrade:   { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  resultAnnual:  { fontSize: 24, fontWeight: '900', fontFamily: 'Courier New' },
  resultMonthly: { fontSize: 14 },
  resultDivider: { width: '100%', height: StyleSheet.hairlineWidth, marginVertical: 4 },
  resultRow: { flexDirection: 'row', width: '100%', gap: Spacing.two },
  resultCol: { flex: 1, alignItems: 'center', gap: 3 },
  resultColLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  resultColValue: { fontSize: 16, fontWeight: '700', fontFamily: 'Courier New' },
  resultBreakdown: { alignItems: 'center', gap: 2, marginTop: 4 },
  resultBreakdownRow: { fontSize: 10 },

  stepsTable: { gap: 0 },
  stepsHeader: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
    marginBottom: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 3,
  },
  stepsRowSelected: { backgroundColor: Brand.primary + '15' },
  stepsCell: { flex: 1, paddingHorizontal: 2 },
  stepsCellLabel:  { fontSize: 12, fontWeight: '700' },
  stepsCellHeader: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
  stepsCellValue:  { fontSize: 12, fontFamily: 'Courier New', textAlign: 'right' },

  benefitRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  benefitIcon: { fontSize: 18, width: 26, textAlign: 'center', lineHeight: 22 },
  benefitLabel: { fontSize: 12, fontWeight: '700' },
  benefitValue: { fontSize: 11, lineHeight: 15 },

  compareNote: { fontSize: 11, lineHeight: 16 },
  compareRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: 4 },
  compareVs: { fontSize: 14, fontWeight: '700' },
  compareCol: { flex: 1, alignItems: 'center', gap: 2 },
  compareColTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  compareColSub: { fontSize: 10 },
  compareColValue: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier New', textAlign: 'center' },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
