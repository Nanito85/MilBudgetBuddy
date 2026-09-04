import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

const ROTH_ANNUAL_LIMIT = 7500;
const ROTH_MONTHLY_LIMIT = Math.round(ROTH_ANNUAL_LIMIT / 12); // 625

const GROWTH_RATE = 0.07; // 7% annual

function fv(monthly: number, annualRate: number, years: number): number {
  if (monthly <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

function fvWithBalance(balance: number, monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  const balanceGrowth = balance * Math.pow(1 + r, n);
  return balanceGrowth + fv(monthly, annualRate, years);
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

function Stepper({ label, value, step, min, max, onChange }: {
  label: string; value: number; step: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  const tc = useThemeColors();
  return (
    <View style={styles.stepperRow}>
      <ThemedText style={[styles.stepperLabel, { color: tc.textHint }]}>{label}</ThemedText>
      <View style={styles.stepperControls}>
        <Pressable style={[styles.stepBtn, { borderColor: tc.borderColor, backgroundColor: tc.background }]} onPress={() => onChange(Math.max(min, value - step))}>
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <ThemedText style={[styles.stepperValue, { color: tc.textPrimary }]}>{fmt(value)}</ThemedText>
        <Pressable style={[styles.stepBtn, { borderColor: tc.borderColor, backgroundColor: tc.background }]} onPress={() => onChange(Math.min(max, value + step))}>
          <ThemedText style={styles.stepBtnText}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function ProjectionBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const tc = useThemeColors();
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.projRow}>
      <ThemedText style={[styles.projLabel, { color: tc.textHint }]}>{label}</ThemedText>
      <View style={[styles.projTrack, { backgroundColor: tc.surface }]}>
        <View style={[styles.projFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <ThemedText style={[styles.projValue, { color }]}>{fmt(value)}</ThemedText>
    </View>
  );
}

export default function RothIraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [balance, setBalance]  = useState(5000);
  const [monthly, setMonthly]  = useState(ROTH_MONTHLY_LIMIT);
  const [age, setAge]          = useState(22);

  const yearsTo20  = Math.max(0, 20);
  const yearsTo30  = Math.max(0, 30);
  const yearsTo595 = Math.max(0, 59 - age);

  const v20   = useMemo(() => fvWithBalance(balance, monthly, GROWTH_RATE, yearsTo20), [balance, monthly, yearsTo20]);
  const v30   = useMemo(() => fvWithBalance(balance, monthly, GROWTH_RATE, yearsTo30), [balance, monthly, yearsTo30]);
  const v595  = useMemo(() => fvWithBalance(balance, monthly, GROWTH_RATE, yearsTo595), [balance, monthly, yearsTo595, age]);

  const annualContrib = monthly * 12;
  const headroom = Math.max(0, ROTH_ANNUAL_LIMIT - annualContrib);
  const headroomColor = headroom <= 0 ? Brand.success : headroom < 2000 ? Brand.warning : Brand.danger;
  const maxVal = Math.max(v20, v30, v595);

  // Traditional comparison — assumes 22% bracket on withdrawal
  const tradV20  = v20 * 0.78;
  const tradV30  = v30 * 0.78;
  const tradV595 = v595 * 0.78;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Roth IRA Tracker</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>SINGLE SERVICE MEMBER</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>Roth IRA Growth Engine</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
            Start early. Military pay is low — so is your tax bracket. Roth is the best deal the IRS offers junior enlisted.
          </ThemedText>
        </ThemedView>

        {/* Inputs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR NUMBERS</ThemedText>
          <Stepper label="Current Roth IRA balance" value={balance} step={500} min={0} max={100000} onChange={setBalance} />
          <Stepper label="Monthly contribution" value={monthly} step={50} min={0} max={ROTH_MONTHLY_LIMIT} onChange={setMonthly} />
          <Stepper label="Your age" value={age} step={1} min={17} max={55} onChange={(v) => setAge(v)} />
        </ThemedView>

        {/* Headroom */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>2026 CONTRIBUTION HEADROOM</ThemedText>
          <View style={styles.headroomRow}>
            <View style={styles.headroomItem}>
              <ThemedText style={[styles.headroomItemLabel, { color: tc.textMuted }]}>LIMIT</ThemedText>
              <ThemedText style={[styles.headroomItemValue, { color: tc.textPrimary }]}>{fmt(ROTH_ANNUAL_LIMIT)}/yr</ThemedText>
            </View>
            <View style={styles.headroomItem}>
              <ThemedText style={[styles.headroomItemLabel, { color: tc.textMuted }]}>ON PACE FOR</ThemedText>
              <ThemedText style={[styles.headroomItemValue, { color: tc.textPrimary }]}>{fmt(annualContrib)}/yr</ThemedText>
            </View>
            <View style={styles.headroomItem}>
              <ThemedText style={[styles.headroomItemLabel, { color: tc.textMuted }]}>HEADROOM</ThemedText>
              <ThemedText style={[styles.headroomItemValue, { color: headroomColor }]}>
                {fmt(headroom)}/yr
              </ThemedText>
            </View>
          </View>
          <View style={[styles.headroomTrack, { backgroundColor: tc.surface }]}>
            <View style={[styles.headroomFill, {
              width: `${Math.min(100, (annualContrib / ROTH_ANNUAL_LIMIT) * 100)}%` as any,
              backgroundColor: headroom <= 0 ? Brand.success : Brand.tactical,
            }]} />
          </View>
          {headroom <= 0 && (
            <ThemedText style={styles.maxedText}>🎖️ MAXED OUT — outstanding execution.</ThemedText>
          )}
        </ThemedView>

        {/* Projections */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>TAX-FREE GROWTH PROJECTIONS (7% avg)</ThemedText>
          <ProjectionBar label="20 years" value={v20} max={maxVal} color={Brand.primary} />
          <ProjectionBar label="30 years" value={v30} max={maxVal} color={Brand.tactical} />
          <ProjectionBar label={`Age 59.5 (${yearsTo595} yrs)`} value={v595} max={maxVal} color={Brand.accent} />
        </ThemedView>

        {/* Roth vs Traditional */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>ROTH VS TRADITIONAL (SAME CONTRIBUTION)</ThemedText>
          <ThemedText style={[styles.compareNote, { color: tc.textHint }]}>
            Traditional TSP/IRA: taxed at withdrawal. Estimate assumes 22% effective rate at retirement.
          </ThemedText>
          <View style={styles.compareTable}>
            <View style={[styles.compareHeader, { borderBottomColor: tc.borderColor }]}>
              <ThemedText style={styles.compareColLabel} />
              <ThemedText style={[styles.compareColLabel, { color: tc.textMuted }]}>ROTH (TAX-FREE)</ThemedText>
              <ThemedText style={[styles.compareColLabel, { color: tc.textMuted }]}>TRADITIONAL</ThemedText>
            </View>
            {[
              { label: '20 yr', roth: v20, trad: tradV20 },
              { label: '30 yr', roth: v30, trad: tradV30 },
              { label: `Age 59.5`, roth: v595, trad: tradV595 },
            ].map((row) => (
              <View key={row.label} style={styles.compareRow}>
                <ThemedText style={[styles.compareRowLabel, { color: tc.textHint }]}>{row.label}</ThemedText>
                <ThemedText style={[styles.compareValue, { color: Brand.tactical }]}>{fmt(row.roth)}</ThemedText>
                <ThemedText style={[styles.compareValue, { color: tc.textHint }]}>{fmt(row.trad)}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        {/* Tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>ROTH IRA RULES & TIPS</ThemedText>
          {[
            '2026 limit: $7,500/yr ($625/mo). Age 50+ can contribute $8,600 (includes a $1,100 catch-up).',
            'Phase-out range for 2026: $153K–$168K MAGI (single). Most junior enlisted are well under.',
            'Combat Zone pay is excluded from MAGI — you can max a Roth even on large CZ bonuses.',
            'Contributions (not earnings) can be withdrawn penalty-free at any time.',
            'Best brokers: Fidelity (zero-fee index funds), Schwab, Vanguard.',
            'Fund to buy: FSKAX (Fidelity), VTI (Vanguard), SCHB (Schwab) — total US market.',
            'Behind on 2026? You have until April 15, 2027 to contribute for tax year 2026.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={[styles.tipText, { color: tc.textHint }]}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={[styles.disclaimerText, { color: tc.textMuted }]}>
            Projections use constant 7% annual return — actual returns vary. Not financial advice. Consult a fee-only financial advisor for personalized guidance.
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: '#6A1B9A',
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#9C27B0' },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 18, fontWeight: '300', color: Brand.tactical },
  stepperValue: { fontSize: 13, fontWeight: '700', width: 80, textAlign: 'center', fontFamily: 'Courier New' },

  headroomRow: { flexDirection: 'row', gap: Spacing.two },
  headroomItem: { flex: 1, alignItems: 'center', gap: 4 },
  headroomItemLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  headroomItemValue: { fontSize: 13, fontWeight: '700', fontFamily: 'Courier New' },
  headroomTrack: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  headroomFill: { height: '100%', borderRadius: 3 },
  maxedText: { fontSize: 12, color: Brand.success, fontWeight: '700', textAlign: 'center' },

  projRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  projLabel: { fontSize: 11, width: 80 },
  projTrack: { flex: 1, height: 10, borderRadius: 3, overflow: 'hidden' },
  projFill: { height: '100%', borderRadius: 3 },
  projValue: { fontSize: 12, fontWeight: '700', fontFamily: 'Courier New', width: 85, textAlign: 'right' },

  compareNote: { fontSize: 11, lineHeight: 16 },
  compareTable: { gap: 4 },
  compareHeader: { flexDirection: 'row', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 4 },
  compareColLabel: { flex: 1, fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  compareRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', paddingVertical: 4 },
  compareRowLabel: { flex: 1, fontSize: 11 },
  compareValue: { flex: 1, fontSize: 12, fontWeight: '700', fontFamily: 'Courier New', textAlign: 'center' },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: '#9C27B0', marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18 },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
