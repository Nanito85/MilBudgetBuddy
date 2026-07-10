import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchRegNote } from '@/components/BranchRegNote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getBahRate, hasBahData, PAY_GRADES, PayGrade } from '@/data/bah-rates';
import { Installation, getInstallationByZip, searchInstallations } from '@/data/installations';
import { OhaLocation, searchOhaLocations } from '@/data/oha-locations';
import { getOhaRate, getOhaTotalCeiling, isOhaDataStale, OHA_DATA_QUARTER } from '@/data/oha-rates';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

// ── Grade groupings ────────────────────────────────────────────────────────────
const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT:  PayGrade[] = ['W1','W2','W3','W4','W5'];
const OFFICER:  PayGrade[] = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];
const ALL_GRADES: PayGrade[] = [...ENLISTED, ...WARRANT, ...OFFICER];

type DepStatus = 'without' | 'with';
type TabMode   = 'bah' | 'oha';

// ── Eligibility logic ─────────────────────────────────────────────────────────
interface EligibilityResult {
  eligible: boolean;
  status:   string;
  summary:  string;
  details:  string[];
  color:    string;
}

function getEligibility(grade: PayGrade, depStatus: DepStatus): EligibilityResult {
  const withDep = depStatus === 'with';
  if (withDep) {
    return {
      eligible: true,
      status:   'eligible_all_grades',
      summary:  'ELIGIBLE — All grades with dependents receive BAH.',
      details: [
        'Any rank with dependents (spouse, children under 23 in school, disabled dependents) receives BAH.',
        'BAH is based on your duty station ZIP code — not where your family lives.',
        'If you live in government quarters (on-post housing), BAH may be offset against rent charged.',
        'You keep any difference between your BAH rate and your actual rent.',
      ],
      color: Brand.success,
    };
  }
  if (['E1','E2','E3'].includes(grade)) {
    return {
      eligible: false,
      status:   'required_barracks',
      summary:  'NOT ELIGIBLE — E1–E3 without dependents must live in the barracks.',
      details: [
        'Grades E1, E2, and E3 without dependents are required to live in barracks when adequate quarters are available.',
        'No BAH is paid if the barracks meet DoD standards at your installation.',
        'Exception: If the barracks are full or not up to standard, you may receive BAH — ask your housing office.',
        'Once you have dependents (spouse or child), you are entitled to full BAH regardless of rank.',
      ],
      color: Brand.danger,
    };
  }
  if (grade === 'E4') {
    return {
      eligible: false,
      status:   'waiver_possible',
      summary:  'CONDITIONAL — E4 eligibility depends on your installation.',
      details: [
        'E4 without dependents: some installations require barracks; others allow off-post living.',
        'You may need a waiver from your unit commander or housing office.',
        'Once you reach E5, you are automatically entitled to BAH without dependents — no waiver needed.',
        'Check with your unit S1 and installation housing office for your specific situation.',
      ],
      color: Brand.warning,
    };
  }
  return {
    eligible: true,
    status:   'eligible',
    summary:  `ELIGIBLE — ${grade} without dependents is entitled to BAH.`,
    details: [
      'E5 and above are entitled to BAH without dependents as a matter of DoD policy.',
      'You do not have to live in the barracks at this grade.',
      'BAH is paid based on your duty station MHA (Military Housing Area) ZIP code.',
      'Warrant Officers and Officers receive BAH without dependents at all grades.',
    ],
    color: Brand.success,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: tc.background }, selected && styles.chipSelected]}>
      <ThemedText style={[styles.chipText, { color: tc.textHint }, selected && styles.chipTextSelected]}>{label}</ThemedText>
    </Pressable>
  );
}

function FullRateTable({ zip }: { zip: string }) {
  const tc = useThemeColors();
  return (
    <View style={styles.rateTable}>
      <View style={[styles.rateTableHeader, { borderBottomColor: tc.borderColor }]}>
        <ThemedText style={[styles.rateTableCol, { color: tc.textMuted, flex: 0.8 }]}>GRADE</ThemedText>
        <ThemedText style={[styles.rateTableCol, { color: tc.textMuted }]}>W/ DEPENDENTS</ThemedText>
        <ThemedText style={[styles.rateTableCol, { color: tc.textMuted }]}>W/O DEPENDENTS</ThemedText>
      </View>

      {/* Enlisted */}
      <View style={[styles.rateGroupRow, { backgroundColor: tc.surface }]}>
        <ThemedText style={[styles.rateGroupLabel, { color: tc.textHint }]}>ENLISTED</ThemedText>
      </View>
      {ENLISTED.map((g) => {
        const w  = getBahRate(zip, g, true)  ?? 0;
        const wo = getBahRate(zip, g, false) ?? 0;
        return (
          <View key={g} style={[styles.rateTableRow, { borderBottomColor: tc.borderColor }]}>
            <ThemedText style={[styles.rateTableGrade, { color: tc.textSecondary, flex: 0.8 }]}>{g}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.tactical }]}>${w.toLocaleString()}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.accent }]}>${wo.toLocaleString()}</ThemedText>
          </View>
        );
      })}

      {/* Warrant */}
      <View style={[styles.rateGroupRow, { backgroundColor: tc.surface }]}>
        <ThemedText style={[styles.rateGroupLabel, { color: tc.textHint }]}>WARRANT OFFICER</ThemedText>
      </View>
      {WARRANT.map((g) => {
        const w  = getBahRate(zip, g, true)  ?? 0;
        const wo = getBahRate(zip, g, false) ?? 0;
        return (
          <View key={g} style={[styles.rateTableRow, { borderBottomColor: tc.borderColor }]}>
            <ThemedText style={[styles.rateTableGrade, { color: tc.textSecondary, flex: 0.8 }]}>{g}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.tactical }]}>${w.toLocaleString()}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.accent }]}>${wo.toLocaleString()}</ThemedText>
          </View>
        );
      })}

      {/* Officer */}
      <View style={[styles.rateGroupRow, { backgroundColor: tc.surface }]}>
        <ThemedText style={[styles.rateGroupLabel, { color: tc.textHint }]}>OFFICER</ThemedText>
      </View>
      {OFFICER.map((g) => {
        const w  = getBahRate(zip, g, true)  ?? 0;
        const wo = getBahRate(zip, g, false) ?? 0;
        return (
          <View key={g} style={[styles.rateTableRow, { borderBottomColor: tc.borderColor }]}>
            <ThemedText style={[styles.rateTableGrade, { color: tc.textSecondary, flex: 0.8 }]}>{g}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.tactical }]}>${w.toLocaleString()}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.accent }]}>${wo.toLocaleString()}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

// ── BAH location search ────────────────────────────────────────────────────────
function LocationSearch({
  value,
  onChange,
  onSelect,
  selectedInstallation,
  onClear,
  inputBg,
  inputText,
}: {
  value: string;
  onChange: (t: string) => void;
  onSelect: (inst: Installation) => void;
  selectedInstallation: Installation | null;
  onClear: () => void;
  inputBg: string;
  inputText: string;
}) {
  const tc = useThemeColors();
  const results = useMemo(
    () => searchInstallations(value).filter(i => !i.oconus && i.mhaZip && hasBahData(i.mhaZip)).slice(0, 25),
    [value],
  );
  const hasQuery = value.trim().length > 0;

  return (
    <View>
      <ThemedText style={styles.cardLabel}>DUTY STATION / MHA LOOKUP</ThemedText>
      <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>
        Type your installation name, city, or state to find your BAH rates.
      </ThemedText>

      <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor: tc.borderColor }]}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Fort Liberty · Norfolk · San Diego · Kaneohe"
          placeholderTextColor={tc.textMuted}
          style={[styles.searchInput, { color: inputText }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChange('')} style={styles.searchClear}>
            <ThemedText style={[styles.searchClearText, { color: tc.textHint }]}>✕</ThemedText>
          </Pressable>
        )}
      </View>

      {/* Search results dropdown */}
      {hasQuery && (
        <View style={[styles.resultsList, { borderColor: tc.borderColor }]}>
          {results.length === 0 && (
            <ThemedText style={[styles.resultsEmpty, { color: tc.textHint }]}>
              No locations match. Try the installation name or nearby city.
            </ThemedText>
          )}
          {results.map((inst) => (
            <Pressable
              key={inst.id}
              onPress={() => onSelect(inst)}
              style={({ pressed }) => [styles.resultRow, { backgroundColor: tc.surface, borderBottomColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.resultLabel, { color: tc.textPrimary }]}>{inst.name}</ThemedText>
                <ThemedText style={[styles.resultSub, { color: tc.textMuted }]}>{inst.city}, {inst.state}</ThemedText>
              </View>
              <View style={styles.branchBadge}>
                <ThemedText style={styles.branchBadgeText}>{inst.branch}</ThemedText>
              </View>
            </Pressable>
          ))}
          {results.length === 25 && (
            <ThemedText style={[styles.resultsMore, { color: tc.textMuted }]}>Showing top 25 — type more to narrow results.</ThemedText>
          )}
        </View>
      )}

      {/* Selected location card */}
      {!hasQuery && selectedInstallation && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedCardTop}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.selectedCardLabel}>SELECTED LOCATION</ThemedText>
              <ThemedText style={[styles.selectedCardName, { color: tc.textPrimary }]}>{selectedInstallation.name}</ThemedText>
              <ThemedText style={[styles.selectedCardSub, { color: tc.textHint }]}>
                {selectedInstallation.city}, {selectedInstallation.state}
              </ThemedText>
            </View>
            <View style={styles.branchBadge}>
              <ThemedText style={styles.branchBadgeText}>{selectedInstallation.branch}</ThemedText>
            </View>
          </View>
          <Pressable onPress={onClear} style={[styles.changeBtn, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.changeBtnText, { color: tc.textHint }]}>Change Location</ThemedText>
          </Pressable>
        </View>
      )}

      {/* Empty prompt */}
      {!hasQuery && !selectedInstallation && (
        <View style={styles.emptyPrompt}>
          <ThemedText style={styles.emptyPromptIcon}>📍</ThemedText>
          <ThemedText style={[styles.emptyPromptText, { color: tc.textHint }]}>
            Start typing your duty station above to see BAH rates.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// ── OHA location search ────────────────────────────────────────────────────────
function OhaSearch({
  value,
  onChange,
  selectedLoc,
  onSelect,
  onClear,
  inputBg,
  inputText,
}: {
  value: string;
  onChange: (t: string) => void;
  selectedLoc: OhaLocation | undefined;
  onSelect: (loc: OhaLocation) => void;
  onClear: () => void;
  inputBg: string;
  inputText: string;
}) {
  const tc = useThemeColors();
  const results = useMemo(() => searchOhaLocations(value).slice(0, 20), [value]);
  const hasQuery = value.trim().length > 0;

  return (
    <View>
      <ThemedText style={styles.cardLabel}>OCONUS LOCATION SEARCH</ThemedText>
      <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>
        Type your installation, country, or region to find your OCONUS area.
      </ThemedText>

      <View style={[styles.searchWrap, { backgroundColor: inputBg, borderColor: tc.borderColor }]}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="e.g. Ramstein · Japan · Okinawa · Germany · Korea"
          placeholderTextColor={tc.textMuted}
          style={[styles.searchInput, { color: inputText }]}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={() => onChange('')} style={styles.searchClear}>
            <ThemedText style={[styles.searchClearText, { color: tc.textHint }]}>✕</ThemedText>
          </Pressable>
        )}
      </View>

      {hasQuery && (
        <View style={[styles.resultsList, { borderColor: tc.borderColor }]}>
          {results.length === 0 && (
            <ThemedText style={[styles.resultsEmpty, { color: tc.textHint }]}>
              No OCONUS locations match. Try a country name, region, or installation.
            </ThemedText>
          )}
          {results.map((loc, i) => (
            <Pressable
              key={i}
              onPress={() => onSelect(loc)}
              style={({ pressed }) => [styles.resultRow, { backgroundColor: tc.surface, borderBottomColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.resultLabel, { color: tc.textPrimary }]}>{loc.label}</ThemedText>
                <ThemedText style={[styles.resultSub, { color: tc.textMuted }]}>{loc.country} · {loc.region}</ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {!hasQuery && selectedLoc && (
        <View style={styles.selectedCard}>
          <View style={styles.selectedCardTop}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.selectedCardLabel}>SELECTED LOCATION</ThemedText>
              <ThemedText style={[styles.selectedCardName, { color: tc.textPrimary }]}>{selectedLoc.label}</ThemedText>
              <ThemedText style={[styles.selectedCardSub, { color: tc.textHint }]}>{selectedLoc.country} · {selectedLoc.region}</ThemedText>
            </View>
            <View style={[styles.branchBadge, { backgroundColor: Brand.accent + '20', borderColor: Brand.accent + '60' }]}>
              <ThemedText style={[styles.branchBadgeText, { color: Brand.accent }]}>OCONUS</ThemedText>
            </View>
          </View>
          <View style={[styles.ohaNote, { backgroundColor: tc.surface }]}>
            <ThemedText style={[styles.ohaNoteText, { color: tc.textSecondary }]}>{selectedLoc.note}</ThemedText>
          </View>
          <Pressable onPress={onClear} style={[styles.changeBtn, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.changeBtnText, { color: tc.textHint }]}>Change Location</ThemedText>
          </Pressable>
        </View>
      )}

      {!hasQuery && !selectedLoc && (
        <View style={styles.emptyPrompt}>
          <ThemedText style={styles.emptyPromptIcon}>✈️</ThemedText>
          <ThemedText style={[styles.emptyPromptText, { color: tc.textHint }]}>
            Start typing your OCONUS installation or country above.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function BahGuideScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const tc = useThemeColors();
  const inputBg  = tc.inputBg;
  const inputText = tc.textPrimary;

  const storedGrade = useUserStore((s) => s.payGrade);
  const storedZip   = useUserStore((s) => s.mhaZip);

  const [tab, setTab]           = useState<TabMode>('bah');
  const [grade, setGrade]       = useState<PayGrade>(storedGrade ?? 'E5');
  const [depStatus, setDepStatus] = useState<DepStatus>('without');

  // BAH search state — pre-fill from profile
  const [bahSearch, setBahSearch]             = useState('');
  const [zip, setZip]                         = useState(storedZip ?? '');
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(
    () => getInstallationByZip(storedZip)
  );

  // OHA search state
  const [ohaSearch, setOhaSearch]   = useState('');
  const [selectedOha, setSelectedOha] = useState<OhaLocation | undefined>();

  const eligibility = useMemo(() => getEligibility(grade, depStatus), [grade, depStatus]);
  const bahRate     = useMemo(
    () => (zip ? getBahRate(zip, grade, depStatus === 'with') ?? 0 : null),
    [zip, grade, depStatus],
  );

  function handleSelectMha(inst: Installation) {
    setZip(inst.mhaZip);
    setSelectedInstallation(inst);
    setBahSearch('');
  }

  function handleClearMha() {
    setZip('');
    setSelectedInstallation(null);
    setBahSearch('');
  }

  function handleSelectOha(loc: OhaLocation) {
    setSelectedOha(loc);
    setOhaSearch('');
  }

  function handleClearOha() {
    setSelectedOha(undefined);
    setOhaSearch('');
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <Pressable
            onPress={() => (router.back())}
            style={styles.back}>
            <ThemedText style={styles.backChevron}>‹</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>BAH / OHA Guide</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { borderBottomColor: tc.borderColor }]}>
          {([
            { key: 'bah' as TabMode, label: '🏠  BAH (CONUS)' },
            { key: 'oha' as TabMode, label: '✈️  OHA (OCONUS)' },
          ] as const).map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
              <ThemedText style={[styles.tabBtnText, { color: tc.textHint }, tab === t.key && { color: Brand.tactical }]}>
                {t.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* ══════════════  BAH TAB  ══════════════ */}
          {tab === 'bah' && (
            <>
              <ThemedView type="backgroundElement" style={styles.heroBanner}>
                <ThemedText style={styles.heroEyebrow}>BASIC ALLOWANCE FOR HOUSING</ThemedText>
                <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>BAH Eligibility & Rates</ThemedText>
                <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
                  FY2026 rates. Find your monthly housing allowance by duty station — then learn how to maximize it.
                </ThemedText>
              </ThemedView>

              {/* Grade selector */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>STEP 1 — YOUR PAY GRADE</ThemedText>
                <ThemedText style={[styles.groupLabel, { color: tc.textMuted }]}>ENLISTED</ThemedText>
                <View style={styles.chipRow}>
                  {ENLISTED.map((g) => <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />)}
                </View>
                <ThemedText style={[styles.groupLabel, { color: tc.textMuted, marginTop: Spacing.one }]}>WARRANT OFFICER</ThemedText>
                <View style={styles.chipRow}>
                  {WARRANT.map((g) => <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />)}
                </View>
                <ThemedText style={[styles.groupLabel, { color: tc.textMuted, marginTop: Spacing.one }]}>OFFICER</ThemedText>
                <View style={styles.chipRow}>
                  {OFFICER.map((g) => <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />)}
                </View>
              </ThemedView>

              {/* Dependency status */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>STEP 2 — DEPENDENCY STATUS</ThemedText>
                <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>Do you have a spouse or dependents on your orders?</ThemedText>
                <View style={styles.chipRow}>
                  <Chip label="No Dependents"    selected={depStatus === 'without'} onPress={() => setDepStatus('without')} />
                  <Chip label="With Dependents"  selected={depStatus === 'with'}    onPress={() => setDepStatus('with')} />
                </View>
              </ThemedView>

              {/* Eligibility result */}
              <View style={[styles.eligCard, { backgroundColor: tc.surface, borderColor: tc.borderColor, borderLeftColor: eligibility.color }]}>
                <ThemedText style={[styles.eligStatus, { color: eligibility.color }]}>{eligibility.summary}</ThemedText>
                {eligibility.details.map((d, i) => (
                  <View key={i} style={styles.eligDetailRow}>
                    <ThemedText style={[styles.eligBullet, { color: eligibility.color }]}>▸</ThemedText>
                    <ThemedText style={[styles.eligDetail, { color: tc.textSecondary }]}>{d}</ThemedText>
                  </View>
                ))}
              </View>

              {/* Duty station search */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>STEP 3 — YOUR DUTY STATION</ThemedText>
                <LocationSearch
                  value={bahSearch}
                  onChange={setBahSearch}
                  onSelect={handleSelectMha}
                  selectedInstallation={selectedInstallation}
                  onClear={handleClearMha}
                  inputBg={inputBg}
                  inputText={inputText}
                />
              </ThemedView>

              {/* Your personal rate */}
              {eligibility.eligible && zip && bahRate !== null && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText style={styles.cardLabel}>YOUR FY2026 BAH RATE</ThemedText>
                  <View style={styles.rateHero}>
                    <ThemedText style={[styles.rateHeroLabel, { color: tc.textHint }]}>
                      {grade} · {depStatus === 'with' ? 'With Dependents' : 'No Dependents'} · {selectedInstallation?.name}
                    </ThemedText>
                    <ThemedText style={styles.rateHeroValue}>${bahRate.toLocaleString()}</ThemedText>
                    <ThemedText style={[styles.rateHeroSub, { color: tc.textHint }]}>per month · non-taxable</ThemedText>
                  </View>
                </ThemedView>
              )}

              {/* Full rate table */}
              {zip && (
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText style={styles.cardLabel}>
                    FY2026 FULL RATE TABLE — {selectedInstallation?.name ?? zip}
                  </ThemedText>
                  <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>All grades — monthly non-taxable amount.</ThemedText>
                  <FullRateTable zip={zip} />
                </ThemedView>
              )}

              {/* How BAH works */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>HOW BAH WORKS — THE BASICS</ThemedText>
                {[
                  {
                    q: 'What is BAH?',
                    a: 'Basic Allowance for Housing is a tax-free monthly payment that helps cover housing costs near your duty station. It is NOT a reimbursement — you receive it regardless of your actual rent.',
                  },
                  {
                    q: 'How is my rate determined?',
                    a: 'DoD surveys rental prices annually for each Military Housing Area (MHA). Your rate is based on your pay grade and the civilian rental market at your duty station. Higher-cost cities = higher BAH.',
                  },
                  {
                    q: 'Is BAH taxable?',
                    a: 'No. BAH is completely tax-free and is not counted as gross income for federal tax purposes.',
                  },
                  {
                    q: 'What if I live on-post?',
                    a: 'If you choose to live in government/privatized housing, your BAH typically goes directly to the housing company as rent. You keep any amount remaining above what is charged.',
                  },
                  {
                    q: 'Can I keep BAH if my rent is lower?',
                    a: 'Yes. If your rent is $800/mo and your BAH is $1,500/mo, you keep the $700 difference. This is called BAH arbitrage and is perfectly legal.',
                  },
                ].map((item, i) => (
                  <View key={i} style={styles.faqItem}>
                    <ThemedText style={[styles.faqQ, { color: tc.textPrimary }]}>{item.q}</ThemedText>
                    <ThemedText style={[styles.faqA, { color: tc.textHint }]}>{item.a}</ThemedText>
                  </View>
                ))}
              </ThemedView>

              {/* Strategy tips */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>BAH MONEY STRATEGIES</ThemedText>
                {[
                  'E5 and above: Move off-post as soon as possible. Find rent below your BAH rate and keep the difference every month.',
                  'Roommate tactic: Two E5s share a 2-bedroom apartment. Each pays $700/mo in rent — both pocket $500+ in BAH each month.',
                  'Lower-cost installations: Locations with cheaper rent let you bank $300–$700+/mo while still living comfortably.',
                  'Negotiate rent: Landlords near bases often price to BAH rates. Push back and negotiate — especially when signing a long lease.',
                ].map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <ThemedText style={styles.tipBullet}>▸</ThemedText>
                    <ThemedText style={[styles.tipText, { color: tc.textHint }]}>{tip}</ThemedText>
                  </View>
                ))}
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.disclaimer}>
                <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
                  Rates are FY2026 DoD BAH tables (effective Jan 1, 2026). Actual entitlement is determined by official orders and your installation housing office. O7–O10 rates are capped at O6 per DoD policy. Verify at militarypay.defense.gov.
                </ThemedText>
              </ThemedView>
            </>
          )}

          {/* ══════════════  OHA TAB  ══════════════ */}
          {tab === 'oha' && (
            <>
              <ThemedView type="backgroundElement" style={styles.heroBanner}>
                <ThemedText style={styles.heroEyebrow}>OVERSEAS HOUSING ALLOWANCE</ThemedText>
                <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>OHA — OCONUS Housing</ThemedText>
                <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
                  Stationed overseas? OHA replaces BAH and covers your actual rent up to a quarterly ceiling set by DTMO. Find your location below, then look up exact rates at dtmo.mil.
                </ThemedText>
              </ThemedView>

              {/* OHA location search */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <OhaSearch
                  value={ohaSearch}
                  onChange={setOhaSearch}
                  selectedLoc={selectedOha}
                  onSelect={handleSelectOha}
                  onClear={handleClearOha}
                  inputBg={inputBg}
                  inputText={inputText}
                />
              </ThemedView>

              {/* Staleness warning */}
              {isOhaDataStale() && (
                <ThemedView type="backgroundElement" style={[styles.card, { borderColor: Brand.warning + '50' }]}>
                  <ThemedText style={[styles.cardLabel, { color: Brand.warning }]}>
                    ⚠ OHA DATA MAY BE OUTDATED
                  </ThemedText>
                  <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>
                    Rates shown are from {OHA_DATA_QUARTER}. OHA is updated quarterly — verify current rates at dtmo.mil.
                  </ThemedText>
                </ThemedView>
              )}

              {/* Live rates for selected location */}
              {selectedOha && (() => {
                const ohaRates = getOhaRate(selectedOha.label, grade);
                const totalCeiling = getOhaTotalCeiling(selectedOha.label, grade);
                return ohaRates ? (
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText style={styles.cardLabel}>YOUR OHA ESTIMATE — {OHA_DATA_QUARTER}</ThemedText>
                    <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>{selectedOha.label} · {grade}</ThemedText>
                    <View style={styles.rateHero}>
                      <ThemedText style={styles.rateHeroValue}>${totalCeiling?.toLocaleString()}</ThemedText>
                      <ThemedText style={[styles.rateHeroSub, { color: tc.textHint }]}>total monthly ceiling (rent + utilities)</ThemedText>
                    </View>
                    <View style={[styles.dataRow, { marginTop: Spacing.two }]}>
                      <ThemedText style={[styles.dataLabel, { color: tc.textHint }]}>Rent ceiling</ThemedText>
                      <ThemedText style={[styles.dataValue, { color: Brand.tactical }]}>${ohaRates.rentCeilingUSD.toLocaleString()}/mo</ThemedText>
                    </View>
                    <View style={styles.dataRow}>
                      <ThemedText style={[styles.dataLabel, { color: tc.textHint }]}>Utility allowance</ThemedText>
                      <ThemedText style={[styles.dataValue, { color: Brand.accent }]}>${ohaRates.utilityAllowanceUSD.toLocaleString()}/mo</ThemedText>
                    </View>
                    <ThemedText style={[styles.cardHint, { marginTop: Spacing.two, color: Brand.warning + 'CC' }]}>
                      Rates are approximate — OHA fluctuates with exchange rates. Verify at dtmo.mil.
                    </ThemedText>
                  </ThemedView>
                ) : null;
              })()}

              {/* How OHA works */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>HOW OHA WORKS</ThemedText>
                {[
                  {
                    q: 'What does OHA cover?',
                    a: 'OHA covers your actual monthly rent up to your OHA ceiling rate for your grade and location. You pay any amount above the ceiling out of pocket.',
                  },
                  {
                    q: 'How is the ceiling set?',
                    a: 'DTMO surveys the local rental market quarterly and sets ceiling rates by pay grade. Higher grades receive higher ceilings. Rates change with local currency exchange rates.',
                  },
                  {
                    q: 'What is MIHA?',
                    a: 'Move-In Housing Allowance covers one-time setup costs like key money, agent fees, appliance rental, and minor repairs. It is paid when you move in and out.',
                  },
                  {
                    q: 'What about utilities?',
                    a: 'A Utility/Recurring Maintenance Allowance (URMA) may be paid separately to cover monthly utility costs, depending on your location and host nation.',
                  },
                  {
                    q: 'Can I receive OHA and BAH at the same time?',
                    a: 'No. OCONUS service members receive OHA instead of BAH. An exception exists for specific split-family situations where dependents remain CONUS.',
                  },
                  {
                    q: 'What if my rent exceeds the ceiling?',
                    a: 'You pay the difference out of pocket. Your housing office can help identify properties at or below your ceiling. Always negotiate rent before signing a lease.',
                  },
                ].map((item, i) => (
                  <View key={i} style={styles.faqItem}>
                    <ThemedText style={[styles.faqQ, { color: tc.textPrimary }]}>{item.q}</ThemedText>
                    <ThemedText style={[styles.faqA, { color: tc.textHint }]}>{item.a}</ThemedText>
                  </View>
                ))}
              </ThemedView>

              {/* OHA grade tiers */}
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={styles.cardLabel}>OHA GRADE TIERS — GENERAL GUIDE</ThemedText>
                <ThemedText style={[styles.cardHint, { color: tc.textHint }]}>Ceilings scale with grade. Exact amounts vary by location and quarter.</ThemedText>
                {[
                  { grades: 'E1–E4', info: 'Entry-level ceiling. On-post government quarters often recommended or required.' },
                  { grades: 'E5–E9', info: 'Mid-grade ceiling. Wide off-post housing available in most OCONUS markets.' },
                  { grades: 'W1–W5', info: 'Warrant Officer tier — similar ceiling to junior officer grades.' },
                  { grades: 'O1–O3', info: 'Junior officer ceiling. Covers adequate housing in most OCONUS areas.' },
                  { grades: 'O4–O6', info: 'Senior officer ceiling. Broader housing options available.' },
                  { grades: 'O7–O10', info: 'Flag/General officer tier. Highest OHA entitlement.' },
                ].map((row, i) => (
                  <View key={i} style={styles.tierRow}>
                    <View style={styles.tierGradeBox}>
                      <ThemedText style={styles.tierGrade}>{row.grades}</ThemedText>
                    </View>
                    <ThemedText style={[styles.tierInfo, { color: tc.textHint }]}>{row.info}</ThemedText>
                  </View>
                ))}
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.disclaimer}>
                <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
                  OHA rates are set by DTMO and updated quarterly based on local market surveys. This guide is for reference only — verify your exact entitlement at dtmo.mil or through your installation housing office.
                </ThemedText>
              </ThemedView>
            </>
          )}

          <BranchRegNote />
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  back:        { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title:       { fontSize: 18, fontWeight: '700' },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.three,
  },
  tabBtn:       { flex: 1, paddingVertical: Spacing.two + 2, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: Brand.tactical },
  tabBtnText:   { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.two },

  heroBanner: { borderRadius: 4, padding: Spacing.three, borderLeftWidth: 3, borderLeftColor: Brand.primary, gap: 4 },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.primary },
  heroTitle:   { fontSize: 20, fontWeight: '900' },
  heroBody:    { fontSize: 12, lineHeight: 18, marginTop: 4 },

  card:      { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  cardHint:  { fontSize: 11, lineHeight: 16 },
  groupLabel:{ fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3,
    borderWidth: 1, borderColor: Brand.border,
  },
  chipSelected:     { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  chipText:         { fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: Brand.tactical },

  eligCard: {
    borderWidth: 1,
    borderLeftWidth: 4, borderRadius: 4, padding: Spacing.three, gap: Spacing.one,
  },
  eligStatus:    { fontSize: 12, fontWeight: '800', lineHeight: 18 },
  eligDetailRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 4 },
  eligBullet:    { fontSize: 10, marginTop: 2 },
  eligDetail:    { flex: 1, fontSize: 11, lineHeight: 17 },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: Spacing.two, gap: Spacing.one,
  },
  searchIcon:      { fontSize: 14 },
  searchInput:     { flex: 1, fontSize: 14, paddingVertical: Spacing.two + 2 },
  searchClear:     { padding: 4 },
  searchClearText: { fontSize: 12, fontWeight: '700' },

  // Results
  resultsList: {
    marginTop: Spacing.one, borderWidth: 1,
    borderRadius: 4, overflow: 'hidden',
  },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultLabel:  { fontSize: 12, fontWeight: '600' },
  resultSub:    { fontSize: 10, fontFamily: 'monospace', marginTop: 1 },
  resultsEmpty: { fontSize: 12, textAlign: 'center', padding: Spacing.three },
  resultsMore:  { fontSize: 10, textAlign: 'center', padding: Spacing.two },

  // Selected card
  selectedCard: {
    marginTop: Spacing.one, borderWidth: 1, borderColor: Brand.tactical + '50',
    borderRadius: 4, padding: Spacing.two, backgroundColor: Brand.tactical + '08', gap: Spacing.one,
  },
  selectedCardTop:  { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  selectedCardLabel:{ fontSize: 8, fontWeight: '800', letterSpacing: 1, color: Brand.tactical },
  selectedCardName: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  selectedCardSub:  { fontSize: 10, fontFamily: 'monospace', marginTop: 1 },

  changeBtn:     { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3, borderWidth: 1 },
  changeBtnText: { fontSize: 10, fontWeight: '700' },

  branchBadge:     { backgroundColor: '#005C9920', borderWidth: 1, borderColor: '#005C99', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 },
  branchBadgeText: { fontSize: 8, fontWeight: '800', color: '#00A0D0', letterSpacing: 0.5 },

  // Empty state
  emptyPrompt:     { alignItems: 'center', paddingVertical: Spacing.three, gap: 8 },
  emptyPromptIcon: { fontSize: 24 },
  emptyPromptText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  // Rate hero
  rateHero:      { alignItems: 'center', gap: 4 },
  rateHeroLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  rateHeroValue: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: Brand.accent, fontFamily: 'Courier New' },
  rateHeroSub:   { fontSize: 12 },

  // Full rate table
  rateTable:       { gap: 2 },
  rateTableHeader: { flexDirection: 'row', borderBottomWidth: 1, paddingBottom: 5, marginBottom: 2 },
  rateTableCol:    { flex: 1, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  rateGroupRow:    { paddingVertical: 3, paddingHorizontal: 2, marginTop: 6, marginBottom: 2, borderRadius: 2 },
  rateGroupLabel:  { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  rateTableRow:    { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  rateTableGrade:  { flex: 1, fontSize: 11, fontWeight: '700' },
  rateTableValue:  { flex: 1, fontSize: 12, fontWeight: '700', fontFamily: 'Courier New' },

  // FAQ
  faqItem: { gap: 4, paddingBottom: Spacing.one },
  faqQ:    { fontSize: 12, fontWeight: '700' },
  faqA:    { fontSize: 11, lineHeight: 17 },

  // Tips
  tipRow:    { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.accent, marginTop: 2 },
  tipText:   { flex: 1, fontSize: 12, lineHeight: 18 },

  // Shared data rows
  dataRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  dataLabel: { fontSize: 12 },
  dataValue: { fontSize: 13, fontWeight: '700' },

  // OHA
  dtmoBox:   { gap: Spacing.two },
  dtmoTitle: { fontSize: 14, fontWeight: '800', color: Brand.tactical },
  dtmoBody:  { fontSize: 12, lineHeight: 18, color: '#4D7A9A' }, // unused style — left as-is (dead code, no JSX render site)

  ohaNote:     { borderRadius: 3, padding: Spacing.two },
  ohaNoteText: { fontSize: 12, lineHeight: 18 },

  tierRow:      { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start', paddingVertical: Spacing.one },
  tierGradeBox: { backgroundColor: Brand.tactical + '20', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 3, minWidth: 60, alignItems: 'center' },
  tierGrade:    { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },
  tierInfo:     { flex: 1, fontSize: 11, lineHeight: 17 },

  disclaimer:     { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
