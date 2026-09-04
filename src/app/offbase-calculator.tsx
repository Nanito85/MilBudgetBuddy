import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { BAH_PARTIAL, getBahRate, hasBahData, PayGrade } from '@/data/bah-rates';
import { Installation, getInstallationByZip, searchInstallations } from '@/data/installations';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';

// ── Grade groups ───────────────────────────────────────────────────────────────

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT: PayGrade[]  = ['W1','W2','W3','W4','W5'];
const OFFICER: PayGrade[]  = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];

// E1-E3 are typically required to live in barracks; E4 is case-by-case
const BARRACKS_REQUIRED: PayGrade[] = ['E1','E2','E3'];
const BARRACKS_LIKELY: PayGrade[] = ['E4'];

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

export default function OffbaseCalculatorScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const tc = useThemeColors();

  function Chip({
    label, selected, onPress,
  }: { label: string; selected: boolean; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={[styles.chip, { backgroundColor: tc.background, borderColor: tc.borderColor }, selected && styles.chipSelected]}>
        <ThemedText style={[styles.chipText, { color: tc.textHint }, selected && styles.chipTextSelected]}>
          {label}
        </ThemedText>
      </Pressable>
    );
  }

  function Row({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
    return (
      <View style={styles.dataRow}>
        <ThemedText style={[styles.dataLabel, { color: tc.textHint }]}>{label}</ThemedText>
        <ThemedText style={[styles.dataValue, { color: tc.textSecondary }, bold && { fontWeight: '700', color: color ?? tc.textPrimary }]}>
          {value}
        </ThemedText>
      </View>
    );
  }

  const storedGrade = useUserStore((s) => s.payGrade);
  const storedZip   = useUserStore((s) => s.mhaZip);

  const [grade,    setGrade]    = useState<PayGrade>(storedGrade ?? 'E4');
  const [zip,      setZip]      = useState(storedZip ?? '');
  const [locSearch, setLocSearch] = useState('');
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(
    () => getInstallationByZip(storedZip)
  );
  const [rent,     setRent]     = useState(1200);
  const [utils,    setUtils]    = useState(150);
  const [commute,  setCommute]  = useState(100);
  const [setup,    setSetup]    = useState(2000);

  const searchResults = useMemo(
    () => searchInstallations(locSearch).filter(i => !i.oconus && i.mhaZip && hasBahData(i.mhaZip)).slice(0, 20),
    [locSearch],
  );
  const hasSearch = locSearch.trim().length > 0;

  const bah = useMemo(() => (zip ? getBahRate(zip, grade, false) ?? 0 : 0), [zip, grade]);

  const offbaseMonthlyCost = rent + utils + commute;
  const offbaseNet = bah - offbaseMonthlyCost;
  // Barracks residents (no dependents, government single-type quarters) receive
  // Partial BAH only — a flat $50.10/mo, not the full off-base rate — per JTR.
  const barracksBah = BAH_PARTIAL;
  const breakEvenMonths = offbaseNet > 0 ? Math.ceil(setup / offbaseNet) : null;

  const isRequired = BARRACKS_REQUIRED.includes(grade);
  const isLikely   = BARRACKS_LIKELY.includes(grade);

  const gradeGroup = ENLISTED.includes(grade) ? 'Enlisted'
    : WARRANT.includes(grade) ? 'Warrant' : 'Officer';

  function Stepper({ label, value, step, min, max, onChange }: {
    label: string; value: number; step: number; min: number; max: number;
    onChange: (v: number) => void;
  }) {
    return (
      <View style={styles.stepperRow}>
        <ThemedText style={[styles.stepperLabel, { color: tc.textSecondary }]}>{label}</ThemedText>
        <View style={styles.stepperControls}>
          <Pressable style={[styles.stepBtn, { backgroundColor: tc.background, borderColor: tc.borderColor }]} onPress={() => onChange(Math.max(min, value - step))}>
            <ThemedText style={styles.stepBtnText}>−</ThemedText>
          </Pressable>
          <ThemedText style={[styles.stepperValue, { color: tc.textPrimary }]}>{fmt(value)}</ThemedText>
          <Pressable style={[styles.stepBtn, { backgroundColor: tc.background, borderColor: tc.borderColor }]} onPress={() => onChange(Math.min(max, value + step))}>
            <ThemedText style={styles.stepBtnText}>+</ThemedText>
          </Pressable>
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
        <ThemedText style={styles.title}>Off-Base vs Barracks</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>SINGLE SERVICE MEMBER</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>Housing Decision Tool</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
            Compare real off-base costs against your BAH entitlement to find your break-even and monthly net.
          </ThemedText>
        </ThemedView>

        {/* Grade picker */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>PAY GRADE</ThemedText>
          <ThemedText style={[styles.groupLabel, { color: tc.textMuted }]}>ENLISTED</ThemedText>
          <View style={styles.chipRow}>
            {ENLISTED.map((g) => (
              <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
          <ThemedText style={[styles.groupLabel, { color: tc.textMuted, marginTop: Spacing.two }]}>WARRANT</ThemedText>
          <View style={styles.chipRow}>
            {WARRANT.map((g) => (
              <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
          <ThemedText style={[styles.groupLabel, { color: tc.textMuted, marginTop: Spacing.two }]}>OFFICER</ThemedText>
          <View style={styles.chipRow}>
            {OFFICER.map((g) => (
              <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} />
            ))}
          </View>
        </ThemedView>

        {/* MHA search */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>DUTY STATION</ThemedText>
          <ThemedText style={[styles.groupLabel, { color: tc.textMuted }]}>Type your installation, city, state, or ZIP code</ThemedText>
          <View style={[styles.searchWrap, { backgroundColor: tc.inputBg, borderColor: tc.borderColor }]}>
            <ThemedText style={{ fontSize: 14 }}>🔍</ThemedText>
            <TextInput
              value={locSearch}
              onChangeText={setLocSearch}
              placeholder="Fort Liberty · Norfolk · San Diego · 28301"
              placeholderTextColor={tc.textMuted}
              style={[styles.searchInput, { color: tc.textPrimary }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {locSearch.length > 0 && (
              <Pressable onPress={() => setLocSearch('')} style={{ padding: 4 }}>
                <ThemedText style={{ fontSize: 12, color: tc.textHint, fontWeight: '700' }}>✕</ThemedText>
              </Pressable>
            )}
          </View>

          {hasSearch && (
            <View style={[styles.resultsList, { borderColor: tc.borderColor }]}>
              {searchResults.length === 0 && (
                <ThemedText style={[styles.resultsEmpty, { color: tc.textHint }]}>No locations match — try the installation name or city.</ThemedText>
              )}
              {searchResults.map((inst) => (
                <Pressable
                  key={inst.id}
                  onPress={() => { setZip(inst.mhaZip); setSelectedInstallation(inst); setLocSearch(''); }}
                  style={({ pressed }) => [styles.resultRow, { borderBottomColor: tc.borderColor, backgroundColor: tc.surface }, pressed && { opacity: 0.7 }]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.resultLabel, { color: tc.textPrimary }]}>{inst.name}</ThemedText>
                    <ThemedText style={[styles.resultSub, { color: tc.textMuted }]}>{inst.city}, {inst.state} · {inst.branch}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {!hasSearch && selectedInstallation && (
            <View style={styles.selectedCard}>
              <ThemedText style={styles.selectedCardLabel}>SELECTED LOCATION</ThemedText>
              <ThemedText style={[styles.selectedCardName, { color: tc.textPrimary }]}>{selectedInstallation.name}</ThemedText>
              <ThemedText style={[styles.selectedCardSub, { color: tc.textHint }]}>{selectedInstallation.city}, {selectedInstallation.state} · {selectedInstallation.branch}</ThemedText>
              <Pressable onPress={() => { setZip(''); setSelectedInstallation(null); }} style={[styles.changeBtn, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
                <ThemedText style={[styles.changeBtnText, { color: tc.textHint }]}>Change Location</ThemedText>
              </Pressable>
            </View>
          )}

          {!hasSearch && !selectedInstallation && (
            <ThemedText style={[styles.resultsEmpty, { color: tc.textHint }]}>Search for your duty station to see your BAH rate.</ThemedText>
          )}
        </ThemedView>

        {/* BAH display */}
        <ThemedView type="backgroundElement" style={[styles.card, styles.bahCard]}>
          <View>
            <ThemedText style={[styles.bahLabel, { color: tc.textHint }]}>YOUR BAH (WITHOUT DEPENDENTS)</ThemedText>
            <ThemedText style={styles.bahAmount}>{fmt(bah)}<ThemedText style={[styles.bahUnit, { color: tc.textHint }]}>/mo</ThemedText></ThemedText>
          </View>
          {isRequired && (
            <View style={[styles.eligBadge, { backgroundColor: Brand.danger + '20', borderColor: Brand.danger }]}>
              <ThemedText style={[styles.eligText, { color: Brand.danger }]}>
                ⚠ E1–E3 typically required to live in barracks
              </ThemedText>
            </View>
          )}
          {isLikely && !isRequired && (
            <View style={[styles.eligBadge, { backgroundColor: Brand.warning + '15', borderColor: Brand.warning }]}>
              <ThemedText style={[styles.eligText, { color: Brand.warning }]}>
                E4 may be required in barracks — get a BAH waiver from your commander
              </ThemedText>
            </View>
          )}
          {!isRequired && !isLikely && (
            <View style={[styles.eligBadge, { backgroundColor: Brand.success + '15', borderColor: Brand.success }]}>
              <ThemedText style={[styles.eligText, { color: Brand.success }]}>
                {gradeGroup} {grade} is eligible to live off-base and collect BAH
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Off-base costs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>MONTHLY OFF-BASE COSTS</ThemedText>
          <Stepper label="Rent" value={rent} step={50} min={0} max={5000} onChange={setRent} />
          <Stepper label="Utilities (elec/gas/internet)" value={utils} step={25} min={0} max={1000} onChange={setUtils} />
          <Stepper label="Commute / gas / tolls" value={commute} step={25} min={0} max={500} onChange={setCommute} />
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Row label="Total monthly cost" value={fmt(offbaseMonthlyCost)} bold color={tc.textPrimary} />
        </ThemedView>

        {/* Setup costs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>ONE-TIME SETUP COSTS</ThemedText>
          <Stepper label="Deposit + first/last month" value={setup} step={500} min={0} max={10000} onChange={setSetup} />
        </ThemedView>

        {/* Results */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>RESULTS</ThemedText>

          <View style={styles.resultGrid}>
            <View style={[styles.resultBox, { backgroundColor: tc.background, borderColor: offbaseNet >= 0 ? Brand.success : Brand.danger }]}>
              <ThemedText style={[styles.resultBoxLabel, { color: tc.textHint }]}>MONTHLY NET</ThemedText>
              <ThemedText style={[styles.resultBoxValue, { color: offbaseNet >= 0 ? Brand.success : Brand.danger }]}>
                {offbaseNet >= 0 ? '+' : ''}{fmt(offbaseNet)}
              </ThemedText>
              <ThemedText style={[styles.resultBoxSub, { color: tc.textMuted }]}>BAH minus your costs</ThemedText>
            </View>
            <View style={[styles.resultBox, { backgroundColor: tc.background, borderColor: Brand.accent }]}>
              <ThemedText style={[styles.resultBoxLabel, { color: tc.textHint }]}>BARRACKS BAH</ThemedText>
              <ThemedText style={[styles.resultBoxValue, { color: Brand.accent }]}>{fmt(barracksBah)}</ThemedText>
              <ThemedText style={[styles.resultBoxSub, { color: tc.textMuted }]}>
                Partial BAH only — flat rate, no rent to pay
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <Row label="Monthly rent + utils + commute" value={fmt(offbaseMonthlyCost)} />
          <Row label="Off-base BAH (full, no dependents)" value={fmt(bah)} />
          <Row
            label="Monthly net (BAH − costs)"
            value={`${offbaseNet >= 0 ? '+' : ''}${fmt(offbaseNet)}`}
            bold
            color={offbaseNet >= 0 ? Brand.success : Brand.danger}
          />
          <Row label="Barracks BAH (Partial, flat rate)" value={fmt(barracksBah)} />
          <Row
            label="Break-even on setup costs"
            value={breakEvenMonths !== null ? `${breakEvenMonths} months` : 'N/A (costs exceed BAH)'}
          />

          {offbaseNet < 0 && (
            <View style={[styles.warningBox, { borderLeftColor: Brand.danger }]}>
              <ThemedText style={[styles.warningText, { color: tc.textSecondary }]}>
                Your off-base costs exceed your BAH by {fmt(Math.abs(offbaseNet))}/mo. You will be paying out-of-pocket each month.
              </ThemedText>
            </View>
          )}
          {offbaseNet >= 0 && breakEvenMonths !== null && breakEvenMonths <= 6 && (
            <View style={[styles.warningBox, { borderLeftColor: Brand.success }]}>
              <ThemedText style={[styles.warningText, { color: Brand.success }]}>
                You break even on setup costs in {breakEvenMonths} months — off-base is a solid financial move.
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* Tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>HOUSING TIPS FOR SINGLE SMs</ThemedText>
          {[
            `E1–E3 in the barracks receive Partial BAH only ($${BAH_PARTIAL.toFixed(2)}/mo flat) — not full BAH — unless you have dependents.`,
            'E4: Request a BAH waiver from your unit commander if housing is unavailable on-post.',
            'E5+: You are entitled to BAH without dependents. Move off-base to start building housing equity.',
            'Roommate strategy: Split a 2BR apartment with another SM — each gets full BAH, costs cut in half.',
            'Utility allowance: Your BAH "without dependents" rate factors in average utility costs. Undercut utilities to pocket more.',
            'Renter\'s insurance: ~$15/mo — worth it. Barracks theft is not automatically covered by the military.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={[styles.tipText, { color: tc.textHint }]}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
            BAH rates are FY2026 DoD figures. Actual BAH eligibility is determined by your command and official orders. This tool is for planning purposes only.
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.tactical,
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.tactical },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  groupLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
    borderWidth: 1,
  },
  chipSelected: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  chipText: { fontSize: 11, fontWeight: '700' },
  chipTextSelected: { color: Brand.tactical },

  bahCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.two },
  bahLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  bahAmount: { fontSize: 26, fontWeight: '900', color: Brand.accent, fontFamily: 'Courier New', lineHeight: 30 },
  bahUnit: { fontSize: 13, fontWeight: '600' },
  eligBadge: { borderWidth: 1, borderRadius: 4, padding: Spacing.two, flex: 1, minWidth: 180 },
  eligText: { fontSize: 10, lineHeight: 15 },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '300', color: Brand.tactical },
  stepperValue: { fontSize: 13, fontWeight: '700', width: 80, textAlign: 'center', fontFamily: 'Courier New' },

  divider: { height: StyleSheet.hairlineWidth },

  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataLabel: { fontSize: 12, flex: 1 },
  dataValue: { fontSize: 13, fontFamily: 'Courier New' },

  resultGrid: { flexDirection: 'row', gap: Spacing.two },
  resultBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    padding: Spacing.two,
    alignItems: 'center',
    gap: 4,
  },
  resultBoxLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  resultBoxValue: { fontSize: 22, fontWeight: '900', fontFamily: 'Courier New' },
  resultBoxSub: { fontSize: 9, textAlign: 'center' },

  warningBox: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.two,
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
  warningText: { fontSize: 12, lineHeight: 17 },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.tactical, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: Spacing.two, gap: Spacing.one,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: Spacing.two + 2 },

  resultsList: { borderWidth: 1, borderRadius: 4, overflow: 'hidden' },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultLabel: { fontSize: 12, fontWeight: '600' },
  resultSub:   { fontSize: 10, fontFamily: 'monospace', marginTop: 1 },
  resultsEmpty:{ fontSize: 12, textAlign: 'center', padding: Spacing.two },

  selectedCard: {
    borderWidth: 1, borderColor: Brand.tactical + '50', borderRadius: 4,
    padding: Spacing.two, backgroundColor: Brand.tactical + '08', gap: 4,
  },
  selectedCardLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: Brand.tactical },
  selectedCardName:  { fontSize: 13, fontWeight: '700' },
  selectedCardSub:   { fontSize: 10, fontFamily: 'monospace' },
  changeBtn:     { alignSelf: 'flex-start', marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3, borderWidth: 1 },
  changeBtnText: { fontSize: 10, fontWeight: '700' },
});
