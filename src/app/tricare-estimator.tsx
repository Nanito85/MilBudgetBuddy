import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import {
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
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={o.value}
            onPress={() => onSelect(o.value)}
            style={[styles.chip, active && styles.chipActive]}>
            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
              {o.label}
            </ThemedText>
            {o.sub && (
              <ThemedText style={[styles.chipSub, active && styles.chipSubActive]}>
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
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLine} />
      <ThemedText type="label" style={styles.sectionLabel}>{text}</ThemedText>
      <View style={styles.sectionLine} />
    </View>
  );
}

// ── Cost row inside plan card ─────────────────────────────────────────────────

function CostRow({ label, value, accent, dimmed }: { label: string; value: string; accent?: boolean; dimmed?: boolean }) {
  return (
    <View style={styles.costRow}>
      <ThemedText style={[styles.costLabel, dimmed && { color: '#3D6080' }]}>{label}</ThemedText>
      <ThemedText style={[styles.costVal, accent && { color: Brand.tactical }, dimmed && { color: '#3D6080' }]}>
        {value}
      </ThemedText>
    </View>
  );
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, isWinner }: { plan: PlanDetail; isWinner: boolean }) {
  const accentColor = plan.tag === 'PRIME' ? '#1565C0' : '#00695C';

  return (
    <View style={[styles.planCard, isWinner && { borderColor: accentColor + '80' }]}>
      {isWinner && (
        <View style={[styles.winnerBanner, { backgroundColor: accentColor }]}>
          <ThemedText style={styles.winnerText}>★ BEST FIT</ThemedText>
        </View>
      )}
      <View style={[styles.planHeader, { backgroundColor: accentColor + '18' }]}>
        <View style={[styles.planAccentBar, { backgroundColor: accentColor }]} />
        <View style={styles.planHeaderText}>
          <ThemedText style={[styles.planTag, { color: accentColor }]}>{plan.tag}</ThemedText>
          <ThemedText style={styles.planName}>{plan.name}</ThemedText>
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

        <View style={styles.planDivider} />

        <View style={styles.totalRow}>
          <ThemedText style={styles.totalLabel}>EST. ANNUAL TOTAL</ThemedText>
          <ThemedText style={[styles.totalVal, { color: accentColor }]}>
            {fmtMoney(plan.totalEstimate)}
          </ThemedText>
        </View>

        <View style={styles.capRow}>
          <ThemedText style={styles.capText}>Catastrophic cap: {fmtMoney(plan.catCap)}/yr</ThemedText>
        </View>

        <View style={styles.planDivider} />

        <View style={styles.featureBlock}>
          {plan.pros.map((p, i) => (
            <View key={i} style={styles.featureRow}>
              <ThemedText style={[styles.featureIcon, { color: accentColor }]}>✓</ThemedText>
              <ThemedText style={styles.featureText}>{p}</ThemedText>
            </View>
          ))}
          {plan.cons.map((c, i) => (
            <View key={i} style={styles.featureRow}>
              <ThemedText style={styles.featureIconDim}>·</ThemedText>
              <ThemedText style={styles.featureTextDim}>{c}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Pharmacy reference table ──────────────────────────────────────────────────

function PharmacyTable() {
  const rows = [
    { fill: 'Generic', mtf: 'FREE',  mail: 'FREE',  retail: '$13' },
    { fill: 'Brand-formulary', mtf: 'FREE', mail: '$43', retail: '$43' },
    { fill: 'Non-formulary', mtf: 'FREE', mail: '$56', retail: '$56' },
    { fill: 'Specialty', mtf: 'Varies', mail: '$100', retail: '$100' },
  ];
  return (
    <View style={styles.rxTable}>
      <View style={[styles.rxRow, styles.rxHeaderRow]}>
        <ThemedText style={[styles.rxCell, styles.rxHeader, { flex: 2 }]}>DRUG TYPE</ThemedText>
        <ThemedText style={[styles.rxCell, styles.rxHeader]}>MTF</ThemedText>
        <ThemedText style={[styles.rxCell, styles.rxHeader]}>MAIL</ThemedText>
        <ThemedText style={[styles.rxCell, styles.rxHeader]}>RETAIL</ThemedText>
      </View>
      {rows.map((r) => (
        <View key={r.fill} style={styles.rxRow}>
          <ThemedText style={[styles.rxCell, { flex: 2, color: '#C8D8E8' }]}>{r.fill}</ThemedText>
          <ThemedText style={[styles.rxCell, { color: Brand.tactical }]}>{r.mtf}</ThemedText>
          <ThemedText style={[styles.rxCell, { color: '#4D7A9A' }]}>{r.mail}</ThemedText>
          <ThemedText style={[styles.rxCell, { color: '#4D7A9A' }]}>{r.retail}</ThemedText>
        </View>
      ))}
      <ThemedText style={styles.rxNote}>Mail = 90-day supply via Express Scripts. Retail = 30-day supply.</ThemedText>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function TricareEstimatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [status,     setStatus]     = useState<CoverageStatus>('active');
  const [gradeTier,  setGradeTier]  = useState<GradeTier>('e5_plus');
  const [familySize, setFamilySize] = useState<FamilySize>('family');
  const [usage,      setUsage]      = useState<UsageLevel>('medium');
  const [dental,     setDental]     = useState<DentalPlan>('none');

  const result = useMemo(() => {
    const inputs: TricareInputs = { status, gradeTier, familySize, usage, dental };
    return calcTricare(inputs);
  }, [status, gradeTier, familySize, usage, dental]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/tools')} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ BACK</ThemedText>
          </Pressable>
          <ThemedText type="label" style={styles.eyebrow}>// MEDICAL BENEFITS</ThemedText>
          <ThemedText style={styles.heading}>TRICARE ESTIMATOR</ThemedText>
          <ThemedText type="label" style={styles.subhead}>PRIME · SELECT · DENTAL · PHARMACY</ThemedText>
        </View>

        {/* ── Inputs ── */}
        <SectionLabel text="YOUR SITUATION" />

        <View style={styles.inputCard}>
          <ThemedText style={styles.inputLabel}>COVERAGE STATUS</ThemedText>
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

        {status === 'active' && (
          <View style={styles.inputCard}>
            <ThemedText style={styles.inputLabel}>PAY GRADE TIER</ThemedText>
            <ThemedText style={styles.inputHint}>Affects Select deductible amount</ThemedText>
            <ChipRow<GradeTier>
              options={[
                { value: 'e1_e4',   label: 'E1–E4', sub: '$50 deductible' },
                { value: 'e5_plus', label: 'E5+',   sub: '$150 deductible' },
              ]}
              selected={gradeTier}
              onSelect={setGradeTier}
            />
          </View>
        )}

        <View style={styles.inputCard}>
          <ThemedText style={styles.inputLabel}>COVERAGE FOR</ThemedText>
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

        <View style={styles.inputCard}>
          <ThemedText style={styles.inputLabel}>TYPICAL MEDICAL USE</ThemedText>
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

        <View style={styles.inputCard}>
          <ThemedText style={styles.inputLabel}>DENTAL COVERAGE (TDP)</ThemedText>
          <ThemedText style={styles.inputHint}>
            {status === 'active'
              ? 'Active Duty member dental is free. TDP covers family members.'
              : status === 'retired'
              ? 'Retirees use FEDVIP — see notes below for cost range.'
              : 'TRS members can add TDP for family coverage.'}
          </ThemedText>
          <ChipRow<DentalPlan>
            options={[
              { value: 'none',     label: 'None' },
              { value: 'member',   label: 'Member', sub: '$14/mo' },
              { value: 'plus_one', label: '+ 1',    sub: '$34/mo' },
              { value: 'family',   label: 'Family',  sub: '$45/mo' },
            ]}
            selected={dental}
            onSelect={setDental}
          />
        </View>

        {/* ── Note ── */}
        <View style={styles.noteCard}>
          <ThemedText style={styles.noteText}>{result.note}</ThemedText>
        </View>

        {/* ── Plan Comparison ── */}
        <SectionLabel text="PLAN COMPARISON" />

        {result.winnerTag !== 'same' && (
          <View style={[
            styles.savingsBanner,
            { borderColor: result.winnerTag === 'prime' ? '#1565C0' : '#00695C' },
          ]}>
            <ThemedText style={styles.savingsBannerText}>
              {result.winnerTag === 'prime'
                ? `TRICARE Prime saves you ~${fmtMoney(Math.abs(result.savingsForPrime))}/yr for this usage profile`
                : `${result.alt.name} saves you ~${fmtMoney(Math.abs(result.savingsForPrime))}/yr for this usage profile`}
            </ThemedText>
          </View>
        )}
        {result.winnerTag === 'same' && (
          <View style={[styles.savingsBanner, { borderColor: '#3D6080' }]}>
            <ThemedText style={styles.savingsBannerText}>
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
            <View style={styles.dentalNoteCard}>
              <ThemedText style={styles.dentalNoteTitle}>FEDVIP (Federal Dental/Vision)</ThemedText>
              <ThemedText style={styles.dentalNoteBody}>
                Retirees are not covered by TDP. FEDVIP is available during open season (Nov–Dec) with premiums varying by plan and location — typically $25–$55/month for family dental coverage. Enroll at benefeds.com.
              </ThemedText>
              <View style={styles.dentalNoteRow}>
                <ThemedText style={styles.dentalNoteStat}>$25–$55/mo</ThemedText>
                <ThemedText style={styles.dentalNoteStatLabel}>typical FEDVIP family premium</ThemedText>
              </View>
            </View>
          </>
        )}

        {/* ── Key Decisions ── */}
        <SectionLabel text="KEY DECISION FACTORS" />
        <View style={styles.decisionsCard}>
          {[
            { icon: '📍', title: 'MTF PROXIMITY', body: 'Prime is most valuable when you live near a Military Treatment Facility. MTF care is free for active duty families under Prime.' },
            { icon: '🔄', title: 'REFERRALS', body: 'Prime requires a PCM referral to see a specialist. Select lets you book specialists directly — important for families with ongoing conditions.' },
            { icon: '📅', title: 'ENROLLMENT PERIOD', body: 'You can change plans each year (Nov 1–Dec 31 for most) or within 90 days of a qualifying life event (PCS, birth, marriage).' },
            { icon: '🏥', title: 'URGENT CARE', body: 'Both plans cover TRICARE-authorized urgent care. Active Duty Prime: $0. Retired/Reserve Prime: $22 copay. Select: 20% after deductible.' },
          ].map((d) => (
            <View key={d.title} style={styles.decisionRow}>
              <ThemedText style={styles.decisionIcon}>{d.icon}</ThemedText>
              <View style={{ flex: 1, gap: 3 }}>
                <ThemedText style={styles.decisionTitle}>{d.title}</ThemedText>
                <ThemedText style={styles.decisionBody}>{d.body}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <ThemedText style={styles.disclaimer}>
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
  heading:  { fontSize: 28, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 2 },
  subhead:  { color: '#3D6080', fontSize: 9 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine:     { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  sectionLabel:    { color: '#3D6080', fontSize: 9 },

  inputCard: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  inputLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#3D6080' },
  inputHint:  { fontSize: 9, color: '#3D6080', fontStyle: 'italic', marginTop: -Spacing.one },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one + 2 },
  chip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    gap: 1,
  },
  chipActive:       { backgroundColor: Brand.accent + '20', borderColor: Brand.accent },
  chipText:         { fontSize: 12, fontWeight: '700', color: '#4D7A9A' },
  chipTextActive:   { color: Brand.accent },
  chipSub:          { fontSize: 8, color: '#3D6080' },
  chipSubActive:    { color: Brand.accent + 'AA' },

  noteCard: {
    backgroundColor: Brand.tactical + '10',
    borderWidth: 1,
    borderColor: Brand.tactical + '30',
    borderRadius: 4,
    padding: Spacing.three,
  },
  noteText: { fontSize: 11, color: '#4D7A9A', lineHeight: 17 },

  savingsBanner: {
    borderWidth: 1,
    borderRadius: 4,
    padding: Spacing.two + 2,
    alignItems: 'center',
  },
  savingsBannerText: { fontSize: 11, fontWeight: '700', color: '#C8D8E8', textAlign: 'center', letterSpacing: 0.3 },

  cardsRow: { flexDirection: 'row', gap: Spacing.two },

  planCard: {
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.border,
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
  planName: { fontSize: 10, fontWeight: '700', color: '#C8D8E8', letterSpacing: 0.3 },

  planBody: { padding: Spacing.two, gap: Spacing.one + 2 },
  costRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { fontSize: 9, color: '#4D7A9A', flex: 1, paddingRight: 4 },
  costVal:   { fontSize: 10, fontWeight: '700', color: '#C8D8E8' },
  planDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border, marginVertical: Spacing.one },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5, color: '#3D6080' },
  totalVal:   { fontSize: 16, fontWeight: '900' },

  capRow:  { alignItems: 'flex-end' },
  capText: { fontSize: 7, color: '#3D6080' },

  featureBlock: { gap: 3 },
  featureRow:   { flexDirection: 'row', gap: 4, alignItems: 'flex-start' },
  featureIcon:  { fontSize: 10, fontWeight: '800', width: 10 },
  featureText:  { flex: 1, fontSize: 9, color: '#4D7A9A', lineHeight: 13 },
  featureIconDim: { fontSize: 10, color: '#2A4A60', width: 10 },
  featureTextDim: { flex: 1, fontSize: 9, color: '#2A4A60', lineHeight: 13 },

  rxTable: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 0,
  },
  rxHeaderRow: { backgroundColor: '#0D1E2E' },
  rxRow: { flexDirection: 'row', paddingVertical: Spacing.one + 3, paddingHorizontal: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  rxCell: { flex: 1, fontSize: 9, textAlign: 'center' },
  rxHeader: { fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  rxNote: { fontSize: 8, color: '#2A4A60', padding: Spacing.two, textAlign: 'center' },

  dentalNoteCard: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  dentalNoteTitle: { fontSize: 12, fontWeight: '800', color: '#C8D8E8', letterSpacing: 0.3 },
  dentalNoteBody:  { fontSize: 11, color: '#4D7A9A', lineHeight: 17 },
  dentalNoteRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.one },
  dentalNoteStat:  { fontSize: 18, fontWeight: '800', color: Brand.tactical },
  dentalNoteStatLabel: { fontSize: 9, color: '#4D7A9A' },

  decisionsCard: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  decisionRow:   { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  decisionIcon:  { fontSize: 18, width: 28, textAlign: 'center' },
  decisionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: Brand.accent },
  decisionBody:  { fontSize: 10, color: '#4D7A9A', lineHeight: 15 },

  disclaimer: { color: '#2A4A60', fontSize: 8, textAlign: 'center', lineHeight: 13, paddingHorizontal: Spacing.two },
});
