import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchRegNote } from '@/components/BranchRegNote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PayGrade } from '@/data/bah-rates';
import { estimateDrivingMiles } from '@/data/installation-coords';
import { Installation } from '@/data/installations';
import { PPM_DATA_YEAR } from '@/data/weight-allowances';
import { WeightBar } from '@/features/dity/components/WeightBar';
import { calcDITY, fmtLbs, fmtMoney, fmtMoneySigned, MoveType, TAX_BRACKETS, TaxBracket } from '@/features/dity/utils/dityCalc';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

export default function DITYCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const [grade, setGrade] = useState<PayGrade>('E5');
  const [withDep, setWithDep] = useState(true);
  const [hasSpouse, setHasSpouse] = useState(true);
  const [moveType, setMoveType] = useState<MoveType>('full');
  const [taxBracket, setTaxBracket] = useState<TaxBracket>(22);
  const [fromStation, setFromStation] = useState<Installation | null>(null);
  const [toStation, setToStation] = useState<Installation | null>(null);
  const [proGearWeight, setProGearWeight] = useState(0);
  const [spouseProGearWeight, setSpouseProGearWeight] = useState(0);
  const [expensesText, setExpensesText] = useState('');
  const allowableExpenses = parseFloat(expensesText) || 0;

  // Always start at the authorized weight for this grade/dep combo
  const baseResult = calcDITY({
    grade, withDep, hasSpouse, actualWeight: 0, proGearWeight: 0, spouseProGearWeight: 0,
    distanceMiles: 500, moveType, allowableExpenses: 0, taxBracket,
  });
  const [actualWeight, setActualWeight] = useState(baseResult.hhgAllowance);
  const [distanceMiles, setDistanceMiles] = useState(500);
  const [distanceFromStations, setDistanceFromStations] = useState(false);

  // Spouse pro-gear only applies when the member has dependents
  useEffect(() => {
    if (!withDep) setHasSpouse(false);
  }, [withDep]);

  // When grade or dep status changes, reset weight to the new max allowance
  useEffect(() => {
    const auth = calcDITY({
      grade, withDep, hasSpouse, actualWeight: 0, proGearWeight: 0, spouseProGearWeight: 0,
      distanceMiles, moveType, allowableExpenses: 0, taxBracket,
    }).hhgAllowance;
    setActualWeight(auth);
  }, [grade, withDep]);

  // When both stations are set, compute estimated distance
  useEffect(() => {
    if (fromStation && toStation) {
      const est = estimateDrivingMiles(fromStation.id, toStation.id);
      if (est != null) {
        setDistanceMiles(est);
        setDistanceFromStations(true);
      } else {
        setDistanceFromStations(false);
      }
    } else {
      setDistanceFromStations(false);
    }
  }, [fromStation, toStation]);

  const result = calcDITY({
    grade, withDep, hasSpouse, actualWeight, proGearWeight, spouseProGearWeight,
    distanceMiles, moveType, allowableExpenses, taxBracket,
  });

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
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
          <ThemedText style={styles.title}>DITY / PPM Calculator</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* BLUF */}
        <ThemedView type="backgroundElement" style={styles.blufBox}>
          <ThemedText style={styles.blufTitle}>BLUF</ThemedText>
          <ThemedText type="small" style={{ lineHeight: 18 }}>
            When you move yourself (PPM), the government pays you 100% of what it would have paid
            a commercial mover. If your actual moving costs are less than that amount, you keep the
            difference tax-free... except the incentive itself is taxable income.
          </ThemedText>
        </ThemedView>

        {/* YOUR MOVE */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            YOUR MOVE
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
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Dependent Status
              </ThemedText>
              <View style={styles.toggleRow}>
                {([true, false] as const).map((val) => (
                  <Pressable
                    key={String(val)}
                    onPress={() => setWithDep(val)}
                    style={[styles.toggleBtn, withDep === val && styles.toggleBtnActive]}>
                    <ThemedText style={[styles.toggleText, withDep === val && styles.toggleTextActive]}>
                      {val ? 'With Dependents' : 'Without'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {withDep && (
                <View style={{ marginTop: Spacing.two }}>
                  <View style={styles.toggleRow}>
                    <Pressable
                      onPress={() => setHasSpouse(!hasSpouse)}
                      style={[styles.toggleBtn, hasSpouse && styles.toggleBtnActive]}>
                      <ThemedText style={[styles.toggleText, hasSpouse && styles.toggleTextActive]}>
                        {hasSpouse ? 'Spouse accompanying (500 lb pro-gear)' : 'No spouse pro-gear'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Move Type
              </ThemedText>
              <View style={styles.toggleRow}>
                {([['full','Full PPM'],['partial','Partial PPM']] as [MoveType, string][]).map(([val, label]) => (
                  <Pressable
                    key={val}
                    onPress={() => setMoveType(val)}
                    style={[styles.toggleBtn, moveType === val && styles.toggleBtnActive]}>
                    <ThemedText style={[styles.toggleText, moveType === val && styles.toggleTextActive]}>
                      {label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {moveType === 'partial' && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.moveTypeNote}>
                  Partial PPM: you move some items, the government moves the rest. Enter only the
                  weight you plan to move yourself.
                </ThemedText>
              )}
            </View>
          </ThemedView>
        </View>

        {/* DUTY STATIONS */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            DUTY STATIONS
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                FROM (Current Station)
              </ThemedText>
              <StationPicker
                label="Select current station"
                selected={fromStation}
                onSelect={setFromStation}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                TO (Gaining Station)
              </ThemedText>
              <StationPicker
                label="Select gaining station"
                selected={toStation}
                onSelect={setToStation}
              />
            </View>
          </ThemedView>
          {distanceFromStations && fromStation && toStation && (
            <ThemedView type="backgroundElement" style={styles.distanceChip}>
              <ThemedText style={styles.distanceChipIcon}>📍</ThemedText>
              <ThemedText type="small" style={styles.distanceChipText}>
                Est. driving distance: <ThemedText style={{ fontWeight: '700', color: Brand.accent }}>{distanceMiles} miles</ThemedText>
                {' '}({fromStation.name} → {toStation.name})
              </ThemedText>
            </ThemedView>
          )}
          {fromStation && toStation && !distanceFromStations && (
            <ThemedText type="small" themeColor="textSecondary" style={styles.noCoordNote}>
              Distance estimate unavailable for this pair — enter manually below.
            </ThemedText>
          )}
        </View>

        {/* WEIGHT */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              WEIGHT
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              HHG max: {fmtLbs(result.hhgAllowance)}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={[styles.cardPadded, { gap: Spacing.three }]}>
              <NumberStepper
                label="Household goods (HHG) to ship"
                value={actualWeight}
                min={100}
                max={20_000}
                step={100}
                unit="lbs"
                onChange={setActualWeight}
              />
              <NumberStepper
                label={`Your pro-gear (books, papers, equipment — up to ${fmtLbs(2000)})`}
                value={proGearWeight}
                min={0}
                max={2_000}
                step={50}
                unit="lbs"
                onChange={setProGearWeight}
              />
              {hasSpouse && (
                <NumberStepper
                  label={`Spouse pro-gear (up to ${fmtLbs(500)})`}
                  value={spouseProGearWeight}
                  min={0}
                  max={500}
                  step={25}
                  unit="lbs"
                  onChange={setSpouseProGearWeight}
                />
              )}
              <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                Pro-gear doesn't count against your HHG allowance, but it must be declared and
                weighed separately — or the carrier folds it into your HHG weight and you lose the
                extra allowance. Total authorized: {fmtLbs(result.totalAuthorizedWeight)}.
              </ThemedText>
            </View>
          </ThemedView>

          <WeightBar
            authorizedWeight={result.totalAuthorizedWeight}
            actualWeight={result.totalRequestedWeight}
            effectiveWeight={result.effectiveWeight}
            overAllowance={result.overAllowance}
          />
        </View>

        {/* DISTANCE (manual override or display) */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            DISTANCE
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={[styles.cardPadded, { gap: Spacing.three }]}>
              <NumberStepper
                label={distanceFromStations ? 'Est. driving distance (adjust if needed)' : 'Door-to-door distance'}
                value={distanceMiles}
                min={50}
                max={5_000}
                step={25}
                unit="mi"
                onChange={(v) => { setDistanceMiles(v); }}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.distanceNote}>
                {distanceFromStations
                  ? `Estimated via straight-line × 1.25 driving factor. Adjust if your actual route differs. Rate: $${result.ratePerLb.toFixed(2)}/lb.`
                  : `Select both duty stations above for auto-fill, or use Google Maps to get the driving distance. Rate: $${result.ratePerLb.toFixed(2)}/lb for ${distanceMiles} miles.`
                }
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* EXPENSES */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            SUBSTANTIATED MOVING EXPENSES
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Rental truck, packing materials, fuel/tolls, hired labor, weighing fees, SIT ($)
              </ThemedText>
              <TextInput
                value={expensesText}
                onChangeText={setExpensesText}
                placeholder="e.g. 1200"
                keyboardType="numeric"
                placeholderTextColor={tc.textSecondary}
                style={[styles.expensesInput, { color: tc.textPrimary, borderColor: tc.borderColor }]}
              />
              <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 18 }}>
                These deduct from your taxable incentive on Form 3903 when you file. See the
                deductible-vs-not list below the estimate.
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* TAX BRACKET */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            YOUR TAX BRACKET
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.cardPadded}>
              <View style={styles.chipRow}>
                {TAX_BRACKETS.map((bracket) => (
                  <Pressable
                    key={bracket}
                    onPress={() => setTaxBracket(bracket)}
                    style={[styles.chip, taxBracket === bracket && styles.chipActive]}>
                    <ThemedText style={[styles.chipText, taxBracket === bracket && styles.chipTextActive]}>
                      {bracket}%
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.taxNote}>
                PPM incentive is taxable income (reported on your W-2). Select your estimated
                federal marginal bracket — this is used to estimate your true liability once you
                file, separate from what DFAS withholds at settlement.
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* RESULTS */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            ESTIMATE
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.resultsCard}>
            {/* Big incentive number */}
            <View style={styles.bigResultRow}>
              <View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  PPM INCENTIVE (100% GCC)
                </ThemedText>
                <ThemedText style={[styles.bigValue, { color: Brand.primary }]}>
                  {fmtMoney(result.incentive)}
                </ThemedText>
              </View>
              <View style={styles.afterTaxBlock}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  CASH AT SETTLEMENT
                </ThemedText>
                <ThemedText style={[styles.bigValue, { color: Brand.accent }]}>
                  {fmtMoney(result.cashAtSettlement)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Weight / GCC breakdown */}
            <View style={styles.breakdownSection}>
              <ThemedText style={styles.groupHeading}>WEIGHT & GCC</ThemedText>
              <ResultRow label="HHG weight" value={fmtLbs(result.actualWeight)} />
              {result.proGearWeight > 0 && (
                <ResultRow label="+ Your pro-gear" value={fmtLbs(result.proGearWeight)} />
              )}
              {result.spouseProGearWeight > 0 && (
                <ResultRow label="+ Spouse pro-gear" value={fmtLbs(result.spouseProGearWeight)} />
              )}
              <ResultRow label="Total weight paid on" value={fmtLbs(result.effectiveWeight)} bold />
              <ResultRow label={`Est. gov't rate (${distanceMiles} mi)`} value={`$${result.ratePerLb.toFixed(2)}/lb`} />
              <ResultRow label="Government constructed cost (GCC)" value={fmtMoney(result.governmentCost)} bold />
            </View>

            <View style={styles.totalDivider} />

            {/* Settlement / withholding */}
            <View style={styles.breakdownSection}>
              <ThemedText style={styles.groupHeading}>AT SETTLEMENT (WHAT DFAS PAYS YOU)</ThemedText>
              <ResultRow label="PPM incentive (taxable, on your W-2)" value={fmtMoney(result.incentive)} />
              <ResultRow label="Federal withholding (flat 22%)" value={`–${fmtMoney(result.federalWithholdingAtSettlement)}`} negative />
              <ResultRow label="Cash deposited to you" value={fmtMoney(result.cashAtSettlement)} bold accent />
            </View>

            <View style={styles.totalDivider} />

            {/* Tax filing true-up */}
            <View style={styles.breakdownSection}>
              <ThemedText style={styles.groupHeading}>AT TAX FILING (FORM 3903)</ThemedText>
              <ResultRow label="Substantiated moving expenses" value={`–${fmtMoney(result.allowableExpenses)}`} />
              <ResultRow label="Taxable income after deduction" value={fmtMoney(result.taxableAfterExpenses)} />
              <ResultRow label={`Est. true tax liability (${taxBracket}% bracket)`} value={fmtMoney(result.estimatedTrueTaxLiability)} />
              <ResultRow
                label={result.refundOrOwedAtFiling >= 0 ? 'Est. refund at filing' : 'Est. amount you owe at filing'}
                value={fmtMoneySigned(result.refundOrOwedAtFiling)}
                accent={result.refundOrOwedAtFiling >= 0}
                negative={result.refundOrOwedAtFiling < 0}
              />
              <View style={styles.totalDivider} />
              <ResultRow label="Final net profit (all-in)" value={fmtMoney(result.finalNetProfit)} bold accent />
            </View>

            {/* Deductible expenses reference */}
            <View style={[styles.tipsBox, { backgroundColor: `${Brand.success}10` }]}>
              <ThemedText type="small" style={[styles.tipTitle, { color: Brand.success }]}>
                ✓ Deductible PPM expenses (Form 3903)
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                Rental truck/trailer/POD, hired moving labor (with receipt), packing materials,
                weighing fees, fuel & tolls for the rental vehicle, parking fees, storage-in-transit
                up to 90 days (with TMO approval).
              </ThemedText>
            </View>
            <View style={[styles.tipsBox, { backgroundColor: `${Brand.danger}10` }]}>
              <ThemedText type="small" style={[styles.tipTitle, { color: Brand.danger }]}>
                ✕ NOT deductible
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                Moving/cargo insurance, auto transport, sales tax, meals, lodging, and POV gas —
                POV mileage is already reimbursed separately through MALT.
              </ThemedText>
            </View>

            {/* Tips */}
            <View style={[styles.tipsBox, { backgroundColor: `${Brand.accent}10` }]}>
              <ThemedText type="small" style={[styles.tipTitle, { color: Brand.accent }]}>
                Tips to maximize your incentive
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Get official weight tickets at a certified scale — empty (before) and full (after)
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Declare and weigh pro-gear separately, or it gets folded into your HHG weight
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Ship as close to your authorized weight as possible
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Coordinate with your TMO/PPPO before moving anything
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Keep every receipt — rental truck, packing materials, tolls, hired labor
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* Disclaimer */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          The gov't rate per lb above is a rough planning estimate — DoD does not publish a public
          per-pound GCC table; your actual Government Constructed Cost is computed per-move in DPS
          using the current move-management contractor's tariff. Get your authoritative GCC estimate
          from the official PPM estimator in DPS/move.mil, or your TMO/PPPO, before making financial
          decisions. Driving distance estimates use straight-line × 1.25 factor — verify your actual
          route. Weight allowances are from JTR Table 5-37 ({PPM_DATA_YEAR}); pro-gear (2,000 lb
          member / 500 lb spouse) is separate from and does not count against your HHG allowance.
          PPM incentive is 100% of GCC per 37 U.S.C.; this is not tax advice — consult a tax
          professional or your legal assistance office about your specific filing.
        </ThemedText>
        <BranchRegNote />
      </ScrollView>
    </ThemedView>
  );
}

function ResultRow({
  label, value, negative, bold, accent,
}: {
  label: string; value: string; negative?: boolean; bold?: boolean; accent?: boolean;
}) {
  return (
    <View style={rrStyles.row}>
      <ThemedText themeColor={bold ? 'text' : 'textSecondary'} style={[rrStyles.label, bold && rrStyles.labelBold]}>
        {label}
      </ThemedText>
      <ThemedText
        style={[
          rrStyles.value,
          negative && { color: Brand.danger },
          accent && { color: Brand.success },
          bold && rrStyles.valueBold,
        ]}>
        {value}
      </ThemedText>
    </View>
  );
}

const rrStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { flex: 1, fontSize: 14 },
  labelBold: { fontWeight: '600', fontSize: 15 },
  value: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
  valueBold: { fontSize: 17, fontWeight: '800' },
});

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
  blufBox: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    borderLeftWidth: 4,
    borderLeftColor: Brand.accent,
  },
  blufTitle: { fontSize: 11, fontWeight: '800', color: Brand.accent, letterSpacing: 0.8 },
  section: { gap: Spacing.two },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.one },
  sectionLabel: { letterSpacing: 0.8 },
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)', marginHorizontal: Spacing.three },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggleBtn: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center', backgroundColor: 'rgba(128,128,128,0.12)' },
  toggleBtnActive: { backgroundColor: Brand.primary },
  toggleText: { fontSize: 13, fontWeight: '600' },
  toggleTextActive: { color: '#FFFFFF' },
  moveTypeNote: { lineHeight: 18, marginTop: Spacing.one },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.two,
    padding: Spacing.two + 2,
    borderLeftWidth: 3,
    borderLeftColor: Brand.accent,
  },
  distanceChipIcon: { fontSize: 16 },
  distanceChipText: { flex: 1, lineHeight: 18 },
  noCoordNote: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.two },
  distanceNote: { lineHeight: 18 },
  chipRow: { flexDirection: 'row', gap: Spacing.two },
  chip: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.25)' },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  taxNote: { lineHeight: 18 },
  resultsCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  bigResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigValue: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  afterTaxBlock: { alignItems: 'flex-end' },
  breakdownSection: { gap: Spacing.two },
  groupHeading: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, opacity: 0.6, marginBottom: 2 },
  expensesInput: {
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.two,
  },
  totalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)' },
  tipsBox: { borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.one + 2 },
  tipTitle: { fontWeight: '700', marginBottom: 2 },
  tipItem: { lineHeight: 18 },
  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 12, paddingHorizontal: Spacing.two, paddingTop: Spacing.two },
});
