import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PayGrade } from '@/data/bah-rates';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import {
  calcLeave,
  fmtDays,
  fmtMoney,
  fmtMoneyDec,
  MAX_PAYOUT_DAYS,
} from '@/features/leave/utils/leaveCalc';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';

// ── Result row ────────────────────────────────────────────────────────────────

function ResultRow({
  label,
  value,
  sub,
  accent,
  warn,
  dimmed,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
  dimmed?: boolean;
}) {
  const valueColor = accent ? Brand.accent : warn ? '#FF6B35' : undefined;
  return (
    <View style={styles.resultRow}>
      <View style={{ flex: 1 }}>
        <ThemedText
          style={[styles.resultLabel, dimmed && { opacity: 0.55 }]}
          themeColor={dimmed ? 'textSecondary' : undefined}>
          {label}
        </ThemedText>
        {sub ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.resultSub}>
            {sub}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText style={[styles.resultValue, !!valueColor && { color: valueColor }]}>
        {value}
      </ThemedText>
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function LeaveBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  return (
    <View style={styles.barWrapper}>
      <View style={styles.barLabelRow}>
        <ThemedText type="small" style={styles.barLabel}>{label}</ThemedText>
        <ThemedText type="small" style={[styles.barValue, { color }]}>{fmtDays(value)}</ThemedText>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function LeaveCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [grade, setGrade] = useState<PayGrade>('E5');
  const [yos, setYos] = useState(6);
  const [currentBalance, setCurrentBalance] = useState(30);
  const [monthsUntilEts, setMonthsUntilEts] = useState(12);
  const [plannedLeaveDays, setPlannedLeaveDays] = useState(10);
  const [terminalLeaveDays, setTerminalLeaveDays] = useState(30);
  const [useOrLoseExempt, setUseOrLoseExempt] = useState(false);

  const result = useMemo(
    () =>
      calcLeave({
        grade,
        yos,
        currentBalance,
        monthsUntilEts,
        plannedLeaveDays,
        terminalLeaveDays,
        useOrLoseExempt,
      }),
    [grade, yos, currentBalance, monthsUntilEts, plannedLeaveDays, terminalLeaveDays, useOrLoseExempt],
  );

  const {
    dailyRate,
    monthlyBasicPay,
    accrualTotal,
    projectedBalance,
    payableDays,
    payoutValue,
    terminalLeaveValue,
    terminalStartOffset,
    maxCarryover,
    uyLossRisk,
    uyWarning,
    totalLeaveValue,
    dataYear,
  } = result;

  return (
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
          <ThemedText style={styles.title}>Leave Calculator</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* ── BLUF ───────────────────────────────────────────────────────────── */}
        <ThemedView type="backgroundElement" style={styles.blufBox}>
          <ThemedText style={styles.blufTitle}>BLUF</ThemedText>
          <ThemedText type="small" style={{ lineHeight: 18 }}>
            You earn 2.5 days of leave per month (30 days/year). Balances above{' '}
            {maxCarryover} days are forfeited at fiscal year end (Sep 30). At separation
            you can cash out up to 60 days — or burn it on terminal leave and still
            receive full pay.
          </ThemedText>
        </ThemedView>

        {/* ── Use-or-Lose warning ────────────────────────────────────────────── */}
        {uyWarning && (
          <View style={styles.warnBox}>
            <ThemedText style={styles.warnTitle}>⚠ USE-OR-LOSE RISK</ThemedText>
            <ThemedText type="small" style={styles.warnBody}>
              You're on track to lose {fmtDays(uyLossRisk)} at the Sep 30 fiscal year end.
              Request leave soon or adjust your plan below.
            </ThemedText>
          </View>
        )}

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
              <NumberStepper
                label="Years of Service"
                value={yos}
                min={0}
                max={40}
                onChange={setYos}
                unit="yrs"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <NumberStepper
                label="Current Leave Balance"
                value={currentBalance}
                min={0}
                max={90}
                onChange={setCurrentBalance}
                unit="days"
              />
            </View>
          </ThemedView>
        </View>

        {/* ── ETS PLAN ───────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            ETS / SEPARATION PLAN
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <NumberStepper
                label="Months Until ETS"
                value={monthsUntilEts}
                min={1}
                max={60}
                onChange={setMonthsUntilEts}
                unit="mo"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <NumberStepper
                label="Planned Leave (before terminal)"
                value={plannedLeaveDays}
                min={0}
                max={60}
                onChange={setPlannedLeaveDays}
                unit="days"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <NumberStepper
                label="Terminal Leave Days"
                value={terminalLeaveDays}
                min={0}
                max={60}
                onChange={setTerminalLeaveDays}
                unit="days"
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                Terminal leave starts ~{terminalStartOffset.toFixed(1)} months from now.
                You receive full basic pay during terminal leave (DoD FMR Vol 7A Ch 35).
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Leave Carryover Exemption
              </ThemedText>
              <View style={styles.toggleRow}>
                {[false, true].map((val) => (
                  <Pressable
                    key={String(val)}
                    onPress={() => setUseOrLoseExempt(val)}
                    style={[styles.toggleBtn, useOrLoseExempt === val && styles.toggleBtnActive]}>
                    <ThemedText
                      style={[styles.toggleText, useOrLoseExempt === val && styles.toggleTextActive]}>
                      {val ? 'Special Leave Accrual (90 days)' : 'Standard (60 days)'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {useOrLoseExempt && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  SLA requires 120+ days in a combat zone/hostile-fire-pay area, or command approval
                  for operational necessity — it isn't automatic. Confirm your eligibility with S1.
                </ThemedText>
              )}
            </View>
          </ThemedView>
        </View>

        {/* ── LEAVE BALANCE VISUAL ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            BALANCE PROJECTION
          </ThemedText>
          <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded]}>
            <LeaveBar label="Current Balance" value={currentBalance} max={maxCarryover} color="#208AEF" />
            <LeaveBar label="Will Accrue" value={accrualTotal} max={maxCarryover} color="#00C8A8" />
            <LeaveBar label="Planned Use" value={plannedLeaveDays + terminalLeaveDays} max={maxCarryover} color="#C8A800" />
            <View style={styles.projDivider} />
            <LeaveBar
              label="Remaining at ETS (for payout)"
              value={Math.min(projectedBalance, MAX_PAYOUT_DAYS)}
              max={MAX_PAYOUT_DAYS}
              color={projectedBalance > MAX_PAYOUT_DAYS ? '#FF6B35' : Brand.accent}
            />
            {projectedBalance > MAX_PAYOUT_DAYS && (
              <ThemedText type="small" style={styles.capNote}>
                {fmtDays(projectedBalance - MAX_PAYOUT_DAYS)} above the 60-day payout cap will be forfeited — use it as terminal leave instead.
              </ThemedText>
            )}
          </ThemedView>
        </View>

        {/* ── DAILY RATE ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            DAILY PAY RATE
          </ThemedText>
          <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded]}>
            <ResultRow label="Monthly Basic Pay" value={fmtMoney(monthlyBasicPay)} />
            <ResultRow
              label="Daily Rate"
              value={fmtMoneyDec(dailyRate)}
              sub="Monthly basic pay ÷ 30 — used for both payout & terminal leave"
              accent
            />
          </ThemedView>
        </View>

        {/* ── PAYOUT vs TERMINAL ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            LEAVE VALUE AT SEPARATION
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ResultRow
                label="Paid-Out Leave"
                value={fmtMoney(payoutValue)}
                sub={`${fmtDays(payableDays)} × ${fmtMoneyDec(dailyRate)}/day — lump sum (37 U.S.C. §501, max ${MAX_PAYOUT_DAYS} days per career)`}
              />
              <ResultRow
                label="Terminal Leave Pay"
                value={fmtMoney(terminalLeaveValue)}
                sub={`${fmtDays(terminalLeaveDays)} on full pay — received as regular paychecks (DoD FMR Vol 7A Ch 35)`}
              />
              <View style={styles.totalDivider} />
              <ResultRow
                label="Total Leave Value"
                value={fmtMoney(totalLeaveValue)}
                accent
              />
            </View>
          </ThemedView>
        </View>

        {/* ── QUICK TIPS ─────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            KNOW YOUR OPTIONS
          </ThemedText>
          <ThemedView type="backgroundElement" style={[styles.card, styles.cardPadded]}>
            {[
              {
                icon: '💰',
                title: 'Cash Out vs Use',
                body: 'Taking terminal leave is almost always better than cashing out — you keep your full benefits (TRICARE, ID, etc.) during terminal leave.',
              },
              {
                icon: '📅',
                title: 'Use-or-Lose Deadline',
                body: `Sep 30 is the fiscal year end. Any balance above ${maxCarryover} days is forfeited. Request leave in August if you're cutting it close.`,
              },
              {
                icon: '🎯',
                title: 'Permissive TDY',
                body: 'You may be authorized up to 10 days of Permissive TDY for job search — this does NOT count against your leave balance.',
              },
              {
                icon: '🏥',
                title: 'Benefits During Terminal',
                body: 'TRICARE, commissary, and exchange access continue through your terminal leave end date, not your final day in the office.',
              },
            ].map((tip) => (
              <View key={tip.title} style={styles.tip}>
                <ThemedText style={styles.tipIcon}>{tip.icon}</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.tipBody}>
                    {tip.body}
                  </ThemedText>
                </View>
              </View>
            ))}
          </ThemedView>
        </View>

        {/* ── DISCLAIMER ─────────────────────────────────────────────────────── */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          Estimates based on FY{dataYear} basic pay rates. Leave balances and accrual rules
          governed by 10 USC §701 and DoD Instruction 1327.06. Max payout is 60 days across an
          entire career per 37 U.S.C. §501 — base pay only, no BAH/BAS/special pays. Leave payout
          is also subject to federal tax withholding, not shown here.
          Verify your exact balance and separation options with your unit S1 / personnel office.
        </ThemedText>
      </ScrollView>
    </ThemedView>
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
  warnBox: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.4)',
    padding: Spacing.three,
    gap: Spacing.one,
  },
  warnTitle: { fontSize: 13, fontWeight: '800', color: '#FF6B35', letterSpacing: 0.5 },
  warnBody: { lineHeight: 18, color: '#FF6B35' },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  toggleBtnActive: { backgroundColor: Brand.primary },
  toggleText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  toggleTextActive: { color: '#FFFFFF' },
  barWrapper: { gap: 5 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { fontWeight: '600', fontSize: 12 },
  barValue: { fontWeight: '700', fontSize: 12 },
  barBg: { height: 8, borderRadius: 4, backgroundColor: 'rgba(128,128,128,0.15)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  projDivider: { height: 1, backgroundColor: 'rgba(128,128,128,0.2)', marginVertical: 4 },
  capNote: { color: '#FF6B35', lineHeight: 17, fontSize: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 4 },
  resultLabel: { fontSize: 14, fontWeight: '500', flex: 1 },
  resultSub: { fontSize: 11, lineHeight: 15, marginTop: 1 },
  resultValue: { fontSize: 14, fontWeight: '700', minWidth: 90, textAlign: 'right' },
  totalDivider: { height: 1, backgroundColor: 'rgba(128,128,128,0.2)', marginVertical: 4 },
  tip: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start', paddingVertical: 4 },
  tipIcon: { fontSize: 18, width: 28, textAlign: 'center', marginTop: 1 },
  tipTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  tipBody: { lineHeight: 17, fontSize: 12 },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
});
