import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getBahRate, PAY_GRADES, PayGrade } from '@/data/bah-rates';
import { useUserStore } from '@/store/user.store';

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT: PayGrade[]  = ['W1','W2','W3','W4','W5'];
const OFFICER: PayGrade[]  = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];

const MHA_OPTIONS = [
  { label: 'Fort Liberty, NC', zip: '28301' },
  { label: 'Camp Lejeune, NC', zip: '28542' },
  { label: 'Norfolk, VA',      zip: '23511' },
  { label: 'Quantico, VA',     zip: '22134' },
  { label: 'Fort Meade, MD',   zip: '20755' },
  { label: 'DC Area',          zip: '20762' },
  { label: 'Fort Cavazos, TX', zip: '76544' },
  { label: 'JBSA, TX',        zip: '78234' },
  { label: 'Fort Carson, CO',  zip: '80913' },
  { label: 'JBLM, WA',        zip: '98433' },
  { label: 'San Diego, CA',    zip: '92136' },
  { label: 'Hawaii',           zip: '96860' },
];

type DepStatus = 'without' | 'with';

interface EligibilityResult {
  eligible: boolean;
  status: 'required_barracks' | 'waiver_possible' | 'eligible' | 'eligible_all_grades';
  summary: string;
  details: string[];
  color: string;
}

function getEligibility(grade: PayGrade, depStatus: DepStatus): EligibilityResult {
  const withDep = depStatus === 'with';

  // With dependents — always eligible regardless of grade
  if (withDep) {
    return {
      eligible: true,
      status: 'eligible_all_grades',
      summary: 'ELIGIBLE — All grades with dependents receive BAH.',
      details: [
        'Service members with dependents are entitled to BAH at the "with dependents" rate at all pay grades.',
        'Dependents include: spouse, unmarried children under 23 enrolled in school, disabled dependents.',
        'BAH is based on permanent duty station (PDS) ZIP code, not where dependents live.',
        'If living in government quarters (on-post housing), BAH is reduced or eliminated.',
      ],
      color: Brand.success,
    };
  }

  // Single — E1–E3
  if (['E1','E2','E3'].includes(grade)) {
    return {
      eligible: false,
      status: 'required_barracks',
      summary: 'NOT ELIGIBLE — E1–E3 without dependents typically required in barracks.',
      details: [
        'Enlisted grades E1 through E3 without dependents are normally required to reside in barracks/government quarters.',
        'No BAH is authorized if adequate government quarters are available at your installation.',
        'Exception: BAH may be authorized if no adequate quarters are available (barracks full or not built to standard).',
        'If you have dependents, you are entitled to full BAH regardless of grade.',
        'Getting married activates full BAH — but do not marry solely for BAH. It is not the ROI you think.',
      ],
      color: Brand.danger,
    };
  }

  // Single — E4
  if (grade === 'E4') {
    return {
      eligible: false,
      status: 'waiver_possible',
      summary: 'CONDITIONAL — E4 eligibility depends on installation policy and waiver.',
      details: [
        'E4 (Specialist/Corporal) without dependents: eligibility depends on installation.',
        'Many installations require E4s to live in barracks. Others allow E4s to move off-post.',
        'A BAH waiver from your unit commander or housing office may be required.',
        'Some installations issue automatic BAH to E4s if barracks are at capacity.',
        'Check with your unit S1 and installation housing office for your specific situation.',
        'Once you reach E5, you are entitled to BAH without dependents as a matter of policy.',
      ],
      color: Brand.warning,
    };
  }

  // E5 and above, all warrant and officer grades
  return {
    eligible: true,
    status: 'eligible',
    summary: `ELIGIBLE — ${grade} without dependents is entitled to BAH.`,
    details: [
      `E5 and above are entitled to BAH without dependents as a matter of DoD policy.`,
      'You are not required to live in barracks at this grade unless you choose to.',
      'BAH is paid based on your permanent duty station MHA, not where you actually live.',
      'If you live in government quarters voluntarily, BAH is offset against the rental cost of those quarters.',
      'Warrant Officers and all Officer grades receive BAH without dependents at all times.',
    ],
    color: Brand.success,
  };
}

function Chip({ label, selected, onPress }: {
  label: string; selected: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}>
      <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</ThemedText>
    </Pressable>
  );
}

function RateTable({ zip }: { zip: string }) {
  const grades: PayGrade[] = ['E4','E5','E6','E7','W1','O1','O2','O3'];

  return (
    <View style={styles.rateTable}>
      <View style={styles.rateTableHeader}>
        <ThemedText style={styles.rateTableCol}>GRADE</ThemedText>
        <ThemedText style={styles.rateTableCol}>W/ DEPS</ThemedText>
        <ThemedText style={styles.rateTableCol}>W/O DEPS</ThemedText>
      </View>
      {grades.map((g) => {
        const w = getBahRate(zip, g, true) ?? 0;
        const wo = getBahRate(zip, g, false) ?? 0;
        return (
          <View key={g} style={styles.rateTableRow}>
            <ThemedText style={styles.rateTableGrade}>{g}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.tactical }]}>
              ${w.toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.accent }]}>
              ${wo.toLocaleString()}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export default function BahGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const storedGrade = useUserStore((s) => s.payGrade);
  const storedZip   = useUserStore((s) => s.mhaZip);

  const [grade, setGrade]         = useState<PayGrade>(storedGrade ?? 'E5');
  const [depStatus, setDepStatus] = useState<DepStatus>('without');
  const [zip, setZip]             = useState(storedZip ?? '28301');

  const eligibility = useMemo(() => getEligibility(grade, depStatus), [grade, depStatus]);
  const bahRate = useMemo(() => getBahRate(zip, grade, depStatus === 'with') ?? 0, [zip, grade, depStatus]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools'))}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>BAH Eligibility Guide</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>BASIC ALLOWANCE FOR HOUSING</ThemedText>
          <ThemedText style={styles.heroTitle}>BAH Eligibility & Rates</ThemedText>
          <ThemedText style={styles.heroBody}>
            FY2026 rates. Understand when you are eligible, what rate you receive, and how to maximize your housing allowance.
          </ThemedText>
        </ThemedView>

        {/* Grade selector */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>PAY GRADE</ThemedText>
          <ThemedText style={styles.groupLabel}>ENLISTED</ThemedText>
          <View style={styles.chipRow}>
            {ENLISTED.map((g) => (
              <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
          <ThemedText style={[styles.groupLabel, { marginTop: Spacing.one }]}>WARRANT</ThemedText>
          <View style={styles.chipRow}>
            {WARRANT.map((g) => (
              <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
          <ThemedText style={[styles.groupLabel, { marginTop: Spacing.one }]}>OFFICER</ThemedText>
          <View style={styles.chipRow}>
            {OFFICER.map((g) => (
              <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
        </ThemedView>

        {/* Dependency status */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>DEPENDENCY STATUS</ThemedText>
          <View style={styles.chipRow}>
            <Chip label="Without Dependents" selected={depStatus === 'without'} onPress={() => setDepStatus('without')} />
            <Chip label="With Dependents" selected={depStatus === 'with'} onPress={() => setDepStatus('with')} />
          </View>
        </ThemedView>

        {/* Eligibility result */}
        <View style={[styles.eligCard, { borderLeftColor: eligibility.color }]}>
          <ThemedText style={[styles.eligStatus, { color: eligibility.color }]}>
            {eligibility.summary}
          </ThemedText>
          {eligibility.details.map((d, i) => (
            <View key={i} style={styles.eligDetailRow}>
              <ThemedText style={[styles.eligBullet, { color: eligibility.color }]}>▸</ThemedText>
              <ThemedText style={styles.eligDetail}>{d}</ThemedText>
            </View>
          ))}
        </View>

        {/* MHA selector */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>DUTY STATION / MHA</ThemedText>
          <View style={styles.chipRow}>
            {MHA_OPTIONS.map((m) => (
              <Chip key={m.zip} label={m.label} selected={zip === m.zip} onPress={() => setZip(m.zip)} />
            ))}
          </View>
        </ThemedView>

        {/* Rate display */}
        {eligibility.eligible && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText style={styles.cardLabel}>YOUR FY2026 BAH RATE</ThemedText>
            <View style={styles.rateHero}>
              <ThemedText style={styles.rateHeroLabel}>
                {grade} · {depStatus === 'with' ? 'With Dependents' : 'Without Dependents'}
              </ThemedText>
              <ThemedText style={styles.rateHeroValue}>${bahRate.toLocaleString()}</ThemedText>
              <ThemedText style={styles.rateHeroSub}>/month</ThemedText>
            </View>
          </ThemedView>
        )}

        {/* Full rate table */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>RATE REFERENCE TABLE — {MHA_OPTIONS.find(m => m.zip === zip)?.label ?? zip}</ThemedText>
          <RateTable zip={zip} />
        </ThemedView>

        {/* Rules explainer */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>HOW BAH WORKS</ThemedText>
          {[
            { q: 'What is BAH?', a: 'Basic Allowance for Housing is a non-taxable monthly allowance designed to partially offset housing costs in the local market near your duty station.' },
            { q: 'How is the rate set?', a: 'DoD surveys rental prices annually for each Military Housing Area (MHA). Rates are set to cover approximately 95% of the local median rental cost for your grade.' },
            { q: 'Does it count as income?', a: 'No. BAH is non-taxable and not counted as gross income for federal tax purposes.' },
            { q: 'What if I live in government housing?', a: 'If you voluntarily move into on-post housing, your BAH is often offset dollar-for-dollar against rent charged by the housing office. You keep any difference.' },
            { q: 'Do I keep it if I rent under the rate?', a: 'Yes. If your actual rent is lower than your BAH rate, you keep the difference. This is called "BAH arbitrage."' },
            { q: 'What about OHA overseas?', a: 'OCONUS service members receive Overseas Housing Allowance (OHA) instead of BAH. OHA covers actual rent up to a ceiling based on grade and location.' },
          ].map((item, i) => (
            <View key={i} style={styles.faqItem}>
              <ThemedText style={styles.faqQ}>{item.q}</ThemedText>
              <ThemedText style={styles.faqA}>{item.a}</ThemedText>
            </View>
          ))}
        </ThemedView>

        {/* Strategy tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>BAH STRATEGY FOR SINGLE SMs</ThemedText>
          {[
            'E5+ only: Get off post as soon as you are eligible. Rent below your BAH rate and pocket the difference.',
            'Roommate tactic: Two E5s share a 2BR apartment. Each pays $700/mo toward a unit under both their BAH rates. Both pocket $500+/mo.',
            'Drive the market: Off-post apartments near cheaper installations let you pocket $300–$600+/mo.',
            'BAH rate vs actual rent: Always negotiate rent below your BAH rate. Landlords near military bases often price to BAH — push back.',
            'Do not give your BAH entitlement to on-post housing without checking off-post rates first.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
            Rates are FY2026 DoD BAH tables. Actual entitlement is determined by official orders and housing office. Rates shown are "without dependents" unless dependents are selected. O7–O10 rates are capped at O6 rate per DoD policy.
          </ThemedText>
        </ThemedView>

      </ScrollView>
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.primary,
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.primary },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  groupLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: '#3D6080' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#04080F',
  },
  chipSelected: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  chipTextSelected: { color: Brand.tactical },

  eligCard: {
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.border,
    borderLeftWidth: 4,
    borderRadius: 4,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  eligStatus: { fontSize: 12, fontWeight: '800', lineHeight: 18 },
  eligDetailRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 4 },
  eligBullet: { fontSize: 10, marginTop: 2 },
  eligDetail: { flex: 1, fontSize: 11, lineHeight: 17, color: '#8AA8C0' },

  rateHero: { alignItems: 'center', gap: 4 },
  rateHeroLabel: { fontSize: 11, color: '#4D7A9A', fontWeight: '700' },
  rateHeroValue: { fontSize: 26, fontWeight: '900', color: Brand.accent, fontFamily: 'Courier New' },
  rateHeroSub: { fontSize: 12, color: '#4D7A9A' },

  rateTable: { gap: 4 },
  rateTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
    paddingBottom: 4,
  },
  rateTableCol: { flex: 1, fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  rateTableRow: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0D1E30' },
  rateTableGrade: { flex: 1, fontSize: 11, fontWeight: '700', color: '#8AA8C0' },
  rateTableValue: { flex: 1, fontSize: 12, fontWeight: '700', fontFamily: 'Courier New' },

  faqItem: { gap: 4, paddingBottom: Spacing.one },
  faqQ: { fontSize: 12, fontWeight: '700', color: '#C8D8E8' },
  faqA: { fontSize: 11, lineHeight: 17, color: '#4D7A9A' },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.accent, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#4D7A9A' },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, color: '#3D6080', textAlign: 'center' },
});
