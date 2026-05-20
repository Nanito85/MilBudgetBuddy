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
import { PayGrade } from '@/data/bah-rates';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import {
  calcDeployment,
  fmtMoney,
  HdpLevel,
  TaxBracket,
  ZoneType,
} from '@/features/deployment/utils/deploymentCalc';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';

// ── Small reusable chips ──────────────────────────────────────────────────────

function ChipRow<T extends string | number | boolean>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; label: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = o.value === selected;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onSelect(o.value)}
            style={[styles.chip, active && styles.chipActive]}>
            <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  sub,
  accent,
  dimmed,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  dimmed?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <View style={{ flex: 1 }}>
        <ThemedText
          style={[styles.resultLabel, dimmed && styles.resultDimmed]}
          themeColor={dimmed ? 'textSecondary' : undefined}>
          {label}
        </ThemedText>
        {sub ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.resultSub}>
            {sub}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText style={[styles.resultValue, accent && styles.resultAccent]}>
        {value}
      </ThemedText>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

const ZONE_OPTIONS: { value: ZoneType; label: string }[] = [
  { value: 'czte', label: 'Combat Zone' },
  { value: 'idp_only', label: 'IDP Zone' },
  { value: 'hdp_only', label: 'Hardship Only' },
];

const HDP_OPTIONS: { value: HdpLevel; label: string }[] = [
  { value: 0, label: 'None' },
  { value: 50, label: '$50' },
  { value: 100, label: '$100' },
  { value: 150, label: '$150' },
];

const TAX_OPTIONS: { value: TaxBracket; label: string }[] = [
  { value: 10, label: '10%' },
  { value: 12, label: '12%' },
  { value: 22, label: '22%' },
  { value: 24, label: '24%' },
  { value: 32, label: '32%' },
];

export default function DeploymentCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [grade, setGrade] = useState<PayGrade>('E5');
  const [yos, setYos] = useState(6);
  const [months, setMonths] = useState(9);
  const [zoneType, setZoneType] = useState<ZoneType>('czte');
  const [hasDependents, setHasDependents] = useState(true);
  const [hasBAH, setHasBAH] = useState(true);
  const [bahText, setBahText] = useState('2000');
  const [hdpLevel, setHdpLevel] = useState<HdpLevel>(0);
  const [taxBracket, setTaxBracket] = useState<TaxBracket>(22);
  const [sdpText, setSdpText] = useState('5000');

  const monthlyBAH = parseInt(bahText, 10) || 0;
  const sdpDeposit = Math.min(10000, parseInt(sdpText, 10) || 0);

  const result = useMemo(
    () =>
      calcDeployment({
        grade,
        yos,
        months,
        zoneType,
        hasDependents,
        hasBAH,
        monthlyBAH,
        hdpLevel: zoneType === 'hdp_only' ? hdpLevel : 0,
        taxBracket,
        sdpDeposit: zoneType === 'czte' ? sdpDeposit : 0,
      }),
    [grade, yos, months, zoneType, hasDependents, hasBAH, monthlyBAH, hdpLevel, taxBracket, sdpDeposit],
  );

  const { monthly, totalGross, totalTaxSavings, totalExtraVsHome, sdpInterest, normalMonthNet, dataYear } = result;

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
          <ThemedText style={styles.title}>Deployment Estimator</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── BLUF ───────────────────────────────────────────────────────────── */}
        <ThemedView type="backgroundElement" style={styles.blufBox}>
          <ThemedText style={styles.blufTitle}>BLUF</ThemedText>
          <ThemedText type="small" style={{ lineHeight: 18 }}>
            Combat zones mean extra pay and zero federal tax on your basic pay. This tool estimates
            your total deployment earnings, tax savings, and how much more you'll take home vs a
            normal month.
          </ThemedText>
        </ThemedView>

        {/* ── YOUR INFO ──────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            YOUR INFO
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Pay Grade
              </ThemedText>
              <GradePicker selected={grade} onSelect={setGrade} />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <NumberStepper label="Years of Service" value={yos} min={0} max={40} onChange={setYos} unit="yrs" />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Tax Bracket (Federal)
              </ThemedText>
              <ChipRow options={TAX_OPTIONS} selected={taxBracket} onSelect={setTaxBracket} />
            </View>
          </ThemedView>
        </View>

        {/* ── DEPLOYMENT ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            DEPLOYMENT
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <NumberStepper label="Duration" value={months} min={1} max={24} onChange={setMonths} unit="mo" />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Zone Type
              </ThemedText>
              <ChipRow options={ZONE_OPTIONS} selected={zoneType} onSelect={setZoneType} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                {zoneType === 'czte'
                  ? 'Combat Zone Tax Exclusion — IDP ($225/mo) + federal income tax excluded on basic pay (DoD FMR Vol 7A Ch 10 & 26 USC §112)'
                  : zoneType === 'idp_only'
                  ? 'IDP-designated area — $225/mo hazard pay, no federal tax exclusion (DoD FMR Vol 7A Ch 10)'
                  : 'Hardship Duty Pay by location only — no IDP, no CZTE (DoD FMR Vol 7A Ch 17)'}
              </ThemedText>
            </View>
            {zoneType === 'hdp_only' && (
              <>
                <View style={styles.divider} />
                <View style={styles.cardPadded}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                    HDP-L Level (per month)
                  </ThemedText>
                  <ChipRow options={HDP_OPTIONS} selected={hdpLevel} onSelect={setHdpLevel} />
                </View>
              </>
            )}
          </ThemedView>
        </View>

        {/* ── ALLOWANCES ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            ALLOWANCES
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Dependents
              </ThemedText>
              <ChipRow
                options={[
                  { value: true, label: 'Yes (FSA +$250/mo)' },
                  { value: false, label: 'No dependents' },
                ]}
                selected={hasDependents}
                onSelect={setHasDependents}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                BAH
              </ThemedText>
              <ChipRow
                options={[
                  { value: true, label: 'Continues (w/ dependents)' },
                  { value: false, label: 'No BAH' },
                ]}
                selected={hasBAH}
                onSelect={setHasBAH}
              />
              {hasBAH && (
                <View style={styles.inputRow}>
                  <ThemedText style={styles.inputLabel}>Monthly BAH ($)</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={bahText}
                    onChangeText={setBahText}
                    placeholderTextColor="#3D6080"
                    placeholder="0"
                  />
                </View>
              )}
            </View>
          </ThemedView>
        </View>

        {/* ── SDP ────────────────────────────────────────────────────────────── */}
        {zoneType === 'czte' && (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              SAVINGS DEPOSIT PROGRAM
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <View style={styles.cardPadded}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  SDP earns 10% APR (risk-free) on up to $10,000 while in a combat zone. Interest
                  continues for 90 days after you leave. (DoD FMR Vol 7A Ch 51)
                </ThemedText>
                <View style={styles.inputRow}>
                  <ThemedText style={styles.inputLabel}>SDP Deposit ($)</ThemedText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={sdpText}
                    onChangeText={setSdpText}
                    placeholderTextColor="#3D6080"
                    placeholder="0"
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={[styles.hint, { marginTop: 4 }]}>
                  Max $10,000 · capped automatically
                </ThemedText>
              </View>
            </ThemedView>
          </View>
        )}

        {/* ── RESULTS ────────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            MONTHLY BREAKDOWN
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ResultRow label="Basic Pay" value={fmtMoney(monthly.basicPay)} />
              {monthly.bah > 0 && <ResultRow label="BAH" value={fmtMoney(monthly.bah)} />}
              <ResultRow label="BAS" value={fmtMoney(monthly.bas)} />
              {monthly.idp > 0 && (
                <ResultRow label="IDP / HFP" value={fmtMoney(monthly.idp)} sub="Imminent Danger Pay (DoD FMR Vol 7A Ch 10)" />
              )}
              {monthly.fsa > 0 && (
                <ResultRow label="FSA" value={fmtMoney(monthly.fsa)} sub="Family Separation Allowance (DoD FMR Vol 7A Ch 27)" />
              )}
              {monthly.hdp > 0 && (
                <ResultRow label="HDP-L" value={fmtMoney(monthly.hdp)} sub="Hardship Duty Pay-Location (DoD FMR Vol 7A Ch 17)" />
              )}
              <View style={styles.totalDivider} />
              <ResultRow label="Gross Monthly" value={fmtMoney(monthly.grossTotal)} accent />
            </View>
          </ThemedView>
        </View>

        {/* ── TAX SECTION ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            TAX IMPACT
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ResultRow
                label="Est. Federal Tax (Normal)"
                value={`−${fmtMoney(monthly.federalTaxNormal)}`}
                sub={`At ${taxBracket}% bracket on basic pay`}
                dimmed
              />
              {zoneType === 'czte' && monthly.czteSavings > 0 && (
                <ResultRow
                  label="CZTE Tax Savings"
                  value={`+${fmtMoney(monthly.czteSavings)}`}
                  sub="26 USC §112 combat zone exclusion"
                  accent
                />
              )}
              <View style={styles.totalDivider} />
              <ResultRow
                label="Est. Monthly Take-Home"
                value={fmtMoney(monthly.netTotal)}
                accent
              />
              <ResultRow
                label="Normal Month Take-Home"
                value={fmtMoney(normalMonthNet)}
                dimmed
              />
            </View>
          </ThemedView>
        </View>

        {/* ── DEPLOYMENT TOTALS ──────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            {months}-MONTH TOTAL
          </ThemedText>
          <ThemedView type="backgroundElement" style={[styles.card, styles.totalsCard]}>
            <View style={styles.totalBlock}>
              <ThemedText style={styles.totalAmount}>{fmtMoney(totalGross)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Total Gross Pay</ThemedText>
            </View>
            <View style={styles.totalsSeparator} />
            {zoneType === 'czte' && (
              <>
                <View style={styles.totalBlock}>
                  <ThemedText style={[styles.totalAmount, { color: '#00C8A8' }]}>
                    {fmtMoney(totalTaxSavings)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">Tax Savings (CZTE)</ThemedText>
                </View>
                <View style={styles.totalsSeparator} />
              </>
            )}
            {sdpInterest > 0 && (
              <>
                <View style={styles.totalBlock}>
                  <ThemedText style={[styles.totalAmount, { color: '#C8A800' }]}>
                    {fmtMoney(sdpInterest)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">SDP Interest (10% APR)</ThemedText>
                </View>
                <View style={styles.totalsSeparator} />
              </>
            )}
            <View style={styles.totalBlock}>
              <ThemedText style={[styles.totalAmount, { color: Brand.accent }]}>
                {fmtMoney(totalExtraVsHome)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">Extra vs Home</ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* ── DISCLAIMER ─────────────────────────────────────────────────────── */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          Estimates only. Figures based on FY{dataYear.pay} basic pay rates. Tax savings shown at
          the selected marginal bracket — your effective savings may differ. IDP zones and CZTE
          designations are set by DoD/Treasury; confirm your deployment area qualifies. Verify all
          pay with your finance office. References: DoD FMR Vol 7A, 26 USC §112, JTR.
        </ThemedText>
        <BranchRegNote />
      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

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
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: Spacing.one },
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },
  hint: { lineHeight: 17, fontSize: 12 },
  blufBox: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  blufTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 1, color: Brand.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  inputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  inputLabel: { fontSize: 15, fontWeight: '500', flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.3)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    minWidth: 100,
    textAlign: 'right',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 4 },
  resultLabel: { fontSize: 14, fontWeight: '500' },
  resultDimmed: { opacity: 0.6 },
  resultSub: { fontSize: 11, lineHeight: 15, marginTop: 1 },
  resultValue: { fontSize: 14, fontWeight: '700', minWidth: 90, textAlign: 'right' },
  resultAccent: { color: Brand.accent },
  totalDivider: { height: 1, backgroundColor: 'rgba(128,128,128,0.2)', marginVertical: 4 },
  totalsCard: { flexDirection: 'row', flexWrap: 'wrap' },
  totalBlock: { flex: 1, minWidth: 130, alignItems: 'center', padding: Spacing.three, gap: 4 },
  totalAmount: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  totalsSeparator: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', alignSelf: 'stretch' },
  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 12, paddingHorizontal: Spacing.two, paddingTop: Spacing.two },
});
