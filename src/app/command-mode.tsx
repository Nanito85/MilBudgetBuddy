import { useRouter } from 'expo-router';
import React, { useMemo, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { calcLES } from '@/features/home/utils/lesCalc';
import { calcPayoff, fmtDate as fmtPayoffDate, fmtMonths } from '@/features/debt/utils/debtCalc';
import { useThemeColors } from '@/hooks/use-theme';
import { useBudgetStore } from '@/store/budget.store';
import { useDebtStore } from '@/store/debt.store';
import { useNetWorthStore } from '@/store/networth.store';
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
  const tc = useThemeColors();
  return (
    <View style={[row.wrap, indent && row.indent]}>
      <ThemedText style={[row.label, { color: tc.textSecondary }, dim && { color: tc.textHint }, bold && row.boldText]}>{label}</ThemedText>
      <ThemedText style={[row.value, { color: tc.textPrimary }, dim && { color: tc.textHint }, bold && row.boldText, accent ? { color: accent } : null]}>
        {value}
      </ThemedText>
    </View>
  );
}

const row = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  indent: { paddingLeft: Spacing.three },
  label: { fontSize: 12, flex: 1 },
  value: { fontSize: 12, fontWeight: '700', fontFamily: 'Courier New' },
  boldText: { fontWeight: '900' },
});

function Divider({ label }: { label?: string }) {
  const tc = useThemeColors();
  return (
    <View style={div.wrap}>
      <View style={[div.line, { backgroundColor: tc.borderColor }]} />
      {label && <ThemedText style={[div.label, { color: tc.textMuted }]}>{label}</ThemedText>}
      {label && <View style={[div.line, { backgroundColor: tc.borderColor }]} />}
    </View>
  );
}

const div = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: Spacing.one + 2 },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
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
  const tc = useThemeColors();

  // User data
  const branch       = useUserStore((s) => s.branch);
  const payGrade     = useUserStore((s) => s.payGrade);
  const rankVariant  = useUserStore((s) => s.rankVariant);
  const lastName     = useUserStore((s) => s.lastName);
  const nickname     = useUserStore((s) => s.nickname);
  const yos          = useUserStore((s) => s.yos);
  const mhaZip       = useUserStore((s) => s.mhaZip);
  const dutyStationId = useUserStore((s) => s.dutyStationId);
  const hasSpouse    = useUserStore((s) => s.hasSpouse);
  const housingStatus = useUserStore((s) => s.housingStatus);
  const numChildren  = useUserStore((s) => s.numChildren);
  const tspContribPct   = useUserStore((s) => s.tspContribPct);
  const rothTspPct      = useUserStore((s) => s.rothTspPct);
  const hasDentalFamily = useUserStore((s) => s.hasDentalFamily);
  const sglOptOut    = useUserStore((s) => s.sglOptOut);
  const stateResidence  = useUserStore((s) => s.stateResidence);
  const specialPays  = useUserStore((s) => s.specialPays);
  const lesOverrides    = useUserStore((s) => s.lesOverrides);
  const setLesOverrides = useUserStore((s) => s.setLesOverrides);
  const serviceStatus   = useUserStore((s) => s.serviceStatus);
  const spouseIncome = useUserStore((s) => s.spouseMonthlyIncome);

  // Add custom item state
  const [addingType, setAddingType] = useState<'income' | 'deduction' | null>(null);
  const [addLabel, setAddLabel]     = useState('');
  const [addAmount, setAddAmount]   = useState('');

  const commitAdd = () => {
    const amount = parseFloat(addAmount);
    if (!addLabel.trim() || isNaN(amount) || amount <= 0) return;
    const item = { id: `${Date.now()}`, label: addLabel.trim(), amount };
    if (addingType === 'income') {
      setLesOverrides({ ...lesOverrides, extraIncome: [...(lesOverrides.extraIncome ?? []), item] });
    } else {
      setLesOverrides({ ...lesOverrides, extraDeductions: [...(lesOverrides.extraDeductions ?? []), item] });
    }
    setAddLabel(''); setAddAmount(''); setAddingType(null);
  };

  const removeExtraItem = (type: 'income' | 'deduction', id: string) => {
    if (type === 'income') {
      setLesOverrides({ ...lesOverrides, extraIncome: (lesOverrides.extraIncome ?? []).filter((i) => i.id !== id) });
    } else {
      setLesOverrides({ ...lesOverrides, extraDeductions: (lesOverrides.extraDeductions ?? []).filter((i) => i.id !== id) });
    }
  };

  // Budget
  const budgetCategories = useBudgetStore((s) => s.categories);
  useEffect(() => {
    useBudgetStore.getState().hydrate();
    useDebtStore.getState().hydrate();
    useNetWorthStore.getState().hydrate();
  }, []);

  // Debt
  const debts = useDebtStore((s) => s.debts);
  const debtExtraMonthly = useDebtStore((s) => s.extraMonthly);
  const totalDebt = useMemo(() => debts.reduce((s, d) => s + d.balance, 0), [debts]);
  const debtPayoff = useMemo(() => calcPayoff(debts, debtExtraMonthly, 'avalanche'), [debts, debtExtraMonthly]);

  // Net worth
  const nwEntries = useNetWorthStore((s) => s.entries);
  const nwAssets = useMemo(() => nwEntries.filter((e) => e.category === 'asset'), [nwEntries]);
  const nwLiabilities = useMemo(() => nwEntries.filter((e) => e.category === 'liability'), [nwEntries]);
  const totalAssets = useMemo(() => nwAssets.reduce((s, e) => s + e.amount, 0), [nwAssets]);
  const totalLiabilities = useMemo(() => nwLiabilities.reduce((s, e) => s + e.amount, 0), [nwLiabilities]);
  const netWorthValue = totalAssets - totalLiabilities;

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
      payGrade, yos, mhaZip, dutyStationId, hasSpouse, housingStatus, specialPaysTotal,
      tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence,
      overrides: lesOverrides, serviceStatus,
    });
  }, [payGrade, yos, mhaZip, dutyStationId, hasSpouse, housingStatus, specialPaysTotal, tspContribPct, rothTspPct, hasDentalFamily, sglOptOut, stateResidence, lesOverrides, serviceStatus]);

  const totalBudgeted = useMemo(
    () => budgetCategories.reduce((s, c) => s + c.monthlyBudget, 0),
    [budgetCategories],
  );

  const budgetWithEntries = budgetCategories.filter((c) => c.monthlyBudget > 0);

  const netAfterExpenses = breakdown
    ? breakdown.netPay + spouseIncome - totalBudgeted
    : null;

  const handleShare = async () => {
    if (!breakdown) {
      Alert.alert('Profile Incomplete', 'Complete your profile first to generate this worksheet.');
      return;
    }

    const row = (label: string, value: string, bold = false) =>
      `<tr><td style="padding:4px 8px;color:#555;font-size:12px;${bold ? 'font-weight:700;' : ''}">${label}</td><td style="padding:4px 8px;text-align:right;font-family:monospace;font-size:12px;${bold ? 'font-weight:700;' : ''}">${value}</td></tr>`;

    const sectionHeader = (label: string, color: string) =>
      `<tr><td colspan="2" style="padding:6px 8px 2px;font-size:10px;font-weight:800;letter-spacing:1px;color:${color};border-top:1px solid #ddd;text-transform:uppercase;">${label}</td></tr>`;

    const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #222; }
  .header { border-bottom: 3px solid #1565C0; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { margin: 0 0 4px; font-size: 18px; color: #1565C0; letter-spacing: 1px; }
  .header .member { font-size: 22px; font-weight: 900; margin: 4px 0; }
  .header .meta { font-size: 11px; color: #777; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .net-row td { font-size: 15px; font-weight: 900; color: #1565C0; border-top: 2px solid #1565C0; padding-top: 8px; }
  .final-row td { font-size: 16px; font-weight: 900; border-top: 3px double #222; padding-top: 8px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9px; color: #999; }
</style>
</head><body>
<div class="header">
  <h1>COMMAND FINANCIAL READINESS WORKSHEET</h1>
  <div class="member">${rankAbbrev} ${lastName?.toUpperCase() ?? displayName}</div>
  <div class="meta">
    ${branchLabel.toUpperCase()} · ${payGrade ?? '—'} · ${yos} YRS SERVICE · ${hasSpouse ? 'MARRIED' : 'SINGLE'} · ${numChildren} DEPENDENT(S)<br/>
    Date: ${today}
  </div>
</div>

<table>
  ${sectionHeader('GROSS MONTHLY INCOME', '#2E7D32')}
  ${row('Base Pay', fmt(breakdown.basePay))}
  ${row('BAH (Housing Allowance)', fmt(breakdown.bah))}
  ${row('BAS (Subsistence Allowance)', fmt(breakdown.bas))}
  ${breakdown.specialPays > 0 ? specialPays.map((p) => row('· ' + (p.customLabel ?? SPECIAL_PAY_LABELS[p.type]), fmt(p.monthlyAmount))).join('') : ''}
  ${breakdown.extraIncomeItems.map((i) => row('· ' + i.label, fmt(i.amount))).join('')}
  ${spouseIncome > 0 ? row('Spouse / Household Income', fmt(spouseIncome)) : ''}
  ${row('TOTAL GROSS', fmt(breakdown.grossPay + spouseIncome), true)}

  ${sectionHeader('DEDUCTIONS', '#B71C1C')}
  ${row('Federal Income Tax (est.)', fmt(breakdown.fedTax))}
  ${breakdown.stateTax > 0 ? row('State Income Tax (est.)', fmt(breakdown.stateTax)) : ''}
  ${row('FICA (Social Security + Medicare)', fmt(breakdown.fica))}
  ${breakdown.traditionalTsp > 0 ? row(`Traditional TSP (${tspContribPct}%)`, fmt(breakdown.traditionalTsp)) : ''}
  ${breakdown.rothTsp > 0 ? row(`Roth TSP (${rothTspPct}%)`, fmt(breakdown.rothTsp)) : ''}
  ${breakdown.sgli > 0 ? row('SGLI Premium', fmt(breakdown.sgli)) : ''}
  ${breakdown.dental > 0 ? row('TDP Dental (Family)', fmt(breakdown.dental)) : ''}
  ${breakdown.extraDeductionItems.map((i) => row('· ' + i.label, fmt(i.amount))).join('')}
  ${row('TOTAL DEDUCTIONS', fmt(breakdown.totalDeductions), true)}
</table>

<table>
  <tr class="net-row">
    <td>NET TAKE-HOME PAY</td>
    <td style="text-align:right;font-family:monospace;">${fmt(breakdown.netPay)}</td>
  </tr>
</table>

<table>
  ${sectionHeader('MONTHLY BUDGET (EXPENSES)', '#C8A800')}
  ${budgetWithEntries.length === 0
    ? '<tr><td colspan="2" style="padding:4px 8px;color:#999;font-size:11px;">No budget entries on file.</td></tr>'
    : budgetWithEntries.map((c) => row(`${c.emoji} ${c.name}`, fmt(c.monthlyBudget))).join('')}
  ${row('TOTAL EXPENSES', fmt(totalBudgeted), true)}
</table>

<table>
  <tr class="final-row">
    <td>NET AFTER ALL EXPENSES</td>
    <td style="text-align:right;font-family:monospace;color:${(netAfterExpenses ?? 0) >= 0 ? '#2E7D32' : '#B71C1C'};">
      ${netAfterExpenses !== null ? ((netAfterExpenses >= 0 ? '+' : '') + fmt(netAfterExpenses)) : '—'}/mo
    </td>
  </tr>
</table>

<table>
  ${sectionHeader('DEBT PAYOFF PLAN', '#B71C1C')}
  ${debts.length === 0
    ? '<tr><td colspan="2" style="padding:4px 8px;color:#999;font-size:11px;">No debts on file.</td></tr>'
    : debts.map((d) => row(`${d.name} (${d.apr}% APR)`, fmt(d.balance))).join('')}
  ${row('TOTAL DEBT BALANCE', fmt(totalDebt), true)}
  ${debtPayoff ? row('Monthly Payoff Payment', fmt(debtPayoff.monthlyCost)) : ''}
  ${debtPayoff ? row('Debt-Free Date (avalanche)', `${fmtMonths(debtPayoff.totalMonths)} — ${fmtPayoffDate(debtPayoff.payoffDate)}`) : ''}
  ${debtPayoff ? row('Total Interest Paid (est.)', fmt(debtPayoff.totalInterest)) : ''}
</table>

<table>
  ${sectionHeader('NET WORTH', '#1565C0')}
  ${nwAssets.filter((e) => e.amount > 0).map((e) => row(e.label, fmt(e.amount))).join('')}
  ${row('TOTAL ASSETS', fmt(totalAssets), true)}
  ${nwLiabilities.filter((e) => e.amount > 0).map((e) => row(e.label, fmt(e.amount))).join('')}
  ${row('TOTAL LIABILITIES', fmt(totalLiabilities), true)}
  <tr class="net-row">
    <td>NET WORTH</td>
    <td style="text-align:right;font-family:monospace;color:${netWorthValue >= 0 ? '#2E7D32' : '#B71C1C'};">
      ${netWorthValue < 0 ? '-' : ''}${fmt(Math.abs(netWorthValue))}
    </td>
  </tr>
</table>

<div class="footer">
  Generated by MilBudgetBuddy · milbudgetbuddy.com · ${today}<br/>
  All figures are estimates based on FY2026 DoD pay tables and self-reported data.
  This worksheet does not replace an official LES from myPay.dfas.mil.
  Data is self-reported and not verified by the command or DFAS.
</div>
</body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Financial Readiness Worksheet',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch {
      Alert.alert('Error', 'Could not generate PDF. Try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={[styles.header, { borderBottomColor: tc.borderColor }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[styles.title, { color: tc.textPrimary }]}>FINANCIAL READINESS</ThemedText>
          <Pressable onPress={handleShare} style={styles.shareBtn}>
            <ThemedText style={styles.shareText}>PDF ↑</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Identity block */}
        <View style={[styles.idBlock, { backgroundColor: tc.surface }]}>
          <View style={styles.idLeft}>
            <ThemedText style={styles.idRank}>{rankAbbrev || '—'}</ThemedText>
            <ThemedText style={[styles.idName, { color: tc.textPrimary }]}>{displayName}</ThemedText>
            <ThemedText style={[styles.idBranch, { color: tc.textHint }]}>{branchLabel.toUpperCase()} {payGrade ? `· ${payGrade}` : ''}</ThemedText>
          </View>
          <View style={styles.idRight}>
            <ThemedText style={[styles.idDate, { color: tc.textHint }]}>{today}</ThemedText>
            <View style={styles.idStatus}>
              <View style={styles.idDot} />
              <ThemedText style={styles.idStatusText}>FOR COMMAND USE</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.idMeta}>
          <ThemedText style={[styles.idMetaText, { color: tc.textMuted }]}>YOS: {yos} · {hasSpouse ? 'MARRIED' : 'SINGLE'} · {numChildren} DEP{numChildren !== 1 ? 'S' : ''}</ThemedText>
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
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
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
                <View key={item.id} style={styles.extraItemRow}>
                  <Row label={item.label} value={fmt(item.amount)} indent dim />
                  <Pressable onPress={() => removeExtraItem('income', item.id)} hitSlop={8}>
                    <ThemedText style={styles.removeX}>✕</ThemedText>
                  </Pressable>
                </View>
              ))}
              {addingType === 'income' ? (
                <View style={styles.addItemForm}>
                  <TextInput value={addLabel} onChangeText={setAddLabel} placeholder="Label (e.g. Side Income)" placeholderTextColor={tc.textMuted} style={[styles.addItemInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]} autoFocus />
                  <TextInput value={addAmount} onChangeText={setAddAmount} placeholder="Amount" placeholderTextColor={tc.textMuted} keyboardType="decimal-pad" style={[styles.addItemInput, styles.addItemAmtInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]} />
                  <View style={styles.addItemBtns}>
                    <Pressable onPress={() => { setAddingType(null); setAddLabel(''); setAddAmount(''); }} style={[styles.addItemCancel, { borderColor: tc.borderColor }]}>
                      <ThemedText style={[styles.addItemCancelText, { color: tc.textHint }]}>Cancel</ThemedText>
                    </Pressable>
                    <Pressable onPress={commitAdd} style={styles.addItemConfirm}>
                      <ThemedText style={styles.addItemConfirmText}>Add</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setAddingType('income')} style={styles.addItemBtn}>
                  <ThemedText style={styles.addItemBtnText}>+ Add Income Item</ThemedText>
                </Pressable>
              )}

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
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
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
              {breakdown.dental > 0 && <Row label="TDP Dental (Family)" value={fmt(breakdown.dental)} />}
              {breakdown.extraDeductionItems.map((item) => (
                <View key={item.id} style={styles.extraItemRow}>
                  <Row label={item.label} value={fmt(item.amount)} dim />
                  <Pressable onPress={() => removeExtraItem('deduction', item.id)} hitSlop={8}>
                    <ThemedText style={styles.removeX}>✕</ThemedText>
                  </Pressable>
                </View>
              ))}
              {addingType === 'deduction' ? (
                <View style={styles.addItemForm}>
                  <TextInput value={addLabel} onChangeText={setAddLabel} placeholder="Label (e.g. Allotment)" placeholderTextColor={tc.textMuted} style={[styles.addItemInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]} autoFocus />
                  <TextInput value={addAmount} onChangeText={setAddAmount} placeholder="Amount" placeholderTextColor={tc.textMuted} keyboardType="decimal-pad" style={[styles.addItemInput, styles.addItemAmtInput, { backgroundColor: tc.inputBg, borderColor: tc.borderColor, color: tc.textPrimary }]} />
                  <View style={styles.addItemBtns}>
                    <Pressable onPress={() => { setAddingType(null); setAddLabel(''); setAddAmount(''); }} style={[styles.addItemCancel, { borderColor: tc.borderColor }]}>
                      <ThemedText style={[styles.addItemCancelText, { color: tc.textHint }]}>Cancel</ThemedText>
                    </Pressable>
                    <Pressable onPress={commitAdd} style={styles.addItemConfirm}>
                      <ThemedText style={styles.addItemConfirmText}>Add</ThemedText>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => setAddingType('deduction')} style={styles.addItemBtn}>
                  <ThemedText style={styles.addItemBtnText}>+ Add Deduction</ThemedText>
                </Pressable>
              )}
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
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <SectionHeader label="MONTHLY EXPENSES (BUDGET)" color={Brand.accent} />
              {budgetWithEntries.length === 0 ? (
                <Pressable onPress={() => router.push('/budget' as any)} style={styles.noBudgetRow}>
                  <ThemedText style={[styles.noBudgetText, { color: tc.textHint }]}>No budget entries yet — tap to add your expenses →</ThemedText>
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
              { backgroundColor: tc.surface,
                borderColor: netAfterExpenses !== null && netAfterExpenses >= 0
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
                <ThemedText style={[styles.remainLabel, { color: tc.textPrimary }]}>REMAINING</ThemedText>
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

            {/* ── DEBT PAYOFF PLAN ── */}
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <SectionHeader label="DEBT PAYOFF PLAN" color="#E74C3C" />
              {debts.length === 0 ? (
                <Pressable onPress={() => router.push('/debt-payoff' as any)} style={styles.noBudgetRow}>
                  <ThemedText style={[styles.noBudgetText, { color: tc.textHint }]}>No debts on file — tap to add your debts →</ThemedText>
                </Pressable>
              ) : (
                <>
                  {debts.map((d) => (
                    <Row key={d.id} label={`${d.name} (${d.apr}% APR)`} value={fmt(d.balance)} />
                  ))}
                  <Divider />
                  <Row label="TOTAL DEBT BALANCE" value={fmt(totalDebt)} bold accent="#E74C3C" />
                  {debtPayoff && (
                    <>
                      <Row label="Monthly Payoff Payment" value={fmt(debtPayoff.monthlyCost)} dim />
                      <Row label="Debt-Free By" value={`${fmtMonths(debtPayoff.totalMonths)} · ${fmtPayoffDate(debtPayoff.payoffDate)}`} dim />
                      <Row label="Total Interest (est.)" value={fmt(debtPayoff.totalInterest)} dim />
                    </>
                  )}
                </>
              )}
            </View>

            {/* ── NET WORTH ── */}
            <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
              <SectionHeader label="NET WORTH" color="#1565C0" />
              {totalAssets === 0 && totalLiabilities === 0 ? (
                <Pressable onPress={() => router.push('/net-worth' as any)} style={styles.noBudgetRow}>
                  <ThemedText style={[styles.noBudgetText, { color: tc.textHint }]}>Not tracked yet — tap to log assets & debts →</ThemedText>
                </Pressable>
              ) : (
                <>
                  {nwAssets.filter((e) => e.amount > 0).map((e) => (
                    <Row key={e.id} label={e.label} value={fmt(e.amount)} indent dim />
                  ))}
                  <Row label="TOTAL ASSETS" value={fmt(totalAssets)} bold accent={Brand.success} />
                  <Divider />
                  {nwLiabilities.filter((e) => e.amount > 0).map((e) => (
                    <Row key={e.id} label={e.label} value={fmt(e.amount)} indent dim />
                  ))}
                  <Row label="TOTAL LIABILITIES" value={fmt(totalLiabilities)} bold accent="#E74C3C" />
                  <Divider />
                  <Row
                    label="NET WORTH"
                    value={`${netWorthValue < 0 ? '-' : ''}${fmt(Math.abs(netWorthValue))}`}
                    bold
                    accent={netWorthValue >= 0 ? Brand.success : '#E74C3C'}
                  />
                </>
              )}
            </View>

            {/* ── INSTRUCTIONS ── */}
            <View style={[styles.instructionsCard, { backgroundColor: tc.background, borderColor: tc.borderColor }]}>
              <ThemedText style={styles.instructionsTitle}>📋 HOW TO USE THIS WORKSHEET</ThemedText>
              <ThemedText style={[styles.instructionsText, { color: tc.textHint }]}>
                This Financial Data Worksheet is generated from your profile data and is for personal use or voluntary disclosure to your chain of command. Tap <ThemedText style={styles.instructionsHighlight}>SHARE ↑</ThemedText> at the top to export as text and send via email, message, or print.{'\n\n'}
                All figures are estimates based on current DoD pay tables. This worksheet does not replace official LES data or financial counseling.
              </ThemedText>
            </View>
          </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  shareBtn: { width: 60, alignItems: 'flex-end' },
  shareText: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.two },

  // Identity block
  idBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Brand.accent + '40',
    borderRadius: 6,
    padding: Spacing.three,
  },
  idLeft: { gap: 3 },
  idRight: { alignItems: 'flex-end', gap: 4 },
  idRank: { fontSize: 10, fontWeight: '800', color: Brand.accent, letterSpacing: 1 },
  idName: { fontSize: 20, fontWeight: '900', letterSpacing: 0.3 },
  idBranch: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  idDate: { fontSize: 10 },
  idStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  idDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.tactical },
  idStatusText: { fontSize: 9, color: Brand.tactical, fontWeight: '800', letterSpacing: 0.5 },

  idMeta: { marginTop: -Spacing.one },
  idMetaText: { fontSize: 10, textAlign: 'center', letterSpacing: 0.5 },

  card: {
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  remainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.one },
  remainLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  remainValue: { fontSize: 26, fontWeight: '900', fontFamily: 'Courier New' },
  warningBox: {
    marginTop: Spacing.two,
    backgroundColor: '#E74C3C15',
    borderRadius: 4,
    padding: Spacing.two,
  },
  warningText: { fontSize: 11, color: '#E74C3C', textAlign: 'center' },

  noBudgetRow: { paddingVertical: Spacing.two },
  noBudgetText: { fontSize: 12, fontStyle: 'italic' },

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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  instructionsTitle: { fontSize: 11, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.5 },
  instructionsText: { fontSize: 11, lineHeight: 17 },
  instructionsHighlight: { color: Brand.tactical, fontWeight: '700' },

  extraItemRow: { flexDirection: 'row', alignItems: 'center' },
  removeX: { fontSize: 12, color: '#E74C3C', paddingLeft: Spacing.two, fontWeight: '700' },
  addItemBtn: { paddingVertical: Spacing.two, alignItems: 'flex-start' },
  addItemBtnText: { fontSize: 11, color: Brand.tactical, fontWeight: '700', letterSpacing: 0.3 },
  addItemForm: { gap: Spacing.two, paddingTop: Spacing.one },
  addItemInput: {
    borderWidth: 1,
    borderRadius: 6, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.one + 4,
    fontSize: 13,
  },
  addItemAmtInput: { width: 140 },
  addItemBtns: { flexDirection: 'row', gap: Spacing.two },
  addItemCancel: { flex: 1, borderWidth: 1, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  addItemCancelText: { fontSize: 12, fontWeight: '700' },
  addItemConfirm: { flex: 1, backgroundColor: Brand.tactical, borderRadius: 4, padding: Spacing.two, alignItems: 'center' },
  addItemConfirmText: { fontSize: 12, color: '#FFFFFF', fontWeight: '800' },
});
