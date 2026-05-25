import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Fonts, Spacing } from '@/constants/theme';
import { PayGrade } from '@/data/bah-rates';
import { getBasicPay } from '@/data/basic-pay-rates';
import { useUserStore } from '@/store/user.store';

// ── Constants ─────────────────────────────────────────────────────────────────

const ENLISTED: PayGrade[] = ['E1','E2','E3','E4','E5','E6','E7','E8','E9'];
const WARRANT:  PayGrade[] = ['W1','W2','W3','W4','W5'];
const OFFICER:  PayGrade[] = ['O1','O2','O3','O4','O5','O6','O7','O8','O9','O10'];

// TRICARE Reserve Select FY2026 monthly premiums
const TRS_PREMIUMS = {
  member_only: 57.16,
  member_family: 231.52,
};

// FY2026 SELRES retirement multiplier: 2.5% per qualifying year at age 60
const RETIREMENT_MULTIPLIER = 0.025;
const RETIREMENT_AGE = 60;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

function fmtMoneyWhole(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.sectionSub}>{subtitle}</ThemedText>}
      </View>
    </View>
  );
}

function GradeChip({ grade, selected, onPress }: { grade: PayGrade; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.gradeChip, selected && styles.gradeChipActive]}>
      <ThemedText style={[styles.gradeChipText, selected && styles.gradeChipTextActive]}>{grade}</ThemedText>
    </Pressable>
  );
}

function GradeGroup({ label, grades, selected, onSelect }: {
  label: string;
  grades: PayGrade[];
  selected: PayGrade;
  onSelect: (g: PayGrade) => void;
}) {
  return (
    <View style={styles.gradeGroup}>
      <ThemedText style={styles.gradeGroupLabel}>{label}</ThemedText>
      <View style={styles.gradeRow}>
        {grades.map((g) => (
          <GradeChip key={g} grade={g} selected={selected === g} onPress={() => onSelect(g)} />
        ))}
      </View>
    </View>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'drill_pay' | 'retirement' | 'tricare' | 'mobilization';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'drill_pay',    label: 'DRILL PAY',    icon: '💰' },
  { id: 'retirement',   label: 'RETIREMENT',   icon: '🏁' },
  { id: 'tricare',      label: 'TRICARE',      icon: '🏥' },
  { id: 'mobilization', label: 'MOBILIZE',     icon: '🪖' },
];

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ReservesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const storeGrade = useUserStore((s) => s.payGrade);
  const storeYos   = useUserStore((s) => s.yos);

  const [activeTab, setActiveTab] = useState<Tab>('drill_pay');
  const [grade, setGrade] = useState<PayGrade>(storeGrade ?? 'E5');
  const [yos, setYos] = useState(storeYos ?? 6);

  // ── Drill Pay ─────────────────────────────────────────────────────────────

  const monthlyBasicPay = useMemo(() => getBasicPay(grade, yos), [grade, yos]);
  const idt = monthlyBasicPay / 30;               // one IDT / drill period
  const drillWeekend = idt * 4;                   // typical weekend = 4 IDTs (2 days × 2 periods/day)
  const annualDrillPay = idt * 48;                // 12 weekends × 4 IDTs
  const annualAdt = monthlyBasicPay * 15 / 30;    // 15 days typical ADT/AT (2 weeks)

  // ── Retirement Points ─────────────────────────────────────────────────────

  const [goodYears, setGoodYears] = useState(Math.min(storeYos ?? 6, 40));
  const [retirementPoints, setRetirementPoints] = useState(0);

  // Points needed for a "good year": 50 minimum
  // Creditable retirement pay = (points / 360) × 2.5% × highest 36-mo avg basic pay
  const pointsBasedCalc = useMemo(() => {
    const divisor = 360;
    const fraction = retirementPoints / divisor;
    const retirePay = fraction * RETIREMENT_MULTIPLIER * monthlyBasicPay;
    return retirePay;
  }, [retirementPoints, monthlyBasicPay]);

  // Year-based (simplified): 2.5% × good years × base pay / 12
  const yearBasedMonthly = useMemo(() => {
    return RETIREMENT_MULTIPLIER * goodYears * (monthlyBasicPay * 12) / 12;
  }, [goodYears, monthlyBasicPay]);

  // ── Mobilization ──────────────────────────────────────────────────────────

  const [deployMonths, setDeployMonths] = useState(6);
  const mobilizationPay = monthlyBasicPay * deployMonths;
  const taxSavedCombatZone = monthlyBasicPay * deployMonths * 0.22;

  // ── YOS stepper ──────────────────────────────────────────────────────────

  function YosStepper() {
    const yosBrackets = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    return (
      <View style={styles.yosRow}>
        {yosBrackets.map((y) => (
          <Pressable
            key={y}
            onPress={() => setYos(y)}
            style={[styles.yosChip, yos >= y && yos < y + 2 && styles.yosChipActive]}>
            <ThemedText style={[styles.yosChipText, yos >= y && yos < y + 2 && styles.yosChipTextActive]}>
              {y}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.push('/tools')} style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.eyebrow}>// RESERVE & GUARD</ThemedText>
          <ThemedText style={styles.title}>Reserve Hub</ThemedText>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabBar}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setActiveTab(t.id)}
            style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <ThemedText style={{ fontSize: 14, lineHeight: 18 }}>{t.icon}</ThemedText>
            <ThemedText style={[styles.tabLabel, activeTab === t.id && styles.tabLabelActive]}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* ── Grade + YOS picker (shared across tabs) ── */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={styles.cardLabel}>YOUR GRADE & YEARS OF SERVICE</ThemedText>
          <GradeGroup label="ENLISTED" grades={ENLISTED} selected={grade} onSelect={setGrade} />
          <GradeGroup label="WARRANT"  grades={WARRANT}  selected={grade} onSelect={setGrade} />
          <GradeGroup label="OFFICER"  grades={OFFICER}  selected={grade} onSelect={setGrade} />
          <ThemedText style={[styles.cardLabel, { marginTop: Spacing.two }]}>YEARS OF SERVICE</ThemedText>
          <YosStepper />
        </ThemedView>

        {/* ══ DRILL PAY TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'drill_pay' && (
          <>
            <SectionHeader title="Drill Pay Calculator" subtitle="FY2026 rates · Based on 1/30 of monthly basic pay per drill period" />

            {/* Hero result */}
            <ThemedView type="backgroundElement" style={[styles.card, styles.heroCard]}>
              <View style={styles.heroRow}>
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>PER DRILL PERIOD</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.accent }]}>{fmtMoney(idt)}</ThemedText>
                  <ThemedText style={styles.heroSub}>1 IDT / 4 hrs</ThemedText>
                </View>
                <View style={styles.heroDiv} />
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>DRILL WEEKEND</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.tactical }]}>{fmtMoney(drillWeekend)}</ThemedText>
                  <ThemedText style={styles.heroSub}>4 IDTs (Sat + Sun)</ThemedText>
                </View>
              </View>
            </ThemedView>

            {/* Annual breakdown */}
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>ANNUAL RESERVE PAY ESTIMATE</ThemedText>
              <View style={styles.rowItem}>
                <ThemedText style={styles.rowLabel}>Monthly Basic Pay (active rate)</ThemedText>
                <ThemedText style={[styles.rowValue, { color: '#C8D8E8' }]}>{fmtMoneyWhole(monthlyBasicPay)}/mo</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.rowLabel}>Drill Pay (12 weekends × 4 IDTs)</ThemedText>
                  <ThemedText style={styles.rowNote}>48 IDTs per year</ThemedText>
                </View>
                <ThemedText style={[styles.rowValue, { color: Brand.accent }]}>{fmtMoneyWhole(annualDrillPay)}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowItem}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.rowLabel}>Annual Training (AT) — 15 days</ThemedText>
                  <ThemedText style={styles.rowNote}>Typical 2-week active duty for training</ThemedText>
                </View>
                <ThemedText style={[styles.rowValue, { color: Brand.tactical }]}>{fmtMoneyWhole(annualAdt)}</ThemedText>
              </View>
              <View style={styles.divider} />
              <View style={[styles.rowItem, styles.totalRow]}>
                <ThemedText style={[styles.rowLabel, { color: '#C8D8E8', fontWeight: '800' }]}>ESTIMATED ANNUAL TOTAL</ThemedText>
                <ThemedText style={[styles.rowValue, { color: Brand.success }]}>{fmtMoneyWhole(annualDrillPay + annualAdt)}</ThemedText>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>HOW DRILL PAY WORKS</ThemedText>
              {[
                { q: 'What is an IDT?', a: 'Individual Duty Training — one 4-hour drill period. You get paid for 2 IDTs per day (1/15 of monthly basic pay per drill day).' },
                { q: 'What is a UTA?', a: 'Unit Training Assembly — one full drill period. A standard drill weekend has 4 UTAs (2 per day × 2 days).' },
                { q: 'Do I get BAH at drill?', a: 'No BAH for IDT/drill weekend. BAH only applies during active duty orders of 30+ days, or ADOS/AT orders depending on your status.' },
                { q: 'Do I get BAS at drill?', a: 'BAS is paid for any day of active duty. For short drill periods, it is typically not paid unless serving continuous active duty.' },
                { q: 'What about SGLI?', a: 'SELRES members get SGLI automatically at the same rates as active duty ($29/mo for $500K coverage).' },
              ].map((item, i) => (
                <View key={i} style={[styles.faqItem, i > 0 && styles.divider]}>
                  <ThemedText style={styles.faqQ}>{item.q}</ThemedText>
                  <ThemedText style={styles.faqA}>{item.a}</ThemedText>
                </View>
              ))}
            </ThemedView>
          </>
        )}

        {/* ══ RETIREMENT TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'retirement' && (
          <>
            <SectionHeader title="Reserve Retirement" subtitle="20 qualifying years required · Pay begins at age 60 (reduced for deployment)" />

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>RETIREMENT POINTS CALCULATOR</ThemedText>
              <ThemedText style={styles.cardHint}>
                Reserve retirement pay = (total points ÷ 360) × 2.5% × active-duty base pay. You need at least 20 "good years" (≥50 points/year).
              </ThemedText>

              <View style={styles.rowItem}>
                <ThemedText style={styles.rowLabel}>Good Years (qualifying)</ThemedText>
                <View style={styles.stepperWrap}>
                  <Pressable onPress={() => setGoodYears(Math.max(0, goodYears - 1))} style={styles.stepBtn}>
                    <ThemedText style={styles.stepBtnText}>−</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.stepValue}>{goodYears}</ThemedText>
                  <Pressable onPress={() => setGoodYears(Math.min(40, goodYears + 1))} style={styles.stepBtn}>
                    <ThemedText style={styles.stepBtnText}>+</ThemedText>
                  </Pressable>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.rowItem}>
                <ThemedText style={styles.rowLabel}>Total Retirement Points</ThemedText>
                <View style={styles.stepperWrap}>
                  <Pressable onPress={() => setRetirementPoints(Math.max(0, retirementPoints - 50))} style={styles.stepBtn}>
                    <ThemedText style={styles.stepBtnText}>−</ThemedText>
                  </Pressable>
                  <ThemedText style={styles.stepValue}>{retirementPoints.toLocaleString()}</ThemedText>
                  <Pressable onPress={() => setRetirementPoints(retirementPoints + 50)} style={styles.stepBtn}>
                    <ThemedText style={styles.stepBtnText}>+</ThemedText>
                  </Pressable>
                </View>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.card, styles.heroCard]}>
              <View style={styles.heroRow}>
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>EST. MONTHLY</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.accent }]}>
                    {fmtMoneyWhole(retirementPoints > 0 ? pointsBasedCalc : yearBasedMonthly)}
                  </ThemedText>
                  <ThemedText style={styles.heroSub}>At age {RETIREMENT_AGE}</ThemedText>
                </View>
                <View style={styles.heroDiv} />
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>EST. ANNUAL</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.tactical }]}>
                    {fmtMoneyWhole((retirementPoints > 0 ? pointsBasedCalc : yearBasedMonthly) * 12)}
                  </ThemedText>
                  <ThemedText style={styles.heroSub}>Pre-tax</ThemedText>
                </View>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>HOW POINTS ACCUMULATE</ThemedText>
              {[
                { source: 'Each drill period (IDT)', points: '1 point per IDT' },
                { source: 'Membership points (annual)', points: '15 points/year' },
                { source: 'Active duty day (AT/ADOS)', points: '1 point per day' },
                { source: 'Correspondence courses', points: 'Varies' },
                { source: 'Funeral honors duty', points: '1 point per day (2 min)' },
              ].map((item, i) => (
                <View key={i} style={[styles.rowItem, i > 0 && styles.divider]}>
                  <ThemedText style={styles.rowLabel}>{item.source}</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: Brand.tactical }]}>{item.points}</ThemedText>
                </View>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>KEY RULES</ThemedText>
              {[
                { title: '20 Good Years Required', body: 'You must earn a "good year" (50+ points) for 20 separate years to qualify for retired pay.' },
                { title: 'Pay Starts at Age 60', body: 'Reserve retirement pay begins at 60, not at the day you stop drilling. Reduced by 90 days for each qualifying deployment after 2008.' },
                { title: 'High-3 Average', body: 'Pay is calculated using the highest 36 months of basic pay (same as active duty). Your grade on your retirement date matters.' },
                { title: 'COLA Adjustments', body: 'Reserve retirement pay is indexed to inflation (CPI-based COLA), same as active duty retirees.' },
                { title: 'Point Cap (annually)', body: 'Maximum creditable points per year: 365 (366 in leap years). No cap on total career points.' },
              ].map((item, i) => (
                <View key={i} style={[styles.faqItem, i > 0 && styles.divider]}>
                  <ThemedText style={styles.faqQ}>{item.title}</ThemedText>
                  <ThemedText style={styles.faqA}>{item.body}</ThemedText>
                </View>
              ))}
            </ThemedView>
          </>
        )}

        {/* ══ TRICARE TAB ═══════════════════════════════════════════════════════ */}
        {activeTab === 'tricare' && (
          <>
            <SectionHeader title="TRICARE Reserve Select" subtitle="FY2026 premiums · Voluntary coverage for SELRES members" />

            <ThemedView type="backgroundElement" style={[styles.card, styles.heroCard]}>
              <View style={styles.heroRow}>
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>MEMBER ONLY</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.accent }]}>{fmtMoney(TRS_PREMIUMS.member_only)}/mo</ThemedText>
                  <ThemedText style={styles.heroSub}>{fmtMoney(TRS_PREMIUMS.member_only * 12)}/yr</ThemedText>
                </View>
                <View style={styles.heroDiv} />
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>MEMBER + FAMILY</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.tactical }]}>{fmtMoney(TRS_PREMIUMS.member_family)}/mo</ThemedText>
                  <ThemedText style={styles.heroSub}>{fmtMoney(TRS_PREMIUMS.member_family * 12)}/yr</ThemedText>
                </View>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>COVERAGE DETAILS</ThemedText>
              {[
                { label: 'Plan Type', value: 'PPO (preferred provider)' },
                { label: 'Deductible (individual)', value: '$50 E1–E4 / $150 E5+/Officers' },
                { label: 'Deductible (family)', value: '$100 E1–E4 / $300 E5+/Officers' },
                { label: 'Cost share (civilian)', value: '15% after deductible' },
                { label: 'Out-of-pocket max (individual)', value: '$1,000/yr' },
                { label: 'Out-of-pocket max (family)', value: '$3,000/yr' },
                { label: 'Prescriptions (mail order)', value: '$0 generic / $13 brand' },
                { label: 'Emergency care (civilian ER)', value: '$90 copay after deductible' },
              ].map((item, i) => (
                <View key={i} style={[styles.rowItem, i > 0 && styles.divider]}>
                  <ThemedText style={styles.rowLabel}>{item.label}</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: '#C8D8E8', textAlign: 'right', flex: 1 }]} numberOfLines={1}>{item.value}</ThemedText>
                </View>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>ELIGIBILITY & ENROLLMENT</ThemedText>
              {[
                { q: 'Who is eligible?', a: 'SELRES members (Army Reserve, Navy Reserve, AFRC, SMCR, SELRES USCG) not on active duty orders of 30+ days.' },
                { q: 'When can I enroll?', a: 'Within 90 days of ending qualifying active duty, or within 90 days of a SELRES qualifying event (marriage, loss of other coverage). Otherwise wait for open enrollment.' },
                { q: 'What if I get activated?', a: 'TRS terminates when you go on active duty 30+ days. You convert to TRICARE Prime/Select as an active duty family member at no premium cost.' },
                { q: 'Does it cover dental/vision?', a: 'No. Dental coverage is through TRICARE Dental Program (TDP). Vision through FEDVIP for reservists.' },
                { q: 'Enrollment phone / website', a: 'Call 1-800-538-9552 or visit tricare.mil to enroll or change coverage.' },
              ].map((item, i) => (
                <View key={i} style={[styles.faqItem, i > 0 && styles.divider]}>
                  <ThemedText style={styles.faqQ}>{item.q}</ThemedText>
                  <ThemedText style={styles.faqA}>{item.a}</ThemedText>
                </View>
              ))}
            </ThemedView>
          </>
        )}

        {/* ══ MOBILIZATION TAB ════════════════════════════════════════════════════ */}
        {activeTab === 'mobilization' && (
          <>
            <SectionHeader title="Mobilization Pay" subtitle="What changes when you're activated on federal orders" />

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>DEPLOYMENT DURATION</ThemedText>
              <View style={styles.yosRow}>
                {[3, 6, 9, 12, 15, 18].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setDeployMonths(m)}
                    style={[styles.yosChip, deployMonths === m && styles.yosChipActive]}>
                    <ThemedText style={[styles.yosChipText, deployMonths === m && styles.yosChipTextActive]}>
                      {m}mo
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={[styles.card, styles.heroCard]}>
              <View style={styles.heroRow}>
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>TOTAL BASE PAY</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.accent }]}>{fmtMoneyWhole(mobilizationPay)}</ThemedText>
                  <ThemedText style={styles.heroSub}>{deployMonths} months</ThemedText>
                </View>
                <View style={styles.heroDiv} />
                <View style={styles.heroItem}>
                  <ThemedText style={styles.heroLabel}>COMBAT ZONE TAX</ThemedText>
                  <ThemedText style={[styles.heroValue, { color: Brand.success }]}>+{fmtMoneyWhole(taxSavedCombatZone)}</ThemedText>
                  <ThemedText style={styles.heroSub}>~22% saved (est.)</ThemedText>
                </View>
              </View>
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>WHAT YOU GAIN WHEN ACTIVATED</ThemedText>
              {[
                { item: 'Full basic pay (same as active duty)', value: fmtMoneyWhole(monthlyBasicPay) + '/mo' },
                { item: 'BAH (with or without dependents)', value: 'Based on duty station ZIP' },
                { item: 'BAS ($470.96 enlisted / $323.87 officer)', value: 'FY2026' },
                { item: 'TRICARE Prime / Select (no premium)', value: 'You + family' },
                { item: 'Combat zone tax exclusion', value: 'If deployed to CZ' },
                { item: 'Hostile Fire / Imminent Danger Pay', value: '+$225/mo in HFP zone' },
                { item: 'Family Separation Allowance', value: '+$250/mo if separated from family' },
                { item: 'TSP matching resumes (BRS members)', value: 'Up to 5% match' },
              ].map((item, i) => (
                <View key={i} style={[styles.rowItem, i > 0 && styles.divider]}>
                  <ThemedText style={[styles.rowLabel, { flex: 1, paddingRight: Spacing.two }]}>{item.item}</ThemedText>
                  <ThemedText style={[styles.rowValue, { color: Brand.tactical }]}>{item.value}</ThemedText>
                </View>
              ))}
            </ThemedView>

            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText style={styles.cardLabel}>KEY LEGAL PROTECTIONS (USERRA / SCRA)</ThemedText>
              {[
                { q: 'USERRA Job Protection', a: 'Your civilian employer must re-employ you in the same or equivalent position after return. You cannot be fired solely for being a reservist.' },
                { q: 'SCRA Interest Rate Cap', a: '6% max interest on pre-service debts (credit cards, car loans, mortgages) while on active duty. Request in writing to each creditor.' },
                { q: 'SCRA Lease Termination', a: 'You can break a housing lease with 30 days written notice plus a copy of orders. Protections kick in immediately.' },
                { q: 'SDP (Savings Deposit Program)', a: 'Invest up to $10,000 in SDP while deployed and earn 10% APY — guaranteed by DoD. Enrollment through Finance.' },
                { q: 'Civilian Pay Differential', a: 'Some states and federal agencies pay the difference if active duty pay is less than your civilian salary. Check your employer policy.' },
              ].map((item, i) => (
                <View key={i} style={[styles.faqItem, i > 0 && styles.divider]}>
                  <ThemedText style={styles.faqQ}>{item.q}</ThemedText>
                  <ThemedText style={styles.faqA}>{item.a}</ThemedText>
                </View>
              ))}
            </ThemedView>
          </>
        )}

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerText}>
            FY2026 rates. Drill pay = 1/30 monthly basic pay per IDT. TRICARE Reserve Select premiums per DHA. Retirement estimates are approximate — verify with HRC/NPC and your unit administrator. Travel to and from drill may qualify for mileage reimbursement.
          </ThemedText>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary, lineHeight: 34 },
  eyebrow: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#C8D8E8' },

  tabBar: {
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    gap: Spacing.two, flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.border,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingHorizontal: Spacing.two + 4, paddingVertical: Spacing.one + 2,
    borderRadius: 99, borderWidth: 1, borderColor: Brand.border,
  },
  tabBtnActive: { backgroundColor: Brand.accent + '20', borderColor: Brand.accent },
  tabLabel: { fontSize: 9, fontWeight: '800', color: '#3D6080', letterSpacing: 0.5 },
  tabLabelActive: { color: Brand.accent },

  scroll: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: 80, gap: Spacing.three },

  sectionHeader: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  sectionAccent: { width: 3, borderRadius: 2, backgroundColor: Brand.accent, marginTop: 3, alignSelf: 'stretch' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#C8D8E8' },
  sectionSub: { fontSize: 10, color: '#4D7A9A', marginTop: 2, lineHeight: 14 },

  card: { borderRadius: 4, padding: Spacing.three, gap: Spacing.two },
  heroCard: { backgroundColor: 'rgba(26,58,92,0.6)' },
  cardLabel: { fontSize: 9, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  cardHint: { fontSize: 11, color: '#3D6080', lineHeight: 16 },

  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroItem: { flex: 1, alignItems: 'center', gap: Spacing.one },
  heroDiv: { width: StyleSheet.hairlineWidth, height: 60, backgroundColor: Brand.border },
  heroLabel: { fontSize: 8, fontWeight: '800', color: '#4D7A9A', letterSpacing: 1 },
  heroValue: { fontSize: 22, fontWeight: '900', fontFamily: Fonts.data },
  heroSub: { fontSize: 10, color: '#3D6080' },

  gradeGroup: { gap: Spacing.one },
  gradeGroupLabel: { fontSize: 8, fontWeight: '700', color: '#3D6080', letterSpacing: 0.8 },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  gradeChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border },
  gradeChipActive: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  gradeChipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  gradeChipTextActive: { color: '#000' },

  yosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  yosChip: { paddingHorizontal: Spacing.two, paddingVertical: 5, borderRadius: 4, borderWidth: 1, borderColor: Brand.border, minWidth: 40, alignItems: 'center' },
  yosChipActive: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  yosChipText: { fontSize: 11, fontWeight: '700', color: '#4D7A9A' },
  yosChipTextActive: { color: '#fff' },

  rowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { fontSize: 12, color: '#8AB0CC', flex: 1 },
  rowNote: { fontSize: 10, color: '#3D6080' },
  rowValue: { fontSize: 13, fontWeight: '700', fontFamily: Fonts.data, textAlign: 'right' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.border, marginVertical: 2 },
  totalRow: { marginTop: 4 },

  stepperWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: { width: 32, height: 32, borderRadius: 4, backgroundColor: Brand.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, color: '#C8D8E8', fontWeight: '300', lineHeight: 22 },
  stepValue: { minWidth: 60, textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#C8D8E8', fontFamily: Fonts.data },

  faqItem: { paddingVertical: Spacing.two },
  faqQ: { fontSize: 12, fontWeight: '700', color: '#C8D8E8', marginBottom: 4 },
  faqA: { fontSize: 11, color: '#6B92B0', lineHeight: 17 },

  disclaimer: { borderRadius: 4, padding: Spacing.three },
  disclaimerText: { fontSize: 10, color: '#3D6080', lineHeight: 15 },
});
