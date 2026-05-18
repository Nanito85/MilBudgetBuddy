import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BAH_DATA_YEAR, PayGrade } from '@/data/bah-rates';
import { Installation } from '@/data/installations';
import { ComparisonTable } from '@/features/pcs/components/ComparisonTable';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { calcPCS } from '@/features/pcs/utils/pcsCalc';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';

export default function PCSCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [grade, setGrade] = useState<PayGrade>('E5');
  const [withDep, setWithDep] = useState(true);
  const [currentStation, setCurrentStation] = useState<Installation | null>(null);
  const [gainingStation, setGainingStation] = useState<Installation | null>(null);

  const result = calcPCS(currentStation, gainingStation, grade, withDep);
  const showComparison = currentStation != null && gainingStation != null;

  const swapStations = () => {
    setCurrentStation(gainingStation);
    setGainingStation(currentStation);
  };

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
          <ThemedText style={styles.title}>PCS Calculator</ThemedText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* YOUR INFO */}
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
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Dependent Status
              </ThemedText>
              <View style={styles.depToggle}>
                {[true, false].map((val) => (
                  <Pressable
                    key={String(val)}
                    onPress={() => setWithDep(val)}
                    style={[styles.depBtn, withDep === val && styles.depBtnActive]}>
                    <ThemedText style={[styles.depBtnText, withDep === val && styles.depBtnTextActive]}>
                      {val ? 'With Dependents' : 'Without Dependents'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </ThemedView>
        </View>

        {/* DUTY STATIONS */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            DUTY STATIONS
          </ThemedText>

          <StationPicker
            label="Current Station"
            selected={currentStation}
            onSelect={setCurrentStation}
          />

          {/* Swap button */}
          <Pressable
            onPress={swapStations}
            style={({ pressed }) => [styles.swapBtn, pressed && styles.pressed]}>
            <ThemedText style={styles.swapIcon}>⇅</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Swap</ThemedText>
          </Pressable>

          <StationPicker
            label="Gaining Station"
            selected={gainingStation}
            onSelect={setGainingStation}
          />
        </View>

        {/* COMPARISON */}
        {showComparison && (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              COMPARISON
            </ThemedText>
            <ComparisonTable
              result={result}
              current={currentStation!}
              gaining={gainingStation!}
            />
          </View>
        )}

        {/* Empty state prompt */}
        {!showComparison && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🚚</ThemedText>
            <ThemedText style={styles.emptyTitle}>Select both stations</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
              Choose your current and gaining duty stations above to see your BAH comparison.
            </ThemedText>
          </ThemedView>
        )}

        {/* Disclaimer */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          BAH rates shown are for {BAH_DATA_YEAR}. Rates update each January. Verify current rates
          at travel.dod.mil before making PCS decisions. OCONUS stations use OHA — contact your
          finance office.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginHorizontal: Spacing.three,
  },
  depToggle: { flexDirection: 'row', gap: Spacing.two },
  depBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  depBtnActive: { backgroundColor: Brand.primary },
  depBtnText: { fontSize: 13, fontWeight: '600' },
  depBtnTextActive: { color: '#FFFFFF' },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  swapIcon: { fontSize: 18, color: Brand.primary },
  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
});
