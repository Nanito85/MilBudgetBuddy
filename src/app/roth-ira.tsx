import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

const ROTH_ANNUAL_LIMIT = 7000;
const ROTH_MONTHLY_LIMIT = Math.round(ROTH_ANNUAL_LIMIT / 12); // 583

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
  return (
    <View style={styles.stepperRow}>
      <ThemedText style={styles.stepperLabel}>{label}</ThemedText>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))}>
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepperValue}>{fmt(value)}</ThemedText>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + step))}>
          <ThemedText style={styles.stepBtnText}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function ProjectionBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <View style={styles.projRow}>
      <ThemedText style={styles.projLabel}>{label}</ThemedText>
      <View style={styles.projTrack}>
        <View style={[styles.projFill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <ThemedText style={[styles.projValue, { color }]}>{fmt(value)}</ThemedText>
    </View>
  );
}

export default function RothIraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [balance, setBalance]  = useState(5000);
  const [monthly, setMonthly]  = useState(583);
  const [age, setAge]          = useState(22);
  const currentYear = new Date().getFullYear();

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
          onPress={() => (router.push('/tools'))}
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
          <ThemedText style={styles.heroTitle}>Roth IRA Growth Engine</ThemedText>
          <ThemedText style={styles.heroBody}>
            Start early. Military pay is low — so is your tax bracket. Roth is the best deal the IRS offers junior enlisted.
          </ThemedText>
        </ThemedView>

        {/* Inputs */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR NUMBERS</ThemedText>
          <Stepper label="Current Roth IRA balance" value={balance} step={500} min={0} max={100000} onChange={setBalance} />
          <Stepper label="Monthly contribution" value={monthly} step={50} min={0} max={583} onChange={setMonthly} />
          <Stepper label="Your age" value={age} step={1} min={17} max={55} onChange={(v) => setAge(v)} />
        </ThemedView>

        {/* Headroom */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>2025 CONTRIBUTION HEADROOM</ThemedText>
          <View style={styles.headroomRow}>
            <View style={styles.headroomItem}>
              <ThemedText style={styles.headroomItemLabel}>LIMIT</ThemedText>
              <ThemedText style={styles.headroomItemValue}>{fmt(ROTH_ANNUAL_LIMIT)}/yr</ThemedText>
            </View>
            <View style={styles.headroomItem}>
              <ThemedText style={styles.headroomItemLabel}>ON PACE FOR</ThemedText>
              <ThemedText style={styles.headroomItemValue}>{fmt(annualContrib)}/yr</ThemedText>
            </View>
            <View style={styles.headroomItem}>
              <ThemedText style={styles.headroomItemLabel}>HEADROOM</ThemedText>
              <ThemedText style={[styles.headroomItemValue, { color: headroomColor }]}>
                {fmt(headroom)}/yr
              </ThemedText>
            </View>
          </View>
          <View style={styles.headroomTrack}>
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
          <ThemedText style={styles.compareNote}>
            Traditional TSP/IRA: taxed at withdrawal. Estimate assumes 22% effective rate at retirement.
          </ThemedText>
          <View style={styles.compareTable}>
            <View style={styles.compareHeader}>
              <ThemedText style={styles.compareColLabel} />
              <ThemedText style={styles.compareColLabel}>ROTH (TAX-FREE)</ThemedText>
              <ThemedText style={styles.compareColLabel}>TRADITIONAL</ThemedText>
            </View>
            {[
              { label: '20 yr', roth: v20, trad: tradV20 },
              { label: '30 yr', roth: v30, trad: tradV30 },
              { label: `Age 59.5`, roth: v595, trad: tradV595 },
            ].map((row) => (
              <View key={row.label} style={styles.compareRow}>
                <ThemedText style={styles.compareRowLabel}>{row.label}</ThemedText>
                <ThemedText style={[styles.compareValue, { color: Brand.tactical }]}>{fmt(row.roth)}</ThemedText>
                <ThemedText style={styles.compareValue}>{fmt(row.trad)}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        {/* Tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>ROTH IRA RULES & TIPS</ThemedText>
          {[
            '2025 limit: $7,000/yr ($583/mo). Age 50+ can contribute $8,000.',
            'Phase-out starts at $150K MAGI (single). Most junior enlisted are well under.',
            'Combat Zone pay is excluded from MAGI — you can max a Roth even on large CZ bonuses.',
            'Contributions (not earnings) can be withdrawn penalty-free at any time.',
            'Best brokers: Fidelity (zero-fee index funds), Schwab, Vanguard.',
            'Fund to buy: FSKAX (Fidelity), VTI (Vanguard), SCHB (Schwab) — total US market.',
            'Missed 2024? You have until April 15, 2025 to contribute for tax year 2024.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
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
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, color: '#8AA8C0', flex: 1 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#04080F',
  },
  stepBtnText: { fontSize: 18, fontWeight: '300', color: Brand.tactical },
  stepperValue: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', width: 80, textAlign: 'center', fontFamily: 'Courier New' },

  headroomRow: { flexDirection: 'row', gap: Spacing.two },
  headroomItem: { flex: 1, alignItems: 'center', gap: 4 },
  headroomItemLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: '#3D6080' },
  headroomItemValue: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', fontFamily: 'Courier New' },
  headroomTrack: { height: 6, backgroundColor: '#0D1E30', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  headroomFill: { height: '100%', borderRadius: 3 },
  maxedText: { fontSize: 12, color: Brand.success, fontWeight: '700', textAlign: 'center' },

  projRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  projLabel: { fontSize: 11, color: '#4D7A9A', width: 80 },
  projTrack: { flex: 1, height: 10, backgroundColor: '#0D1E30', borderRadius: 3, overflow: 'hidden' },
  projFill: { height: '100%', borderRadius: 3 },
  projValue: { fontSize: 12, fontWeight: '700', fontFamily: 'Courier New', width: 85, textAlign: 'right' },

  compareNote: { fontSize: 11, color: '#4D7A9A', lineHeight: 16 },
  compareTable: { gap: 4 },
  compareHeader: { flexDirection: 'row', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border, paddingBottom: 4 },
  compareColLabel: { flex: 1, fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5, textAlign: 'center' },
  compareRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', paddingVertical: 4 },
  compareRowLabel: { flex: 1, fontSize: 11, color: '#4D7A9A' },
  compareValue: { flex: 1, fontSize: 12, fontWeight: '700', color: '#8AA8C0', fontFamily: 'Courier New', textAlign: 'center' },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: '#9C27B0', marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#4D7A9A' },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, color: '#3D6080', textAlign: 'center' },
});
