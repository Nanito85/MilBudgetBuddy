import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PayGrade } from '@/data/bah-rates';
import { PPM_DATA_YEAR } from '@/data/weight-allowances';
import { WeightBar } from '@/features/dity/components/WeightBar';
import { calcDITY, fmtLbs, fmtMoney, MoveType, TAX_BRACKETS, TaxBracket } from '@/features/dity/utils/dityCalc';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { NumberStepper } from '@/features/retirement/components/NumberStepper';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';

export default function DITYCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [grade, setGrade] = useState<PayGrade>('E5');
  const [withDep, setWithDep] = useState(true);
  const [moveType, setMoveType] = useState<MoveType>('full');
  const [actualWeight, setActualWeight] = useState(5_000);
  const [distanceMiles, setDistanceMiles] = useState(500);
  const [taxBracket, setTaxBracket] = useState<TaxBracket>(22);

  const result = calcDITY({ grade, withDep, actualWeight, distanceMiles, moveType, taxBracket });

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools'))}
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
              <GradePicker selected={grade} onSelect={(g) => {
                setGrade(g);
                setActualWeight(Math.min(actualWeight, result.authorizedWeight));
              }} />
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

        {/* WEIGHT */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              WEIGHT
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Authorized: {fmtLbs(result.authorizedWeight)}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={[styles.cardPadded, { gap: Spacing.three }]}>
              <NumberStepper
                label="Estimated weight to ship"
                value={actualWeight}
                min={100}
                max={20_000}
                step={100}
                unit="lbs"
                onChange={setActualWeight}
              />
            </View>
          </ThemedView>

          <WeightBar
            authorizedWeight={result.authorizedWeight}
            actualWeight={actualWeight}
            effectiveWeight={result.effectiveWeight}
            overAllowance={result.overAllowance}
          />
        </View>

        {/* DISTANCE */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            DISTANCE
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={[styles.cardPadded, { gap: Spacing.three }]}>
              <NumberStepper
                label="Door-to-door distance"
                value={distanceMiles}
                min={50}
                max={5_000}
                step={50}
                unit="mi"
                onChange={setDistanceMiles}
              />
              <ThemedText type="small" themeColor="textSecondary" style={styles.distanceNote}>
                Use Google Maps to find the driving distance between your old and new residences.
                Rate used: ${result.ratePerLb.toFixed(2)}/lb for {distanceMiles} miles.
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
                PPM incentive is taxable income. Select your estimated federal marginal bracket.
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
                  PPM INCENTIVE
                </ThemedText>
                <ThemedText style={[styles.bigValue, { color: Brand.primary }]}>
                  {fmtMoney(result.incentive)}
                </ThemedText>
              </View>
              <View style={styles.afterTaxBlock}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                  AFTER TAX ({taxBracket}%)
                </ThemedText>
                <ThemedText style={[styles.bigValue, { color: Brand.success }]}>
                  {fmtMoney(result.afterTax)}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Breakdown */}
            <View style={styles.breakdownSection}>
              <ResultRow label="Weight used" value={fmtLbs(result.effectiveWeight)} />
              <ResultRow label={`Gov't rate per lb (${distanceMiles} mi)`} value={`$${result.ratePerLb.toFixed(2)}/lb`} />
              <ResultRow label="Government constructed cost" value={fmtMoney(result.governmentCost)} />
              <ResultRow label={`Tax withheld (${taxBracket}%)`} value={`–${fmtMoney(result.taxAmount)}`} negative />
              <View style={styles.totalDivider} />
              <ResultRow label="Take-home (est.)" value={fmtMoney(result.afterTax)} bold accent />
            </View>

            {/* Tips */}
            <View style={[styles.tipsBox, { backgroundColor: `${Brand.accent}10` }]}>
              <ThemedText type="small" style={[styles.tipTitle, { color: Brand.accent }]}>
                Tips to maximize your incentive
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Get official weight tickets at a certified scale — before and after loading
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Ship as close to your authorized weight as possible
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Coordinate with your TMO/PPPO before moving anything
              </ThemedText>
              <ThemedText type="small" style={styles.tipItem}>
                • Keep all receipts for truck rental, fuel, packing materials
              </ThemedText>
            </View>
          </ThemedView>
        </View>

        {/* Disclaimer */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          Rates are approximate {PPM_DATA_YEAR} DTMO baseline values for planning purposes only.
          Actual PPM incentive is calculated by your Transportation Office using verified weight
          tickets and current DTMO rates. Weight allowances from JTR Table 5-A — verify with your
          TMO/PPPO before your move. Always coordinate your PPM with your local Transportation
          Management Office.
        </ThemedText>
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
  distanceNote: { lineHeight: 18 },
  chipRow: { flexDirection: 'row', gap: Spacing.two },
  chip: { flex: 1, paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.25)' },
  chipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  chipText: { fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  taxNote: { lineHeight: 18 },
  resultsCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  bigResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigValue: { fontSize: 32, fontWeight: '800', lineHeight: 38 },
  afterTaxBlock: { alignItems: 'flex-end' },
  breakdownSection: { gap: Spacing.two },
  totalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.2)' },
  tipsBox: { borderRadius: Spacing.two, padding: Spacing.two, gap: Spacing.one + 2 },
  tipTitle: { fontWeight: '700', marginBottom: 2 },
  tipItem: { lineHeight: 18 },
  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 12, paddingHorizontal: Spacing.two, paddingTop: Spacing.two },
});
