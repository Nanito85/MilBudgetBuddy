import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, Switch, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { PayGrade } from '@/data/bah-rates';
import { fmtPay, retiredPayBreakdown } from '@/features/home/utils/lesCalc';
import { calcSbpPremium } from '@/features/retirement/utils/sbpCalc';
import { combineVaRatings, monthlyCompensation, VALID_RATINGS } from '@/features/va/utils/vaDisabilityCalc';
import { useThemeColors } from '@/hooks/use-theme';

import { editStyles } from './editStyles';

// Shared by onboarding (RetiredServiceInfoStep) and the Profile edit modal so a
// retiree sees the same math, SBP election and VA helper in both places.

const pctText = (x: number) => `${(x * 100).toFixed(1).replace(/\.0$/, '')}%`;

// ── Reserve / Guard retirement ─────────────────────────────────────────────────

export function ReserveRetireeFields({ retiredFromReserve, onRetiredFromReserveChange, points, onPointsChange }: {
  retiredFromReserve: boolean;
  onRetiredFromReserveChange: (v: boolean) => void;
  points: number;
  onPointsChange: (n: number) => void;
}) {
  const tc = useThemeColors();
  return (
    <>
      <View style={editStyles.toggleRow}>
        <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Retired from the Reserve / Guard</ThemedText>
        <Switch value={retiredFromReserve} onValueChange={onRetiredFromReserveChange} trackColor={{ true: Brand.accent }} thumbColor="#FFF" accessibilityLabel="Retired from Reserve or Guard" />
      </View>
      {retiredFromReserve && (
        <>
          <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
            Reserve/Guard retired pay is counted in points, not years: (total retirement points ÷ 360) × 2.5% × High-3
            (2.0% if you entered service in 2018 or later). Find your total on your Retirement Points Statement (ARCNET / MyPers / RPAS). Pay normally starts at age 60.
          </ThemedText>
          <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>TOTAL RETIREMENT POINTS</ThemedText>
          <View style={[editStyles.inputWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <TextInput
              value={points > 0 ? String(points) : ''}
              onChangeText={(t) => onPointsChange(Math.min(30000, parseInt(t.replace(/\D/g, ''), 10) || 0))}
              keyboardType="number-pad"
              placeholder="e.g. 7200 (20 yrs ≈ 7,200 at full points)"
              placeholderTextColor="rgba(128,128,128,0.5)"
              style={[editStyles.input, { color: tc.textPrimary }]}
              accessibilityLabel="Total retirement points"
            />
          </View>
        </>
      )}
    </>
  );
}

// ── "See the math" for retired pay ─────────────────────────────────────────────

export function RetiredPayMathPreview({ grade, yos, entryDate, retirementDate, reservePoints }: {
  grade: PayGrade;
  yos: number;
  entryDate?: string;
  retirementDate?: string;
  reservePoints?: number;
}) {
  const tc = useThemeColors();
  const m = useMemo(
    () => retiredPayBreakdown(grade, yos, entryDate, retirementDate, reservePoints),
    [grade, yos, entryDate, retirementDate, reservePoints],
  );
  const retYear = retirementDate?.slice(0, 4);
  const years = reservePoints && reservePoints > 0 ? `${reservePoints.toLocaleString()} pts ÷ 360 = ${(reservePoints / 360).toFixed(1)} yrs` : `${yos} yrs`;
  return (
    <View style={{ gap: 2 }}>
      <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
        ↳ {m.fromHistory ? `High-3 from the ${retYear} era pay tables` : 'High-3 from TODAY’S pay table (add your retirement date for the real figure)'}: {fmtPay(m.high3)}/mo
      </ThemedText>
      <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
        ↳ × {years} × {pctText(m.accrualRate)} = {pctText(m.multiplier)} → {fmtPay(m.initialMonthly)}/mo{m.fromHistory ? ` at retirement` : ''}
      </ThemedText>
      {m.fromHistory && m.colaFactor > 1.0001 && (
        <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
          ↳ × {m.colaFactor.toFixed(3)} retiree COLAs since {retYear} = {fmtPay(m.monthly)}/mo today
        </ThemedText>
      )}
    </View>
  );
}

// ── SBP election (also used in onboarding) ─────────────────────────────────────

export function SbpFields({ enabled, onEnabledChange, coveragePct, onCoveragePctChange, retiredMonthly }: {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  coveragePct: number;
  onCoveragePctChange: (p: number) => void;
  retiredMonthly: number;
}) {
  const tc = useThemeColors();
  return (
    <>
      <View style={editStyles.toggleRow}>
        <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Survivor Benefit Plan (SBP)</ThemedText>
        <Switch value={enabled} onValueChange={onEnabledChange} trackColor={{ true: Brand.accent }} thumbColor="#FFF" accessibilityLabel="Survivor Benefit Plan" />
      </View>
      <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
        Optional insurance you elected at retirement. 6.5% of the covered amount comes out of your retired pay every month
        (it is not Social Security — retired pay has no Social Security tax).
      </ThemedText>
      {enabled && (
        <>
          <View style={editStyles.gsRow}>
            {[1, 0.75, 0.5, 0.25].map((pct) => (
              <Pressable accessibilityState={{ selected: coveragePct === pct }} accessibilityRole="button"
                key={pct}
                onPress={() => onCoveragePctChange(pct)}
                style={[editStyles.gsChip, { width: 60, borderColor: tc.borderColor, backgroundColor: tc.surface }, coveragePct === pct && editStyles.gsChipActive]}>
                <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, coveragePct === pct && { color: tc.accent }]}>
                  {Math.round(pct * 100)}%
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
            ↳ Est. premium: {fmtPay(calcSbpPremium(retiredMonthly, coveragePct))}/mo, deducted from retired pay
          </ThemedText>
        </>
      )}
    </>
  );
}

// ── VA disability: rating picker + built-in combine tool ───────────────────────

const VA_PICKER_OPTIONS = [0, ...VALID_RATINGS];

export function VaRatingHelper({ vaPercent, onChange, spouse, childCount, yos, isRetired, retiredMonthly, dependentsPending }: {
  vaPercent: number;
  onChange: (p: number) => void;
  spouse: boolean;
  childCount: number;
  yos: number;
  isRetired: boolean;
  /** Retired pay (before any VA waiver) — used to show the CRDP / waiver effect. */
  retiredMonthly?: number;
  /** True in onboarding, where spouse/children are collected on the next step. */
  dependentsPending?: boolean;
}) {
  const tc = useThemeColors();
  const router = useRouter();
  const [showCombine, setShowCombine] = useState(false);
  const [extra, setExtra] = useState<number[]>([]);
  const combinedAll = useMemo(
    () => (vaPercent > 0 ? combineVaRatings([vaPercent, ...extra]) : 0),
    [vaPercent, extra],
  );
  const rounded = Math.min(100, Math.round(combinedAll / 10) * 10);
  const comp = vaPercent > 0 ? monthlyCompensation(vaPercent, spouse, childCount) : 0;
  const crdp = vaPercent >= 50 && yos >= 20;
  const waiver = isRetired && !crdp ? Math.min(comp, retiredMonthly ?? comp) : 0;

  return (
    <>
      <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>VA DISABILITY RATING (IF ANY)</ThemedText>
      <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
        Use your combined (overall) rating from your VA letter. VA compensation is tax-free and separate from retired pay.
      </ThemedText>
      <View style={editStyles.gsRow}>
        {VA_PICKER_OPTIONS.map((p) => (
          <Pressable accessibilityState={{ selected: vaPercent === p }} accessibilityRole="button"
            key={p}
            onPress={() => { onChange(p); if (p === 0) { setExtra([]); setShowCombine(false); } }}
            style={[editStyles.gsChip, { width: 52, borderColor: tc.borderColor, backgroundColor: tc.surface }, vaPercent === p && editStyles.gsChipActive]}>
            <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, vaPercent === p && { color: tc.accent }]}>{p}%</ThemedText>
          </Pressable>
        ))}
      </View>

      {vaPercent > 0 && (
        <>
          <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
            ↳ Est. VA compensation: {fmtPay(comp)}/mo{dependentsPending ? ' (before dependents — those are added on the family step)' : spouse || childCount > 0 ? ` (incl. ${spouse ? 'spouse' : ''}${spouse && childCount > 0 ? ' + ' : ''}${childCount > 0 ? `${childCount} child${childCount > 1 ? 'ren' : ''}` : ''})` : ''}
          </ThemedText>

          {isRetired && (
            <ThemedText style={[editStyles.fieldHint, { color: crdp ? tc.tactical : Brand.warning }]}>
              {crdp
                ? `✓ You qualify for Concurrent Retirement & Disability Pay (20+ years and 50%+ rating): you keep your full retired pay AND VA compensation.`
                : yos >= 20
                  ? `Under 50%: VA compensation is deducted from your retired pay dollar-for-dollar (VA waiver)${waiver > 0 ? ` — about ${fmtPay(waiver)}/mo` : ''}, so your total pay barely changes, but the VA portion is tax-free.`
                  : `Under 20 years of service: VA compensation offsets your retired pay dollar-for-dollar (VA waiver)${waiver > 0 ? ` — about ${fmtPay(waiver)}/mo` : ''}. Medical retirees under Chapter 61 may qualify for CRSC instead — check with your service.`}
            </ThemedText>
          )}

          <Pressable accessibilityRole="button" onPress={() => setShowCombine((v) => !v)} style={{ paddingVertical: Spacing.one }}>
            <ThemedText style={[editStyles.toggleLabel, { color: tc.accent, fontSize: 14 }]}>
              {showCombine ? '▲ Hide VA rating combiner' : '▼ Have several separate ratings? Combine them'}
            </ThemedText>
          </Pressable>

          {showCombine && (
            <View style={[editStyles.inputWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor, padding: Spacing.two, gap: Spacing.two }]}>
              <ThemedText style={[editStyles.fieldHint, { color: tc.textHint }]}>
                VA ratings don’t add up — they combine (e.g. 50% + 30% = 65%, rounds to 70%). Your first rating is the one chosen above; add the others here.
              </ThemedText>
              {extra.map((r, i) => (
                <View key={i} style={{ gap: Spacing.one }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint }]}>Additional rating #{i + 1}</ThemedText>
                    <Pressable accessibilityRole="button" accessibilityLabel="Remove rating" onPress={() => setExtra((p) => p.filter((_, j) => j !== i))}>
                      <ThemedText style={{ color: Brand.danger }}>✕</ThemedText>
                    </Pressable>
                  </View>
                  <View style={editStyles.gsRow}>
                    {VALID_RATINGS.map((p) => (
                      <Pressable accessibilityState={{ selected: r === p }} accessibilityRole="button" key={p}
                        onPress={() => setExtra((prev) => prev.map((v, j) => (j === i ? p : v)))}
                        style={[editStyles.gsChip, { width: 48, borderColor: tc.borderColor, backgroundColor: tc.surface }, r === p && editStyles.gsChipActive]}>
                        <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, r === p && { color: tc.accent }]}>{p}%</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
              {extra.length < 9 && (
                <Pressable accessibilityRole="button" onPress={() => setExtra((p) => [...p, 10])}>
                  <ThemedText style={[editStyles.toggleLabel, { color: tc.accent, fontSize: 14 }]}>+ Add another rating</ThemedText>
                </Pressable>
              )}
              {extra.length > 0 && (
                <>
                  <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                    ↳ Combined: {combinedAll}% → pays as {rounded}%
                  </ThemedText>
                  <Pressable accessibilityRole="button" onPress={() => { onChange(rounded); setExtra([]); setShowCombine(false); }}
                    style={{ backgroundColor: Brand.accent, borderRadius: 8, paddingVertical: Spacing.two, alignItems: 'center' }}>
                    <ThemedText style={{ color: '#FFF', fontWeight: '700' }}>Use {rounded}% as my rating</ThemedText>
                  </Pressable>
                </>
              )}
              {!dependentsPending && (
                <>
                  <ThemedText style={[editStyles.fieldHint, { color: tc.textHint }]}>
                    Need the bilateral-limb factor, Aid & Attendance spouse, school-age children or dependent parents? Open the full tool:
                  </ThemedText>
                  <Pressable accessibilityRole="link" onPress={() => router.push('/va-disability' as any)}>
                    <ThemedText style={[editStyles.toggleLabel, { color: tc.accent, fontSize: 14 }]}>Open VA Disability calculator ›</ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          )}
        </>
      )}
    </>
  );
}
