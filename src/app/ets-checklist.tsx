import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

const STORAGE_KEY = 'mbb_ets_checklist';

interface CheckItem {
  id: string;
  label: string;
  detail: string;
  timeframe: string;
}

interface CheckSection {
  id: string;
  title: string;
  color: string;
  items: CheckItem[];
}

const SECTIONS: CheckSection[] = [
  {
    id: '12mo',
    title: '12 MONTHS OUT',
    color: '#1565C0',
    items: [
      {
        id: 'tap_enroll',
        label: 'Enroll in TAP (Transition Assistance Program)',
        detail: 'Mandatory 5-day program. Check with your installation\'s Transition Center. Register early — slots fill up. DoD Transition GPS online modules can be completed beforehand.',
        timeframe: '12 months',
      },
      {
        id: 'va_claim_intent',
        label: 'File Intent to File with the VA',
        detail: 'Filing Intent to File locks in an effective date up to 1 year before your formal claim. Go to va.gov or call 800-827-1000. This protects your back-pay date.',
        timeframe: '12 months',
      },
      {
        id: 'bdd',
        label: 'Submit Benefits Delivery at Discharge (BDD) claim',
        detail: 'If separating in 90–180 days, file a BDD claim with the VA so your rating can be processed before ETS. Requires a C&P exam while still on active duty. va.gov/disability.',
        timeframe: '90–180 days',
      },
      {
        id: 'medical_records',
        label: 'Request all medical records',
        detail: 'Request complete military medical records from the MTF and dental records from the dental clinic. Also request a copy of your service treatment records (STR). Keep originals — do not give them away.',
        timeframe: '12 months',
      },
    ],
  },
  {
    id: '6mo',
    title: '6 MONTHS OUT',
    color: '#6A1B9A',
    items: [
      {
        id: 'resume',
        label: 'Build your civilian résumé',
        detail: 'Translate military experience to civilian language. Use O*NET (onetonline.org) and your TAP counselor. LinkedIn profile should go live at least 6 months before ETS.',
        timeframe: '6 months',
      },
      {
        id: 'gi_bill',
        label: 'Apply for GI Bill / education benefits',
        detail: 'Apply for Post-9/11 GI Bill (Chapter 33) or other VA education benefit at va.gov/education. Processing can take weeks — apply early. Confirm school eligibility before committing.',
        timeframe: '6 months',
      },
      {
        id: 'job_search',
        label: 'Start job search / reach out to employers',
        detail: 'Use USAJobs.gov (federal preference), Hire Heroes USA, Indeed, and LinkedIn. Military-friendly employers: USAA, Amazon, Booz Allen, Leidos, Home Depot, and others. Government jobs require resumes, not just applications.',
        timeframe: '6 months',
      },
      {
        id: 'tricare_plan',
        label: 'Plan TRICARE transition',
        detail: 'Active duty TRICARE Prime ends on ETS date. Options: the Transitional Assistance Management Program (TAMP) for up to 180 days (no premium), the Continued Health Care Benefit Program (CHCBP, premium-based, 18-36 months) after that, VA healthcare enrollment, employer insurance, or a marketplace plan. Enroll before coverage lapses.',
        timeframe: '90 days',
      },
      {
        id: 'clearance',
        label: 'Understand your security clearance status',
        detail: 'Clearances can be a valuable hiring asset. Ask your security manager about the status and how long it remains valid after separation (typically 2 years inactive). Do not let it lapse if you plan federal/contractor work.',
        timeframe: '6 months',
      },
    ],
  },
  {
    id: '90days',
    title: '90 DAYS OUT',
    color: '#00695C',
    items: [
      {
        id: 'out_processing',
        label: 'Begin out-processing checklist',
        detail: 'Pick up your installation\'s physical out-processing checklist. Typically includes: finance, legal, dental, medical, S-6/IT accounts, housing, and unit clearance. Do NOT leave items unchecked — your final pay can be held.',
        timeframe: '90 days',
      },
      {
        id: 'tsp_decision',
        label: 'Decide TSP: leave, rollover, or cash out',
        detail: 'You can leave your TSP account as-is, roll it into an IRA or employer 401(k), or cash it out (taxable + 10% early withdrawal penalty if under 59½). Log in at tsp.gov to review and set beneficiaries.',
        timeframe: '90 days',
      },
      {
        id: 'sgli_conversion',
        label: 'Convert SGLI to VGLI — apply within 240 days to skip health questions',
        detail: 'You have up to 1 year and 120 days from ETS to convert SGLI to Veterans\' Group Life Insurance (VGLI). Apply within the first 240 days and no health questions are asked; apply after 240 days and you\'ll need to prove good health. Apply at benefits.va.gov/insurance.',
        timeframe: '240 days post-ETS (no health questions) / 1 yr 120 days (final deadline)',
      },
      {
        id: 'final_pay',
        label: 'Confirm final pay and leave payout',
        detail: 'Verify accrued leave balance with S-1 and confirm the leave payout will be included in final pay. Max payout is 60 days. Ensure your BAH and BAS stop date is correct — overpayment = debt to the government.',
        timeframe: '60 days',
      },
      {
        id: 'housing',
        label: 'Make housing arrangements',
        detail: 'If in government quarters, submit move-out date. Coordinate transportation for HHG shipment or PPM/DITY move. If renting, use SCRA lease termination rights with PCS orders. If buying, look into VA loan.',
        timeframe: '90 days',
      },
    ],
  },
  {
    id: 'ets_day',
    title: 'ETS DAY',
    color: '#C8A800',
    items: [
      {
        id: 'dd214',
        label: 'Receive and verify your DD-214',
        detail: 'The DD-214 is the most important document you will ever get from the military. Verify: character of discharge, dates of service, awards, MOS/AFSC/rating, and reenlistment eligibility code. Request at least 5 certified copies. Store originals in a fireproof safe.',
        timeframe: 'ETS day',
      },
      {
        id: 'id_card',
        label: 'Surrender military ID / get veteran ID',
        detail: 'Your CAC expires on ETS date. Apply for a Veteran ID Card (VIC) at va.gov/records/get-veteran-id-cards/vic. A VIC can be used for military discounts. Keep proof of honorable discharge (DD-214) for veteran preference.',
        timeframe: 'ETS day',
      },
      {
        id: 'va_enrollment',
        label: 'Enroll in VA healthcare',
        detail: 'Enrollment is separate from filing a disability claim. Go to va.gov/health-care/apply or visit the nearest VA medical center. Combat veterans get free enhanced VA healthcare eligibility for 10 years post-discharge (extended from 5 years by the PACT Act). Priority groups affect copays.',
        timeframe: 'ETS day',
      },
    ],
  },
  {
    id: 'post_ets',
    title: 'AFTER ETS',
    color: Brand.danger,
    items: [
      {
        id: 'update_address',
        label: 'Update mailing address everywhere',
        detail: 'DFAS (dfas.mil), VA, TSP (tsp.gov), Social Security Administration, IRS, voter registration, driver\'s license, and all financial institutions. An incorrect address delays W-2s, VA rating letters, and benefit payments.',
        timeframe: 'First week',
      },
      {
        id: 'dfas_w2',
        label: 'Watch for W-2 from DFAS',
        detail: 'DFAS issues W-2s by January 31 for the prior year. Access them at myPay (mypay.dfas.mil). If separated mid-year, you will get both a military W-2 and any civilian employer W-2. Keep for taxes.',
        timeframe: 'January',
      },
      {
        id: 'va_rating_followup',
        label: 'Follow up on VA disability rating',
        detail: 'Processing times vary. Check status at va.gov or call 800-827-1000. If 90+ days with no decision, contact your VSO (DAV, VFW, American Legion). Rating letters arrive by mail — update your address.',
        timeframe: 'Ongoing',
      },
      {
        id: 'state_benefits',
        label: 'Research state veteran benefits',
        detail: 'Every state has different benefits: property tax exemptions, education tuition waivers, vehicle registration discounts, hunting/fishing licenses, and more. Search your state\'s Department of Veterans Affairs website.',
        timeframe: 'First month',
      },
      {
        id: 'vso',
        label: 'Connect with a VSO (Veteran Service Organization)',
        detail: 'VSOs like DAV, VFW, American Legion, and Disabled American Veterans provide FREE claims assistance, appeals help, and community support. Find one at va.gov/vso or benefits.va.gov/vso.',
        timeframe: 'First month',
      },
    ],
  },
];

export default function EtsChecklistScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setChecked(JSON.parse(raw));
    });
  }, []);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = SECTIONS.reduce((s, sec) => s + sec.items.length, 0);
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const pct = totalItems > 0 ? checkedCount / totalItems : 0;

  const handleReset = () => {
    Alert.alert('Reset Checklist', 'Clear all checkmarks?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setChecked({});
          AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>EAS/ETS/Separation Checklist</ThemedText>
        <Pressable onPress={handleReset} style={styles.resetBtn}>
          <ThemedText style={[styles.resetText, { color: tc.textSecondary }]}>Reset</ThemedText>
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
        </View>
        <ThemedText style={styles.progressLabel}>{checkedCount}/{totalItems} COMPLETED</ThemedText>
      </View>

      <Pressable onPress={() => router.push('/life-events' as any)} style={styles.relatedToolRow}>
        <ThemedText style={[styles.relatedToolText, { color: tc.textSecondary }]}>
          Want a shorter financial/admin task list instead? See Life Event Checklists
        </ThemedText>
        <ThemedText style={[styles.relatedToolChevron, { color: Brand.accent }]}>›</ThemedText>
      </Pressable>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        {pct >= 1 && (
          <ThemedView type="backgroundElement" style={styles.completeBanner}>
            <ThemedText style={styles.completeText}>🎖 Checklist complete — you're ready to transition!</ThemedText>
          </ThemedView>
        )}

        {SECTIONS.map((section) => {
          const sectionDone = section.items.filter((i) => checked[i.id]).length;
          return (
            <View key={section.id}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionAccent, { backgroundColor: section.color }]} />
                <ThemedText style={[styles.sectionTitle, { color: section.color }]}>
                  {section.title}
                </ThemedText>
                <ThemedText style={[styles.sectionCount, { color: tc.textSecondary }]}>
                  {sectionDone}/{section.items.length}
                </ThemedText>
              </View>
              {section.items.map((item) => {
                const done = !!checked[item.id];
                const open = !!expanded[item.id];
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleExpand(item.id)}
                    style={[
                      styles.itemCard,
                      { backgroundColor: tc.surface, borderColor: tc.borderColor },
                      done && styles.itemCardDone,
                    ]}>
                    <Pressable
                      onPress={() => toggle(item.id)}
                      style={[
                        styles.checkbox,
                        { borderColor: tc.textMuted },
                        done && { backgroundColor: section.color, borderColor: section.color },
                      ]}>
                      {done && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                    </Pressable>
                    <View style={styles.itemBody}>
                      <ThemedText
                        style={[
                          styles.itemLabel,
                          { color: tc.textPrimary },
                          done && [styles.itemLabelDone, { color: tc.textSecondary }],
                        ]}>
                        {item.label}
                      </ThemedText>
                      <ThemedText style={[styles.itemTimeframe, { color: tc.textMuted }]}>{item.timeframe}</ThemedText>
                      {open && (
                        <ThemedText style={[styles.itemDetail, { color: tc.textSecondary }]}>{item.detail}</ThemedText>
                      )}
                    </View>
                    <ThemedText style={[styles.expandChevron, { color: tc.textMuted }]}>{open ? '∧' : '∨'}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          );
        })}

        <ThemedView type="backgroundElement" style={styles.footer}>
          <ThemedText style={[styles.footerTitle, { color: tc.textPrimary }]}>Need help?</ThemedText>
          <ThemedText style={[styles.footerText, { color: tc.textSecondary }]}>
            Your installation Transition Center and JAG office provide free one-on-one guidance. DoD Transition GPS is available 24/7 at dodtap.mil.
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
  resetBtn: { width: 50, alignItems: 'flex-end' },
  resetText: { fontSize: 12, fontWeight: '600' },

  progressWrap: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
  },
  relatedToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  relatedToolText: { fontSize: 11, flex: 1, lineHeight: 15 },
  relatedToolChevron: { fontSize: 16, fontWeight: '700' },
  progressTrack: {
    height: 4,
    backgroundColor: Brand.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Brand.tactical,
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Brand.tactical,
    letterSpacing: 1,
    textAlign: 'right',
  },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two },

  completeBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.tactical,
  },
  completeText: { fontSize: 14, fontWeight: '700', color: Brand.tactical },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
    marginBottom: Spacing.one,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2 },
  sectionTitle: { flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionCount: { fontSize: 10, fontWeight: '700' },

  itemCard: {
    backgroundColor: '#080E1C',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.two + 4,
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  itemCardDone: { opacity: 0.65 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkmark: { fontSize: 13, color: '#FFFFFF', fontWeight: '800' },
  itemBody: { flex: 1, gap: 3 },
  itemLabel: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  itemLabelDone: { textDecorationLine: 'line-through' },
  itemTimeframe: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  itemDetail: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  expandChevron: { fontSize: 12, paddingTop: 2 },

  footer: {
    borderRadius: 4,
    padding: Spacing.three,
    gap: 4,
    marginTop: Spacing.two,
  },
  footerTitle: { fontSize: 13, fontWeight: '700' },
  footerText: { fontSize: 11, lineHeight: 17 },
});
