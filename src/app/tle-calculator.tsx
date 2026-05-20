import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchRegNote } from '@/components/BranchRegNote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Locality, PER_DIEM_DATA_YEAR } from '@/data/per-diem-rates';
import { FamilyComposer } from '@/features/tle/components/FamilyComposer';
import { LocalityPicker } from '@/features/tle/components/LocalityPicker';
import {
  calcTLE,
  CHILD_FACTOR_12PLUS,
  CHILD_FACTOR_UNDER12,
  familyLabel,
  fmtMoney,
  fmtMoneyRound,
  MEMBER_FACTOR,
  MoveMode,
  SPOUSE_FACTOR,
  TLA_MAX_DAYS,
  TLA_PHASE1_DAYS,
  TLA_PHASE2_PCT,
  TLE_MAX_DAYS,
} from '@/features/tle/utils/tleCalc';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BottomTabInset, Brand, Colors, Spacing } from '@/constants/theme';

export default function TLECalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [mode, setMode] = useState<MoveMode>('tle');
  const [locality, setLocality] = useState<Locality | null>(null);
  const [useCustomRate, setUseCustomRate] = useState(false);
  const [customRateText, setCustomRateText] = useState('');
  const [hasSpouse, setHasSpouse] = useState(false);
  const [childAges, setChildAges] = useState<number[]>([]);
  const [days, setDays] = useState(mode === 'tle' ? 5 : 14);

  const maxDays = mode === 'tle' ? TLE_MAX_DAYS : TLA_MAX_DAYS;

  const effectivePerDiem: number | null = useCustomRate
    ? parseFloat(customRateText) || null
    : locality?.perDiem ?? null;

  const result = effectivePerDiem != null
    ? calcTLE({ mode, perDiem: effectivePerDiem, hasSpouse, childAges, days })
    : null;

  const numChildren = childAges.length;

  const handleModeChange = (newMode: MoveMode) => {
    setMode(newMode);
    setLocality(null);
    setUseCustomRate(false);
    setCustomRateText('');
    setDays(newMode === 'tle' ? 5 : 14);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.push('/tools'))}
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
            {([['tle', '🏠  CONUS (TLE)', 'Up to 10 days'], ['tla', '✈️  OCONUS (TLA)', 'Up to 60 days']] as [MoveMode, string, string][]).map(
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
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.customRateInput, { color: colors.text, borderBottomColor: Brand.primary }]}
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
          {effectivePerDiem != null && (
            <ThemedView type="backgroundElement" style={styles.factorCard}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                DAILY RATE FACTORS (JTR)
              </ThemedText>
              <View style={styles.factorRow}>
                <View style={[styles.factorDot, { backgroundColor: Brand.primary }]} />
                <ThemedText type="small" style={styles.factorText}>
                  Member: {(MEMBER_FACTOR * 100).toFixed(2)}% × ${effectivePerDiem} = {fmtMoney(effectivePerDiem * MEMBER_FACTOR)}/day
                </ThemedText>
              </View>
              {hasSpouse && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.accent }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    Spouse: {(SPOUSE_FACTOR * 100).toFixed(2)}% × ${effectivePerDiem} = {fmtMoney(effectivePerDiem * SPOUSE_FACTOR)}/day
                  </ThemedText>
                </View>
              )}
              {childAges.filter((a) => a >= 12).length > 0 && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.success }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    {childAges.filter((a) => a >= 12).length} child{childAges.filter((a) => a >= 12).length > 1 ? 'ren' : ''} age 12+: {(CHILD_FACTOR_12PLUS * 100).toFixed(3)}% each × ${effectivePerDiem} = {fmtMoney(effectivePerDiem * CHILD_FACTOR_12PLUS * childAges.filter((a) => a >= 12).length)}/day
                  </ThemedText>
                </View>
              )}
              {childAges.filter((a) => a < 12).length > 0 && (
                <View style={styles.factorRow}>
                  <View style={[styles.factorDot, { backgroundColor: Brand.warning }]} />
                  <ThemedText type="small" style={styles.factorText}>
                    {childAges.filter((a) => a < 12).length} child{childAges.filter((a) => a < 12).length > 1 ? 'ren' : ''} under 12: {(CHILD_FACTOR_UNDER12 * 100).toFixed(2)}% each × ${effectivePerDiem} = {fmtMoney(effectivePerDiem * CHILD_FACTOR_UNDER12 * childAges.filter((a) => a < 12).length)}/day
                  </ThemedText>
                </View>
              )}
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
                  Up to 5 days at your old station + 5 days at your new station (or all 10 at the
                  new station). Your orders will specify what is authorized.
                </ThemedText>
              )}
              {mode === 'tla' && days > TLA_PHASE1_DAYS && (
                <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                  Days 1–{TLA_PHASE1_DAYS} at 90% per diem · Days {TLA_PHASE1_DAYS + 1}–{days} at 65% per diem
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
                    {mode === 'tle' ? 'TLE' : 'TLA'} TOTAL ({days} days)
                  </ThemedText>
                  <ThemedText style={[styles.bigValue, { color: Brand.primary }]}>
                    {fmtMoneyRound(result.totalEntitlement)}
                  </ThemedText>
                </View>
                <View style={styles.dailyBlock}>
                  <ThemedText type="small" themeColor="textSecondary" style={[styles.fieldLabel, styles.textRight]}>
                    DAILY (PHASE 1)
                  </ThemedText>
                  <ThemedText style={[styles.dailyValue, { color: Brand.accent }]}>
                    {fmtMoney(result.dailyPhase1.total)}/day
                  </ThemedText>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Phase 1 breakdown */}
              <View style={styles.phaseSection}>
                <ThemedText style={styles.phaseTitle}>
                  {mode === 'tle'
                    ? `TLE — ${result.phase1Days} day${result.phase1Days !== 1 ? 's' : ''} @ 100% per diem`
                    : `Phase 1 — ${result.phase1Days} day${result.phase1Days !== 1 ? 's' : ''} @ 90% per diem`}
                </ThemedText>
                <BreakdownRow label="Member (65%)" value={fmtMoney(result.dailyPhase1.member)} color={Brand.primary} />
                {hasSpouse && (
                  <BreakdownRow label="Spouse (16.25%)" value={fmtMoney(result.dailyPhase1.spouse)} color={Brand.accent} />
                )}
                {result.children12Plus > 0 && (
                  <BreakdownRow
                    label={`${result.children12Plus} child${result.children12Plus > 1 ? 'ren' : ''} 12+ (${result.children12Plus} × 8.125%)`}
                    value={fmtMoney(effectivePerDiem * CHILD_FACTOR_12PLUS * result.children12Plus)}
                    color={Brand.success}
                  />
                )}
                {result.childrenUnder12 > 0 && (
                  <BreakdownRow
                    label={`${result.childrenUnder12} child${result.childrenUnder12 > 1 ? 'ren' : ''} under 12 (${result.childrenUnder12} × 5.42%)`}
                    value={fmtMoney(effectivePerDiem * CHILD_FACTOR_UNDER12 * result.childrenUnder12)}
                    color={Brand.warning}
                  />
                )}
                <BreakdownRow
                  label={`Subtotal × ${result.phase1Days} days`}
                  value={fmtMoneyRound(result.dailyPhase1.total * result.phase1Days)}
                  bold
                />
              </View>

              {/* Phase 2 breakdown (TLA only) */}
              {result.dailyPhase2 != null && result.phase2Days > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.phaseSection}>
                    <ThemedText style={styles.phaseTitle}>
                      Phase 2 — {result.phase2Days} day{result.phase2Days !== 1 ? 's' : ''} @ 65% per diem
                    </ThemedText>
                    <BreakdownRow label="Member (65%)" value={fmtMoney(result.dailyPhase2.member)} color={Brand.primary} />
                    {hasSpouse && (
                      <BreakdownRow label="Spouse (16.25%)" value={fmtMoney(result.dailyPhase2.spouse)} color={Brand.accent} />
                    )}
                    {result.children12Plus > 0 && (
                      <BreakdownRow
                        label={`${result.children12Plus} child${result.children12Plus > 1 ? 'ren' : ''} 12+ (${result.children12Plus} × 8.125%)`}
                        value={fmtMoney(effectivePerDiem * TLA_PHASE2_PCT * CHILD_FACTOR_12PLUS * result.children12Plus)}
                        color={Brand.success}
                      />
                    )}
                    {result.childrenUnder12 > 0 && (
                      <BreakdownRow
                        label={`${result.childrenUnder12} child${result.childrenUnder12 > 1 ? 'ren' : ''} under 12 (${result.childrenUnder12} × 5.42%)`}
                        value={fmtMoney(effectivePerDiem * TLA_PHASE2_PCT * CHILD_FACTOR_UNDER12 * result.childrenUnder12)}
                        color={Brand.warning}
                      />
                    )}
                    <BreakdownRow
                      label={`Subtotal × ${result.phase2Days} days`}
                      value={fmtMoneyRound(result.dailyPhase2.total * result.phase2Days)}
                      bold
                    />
                  </View>
                </>
              )}

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
                  Locality per diem: ${effectivePerDiem}/day
                  {locality ? ` (${locality.name})` : ' (custom)'}
                </ThemedText>
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
          Per diem rates are {PER_DIEM_DATA_YEAR} estimates for planning purposes. TLE/TLA
          entitlements are determined by your finance office using your official orders and current
          JTR rates. CONUS rates from GSA; OCONUS rates from DoD JFTR. Always verify with your
          gaining unit's finance office before making lodging decisions.
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

  emptyState: { borderRadius: Spacing.three, padding: Spacing.five, alignItems: 'center', gap: Spacing.two },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },

  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 12, paddingHorizontal: Spacing.two, paddingTop: Spacing.two },
});
