import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchRegNote } from '@/components/BranchRegNote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { getBahRate, PAY_GRADES, PayGrade } from '@/data/bah-rates';
import { useAppTheme } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT: PayGrade[]  = ['W1','W2','W3','W4','W5'];
const OFFICER: PayGrade[]  = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];

interface MhaOption { label: string; zip: string; branch?: string }

const MHA_OPTIONS: MhaOption[] = [
  // ── East Coast ─────────────────────────────────────────────────────────────
  { label: 'Fort Liberty, NC',          zip: '28301' },
  { label: 'Camp Lejeune, NC',          zip: '28542' },
  { label: 'Seymour Johnson AFB, NC',   zip: '27531' },
  { label: 'Norfolk/Hampton Roads, VA', zip: '23511' },
  { label: 'Quantico, VA',              zip: '22134' },
  { label: 'Fort Meade, MD',            zip: '20755' },
  { label: 'NAS Pax River, MD',         zip: '20670' },
  { label: 'DC/JBA Area',               zip: '20762' },
  { label: 'JBMDL, NJ',                 zip: '08641' },
  { label: 'Fort Hamilton, NY',         zip: '11252' },
  { label: 'NSB New London, CT',        zip: '06340' },
  { label: 'Hanscom AFB, MA',           zip: '01731' },
  { label: 'Fort Drum, NY',             zip: '13602' },
  // ── Southeast ──────────────────────────────────────────────────────────────
  { label: 'Fort Jackson, SC',          zip: '29207' },
  { label: 'Shaw AFB, SC',              zip: '29152' },
  { label: 'Fort Eisenhower, GA',       zip: '30905' },
  { label: 'Fort Moore, GA',            zip: '31905' },
  { label: 'Fort Stewart, GA',          zip: '31314' },
  { label: 'NAS Jacksonville, FL',      zip: '32212' },
  { label: 'MacDill AFB, FL',           zip: '33621' },
  { label: 'NAS Pensacola, FL',         zip: '32508' },
  { label: 'Fort Novosel, AL',          zip: '36322' },
  { label: 'Keesler AFB, MS',           zip: '39534' },
  // ── South / South-Central ──────────────────────────────────────────────────
  { label: 'Barksdale AFB, LA',         zip: '71110' },
  { label: 'Fort Johnson, LA',          zip: '71446' },
  { label: 'Fort Cavazos, TX',          zip: '76544' },
  { label: 'Sheppard AFB, TX',          zip: '76311' },
  { label: 'Dyess AFB, TX',             zip: '79607' },
  { label: 'Fort Bliss, TX',            zip: '79916' },
  { label: 'JBSA, TX',                  zip: '78234' },
  { label: 'Fort Sill, OK',             zip: '73503' },
  { label: 'Tinker AFB, OK',            zip: '73145' },
  // ── Midwest ────────────────────────────────────────────────────────────────
  { label: 'Scott AFB, IL',             zip: '62225' },
  { label: 'Wright-Patterson AFB, OH',  zip: '45433' },
  { label: 'Fort Knox, KY',             zip: '40121' },
  { label: 'Fort Campbell, TN/KY',      zip: '37040' },
  { label: 'Offutt AFB, NE',            zip: '68113' },
  { label: 'Fort Leavenworth, KS',      zip: '66027' },
  { label: 'Ellsworth AFB, SD',         zip: '57706' },
  { label: 'Malmstrom AFB, MT',         zip: '59402' },
  { label: 'Minot AFB, ND',             zip: '58705' },
  // ── West / Mountain ────────────────────────────────────────────────────────
  { label: 'Fort Huachuca, AZ',         zip: '85613' },
  { label: 'Davis-Monthan AFB, AZ',     zip: '85707' },
  { label: 'Luke AFB, AZ',              zip: '85308' },
  { label: 'Hill AFB, UT',              zip: '84056' },
  { label: 'Mountain Home AFB, ID',     zip: '83648' },
  { label: 'Nellis AFB, NV',            zip: '89191' },
  { label: 'Fort Carson, CO',           zip: '80913' },
  // ── Pacific Coast ──────────────────────────────────────────────────────────
  { label: 'NAS Lemoore, CA',           zip: '93245' },
  { label: 'Vandenberg SFB, CA',        zip: '93437' },
  { label: 'Travis AFB, CA',            zip: '94535' },
  { label: 'San Diego/Camp Pendleton, CA', zip: '92054' },
  { label: 'NAS Whidbey Island, WA',    zip: '98278' },
  { label: 'JBLM, WA',                  zip: '98433' },
  { label: 'NS Everett, WA',            zip: '98201' },
  // ── Alaska & Hawaii ────────────────────────────────────────────────────────
  { label: 'JBER (Anchorage, AK)',      zip: '99501' },
  { label: 'Ft Wainwright (Fairbanks)', zip: '99703' },
  { label: 'Hawaii (Schofield/JBPHH)', zip: '96818' },
  // ── Coast Guard Bases ──────────────────────────────────────────────────────
  { label: 'CG Base Boston, MA',           zip: '02110', branch: 'USCG' },
  { label: 'CG AIRSTA Cape Cod, MA',       zip: '02563', branch: 'USCG' },
  { label: 'CG Base New Haven, CT',        zip: '06512', branch: 'USCG' },
  { label: 'CG ISC Baltimore, MD',         zip: '21230', branch: 'USCG' },
  { label: 'CG Base Philadelphia, PA',     zip: '19112', branch: 'USCG' },
  { label: 'CG Base Portsmouth, VA',       zip: '23703', branch: 'USCG' },
  { label: 'CG Base Elizabeth City, NC',   zip: '27909', branch: 'USCG' },
  { label: 'CG Sector Charleston, SC',     zip: '29405', branch: 'USCG' },
  { label: 'CG AIRSTA Savannah, GA',       zip: '31408', branch: 'USCG' },
  { label: 'CG Sector Jacksonville, FL',   zip: '32210', branch: 'USCG' },
  { label: 'CG Base Miami Beach, FL',      zip: '33139', branch: 'USCG' },
  { label: 'CG AIRSTA Clearwater, FL',     zip: '33762', branch: 'USCG' },
  { label: 'CG Sector Mobile, AL',         zip: '36615', branch: 'USCG' },
  { label: 'CG Base New Orleans, LA',      zip: '70129', branch: 'USCG' },
  { label: 'CG Base Galveston, TX',        zip: '77553', branch: 'USCG' },
  { label: 'CG AIRSTA Corpus Christi, TX', zip: '78419', branch: 'USCG' },
  { label: 'CG Base Cleveland, OH',        zip: '44114', branch: 'USCG' },
  { label: 'CG Base Detroit, MI',          zip: '48226', branch: 'USCG' },
  { label: 'CG Base Chicago, IL',          zip: '60605', branch: 'USCG' },
  { label: 'CG Base Memphis, TN',          zip: '38103', branch: 'USCG' },
  { label: 'CG AIRSTA Sacramento, CA',     zip: '95655', branch: 'USCG' },
  { label: 'CG Base Alameda/SF, CA',       zip: '94501', branch: 'USCG' },
  { label: 'CG Base Los Angeles, CA',      zip: '90731', branch: 'USCG' },
  { label: 'CG Base San Diego, CA',        zip: '92135', branch: 'USCG' },
  { label: 'CG AIRSTA Port Angeles, WA',   zip: '98363', branch: 'USCG' },
  { label: 'CG Base Seattle, WA',          zip: '98134', branch: 'USCG' },
  { label: 'CG Base Honolulu, HI',         zip: '96819', branch: 'USCG' },
  { label: 'CG Base Juneau, AK',           zip: '99801', branch: 'USCG' },
  { label: 'CG AIRSTA Sitka, AK',          zip: '99835', branch: 'USCG' },
  { label: 'CG Base Kodiak, AK',           zip: '99615', branch: 'USCG' },
  { label: 'CG Base Portsmouth, NH',       zip: '03801', branch: 'USCG' },
  { label: 'CG Sector New York, NY',       zip: '10305', branch: 'USCG' },
  { label: 'CG Base Portland, OR',         zip: '97217', branch: 'USCG' },
];

const OHA_LOCATIONS = [
  { label: 'Yokota AB / Tokyo, Japan',      country: 'Japan',     note: 'High COL zone. OHA ceiling set quarterly by DTMO.' },
  { label: 'Kadena AB / Okinawa, Japan',    country: 'Japan',     note: 'US forces SOFA. Average OHA covers local apartment rent.' },
  { label: 'CFAY Yokosuka, Japan',          country: 'Japan',     note: 'Navy Fleet base. High rental market; OHA ceiling is substantial.' },
  { label: 'Misawa AB, Japan',              country: 'Japan',     note: 'Northern Honshu. Lower cost than Tokyo/Okinawa.' },
  { label: 'Camp Humphreys, South Korea',   country: 'South Korea', note: 'Largest US overseas base. Most members live on-post.' },
  { label: 'Osan AB, South Korea',          country: 'South Korea', note: 'OHA covers local housing near base.' },
  { label: 'Ramstein AB, Germany',          country: 'Germany',   note: 'High euro-denominated rental market. OHA adjusted for currency.' },
  { label: 'Stuttgart (AFRICOM), Germany',  country: 'Germany',   note: 'HQ EUCOM/AFRICOM area. Premium housing market.' },
  { label: 'Wiesbaden, Germany',            country: 'Germany',   note: 'US Army Europe HQ. Strong rental competition.' },
  { label: 'RAF Lakenheath, UK',            country: 'United Kingdom', note: 'GBP-denominated. OHA fluctuates with exchange rate.' },
  { label: 'RAF Mildenhall, UK',            country: 'United Kingdom', note: 'Co-located with Lakenheath.' },
  { label: 'Aviano AB, Italy',              country: 'Italy',     note: 'Northern Italy. Euro-denominated rents.' },
  { label: 'NAS Sigonella, Sicily, Italy',  country: 'Italy',     note: 'Sicily. Lower cost than mainland Italy.' },
  { label: 'Rota Naval Base, Spain',        country: 'Spain',     note: 'Southern Spain. Generally lower cost European market.' },
  { label: 'NSA Bahrain',                   country: 'Bahrain',   note: 'Middle East hub. OHA covers local villa/apartment rent.' },
  { label: 'Guantanamo Bay, Cuba',          country: 'Cuba',      note: 'GTMO. Very limited off-base market; most live on-post.' },
  { label: 'Camp Lemonnier, Djibouti',      country: 'Djibouti',  note: 'East Africa hub. High hardship differential applies.' },
  { label: 'Thule AB, Greenland',           country: 'Greenland', note: 'Arctic base. OHA is modest; most quarters are on-post.' },
  { label: 'Diego Garcia (BIOT)',           country: 'Brit. Ind. Ocean Terr.', note: 'Remote atoll. Nearly all personnel live on-post.' },
  { label: 'Incirlik AB, Turkey',           country: 'Turkey',    note: 'Southern Turkey. OHA set in USD equivalent.' },
  { label: 'Spangdahlem AB, Germany',       country: 'Germany',   note: 'Rural Germany. Lower than Frankfurt/Ramstein.' },
  { label: 'Camp Foster / Futenma, Japan',  country: 'Japan',     note: 'Marine Corps Okinawa. Similar market to Kadena.' },
];

type DepStatus = 'without' | 'with';
type TabMode = 'bah' | 'oha';

interface EligibilityResult {
  eligible: boolean;
  status: string;
  summary: string;
  details: string[];
  color: string;
}

function getEligibility(grade: PayGrade, depStatus: DepStatus): EligibilityResult {
  const withDep = depStatus === 'with';
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
      ],
      color: Brand.danger,
    };
  }
  if (grade === 'E4') {
    return {
      eligible: false,
      status: 'waiver_possible',
      summary: 'CONDITIONAL — E4 eligibility depends on installation policy and waiver.',
      details: [
        'E4 without dependents: eligibility depends on your installation.',
        'Many installations require E4s to live in barracks. Others allow E4s to move off-post.',
        'A BAH waiver from your unit commander or housing office may be required.',
        'Once you reach E5, you are entitled to BAH without dependents as a matter of policy.',
        'Check with your unit S1 and installation housing office for your specific situation.',
      ],
      color: Brand.warning,
    };
  }
  return {
    eligible: true,
    status: 'eligible',
    summary: `ELIGIBLE — ${grade} without dependents is entitled to BAH.`,
    details: [
      'E5 and above are entitled to BAH without dependents as a matter of DoD policy.',
      'You are not required to live in barracks at this grade unless you choose to.',
      'BAH is paid based on your permanent duty station MHA, not where you actually live.',
      'Warrant Officers and all Officer grades receive BAH without dependents at all times.',
    ],
    color: Brand.success,
  };
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
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
        const w  = getBahRate(zip, g, true)  ?? 0;
        const wo = getBahRate(zip, g, false) ?? 0;
        return (
          <View key={g} style={styles.rateTableRow}>
            <ThemedText style={styles.rateTableGrade}>{g}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.tactical }]}>${w.toLocaleString()}</ThemedText>
            <ThemedText style={[styles.rateTableValue, { color: Brand.accent }]}>${wo.toLocaleString()}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export default function BahGuideScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const appTheme = useAppTheme();
  const isDark = appTheme === 'dark';
  const inputBg = isDark ? '#050B14' : '#FFFFFF';
  const inputText = isDark ? '#C8D8E8' : '#0D1E2E';

  const storedGrade = useUserStore((s) => s.payGrade);
  const storedZip   = useUserStore((s) => s.mhaZip);

  const [tab, setTab]           = useState<TabMode>('bah');
  const [grade, setGrade]       = useState<PayGrade>(storedGrade ?? 'E5');
  const [depStatus, setDepStatus] = useState<DepStatus>('without');
  const [zip, setZip]           = useState(storedZip ?? '28301');
  const [mhaSearch, setMhaSearch] = useState('');
  const [ohaSearch, setOhaSearch] = useState('');

  const eligibility = useMemo(() => getEligibility(grade, depStatus), [grade, depStatus]);
  const bahRate     = useMemo(() => getBahRate(zip, grade, depStatus === 'with') ?? 0, [zip, grade, depStatus]);

  const selectedMha = MHA_OPTIONS.find((m) => m.zip === zip);

  const filteredMha = useMemo(() => {
    const q = mhaSearch.trim().toLowerCase();
    if (!q) return MHA_OPTIONS;
    return MHA_OPTIONS.filter((m) =>
      m.label.toLowerCase().includes(q) ||
      m.zip.includes(q) ||
      (m.branch?.toLowerCase().includes(q) ?? false),
    );
  }, [mhaSearch]);

  const filteredOha = useMemo(() => {
    const q = ohaSearch.trim().toLowerCase();
    if (!q) return OHA_LOCATIONS;
    return OHA_LOCATIONS.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      o.country.toLowerCase().includes(q),
    );
  }, [ohaSearch]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools'))}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>BAH / OHA Guide</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar: BAH | OHA */}
      <View style={styles.tabBar}>
        {([
          { key: 'bah' as TabMode, label: '🏠  BAH (CONUS)' },
          { key: 'oha' as TabMode, label: '✈️  OHA (OCONUS)' },
        ]).map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
            <ThemedText style={[styles.tabBtnText, tab === t.key && { color: Brand.tactical }]}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* ══════════════  BAH TAB  ══════════════ */}
        {tab === 'bah' && (
          <>
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
                {ENLISTED.map((g) => <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />)}
              </View>
              <ThemedText style={[styles.groupLabel, { marginTop: Spacing.one }]}>WARRANT</ThemedText>
              <View style={styles.chipRow}>
                {WARRANT.map((g) => <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />)}
              </View>
              <ThemedText style={[styles.groupLabel, { marginTop: Spacing.one }]}>OFFICER</ThemedText>
              <View style={styles.chipRow}>
                {OFFICER.map((g) => <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />)}
              </View>
            </ThemedView>

            {/* Dependency status */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>DEPENDENCY STATUS</ThemedText>
              <View style={styles.chipRow}>
                <Chip label="Without Dependents" selected={depStatus === 'without'} onPress={() => setDepStatus('without')} />
                <Chip label="With Dependents"    selected={depStatus === 'with'}    onPress={() => setDepStatus('with')} />
              </View>
            </ThemedView>

            {/* Eligibility result */}
            <View style={[styles.eligCard, { borderLeftColor: eligibility.color }]}>
              <ThemedText style={[styles.eligStatus, { color: eligibility.color }]}>{eligibility.summary}</ThemedText>
              {eligibility.details.map((d, i) => (
                <View key={i} style={styles.eligDetailRow}>
                  <ThemedText style={[styles.eligBullet, { color: eligibility.color }]}>▸</ThemedText>
                  <ThemedText style={styles.eligDetail}>{d}</ThemedText>
                </View>
              ))}
            </View>

            {/* Duty Station / MHA — search-based */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>DUTY STATION / MHA</ThemedText>
              <ThemedText style={styles.cardHint}>
                Search by ZIP code, city, installation name, or "USCG" for Coast Guard bases.
              </ThemedText>
              <View style={[styles.searchWrap, { backgroundColor: inputBg }]}>
                <ThemedText style={styles.searchIcon}>🔍</ThemedText>
                <TextInput
                  value={mhaSearch}
                  onChangeText={setMhaSearch}
                  placeholder="e.g. 28301  ·  Fort Liberty  ·  Norfolk  ·  USCG"
                  placeholderTextColor="#3D6080"
                  style={[styles.searchInput, { color: inputText }]}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {mhaSearch.length > 0 && (
                  <Pressable onPress={() => setMhaSearch('')} style={styles.searchClear}>
                    <ThemedText style={styles.searchClearText}>✕</ThemedText>
                  </Pressable>
                )}
              </View>

              {/* Currently selected */}
              {selectedMha && (
                <View style={styles.selectedRow}>
                  <ThemedText style={styles.selectedLabel}>SELECTED:</ThemedText>
                  <ThemedText style={styles.selectedValue}>{selectedMha.label}</ThemedText>
                  {selectedMha.branch && (
                    <View style={styles.cgBadge}>
                      <ThemedText style={styles.cgBadgeText}>{selectedMha.branch}</ThemedText>
                    </View>
                  )}
                </View>
              )}

              {/* Filtered list */}
              <View style={styles.mhaList}>
                {filteredMha.slice(0, 30).map((m) => {
                  const isSelected = m.zip === zip;
                  return (
                    <Pressable
                      key={m.zip + m.label}
                      onPress={() => { setZip(m.zip); setMhaSearch(''); }}
                      style={({ pressed }) => [
                        styles.mhaRow,
                        isSelected && styles.mhaRowSelected,
                        pressed && { opacity: 0.7 },
                      ]}>
                      <View style={styles.mhaRowLeft}>
                        <ThemedText style={[styles.mhaLabel, isSelected && { color: Brand.tactical }]}>
                          {m.label}
                        </ThemedText>
                        <ThemedText style={styles.mhaZip}>{m.zip}</ThemedText>
                      </View>
                      {m.branch && (
                        <View style={styles.cgBadge}>
                          <ThemedText style={styles.cgBadgeText}>{m.branch}</ThemedText>
                        </View>
                      )}
                      {isSelected && <ThemedText style={styles.mhaCheck}>✓</ThemedText>}
                    </Pressable>
                  );
                })}
                {filteredMha.length === 0 && (
                  <ThemedText style={styles.mhaEmpty}>No installations match your search. Try a different ZIP or name.</ThemedText>
                )}
                {filteredMha.length > 30 && (
                  <ThemedText style={styles.mhaMore}>+{filteredMha.length - 30} more — refine your search to narrow results.</ThemedText>
                )}
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
                  <ThemedText style={styles.rateHeroSub}>/month · non-taxable</ThemedText>
                </View>
              </ThemedView>
            )}

            {/* Full rate table */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>RATE REFERENCE TABLE — {selectedMha?.label ?? zip}</ThemedText>
              <RateTable zip={zip} />
            </ThemedView>

            {/* How BAH works */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>HOW BAH WORKS</ThemedText>
              {[
                { q: 'What is BAH?', a: 'Basic Allowance for Housing is a non-taxable monthly allowance designed to partially offset housing costs in the local market near your duty station.' },
                { q: 'How is the rate set?', a: 'DoD surveys rental prices annually for each Military Housing Area (MHA). Rates are set to cover approximately 95% of the local median rental cost for your grade.' },
                { q: 'Does it count as income?', a: 'No. BAH is non-taxable and not counted as gross income for federal tax purposes.' },
                { q: 'What if I live in government housing?', a: 'If you voluntarily move into on-post housing, your BAH is often offset dollar-for-dollar against rent charged by the housing office. You keep any difference.' },
                { q: 'Do I keep it if I rent under the rate?', a: 'Yes. If your actual rent is lower than your BAH rate, you keep the difference — known as BAH arbitrage.' },
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
                'Roommate tactic: Two E5s share a 2BR apartment. Each pays $700/mo — both pocket $500+/mo.',
                'Drive the market: Off-post apartments near cheaper installations let you pocket $300–$600+/mo.',
                'Always negotiate rent below your BAH rate. Landlords near bases often price to BAH — push back.',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <ThemedText style={styles.tipBullet}>▸</ThemedText>
                  <ThemedText style={styles.tipText}>{tip}</ThemedText>
                </View>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.disclaimer}>
              <ThemedText style={styles.disclaimerText}>
                Rates are FY2026 DoD BAH tables. Actual entitlement is determined by official orders and housing office. O7–O10 rates are capped at O6 per DoD policy.
              </ThemedText>
            </ThemedView>
          </>
        )}

        {/* ══════════════  OHA TAB  ══════════════ */}
        {tab === 'oha' && (
          <>
            <ThemedView type="backgroundElement" style={styles.heroBanner}>
              <ThemedText style={styles.heroEyebrow}>OVERSEAS HOUSING ALLOWANCE</ThemedText>
              <ThemedText style={styles.heroTitle}>OHA — OCONUS Housing</ThemedText>
              <ThemedText style={styles.heroBody}>
                OHA replaces BAH for service members stationed overseas. It covers actual rent paid (up to a ceiling rate) plus Move-In Housing Allowance (MIHA) for initial setup costs.
              </ThemedText>
            </ThemedView>

            {/* OHA key rules */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>HOW OHA WORKS</ThemedText>
              {[
                { q: 'What does OHA cover?', a: 'OHA covers your actual monthly rent up to the applicable OHA ceiling rate for your grade and location. Utilities may be covered separately through a Utility/Recurring Maintenance Allowance (URMA).' },
                { q: 'How is my ceiling set?', a: 'DTMO (Defense Travel Management Office) surveys the local rental market for each OCONUS area and sets ceiling rates by grade. Rates are updated quarterly. Higher grades receive higher ceilings.' },
                { q: 'What is MIHA?', a: 'Move-In Housing Allowance covers one-time setup costs: appliance rental, key money, agent fees, and minor repairs. It is paid upon move-in/move-out.' },
                { q: 'What if my rent exceeds the ceiling?', a: 'You pay the difference out of pocket. Always try to find housing at or below your OHA ceiling. Your housing office can help identify suitable properties.' },
                { q: 'Does OHA vary with exchange rates?', a: 'Yes. OHA is set in USD but local rents are in foreign currency. DTMO adjusts rates when significant exchange rate changes occur.' },
                { q: 'Do I still get BAH if overseas?', a: 'No. OCONUS service members receive OHA instead of BAH. You cannot receive both simultaneously unless in a split-family situation with specific orders.' },
                { q: 'Where do I find my exact OHA rate?', a: 'Use the official DTMO OHA calculator at dtmo.mil. Enter your grade, location, and family status to see your specific ceiling and MIHA amount.' },
              ].map((item, i) => (
                <View key={i} style={styles.faqItem}>
                  <ThemedText style={styles.faqQ}>{item.q}</ThemedText>
                  <ThemedText style={styles.faqA}>{item.a}</ThemedText>
                </View>
              ))}
            </ThemedView>

            {/* OCONUS Location search */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>OCONUS LOCATION / INSTALLATION</ThemedText>
              <ThemedText style={styles.cardHint}>
                Search by city, country, or installation name to find your area.
              </ThemedText>
              <View style={[styles.searchWrap, { backgroundColor: inputBg }]}>
                <ThemedText style={styles.searchIcon}>🔍</ThemedText>
                <TextInput
                  value={ohaSearch}
                  onChangeText={setOhaSearch}
                  placeholder="e.g. Japan  ·  Ramstein  ·  Germany  ·  Okinawa"
                  placeholderTextColor="#3D6080"
                  style={[styles.searchInput, { color: inputText }]}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {ohaSearch.length > 0 && (
                  <Pressable onPress={() => setOhaSearch('')} style={styles.searchClear}>
                    <ThemedText style={styles.searchClearText}>✕</ThemedText>
                  </Pressable>
                )}
              </View>

              <View style={styles.ohaList}>
                {filteredOha.map((loc, i) => (
                  <View key={i} style={styles.ohaRow}>
                    <View style={styles.ohaRowTop}>
                      <ThemedText style={styles.ohaLabel}>{loc.label}</ThemedText>
                      <View style={styles.countryBadge}>
                        <ThemedText style={styles.countryBadgeText}>{loc.country}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.ohaNote}>{loc.note}</ThemedText>
                  </View>
                ))}
                {filteredOha.length === 0 && (
                  <ThemedText style={styles.mhaEmpty}>No OCONUS locations match. Try a country name or city.</ThemedText>
                )}
              </View>
            </ThemedView>

            {/* OHA rate reference note */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>FINDING YOUR EXACT OHA RATE</ThemedText>
              <View style={styles.ohaRateBox}>
                <ThemedText style={styles.ohaRateTitle}>🌐 DTMO OHA Calculator</ThemedText>
                <ThemedText style={styles.ohaRateBody}>
                  Exact OHA ceiling rates change quarterly based on DTMO surveys. To find your current OHA rate:
                </ThemedText>
                {[
                  'Visit dtmo.mil → OHA Rates',
                  'Select your OCONUS location/country',
                  'Enter your pay grade and dependency status',
                  'Your ceiling rate and MIHA amounts are displayed',
                  'Your housing office can also print your official OHA entitlement',
                ].map((step, i) => (
                  <View key={i} style={styles.tipRow}>
                    <ThemedText style={[styles.tipBullet, { color: Brand.tactical }]}>{i + 1}.</ThemedText>
                    <ThemedText style={styles.tipText}>{step}</ThemedText>
                  </View>
                ))}
              </View>
            </ThemedView>

            {/* OHA grade tiers callout */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>OHA GRADE TIERS (GENERAL)</ThemedText>
              <ThemedText style={styles.ohaRateBody}>
                OHA ceilings scale with pay grade. Higher grades receive higher ceilings reflecting larger housing needs and OCONUS rank expectations. As a rule of thumb:
              </ThemedText>
              {[
                'E1–E4: Entry-level ceiling. Often on-post quarters recommended.',
                'E5–E9: Mid-grade ceiling. Off-post housing widely available.',
                'W1–W5: Warrant officer tier. Similar to O1–O3 ceilings.',
                'O1–O3: Junior officer ceiling. Adequate for most local markets.',
                'O4–O6: Senior officer ceiling. Allows more housing options.',
                'O7+: Flag/General officer ceiling. Highest OHA entitlement.',
              ].map((line, i) => (
                <View key={i} style={styles.tipRow}>
                  <ThemedText style={styles.tipBullet}>▸</ThemedText>
                  <ThemedText style={styles.tipText}>{line}</ThemedText>
                </View>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.disclaimer}>
              <ThemedText style={styles.disclaimerText}>
                OHA rates are set by DTMO and updated quarterly. Rates shown here are informational only — verify your exact entitlement at dtmo.mil or through your installation housing office.
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

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
    marginHorizontal: Spacing.three,
    gap: 0,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Brand.tactical },
  tabBtnText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: '#4D7A9A' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.two },

  heroBanner: { borderRadius: 4, padding: Spacing.three, borderLeftWidth: 3, borderLeftColor: Brand.primary, gap: 4 },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.primary },
  heroTitle:   { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody:    { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  card:      { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  cardHint:  { fontSize: 11, color: '#4D7A9A', lineHeight: 16 },
  groupLabel:{ fontSize: 8, fontWeight: '700', letterSpacing: 0.8, color: '#3D6080' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3,
    borderWidth: 1, borderColor: Brand.border, backgroundColor: '#04080F',
  },
  chipSelected: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  chipTextSelected: { color: Brand.tactical },

  eligCard: {
    backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border,
    borderLeftWidth: 4, borderRadius: 4, padding: Spacing.three, gap: Spacing.one,
  },
  eligStatus: { fontSize: 12, fontWeight: '800', lineHeight: 18 },
  eligDetailRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 4 },
  eligBullet: { fontSize: 10, marginTop: 2 },
  eligDetail: { flex: 1, fontSize: 11, lineHeight: 17, color: '#8AA8C0' },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  searchIcon:  { fontSize: 14 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: Spacing.two + 2 },
  searchClear: { padding: 4 },
  searchClearText: { fontSize: 12, color: '#4D7A9A', fontWeight: '700' },

  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  selectedLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#3D6080' },
  selectedValue: { fontSize: 11, fontWeight: '700', color: Brand.tactical, flex: 1 },

  mhaList: { gap: 0 },
  mhaRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0D1E30',
  },
  mhaRowSelected: { backgroundColor: Brand.tactical + '10' },
  mhaRowLeft: { flex: 1, gap: 2 },
  mhaLabel: { fontSize: 12, fontWeight: '600', color: '#8AA8C0' },
  mhaZip:   { fontSize: 10, color: '#3D6080', fontFamily: 'monospace' },
  mhaCheck: { fontSize: 14, color: Brand.tactical, fontWeight: '800', width: 18, textAlign: 'center' },
  mhaEmpty: { fontSize: 12, color: '#4D7A9A', textAlign: 'center', paddingVertical: Spacing.two },
  mhaMore:  { fontSize: 10, color: '#3D6080', textAlign: 'center', paddingTop: Spacing.one },

  cgBadge: { backgroundColor: '#005C9920', borderWidth: 1, borderColor: '#005C99', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  cgBadgeText: { fontSize: 8, fontWeight: '800', color: '#00A0D0', letterSpacing: 0.5 },

  rateHero: { alignItems: 'center', gap: 4 },
  rateHeroLabel: { fontSize: 11, color: '#4D7A9A', fontWeight: '700' },
  rateHeroValue: { fontSize: 26, fontWeight: '900', color: Brand.accent, fontFamily: 'Courier New' },
  rateHeroSub:   { fontSize: 12, color: '#4D7A9A' },

  rateTable: { gap: 4 },
  rateTableHeader: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border, paddingBottom: 4 },
  rateTableCol:    { flex: 1, fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  rateTableRow:    { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#0D1E30' },
  rateTableGrade:  { flex: 1, fontSize: 11, fontWeight: '700', color: '#8AA8C0' },
  rateTableValue:  { flex: 1, fontSize: 12, fontWeight: '700', fontFamily: 'Courier New' },

  faqItem: { gap: 4, paddingBottom: Spacing.one },
  faqQ: { fontSize: 12, fontWeight: '700', color: '#C8D8E8' },
  faqA: { fontSize: 11, lineHeight: 17, color: '#4D7A9A' },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.accent, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#4D7A9A' },

  // OHA styles
  ohaList: { gap: Spacing.two },
  ohaRow: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: Brand.border,
    borderRadius: 4, padding: Spacing.two, gap: 4,
  },
  ohaRowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, flexWrap: 'wrap' },
  ohaLabel:  { fontSize: 12, fontWeight: '700', color: '#C8D8E8', flex: 1 },
  ohaNote:   { fontSize: 11, color: '#4D7A9A', lineHeight: 16 },
  countryBadge: { backgroundColor: Brand.accent + '15', borderWidth: 1, borderColor: Brand.accent + '40', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  countryBadgeText: { fontSize: 8, fontWeight: '800', color: Brand.accent, letterSpacing: 0.3 },
  ohaRateBox: { gap: Spacing.two },
  ohaRateTitle: { fontSize: 14, fontWeight: '800', color: Brand.tactical },
  ohaRateBody:  { fontSize: 12, lineHeight: 18, color: '#4D7A9A' },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, color: '#3D6080', textAlign: 'center' },
});
