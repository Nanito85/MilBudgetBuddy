import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { LOCALITIES, Locality } from '@/data/per-diem-rates';

// GSA M&IE breakdown: https://www.gsa.gov/travel/plan-book/per-diem-rates
// Standard CONUS: $59/day M&IE ($166 full rate with $107 lodging)
// High-cost CONUS split M&IE by approximate GSA schedule
function getMie(perDiem: number): number {
  if (perDiem >= 300) return 79;
  if (perDiem >= 250) return 74;
  if (perDiem >= 220) return 69;
  if (perDiem >= 200) return 64;
  if (perDiem >= 180) return 59;
  return 59; // standard
}

function getLodging(perDiem: number): number {
  return perDiem - getMie(perDiem);
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtDay = (n: number) => `$${Math.round(n).toFixed(0)}`;

export default function TdyOptimizerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<Locality>(LOCALITIES[2]); // DC
  const [days,     setDays]     = useState(14);
  const [actualLodging, setActualLodging] = useState(0);
  const [actualMie,     setActualMie]     = useState(0);

  const filteredLocalities = useMemo(() => {
    if (!search) return LOCALITIES.slice(0, 20);
    return LOCALITIES.filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.area.toLowerCase().includes(search.toLowerCase()) ||
        l.state.toLowerCase().includes(search.toLowerCase()),
    ).slice(0, 15);
  }, [search]);

  const authorizedPerDiem = selected.perDiem;
  const authorizedMie     = getMie(authorizedPerDiem);
  const authorizedLodging = getLodging(authorizedPerDiem);

  const actualLodgingFinal = actualLodging > 0 ? actualLodging : authorizedLodging * 0.6;
  const actualMieFinal     = actualMie > 0 ? actualMie : authorizedMie * 0.7;

  const actualDailyTotal  = actualLodgingFinal + actualMieFinal;
  const authorizedDaily   = authorizedPerDiem;

  const dailySavings = Math.max(0, authorizedDaily - actualDailyTotal);
  const totalSavings = dailySavings * days;
  const totalAuthorized = authorizedDaily * days;
  const totalActual     = actualDailyTotal * days;

  const pocketPct = authorizedDaily > 0 ? (dailySavings / authorizedDaily) * 100 : 0;

  function Stepper({ value, step, min, max, onChange }: {
    value: number; step: number; min: number; max: number; onChange: (v: number) => void;
  }) {
    return (
      <View style={styles.inlineStepperControls}>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - step))}>
          <ThemedText style={styles.stepBtnText}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepperValue}>{value} days</ThemedText>
        <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + step))}>
          <ThemedText style={styles.stepBtnText}>+</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/tools'))}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>TDY Per Diem</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>TDY OPTIMIZER</ThemedText>
          <ThemedText style={styles.heroTitle}>Per Diem Pocket Calculator</ThemedText>
          <ThemedText style={styles.heroBody}>
            You keep the difference. If you spend less than your authorized per diem rate, the savings are yours to pocket.
          </ThemedText>
        </ThemedView>

        {/* Location search */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>TDY LOCATION</ThemedText>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search installation or city..."
            placeholderTextColor="#3D6080"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.three }}>
            <View style={[styles.chipRow, { paddingHorizontal: Spacing.three }]}>
              {filteredLocalities.map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => { setSelected(loc); setSearch(''); }}
                  style={[styles.locChip, selected.id === loc.id && styles.locChipSelected]}>
                  <ThemedText style={[styles.locChipText, selected.id === loc.id && styles.locChipTextSelected]}>
                    {loc.name}
                  </ThemedText>
                  <ThemedText style={[styles.locChipRate, selected.id === loc.id && { color: Brand.accent }]}>
                    {fmtDay(loc.perDiem)}/day
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <View style={styles.selectedInfo}>
            <ThemedText style={styles.selectedName}>{selected.name}</ThemedText>
            <ThemedText style={styles.selectedArea}>{selected.area}</ThemedText>
          </View>
        </ThemedView>

        {/* Days */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>TDY DURATION</ThemedText>
          <View style={styles.daysRow}>
            <ThemedText style={styles.stepperLabel}>Number of days</ThemedText>
            <Stepper value={days} step={1} min={1} max={365} onChange={setDays} />
          </View>
        </ThemedView>

        {/* Authorized rates */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>AUTHORIZED PER DIEM — {selected.name.toUpperCase()}</ThemedText>
          <View style={styles.rateGrid}>
            <View style={styles.rateBox}>
              <ThemedText style={styles.rateBoxLabel}>LODGING</ThemedText>
              <ThemedText style={[styles.rateBoxValue, { color: '#208AEF' }]}>{fmtDay(authorizedLodging)}/day</ThemedText>
            </View>
            <View style={styles.rateBox}>
              <ThemedText style={styles.rateBoxLabel}>M&IE</ThemedText>
              <ThemedText style={[styles.rateBoxValue, { color: Brand.accent }]}>{fmtDay(authorizedMie)}/day</ThemedText>
            </View>
            <View style={styles.rateBox}>
              <ThemedText style={styles.rateBoxLabel}>TOTAL/DAY</ThemedText>
              <ThemedText style={[styles.rateBoxValue, { color: Brand.tactical }]}>{fmtDay(authorizedPerDiem)}/day</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.rateNote}>
            GSA FY2025 rates. {selected.oconus ? 'OCONUS — verify with DefenseTravel.' : 'CONUS rate.'}
          </ThemedText>
        </ThemedView>

        {/* Actual spend (optional) */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR ACTUAL DAILY SPEND (OPTIONAL)</ThemedText>
          <ThemedText style={styles.cardNote}>
            Leave at 0 to use estimated defaults (60% of lodging, 70% of M&IE).
          </ThemedText>
          <View style={styles.actualRow}>
            <ThemedText style={styles.stepperLabel}>Actual lodging/night</ThemedText>
            <View style={styles.inlineStepperControls}>
              <Pressable style={styles.stepBtn} onPress={() => setActualLodging(Math.max(0, actualLodging - 10))}>
                <ThemedText style={styles.stepBtnText}>−</ThemedText>
              </Pressable>
              <ThemedText style={styles.stepperValue}>{fmt(actualLodging)}</ThemedText>
              <Pressable style={styles.stepBtn} onPress={() => setActualLodging(Math.min(500, actualLodging + 10))}>
                <ThemedText style={styles.stepBtnText}>+</ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={styles.actualRow}>
            <ThemedText style={styles.stepperLabel}>Actual M&IE/day</ThemedText>
            <View style={styles.inlineStepperControls}>
              <Pressable style={styles.stepBtn} onPress={() => setActualMie(Math.max(0, actualMie - 5))}>
                <ThemedText style={styles.stepBtnText}>−</ThemedText>
              </Pressable>
              <ThemedText style={styles.stepperValue}>{fmt(actualMie)}</ThemedText>
              <Pressable style={styles.stepBtn} onPress={() => setActualMie(Math.min(200, actualMie + 5))}>
                <ThemedText style={styles.stepBtnText}>+</ThemedText>
              </Pressable>
            </View>
          </View>
        </ThemedView>

        {/* Results */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>POCKET SAVINGS — {days} DAYS</ThemedText>

          <View style={styles.bigSavingsBox}>
            <ThemedText style={styles.bigSavingsLabel}>YOU POCKET</ThemedText>
            <ThemedText style={[styles.bigSavings, { color: totalSavings > 0 ? Brand.success : '#4D7A9A' }]}>
              {fmt(totalSavings)}
            </ThemedText>
            <ThemedText style={styles.bigSavingsSub}>
              {pocketPct.toFixed(0)}% of authorized rate stays in your pocket
            </ThemedText>
          </View>

          <View style={styles.divider} />
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Authorized total ({days} days)</ThemedText>
            <ThemedText style={styles.dataValue}>{fmt(totalAuthorized)}</ThemedText>
          </View>
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Estimated actual spend</ThemedText>
            <ThemedText style={styles.dataValue}>{fmt(totalActual)}</ThemedText>
          </View>
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Daily pocket savings</ThemedText>
            <ThemedText style={[styles.dataValue, { color: Brand.success }]}>{fmt(dailySavings)}/day</ThemedText>
          </View>
        </ThemedView>

        {/* Tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>PER DIEM OPTIMIZATION TIPS</ThemedText>
          {[
            'Cook in your room: hotel kitchenettes or grocery runs reduce M&IE by 40-60%.',
            'Find off-post housing: AirBnB or weekly rentals near base often beat lodging rates.',
            'Use Costco/Sam\'s near TDY location — guest passes accepted.',
            'Day 1 and last day of TDY: you receive 75% of M&IE on travel days.',
            'Government card: use it for lodging to avoid out-of-pocket float.',
            'DTMO site: verify exact rates at defensetravel.dod.mil before travel.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
            Per diem rates per GSA FY2025. OCONUS rates per JFTR FY2025. Always verify official rates before travel at gsa.gov or defensetravel.dod.mil.
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
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.accent,
    gap: 4,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.accent },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  cardNote: { fontSize: 10, color: '#3D6080', lineHeight: 15 },

  searchInput: {
    backgroundColor: '#04080F',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 3,
    paddingHorizontal: Spacing.two,
    paddingVertical: 8,
    fontSize: 13,
    color: '#C8D8E8',
  },

  chipRow: { flexDirection: 'row', gap: 8 },
  locChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: '#04080F',
    gap: 2,
  },
  locChipSelected: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  locChipText: { fontSize: 10, fontWeight: '700', color: '#4D7A9A' },
  locChipTextSelected: { color: Brand.tactical },
  locChipRate: { fontSize: 9, color: '#3D6080' },

  selectedInfo: { gap: 2 },
  selectedName: { fontSize: 13, fontWeight: '700', color: '#C8D8E8' },
  selectedArea: { fontSize: 10, color: '#4D7A9A' },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, color: '#8AA8C0', flex: 1 },
  inlineStepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
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
  stepperValue: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', width: 75, textAlign: 'center', fontFamily: 'Courier New' },

  rateGrid: { flexDirection: 'row', gap: Spacing.two },
  rateBox: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: '#04080F', borderRadius: 3, padding: Spacing.two },
  rateBoxLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: '#3D6080' },
  rateBoxValue: { fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  rateNote: { fontSize: 9, color: '#3D6080' },

  actualRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  bigSavingsBox: {
    alignItems: 'center',
    backgroundColor: '#04080F',
    borderWidth: 1,
    borderColor: Brand.success + '40',
    borderRadius: 4,
    padding: Spacing.three,
    gap: 4,
  },
  bigSavingsLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.success },
  bigSavings: { fontSize: 26, fontWeight: '900', fontFamily: 'Courier New' },
  bigSavingsSub: { fontSize: 10, color: '#4D7A9A', textAlign: 'center' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dataLabel: { fontSize: 12, color: '#4D7A9A', flex: 1 },
  dataValue: { fontSize: 13, color: '#8AA8C0', fontFamily: 'Courier New' },

  tipRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  tipBullet: { fontSize: 10, color: Brand.accent, marginTop: 2 },
  tipText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#4D7A9A' },

  disclaimer: { borderRadius: 4, padding: Spacing.two },
  disclaimerText: { fontSize: 10, lineHeight: 15, color: '#3D6080', textAlign: 'center' },
});
