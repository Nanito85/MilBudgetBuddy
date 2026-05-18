import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import {
  BRSResult,
  formatMoney,
  High3Result,
  lifetimeValue,
} from '@/features/retirement/utils/retirementCalc';

// ── High-3 Card ───────────────────────────────────────────────────────────────

interface High3Props {
  result: High3Result;
  retirementAge: number;
}

export function High3Card({ result, retirementAge }: High3Props) {
  const ltv = lifetimeValue(result.monthlyPension, retirementAge);
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.badge, { backgroundColor: Brand.primaryLight }]}>
        <ThemedText style={styles.badgeText}>HIGH-3</ThemedText>
      </View>

      <ThemedText style={styles.systemNote}>Legacy system · 2.5% × YOS multiplier</ThemedText>

      <View style={styles.bigRow}>
        <View style={styles.bigStat}>
          <ThemedText style={[styles.bigValue, { color: Brand.primary }]}>
            {formatMoney(result.monthlyPension)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">per month</ThemedText>
        </View>
        <View style={styles.bigStat}>
          <ThemedText style={[styles.bigValue, { color: Brand.primary }]}>
            {formatMoney(result.annualPension)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">per year</ThemedText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">Lifetime value (to age 80)</ThemedText>
        <ThemedText style={styles.detailValue}>{formatMoney(ltv, true)}</ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">High-3 avg basic pay</ThemedText>
        <ThemedText style={styles.detailValue}>{formatMoney(result.high3AvgPay)}/mo</ThemedText>
      </View>

      <View style={[styles.noteBox, { backgroundColor: `${Brand.primary}10` }]}>
        <ThemedText type="small" style={{ color: Brand.primaryLight, lineHeight: 18 }}>
          Cliff-vests at 20 years. No TSP government match. Available to members who entered service before Jan 1, 2018 and did not opt into BRS.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

// ── BRS Card ──────────────────────────────────────────────────────────────────

interface BRSProps {
  result: BRSResult;
  retirementAge: number;
  monthlyDiff: number;
}

export function BRSCard({ result, retirementAge, monthlyDiff }: BRSProps) {
  const ltv = lifetimeValue(result.monthlyPension, retirementAge);
  const totalWealth = ltv + result.tspBalance + result.continuationPayAmount;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.badge, { backgroundColor: Brand.accent }]}>
        <ThemedText style={styles.badgeText}>BRS</ThemedText>
      </View>

      <ThemedText style={styles.systemNote}>Blended system · 2.0% × YOS multiplier + TSP match</ThemedText>

      <View style={styles.bigRow}>
        <View style={styles.bigStat}>
          <ThemedText style={[styles.bigValue, { color: Brand.accent }]}>
            {formatMoney(result.monthlyPension)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">per month</ThemedText>
        </View>
        <View style={styles.bigStat}>
          <ThemedText style={[styles.bigValue, { color: Brand.accent }]}>
            {formatMoney(result.annualPension)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">per year</ThemedText>
        </View>
      </View>

      {monthlyDiff > 0 && (
        <View style={styles.pensionDiffRow}>
          <ThemedText type="small" style={{ color: Brand.danger }}>
            −{formatMoney(monthlyDiff)}/mo vs High-3 pension
          </ThemedText>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">TSP balance at retirement</ThemedText>
        <ThemedText style={[styles.detailValue, { color: Brand.success }]}>
          {formatMoney(result.tspBalance, true)}
        </ThemedText>
      </View>
      {result.continuationPayAmount > 0 && (
        <View style={styles.detailRow}>
          <ThemedText type="small" themeColor="textSecondary">Continuation pay (est.)</ThemedText>
          <ThemedText style={[styles.detailValue, { color: Brand.success }]}>
            {formatMoney(result.continuationPayAmount, true)}
          </ThemedText>
        </View>
      )}
      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">Monthly TSP contribution</ThemedText>
        <ThemedText style={styles.detailValue}>
          {formatMoney(result.totalMonthlyContrib)}/mo (you + gov't {result.govtMatchRatePct.toFixed(1)}%)
        </ThemedText>
      </View>
      <View style={styles.detailRow}>
        <ThemedText type="small" themeColor="textSecondary">Lifetime pension (to age 80)</ThemedText>
        <ThemedText style={styles.detailValue}>{formatMoney(ltv, true)}</ThemedText>
      </View>
      <View style={[styles.detailRow, styles.totalRow]}>
        <ThemedText style={{ fontWeight: '600' }}>Total wealth (pension + TSP)</ThemedText>
        <ThemedText style={[styles.detailValue, { color: Brand.accent, fontWeight: '800' }]}>
          {formatMoney(totalWealth, true)}
        </ThemedText>
      </View>

      <View style={[styles.noteBox, { backgroundColor: `${Brand.accent}10` }]}>
        <ThemedText type="small" style={{ color: Brand.accent, lineHeight: 18 }}>
          Default for members who entered service on or after Jan 1, 2018. TSP vests after 2 years of service.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one - 1,
  },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  systemNote: { fontSize: 12, opacity: 0.6 },
  bigRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.one },
  bigStat: { gap: 2 },
  bigValue: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  pensionDiffRow: { marginTop: -Spacing.one },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  totalRow: { paddingTop: Spacing.one, marginTop: Spacing.one - 2 },
  detailValue: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
  noteBox: { borderRadius: Spacing.two, padding: Spacing.two, marginTop: Spacing.one },
});
