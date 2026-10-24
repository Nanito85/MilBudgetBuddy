import React, { useEffect, useMemo, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { fmtPay } from '@/features/home/utils/lesCalc';
import { getPayDayInfo } from '@/features/home/utils/payScheduleCalc';
import { useThemeColors } from '@/hooks/use-theme';

interface Props {
  netPay: number;
  // Military retired pay is disbursed once a month (the 1st calendar day,
  // moved to the prior business day if the 1st falls on a weekend — DFAS
  // Retired & Annuitant Pay schedule) — NOT the active-duty 1st-and-15th
  // mid-month/end-of-month split. Defaults to the active-duty schedule so
  // every existing call site (none of which passed this before) keeps its
  // current behavior.
  isRetired?: boolean;
}

export function PayDayCountdown({ netPay, isRetired = false }: Props) {
  const tc = useThemeColors();
  // Recomputed when the calendar day changes. Memoizing on isRetired alone
  // kept "N days" frozen across midnight while the app stayed open (and
  // freezeOnBlur keeps Home mounted), so the count could be a day or more off.
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  useEffect(() => {
    const refresh = () => setDayKey(new Date().toDateString());
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') refresh(); });
    const timer = setInterval(refresh, 60_000);
    return () => { sub.remove(); clearInterval(timer); };
  }, []);
  // dayKey is only a recompute trigger; getPayDayInfo reads the clock itself.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { label, daysAway, date } = useMemo(() => getPayDayInfo(isRetired), [isRetired, dayKey]);

  const isToday = daysAway === 0;
  const isTomorrow = daysAway === 1;

  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: tc.surface }]}>
      <View style={styles.left}>
        <ThemedText style={[styles.eyebrow, { color: tc.tactical }]}>{isRetired ? 'NEXT RETIRED PAY DAY' : 'NEXT PAY DAY'}</ThemedText>
        {isToday ? (
          <ThemedText style={[styles.countdownBig, { color: tc.textPrimary }]}>PAY DAY 🎉</ThemedText>
        ) : (
          <View style={styles.countdownRow}>
            <ThemedText style={[styles.countdownBig, { color: tc.textPrimary }]}>{daysAway}</ThemedText>
            <View style={styles.countdownSub}>
              <ThemedText style={[styles.countdownUnit, { color: tc.tactical }]}>DAY{daysAway !== 1 ? 'S' : ''}</ThemedText>
              <ThemedText style={[styles.countdownLabel, { color: tc.textHint }]}>{isTomorrow ? 'TOMORROW' : `UNTIL ${label}`}</ThemedText>
            </View>
          </View>
        )}
        <ThemedText style={[styles.dateStr, { color: tc.textHint }]}>{dateStr}</ThemedText>
      </View>
      {netPay > 0 && (
        <View style={styles.right}>
          <ThemedText style={[styles.payLabel, { color: tc.textHint }]}>{isRetired ? 'EST. MONTHLY NET' : 'EST. TAKE-HOME'}</ThemedText>
          {isRetired ? (
            <ThemedText style={[styles.payAmount, { color: tc.accent }]}>{fmtPay(netPay)}</ThemedText>
          ) : (
            <>
              <ThemedText style={[styles.payAmount, { color: tc.accent }]}>{fmtPay(netPay / 2)}</ThemedText>
              <ThemedText style={[styles.payNote, { color: tc.textMuted }]}>per paycheck</ThemedText>
              <ThemedText style={[styles.payMonthly, { color: tc.textMuted }]}>{fmtPay(netPay)}/mo</ThemedText>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Brand.tactical + '40',
    borderRadius: 4,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: { flex: 1, gap: 2 },
  eyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  countdownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.one },
  countdownBig: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  countdownSub: { gap: 1, paddingBottom: 4 },
  countdownUnit: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  countdownLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateStr: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  payLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  payAmount: { fontSize: 20, fontWeight: '900' },
  payNote: { fontSize: 8, fontWeight: '600' },
  payMonthly: { fontSize: 9, marginTop: 1 },
});
