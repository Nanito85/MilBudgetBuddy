import { useRouter } from 'expo-router';
import React, { useMemo, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { calcLES } from '@/features/home/utils/lesCalc';
import { useBudgetStore } from '@/store/budget.store';
import { useUserStore } from '@/store/user.store';
import { getRankAbbrev, BRANCH_LABELS, SPECIAL_PAY_LABELS } from '@/types/user.types';

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return '$' + Math.round(n).toLocaleString();
}

function fmtSigned(n: number) {
  return (n >= 0 ? '+' : '') + '$' + Math.round(Math.abs(n)).toLocaleString();
}

// ── Row components ─────────────────────────────────────────────────────────────

function Row({ label, value, dim, accent, bold, indent }: {
  label: string; value: string; dim?: boolean; accent?: string;
  bold?: boolean; indent?: boolean;
}) {
  return (
    <View style={[row.wrap, indent && row.indent]}>
      <ThemedText style={[row.label, dim && row.dimText, bold && row.boldText]}>{label}</ThemedText>
      <ThemedText style={[row.value, dim && row.dimText, bold && row.boldText, accent ? { color: accent } : null]}>
        {value}
      </ThemedText>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  indent: { paddingLeft: Spacing.three },
  label: { fontSize: 12, color: '#8AABCC', flex: 1 },
  value: { fontSize: 12, fontWeight: '700', color: '#C8D8E8', fontFamily: 'Courier New' },
  dimText: { color: '#4D7A9A' },
  boldText: { fontWeight: '900' },
});

function Divider({ label }: { label?: string }) {
  return (
    <View style={div.wrap}>
      <View style={div.line} />
      {label && <ThemedText style={div.label}>{label}</ThemedText>}
      {label && <View style={div.line} />}
    </View>
  );
}

const div = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: Spacing.one + 2 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#0D2030' },
  label: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 1 },
});

function SectionHeader({ label, color = Brand.tactical }: { label: string; color?: string }) {
  return (
    <View style={sh.wrap}>
      <View style={[sh.bar, { backgroundColor: color }]} />
      <ThemedText style={[sh.label, { color }]}>{label}</ThemedText>
    </View>
  );
}

const sh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2, marginTop: Spacing.three, marginBottom: Spacing.one + 2 },
  bar: { width: 3, height: 14, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CommandModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // User data
  const branch       = useUserStore((s) => s.branch);
  const payGrade     = useUserStore((s) => s.payGrade);
  const rankVariant  = useUserStore((s) => s.rankVariant);
  const lastName     = useUserStore((s) => s.lastName);
  const nickname     = useUserStore((s) => s.nickname);
  const yos          = useUserStore((s) => s.yos);
  const mhaZip       = useUserStore((s) => s.mhaZip);
  const hasSpouse    = useUserStore((s) => s.hasSpouse);
  const numChildren  = useUserStore((s) => s.numChildren);
  const tspContribPct   = useUserStore((s) => s.tspContribPct);
  const rothTspPct      = useUserStore((s) => s.rothTspPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut    = useUserStore((s) => s.sglOptOut);
  const stateResidence  = useUserStore((s) => s.stateResidence);
  const specialPays  = useUserStore((s) => s.specialPays);
  const lesOverrides = useUserStore((s) => s.lesOverrides);
  const spouseIncome = useUserStore((s) => s.spouseMonthlyIncome);

  // Budget
  const budgetCategories = useBudgetStore((s) => s.categories);
  useEffect(() => { useBudgetStore.getState().hydrate(); }, []);

  const rankAbbrev  = getRankAbbrev(branch, payGrade, rankVariant);
  const displayName = nickname || lastName?.toUpperCase() || 'SERVICEMEMBER';
  const branchLabel = branch ? BRANCH_LABELS[branch] : 'Unknown';
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const specialPaysTotal = useMemo(
    () => specialPays.reduce((s, p) => s + p.monthlyAmount, 0),
    [specialPays],
  );

  const breakdown = useMemo(() => {
    if (!payGrade) return null;
    return calcLES({
      payGrade, yos, mhaZip, hasSpouse, specialPaysTotal,
      tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence,
      overrides: lesOverrides,
    });
  }, [payGrade, yos, mhaZip, hasSpouse, specialPaysTotal, tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence, lesOverrides]);

  const totalBudgeted = useMemo(
    () => budgetCategories.reduce((s, c) => s + c.monthlyBudget, 0),
    [budgetCategories],
  );

  const budgetWithEntries = budgetCategories.filter((c) => c.monthlyBudget > 0);

  const netAfterExpenses = breakdown
    ? breakdown.netPay + spouseIncome - totalBudgeted
    : null;

  const handleShare = () => {
    if (!breakdown) {
      Alert.alert('Profile Incomplete', 'Complete your profile first to generate this worksheet.');
      return;
    }

    const pad = (s: string, w: number) => s.padEnd(w, ' ');
    const fmtR = (n: number) => fmt(n).padStart(10, ' ');

    const lines = [
      '═══════════════════════════════════════════════',
      '        COMMAND FINANCIAL READINESS WORKSHEET',
      '═══════════════════════════════════════════════',
      `Member:  ${rankAbbrev} ${lastName?.toUpperCase() ?? displayName}`,
      `Branch:  ${branchLabel.toUpperCase()}`,
      `Grade:   ${payGrade ?? '—'}    YOS: ${yos}`,
      `Status:  ${hasSpouse ? 'Married' : 'Single'}   Deps: ${numChildren}`,
      `Date:    ${today}`,
      '─────────────────────────────────────────────',
      'GROSS MONTHLY INCOME',
      `  ${pad('Base Pay', 28)}${fmtR(breakdown.basePay)}`,
      `  ${pad('BAH', 28)}${fmtR(breakdown.bah)}`,
      `  ${pad('BAS', 28)}${fmtR(breakdown.bas)}`,
      ...(breakdown.specialPays > 0
        ? [`  ${pad('Special Pays', 28)}${fmtR(breakdown.specialPays)}`]
        : []),
      ...specialPays.map((p) => `    ${pad('· ' + (p.customLabel ?? SPECIAL_PAY_LABELS[p.type]), 26)}${fmtR(p.monthlyAmount)}`),
      ...(spouseIncome > 0
        ? [`  ${pad('Spouse Income', 28)}${fmtR(spouseIncome)}`]
        : []),
      `  ${pad('TOTAL GROSS', 28)}${fmtR(breakdown.grossPay + spouseIncome)}`,
      '─────────────────────────────────────────────',
      'DEDUCTIONS',
      `  ${pad('Federal Income Tax (est.)', 28)}${fmtR(breakdown.fedTax)}`,
      ...(breakdown.stateTax > 0
        ? [`  ${pad('State Income Tax (est.)', 28)}${fmtR(breakdown.stateTax)}`]
        : []),
      `  ${pad('FICA', 28)}${fmtR(breakdown.fica)}`,
      ...(breakdown.traditionalTsp > 0 ? [`  ${pad(`Trad TSP (${tspContribPct}%)`, 28)}${fmtR(breakdown.traditionalTsp)}`] : []),
      ...(breakdown.rothTsp > 0       ? [`  ${pad(`Roth TSP (${rothTspPct}%)`, 28)}${fmtR(breakdown.rothTsp)}`]         : []),
      ...(breakdown.tsp === 0         ? [`  ${pad('TSP Contribution', 28)}${fmtR(0)}`]                                  : []),
      ...(breakdown.sgli > 0
        ? [`  ${pad('SGLI', 28)}${fmtR(breakdown.sgli)}`]
        : []),
      ...(breakdown.dental > 0
        ? [`  ${pad('Dental (FEDVIP)', 28)}${fmtR(breakdown.dental)}`]
        : []),
      `  ${pad('TOTAL DEDUCTIONS', 28)}${fmtR(breakdown.totalDeductions)}`,
      '─────────────────────────────────────────────',
      `  ${'NET TAKE-HOME PAY'.padEnd(28)}${fmtR(breakdown.netPay)}`,
      '─────────────────────────────────────────────',
      'MONTHLY EXPENSES (BUDGET)',
      ...budgetWithEntries.map((c) => `  ${pad(c.name, 28)}${fmtR(c.monthlyBudget)}`),
      ...(budgetWithEntries.length === 0 ? ['  No budget entries on file.'] : []),
      `  ${pad('TOTAL EXPENSES', 28)}${fmtR(totalBudgeted)}`,
      '═══════════════════════════════════════════════',
      `  ${'NET AFTER ALL EXPENSES'.padEnd(28)}${fmtR(netAfterExpenses ?? 0)}`,
      '═══════════════════════════════════════════════',
      '',
      'This worksheet was self-generated using MilBudgetBuddy.',
      'All figures are estimates based on current pay tables.',
      'Data is self-reported and not verified by the command.',
    ].join('\n');

    Share.share({ message: lines, title: 'Financial Readiness Worksheet' });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>FINANCIAL READINESS</ThemedText>
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <ThemedText style={styles.shareText}>SHARE ↑</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Identity block */}
        <View style={styles.idBlock}>
          <View style={styles.idLeft}>
            <ThemedText style={styles.idRank}>{rankAbbrev || '—'}</ThemedText>
            <ThemedText style={styles.idName}>{displayName}</ThemedText>
            <ThemedText style={styles.idBranch}>{branchLabel.toUpperCase()} {payGrade ? `· ${payGrade}` : ''}</ThemedText>
          </View>
          <View style={styles.idRight}>
            <ThemedText style={styles.idDate}>{today}</ThemedText>
            <View style={styles.idStatus}>
              <View style={styles.idDot} />
              <ThemedText style={styles.idStatusText}>FOR COMMAND USE</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.idMeta}>
          <ThemedText style={styles.idMetaText}>YOS: {yos} · {hasSpouse ? 'MARRIED' : 'SINGLE'} · {numChildren} DEP{numChildren !== 1 ? 'S' : ''}</ThemedText>
        </View>

        {!breakdown && (
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={styles.incompleteBox}>
            <ThemedText style={styles.incompleteIcon}>⚠️</ThemedText>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.incompleteTitle}>PROFILE INCOMPLETE</ThemedText>
              <ThemedText style={styles.incompleteSub}>Complete your profile to generate this worksheet.</ThemedText>
            </View>
            <ThemedText style={styles.incompleteChevron}>›</ThemedText>
          </Pressable>
        )}

        {breakdown && (
          <>
            {/* ── GROSS INCOME ── */}
            <View style={styles.card}>
              <SectionHeader label="GROSS MONTHLY INCOME" color={Brand.success} />
              <Row label="Base Pay" value={fmt(breakdown.basePay)} />
              <Row label="BAH (Housing Allowance)" value={fmt(breakdown.bah)} />
              <Row label="BAS (Subsistence Allowance)" value={fmt(breakdown.bas)} />

              {breakdown.specialPays > 0 && (
                <>
                  <Divider label="SPECIAL PAYS" />
                  {specialPays.map((p) => (
                    <Row
                      key={p.id}
                      label={(p.customLabel ?? SPECIAL_PAY_LABELS[p.type])}
                      value={fmt(p.monthlyAmount)}
                      indent
                      dim
                    />
                  ))}
                </>
              )}

              {breakdown.extraIncomeItems.map((item) => (
                <Row key={item.id} label={item.label} value={fmt(item.amount)} indent dim />
              ))}

              {spouseIncome > 0 && (
                <Row label="Spouse / Household Income" value={fmt(spouseIncome)} />
              )}

              <Divider />
              <Row
                label="TOTAL GROSS"
                value={fmt(breakdown.grossPay + spouseIncome)}
                bold
                accent={Brand.success}
              />
            </View>

            {/* ── DEDUCTIONS ── */}
            <View style={styles.card}>
              <SectionHeader label="DEDUCTIONS" color="#E74C3C" />
              <Row label="Federal Income Tax (est.)" value={fmt(breakdown.fedTax)} />
              {breakdown.stateTax > 0 && (
                <Row label="State Income Tax (est.)" value={fmt(breakdown.stateTax)} />
              )}
              <Row label="FICA" value={fmt(breakdown.fica)} />
              {breakdown.traditionalTsp > 0 && <Row label={`Traditional TSP (${tspContribPct}%)`} value={fmt(breakdown.traditionalTsp)} />}
              {breakdown.rothTsp > 0       && <Row label={`Roth TSP (${rothTspPct}%)`}           value={fmt(breakdown.rothTsp)} />}
              {breakdown.tsp === 0         && <Row label="TSP Contribution" value={fmt(0)} />}
              {breakdown.sgli > 0 && <Row label="SGLI Premium" value={fmt(breakdown.sgli)} />}
              {breakdown.dental > 0 && <Row label="FEDVIP Dental" value={fmt(breakdown.dental)} />}
              {breakdown.extraDeductionItems.map((item) => (
                <Row key={item.id} label={item.label} value={fmt(item.amount)} dim />
              ))}
              <Divider />
              <Row label="TOTAL DEDUCTIONS" value={fmt(breakdown.totalDeductions)} bold accent="#E74C3C" />
            </View>

            {/* ── NET PAY ── */}
            <View style={[styles.card, styles.netCard]}>
              <View style={styles.netRow}>
                <ThemedText style={styles.netLabel}>NET TAKE-HOME PAY</ThemedText>
                <ThemedText style={styles.netValue}>{fmt(breakdown.netPay)}</ThemedText>
              </View>
              {spouseIncome > 0 && (
                <ThemedText style={styles.netSub}>
                  Combined household: {fmt(breakdown.netPay + spouseIncome)}/mo
                </ThemedText>
              )}
            </View>

            {/* ── MONTHLY EXPENSES ── */}
            <View style={styles.card}>
              <SectionHeader label="MONTHLY EXPENSES (BUDGET)" color={Brand.accent} />
              {budgetWithEntries.length === 0 ? (
                <Pressable onPress={() => router.push('/budget' as any)} style={styles.noBudgetRow}>
                  <ThemedText style={styles.noBudgetText}>No budget entries yet — tap to add your expenses →</ThemedText>
                </Pressable>
              ) : (
                budgetWithEntries.map((cat) => (
                  <Row key={cat.id} label={`${cat.emoji} ${cat.name}`} value={fmt(cat.monthlyBudget)} />
                ))
              )}
              <Divider />
              <Row label="TOTAL EXPENSES" value={fmt(totalBudgeted)} bold accent={Brand.accent} />
            </View>

            {/* ── NET REMAINING ── */}
            <View style={[styles.card, styles.remainCard,
              { borderColor: netAfterExpenses !== null && netAfterExpenses >= 0
                  ? Brand.success + '60'
                  : '#E74C3C60' }]}>
              <SectionHeader
                label="NET AFTER ALL EXPENSES"
                color={netAfterExpenses !== null && netAfterExpenses >= 0 ? Brand.success : '#E74C3C'}
              />
              <Row
                label="Net Pay"
                value={fmt(breakdown.netPay)}
                dim
              />
              {spouseIncome > 0 && <Row label="Spouse Income" value={fmt(spouseIncome)} dim />}
              <Row
                label="Total Expenses"
                value={`− ${fmt(totalBudgeted)}`}
                dim
                accent="#E74C3C"
              />
              <Divider />
              <View style={styles.remainRow}>
                <ThemedText style={styles.remainLabel}>REMAINING</ThemedText>
                <ThemedText style={[
                  styles.remainValue,
                  { color: netAfterExpenses !== null && netAfterExpenses >= 0 ? Brand.success : '#E74C3C' },
                ]}>
                  {netAfterExpenses !== null ? fmtSigned(netAfterExpenses) : '—'}/mo
                </ThemedText>
              </View>
              {netAfterExpenses !== null && netAfterExpenses < 0 && (
                <View style={styles.warningBox}>
                  <ThemedText style={styles.warningText}>
                    ⚠️ Expenses exceed take-home pay. Review your budget.
                  </ThemedText>
                </View>
              )}
            </View>

            {/* ── INSTRUCTIONS ── */}
            <View style={styles.instructionsCard}>
              <ThemedText style={styles.instructionsTitle}>📋 HOW TO USE THIS WORKSHEET</ThemedText>
              <ThemedText style={styles.instructionsText}>
                This Financial Data Worksheet is generated from your profile data and is for personal use or voluntary disclosure to your chain of command. Tap <ThemedText style={styles.instructionsHighlight}>SHARE ↑</ThemedText> at the top to export as text and send via email, message, or print.{'\n\n'}
                All figures are estimates based on current DoD pay tables. This worksheet does not replace official LES data or financial counseling.
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', color: '#C8D8E8', letterSpacing: 1.5 },
  shareBtn: { width: 60, alignItems: 'flex-end' },
  shareText: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.two },

  // Identity block
  idBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.accent + '40',
    borderRadius: 6,
    padding: Spacing.three,
  },
  idLeft: { gap: 3 },
  idRight: { alignItems: 'flex-end', gap: 4 },
  idRank: { fontSize: 10, fontWeight: '800', color: Brand.accent, letterSpacing: 1 },
  idName: { fontSize: 20, fontWeight: '900', color: '#C8D8E8', letterSpacing: 0.3 },
  idBranch: { fontSize: 10, color: '#4D7A9A', fontWeight: '700', letterSpacing: 0.5 },
  idDate: { fontSize: 10, color: '#4D7A9A' },
  idStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  idDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.tactical },
  idStatusText: { fontSize: 9, color: Brand.tactical, fontWeight: '800', letterSpacing: 0.5 },

  idMeta: { marginTop: -Spacing.one },
  idMetaText: { fontSize: 10, color: '#3D6080', textAlign: 'center', letterSpacing: 0.5 },

  card: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 6,
    padding: Spacing.three,
  },

  netCard: {
    borderColor: Brand.success + '50',
    backgroundColor: '#041208',
  },
  netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  netLabel: { fontSize: 12, fontWeight: '900', color: Brand.success, letterSpacing: 0.5 },
  netValue: { fontSize: 22, fontWeight: '900', color: Brand.success, fontFamily: 'Courier New' },
  netSub: { fontSize: 10, color: '#4D9A6A', marginTop: 4 },

  remainCard: {
    borderWidth: 1,
    backgroundColor: '#060C14',
  },
  remainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
  remainLabel: { fontSize: 13, fontWeight: '900', color: '#C8D8E8', letterSpacing: 0.5 },
  remainValue: { fontSize: 26, fontWeight: '900', fontFamily: 'Courier New' },
  warningBox: {
    marginTop: Spacing.two,
    backgroundColor: '#E74C3C15',
    borderRadius: 4,
    padding: Spacing.two,
  },
  warningText: { fontSize: 11, color: '#E74C3C', textAlign: 'center' },

  noBudgetRow: { paddingVertical: Spacing.two },
  noBudgetText: { fontSize: 12, color: '#4D7A9A', fontStyle: 'italic' },

  incompleteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#1A1000',
    borderWidth: 1,
    borderColor: '#C9A84C50',
    borderRadius: 6,
    padding: Spacing.three,
  },
  incompleteIcon: { fontSize: 20 },
  incompleteTitle: { fontSize: 11, fontWeight: '800', color: '#C9A84C', letterSpacing: 0.3 },
  incompleteSub: { fontSize: 11, color: '#8A7040', marginTop: 2 },
  incompleteChevron: { fontSize: 22, color: '#C9A84C' },

  instructionsCard: {
    backgroundColor: '#04080F',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 6,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  instructionsTitle: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },
  instructionsText: { fontSize: 11, color: '#4D7A9A', lineHeight: 17 },
  instructionsHighlight: { color: Brand.tactical, fontWeight: '700' },
});
