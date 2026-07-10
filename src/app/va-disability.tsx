import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import {
  combinedRating,
  monthlyCompensation,
  RatingInput,
  VALID_RATINGS,
  VA_RATES_ALONE,
} from '@/features/va/utils/vaDisabilityCalc';

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function fmtDollar(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

type Tab = 'calculator' | 'rates';

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, { borderColor: tc.borderColor }, active && styles.tabBtnActive]}>
      <ThemedText
        style={[styles.tabBtnText, { color: tc.textMuted }, active && styles.tabBtnTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function RatingPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const tc = useThemeColors();
  return (
    <View style={styles.ratingPicker}>
      {VALID_RATINGS.map((r) => (
        <Pressable
          key={r}
          onPress={() => onChange(r)}
          style={[styles.ratingChip, { borderColor: tc.borderColor }, value === r && styles.ratingChipActive]}>
          <ThemedText
            style={[styles.ratingChipText, { color: tc.textHint }, value === r && styles.ratingChipTextActive]}>
            {r}%
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

export default function VaDisabilityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [tab, setTab] = useState<Tab>('calculator');
  const [ratings, setRatings] = useState<RatingInput[]>([{ id: uid(), pct: 50 }]);
  const [hasSpouse, setHasSpouse] = useState(false);
  const [numChildren, setNumChildren] = useState(0);

  const combined = useMemo(() => combinedRating(ratings), [ratings]);
  const monthly = useMemo(
    () => monthlyCompensation(combined.rounded, hasSpouse, numChildren),
    [combined.rounded, hasSpouse, numChildren],
  );

  const addRating = () => {
    if (ratings.length >= 10) return;
    setRatings((prev) => [...prev, { id: uid(), pct: 10 }]);
  };

  const removeRating = (id: string) => {
    if (ratings.length <= 1) return;
    setRatings((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRating = (id: string, pct: number) => {
    setRatings((prev) => prev.map((r) => (r.id === id ? { ...r, pct } : r)));
  };

  const ratingColor = combined.rounded >= 70 ? Brand.danger
    : combined.rounded >= 50 ? Brand.warning
    : combined.rounded >= 30 ? Brand.accent
    : Brand.tactical;

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>VA Disability</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <TabBtn label="CALCULATOR"  active={tab === 'calculator'} onPress={() => setTab('calculator')} />
        <TabBtn label="RATE TABLE"  active={tab === 'rates'}      onPress={() => setTab('rates')} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* ── CALCULATOR TAB ── */}
        {tab === 'calculator' && (
          <>
            {/* Rating inputs */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>SERVICE-CONNECTED RATINGS</ThemedText>
              <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>
                Add each separate disability rating. The VA uses the &quot;whole person&quot; method — ratings don&apos;t simply add up.
              </ThemedText>

              {ratings.map((r, i) => (
                <View key={r.id} style={styles.ratingRow}>
                  <ThemedText style={[styles.ratingIndex, { color: tc.textHint }]}>#{i + 1}</ThemedText>
                  <View style={styles.ratingPickerWrap}>
                    <RatingPicker value={r.pct} onChange={(v) => updateRating(r.id, v)} />
                  </View>
                  {ratings.length > 1 && (
                    <Pressable
                      onPress={() => Alert.alert('Remove', `Remove rating #${i + 1}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeRating(r.id) },
                      ])}
                      style={styles.removeBtn}>
                      <ThemedText style={styles.removeBtnText}>✕</ThemedText>
                    </Pressable>
                  )}
                </View>
              ))}

              {ratings.length < 10 && (
                <Pressable onPress={addRating} style={[styles.addRatingBtn, { borderColor: tc.borderColor }]}>
                  <ThemedText style={styles.addRatingText}>＋ Add Another Rating</ThemedText>
                </Pressable>
              )}
            </ThemedView>

            {/* Combined result */}
            <ThemedView type="backgroundElement" style={[styles.resultCard, { borderLeftColor: ratingColor }]}>
              <ThemedText style={[styles.resultEyebrow, { color: tc.textHint }]}>COMBINED RATING</ThemedText>
              <View style={styles.resultRow}>
                <View>
                  <ThemedText style={[styles.resultExact, { color: tc.textHint }]}>
                    {combined.exact.toFixed(1)}% exact
                  </ThemedText>
                  <ThemedText style={[styles.resultRounded, { color: ratingColor }]}>
                    {combined.rounded}% rounded
                  </ThemedText>
                </View>
                <View style={styles.resultRight}>
                  <ThemedText style={[styles.resultMonthlyLabel, { color: tc.textHint }]}>MONTHLY COMP.</ThemedText>
                  <ThemedText style={[styles.resultMonthly, { color: ratingColor }]}>
                    {fmtDollar(monthly)}
                  </ThemedText>
                  <ThemedText style={[styles.resultAnnual, { color: tc.textHint }]}>
                    {fmtDollar(monthly * 12)}/yr
                  </ThemedText>
                </View>
              </View>

              {/* Step-by-step breakdown */}
              <View style={[styles.breakdownBox, { backgroundColor: tc.background }]}>
                <ThemedText style={[styles.breakdownTitle, { color: tc.textMuted }]}>HOW THE VA CALCULATED THIS</ThemedText>
                {(() => {
                  const sorted = [...ratings].sort((a, b) => b.pct - a.pct);
                  let remaining = 100;
                  return sorted.map((r, i) => {
                    const disabled = remaining * (r.pct / 100);
                    remaining = remaining - disabled;
                    return (
                      <ThemedText key={r.id} style={[styles.breakdownStep, { color: tc.textHint }]}>
                        {i === 0 ? `${r.pct}% of 100% = ${disabled.toFixed(1)}% disabled` : `${r.pct}% of ${(remaining + disabled).toFixed(1)}% = ${disabled.toFixed(1)}% more disabled`}
                        {` → ${(100 - remaining).toFixed(1)}% total`}
                      </ThemedText>
                    );
                  });
                })()}
                <ThemedText style={[styles.breakdownStep, { color: tc.textHint }]}>
                  {combined.exact.toFixed(1)}% → rounds to <ThemedText style={{ fontWeight: '800', color: ratingColor }}>{combined.rounded}%</ThemedText>
                </ThemedText>
              </View>
            </ThemedView>

            {/* Dependents */}
            {combined.rounded >= 30 && (
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>DEPENDENTS (30%+ ONLY)</ThemedText>

                <View style={styles.toggleRow}>
                  <ThemedText style={[styles.toggleLabel, { color: tc.textPrimary }]}>Spouse</ThemedText>
                  <Pressable
                    onPress={() => setHasSpouse((v) => !v)}
                    style={[styles.toggle, { borderColor: tc.borderColor }, hasSpouse && styles.toggleActive]}>
                    <ThemedText style={[styles.toggleText, { color: tc.textHint }, hasSpouse && styles.toggleTextActive]}>
                      {hasSpouse ? 'YES' : 'NO'}
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.toggleRow}>
                  <ThemedText style={[styles.toggleLabel, { color: tc.textPrimary }]}>Children ({numChildren})</ThemedText>
                  <View style={styles.childCounter}>
                    <Pressable
                      onPress={() => setNumChildren((v) => Math.max(0, v - 1))}
                      style={[styles.counterBtn, { borderColor: tc.borderColor }]}>
                      <ThemedText style={[styles.counterBtnText, { color: tc.textPrimary }]}>−</ThemedText>
                    </Pressable>
                    <ThemedText style={[styles.counterVal, { color: tc.textPrimary }]}>{numChildren}</ThemedText>
                    <Pressable
                      onPress={() => setNumChildren((v) => Math.min(10, v + 1))}
                      style={[styles.counterBtn, { borderColor: tc.borderColor }]}>
                      <ThemedText style={[styles.counterBtnText, { color: tc.textPrimary }]}>+</ThemedText>
                    </Pressable>
                  </View>
                </View>

                {(hasSpouse || numChildren > 0) && (
                  <View style={[styles.depResult, { borderTopColor: tc.borderColor }]}>
                    <ThemedText style={[styles.depResultLabel, { color: tc.textHint }]}>Monthly with dependents</ThemedText>
                    <ThemedText style={[styles.depResultVal, { color: ratingColor }]}>
                      {fmtDollar(monthly)}
                    </ThemedText>
                  </View>
                )}
              </ThemedView>
            )}

            <ThemedView type="backgroundElement" style={styles.noteCard}>
              <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
                Rates are FY2026 estimates (2.5% COLA). Actual VA compensation depends on official C&P exam findings, VA rating decisions, and individual circumstances. File claims at va.gov or through a VSO. Tax-free for disability compensation.
              </ThemedText>
            </ThemedView>
          </>
        )}

        {/* ── RATE TABLE TAB ── */}
        {tab === 'rates' && (
          <>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>FY2026 VA DISABILITY RATES — VETERAN ALONE</ThemedText>
              <ThemedText style={[styles.cardHint, { color: tc.textMuted }]}>Effective December 1, 2025. Tax-free.</ThemedText>

              {Object.entries(VA_RATES_ALONE).map(([rStr, monthly]) => {
                const r = parseInt(rStr);
                const color = r >= 70 ? Brand.danger : r >= 50 ? Brand.warning : r >= 30 ? Brand.accent : tc.textHint;
                return (
                  <View key={r} style={styles.rateRow}>
                    <View style={[styles.rateChip, { backgroundColor: color + '20' }]}>
                      <ThemedText style={[styles.rateChipText, { color }]}>{r}%</ThemedText>
                    </View>
                    <ThemedText style={[styles.rateMonthly, { color: tc.textPrimary }]}>{fmtDollar(monthly)}/mo</ThemedText>
                    <ThemedText style={[styles.rateAnnual, { color: tc.textHint }]}>{fmtDollar(monthly * 12)}/yr</ThemedText>
                  </View>
                );
              })}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.noteCard}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>DEPENDENT ADDITIONS (30%+)</ThemedText>
              <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
                At 30% or higher, your monthly compensation increases for dependents:{'\n'}
                {'\n'}• Spouse adds ~$58–$193/mo depending on rating.
                {'\n'}• Each child adds ~$30–$100/mo.
                {'\n'}• Dependent rates increase with each 10% step.
                {'\n'}{'\n'}Rates shown are for veteran alone. Use the Calculator tab to see your specific amount with dependents.
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.noteCard, { borderLeftWidth: 3, borderLeftColor: Brand.tactical }]}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>100% TDIU</ThemedText>
              <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
                Total Disability based on Individual Unemployability (TDIU) pays at the 100% rate even if your combined rating is less than 100%, if you cannot secure substantially gainful employment due to service-connected disabilities. Requires 60%+ single rating, or 70%+ combined with one disability at 40%+.
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.noteCard}>
              <ThemedText style={[styles.cardLabel, { color: tc.textHint }]}>SPECIAL MONTHLY COMPENSATION</ThemedText>
              <ThemedText style={[styles.noteText, { color: tc.textMuted }]}>
                SMC provides additional compensation for specific conditions like loss of use of a limb, blindness, deafness, or the need for regular aid and attendance. SMC rates can significantly exceed the standard 100% rate. Ask your VSO about SMC eligibility.
              </ThemedText>
            </ThemedView>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },

  tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.three, gap: Spacing.one, marginBottom: Spacing.two },
  tabBtn: { flex: 1, paddingVertical: Spacing.one + 2, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Brand.danger, borderColor: Brand.danger },
  tabBtnText: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  tabBtnTextActive: { color: '#fff' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  cardHint: { fontSize: 11, color: '#3D6080', lineHeight: 16 },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  ratingIndex: { fontSize: 11, fontWeight: '700', color: '#4D7A9A', width: 22 },
  ratingPickerWrap: { flex: 1 },
  ratingPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  ratingChip: { paddingHorizontal: Spacing.two, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  ratingChipActive: { backgroundColor: Brand.danger, borderColor: Brand.danger },
  ratingChipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  ratingChipTextActive: { color: '#fff' },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 14, color: Brand.danger },

  addRatingBtn: { alignSelf: 'center', paddingVertical: Spacing.one + 2, paddingHorizontal: Spacing.three, borderRadius: 4, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.border },
  addRatingText: { fontSize: 12, color: Brand.tactical, fontWeight: '600' },

  resultCard: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two, borderLeftWidth: 3 },
  resultEyebrow: { fontSize: 8, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1.5 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resultExact: { fontSize: 14, color: '#4D7A9A' },
  resultRounded: { fontSize: 26, fontWeight: '900' },
  resultRight: { alignItems: 'flex-end', gap: 2 },
  resultMonthlyLabel: { fontSize: 8, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  resultMonthly: { fontSize: 26, fontWeight: '900' },
  resultAnnual: { fontSize: 11, color: '#4D7A9A' },

  breakdownBox: { backgroundColor: '#04080F', borderRadius: 4, padding: Spacing.two, gap: 4 },
  breakdownTitle: { fontSize: 8, fontWeight: '800', color: '#3D6080', letterSpacing: 0.8, marginBottom: 4 },
  breakdownStep: { fontSize: 11, color: '#4D7A9A', lineHeight: 17 },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabel: { fontSize: 13, color: '#C8D8E8' },
  toggle: { paddingHorizontal: Spacing.two, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  toggleActive: { backgroundColor: Brand.tactical, borderColor: Brand.tactical },
  toggleText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  toggleTextActive: { color: '#000' },

  childCounter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  counterBtn: { width: 32, height: 32, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  counterBtnText: { fontSize: 18, fontWeight: '300', color: '#C8D8E8' },
  counterVal: { fontSize: 16, fontWeight: '700', color: '#C8D8E8', minWidth: 24, textAlign: 'center' },

  depResult: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Brand.border, paddingTop: Spacing.two },
  depResultLabel: { fontSize: 12, color: '#4D7A9A' },
  depResultVal: { fontSize: 18, fontWeight: '800' },

  rateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: 4 },
  rateChip: { width: 48, borderRadius: 4, paddingVertical: 4, alignItems: 'center' },
  rateChipText: { fontSize: 12, fontWeight: '800' },
  rateMonthly: { flex: 1, fontSize: 13, fontWeight: '700', color: '#C8D8E8' },
  rateAnnual: { fontSize: 11, color: '#4D7A9A' },

  noteCard: { borderRadius: 4, padding: Spacing.three, gap: 6 },
  noteText: { fontSize: 11, color: '#3D6080', lineHeight: 17 },
});
