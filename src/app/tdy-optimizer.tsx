import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BranchRegNote } from '@/components/BranchRegNote';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { CONUS_DESTINATIONS, lookupPerDiemByZip, PerDiemDestination, PerDiemResult, STANDARD_LODGING, STANDARD_MEALS, STANDARD_TOTAL } from '@/data/gsa-per-diem';
import { OconusLocation, OCONUS_LOCATIONS } from '@/data/per-diem-rates';

type Mode = 'conus' | 'oconus';

interface SelectedRate {
  label: string;
  location: string;
  lodging: number;
  meals: number;
  total: number;
  isStandard?: boolean;
  isOconus?: boolean;
}

const fmt    = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtDay = (n: number) => `$${Math.round(n).toFixed(0)}`;

function destToRate(d: PerDiemDestination): SelectedRate {
  return { label: `${d.city}, ${d.state}`, location: d.county ? `${d.county} County, ${d.state}` : d.state, lodging: d.maxLodging, meals: d.meals, total: d.total };
}
function oconusToRate(l: OconusLocation): SelectedRate {
  return { label: l.name, location: l.area + ', ' + l.country, lodging: l.lodging, meals: l.meals, total: l.total, isOconus: true };
}
function zipResultToRate(r: PerDiemResult, zip: string): SelectedRate {
  return {
    label: r.isStandard ? `Standard Rate (ZIP ${zip})` : `${r.city}, ${r.state}`,
    location: r.isStandard ? 'Federal standard rate — applies to most US locations' : (r.county ? `${r.county} County, ${r.state}` : r.state),
    lodging: r.lodging,
    meals: r.meals,
    total: r.total,
    isStandard: r.isStandard,
  };
}

export default function TdyOptimizerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [mode, setMode]                 = useState<Mode>('conus');
  const [zipInput, setZipInput]         = useState('');
  const [citySearch, setCitySearch]     = useState('');
  const [selected, setSelected]         = useState<SelectedRate>({ label: 'Standard Rate', location: 'Federal standard CONUS rate', lodging: STANDARD_LODGING, meals: STANDARD_MEALS, total: STANDARD_TOTAL, isStandard: true });
  const [days, setDays]                 = useState(14);
  const [lodgingInput, setLodgingInput] = useState('');
  const [kitchenette, setKitchenette]   = useState(false);

  // ZIP lookup — triggers on 5-digit entry
  const zipResult = useMemo(() => {
    if (zipInput.length === 5 && /^\d{5}$/.test(zipInput)) {
      return lookupPerDiemByZip(zipInput);
    }
    return null;
  }, [zipInput]);

  // City search results
  const conusResults = useMemo(() => {
    if (!citySearch.trim()) return CONUS_DESTINATIONS.slice(0, 20);
    const q = citySearch.toLowerCase();
    return CONUS_DESTINATIONS.filter(
      (d) => d.city.toLowerCase().includes(q) || d.state.toLowerCase().includes(q) || d.county.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [citySearch]);

  const oconusResults = useMemo(() => {
    if (!citySearch.trim()) return OCONUS_LOCATIONS.slice(0, 20);
    const q = citySearch.toLowerCase();
    return OCONUS_LOCATIONS.filter(
      (l) => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q) || l.country.toLowerCase().includes(q),
    ).slice(0, 20);
  }, [citySearch]);

  const KITCHENETTE_SAVINGS = 15;

  const authorizedLodging = selected.lodging;
  const authorizedMie     = selected.meals;
  const authorizedTotal   = selected.total;

  const enteredLodging  = parseFloat(lodgingInput) || 0;
  const effectiveLodging = enteredLodging > 0 ? enteredLodging : authorizedLodging;
  const lodgingSavings   = Math.max(0, authorizedLodging - effectiveLodging);
  const mieSavings       = kitchenette ? KITCHENETTE_SAVINGS : 0;
  const dailySavings     = lodgingSavings + mieSavings;
  const totalSavings     = dailySavings * days;
  const totalAuthorized  = authorizedTotal * days;
  const pocketPct        = authorizedTotal > 0 ? (dailySavings / authorizedTotal) * 100 : 0;

  function Stepper({ value, step, min, max, onChange }: { value: number; step: number; min: number; max: number; onChange: (v: number) => void }) {
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.push('/tools')} style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>TDY Per Diem</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>TDY OPTIMIZER</ThemedText>
          <ThemedText style={styles.heroTitle}>Per Diem Pocket Calculator</ThemedText>
          <ThemedText style={styles.heroBody}>
            You keep the difference. If you spend less than your authorized per diem, the savings are yours to pocket. Covers all 42,000+ US ZIP codes + 80+ overseas locations.
          </ThemedText>
        </ThemedView>

        {/* Mode tabs */}
        <View style={styles.tabRow}>
          {(['conus', 'oconus'] as Mode[]).map((m) => (
            <Pressable key={m} onPress={() => { setMode(m); setCitySearch(''); setZipInput(''); }} style={[styles.tab, mode === m && styles.tabActive]}>
              <ThemedText style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === 'conus' ? 'CONUS' : 'OCONUS'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Location picker */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>TDY LOCATION</ThemedText>

          {mode === 'conus' && (
            <>
              {/* ZIP lookup */}
              <View style={styles.zipRow}>
                <TextInput
                  style={[styles.searchInput, { flex: 1 }]}
                  value={zipInput}
                  onChangeText={(t) => setZipInput(t.replace(/\D/g, '').slice(0, 5))}
                  placeholder="Enter ZIP code for instant lookup..."
                  placeholderTextColor="#3D6080"
                  keyboardType="number-pad"
                  maxLength={5}
                />
                {zipResult && (
                  <Pressable
                    style={styles.zipApplyBtn}
                    onPress={() => { setSelected(zipResultToRate(zipResult, zipInput)); Keyboard.dismiss(); }}>
                    <ThemedText style={styles.zipApplyText}>USE</ThemedText>
                  </Pressable>
                )}
              </View>

              {zipResult && (
                <View style={styles.zipPreview}>
                  <ThemedText style={styles.zipPreviewCity}>{zipResult.isStandard ? 'Federal Standard Rate' : `${zipResult.city}, ${zipResult.state}`}</ThemedText>
                  <ThemedText style={styles.zipPreviewRate}>{fmtDay(zipResult.total)}/day • Lodging {fmtDay(zipResult.lodging)} + M&IE {fmtDay(zipResult.meals)}</ThemedText>
                </View>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <ThemedText style={styles.dividerText}>OR SEARCH BY CITY</ThemedText>
                <View style={styles.dividerLine} />
              </View>

              <TextInput
                style={styles.searchInput}
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="City, county, or state..."
                placeholderTextColor="#3D6080"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.three }}>
                <View style={[styles.chipRow, { paddingHorizontal: Spacing.three }]}>
                  {conusResults.map((d) => (
                    <Pressable key={d.did} onPress={() => { setSelected(destToRate(d)); setCitySearch(''); Keyboard.dismiss(); }} style={[styles.locChip, selected.label === `${d.city}, ${d.state}` && styles.locChipSelected]}>
                      <ThemedText style={[styles.locChipText, selected.label === `${d.city}, ${d.state}` && styles.locChipTextSelected]}>{d.city}, {d.state}</ThemedText>
                      <ThemedText style={[styles.locChipRate, selected.label === `${d.city}, ${d.state}` && { color: Brand.accent }]}>{fmtDay(d.total)}/day</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {mode === 'oconus' && (
            <>
              <TextInput
                style={styles.searchInput}
                value={citySearch}
                onChangeText={setCitySearch}
                placeholder="Installation, city, or country..."
                placeholderTextColor="#3D6080"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.three }}>
                <View style={[styles.chipRow, { paddingHorizontal: Spacing.three }]}>
                  {oconusResults.map((l) => (
                    <Pressable key={l.id} onPress={() => { setSelected(oconusToRate(l)); setCitySearch(''); Keyboard.dismiss(); }} style={[styles.locChip, selected.label === l.name && styles.locChipSelected]}>
                      <ThemedText style={[styles.locChipText, selected.label === l.name && styles.locChipTextSelected]}>{l.name}</ThemedText>
                      <ThemedText style={[styles.locChipRate, selected.label === l.name && { color: Brand.accent }]}>{fmtDay(l.total)}/day</ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          <View style={styles.selectedInfo}>
            <ThemedText style={styles.selectedName}>{selected.label}</ThemedText>
            <ThemedText style={styles.selectedArea}>{selected.location}</ThemedText>
            {selected.isStandard && <ThemedText style={styles.standardBadge}>FEDERAL STANDARD RATE</ThemedText>}
            {selected.isOconus && <ThemedText style={styles.oconusBadge}>OCONUS — verify at travel.dod.mil</ThemedText>}
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
          <ThemedText style={styles.cardLabel}>AUTHORIZED PER DIEM — {selected.label.toUpperCase()}</ThemedText>
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
              <ThemedText style={[styles.rateBoxValue, { color: Brand.tactical }]}>{fmtDay(authorizedTotal)}/day</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.rateNote}>
            GSA FY2026 rates. {selected.isOconus ? 'OCONUS — verify with DefenseTravel.' : 'CONUS rate.'}
          </ThemedText>
        </ThemedView>

        {/* Actual spend */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR ACTUAL SPEND</ThemedText>

          <View style={styles.actualRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={styles.stepperLabel}>Actual lodging/night</ThemedText>
              <ThemedText style={[styles.cardNote, { marginTop: 0 }]}>Authorized: {fmtDay(authorizedLodging)}/night</ThemedText>
            </View>
            <TextInput
              style={styles.lodgingInput}
              value={lodgingInput}
              onChangeText={(t) => setLodgingInput(t.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder={`${authorizedLodging}`}
              placeholderTextColor="#3D6080"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>

          <View style={[styles.actualRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.15)', paddingTop: Spacing.two }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={styles.stepperLabel}>M&IE</ThemedText>
              <ThemedText style={styles.cardNote}>Your authorized entitlement — unchanged</ThemedText>
            </View>
            <ThemedText style={[styles.stepperValue, { color: Brand.accent }]}>{fmtDay(authorizedMie)}/day</ThemedText>
          </View>

          <View style={[styles.actualRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.15)', paddingTop: Spacing.two }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText style={styles.stepperLabel}>Kitchenette available?</ThemedText>
              <ThemedText style={styles.cardNote}>Cooking saves ~{fmtDay(KITCHENETTE_SAVINGS)}/day on food spend</ThemedText>
            </View>
            <View style={styles.kToggle}>
              {([false, true] as const).map((val) => (
                <Pressable key={String(val)} onPress={() => setKitchenette(val)} style={[styles.kToggleBtn, kitchenette === val && styles.kToggleBtnActive]}>
                  <ThemedText style={[styles.kToggleTxt, kitchenette === val && styles.kToggleTxtActive]}>{val ? 'Yes' : 'No'}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </ThemedView>

        {/* Results */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>POCKET SAVINGS — {days} DAYS</ThemedText>

          <View style={styles.bigSavingsBox}>
            <ThemedText style={styles.bigSavingsLabel}>YOU POCKET</ThemedText>
            <ThemedText style={[styles.bigSavings, { color: totalSavings > 0 ? Brand.success : '#4D7A9A' }]}>{fmt(totalSavings)}</ThemedText>
            <ThemedText style={styles.bigSavingsSub}>{pocketPct.toFixed(0)}% of authorized per diem stays in your pocket</ThemedText>
          </View>

          <View style={styles.divider} />
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Authorized per diem ({days} days)</ThemedText>
            <ThemedText style={styles.dataValue}>{fmt(totalAuthorized)}</ThemedText>
          </View>
          {lodgingSavings > 0 && (
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataLabel}>Lodging savings/day</ThemedText>
              <ThemedText style={[styles.dataValue, { color: Brand.success }]}>+{fmtDay(lodgingSavings)}/day</ThemedText>
            </View>
          )}
          {kitchenette && (
            <View style={styles.dataRow}>
              <ThemedText style={styles.dataLabel}>Kitchenette savings/day</ThemedText>
              <ThemedText style={[styles.dataValue, { color: Brand.success }]}>+{fmtDay(KITCHENETTE_SAVINGS)}/day</ThemedText>
            </View>
          )}
          <View style={styles.dataRow}>
            <ThemedText style={styles.dataLabel}>Total pocket savings/day</ThemedText>
            <ThemedText style={[styles.dataValue, { color: Brand.success }]}>{fmtDay(dailySavings)}/day</ThemedText>
          </View>
        </ThemedView>

        {/* Tips */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>PER DIEM OPTIMIZATION TIPS</ThemedText>
          {[
            'Cook in your room: hotel kitchenettes or grocery runs reduce M&IE by 40–60%.',
            'Find off-post housing: AirBnB or weekly rentals near base often beat lodging rates.',
            'Day 1 and last day of TDY: you receive 75% of M&IE on travel days.',
            'Government card: use it for lodging to avoid out-of-pocket float.',
            'Look up any US ZIP code — this app covers all 42,000+ US ZIP codes.',
            'DTMO site: verify exact OCONUS rates at defensetravel.dod.mil before travel.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <ThemedText style={styles.tipBullet}>▸</ThemedText>
              <ThemedText style={styles.tipText}>{tip}</ThemedText>
            </View>
          ))}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
            CONUS rates: GSA FY2026. OCONUS rates: DoD DTMO JFTR FY2026. Always verify official rates before travel at gsa.gov or defensetravel.dod.mil.
          </ThemedText>
        </ThemedView>

        <BranchRegNote />

      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  title: { fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: { borderRadius: 4, padding: Spacing.three, borderLeftWidth: 3, borderLeftColor: Brand.accent, gap: 4 },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.accent },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  tabRow: { flexDirection: 'row', borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: Brand.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#04080F' },
  tabActive: { backgroundColor: Brand.tactical },
  tabText: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#4D7A9A' },
  tabTextActive: { color: '#000' },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  cardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2, color: Brand.tactical, marginBottom: 2 },
  cardNote: { fontSize: 10, color: '#3D6080', lineHeight: 15 },

  zipRow: { flexDirection: 'row', gap: Spacing.one, alignItems: 'center' },
  zipApplyBtn: { backgroundColor: Brand.tactical, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 3 },
  zipApplyText: { fontSize: 11, fontWeight: '800', color: '#000' },
  zipPreview: { backgroundColor: '#04080F', borderRadius: 3, padding: Spacing.two, gap: 2, borderWidth: 1, borderColor: Brand.tactical + '60' },
  zipPreviewCity: { fontSize: 13, fontWeight: '700', color: Brand.tactical },
  zipPreviewRate: { fontSize: 11, color: '#4D7A9A' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  dividerText: { fontSize: 9, fontWeight: '800', letterSpacing: 1, color: '#3D6080' },

  searchInput: { backgroundColor: '#04080F', borderWidth: 1, borderColor: Brand.border, borderRadius: 3, paddingHorizontal: Spacing.two, paddingVertical: 8, fontSize: 13, color: '#C8D8E8' },

  chipRow: { flexDirection: 'row', gap: 8 },
  locChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 3, borderWidth: 1, borderColor: Brand.border, backgroundColor: '#04080F', gap: 2 },
  locChipSelected: { borderColor: Brand.tactical, backgroundColor: Brand.tactical + '20' },
  locChipText: { fontSize: 10, fontWeight: '700', color: '#4D7A9A' },
  locChipTextSelected: { color: Brand.tactical },
  locChipRate: { fontSize: 9, color: '#3D6080' },

  selectedInfo: { gap: 2 },
  selectedName: { fontSize: 13, fontWeight: '700', color: '#C8D8E8' },
  selectedArea: { fontSize: 10, color: '#4D7A9A' },
  standardBadge: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: Brand.accent, marginTop: 2 },
  oconusBadge: { fontSize: 8, fontWeight: '800', letterSpacing: 1, color: Brand.danger, marginTop: 2 },

  daysRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 12, color: '#8AA8C0', flex: 1 },
  inlineStepperControls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: { width: 30, height: 30, borderRadius: 3, borderWidth: 1, borderColor: Brand.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#04080F' },
  stepBtnText: { fontSize: 18, fontWeight: '300', color: Brand.tactical },
  stepperValue: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', width: 75, textAlign: 'center', fontFamily: 'Courier New' },

  rateGrid: { flexDirection: 'row', gap: Spacing.two },
  rateBox: { flex: 1, alignItems: 'center', gap: 4, backgroundColor: '#04080F', borderRadius: 3, padding: Spacing.two },
  rateBoxLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.8, color: '#3D6080' },
  rateBoxValue: { fontSize: 16, fontWeight: '900', fontFamily: 'Courier New' },
  rateNote: { fontSize: 9, color: '#3D6080' },

  actualRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  lodgingInput: { backgroundColor: '#04080F', borderWidth: 1, borderColor: Brand.border, borderRadius: 4, paddingHorizontal: Spacing.two, paddingVertical: 8, fontSize: 15, fontWeight: '700', color: '#C8D8E8', width: 90, textAlign: 'right', fontFamily: 'Courier New' },

  kToggle: { flexDirection: 'row', gap: Spacing.one },
  kToggleBtn: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.1)', minWidth: 44, alignItems: 'center' },
  kToggleBtnActive: { backgroundColor: Brand.tactical },
  kToggleTxt: { fontSize: 12, fontWeight: '700', color: '#4D7A9A' },
  kToggleTxtActive: { color: '#000' },

  bigSavingsBox: { alignItems: 'center', backgroundColor: '#04080F', borderWidth: 1, borderColor: Brand.success + '40', borderRadius: 4, padding: Spacing.three, gap: 4 },
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
