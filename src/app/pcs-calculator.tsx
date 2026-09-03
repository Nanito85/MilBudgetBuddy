import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BAH_DATA_YEAR, PayGrade } from '@/data/bah-rates';
import { Installation, getInstallationByZip } from '@/data/installations';
import { getOhaAreaForInstallation } from '@/data/oha-rates';
import { ComparisonTable } from '@/features/pcs/components/ComparisonTable';
import { GradePicker } from '@/features/pcs/components/GradePicker';
import { OHACard } from '@/features/pcs/components/OHACard';
import { StationPicker } from '@/features/pcs/components/StationPicker';
import { calcPCS, getStationPerDiem } from '@/features/pcs/utils/pcsCalc';
import { BottomTabInset, Brand, Fonts, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useUserStore } from '@/store/user.store';
import { FamilyComposer } from '@/features/tle/components/FamilyComposer';
import { calcTLE, familyLabel, TLA_MAX_DAYS, TLE_DAILY_CAP, TLE_MAX_DAYS } from '@/features/tle/utils/tleCalc';

// ── DLA Tables (FY2026, effective Jan 1 2026, per JTR Table 5-A) ──────────────
const DLA: Record<string, { noDep: number; withDep: number }> = {
  E1:  { noDep: 1870.58, withDep: 3548.02 },
  E2:  { noDep: 2025.26, withDep: 3548.02 },
  E3:  { noDep: 2355.48, withDep: 3548.02 },
  E4:  { noDep: 2389.42, withDep: 3548.02 },
  E5:  { noDep: 2389.42, withDep: 3548.02 },
  E6:  { noDep: 2389.42, withDep: 3548.02 },
  E7:  { noDep: 2468.19, withDep: 3551.31 },
  E8:  { noDep: 2888.97, withDep: 3824.94 },
  E9:  { noDep: 3147.54, withDep: 4149.51 },
  W1:  { noDep: 2394.55, withDep: 3151.31 },
  W2:  { noDep: 2860.70, withDep: 3643.75 },
  W3:  { noDep: 3221.08, withDep: 3960.78 },
  W4:  { noDep: 3832.45, withDep: 4323.11 },
  W5:  { noDep: 4315.51, withDep: 4715.58 },
  O1:  { noDep: 2273.82, withDep: 3085.23 },
  O2:  { noDep: 2700.31, withDep: 3451.28 },
  O3:  { noDep: 3404.11, withDep: 4041.88 },
  O4:  { noDep: 4247.61, withDep: 4885.43 },
  O5:  { noDep: 4583.51, withDep: 5542.06 },
  O6:  { noDep: 4758.96, withDep: 5749.63 },
  O7:  { noDep: 5187.33, withDep: 6385.58 },
  O8:  { noDep: 5187.33, withDep: 6385.58 },
  O9:  { noDep: 5187.33, withDep: 6385.58 },
  O10: { noDep: 5187.33, withDep: 6385.58 },
};

const MALT_RATE = 0.205; // CY2026, $/mile per vehicle (PDTATAC MAP-CAP 73-25(I), effective 1 Jan 2026)

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

// ── PCS Tips (lesser-known entitlements/practices, not the obvious stuff) ────
type Tab = 'calculator' | 'tips';
const TABS: { id: Tab; label: string }[] = [
  { id: 'calculator', label: 'CALCULATOR' },
  { id: 'tips', label: 'TIPS' },
];

interface PcsTip { icon: string; title: string; body: string; }

const PCS_TIPS: PcsTip[] = [
  {
    icon: '✈️',
    title: 'Book your own flight — and pocket what you save',
    body: "If driving isn't mandatory, you don't have to fly on a government-booked ticket. You can buy your own commercial ticket and get reimbursed for what you actually paid, up to the government's contracted \"city-pair\" fare for that route. Check the city-pair rate with your transportation office (or the DTMO city-pair search) before booking — if your ticket comes in under that ceiling, you're reimbursed in full and never have to justify skipping the official booking.",
  },
  {
    icon: '💵',
    title: 'DLA is flat and receipt-free — spend less, keep the rest',
    body: "Dislocation Allowance is paid at a fixed amount for your grade and dependency status to help offset move-in costs. It's not tied to what you actually spend and no receipts are required — if your real move-in costs come in under the DLA amount, nothing is clawed back.",
  },
  {
    icon: '🚚',
    title: 'A PPM (DITY) move can pay you more than it costs you',
    body: "A Personally Procured Move pays based on the government's estimated cost to move your household goods weight — not your actual receipts. Move efficiently (right-sized truck, help from friends, pack light) and the gap between that payment and your real costs is money in your pocket.",
  },
  {
    icon: '🍽️',
    title: "TLE/TLA's meal money is a flat rate, not a reimbursement",
    body: "Lodging during Temporary Lodging Expense/Allowance is reimbursed against actual receipts up to a cap — but the Meals & Incidentals (M&IE) portion is paid as a flat daily rate regardless of what you actually spend on food. Cook cheap during TLE/TLA and the difference is yours.",
  },
  {
    icon: '⚖️',
    title: 'Get your own weight tickets — don’t just trust the movers',
    body: "Every pay grade and dependency status has a published household goods weight allowance, and going even slightly over means YOU pay the excess-cost overage, not the government. Insist on an empty-truck and full-truck weight ticket for a PPM instead of relying on the mover's estimate.",
  },
  {
    icon: '📚',
    title: 'Uniforms, tools, and reference materials have their own weight limit',
    body: "Professional Books, Papers & Equipment (PBP&E) — uniforms, technical manuals, tools of your trade — ships on a separate weight allowance that doesn't count against your regular household goods limit. Ask your move counselor to inventory these separately so they don't eat into your HHG weight.",
  },
  {
    icon: '🔀',
    title: "You don't have to choose all-or-nothing on your move",
    body: 'A Partial PPM lets you ship the bulk of your household goods with the government-contracted mover while personally moving the rest — and you still get PPM incentive pay on whatever portion you move yourself.',
  },
  {
    icon: '🏠',
    title: 'TLE covers both ends of the move, not just after you arrive',
    body: "Temporary Lodging Expense applies at your losing station (packing out, final out-processing) as well as your gaining station (house-hunting on arrival) — most people only think to use it after arrival and leave departure-side days on the table. This calculator's TLE/TLA section already splits departure and gaining days for exactly this reason.",
  },
  {
    icon: '💳',
    title: 'Ask finance for an advance before you move, not after',
    body: "Most members wait to file a travel voucher after they arrive and end up floating move costs on a credit card. You can request an advance on your travel pay and DLA at your losing installation's finance office before you go.",
  },
  {
    icon: '🧾',
    title: "Keep every receipt — even the ones that feel too small to matter",
    body: 'Parking, tolls, pet lodging, storage unit fees — travel voucher processors can delay or reject a claim over missing documentation for expenses you assumed were too minor to need a receipt.',
  },
];

function Stepper({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <ThemedText style={styles.stepperLabel}>{label}</ThemedText>
      <View style={styles.stepperCtrl}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.stepBtn}>
          <ThemedText style={styles.stepBtnTxt}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepVal}>{value}</ThemedText>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.stepBtn}>
          <ThemedText style={styles.stepBtnTxt}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export default function PCSCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  const { payGrade: profileGrade, hasSpouse: profileHasSpouse, mhaZip: profileZip, hydrated } = useUserStore();

  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  const [grade, setGrade] = useState<PayGrade>(profileGrade ?? 'E5');
  const [withDep, setWithDep] = useState(profileGrade ? profileHasSpouse : true);
  const [profileApplied, setProfileApplied] = useState(false);

  useEffect(() => {
    if (hydrated && !profileApplied) {
      if (profileGrade) setGrade(profileGrade);
      setWithDep(profileGrade ? profileHasSpouse : true);
      const profileStation = getInstallationByZip(profileZip);
      if (profileStation) setCurrentStation(profileStation);
      setProfileApplied(true);
    }
  }, [hydrated]);

  const [currentStation, setCurrentStation] = useState<Installation | null>(null);
  const [gainingStation, setGainingStation] = useState<Installation | null>(null);

  // PCS details
  const [isDriving,       setIsDriving]        = useState(true);
  const [milesInput,      setMilesInput]      = useState('');
  const [vehicles,        setVehicles]         = useState<1 | 2>(1);
  const [tleDepartDays,   setTleDepartDays]    = useState(5);
  const [tleGainDays,     setTleGainDays]      = useState(5);
  const [tleHasSpouse,    setTleHasSpouse]     = useState(withDep);
  const [tleChildAges,    setTleChildAges]     = useState<number[]>([]);

  // Keep the TLE family composer's spouse default in sync with the dependent toggle
  useEffect(() => { setTleHasSpouse(withDep); }, [withDep]);

  const result = calcPCS(currentStation, gainingStation, grade, withDep);
  const showComparison = currentStation != null && gainingStation != null;

  const currentOHA  = currentStation?.oconus  ? getOhaAreaForInstallation(currentStation.id)  : null;
  const gainingOHA  = gainingStation?.oconus  ? getOhaAreaForInstallation(gainingStation.id)  : null;
  const showOHA     = currentOHA != null || gainingOHA != null;

  const swapStations = () => {
    setCurrentStation(gainingStation);
    setGainingStation(currentStation);
  };

  // ── Entitlement calculations ─────────────────────────────────────────────────
  const dla = DLA[grade][withDep ? 'withDep' : 'noDep'];

  const miles = parseFloat(milesInput) || 0;
  const malt = isDriving ? miles * MALT_RATE * vehicles : 0;

  // TLE/TLA — same engine as the dedicated TLE/TLA calculator (tleCalc.ts):
  // lodging and M&IE are each calculated separately at the family percentage,
  // then combined — for CONUS (TLE) that combined total is capped at $290/day
  // per JTR par. 050601 (PDTATAC MAP 66-24(R), effective 01 OCT 2025 for
  // FY2026); OCONUS (TLA) has no flat-dollar cap. Same 21-day CONUS pool /
  // 60-day OCONUS allowance. Each leg uses TLE rules if that station is
  // CONUS, TLA rules if it's OCONUS.
  const currentPD = currentStation ? getStationPerDiem(currentStation) : null;
  const gainingPD = gainingStation ? getStationPerDiem(gainingStation) : null;

  const bothConus = !!currentStation && !!gainingStation && !currentPD?.oconus && !gainingPD?.oconus;
  const departMaxDays = currentPD?.oconus ? TLA_MAX_DAYS : TLE_MAX_DAYS;
  const gainMaxDays   = gainingPD?.oconus ? TLA_MAX_DAYS : TLE_MAX_DAYS;

  // Both legs draw from the SAME 21-day TLE pool when both stations are CONUS
  // (calcTLE only caps each call at its own mode's max — it has no visibility
  // into the other leg — so the shared-pool constraint must be enforced here).
  const effectiveDepartDays = Math.min(tleDepartDays, departMaxDays);
  const effectiveGainDays = bothConus
    ? Math.min(tleGainDays, gainMaxDays, TLE_MAX_DAYS - effectiveDepartDays)
    : Math.min(tleGainDays, gainMaxDays);

  const tleDepart = currentPD
    ? calcTLE({
        mode: currentPD.oconus ? 'tla' : 'tle',
        lodging: currentPD.lodging,
        meals: currentPD.meals,
        hasSpouse: tleHasSpouse,
        childAges: tleChildAges,
        days: effectiveDepartDays,
      })
    : null;
  const tleGain = gainingPD
    ? calcTLE({
        mode: gainingPD.oconus ? 'tla' : 'tle',
        lodging: gainingPD.lodging,
        meals: gainingPD.meals,
        hasSpouse: tleHasSpouse,
        childAges: tleChildAges,
        days: effectiveGainDays,
      })
    : null;

  const tleDepartTotal = tleDepart?.totalEntitlement ?? 0;
  const tleGainTotal   = tleGain?.totalEntitlement ?? 0;
  const tleTotal = tleDepartTotal + tleGainTotal;

  const totalOneTime = dla + malt + tleTotal;
  const monthlyChange = result.monthlyDiff ?? 0;

  const showEntitlements = miles > 0 || tleDepartDays > 0 || tleGainDays > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          <ThemedText style={styles.title}>PCS Calculator</ThemedText>
        </View>
      </View>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setActiveTab(t.id)} style={styles.tabItem}>
            <ThemedText style={[styles.tabLabel, { color: tc.textMuted }, activeTab === t.id && styles.tabLabelActive]}>
              {t.label}
            </ThemedText>
            {activeTab === t.id && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      {/* ══ TIPS TAB ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tips' && (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
          showsVerticalScrollIndicator={false}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.tipsIntro}>
            Lesser-known PCS moves that can put real money back in your pocket — none of this replaces
            your installation PCS counselor, but each of these is worth asking about by name.
          </ThemedText>
          {PCS_TIPS.map((tip, i) => (
            <ThemedView key={tip.title} type="backgroundElement" style={styles.tipCard}>
              <View style={styles.tipHeaderRow}>
                <ThemedText style={styles.tipIcon}>{tip.icon}</ThemedText>
                <View style={{ flex: 1 }}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.tipNumber}>TIP {i + 1}</ThemedText>
                  <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                </View>
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.tipBody}>{tip.body}</ThemedText>
            </ThemedView>
          ))}
          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            General information only, not official guidance — entitlements, weight allowances, and advance-pay
            policy can vary by service branch and situation. Always confirm specifics with your installation
            finance office or PCS/transportation counselor before relying on any of these.
          </ThemedText>
        </ScrollView>
      )}

      {/* ══ CALCULATOR TAB ═════════════════════════════════════════════════════ */}
      {activeTab === 'calculator' && (
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
            {profileGrade && (
              <View style={styles.profileBadgeRow}>
                <ThemedText style={styles.profileBadgeText}>✓ Auto-filled from your profile</ThemedText>
              </View>
            )}
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

          <StationPicker label="Current Station" selected={currentStation} onSelect={setCurrentStation} />

          <Pressable
            onPress={swapStations}
            style={({ pressed }) => [styles.swapBtn, pressed && styles.pressed]}>
            <ThemedText style={styles.swapIcon}>⇅</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Swap</ThemedText>
          </Pressable>

          <StationPicker label="Gaining Station" selected={gainingStation} onSelect={setGainingStation} />
        </View>

        {/* PCS DETAILS */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            PCS DETAILS
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            {/* Driving? */}
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Driving Your Vehicle to the New Station?
              </ThemedText>
              <View style={styles.depToggle}>
                {[true, false].map((val) => (
                  <Pressable
                    key={String(val)}
                    onPress={() => setIsDriving(val)}
                    style={[styles.depBtn, isDriving === val && styles.depBtnActive]}>
                    <ThemedText style={[styles.depBtnText, isDriving === val && styles.depBtnTextActive]}>
                      {val ? 'Yes' : 'No'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {!isDriving && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  MALT (mileage reimbursement) doesn't apply if you're not driving — e.g. flying, shipping a POV, or already there.
                </ThemedText>
              )}
            </View>

            {isDriving && (
              <>
                <View style={styles.divider} />

                {/* Mileage */}
                <View style={styles.cardPadded}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                    Distance Between Stations (miles)
                  </ThemedText>
                  <View style={styles.milesRow}>
                    <TextInput
                      style={[styles.milesInput, { color: tc.textPrimary, borderColor: tc.borderColor }]}
                      value={milesInput}
                      onChangeText={(t) => setMilesInput(t.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      placeholder="e.g. 1500"
                      placeholderTextColor={tc.textMuted}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <ThemedText type="small" themeColor="textSecondary">miles</ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                    MALT rate: ${MALT_RATE.toFixed(2)}/mile × vehicles
                  </ThemedText>
                </View>

                <View style={styles.divider} />

                {/* Vehicles */}
                <View style={styles.cardPadded}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                    Authorized Vehicles (POV)
                  </ThemedText>
                  <View style={styles.depToggle}>
                    {([1, 2] as const).map((v) => (
                      <Pressable
                        key={v}
                        onPress={() => setVehicles(v)}
                        style={[styles.depBtn, vehicles === v && styles.depBtnActive]}>
                        <ThemedText style={[styles.depBtnText, vehicles === v && styles.depBtnTextActive]}>
                          {v} Vehicle{v > 1 ? 's' : ''}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            <View style={styles.divider} />

            {/* TLE/TLA days */}
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                {bothConus
                  ? `TLE Days (${TLE_MAX_DAYS}-day pool, split between stations)`
                  : 'TLE/TLA Days (per leg)'}
              </ThemedText>
              <Stepper
                label={`Departure ${currentPD?.oconus ? 'TLA' : 'TLE'} days`}
                value={tleDepartDays}
                min={0}
                max={bothConus ? Math.min(departMaxDays, TLE_MAX_DAYS - tleGainDays) : departMaxDays}
                onChange={setTleDepartDays}
              />
              <Stepper
                label={`Gaining ${gainingPD?.oconus ? 'TLA' : 'TLE'} days`}
                value={tleGainDays}
                min={0}
                max={bothConus ? Math.min(gainMaxDays, TLE_MAX_DAYS - tleDepartDays) : gainMaxDays}
                onChange={setTleGainDays}
              />
              {!bothConus && (currentPD?.oconus || gainingPD?.oconus) && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  An OCONUS leg uses TLA rules (up to {TLA_MAX_DAYS} days, no daily cap) instead of
                  the {TLE_MAX_DAYS}-day CONUS TLE pool. If you're departing CONUS for an OCONUS
                  station, your CONUS-side TLE is typically capped at 7 days — verify with finance.
                </ThemedText>
              )}
            </View>

            <View style={styles.divider} />

            {/* Family composition for TLE/TLA */}
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
                Family (for TLE/TLA rate — {familyLabel(tleHasSpouse, tleChildAges)})
              </ThemedText>
              <FamilyComposer
                hasSpouse={tleHasSpouse}
                childAges={tleChildAges}
                onSpouseChange={setTleHasSpouse}
                onChildAgesChange={setTleChildAges}
              />
            </View>
          </ThemedView>
        </View>

        {/* BAH COMPARISON */}
        {showComparison && (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              BAH COMPARISON
            </ThemedText>
            <ComparisonTable result={result} current={currentStation!} gaining={gainingStation!} />
          </View>
        )}

        {/* OHA RATES — shown when either station is OCONUS */}
        {showOHA && (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              OHA RATES
            </ThemedText>
            {currentOHA && currentStation && (
              <OHACard
                installation={currentStation}
                area={currentOHA}
                grade={grade}
                withDep={withDep}
              />
            )}
            {gainingOHA && gainingStation && (
              <OHACard
                installation={gainingStation}
                area={gainingOHA}
                grade={grade}
                withDep={withDep}
              />
            )}
          </View>
        )}

        {/* PCS ENTITLEMENTS */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            PCS ENTITLEMENTS
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            {/* DLA */}
            <View style={styles.cardPadded}>
              <View style={styles.entitlementRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.entitlementLabel}>DLA (Dislocation Allowance)</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    One-time payment for moving household expenses
                  </ThemedText>
                </View>
                <ThemedText style={[styles.entitlementAmt, { color: Brand.accent }]}>{fmt(dla)}</ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* MALT */}
            <View style={styles.cardPadded}>
              <View style={styles.entitlementRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.entitlementLabel}>
                    MALT{isDriving ? ` (${miles.toLocaleString()} mi × ${vehicles} POV)` : ''}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {isDriving
                      ? `$${MALT_RATE.toFixed(2)}/mile mileage reimbursement${miles === 0 ? ' — enter distance above' : ''}`
                      : 'Not applicable — not driving'}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.entitlementAmt, { color: isDriving && miles > 0 ? Brand.tactical : tc.textMuted }]}>
                  {isDriving && miles > 0 ? fmt(malt) : '—'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.divider} />

            {/* TLE/TLA Departure */}
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={[styles.fieldLabel, { marginBottom: Spacing.one }]}>
                {currentPD?.oconus ? 'TLA' : 'TLE'} — DEPARTURE ({tleDepart?.days ?? 0} DAYS)
              </ThemedText>
              {effectiveDepartDays > 0 && tleDepart ? (
                <>
                  <View style={styles.tleDetailRow}>
                    <ThemedText style={[styles.tleDetailLabel, { color: tc.textSecondary }]}>
                      Lodging: {(tleDepart.familyPct * 100).toFixed(0)}% × ${currentPD?.lodging}/night
                    </ThemedText>
                    <ThemedText style={[styles.tleDetailAmt, { color: tc.textPrimary }]}>{fmt(tleDepart.lodgingPaid)}/day</ThemedText>
                  </View>
                  <View style={styles.tleDetailRow}>
                    <ThemedText style={[styles.tleDetailLabel, { color: tc.textSecondary }]}>
                      M&IE: {(tleDepart.familyPct * 100).toFixed(0)}% × ${currentPD?.meals}/day
                    </ThemedText>
                    <ThemedText style={[styles.tleDetailAmt, { color: tc.textPrimary }]}>{fmt(tleDepart.miePaid)}/day</ThemedText>
                  </View>
                  {tleDepart.capped && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                      Combined rate capped at ${TLE_DAILY_CAP}/day — lodging and M&IE shares above are scaled down proportionally.
                    </ThemedText>
                  )}
                  <View style={[styles.tleDetailRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.2)', marginTop: 4, paddingTop: 4 }]}>
                    <ThemedText style={[styles.tleDetailLabel, { fontWeight: '700', color: tc.textSecondary }]}>Total departure {currentPD?.oconus ? 'TLA' : 'TLE'}</ThemedText>
                    <ThemedText style={[styles.entitlementAmt, { color: Brand.primary }]}>{fmt(tleDepartTotal)}</ThemedText>
                  </View>
                  {bothConus && tleDepartDays > effectiveDepartDays && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                      Capped to {effectiveDepartDays} days — your {tleGainDays}-day gaining request uses
                      the rest of the shared {TLE_MAX_DAYS}-day TLE pool.
                    </ThemedText>
                  )}
                  {currentPD && !currentPD.matched && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                      No locality rate found for this installation — showing a placeholder rate.
                      Use the TLE/TLA calculator to look up an accurate locality rate.
                    </ThemedText>
                  )}
                </>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">0 days selected</ThemedText>
              )}
            </View>

            <View style={styles.divider} />

            {/* TLE/TLA Gaining */}
            <View style={styles.cardPadded}>
              <ThemedText type="small" themeColor="textSecondary" style={[styles.fieldLabel, { marginBottom: Spacing.one }]}>
                {gainingPD?.oconus ? 'TLA' : 'TLE'} — GAINING ({tleGain?.days ?? 0} DAYS)
              </ThemedText>
              {effectiveGainDays > 0 && tleGain ? (
                <>
                  <View style={styles.tleDetailRow}>
                    <ThemedText style={[styles.tleDetailLabel, { color: tc.textSecondary }]}>
                      Lodging: {(tleGain.familyPct * 100).toFixed(0)}% × ${gainingPD?.lodging}/night
                    </ThemedText>
                    <ThemedText style={[styles.tleDetailAmt, { color: tc.textPrimary }]}>{fmt(tleGain.lodgingPaid)}/day</ThemedText>
                  </View>
                  <View style={styles.tleDetailRow}>
                    <ThemedText style={[styles.tleDetailLabel, { color: tc.textSecondary }]}>
                      M&IE: {(tleGain.familyPct * 100).toFixed(0)}% × ${gainingPD?.meals}/day
                    </ThemedText>
                    <ThemedText style={[styles.tleDetailAmt, { color: tc.textPrimary }]}>{fmt(tleGain.miePaid)}/day</ThemedText>
                  </View>
                  {tleGain.capped && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                      Combined rate capped at ${TLE_DAILY_CAP}/day — lodging and M&IE shares above are scaled down proportionally.
                    </ThemedText>
                  )}
                  <View style={[styles.tleDetailRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.2)', marginTop: 4, paddingTop: 4 }]}>
                    <ThemedText style={[styles.tleDetailLabel, { fontWeight: '700', color: tc.textSecondary }]}>Total gaining {gainingPD?.oconus ? 'TLA' : 'TLE'}</ThemedText>
                    <ThemedText style={[styles.entitlementAmt, { color: Brand.primary }]}>{fmt(tleGainTotal)}</ThemedText>
                  </View>
                  {bothConus && tleGainDays > effectiveGainDays && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                      Capped to {effectiveGainDays} days — the shared {TLE_MAX_DAYS}-day TLE pool is
                      used up by your departure days.
                    </ThemedText>
                  )}
                  {gainingPD && !gainingPD.matched && (
                    <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                      No locality rate found for this installation — showing a placeholder rate.
                      Use the TLE/TLA calculator to look up an accurate locality rate.
                    </ThemedText>
                  )}
                </>
              ) : (
                <ThemedText type="small" themeColor="textSecondary">0 days selected</ThemedText>
              )}
            </View>
          </ThemedView>
        </View>

        {/* TOTAL PCS PACKAGE */}
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            TOTAL PCS PACKAGE
          </ThemedText>

          <ThemedView type="backgroundElement" style={[styles.card, { borderLeftWidth: 3, borderLeftColor: Brand.accent }]}>
            <View style={styles.cardPadded}>
              <View style={styles.packageRow}>
                <ThemedText style={[styles.packageLabel, { color: tc.textSecondary }]}>DLA (one-time)</ThemedText>
                <ThemedText style={[styles.packageAmt, { color: tc.textPrimary }]}>{fmt(dla)}</ThemedText>
              </View>
              <View style={styles.packageRow}>
                <ThemedText style={[styles.packageLabel, { color: tc.textSecondary }]}>
                  MALT{!isDriving ? ' (not driving)' : ''}
                </ThemedText>
                <ThemedText style={[styles.packageAmt, { color: isDriving && miles > 0 ? tc.textPrimary : tc.textMuted }]}>
                  {isDriving && miles > 0 ? fmt(malt) : '—'}
                </ThemedText>
              </View>
              <View style={styles.packageRow}>
                <ThemedText style={[styles.packageLabel, { color: tc.textSecondary }]}>TLE Total ({tleDepartDays + tleGainDays} days)</ThemedText>
                <ThemedText style={[styles.packageAmt, { color: tc.textPrimary }]}>{fmt(tleTotal)}</ThemedText>
              </View>

              <View style={[styles.divider, { marginVertical: Spacing.two }]} />

              <View style={styles.packageRow}>
                <ThemedText style={[styles.packageLabel, { fontSize: 15, fontWeight: '700', color: tc.textSecondary }]}>
                  TOTAL ONE-TIME ENTITLEMENTS
                </ThemedText>
                <ThemedText style={[styles.packageAmt, { color: Brand.accent, fontSize: 22, fontFamily: Fonts.data }]}>
                  {fmt(totalOneTime)}
                </ThemedText>
              </View>

              {result.monthlyDiff != null && (
                <>
                  <View style={[styles.divider, { marginVertical: Spacing.two }]} />
                  <View style={styles.packageRow}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.packageLabel, { color: tc.textSecondary }]}>Monthly BAH Change</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">Ongoing after PCS</ThemedText>
                    </View>
                    <ThemedText style={[styles.packageAmt, {
                      color: monthlyChange >= 0 ? Brand.success : Brand.danger,
                      fontSize: 20, fontFamily: Fonts.data,
                    }]}>
                      {monthlyChange >= 0 ? '+' : ''}{fmt(monthlyChange)}/mo
                    </ThemedText>
                  </View>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                    Annual BAH impact: {monthlyChange >= 0 ? '+' : ''}{fmt(monthlyChange * 12)}/yr
                  </ThemedText>
                </>
              )}
            </View>
          </ThemedView>
        </View>

        {/* Empty state */}
        {!showComparison && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText style={styles.emptyIcon}>🚚</ThemedText>
            <ThemedText style={styles.emptyTitle}>Select both stations</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyBody}>
              Choose your current and gaining duty stations to see your BAH change. DLA and MALT calculate from grade + distance entered above.
            </ThemedText>
          </ThemedView>
        )}

        {/* Disclaimer */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          BAH rates: {BAH_DATA_YEAR}. OHA rates: Q2 2026 (approx.). DLA: FY2026 (JTR). MALT: ${MALT_RATE.toFixed(2)}/mile FY2026. TLE/TLA uses the same JTR family-percentage table as the dedicated TLE/TLA calculator: lodging and M&IE are each calculated separately, then combined — for TLE (CONUS) that combined total is capped at ${TLE_DAILY_CAP}/day per JTR par. 050601 (PDTATAC MAP 66-24(R), effective 01 OCT 2025 for FY2026); TLA (OCONUS) has no flat-dollar cap. OHA and unmatched OCONUS TLA rates are approximate — verify current rates at DTMO before signing a lease. Verify all entitlements with your installation finance office.
        </ThemedText>
      </ScrollView>
      )}
    </ThemedView>
    </KeyboardAvoidingView>
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

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, position: 'relative' },
  tabLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6 },
  tabLabelActive: { color: Brand.accent },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: 8, right: 8,
    height: 2, borderRadius: 1, backgroundColor: Brand.accent,
  },

  tipsIntro: { lineHeight: 18, paddingHorizontal: Spacing.one, paddingTop: Spacing.one },
  tipCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  tipHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  tipIcon: { fontSize: 24, lineHeight: 28 },
  tipNumber: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  tipTitle: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  tipBody: { lineHeight: 19 },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  section: { gap: Spacing.two },
  sectionLabel: { letterSpacing: 0.8, paddingHorizontal: Spacing.one },

  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardPadded: { padding: Spacing.three, gap: Spacing.two },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  hint: { fontSize: 10, lineHeight: 14, marginTop: 2 },

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

  milesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  milesInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: Fonts.data,
  },

  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperLabel: { fontSize: 13, flex: 1 },
  stepperCtrl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnTxt: { color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 22, marginTop: -1 },
  stepVal: { fontSize: 15, fontWeight: '700', minWidth: 32, textAlign: 'center', fontFamily: Fonts.data },

  entitlementRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  entitlementLabel: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  entitlementAmt: { fontSize: 16, fontWeight: '800', fontFamily: Fonts.data },

  tleDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  tleDetailLabel: { fontSize: 12 },
  tleDetailAmt: { fontSize: 13, fontWeight: '600', fontFamily: Fonts.data },

  packageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 3 },
  packageLabel: { fontSize: 13, flex: 1 },
  packageAmt: { fontSize: 16, fontWeight: '800', fontFamily: Fonts.data },

  emptyState: {
    borderRadius: Spacing.three,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
  emptyIcon: { fontSize: 40, lineHeight: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { textAlign: 'center', lineHeight: 20 },

  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: 0,
  },
  profileBadgeText: {
    fontSize: 11,
    color: Brand.tactical,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  disclaimer: {
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 12,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
  },
});
