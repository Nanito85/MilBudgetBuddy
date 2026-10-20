import React from 'react';
import { Pressable, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { PayGrade } from '@/data/bah-rates';
import { getHigh3Average } from '@/data/basic-pay-rates';
import { GS_LOCALITIES } from '@/data/gs-pay-rates';
import { Installation } from '@/data/installations';
import { FSA_MONTHLY, fmtPay, getDrillPay, retiredPayMultiplier } from '@/features/home/utils/lesCalc';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { calcSbpPremium } from '@/features/retirement/utils/sbpCalc';
import { VALID_RATINGS, monthlyCompensation } from '@/features/va/utils/vaDisabilityCalc';
import { useThemeColors } from '@/hooks/use-theme';
import {
  GUARD_DUTY_STATUS_DESCRIPTIONS,
  GUARD_DUTY_STATUS_FIELD_HINT,
  GUARD_DUTY_STATUS_LABELS,
  GuardDutyStatus,
  HOUSING_STATUS_DESCRIPTIONS,
  HOUSING_STATUS_LABELS,
  HousingStatus,
  RESERVE_COMPONENT_LABELS,
  ReserveComponent,
} from '@/types/user.types';

import { editStyles } from './editStyles';

// The long sections of the Personal Info edit modal, split out and memoized so
// typing in one field (e.g. Last Name) no longer re-renders every chip row,
// radio list and picker in the modal -- each only re-renders when its own
// props change. Callback props are state setters from the parent, so they're
// referentially stable.

const VA_PICKER_OPTIONS = [0, ...VALID_RATINGS];
const HOUSING_STATUS_ORDER: HousingStatus[] = ['off_base', 'barracks', 'on_base_family_housing'];

// ── GS grade / step / locality ─────────────────────────────────────────────────

export const GsPaySelector = React.memo(function GsPaySelector({ gsGrade, gsStep, gsLocality, onGradeChange: setGsGrade, onStepChange: setGsStep, onLocalityChange: setGsLocality }: {
  gsGrade: number;
  gsStep: number;
  gsLocality: string;
  onGradeChange: (g: number) => void;
  onStepChange: (s: number) => void;
  onLocalityChange: (key: string) => void;
}) {
  const tc = useThemeColors();
  const inputBg = tc.surface;
  return (
    <>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS GRADE</ThemedText>
                <View style={editStyles.gsRow}>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setGsGrade(g)}
                      style={[editStyles.gsChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, gsGrade === g && editStyles.gsChipActive]}>
                      <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsGrade === g && { color: tc.accent }]}>
                        {g}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS STEP</ThemedText>
                <View style={editStyles.gsRow}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setGsStep(s)}
                      style={[editStyles.gsChip, { borderColor: tc.borderColor, backgroundColor: tc.surface }, gsStep === s && editStyles.gsChipActive]}>
                      <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, gsStep === s && { color: tc.accent }]}>
                        {s}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>

                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>GS LOCALITY PAY AREA</ThemedText>
                <View style={{ gap: Spacing.one }}>
                  {GS_LOCALITIES.map((loc) => (
                    <Pressable
                      key={loc.key}
                      onPress={() => setGsLocality(loc.key)}
                      style={[
                        editStyles.inputWrap,
                        { backgroundColor: inputBg, borderColor: gsLocality === loc.key ? Brand.accent : tc.borderColor, paddingVertical: Spacing.two },
                      ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                        <ThemedText style={{ fontSize: 16, color: gsLocality === loc.key ? Brand.accent : tc.textHint }}>
                          {gsLocality === loc.key ? '●' : '○'}
                        </ThemedText>
                        <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary, fontSize: 14 }]}>
                          {loc.label} ({(loc.rate * 100).toFixed(2)}%)
                        </ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </View>
    </>
  );
});

// ── Reserve / Guard ────────────────────────────────────────────────────────────

export const ReserveSection = React.memo(function ReserveSection({
  grade, y, drillsPerMonth, onDrillsChange: setDrillsPerMonth,
  hasGuardOption, reserveComponent, onReserveComponentChange: setReserveComponentLocal,
  guardDutyStatus, onGuardDutyStatusChange: setGuardDutyStatusLocal,
  storedGuardDutyStatusUpdatedAt,
}: {
  grade: PayGrade;
  y: number;
  drillsPerMonth: number;
  onDrillsChange: (n: number) => void;
  hasGuardOption: boolean;
  reserveComponent: ReserveComponent;
  onReserveComponentChange: (c: ReserveComponent) => void;
  guardDutyStatus: GuardDutyStatus;
  onGuardDutyStatusChange: (s: GuardDutyStatus) => void;
  storedGuardDutyStatusUpdatedAt: string | undefined;
}) {
  const tc = useThemeColors();
  const inputBg = tc.surface;
  return (
    <>
                <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>DRILLS PER MONTH</ThemedText>
                <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                  One battle assembly weekend = 4 drills. Used to estimate your monthly drill pay.
                </ThemedText>
                <NumberStepper label="Drills" value={drillsPerMonth} min={0} max={20} onChange={setDrillsPerMonth} unit="drills" />
                <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                  ↳ Est. drill pay: {fmtPay(getDrillPay(grade, y, drillsPerMonth))}/mo
                </ThemedText>

                {/* Guard vs Reserve — only Army/Air Force have a federal Guard */}
                {hasGuardOption && (
                  <>
                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint, marginTop: Spacing.two }]}>GUARD OR RESERVE?</ThemedText>
                    <View style={{ flexDirection: 'row', gap: Spacing.one }}>
                      {(['guard', 'reserve'] as const).map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setReserveComponentLocal(c)}
                          style={[
                            editStyles.inputWrap,
                            { backgroundColor: inputBg, borderColor: reserveComponent === c ? Brand.accent : tc.borderColor, flex: 1, alignItems: 'center', paddingVertical: Spacing.two },
                          ]}>
                          <ThemedText style={[editStyles.toggleLabel, { color: reserveComponent === c ? Brand.accent : tc.textPrimary, fontSize: 14 }]}>
                            {RESERVE_COMPONENT_LABELS[c]}
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}

                {/* Guard duty status — drives TRICARE/SCRA/retirement-point
                    eligibility differently (see app/reserves.tsx). This is
                    what their status IS RIGHT NOW, not a permanent fact — a
                    real Guard member's status genuinely changes month to
                    month, so this is the one place in the app to come back
                    and update it, with a visible "last updated" note so a
                    months-old answer doesn't quietly look current. */}
                {hasGuardOption && reserveComponent === 'guard' && (
                  <>
                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint, marginTop: Spacing.two }]}>YOUR STATUS RIGHT NOW</ThemedText>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                      {GUARD_DUTY_STATUS_FIELD_HINT} Affects your TRICARE, SCRA, and retirement-point eligibility.
                    </ThemedText>
                    {storedGuardDutyStatusUpdatedAt && (
                      <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two, fontStyle: 'italic' }]}>
                        Last updated {new Date(storedGuardDutyStatusUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — update it below if that&apos;s no longer right.
                      </ThemedText>
                    )}
                    <View style={{ gap: Spacing.one }}>
                      {(['title32', 'title10', 'sad'] as const).map((s) => (
                        <Pressable
                          key={s}
                          onPress={() => setGuardDutyStatusLocal(s)}
                          style={[
                            editStyles.inputWrap,
                            { backgroundColor: inputBg, borderColor: guardDutyStatus === s ? Brand.accent : tc.borderColor, paddingVertical: Spacing.two },
                          ]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                            <ThemedText style={{ fontSize: 16, color: guardDutyStatus === s ? Brand.accent : tc.textHint }}>
                              {guardDutyStatus === s ? '●' : '○'}
                            </ThemedText>
                            <View style={{ flex: 1 }}>
                              <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary, fontSize: 14 }]}>
                                {GUARD_DUTY_STATUS_LABELS[s]}
                              </ThemedText>
                              <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: 2 }]}>
                                {GUARD_DUTY_STATUS_DESCRIPTIONS[s]}
                              </ThemedText>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
    </>
  );
});

// ── VA disability rating ───────────────────────────────────────────────────────

export const VaDisabilitySection = React.memo(function VaDisabilitySection({ vaPercent, onChange: setVaPercent, spouse, childCount }: {
  vaPercent: number;
  onChange: (p: number) => void;
  spouse: boolean;
  childCount: number;
}) {
  const tc = useThemeColors();
  return (
    <>
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>VA DISABILITY RATING (IF ANY)</ThemedText>
            <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
              Optional — set this even if you&apos;re still serving or separated without retiring. VA compensation is separate, tax-free income independent of any other pay.
            </ThemedText>
            <View style={editStyles.gsRow}>
              {VA_PICKER_OPTIONS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setVaPercent(p)}
                  style={[editStyles.gsChip, { width: 52, borderColor: tc.borderColor, backgroundColor: tc.surface }, vaPercent === p && editStyles.gsChipActive]}>
                  <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, vaPercent === p && { color: tc.accent }]}>
                    {p}%
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            {vaPercent > 0 && (
              <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                ↳ Est. VA compensation: {fmtPay(monthlyCompensation(vaPercent, spouse, childCount))}/mo
              </ThemedText>
            )}
    </>
  );
});

// ── Retired-only: GS side job + SBP ────────────────────────────────────────────

export const RetiredPaySection = React.memo(function RetiredPaySection({
  grade, y,
  alsoGsCivilian, onAlsoGsCivilianChange: setAlsoGsCivilianLocal,
  gsGrade, gsStep, gsLocality, setGsGrade, setGsStep, setGsLocality,
  sbpEnabled, onSbpEnabledChange: setSbpEnabledLocal,
  sbpCoveragePct, onSbpCoveragePctChange: setSbpCoveragePctLocal,
}: {
  grade: PayGrade;
  y: number;
  alsoGsCivilian: boolean;
  onAlsoGsCivilianChange: (v: boolean) => void;
  gsGrade: number;
  gsStep: number;
  gsLocality: string;
  setGsGrade: (g: number) => void;
  setGsStep: (s: number) => void;
  setGsLocality: (key: string) => void;
  sbpEnabled: boolean;
  onSbpEnabledChange: (v: boolean) => void;
  sbpCoveragePct: number;
  onSbpCoveragePctChange: (pct: number) => void;
}) {
  const tc = useThemeColors();
  return (
    <>
                {/* Retired + currently working GS civilian — retired pay, VA
                    disability, and a GS paycheck all stack together, so this
                    doesn't replace anything above; it adds to it. */}
                <View style={editStyles.toggleRow}>
                  <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Also Working GS Civilian Job</ThemedText>
                  <Switch value={alsoGsCivilian} onValueChange={setAlsoGsCivilianLocal} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
                </View>
                {alsoGsCivilian && (
                  <>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                      Added to your retired pay and VA disability as a separate income source in your Pay Statement.
                    </ThemedText>
                    <GsPaySelector gsGrade={gsGrade} gsStep={gsStep} gsLocality={gsLocality} onGradeChange={setGsGrade} onStepChange={setGsStep} onLocalityChange={setGsLocality} />
                  </>
                )}

                {/* SBP is an opt-in premium against retired pay — it must
                    never be assumed on for every retiree (a real share of
                    retirees decline it), and it has no active-duty
                    equivalent (see lesCalc.ts). */}
                <View style={editStyles.toggleRow}>
                  <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Survivor Benefit Plan (SBP)</ThemedText>
                  <Switch value={sbpEnabled} onValueChange={setSbpEnabledLocal} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
                </View>
                {sbpEnabled && (
                  <>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                      Coverage — the % of your retired pay your spouse/beneficiary is insured for. Deducted from retired pay at 6.5% of the covered amount.
                    </ThemedText>
                    <View style={editStyles.gsRow}>
                      {[1, 0.75, 0.5, 0.25].map((pct) => (
                        <Pressable
                          key={pct}
                          onPress={() => setSbpCoveragePctLocal(pct)}
                          style={[editStyles.gsChip, { width: 60, borderColor: tc.borderColor, backgroundColor: tc.surface }, sbpCoveragePct === pct && editStyles.gsChipActive]}>
                          <ThemedText style={[editStyles.gsChipText, { color: tc.textHint }, sbpCoveragePct === pct && { color: tc.accent }]}>
                            {Math.round(pct * 100)}%
                          </ThemedText>
                        </Pressable>
                      ))}
                    </View>
                    <ThemedText style={[editStyles.dateHint, { color: tc.tactical }]}>
                      ↳ Est. premium: {fmtPay(calcSbpPremium(getHigh3Average(grade, y) * retiredPayMultiplier(y), sbpCoveragePct))}/mo, deducted from retired pay
                    </ThemedText>
                  </>
                )}
    </>
  );
});

// ── Housing status ─────────────────────────────────────────────────────────────

export const HousingSection = React.memo(function HousingSection({ housing, onChange: setHousing }: {
  housing: HousingStatus;
  onChange: (h: HousingStatus) => void;
}) {
  const tc = useThemeColors();
  const inputBg = tc.surface;
  return (
    <>
            <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>CURRENT HOUSING</ThemedText>
            <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
              This determines your actual BAH entitlement.
            </ThemedText>
            <View style={{ gap: Spacing.one }}>
              {HOUSING_STATUS_ORDER.map((hs) => (
                <Pressable
                  key={hs}
                  onPress={() => setHousing(hs)}
                  style={[
                    editStyles.inputWrap,
                    { backgroundColor: inputBg, borderColor: housing === hs ? Brand.accent : tc.borderColor, paddingVertical: Spacing.two },
                  ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                    <ThemedText style={{ fontSize: 16, color: housing === hs ? Brand.accent : tc.textHint }}>
                      {housing === hs ? '●' : '○'}
                    </ThemedText>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary, fontSize: 14 }]}>
                        {HOUSING_STATUS_LABELS[hs]}
                      </ThemedText>
                      <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: 2 }]}>
                        {HOUSING_STATUS_DESCRIPTIONS[hs]}
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
    </>
  );
});

// ── Family separation ──────────────────────────────────────────────────────────

export const FamilySeparationSection = React.memo(function FamilySeparationSection({
  familySeparated, onFamilySeparatedChange: setFamilySeparatedLocal,
  dependentsStation, onDependentsStationChange: setDependentsStation,
}: {
  familySeparated: boolean;
  onFamilySeparatedChange: (v: boolean) => void;
  dependentsStation: Installation | null;
  onDependentsStationChange: (i: Installation) => void;
}) {
  const tc = useThemeColors();
  return (
    <>
                <View style={editStyles.toggleRow}>
                  <ThemedText style={[editStyles.toggleLabel, { color: tc.textPrimary }]}>Currently Separated From Family</ThemedText>
                  <Switch value={familySeparated} onValueChange={setFamilySeparatedLocal} trackColor={{ true: Brand.accent }} thumbColor="#FFF" />
                </View>
                {familySeparated && (
                  <>
                    <ThemedText style={[editStyles.fieldHint, { color: tc.textHint, marginTop: -Spacing.two }]}>
                      Unaccompanied OCONUS tour, sea duty, or similar orders where your family lives elsewhere.
                      Your OHA/BAH above switches to the without-dependents rate, your family draws BAH at their
                      own location, and you&apos;re added Family Separation Allowance (FSA, ${FSA_MONTHLY}/mo).
                    </ThemedText>
                    <ThemedText style={[editStyles.fieldLabel, { color: tc.textHint }]}>WHERE YOUR FAMILY LIVES</ThemedText>
                    <StationPicker label="Family's Location" selected={dependentsStation} onSelect={setDependentsStation} conusOnly />
                    {!dependentsStation && (
                      <ThemedText style={[editStyles.fieldHint, { color: Brand.danger, marginTop: -Spacing.two }]}>
                        Set this so we can calculate your family&apos;s actual BAH — without it, that entitlement won&apos;t show up in your Pay Statement.
                      </ThemedText>
                    )}
                  </>
                )}
    </>
  );
});
