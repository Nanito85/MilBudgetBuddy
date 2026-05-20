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

function fmtDollar(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionLine} />
      <ThemedText style={styles.sectionText}>{text}</ThemedText>
      <View style={styles.sectionLine} />
    </View>
  );
}

function OptionRow<T extends string>({
  options, value, onChange, labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <View style={styles.optionRow}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.optionChip, value === o && styles.optionChipActive]}>
          <ThemedText style={[styles.optionText, value === o && styles.optionTextActive]}>
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

  const [tierPct, setTierPct] = useState(100);
  const [schoolType, setSchoolType] = useState<SchoolType>('public_instate');
  const [enrollment, setEnrollment] = useState<EnrollmentStatus>('full');
  const [monthsUsed, setMonthsUsed] = useState(0);
  const [zipInput, setZipInput] = useState('');
  const [manualBah, setManualBah] = useState('2400');
  const [tuitionPerYear, setTuitionPerYear] = useState(10000);

  // Look up E5-w/dep BAH from entered ZIP — falls back to nearest MHA for any US ZIP
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
          onPress={() => (router.push('/tools'))}
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
          <ThemedText style={styles.cardLabel}>ELIGIBILITY TIER</ThemedText>
          <ThemedText style={styles.cardHint}>Based on qualifying active duty service after 9/10/2001</ThemedText>
          <View style={styles.tierRow}>
            {ELIGIBILITY_TIERS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTierPct(t.pct)}
                style={[styles.tierChip, tierPct === t.pct && styles.tierChipActive]}>
                <ThemedText style={[styles.tierPct, tierPct === t.pct && styles.tierPctActive]}>{t.label}</ThemedText>
                <ThemedText style={[styles.tierDesc, tierPct === t.pct && { color: '#fff' }]}>{t.description}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        {/* Months Used */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <NumberStepper label={`Months used: ${monthsUsed}`} value={monthsUsed} min={0} max={36} step={1} onChange={setMonthsUsed} />
          <View style={styles.monthsTrack}>
            <View style={[styles.monthsFill, { width: `${(monthsUsed / 36) * 100}%` as any }]} />
          </View>
          <ThemedText style={styles.monthsRemaining}>
            {monthsRemaining} months remaining ({Math.round(pctRemaining * 100)}%)
          </ThemedText>
        </ThemedView>

        {/* School Info */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>SCHOOL TYPE</ThemedText>
          <OptionRow
            options={['public_instate', 'public_outofstate', 'private', 'online_only'] as SchoolType[]}
            value={schoolType}
            onChange={setSchoolType}
            labels={SCHOOL_TYPE_LABELS}
          />

          <ThemedText style={[styles.cardLabel, { marginTop: Spacing.one }]}>ENROLLMENT STATUS</ThemedText>
          <OptionRow
            options={['full', 'three_quarter', 'half'] as EnrollmentStatus[]}
            value={enrollment}
            onChange={setEnrollment}
            labels={ENROLLMENT_LABELS}
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
            <ThemedText style={styles.cardLabel}>HOUSING ALLOWANCE (E5 W/DEP BAH)</ThemedText>
            <ThemedText style={styles.cardHint}>
              GI Bill housing = E5-with-dependent BAH for your school&apos;s location.
            </ThemedText>

            <ThemedText style={[styles.cardLabel, { marginTop: Spacing.one }]}>SCHOOL ZIP CODE</ThemedText>
            <View style={styles.zipRow}>
              <TextInput
                value={zipInput}
                onChangeText={setZipInput}
                placeholder="e.g. 28301"
                placeholderTextColor="#3D6080"
                keyboardType="numeric"
                maxLength={5}
                style={styles.zipInput}
              />
              {zipLookup !== null ? (
                <View style={styles.zipResult}>
                  {zipLookup.exact ? (
                    <ThemedText style={styles.zipFound}>✓ {fmtDollar(zipLookup.rate)}/mo</ThemedText>
                  ) : (
                    <ThemedText style={styles.zipApprox}>≈ {fmtDollar(zipLookup.rate)}/mo (nearest MHA)</ThemedText>
                  )}
                </View>
              ) : null}
            </View>

            {zipLookup === null && (
              <>
                <ThemedText style={[styles.cardLabel, { marginTop: Spacing.one }]}>OR ENTER E5 W/DEP BAH MANUALLY</ThemedText>
                <TextInput
                  value={manualBah}
                  onChangeText={setManualBah}
                  placeholder="e.g. 2400"
                  placeholderTextColor="#3D6080"
                  keyboardType="numeric"
                  style={styles.manualInput}
                />
                <ThemedText style={styles.cardHint}>
                  Look up your school&apos;s rate at militarypay.defense.gov — select E-5 with dependents.
                </ThemedText>
              </>
            )}
          </ThemedView>
        )}

        {/* Results */}
        <SectionLabel text="YOUR MONTHLY BENEFITS" />

        <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: Brand.tactical }]}>
          <ThemedText style={styles.resultEyebrow}>EST. MONTHLY VALUE (AY{GI_BILL_DATA_YEAR})</ThemedText>
          <ThemedText style={styles.resultBig}>{fmtDollar(result.monthlyTotalValue)}/mo</ThemedText>

          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <ThemedText style={styles.breakdownDot}>🏠</ThemedText>
                <ThemedText style={styles.breakdownLabel}>Housing Allowance (BAH)</ThemedText>
              </View>
              <ThemedText style={styles.breakdownVal}>{result.monthlyBahDisplay}</ThemedText>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <ThemedText style={styles.breakdownDot}>📚</ThemedText>
                <ThemedText style={styles.breakdownLabel}>Book Stipend</ThemedText>
              </View>
              <ThemedText style={styles.breakdownVal}>${result.monthlyBookStipend}/mo avg</ThemedText>
            </View>

            {schoolType !== 'online_only' && (
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <ThemedText style={styles.breakdownDot}>🎓</ThemedText>
                  <ThemedText style={styles.breakdownLabel}>Tuition Coverage</ThemedText>
                </View>
                <ThemedText style={styles.breakdownVal}>{result.monthlyTuitionCoveredDisplay}</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.annualBox}>
            <ThemedText style={styles.annualLabel}>ANNUAL SUMMARY</ThemedText>
            <View style={styles.annualRow}>
              <ThemedText style={styles.annualKey}>Tuition covered by VA</ThemedText>
              <ThemedText style={styles.annualVal}>{fmtDollar(result.annualTuitionCoverage)}</ThemedText>
            </View>
            {result.annualTuitionOut > 0 && (
              <View style={styles.annualRow}>
                <ThemedText style={[styles.annualKey, { color: Brand.warning }]}>Out-of-pocket tuition</ThemedText>
                <ThemedText style={[styles.annualVal, { color: Brand.warning }]}>{fmtDollar(result.annualTuitionOut)}</ThemedText>
              </View>
            )}
            <View style={styles.annualRow}>
              <ThemedText style={styles.annualKey}>Book stipend/year</ThemedText>
              <ThemedText style={styles.annualVal}>{fmtDollar(result.annualBookStipend)}</ThemedText>
            </View>
          </View>

          {result.tuitionNote.length > 0 && (
            <ThemedText style={styles.tuitionNote}>{result.tuitionNote}</ThemedText>
          )}
        </ThemedView>

        {/* Time remaining visual */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>BENEFIT REMAINING</ThemedText>
          <View style={styles.monthsTrack}>
            <View style={[styles.monthsFillGreen, { width: `${pctRemaining * 100}%` as any }]} />
          </View>
          <View style={styles.monthsLabelRow}>
            <ThemedText style={styles.monthsLabel}>{monthsRemaining} months left</ThemedText>
            <ThemedText style={styles.monthsLabel}>{GI_BILL_TOTAL_MONTHS} total</ThemedText>
          </View>
          {monthsRemaining > 0 && (
            <ThemedText style={styles.cardHint}>
              At current enrollment: ~{Math.ceil(monthsRemaining / (enrollment === 'full' ? 9 : enrollment === 'three_quarter' ? 12 : 18))} academic years of remaining benefit.
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.noteCard}>
          <ThemedText style={styles.noteText}>
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
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  cardHint: { fontSize: 11, color: '#3D6080', lineHeight: 16 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: 1, backgroundColor: Brand.border },
  sectionText: { fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8 },

  tierRow: { gap: Spacing.one },
  tierChip: {
    borderRadius: 4, borderWidth: 1, borderColor: Brand.border,
    padding: Spacing.two, gap: 2,
  },
  tierChipActive: { backgroundColor: Brand.tactical + '20', borderColor: Brand.tactical },
  tierPct: { fontSize: 14, fontWeight: '800', color: '#C8D8E8' },
  tierPctActive: { color: Brand.tactical },
  tierDesc: { fontSize: 10, color: '#4D7A9A' },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  optionChip: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  optionChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  optionText: { fontSize: 11, fontWeight: '600', color: '#4D7A9A' },
  optionTextActive: { color: '#fff' },

  monthsTrack: { height: 6, backgroundColor: Brand.border, borderRadius: 3, overflow: 'hidden' },
  monthsFill: { height: '100%', backgroundColor: Brand.warning, borderRadius: 3 },
  monthsFillGreen: { height: '100%', backgroundColor: Brand.tactical, borderRadius: 3 },
  monthsRemaining: { fontSize: 11, color: Brand.tactical, fontWeight: '700' },
  monthsLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  monthsLabel: { fontSize: 10, color: '#4D7A9A' },

  zipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  zipInput: {
    width: 100, fontSize: 16, fontWeight: '700', color: '#C8D8E8',
    borderBottomWidth: 2, borderBottomColor: Brand.primary, paddingVertical: 4,
  },
  zipResult: {},
  zipFound: { fontSize: 13, color: Brand.tactical, fontWeight: '700' },
  zipApprox: { fontSize: 12, color: Brand.warning, fontWeight: '700', flex: 1 },
  manualInput: {
    fontSize: 16, fontWeight: '700', color: '#C8D8E8',
    borderBottomWidth: 2, borderBottomColor: Brand.primary, paddingVertical: 4, width: 120,
  },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 8, fontWeight: '800', color: Brand.tactical, letterSpacing: 1.5 },
  resultBig: { fontSize: 26, fontWeight: '900', color: '#C8D8E8' },

  breakdown: { gap: Spacing.one + 2 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLeft: { flexDirection: 'row', gap: Spacing.one, alignItems: 'center' },
  breakdownDot: { fontSize: 16 },
  breakdownLabel: { fontSize: 12, color: '#4D7A9A' },
  breakdownVal: { fontSize: 13, fontWeight: '700', color: '#C8D8E8' },

  annualBox: {
    backgroundColor: '#04080F', borderRadius: 4, padding: Spacing.two, gap: 6,
  },
  annualLabel: { fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8, marginBottom: 2 },
  annualRow: { flexDirection: 'row', justifyContent: 'space-between' },
  annualKey: { fontSize: 11, color: '#4D7A9A' },
  annualVal: { fontSize: 11, fontWeight: '700', color: '#C8D8E8' },
  tuitionNote: { fontSize: 10, color: '#3D6080', lineHeight: 15 },

  noteCard: { borderRadius: 4, padding: Spacing.three },
  noteText: { fontSize: 10, color: '#3D6080', lineHeight: 16 },
});
