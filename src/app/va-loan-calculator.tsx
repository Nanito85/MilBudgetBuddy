import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TacticalCard } from '@/components/TacticalCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Fonts, Spacing } from '@/constants/theme';
import { CONFORMING_LOAN_LIMIT, FUNDING_FEE_EXEMPT_NOTE, VAUsage } from '@/data/va-loan-rates';
import { VALoanInputs, calcVALoan, fmtMoney, fmtMoneyExact } from '@/features/va-loan/utils/vaLoanCalc';

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={ss.labelRow}>
      <View style={ss.labelLine} />
      <ThemedText type="label" style={ss.labelText}>{text}</ThemedText>
      <View style={ss.labelLine} />
    </View>
  );
}

function ResultRow({ label, value, accent, indent, bold }: { label: string; value: string; accent?: string; indent?: boolean; bold?: boolean }) {
  return (
    <View style={[ss.row, indent && ss.rowIndent]}>
      <ThemedText style={[ss.rowLabel, bold && ss.rowLabelBold, indent && { opacity: 0.7 }]}>{label}</ThemedText>
      <View style={ss.dotLine} />
      <ThemedText style={[ss.rowValue, bold && ss.rowValueBold, accent ? { color: accent } : undefined]}>
        {value}
      </ThemedText>
    </View>
  );
}

function MoneyInput({ label, value, onChange, prefix = '$' }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <View style={ss.inputGroup}>
      <ThemedText type="label" style={ss.inputLabel}>{label}</ThemedText>
      <View style={ss.inputWrap}>
        <ThemedText style={ss.inputPrefix}>{prefix}</ThemedText>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          style={ss.input}
          placeholderTextColor="#2A4A60"
          placeholder="0"
        />
      </View>
    </View>
  );
}

function ChipRow<T extends string | number>({ label, options, selected, onSelect }: { label: string; options: { value: T; label: string }[]; selected: T; onSelect: (v: T) => void }) {
  return (
    <View style={ss.chipGroup}>
      <ThemedText type="label" style={ss.inputLabel}>{label}</ThemedText>
      <View style={ss.chipRow}>
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onSelect(o.value)}
            style={[ss.chip, selected === o.value && ss.chipActive]}>
            <ThemedText style={[ss.chipText, selected === o.value && ss.chipTextActive]}>
              {o.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

const TERM_OPTIONS = [
  { value: 30 as 30 | 15, label: '30 YR' },
  { value: 15 as 30 | 15, label: '15 YR' },
];
const USAGE_OPTIONS = [
  { value: 'first' as VAUsage, label: 'FIRST USE' },
  { value: 'subsequent' as VAUsage, label: 'SUBSEQUENT' },
];
const BOOL_OPTIONS = [
  { value: 'no', label: 'NO' },
  { value: 'yes', label: 'YES' },
];

export default function VALoanCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [homePrice, setHomePrice] = useState('400000');
  const [downPayment, setDownPayment] = useState('0');
  const [interestRate, setInterestRate] = useState('6.5');
  const [loanTerm, setLoanTerm] = useState<30 | 15>(30);
  const [usage, setUsage] = useState<VAUsage>('first');
  const [exempt, setExempt] = useState<'yes' | 'no'>('no');
  const [financeFee, setFinanceFee] = useState<'yes' | 'no'>('yes');
  const [annualTax, setAnnualTax] = useState('4800');
  const [annualIns, setAnnualIns] = useState('1200');

  const result = useMemo(() => {
    const price = parseFloat(homePrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0;
    if (price <= 0 || rate <= 0) return null;

    const inputs: VALoanInputs = {
      homePrice: price,
      downPayment: Math.min(down, price),
      interestRate: rate,
      loanTermYears: loanTerm,
      usage,
      disabilityExempt: exempt === 'yes',
      financeFundingFee: financeFee === 'yes',
      annualPropertyTax: parseFloat(annualTax) || 0,
      annualInsurance: parseFloat(annualIns) || 0,
    };
    return calcVALoan(inputs);
  }, [homePrice, downPayment, interestRate, loanTerm, usage, exempt, financeFee, annualTax, annualIns]);

  return (
    <ThemedView style={ss.screen}>
      {/* Header */}
      <View style={[ss.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/tools')} style={ss.back}>
          <ThemedText style={ss.backChevron}>‹</ThemedText>
        </Pressable>
        <View style={ss.headerCenter}>
          <ThemedText type="label" style={ss.headerSub}>// BENEFIT CALCULATOR</ThemedText>
          <ThemedText style={ss.headerTitle}>VA LOAN</ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[ss.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* BLUF */}
        <TacticalCard accentColor={Brand.accent} cornerSize={10} style={ss.bluf}>
          <View style={ss.blufBar} />
          <View style={ss.blufText}>
            <ThemedText type="label" style={ss.blufLabel}>COMMANDER'S BRIEF</ThemedText>
            <ThemedText style={ss.blufBody}>
              VA loans require no down payment or PMI, saving most buyers hundreds per month. A funding fee applies unless you receive VA disability compensation.
            </ThemedText>
          </View>
        </TacticalCard>

        {/* ── INPUTS ── */}
        <SectionLabel text="PROPERTY & LOAN" />

        <TacticalCard accentColor={Brand.border} style={ss.inputCard}>
          <View style={ss.inputGrid}>
            <MoneyInput label="HOME PRICE" value={homePrice} onChange={setHomePrice} />
            <MoneyInput label="DOWN PAYMENT" value={downPayment} onChange={setDownPayment} />
          </View>
          <View style={ss.inputGrid}>
            <MoneyInput label="INTEREST RATE" value={interestRate} onChange={setInterestRate} prefix="%" />
            <ChipRow label="LOAN TERM" options={TERM_OPTIONS} selected={loanTerm} onSelect={setLoanTerm} />
          </View>
        </TacticalCard>

        <SectionLabel text="VA ENTITLEMENT" />

        <TacticalCard accentColor={Brand.border} style={ss.inputCard}>
          <ChipRow label="VA LOAN USAGE" options={USAGE_OPTIONS} selected={usage} onSelect={setUsage} />
          <ChipRow
            label="DISABILITY EXEMPT"
            options={BOOL_OPTIONS}
            selected={exempt}
            onSelect={(v) => setExempt(v as 'yes' | 'no')}
          />
          {exempt === 'no' && (
            <ThemedText type="label" style={ss.exemptNote}>{FUNDING_FEE_EXEMPT_NOTE}</ThemedText>
          )}
          <ChipRow
            label="FINANCE FUNDING FEE"
            options={BOOL_OPTIONS.map((o) => ({ ...o, label: o.value === 'yes' ? 'ROLL INTO LOAN' : 'PAY UPFRONT' }))}
            selected={financeFee}
            onSelect={(v) => setFinanceFee(v as 'yes' | 'no')}
          />
        </TacticalCard>

        <SectionLabel text="MONTHLY COSTS (OPTIONAL)" />

        <TacticalCard accentColor={Brand.border} style={ss.inputCard}>
          <View style={ss.inputGrid}>
            <MoneyInput label="PROPERTY TAX / YR" value={annualTax} onChange={setAnnualTax} />
            <MoneyInput label="HOMEOWNERS INS / YR" value={annualIns} onChange={setAnnualIns} />
          </View>
        </TacticalCard>

        {/* ── RESULTS ── */}
        {result && (
          <>
            <SectionLabel text="PAYMENT BREAKDOWN" />

            <TacticalCard accentColor={Brand.accent} cornerSize={14} style={ss.resultCard}>
              <View style={ss.resultHeader}>
                <View style={ss.resultHeaderDot} />
                <ThemedText type="label" style={ss.resultHeaderLabel}>ESTIMATED MONTHLY PAYMENT</ThemedText>
              </View>

              <View style={ss.heroRow}>
                <ThemedText style={ss.heroAmount}>{fmtMoneyExact(result.monthlyTotal)}</ThemedText>
                <ThemedText type="label" style={ss.heroPer}>/MO</ThemedText>
              </View>

              <View style={ss.divider} />

              <ResultRow label="PRINCIPAL & INTEREST" value={fmtMoneyExact(result.monthlyPI)} accent={Brand.tactical} indent />
              <ResultRow label="PROPERTY TAX (EST.)" value={fmtMoneyExact(result.monthlyTax)} indent />
              <ResultRow label="HOMEOWNERS INS (EST.)" value={fmtMoneyExact(result.monthlyInsurance)} indent />
              <ResultRow label="PMI" value="$0.00  ✓" accent={Brand.success} indent />
              <ResultRow label="TOTAL / MONTH" value={fmtMoneyExact(result.monthlyTotal)} bold />
            </TacticalCard>

            <SectionLabel text="LOAN STRUCTURE" />

            <TacticalCard accentColor={Brand.border} style={ss.resultCard}>
              <ResultRow label="HOME PRICE" value={fmtMoney(parseFloat(homePrice) || 0)} />
              <ResultRow label="DOWN PAYMENT" value={`${fmtMoney(result.downPayment)} (${result.downPct.toFixed(1)}%)`} />
              <ResultRow label="BASE LOAN AMOUNT" value={fmtMoney(result.baseLoanAmount)} />
              {result.fundingFeePct > 0 ? (
                <>
                  <ResultRow label={`VA FUNDING FEE (${result.fundingFeePct}%)`} value={fmtMoney(result.fundingFeeAmount)} accent={Brand.warning} />
                  <ResultRow label="FEE FINANCED" value={financeFee === 'yes' ? 'YES' : 'NO — PAID UPFRONT'} />
                </>
              ) : (
                <ResultRow label="VA FUNDING FEE" value="EXEMPT ✓" accent={Brand.success} />
              )}
              <View style={ss.divider} />
              <ResultRow label="TOTAL LOAN AMOUNT" value={fmtMoney(result.totalLoanAmount)} bold accent={Brand.accent} />
              {result.aboveConforming && (
                <ThemedText type="label" style={ss.warningNote}>
                  ⚠ ABOVE {fmtMoney(CONFORMING_LOAN_LIMIT)} CONFORMING LIMIT — JUMBO VA LOAN TERMS APPLY
                </ThemedText>
              )}
            </TacticalCard>

            <SectionLabel text="LIFETIME COST" />

            <TacticalCard accentColor={Brand.border} style={ss.resultCard}>
              <ResultRow label="LOAN TERM" value={`${loanTerm} YEARS`} />
              <ResultRow label="TOTAL INTEREST" value={fmtMoney(result.totalInterest, true)} accent={Brand.warning} />
              <ResultRow label="TOTAL LOAN COST" value={fmtMoney(result.totalCost, true)} bold />
            </TacticalCard>

            <SectionLabel text="VS. CONVENTIONAL (0% DOWN)" />

            <TacticalCard accentColor={Brand.tactical} cornerSize={10} style={ss.resultCard}>
              <ResultRow label="CONV. P&I" value={fmtMoneyExact(result.conventionalMonthlyPI)} indent />
              <ResultRow label="CONV. PMI (EST.)" value={`+${fmtMoneyExact(result.conventionalMonthlyPMI)}`} accent={Brand.danger} indent />
              <ResultRow label="CONV. MONTHLY TOTAL" value={fmtMoneyExact(result.conventionalMonthlyTotal)} />
              <View style={ss.divider} />
              <ResultRow
                label="YOUR VA MONTHLY SAVINGS"
                value={result.monthlySavingsVsConventional >= 0
                  ? `+${fmtMoneyExact(result.monthlySavingsVsConventional)}`
                  : fmtMoneyExact(result.monthlySavingsVsConventional)}
                bold
                accent={result.monthlySavingsVsConventional >= 0 ? Brand.tactical : Brand.danger}
              />
              <ResultRow label="LIFETIME PMI AVOIDED (EST.)" value={fmtMoney(result.pmiSavingsLifetime, true)} accent={Brand.success} />
            </TacticalCard>

            <TacticalCard accentColor={Brand.border} style={ss.disclaimer}>
              <ThemedText type="label" style={ss.disclaimerText}>
                ⚠ ESTIMATE ONLY — RATES, FEES & TAX VARY BY LENDER AND LOCATION.{'\n'}
                VERIFY ENTITLEMENT AT BENEFITS.VA.GOV — CONSULT A VA-APPROVED LENDER FOR EXACT FIGURES.
              </ThemedText>
            </TacticalCard>
          </>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const ss = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  back: { width: 40 },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.accent },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerSub: { color: Brand.tactical, fontSize: 9 },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1.5, color: '#C8D8E8' },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three, paddingTop: Spacing.three },

  // Section label
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  labelLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  labelText: { color: '#3D6080', fontSize: 9 },

  // BLUF
  bluf: { borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  blufBar: { width: 3, backgroundColor: Brand.accent },
  blufText: { flex: 1, padding: Spacing.three, gap: Spacing.one },
  blufLabel: { color: Brand.accent, fontSize: 9 },
  blufBody: { fontSize: 12, lineHeight: 18, color: '#5580A0' },

  // Inputs
  inputCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.three },
  inputGrid: { flexDirection: 'row', gap: Spacing.three },
  inputGroup: { flex: 1, gap: Spacing.one },
  inputLabel: { color: '#3D6080', fontSize: 8 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26,58,92,0.3)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    gap: 4,
  },
  inputPrefix: { fontSize: 13, fontWeight: '700', color: Brand.tactical, fontFamily: Fonts.data },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#C8D8E8',
    fontFamily: Fonts.data,
    padding: 0,
  },
  chipGroup: { flex: 1, gap: Spacing.one },
  chipRow: { flexDirection: 'row', gap: Spacing.one, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one + 2,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: 'rgba(26,58,92,0.2)',
  },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primaryLight },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: '#4D7A9A' },
  chipTextActive: { color: '#FFFFFF' },
  exemptNote: { color: '#3D6080', fontSize: 8, lineHeight: 12 },

  // Results
  resultCard: { borderRadius: 4, padding: Spacing.three, gap: 3 },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.one,
  },
  resultHeaderDot: { width: 6, height: 6, backgroundColor: Brand.accent, borderRadius: 1 },
  resultHeaderLabel: { color: '#4D7A9A', fontSize: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginBottom: Spacing.two },
  heroAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: Brand.accent,
    fontFamily: Fonts.data,
    letterSpacing: -0.5,
  },
  heroPer: { color: '#4D7A9A', marginBottom: 8 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border, marginVertical: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: 4 },
  rowIndent: { paddingLeft: Spacing.two },
  rowLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, color: '#5580A0', minWidth: 130 },
  rowLabelBold: { color: '#C8D8E8', fontWeight: '800', fontSize: 11 },
  dotLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(26,58,92,0.5)' },
  rowValue: { fontSize: 12, fontWeight: '700', fontFamily: Fonts.data, color: '#C8D8E8', letterSpacing: 0.3 },
  rowValueBold: { fontSize: 13 },
  warningNote: { color: Brand.warning, fontSize: 8, lineHeight: 12, marginTop: Spacing.one },
  disclaimer: { borderRadius: 4, padding: Spacing.two + 4 },
  disclaimerText: { color: '#2A4A60', fontSize: 8, lineHeight: 13, letterSpacing: 0.5 },
});
