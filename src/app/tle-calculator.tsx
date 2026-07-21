import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchRegNote } from '@/components/BranchRegNote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Locality, PER_DIEM_DATA_YEAR, STANDARD_LODGING, STANDARD_MEALS, STANDARD_TOTAL } from '@/data/per-diem-rates';
import { FamilyComposer } from '@/features/tle/components/FamilyComposer';
import { LocalityPicker } from '@/features/tle/components/LocalityPicker';
import {
  ADDITIONAL_DEPENDENT_12PLUS_PCT,
  ADDITIONAL_DEPENDENT_UNDER12_PCT,
  calcTLE,
  familyLabel,
  fmtMoney,
  fmtMoneyRound,
  MEMBER_ALONE_PCT,
  MoveMode,
  TLA_MAX_DAYS,
  TLE_DAILY_CAP,
  TLE_MAX_DAYS,
} from '@/features/tle/utils/tleCalc';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

export default function TLECalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [mode, setMode] = useState<MoveMode>('tle');
  const [locality, setLocality] = useState<Locality | null>(null);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRateText, setCustomRateText] = useState('');
  const [hasSpouse, setHasSpouse] = useState(false);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [days, setDays] = useState(mode === 'tle' ? 10 : 14);

  const maxDays = mode === 'tle' ? TLE_MAX_DAYS : TLA_MAX_DAYS;

  const effectivePerDiem: number | null = useCustomRate
    ? parseFloat(customRateText) || null
    : locality?.perDiem ?? null;

  // A custom flat rate has no real lodging/M&IE split, so approximate it using
  // the same standard CONUS ratio (~62% lodging / ~38% M&IE) shown as the
  // fallback elsewhere on this screen — a locality pick always has the real split.
  const effectiveLodging: number | null = useCustomRate
    ? (effectivePerDiem != null ? Math.round(effectivePerDiem * (STANDARD_LODGING / STANDARD_TOTAL)) : null)
    : locality?.lodging ?? null;
  const effectiveMeals: number | null = useCustomRate
    ? (effectivePerDiem != null ? Math.round(effectivePerDiem * (STANDARD_MEALS / STANDARD_TOTAL)) : null)
    : locality?.meals ?? null;

  const result = effectiveLodging != null && effectiveMeals != null
    ? calcTLE({ mode, lodging: effectiveLodging, meals: effectiveMeals, hasSpouse, childAges, days })
    : null;

  const numChildren = childAges.length;

  const handleModeChange = (newMode: MoveMode) => {
    setMode(newMode);
    setLocality(null);
    setUseCustomRate(false);
    setCustomRateText('');
    setDays(newMode === 'tle' ? 10 : 14);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <View style={styles.headerText}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            TOOLS
          </ThemedText>
          <ThemedText style={styles.title}>TLE / TLA Calculator</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── BLUF ───────────────────────────────────────────────────────────── */}
        <ThemedView type="backgroundElement" style={styles.blufBox}>
          <ThemedText style={styles.blufLabel}>BLUF</ThemedText>
          <ThemedText type="small" style={{ lineHeight: 18 }}>
            TLE (CONUS) and TLA (OCONUS) reimburse lodging and meals when you cannot move directly
            into permanent housing at your new duty station. Rates are a percentage of the locality
            per diem and scale with your family size.
          </ThemedText>
        </ThemedView>

        {/* ── MOVE TYPE ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            MOVE TYPE
          </ThemedText>
          <View style={styles.modeToggle}>
            {([['tle', '🏠  CONUS (TLE)', 'Up to 21 days'], ['tla', '✈️  OCONUS (TLA)', 'Up to 60 days']] as [MoveMode, string, string][]).map(
              ([val, label, sub]) => (
                <Pressable
                  key={val}
                  onPress={() => handleModeChange(val)}
                  style={[styles.modeBtn, mode === val && styles.modeBtnActive]}>
                  <ThemedText style={[styles.modeBtnLabel, mode === val && styles.modeBtnLabelActive]}>
                    {label}
                  </ThemedText>
                  <ThemedText style={[styles.modeBtnSub, mode === val && styles.modeBtnSubActive]}>
                    {sub}
                  </ThemedText>
                </Pressable>
              ),
            )}
          </View>
        </View>

        {/* ── LOCATION / PER DIEM ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            LOCALITY PER DIEM
          </ThemedText>

          {!useCustomRate ? (
            <>
              <LocalityPicker
                selected={locality}
                oconus={mode === 'tla'}
                onSelect={(loc) => {
                  setLocality(loc);
                  setUseCustomRate(false);
                }}
              />
              <Pressable onPress={() => { setLocality(null); setUseCustomRate(true); }}>
                <ThemedText style={styles.customRateLink}>
                  My location isn't listed — enter a custom rate
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <ThemedView type="backgroundElement" style={styles.customRateCard}>
              <View style={styles.customRateRow}>
                <ThemedText style={styles.dollarSign}>$</ThemedText>
                <TextInput
                  value={customRateText}
                  onChangeText={setCustomRateText}
                  placeholder="e.g. 185"
                  keyboardType="numeric"
                  placeholderTextColor={tc.textSecondary}
                  style={[styles.customRateInput, { color: tc.textPrimary, borderBottomColor: Brand.primary }]}
                />
                <ThemedText themeColor="textSecondary" style={styles.perDayLabel}>/day</ThemedText>
              </View>
              <Pressable
                onPress={() => { setUseCustomRate(false); setCustomRateText(''); }}
                style={styles.backToListBtn}>
                <ThemedText style={styles.customRateLink}>← Back to installation list</ThemedText>
              </Pressable>
              <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18, marginTop: Spacing.one }}>
                Find your rate at gsa.gov (CONUS) or defensetravel.dod.mil (OCONUS).
              </ThemedText>
            </ThemedView>
          )}
        </View>

        {/* ── YOUR FAMILY ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            YOUR FAMILY
          </ThemedText>
          <FamilyComposer
            hasSpouse={hasSpouse}
            childAges={childAges}
            onSpouseChange={setHasSpouse}
            onChildAgesChange={setChildAges}
          />

          {/* Rate factor summary */}
          {effectivePerDiem != null && result != null && (
            <ThemedView type="backgroundElement" style={styles.factorCard}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                DAILY RATE FACTOR (JTR)
              </ThemedText>
              {!hasSpouse && numChildren === 0 && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.primary }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    Member alone: {(MEMBER_ALONE_PCT * 100).toFixed(0)}% × ${effectivePerDiem}
                  </ThemedText>
                </View>
              )}
              {(hasSpouse || numChildren > 0) && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.primary }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    Member + first dependent: 100% × ${effectivePerDiem}
                  </ThemedText>
                </View>
              )}
              {result.children12Plus - (hasSpouse ? 0 : 1) > 0 && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.success }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    +{result.children12Plus - (hasSpouse ? 0 : 1)} additional dependent{result.children12Plus - (hasSpouse ? 0 : 1) > 1 ? 's' : ''} age 12+: {(ADDITIONAL_DEPENDENT_12PLUS_PCT * 100).toFixed(0)}% each
                  </ThemedText>
                </View>
              )}
              {result.childrenUnder12 - (hasSpouse || result.children12Plus > 0 ? 0 : 1) > 0 && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.warning }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    +{result.childrenUnder12 - (hasSpouse || result.children12Plus > 0 ? 0 : 1)} additional dependent{result.childrenUnder12 - (hasSpouse || result.children12Plus > 0 ? 0 : 1) > 1 ? 's' : ''} under 12: {(ADDITIONAL_DEPENDENT_UNDER12_PCT * 100).toFixed(0)}% each
                  </ThemedText>
                </View>
              )}
              <View style={styles.factorRow}>
                <View style={[styles.factorDot, { backgroundColor: Brand.accent }]} />
                <ThemedText type="small" style={[styles.factorText, { fontWeight: '700' }]}>
                  Total: {(result.familyPct * 100).toFixed(0)}% × ${effectivePerDiem} = {fmtMoney(result.dailyRaw)}/day
                  {result.capped ? ` (capped at $${TLE_DAILY_CAP}/day)` : ''}
                </ThemedText>
              </View>
            </ThemedView>
          )}
        </View>

        {/* ── DAYS ───────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              DAYS REQUESTED
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Max {maxDays} days
            </ThemedText>
          </View>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={[styles.cardPadded]}>
              <NumberStepper
                label={mode === 'tle' ? 'TLE days' : 'TLA days'}
                value={days}
                min={1}
                max={maxDays}
                onChange={setDays}
                unit="days"
              />
              {mode === 'tle' && (
                <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                  Up to 21 days total, split between your old station (before departure) and your
                  new station (after arrival) however your orders authorize. Combined daily
                  reimbursement is capped at ${TLE_DAILY_CAP}.
                </ThemedText>
              )}
              {mode === 'tla' && (
                <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                  Up to 60 days on arrival at your new OCONUS station (your commander may authorize
                  a different amount). Departure TLA is a separate allotment, typically up to 10
                  days — verify with your installation.
                </ThemedText>
              )}
            </View>
          </ThemedView>
        </View>

        {/* ── RESULTS ────────────────────────────────────────────────────────── */}
        {result != null && effectivePerDiem != null ? (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              ENTITLEMENT ESTIMATE
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.resultsCard}>
              {/* Big totals */}
              <View style={styles.bigRow}>
                <View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                    {mode === 'tle' ? 'TLE' : 'TLA'} TOTAL ({result.days} days)
                  </ThemedText>
                  <ThemedText style={[styles.bigValue, { color: Brand.primary }]}>
                    {fmtMoneyRound(result.totalEntitlement)}
                  </ThemedText>
                </View>
                <View style={styles.dailyBlock}>
                  <ThemedText type="small" themeColor="textSecondary" style={[styles.fieldLabel, styles.textRight]}>
                    DAILY RATE
                  </ThemedText>
                  <ThemedText style={[styles.dailyValue, { color: Brand.accent }]}>
                    {fmtMoney(result.dailyTotal)}/day
                  </ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Daily rate breakdown — lodging and M&IE calculated separately */}
              <View style={styles.phaseSection}>
                <ThemedText style={styles.phaseTitle}>
                  {mode === 'tle' ? 'TLE' : 'TLA'} — {result.days} day{result.days !== 1 ? 's' : ''} @ {(result.familyPct * 100).toFixed(0)}% of locality rates
                </ThemedText>
                <BreakdownRow
                  label={`Lodging: ${(result.familyPct * 100).toFixed(0)}% × $${effectiveLodging}/night`}
                  value={fmtMoney(result.lodgingRaw)}
                  color={Brand.accent}
                />
                <BreakdownRow
                  label={`M&IE: ${(result.familyPct * 100).toFixed(0)}% × $${effectiveMeals}/day`}
                  value={fmtMoney(result.mieRaw)}
                  color={Brand.success}
                />
                <BreakdownRow
                  label="Combined daily rate"
                  value={fmtMoney(result.dailyRaw)}
                  color={Brand.primary}
                />
                {result.capped && (
                  <>
                    <BreakdownRow
                      label={`Capped at $${TLE_DAILY_CAP}/day combined`}
                      value={fmtMoney(result.dailyTotal)}
                      color={Brand.warning}
                    />
                    <BreakdownRow label="↳ Lodging portion, after cap" value={fmtMoney(result.lodgingPaid)} />
                    <BreakdownRow label="↳ M&IE portion, after cap" value={fmtMoney(result.miePaid)} />
                  </>
                )}
                <BreakdownRow
                  label={`Subtotal × ${result.days} days`}
                  value={fmtMoneyRound(result.dailyTotal * result.days)}
                  bold
                />
              </View>

              <View style={styles.totalDivider} />

              {/* Grand total */}
              <View style={styles.grandTotalRow}>
                <ThemedText style={styles.grandTotalLabel}>
                  Total {mode === 'tle' ? 'TLE' : 'TLA'} entitlement
                </ThemedText>
                <ThemedText style={[styles.grandTotalValue, { color: Brand.primary }]}>
                  {fmtMoneyRound(result.totalEntitlement)}
                </ThemedText>
              </View>

              {/* Family & locality summary */}
              <View style={[styles.summaryBox, { backgroundColor: `${Brand.primary}10` }]}>
                <ThemedText type="small" style={{ color: Brand.primaryLight, lineHeight: 18 }}>
                  Family: {familyLabel(hasSpouse, childAges)}
                  {'\n'}
                  Locality: {locality ? locality.name : 'Custom rate'}
                </ThemedText>
              </View>

              {/* Per diem breakdown — the input rates lodging/M&IE above are calculated from */}
              <View style={styles.pdBreakdownCard}>
                <ThemedText style={[styles.pdBreakdownLabel, { color: tc.textHint }]}>LOCALITY RATES (100% — BEFORE FAMILY %)</ThemedText>
                <View style={styles.pdBreakdownRow}>
                  <View style={styles.pdBreakdownItem}>
                    <ThemedText style={[styles.pdBreakdownItemLabel, { color: tc.textHint }]}>HOTEL CAP</ThemedText>
                    <ThemedText style={[styles.pdBreakdownValue, { color: Brand.accent }]}>
                      ${effectiveLodging}/night
                    </ThemedText>
                    <ThemedText style={[styles.pdBreakdownNote, { color: tc.textHint }]}>max lodging rate</ThemedText>
                  </View>
                  <View style={styles.pdBreakdownDivider} />
                  <View style={styles.pdBreakdownItem}>
                    <ThemedText style={[styles.pdBreakdownItemLabel, { color: tc.textHint }]}>M&IE</ThemedText>
                    <ThemedText style={[styles.pdBreakdownValue, { color: Brand.success }]}>
                      ${effectiveMeals}/day
                    </ThemedText>
                    <ThemedText style={[styles.pdBreakdownNote, { color: tc.textHint }]}>meals &amp; incidentals</ThemedText>
                  </View>
                  <View style={styles.pdBreakdownDivider} />
                  <View style={styles.pdBreakdownItem}>
                    <ThemedText style={[styles.pdBreakdownItemLabel, { color: tc.textHint }]}>TOTAL</ThemedText>
                    <ThemedText style={[styles.pdBreakdownValue, { color: Brand.primary }]}>
                      ${effectivePerDiem}/day
                    </ThemedText>
                    <ThemedText style={[styles.pdBreakdownNote, { color: tc.textHint }]}>full per diem</ThemedText>
                  </View>
                </View>
              </View>
            </ThemedView>
          </View>
        ) : (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🏨</ThemedText>
            <ThemedText style={styles.emptyTitle}>Select a location above</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
              Choose your gaining duty station location or enter a custom per diem rate to see your
              {mode === 'tle' ? ' TLE' : ' TLA'} entitlement.
            </ThemedText>
          </ThemedView>
        )}

        {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          Per diem rates are {PER_DIEM_DATA_YEAR} estimates for planning purposes. Lodging and M&IE
          are each calculated at your family percentage, then combined — for TLE (CONUS) that
          combined total is capped at ${TLE_DAILY_CAP}/day per JTR par. 050601 (PDTATAC MAP 66-24(R),
          effective 01 OCT 2025 for FY2026); lodging taxes and mandatory fees count toward this cap.
          TLA (OCONUS) has no flat-dollar cap. TLE/TLA entitlements are determined by your finance
          office using your official orders and current JTR rates. CONUS rates from GSA; OCONUS
          rates from DoD JFTR. Always verify with your gaining unit's finance office before making
          lodging decisions.
        </ThemedText>
        <BranchRegNote />
      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-component: breakdown row ─────────────────────────────────────────────

function BreakdownRow({
  label, value, color, bold,
}: {
  label: string; value: string; color?: string; bold?: boolean;
}) {
  return (
    <View style={brStyles.row}>
      {color && <View style={[brStyles.dot, { backgroundColor: color }]} />}
      <ThemedText
        themeColor={bold ? 'text' : 'textSecondary'}
        style={[brStyles.label, bold && brStyles.labelBold, !color && brStyles.labelIndent]}>
        {label}
      </ThemedText>
      <ThemedText style={[brStyles.value, bold && brStyles.valueBold]}>
        {value}
      </ThemedText>
    </View>
  );
}

const brStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  label: { flex: 1, fontSize: 13 },
  labelBold: { fontWeight: '600', fontSize: 14 },
  labelIndent: { marginLeft: 16 },
  value: { fontSize: 13, fontWeight: '600' },
  valueBold: { fontSize: 15, fontWeight: '800' },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', lineHeight: 34 },
  headerText: { gap: 1 },
  eyebrow: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  pressed: { opacity: 0.6 },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },

  blufBox: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    borderLeftWidth: 4,
    borderLeftColor: Brand.accent,
  },
  blufLabel: { fontSize: 11, fontWeight: '800', color: Brand.accent, letterSpacing: 0.8 },

  section: { gap: Spacing.two },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: Spacing.one },

  modeToggle: { flexDirection: 'row', gap: Spacing.two },
  modeBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  modeBtnActive: { backgroundColor: Brand.primary },
  modeBtnLabel: { fontSize: 14, fontWeight: '700' },
  modeBtnLabelActive: { color: '#FFFFFF' },
  modeBtnSub: { fontSize: 11, opacity: 0.6 },
  modeBtnSubActive: { color: 'rgba(255,255,255,0.8)', opacity: 1 },

  customRateLink: { color: Brand.primaryLight, fontSize: 13, fontWeight: '500', textAlign: 'center', paddingVertical: Spacing.one },
  customRateCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  customRateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.one },
  dollarSign: { fontSize: 28, fontWeight: '700', color: Brand.primary, lineHeight: 34 },
  customRateInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    borderBottomWidth: 2,
    paddingBottom: 2,
  },
  perDayLabel: { fontSize: 16, marginBottom: 4 },
  backToListBtn: { alignSelf: 'flex-start' },

  factorCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  factorDot: { width: 8, height: 8, borderRadius: 4 },
  factorText: { lineHeight: 18 },

  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },

  resultsCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  bigRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigValue: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  dailyBlock: { alignItems: 'flex-end' },
  dailyValue: { fontSize: 18, fontWeight: '700' },
  textRight: { textAlign: 'right' },

  phaseSection: { gap: Spacing.one + 2 },
  phaseTitle: { fontSize: 13, fontWeight: '700', marginBottom: Spacing.one },

  totalDivider: { height: 1.5, backgroundColor: 'rgba(128,128,128,0.3)' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grandTotalLabel: { fontSize: 16, fontWeight: '600' },
  grandTotalValue: { fontSize: 22, fontWeight: '800' },

  summaryBox: { borderRadius: Spacing.two, padding: Spacing.two },

  pdBreakdownCard: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.18)',
    padding: Spacing.two,
    gap: Spacing.one,
  },
  pdBreakdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  pdBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  pdBreakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pdBreakdownDivider: {
    width: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginHorizontal: 4,
  },
  pdBreakdownItemLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  pdBreakdownValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  pdBreakdownNote: {
    fontSize: 9,
    textAlign: 'center',
  },

  emptyState: { borderRadius: Spacing.three, padding: Spacing.five, alignItems: 'center', gap: Spacing.two },
  emptyIcon: { fontSize: 40, lineHeight: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },

  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 12, paddingHorizontal: Spacing.two, paddingTop: Spacing.two },
});
