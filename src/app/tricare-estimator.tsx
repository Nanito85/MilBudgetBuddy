import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import {
  BeneficiaryGroup,
  CoverageStatus,
  DentalPlan,
  FamilySize,
  GradeTier,
  PlanDetail,
  TricareInputs,
  UsageLevel,
  calcTricare,
  fmtMoney,
} from '@/features/tricare/utils/tricareCalc';

// ── Chip row ──────────────────────────────────────────────────────────────────

function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string; sub?: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  const tc = useThemeColors();
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={o.value}
            onPress={() => onSelect(o.value)}
            style={[styles.chip, { borderColor: tc.borderColor }, active && styles.chipActive]}>
            <ThemedText style={[styles.chipText, { color: tc.textSecondary }, active && styles.chipTextActive]}>
              {o.label}
            </ThemedText>
            {o.sub && (
              <ThemedText style={[styles.chipSub, { color: tc.textMuted }, active && styles.chipSubActive]}>
                {o.sub}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  const tc = useThemeColors();
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
      <ThemedText type="label" style={[styles.sectionLabel, { color: tc.textMuted }]}>{text}</ThemedText>
      <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
    </View>
  );
}

// ── Cost row inside plan card ─────────────────────────────────────────────────

function CostRow({ label, value, accent, dimmed }: { label: string; value: string; accent?: boolean; dimmed?: boolean }) {
  const tc = useThemeColors();
  return (
    <View style={styles.costRow}>
      <ThemedText style={[styles.costLabel, { color: tc.textSecondary }, dimmed && { color: tc.textMuted }]}>{label}</ThemedText>
      <ThemedText style={[styles.costVal, { color: tc.textPrimary }, accent && { color: Brand.tactical }, dimmed && { color: tc.textMuted }]}>
        {value}
      </ThemedText>
    </View>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, isWinner }: { plan: PlanDetail; isWinner: boolean }) {
  const tc = useThemeColors();
  const accentColor = plan.tag === 'PRIME' ? '#1565C0' : '#00695C';

  return (
    <View style={[styles.planCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }, isWinner && { borderColor: accentColor + '80' }]}>
      {isWinner && (
        <View style={[styles.winnerBanner, { backgroundColor: accentColor }]}>
          <ThemedText style={styles.winnerText}>★ BEST FIT</ThemedText>
        </View>
      )}
      <View style={[styles.planHeader, { backgroundColor: accentColor + '18' }]}>
        <View style={[styles.planAccentBar, { backgroundColor: accentColor }]} />
        <View style={styles.planHeaderText}>
          <ThemedText style={[styles.planTag, { color: accentColor }]}>{plan.tag}</ThemedText>
          <ThemedText style={[styles.planName, { color: tc.textPrimary }]}>{plan.name}</ThemedText>
        </View>
      </View>

      <View style={styles.planBody}>
        <CostRow label="Enrollment / Premium" value={plan.annualEnrollment > 0 ? fmtMoney(plan.annualEnrollment) + '/yr' : 'FREE'} />
        {plan.deductible > 0 && (
          <CostRow label="Annual Deductible" value={fmtMoney(plan.deductible)} />
        )}
        <CostRow label="Est. Copays / Cost-Share" value={plan.estimatedCopays > 0 ? fmtMoney(plan.estimatedCopays) : '$0'} />
        {plan.estimatedRx > 0 && (
          <CostRow label="Est. Pharmacy" value={fmtMoney(plan.estimatedRx)} />
        )}
        {plan.dentalCost > 0 && (
          <CostRow label="Dental (TDP)" value={fmtMoney(plan.dentalCost) + '/yr'} />
        )}

        <View style={[styles.planDivider, { backgroundColor: tc.borderColor }]} />

        <View style={styles.totalRow}>
          <ThemedText style={[styles.totalLabel, { color: tc.textMuted }]}>EST. ANNUAL TOTAL</ThemedText>
          <ThemedText style={[styles.totalVal, { color: accentColor }]}>
            {fmtMoney(plan.totalEstimate)}
          </ThemedText>
        </View>

        <View style={styles.capRow}>
          <ThemedText style={[styles.capText, { color: tc.textMuted }]}>Catastrophic cap: {fmtMoney(plan.catCap)}/yr</ThemedText>
        </View>

        <View style={[styles.planDivider, { backgroundColor: tc.borderColor }]} />

        <View style={styles.featureBlock}>
          {plan.pros.map((p, i) => (
            <View key={i} style={styles.featureRow}>
              <ThemedText style={[styles.featureIcon, { color: accentColor }]}>✓</ThemedText>
              <ThemedText style={[styles.featureText, { color: tc.textSecondary }]}>{p}</ThemedText>
            </View>
          ))}
          {plan.cons.map((c, i) => (
            <View key={i} style={styles.featureRow}>
              <ThemedText style={[styles.featureIconDim, { color: tc.textMuted }]}>·</ThemedText>
              <ThemedText style={[styles.featureTextDim, { color: tc.textMuted }]}>{c}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Pharmacy reference table ──────────────────────────────────────────────────

function PharmacyTable() {
  const tc = useThemeColors();
  const rows = [
    { fill: 'Generic', mtf: 'FREE',  mail: '$14',  retail: '$16' },
    { fill: 'Brand-formulary', mtf: 'FREE', mail: '$44', retail: '$48' },
    { fill: 'Non-formulary', mtf: 'N/A', mail: '$85', retail: '$85' },
  ];
  return (
    <View style={[styles.rxTable, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
      <View style={[styles.rxRow, styles.rxHeaderRow, { backgroundColor: tc.surfaceInner, borderColor: tc.borderColor }]}>
        <ThemedText style={[styles.rxCell, styles.rxHeader, { flex: 2, color: tc.textMuted }]}>DRUG TYPE</ThemedText>
        <ThemedText style={[styles.rxCell, styles.rxHeader, { color: tc.textMuted }]}>MTF</ThemedText>
        <ThemedText style={[styles.rxCell, styles.rxHeader, { color: tc.textMuted }]}>MAIL</ThemedText>
        <ThemedText style={[styles.rxCell, styles.rxHeader, { color: tc.textMuted }]}>RETAIL</ThemedText>
      </View>
      {rows.map((r) => (
        <View key={r.fill} style={[styles.rxRow, { borderColor: tc.borderColor }]}>
          <ThemedText style={[styles.rxCell, { flex: 2, color: tc.textPrimary }]}>{r.fill}</ThemedText>
          <ThemedText style={[styles.rxCell, { color: Brand.tactical }]}>{r.mtf}</ThemedText>
          <ThemedText style={[styles.rxCell, { color: tc.textSecondary }]}>{r.mail}</ThemedText>
          <ThemedText style={[styles.rxCell, { color: tc.textSecondary }]}>{r.retail}</ThemedText>
        </View>
      ))}
      <ThemedText style={[styles.rxNote, { color: tc.textMuted }]}>Mail = 90-day supply via Express Scripts. Retail = 30-day supply.</ThemedText>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TricareEstimatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [status,     setStatus]     = useState<CoverageStatus>('active');
  const [group,      setGroup]      = useState<BeneficiaryGroup>('groupB');
  const [gradeTier,  setGradeTier]  = useState<GradeTier>('e5_plus');
  const [familySize, setFamilySize] = useState<FamilySize>('family');
  const [usage,      setUsage]      = useState<UsageLevel>('medium');
  const [dental,     setDental]     = useState<DentalPlan>('none');

  const result = useMemo(() => {
    const inputs: TricareInputs = { status, group, gradeTier, familySize, usage, dental };
    return calcTricare(inputs);
  }, [status, group, gradeTier, familySize, usage, dental]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ BACK</ThemedText>
          </Pressable>
          <ThemedText type="label" style={styles.eyebrow}>// MEDICAL BENEFITS</ThemedText>
          <ThemedText style={[styles.heading, { color: tc.textPrimary }]}>TRICARE ESTIMATOR</ThemedText>
          <ThemedText type="label" style={[styles.subhead, { color: tc.textMuted }]}>PRIME · SELECT · DENTAL · PHARMACY</ThemedText>
        </View>

        {/* ── Inputs ── */}
        <SectionLabel text="YOUR SITUATION" />

        <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>COVERAGE STATUS</ThemedText>
          <ChipRow<CoverageStatus>
            options={[
              { value: 'active',  label: 'Active Duty' },
              { value: 'reserve', label: 'Reserve / Guard' },
              { value: 'retired', label: 'Retired' },
            ]}
            selected={status}
            onSelect={setStatus}
          />
        </View>

        {status !== 'retired' && (
          <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>PAY GRADE TIER</ThemedText>
            <ThemedText style={[styles.inputHint, { color: tc.textMuted }]}>Affects Select/TRS deductible and TDP dental premium</ThemedText>
            <ChipRow<GradeTier>
              options={
                status === 'reserve'
                  ? [
                      { value: 'e1_e4',   label: 'E1–E4', sub: '$66 deductible' },
                      { value: 'e5_plus', label: 'E5+',   sub: '$198 deductible' },
                    ]
                  : group === 'groupA'
                  ? [
                      { value: 'e1_e4',   label: 'E1–E4', sub: '$50 deductible' },
                      { value: 'e5_plus', label: 'E5+',   sub: '$150 deductible' },
                    ]
                  : [
                      { value: 'e1_e4',   label: 'E1–E4', sub: '$66 deductible' },
                      { value: 'e5_plus', label: 'E5+',   sub: '$198 deductible' },
                    ]
              }
              selected={gradeTier}
              onSelect={setGradeTier}
            />
          </View>
        )}

        {status !== 'reserve' && (
          <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>BENEFICIARY GROUP</ThemedText>
            <ThemedText style={[styles.inputHint, { color: tc.textMuted }]}>
              Based on sponsor's initial enlistment/appointment date — affects enrollment fees, deductibles &amp; catastrophic caps
            </ThemedText>
            <ChipRow<BeneficiaryGroup>
              options={[
                { value: 'groupA', label: 'Group A', sub: 'Before Jan 1, 2018' },
                { value: 'groupB', label: 'Group B', sub: 'On/after Jan 1, 2018' },
              ]}
              selected={group}
              onSelect={setGroup}
            />
          </View>
        )}

        <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>COVERAGE FOR</ThemedText>
          <ChipRow<FamilySize>
            options={[
              { value: 'individual', label: 'Me Only' },
              { value: 'plus_one',   label: '+ Spouse' },
              { value: 'family',     label: 'Full Family' },
            ]}
            selected={familySize}
            onSelect={setFamilySize}
          />
        </View>

        <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>TYPICAL MEDICAL USE</ThemedText>
          <ChipRow<UsageLevel>
            options={[
              { value: 'low',    label: 'Low',    sub: '~4 visits/yr' },
              { value: 'medium', label: 'Medium', sub: '~10 visits/yr' },
              { value: 'high',   label: 'High',   sub: '20+ visits/yr' },
            ]}
            selected={usage}
            onSelect={setUsage}
          />
        </View>

        {status !== 'retired' && (
          <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>DENTAL COVERAGE (TDP)</ThemedText>
            <ThemedText style={[styles.inputHint, { color: tc.textMuted }]}>
              TDP covers family members (sponsor's own dental is free at MTFs). Priced by sponsor pay grade.
            </ThemedText>
            <ChipRow<DentalPlan>
              options={[
                { value: 'none',  label: 'None' },
                { value: 'one',   label: '1 Dependent', sub: gradeTier === 'e1_e4' ? '$8.79/mo' : '$11.72/mo' },
                { value: 'multi', label: '2+ Dependents', sub: gradeTier === 'e1_e4' ? '$22.85/mo' : '$30.47/mo' },
              ]}
              selected={dental}
              onSelect={setDental}
            />
          </View>
        )}

        {status === 'retired' && (
          <View style={[styles.inputCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.inputLabel, { color: tc.textMuted }]}>DENTAL COVERAGE</ThemedText>
            <ThemedText style={[styles.inputHint, { color: tc.textMuted }]}>
              Retirees aren't eligible for TDP — you'd use FEDVIP instead. See notes below for typical cost.
            </ThemedText>
          </View>
        )}

        {/* ── Note ── */}
        <View style={styles.noteCard}>
          <ThemedText style={[styles.noteText, { color: tc.textSecondary }]}>{result.note}</ThemedText>
        </View>

        {/* ── Plan Comparison ── */}
        <SectionLabel text="PLAN COMPARISON" />

        {result.winnerTag !== 'same' && (
          <View style={[
            styles.savingsBanner,
            { borderColor: result.winnerTag === 'prime' ? '#1565C0' : '#00695C' },
          ]}>
            <ThemedText style={[styles.savingsBannerText, { color: tc.textPrimary }]}>
              {result.winnerTag === 'prime'
                ? `TRICARE Prime saves you ~${fmtMoney(Math.abs(result.savingsForPrime))}/yr for this usage profile`
                : `${result.alt.name} saves you ~${fmtMoney(Math.abs(result.savingsForPrime))}/yr for this usage profile`}
            </ThemedText>
          </View>
        )}
        {result.winnerTag === 'same' && (
          <View style={[styles.savingsBanner, { borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.savingsBannerText, { color: tc.textPrimary }]}>
              Both plans estimate within $50 of each other — choose based on provider flexibility needs
            </ThemedText>
          </View>
        )}

        <View style={styles.cardsRow}>
          <View style={{ flex: 1 }}>
            <PlanCard plan={result.prime} isWinner={result.winnerTag === 'prime'} />
          </View>
          <View style={{ flex: 1 }}>
            <PlanCard plan={result.alt} isWinner={result.winnerTag === 'alt'} />
          </View>
        </View>

        {/* ── Pharmacy Reference ── */}
        <SectionLabel text="PHARMACY COSTS (ALL PLANS)" />
        <PharmacyTable />

        {/* ── Retired Dental Note ── */}
        {status === 'retired' && (
          <>
            <SectionLabel text="DENTAL — RETIREES" />
            <View style={[styles.dentalNoteCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <ThemedText style={[styles.dentalNoteTitle, { color: tc.textPrimary }]}>FEDVIP (Federal Dental/Vision)</ThemedText>
              <ThemedText style={[styles.dentalNoteBody, { color: tc.textSecondary }]}>
                Retirees are not covered by TDP. FEDVIP is available during open season (Nov–Dec) with premiums varying by plan and location — typically $25–$55/month for family dental coverage. Enroll at benefeds.com.
              </ThemedText>
              <View style={styles.dentalNoteRow}>
                <ThemedText style={styles.dentalNoteStat}>$25–$55/mo</ThemedText>
                <ThemedText style={[styles.dentalNoteStatLabel, { color: tc.textSecondary }]}>typical FEDVIP family premium</ThemedText>
              </View>
            </View>
          </>
        )}

        {/* ── Key Decisions ── */}
        <SectionLabel text="KEY DECISION FACTORS" />
        <View style={[styles.decisionsCard, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          {[
            { icon: '📍', title: 'MTF PROXIMITY', body: 'Prime is most valuable when you live near a Military Treatment Facility. MTF care is free for active duty families under Prime.' },
            { icon: '🔄', title: 'REFERRALS', body: 'Prime requires a PCM referral to see a specialist. Select lets you book specialists directly — important for families with ongoing conditions.' },
            { icon: '📅', title: 'ENROLLMENT PERIOD', body: 'You can change plans each year (Nov 1–Dec 31 for most) or within 90 days of a qualifying life event (PCS, birth, marriage).' },
            { icon: '🏥', title: 'URGENT CARE', body: 'Both plans cover TRICARE-authorized urgent care. Active Duty Prime: $0. Retired/Reserve Prime: $39 copay. Select/TRS: flat network copay ($26–$38 depending on group), 20–25% for non-network.' },
          ].map((d) => (
            <View key={d.title} style={styles.decisionRow}>
              <ThemedText style={styles.decisionIcon}>{d.icon}</ThemedText>
              <View style={{ flex: 1, gap: 3 }}>
                <ThemedText style={styles.decisionTitle}>{d.title}</ThemedText>
                <ThemedText style={[styles.decisionBody, { color: tc.textSecondary }]}>{d.body}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ThemedText style={[styles.disclaimer, { color: tc.textMuted }]}>
          Cost estimates are approximations based on FY2026 TRICARE rates. Actual costs vary by provider, region, and claim processing. Verify current rates at tricare.mil. This is not legal or benefits advice.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { paddingHorizontal: Spacing.three, gap: Spacing.three },

  header: { gap: 4, paddingBottom: Spacing.two },
  backBtn: { marginBottom: Spacing.two },
  backText: { color: Brand.tactical, fontSize: 12, fontWeight: '700', letterSpacing: 1, lineHeight: 17 },
  eyebrow:  { color: Brand.tactical, fontSize: 9 },
  heading:  { fontSize: 28, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  subhead:  { fontSize: 9 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine:     { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabel:    { fontSize: 9 },

  inputCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  inputLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  inputHint:  { fontSize: 9, fontStyle: 'italic', marginTop: -Spacing.one },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  chip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    gap: 1,
  },
  chipActive:       { backgroundColor: Brand.accent + '20', borderColor: Brand.accent },
  chipText:         { fontSize: 12, fontWeight: '700' },
  chipTextActive:   { color: Brand.accent },
  chipSub:          { fontSize: 8 },
  chipSubActive:    { color: Brand.accent + 'AA' },

  noteCard: {
    backgroundColor: Brand.tactical + '10',
    borderWidth: 1,
    borderColor: Brand.tactical + '30',
    borderRadius: 4,
    padding: Spacing.three,
  },
  noteText: { fontSize: 11, lineHeight: 17 },

  savingsBanner: {
    borderWidth: 1,
    borderRadius: 4,
    padding: Spacing.two + 2,
    alignItems: 'center',
  },
  savingsBannerText: { fontSize: 11, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },

  cardsRow: { flexDirection: 'row', gap: Spacing.two },

  planCard: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  winnerBanner: {
    paddingVertical: 3,
    alignItems: 'center',
  },
  winnerText: { fontSize: 8, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  planHeader: { flexDirection: 'row', alignItems: 'stretch' },
  planAccentBar: { width: 3 },
  planHeaderText: { flex: 1, padding: Spacing.two, gap: 2 },
  planTag:  { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  planName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  planBody: { padding: Spacing.two, gap: Spacing.one + 2 },
  costRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { fontSize: 9, flex: 1, paddingRight: 4 },
  costVal:   { fontSize: 10, fontWeight: '700' },
  planDivider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  totalVal:   { fontSize: 16, fontWeight: '900' },

  capRow:  { alignItems: 'flex-end' },
  capText: { fontSize: 7 },

  featureBlock: { gap: 3 },
  featureRow:   { flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  featureIcon:  { fontSize: 10, fontWeight: '800', width: 10 },
  featureText:  { flex: 1, fontSize: 9, lineHeight: 13 },
  featureIconDim: { fontSize: 10, width: 10 },
  featureTextDim: { flex: 1, fontSize: 9, lineHeight: 13 },

  rxTable: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 0,
  },
  rxHeaderRow: {},
  rxRow: { flexDirection: 'row', paddingVertical: Spacing.one + 3, paddingHorizontal: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  rxCell: { flex: 1, fontSize: 9, textAlign: 'center' },
  rxHeader: { fontWeight: '800', letterSpacing: 0.5 },
  rxNote: { fontSize: 8, padding: Spacing.two, textAlign: 'center' },

  dentalNoteCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dentalNoteTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
  dentalNoteBody:  { fontSize: 11, lineHeight: 17 },
  dentalNoteRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.one },
  dentalNoteStat:  { fontSize: 18, fontWeight: '800', color: Brand.tactical },
  dentalNoteStatLabel: { fontSize: 9 },

  decisionsCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  decisionRow:   { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  decisionIcon:  { fontSize: 18, width: 28, textAlign: 'center' },
  decisionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: Brand.accent },
  decisionBody:  { fontSize: 10, lineHeight: 15 },

  disclaimer: { fontSize: 8, textAlign: 'center', lineHeight: 13, paddingHorizontal: Spacing.two },
});
