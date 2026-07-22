import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { findBahRateApprox } from '@/data/bah-rates';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import {
  calcGiBill,
  ELIGIBILITY_TIERS,
  ENROLLMENT_LABELS,
  EnrollmentStatus,
  GI_BILL_DATA_YEAR,
  GI_BILL_TOTAL_MONTHS,
  SCHOOL_TYPE_LABELS,
  SchoolType,
} from '@/features/gi-bill/utils/giBillCalc';
import { useThemeColors } from '@/hooks/use-theme';

function fmtDollar(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function SectionLabel({ text, tc }: { text: string; tc: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
      <ThemedText style={[styles.sectionText, { color: tc.textMuted }]}>{text}</ThemedText>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

function OptionRow<T extends string>({
  options, value, onChange, labels, tc,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
  tc: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.optionChip, { borderColor: tc.borderColor }, value === o && styles.optionChipActive]}>
          <ThemedText style={[styles.optionText, { color: tc.textHint }, value === o && styles.optionTextActive]}>
            {labels[o]}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

export default function GiBillCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [tierPct, setTierPct] = useState(100);
  const [schoolType, setSchoolType] = useState<SchoolType>('public_instate');
  const [enrollment, setEnrollment] = useState<EnrollmentStatus>('full');
  const [monthsUsed, setMonthsUsed] = useState(0);
  const [zipInput, setZipInput] = useState('');
  const [manualBah, setManualBah] = useState('2400');
  const [tuitionPerYear, setTuitionPerYear] = useState(10000);

  // Look up E5-w/dep BAH from entered ZIP — falls back to an approximate
  // same-prefix ZIP match (not necessarily the nearest MHA) for any US ZIP
  const zipLookup = useMemo(() => {
    const z = zipInput.trim();
    if (z.length === 5) return findBahRateApprox(z, 'E5', true);
    return null;
  }, [zipInput]);

  const effectiveBah = zipLookup !== null ? zipLookup.rate : (parseInt(manualBah, 10) || 0);

  const result = useMemo(
    () =>
      calcGiBill({
        eligibilityPct: tierPct,
        schoolType,
        enrollment,
        monthlyBahAtSchool: effectiveBah,
        tuitionPerYear,
        monthsUsed,
      }),
    [tierPct, schoolType, enrollment, effectiveBah, tuitionPerYear, monthsUsed],
  );

  const monthsRemaining = result.monthsRemaining;
  const pctRemaining = monthsRemaining / GI_BILL_TOTAL_MONTHS;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>GI Bill Calculator</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Eligibility */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>ELIGIBILITY TIER</ThemedText>
          <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>Based on qualifying active duty service after 9/10/2001</ThemedText>
          <View style={styles.tierRow}>
            {ELIGIBILITY_TIERS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTierPct(t.pct)}
                style={[styles.tierChip, { borderColor: tc.borderColor }, tierPct === t.pct && styles.tierChipActive]}>
                <ThemedText style={[styles.tierPct, { color: tc.textPrimary }, tierPct === t.pct && styles.tierPctActive]}>{t.label}</ThemedText>
                <ThemedText style={[styles.tierDesc, { color: tc.textHint }, tierPct === t.pct && { color: '#fff' }]}>{t.description}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        {/* Months Used */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <NumberStepper label={`Months used: ${monthsUsed}`} value={monthsUsed} min={0} max={36} step={1} onChange={setMonthsUsed} />
          <View style={[styles.monthsTrack, { backgroundColor: tc.borderColor }]}>
            <View style={[styles.monthsFill, { width: `${(monthsUsed / 36) * 100}%` as any }]} />
          </View>
          <ThemedText style={styles.monthsRemaining}>
            {monthsRemaining} months remaining ({Math.round(pctRemaining * 100)}%)
          </ThemedText>
        </ThemedView>

        {/* School Info */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>SCHOOL TYPE</ThemedText>
          <OptionRow
            options={['public_instate', 'public_outofstate', 'private', 'online_only'] as SchoolType[]}
            value={schoolType}
            onChange={setSchoolType}
            labels={SCHOOL_TYPE_LABELS}
            tc={tc}
          />

          <ThemedText style={[styles.cardLabel, { color: tc.textHint, marginTop: Spacing.one }]}>ENROLLMENT STATUS</ThemedText>
          <OptionRow
            options={['full', 'three_quarter', 'half'] as EnrollmentStatus[]}
            value={enrollment}
            onChange={setEnrollment}
            labels={ENROLLMENT_LABELS}
            tc={tc}
          />

          {schoolType !== 'online_only' && (
            <>
              <NumberStepper
                label={`Annual Tuition: ${fmtDollar(tuitionPerYear)}`}
                value={tuitionPerYear}
                min={0}
                max={60_000}
                step={500}
                onChange={setTuitionPerYear}
              />
            </>
          )}
        </ThemedView>

        {/* BAH Lookup */}
        {schoolType !== 'online_only' && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>HOUSING ALLOWANCE (E5 W/DEP BAH)</ThemedText>
            <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>
              GI Bill housing = E5-with-dependent BAH for your school&apos;s location.
            </ThemedText>

            <ThemedText style={[styles.cardLabel, { color: tc.textHint, marginTop: Spacing.one }]}>SCHOOL ZIP CODE</ThemedText>
            <View style={styles.zipRow}>
              <TextInput
                value={zipInput}
                onChangeText={setZipInput}
                placeholder="e.g. 28301"
                placeholderTextColor={tc.textMuted}
                keyboardType="numeric"
                maxLength={5}
                style={[styles.zipInput, { color: tc.textPrimary }]}
              />
              {zipLookup !== null ? (
                <View style={styles.zipResult}>
                  {zipLookup.exact ? (
                    <ThemedText style={styles.zipFound}>✓ {fmtDollar(zipLookup.rate)}/mo</ThemedText>
                  ) : (
                    <ThemedText style={styles.zipApprox}>≈ {fmtDollar(zipLookup.rate)}/mo (approx. by ZIP)</ThemedText>
                  )}
                </View>
              ) : null}
            </View>

            {zipLookup === null && (
              <>
                <ThemedText style={[styles.cardLabel, { color: tc.textHint, marginTop: Spacing.one }]}>OR ENTER E5 W/DEP BAH MANUALLY</ThemedText>
                <TextInput
                  value={manualBah}
                  onChangeText={setManualBah}
                  placeholder="e.g. 2400"
                  placeholderTextColor={tc.textMuted}
                  keyboardType="numeric"
                  style={[styles.manualInput, { color: tc.textPrimary }]}
                />
                <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>
                  Look up your school&apos;s rate at militarypay.defense.gov — select E-5 with dependents.
                </ThemedText>
              </>
            )}
          </ThemedView>
        )}

        {/* Results */}
        <SectionLabel text="YOUR MONTHLY BENEFITS" tc={tc} />

        <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: Brand.tactical }]}>
          <ThemedText style={styles.resultEyebrow}>EST. MONTHLY VALUE (AY{GI_BILL_DATA_YEAR})</ThemedText>
          <ThemedText style={[styles.resultBig, { color: tc.textPrimary }]}>{fmtDollar(result.monthlyTotalValue)}/mo</ThemedText>

          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <ThemedText style={styles.breakdownDot}>🏠</ThemedText>
                <ThemedText style={[styles.breakdownLabel, { color: tc.textHint }]}>Housing Allowance (BAH)</ThemedText>
              </View>
              <ThemedText style={[styles.breakdownVal, { color: tc.textPrimary }]}>{result.monthlyBahDisplay}</ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <ThemedText style={styles.breakdownDot}>📚</ThemedText>
                <ThemedText style={[styles.breakdownLabel, { color: tc.textHint }]}>Book Stipend</ThemedText>
              </View>
              <ThemedText style={[styles.breakdownVal, { color: tc.textPrimary }]}>${result.monthlyBookStipend}/mo avg</ThemedText>
            </View>

            {schoolType !== 'online_only' && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <ThemedText style={styles.breakdownDot}>🎓</ThemedText>
                  <ThemedText style={[styles.breakdownLabel, { color: tc.textHint }]}>Tuition Coverage</ThemedText>
                </View>
                <ThemedText style={[styles.breakdownVal, { color: tc.textPrimary }]}>{result.monthlyTuitionCoveredDisplay}</ThemedText>
              </View>
            )}
          </View>

          <View style={[styles.annualBox, { backgroundColor: tc.background }]}>
            <ThemedText style={[styles.annualLabel, { color: tc.textMuted }]}>ANNUAL SUMMARY</ThemedText>
            <View style={styles.annualRow}>
              <ThemedText style={[styles.annualKey, { color: tc.textHint }]}>Tuition covered by VA</ThemedText>
              <ThemedText style={[styles.annualVal, { color: tc.textPrimary }]}>{fmtDollar(result.annualTuitionCoverage)}</ThemedText>
            </View>
            {result.annualTuitionOut > 0 && (
              <View style={styles.annualRow}>
                <ThemedText style={[styles.annualKey, { color: Brand.warning }]}>Out-of-pocket tuition</ThemedText>
                <ThemedText style={[styles.annualVal, { color: Brand.warning }]}>{fmtDollar(result.annualTuitionOut)}</ThemedText>
              </View>
            )}
            <View style={styles.annualRow}>
              <ThemedText style={[styles.annualKey, { color: tc.textHint }]}>Book stipend/year</ThemedText>
              <ThemedText style={[styles.annualVal, { color: tc.textPrimary }]}>{fmtDollar(result.annualBookStipend)}</ThemedText>
            </View>
          </View>

          {result.tuitionNote.length > 0 && (
            <ThemedText style={[styles.tuitionNote, { color: tc.textMuted }]}>{result.tuitionNote}</ThemedText>
          )}
        </ThemedView>

        {/* Time remaining visual */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>BENEFIT REMAINING</ThemedText>
          <View style={[styles.monthsTrack, { backgroundColor: tc.borderColor }]}>
            <View style={[styles.monthsFillGreen, { width: `${pctRemaining * 100}%` as any }]} />
          </View>
          <View style={styles.monthsLabelRow}>
            <ThemedText style={[styles.monthsLabel, { color: tc.textHint }]}>{monthsRemaining} months left</ThemedText>
            <ThemedText style={[styles.monthsLabel, { color: tc.textHint }]}>{GI_BILL_TOTAL_MONTHS} total</ThemedText>
          </View>
          {monthsRemaining > 0 && (
            <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>
              At current enrollment: ~{Math.ceil(monthsRemaining / (enrollment === 'full' ? 9 : enrollment === 'three_quarter' ? 12 : 18))} academic years of remaining benefit.
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.noteCard}>
          <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
            Rates are AY{GI_BILL_DATA_YEAR}. BAH rates adjust annually each August. Housing allowance is paid only during active enrollment (not during breaks). Transfer of benefits to dependents requires 4+ years remaining service at time of request. Verify entitlements at benefits.va.gov/gibill.
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
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

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardHint: { fontSize: 11, lineHeight: 16 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: 1 },
  sectionText: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },

  tierRow: { gap: Spacing.one },
  tierChip: {
    borderRadius: 4, borderWidth: 1,
    padding: Spacing.two, gap: 2,
  },
  tierChipActive: { backgroundColor: Brand.tactical + '20', borderColor: Brand.tactical },
  tierPct: { fontSize: 14, fontWeight: '800' },
  tierPctActive: { color: Brand.tactical },
  tierDesc: { fontSize: 10 },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  optionChip: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 4, borderWidth: 1 },
  optionChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  optionText: { fontSize: 11, fontWeight: '600' },
  optionTextActive: { color: '#fff' },

  monthsTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  monthsFill: { height: '100%', backgroundColor: Brand.warning, borderRadius: 3 },
  monthsFillGreen: { height: '100%', backgroundColor: Brand.tactical, borderRadius: 3 },
  monthsRemaining: { fontSize: 11, color: Brand.tactical, fontWeight: '700' },
  monthsLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  monthsLabel: { fontSize: 10 },

  zipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  zipInput: {
    width: 100, fontSize: 16, fontWeight: '700',
    borderBottomWidth: 2, borderBottomColor: Brand.primary, paddingVertical: 4,
  },
  zipResult: {},
  zipFound: { fontSize: 13, color: Brand.tactical, fontWeight: '700' },
  zipApprox: { fontSize: 12, color: Brand.warning, fontWeight: '700', flex: 1 },
  manualInput: {
    fontSize: 16, fontWeight: '700',
    borderBottomWidth: 2, borderBottomColor: Brand.primary, paddingVertical: 4, width: 120,
  },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 8, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultBig: { fontSize: 26, lineHeight: 32, fontWeight: '900' },

  breakdown: { gap: Spacing.one + 2 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLeft: { flexDirection: 'row', gap: Spacing.one, alignItems: 'center' },
  breakdownDot: { fontSize: 16 },
  breakdownLabel: { fontSize: 12 },
  breakdownVal: { fontSize: 13, fontWeight: '700' },

  annualBox: {
    borderRadius: 4, padding: Spacing.two, gap: 6,
  },
  annualLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, marginBottom: 2 },
  annualRow: { flexDirection: 'row', justifyContent: 'space-between' },
  annualKey: { fontSize: 11 },
  annualVal: { fontSize: 11, fontWeight: '700' },
  tuitionNote: { fontSize: 10, lineHeight: 15 },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, lineHeight: 16 },
});
