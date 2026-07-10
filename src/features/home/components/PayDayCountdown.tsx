import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { fmtPay } from '@/features/home/utils/lesCalc';
import { useThemeColors } from '@/hooks/use-theme';

interface Props {
  netPay: number;
}

function getPayDayInfo(): { label: string; daysAway: number; date: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const first = new Date(year, month, 1);
  const fifteenth = new Date(year, month, 15);

  // Adjust for weekends: if payday falls on weekend, it moves to the prior Friday
  function adjustedPayDay(d: Date): Date {
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day === 0) { const r = new Date(d); r.setDate(d.getDate() - 2); return r; }
    if (day === 6) { const r = new Date(d); r.setDate(d.getDate() - 1); return r; }
    return d;
  }

  const adj1st = adjustedPayDay(first);
  const adj15th = adjustedPayDay(fifteenth);

  // Next month's 1st
  const nextFirst = adjustedPayDay(new Date(year, month + 1, 1));

  const todayMidnight = new Date(year, month, today);

  function daysUntil(target: Date): number {
    return Math.round((target.getTime() - todayMidnight.getTime()) / 86400000);
  }

  const candidates: Array<{ label: string; date: Date }> = [
    { label: '1st', date: adj1st },
    { label: '15th', date: adj15th },
    { label: '1st', date: nextFirst },
  ];

  for (const c of candidates) {
    const d = daysUntil(c.date);
    if (d >= 0) return { ...c, daysAway: d };
  }

  // Fallback — should never reach
  return { label: '1st', date: nextFirst, daysAway: daysUntil(nextFirst) };
}

export function PayDayCountdown({ netPay }: Props) {
  const tc = useThemeColors();
  const { label, daysAway, date } = useMemo(() => getPayDayInfo(), []);

  const isToday = daysAway === 0;
  const isTomorrow = daysAway === 1;

  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: tc.surface }]}>
      <View style={styles.left}>
        <ThemedText style={styles.eyebrow}>NEXT PAY DAY</ThemedText>
        {isToday ? (
          <ThemedText style={[styles.countdownBig, { color: tc.textPrimary }]}>PAY DAY 🎉</ThemedText>
        ) : (
          <View style={styles.countdownRow}>
            <ThemedText style={[styles.countdownBig, { color: tc.textPrimary }]}>{daysAway}</ThemedText>
            <View style={styles.countdownSub}>
              <ThemedText style={styles.countdownUnit}>DAY{daysAway !== 1 ? 'S' : ''}</ThemedText>
              <ThemedText style={[styles.countdownLabel, { color: tc.textHint }]}>{isTomorrow ? 'TOMORROW' : `UNTIL ${label}`}</ThemedText>
            </View>
          </View>
        )}
        <ThemedText style={[styles.dateStr, { color: tc.textHint }]}>{dateStr}</ThemedText>
      </View>
      {netPay > 0 && (
        <View style={styles.right}>
          <ThemedText style={[styles.payLabel, { color: tc.textHint }]}>EST. TAKE-HOME</ThemedText>
          <ThemedText style={styles.payAmount}>{fmtPay(netPay / 2)}</ThemedText>
          <ThemedText style={[styles.payNote, { color: tc.textMuted }]}>per paycheck</ThemedText>
          <ThemedText style={[styles.payMonthly, { color: tc.textMuted }]}>{fmtPay(netPay)}/mo</ThemedText>
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
    color: Brand.tactical,
    fontFamily: 'monospace',
  },
  countdownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.one },
  countdownBig: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  countdownSub: { gap: 1, paddingBottom: 4 },
  countdownUnit: { fontSize: 10, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  countdownLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  dateStr: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  payLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  payAmount: { fontSize: 20, fontWeight: '900', color: Brand.accent },
  payNote: { fontSize: 8, fontWeight: '600' },
  payMonthly: { fontSize: 9, marginTop: 1 },
});
