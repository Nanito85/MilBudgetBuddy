import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/user.store';
import { BRANCH_LABELS, getRankAbbrev } from '@/types/user.types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
  available: boolean;
  badge?: string;
  color: string;
}

// ── Situation shortcuts ─────────────────────────────────────────────────────────

interface SituationCard {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  route: string;
  color: string;
}

const SITUATIONS: SituationCard[] = [
  {
    id: 'pcs',
    icon: '🚚',
    title: 'Moving / PCS',
    subtitle: 'Compare pay, housing & schools',
    route: '/pcs-calculator',
    color: '#1565C0',
  },
  {
    id: 'deploy',
    icon: '🪖',
    title: 'Deploying',
    subtitle: 'Extra pay, tax savings & savings plan',
    route: '/deployment-calculator',
    color: '#2E7D32',
  },
  {
    id: 'ets',
    icon: '🎖️',
    title: 'Getting Out',
    subtitle: 'Separation checklist & leave payout',
    route: '/ets-checklist',
    color: '#C8A800',
  },
  {
    id: 'housing',
    icon: '🏠',
    title: 'Housing Decision',
    subtitle: 'Look up your BAH, on vs off-base',
    route: '/bah-guide',
    color: '#00695C',
  },
];

// ── Data ───────────────────────────────────────────────────────────────────────

const CALCULATORS: MenuItem[] = [
  {
    id: 'pay_chart',
    icon: '💰',
    title: 'Pay Chart',
    description: 'Look up your 2026 base pay by rank and years served',
    route: '/pay-chart',
    available: true,
    color: '#00695C',
  },
  {
    id: 'pcs',
    icon: '🚚',
    title: 'PCS Calculator',
    description: 'Compare your housing allowance and total pay between duty stations',
    route: '/pcs-calculator',
    available: true,
    color: '#1565C0',
  },
  {
    id: 'dity',
    icon: '📦',
    title: 'Self-Move Pay (DITY)',
    description: 'Find out how much the military will pay you to move yourself',
    route: '/dity-calculator',
    available: true,
    color: '#6A1B9A',
  },
  {
    id: 'tle',
    icon: '🏨',
    title: 'TLA/TLE Reimbursement',
    description: 'Calculate how much you\'ll receive for hotel stays during a PCS move',
    route: '/tle-calculator',
    available: true,
    color: '#00695C',
  },
  {
    id: 'va_loan',
    icon: '🏠',
    title: 'VA Loan Calculator',
    description: 'See how much home you can afford using your VA home loan benefit',
    route: '/va-loan-calculator',
    available: true,
    color: '#B71C1C',
  },
  {
    id: 'retirement',
    icon: '🏁',
    title: 'Retirement Calculator',
    description: 'Compare the two military retirement systems and project your pension',
    route: '/retirement-calculator',
    available: true,
    color: '#C8A800',
  },
  {
    id: 'deployment',
    icon: '🪖',
    title: 'Deployment Pay Calculator',
    description: 'Calculate extra pay and tax savings while deployed to a combat zone',
    route: '/deployment-calculator',
    available: true,
    color: '#2E7D32',
  },
  {
    id: 'deployment_savings',
    icon: '💰',
    title: 'Deployment Savings Planner',
    description: 'Set a savings goal and plan how to make the most of your deployment pay',
    route: '/deployment-savings',
    available: true,
    color: '#2E7D32',
  },
  {
    id: 'leave',
    icon: '📅',
    title: 'Leave Payout Calculator',
    description: 'See how much your unused leave days are worth when you separate',
    route: '/leave-calculator',
    available: true,
    color: '#0277BD',
  },
  {
    id: 'tsp',
    icon: '📊',
    title: 'TSP Retirement Savings',
    description: 'Understand your military 401(k) — fund choices, matching, and projections',
    route: '/tsp-calculator',
    available: true,
    color: '#00695C',
  },
  {
    id: 'debt',
    icon: '💳',
    title: 'Debt Payoff Planner',
    description: 'Choose the fastest strategy to pay off your debts and save on interest',
    route: '/debt-payoff',
    available: true,
    color: '#B71C1C',
  },
  {
    id: 'sbp',
    icon: '🛡️',
    title: 'Survivor Benefit Plan',
    description: 'Understand the pension protection for your family if you retire or pass away',
    route: '/sbp-calculator',
    available: true,
    color: '#1A237E',
  },
  {
    id: 'tdy_optimizer',
    icon: '✈️',
    title: 'TDY Per Diem Optimizer',
    description: 'Find out how much you can pocket by spending under your daily travel allowance',
    route: '/tdy-optimizer',
    available: true,
    color: '#C8A800',
  },
];

const MONEY_TOOLS: MenuItem[] = [
  {
    id: 'money_flow',
    icon: '🗺️',
    title: 'Where to Put Your Money',
    description: 'A 6-step checklist showing the right order to save and invest each month',
    route: '/money-flowchart',
    available: true,
    color: '#00B27A',
  },
  {
    id: 'savings_rate',
    icon: '🎯',
    title: 'Savings Rate Tracker',
    description: 'See what percentage of your income you\'re saving and how close you are to financial freedom',
    route: '/savings-rate',
    available: true,
    color: '#0277BD',
  },
  {
    id: 'roth_ira',
    icon: '📈',
    title: 'Roth IRA Tracker',
    description: 'Track your Roth IRA balance and see how it grows over 20–30 years',
    route: '/roth-ira',
    available: true,
    color: '#6A1B9A',
  },
  {
    id: 'car_loan',
    icon: '🚗',
    title: 'Car Loan Reality Check',
    description: 'Check if a car payment fits your budget before you sign at the dealership',
    route: '/car-loan',
    available: true,
    color: '#D32F2F',
  },
  {
    id: 'offbase',
    icon: '🏠',
    title: 'Off-Base vs Barracks',
    description: 'Find out if you\'re eligible to live off-base and whether it makes financial sense',
    route: '/offbase-calculator',
    available: true,
    color: '#1565C0',
  },
];

const RESOURCES: MenuItem[] = [
  {
    id: 'bah_guide',
    icon: '🏛️',
    title: 'Housing Allowance (BAH) Guide',
    description: 'Look up your monthly housing allowance by location and rank — 2026 rates',
    route: '/bah-guide',
    available: true,
    color: '#1565C0',
  },
  {
    id: 'tax_guide',
    icon: '🧾',
    title: 'Military Tax Guide',
    description: 'Learn what military pay is tax-free and how to file as a servicemember',
    route: '/tax-guide',
    available: true,
    color: '#1A237E',
  },
  {
    id: 'scra',
    icon: '⚖️',
    title: 'Legal Protections Guide (SCRA)',
    description: 'Your rights — interest rate cap at 6%, lease breaks, and eviction protection',
    route: '/scra-guide',
    available: true,
    color: '#1A237E',
  },
  {
    id: 'ets',
    icon: '🎖️',
    title: 'Separation Checklist',
    description: 'Step-by-step transition guide starting 12 months before your last day',
    route: '/ets-checklist',
    available: true,
    color: '#2E7D32',
  },
  {
    id: 'tricare',
    icon: '🏥',
    title: 'TRICARE Healthcare Estimator',
    description: 'Compare your military healthcare plan options and estimate your costs',
    route: '/tricare-estimator',
    available: true,
    color: '#00695C',
  },
  {
    id: 'les',
    icon: '📄',
    title: 'Pay Statement (LES) Decoder',
    description: 'Understand every line on your military pay statement and verify the math',
    route: '/les-decoder',
    available: true,
    color: '#1A237E',
  },
  {
    id: 'credit',
    icon: '📊',
    title: 'Credit Score Guide',
    description: 'Learn how your credit score works and the steps to build strong credit',
    route: '/credit-score',
    available: true,
    color: '#C8A800',
  },
  {
    id: 'invest',
    icon: '📈',
    title: 'Investing Basics',
    description: 'Plain-English guide to building wealth with index funds and your TSP',
    route: '/invest-101',
    available: true,
    color: '#2A9D8F',
  },
  {
    id: 'schools',
    icon: '🏫',
    title: 'Schools Finder',
    description: 'Find and compare rated schools near military installations',
    route: '/schools-finder',
    available: true,
    color: '#5C3D11',
  },
  {
    id: 'va_disability',
    icon: '🎖️',
    title: 'VA Disability Calculator',
    description: 'Calculate your combined disability rating and monthly compensation',
    route: '/va-disability',
    available: true,
    color: '#B71C1C',
  },
  {
    id: 'gi_bill',
    icon: '🎓',
    title: 'GI Bill Benefits Calculator',
    description: 'Calculate your education benefits — housing allowance, tuition coverage, and time remaining',
    route: '/gi-bill-calculator',
    available: true,
    color: '#1A237E',
  },
];

// ── Components ─────────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLine} />
      <ThemedText type="label" style={styles.sectionLabel}>{text}</ThemedText>
      <View style={styles.sectionLine} />
    </View>
  );
}

function MenuCard({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const isLocked = !item.available;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, isLocked && styles.cardLocked, pressed && !isLocked && { opacity: 0.7 }]}>
      <View style={[styles.cardAccent, { backgroundColor: isLocked ? Brand.border : item.color }]} />
      <View style={[styles.iconWrap, { backgroundColor: item.color + (isLocked ? '10' : '20') }]}>
        <ThemedText style={styles.cardIcon}>{item.icon}</ThemedText>
      </View>
      <View style={styles.cardText}>
        <ThemedText style={[styles.cardTitle, isLocked && styles.cardTitleLocked]}>{item.title.toUpperCase()}</ThemedText>
        <ThemedText type="label" style={styles.cardDesc}>{item.description}</ThemedText>
      </View>
      {item.badge && (
        <View style={[styles.badge,
          item.badge === 'New' ? styles.badgeNew : styles.badgeSoon]}>
          <ThemedText type="label" style={[styles.badgeText,
            item.badge === 'New' ? styles.badgeTextNew : styles.badgeTextSoon]}>
            {item.badge.toUpperCase()}
          </ThemedText>
        </View>
      )}
      {!isLocked && <ThemedText style={styles.chevron}>›</ThemedText>}
    </Pressable>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function MoreScreen() {
  const router = useRouter();
  const branch = useUserStore((s) => s.branch);
  const payGrade = useUserStore((s) => s.payGrade);
  const lastName = useUserStore((s) => s.lastName);
  const nickname = useUserStore((s) => s.nickname);

  const displayName = nickname || (lastName ? lastName.toUpperCase() : null);
  const rankAbbrev = getRankAbbrev(branch, payGrade);

  const handlePress = (item: MenuItem) => {
    if (!item.available) return;
    router.push(item.route as any);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}>
        <SafeAreaView>
          {/* Profile mini-bar */}
          <Pressable
            onPress={() => router.push('/profile' as any)}
            style={({ pressed }) => [styles.profileBar, pressed && { opacity: 0.7 }]}>
            <View style={styles.profileLeft}>
              <ThemedText type="label" style={styles.profileRank}>{rankAbbrev || '—'}</ThemedText>
              <ThemedText style={styles.profileName}>
                {displayName || 'COMPLETE PROFILE'}
              </ThemedText>
              {branch && (
                <ThemedText type="label" style={styles.profileBranch}>
                  {BRANCH_LABELS[branch].toUpperCase()}
                </ThemedText>
              )}
            </View>
            <View style={styles.profileRight}>
              <ThemedText type="label" style={styles.profileEditHint}>EDIT PROFILE ›</ThemedText>
            </View>
          </Pressable>

          <ThemedText type="label" style={styles.eyebrow}>// FINANCE OPERATIONS CENTER</ThemedText>
          <ThemedText style={styles.heading}>OPS TOOLKIT</ThemedText>
          <ThemedText type="label" style={styles.subhead}>CALCULATORS · RESOURCES · INTEL</ThemedText>
        </SafeAreaView>

        {/* Common Situations */}
        <SectionLabel text="I WILL BE..." />
        <View style={styles.situationGrid}>
          {SITUATIONS.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => router.push(s.route as any)}
              style={({ pressed }) => [styles.situationCard, { borderColor: s.color + '40' }, pressed && { opacity: 0.7 }]}>
              <View style={[styles.situationIconWrap, { backgroundColor: s.color + '20' }]}>
                <ThemedText style={styles.situationIcon}>{s.icon}</ThemedText>
              </View>
              <ThemedText style={[styles.situationTitle, { color: s.color }]}>{s.title.toUpperCase()}</ThemedText>
              <ThemedText type="label" style={styles.situationSub}>{s.subtitle}</ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Calculators */}
        <SectionLabel text="CALCULATORS" />
        <View style={styles.list}>
          {CALCULATORS.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
          ))}
        </View>

        {/* Money Planning Tools */}
        <SectionLabel text="MONEY PLANNING" />
        <View style={styles.list}>
          {MONEY_TOOLS.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
          ))}
        </View>

        {/* Resources */}
        <SectionLabel text="GUIDES & RESOURCES" />
        <View style={styles.list}>
          {RESOURCES.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
          ))}
        </View>

        {/* Net Worth */}
        <SectionLabel text="FINANCIAL TRACKING" />
        <Pressable
          onPress={() => router.push('/net-worth' as any)}
          style={({ pressed }) => [styles.budgetShortcut, { borderColor: Brand.tactical + '40' }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={styles.budgetIcon}>📈</ThemedText>
          <View style={styles.budgetText}>
            <ThemedText style={styles.budgetTitle}>NET WORTH TRACKER</ThemedText>
            <ThemedText type="label" style={styles.budgetDesc}>Assets vs liabilities — your one number</ThemedText>
          </View>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </Pressable>

        {/* Settings */}
        <SectionLabel text="APP" />
        <Pressable
          onPress={() => router.push('/settings' as any)}
          style={({ pressed }) => [styles.budgetShortcut, { borderColor: Brand.border }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={styles.budgetIcon}>⚙️</ThemedText>
          <View style={styles.budgetText}>
            <ThemedText style={styles.budgetTitle}>SETTINGS</ThemedText>
            <ThemedText type="label" style={styles.budgetDesc}>Customize home screen quick-access tiles</ThemedText>
          </View>
          <ThemedText style={styles.chevron}>›</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },

  profileBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    padding: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  profileLeft: { gap: 2 },
  profileRank: { color: Brand.accent, fontSize: 9 },
  profileName: { fontSize: 16, fontWeight: '800', color: '#C8D8E8', letterSpacing: 0.5 },
  profileBranch: { color: '#3D6080', fontSize: 9 },
  profileRight: { alignItems: 'flex-end' },
  profileEditHint: { color: Brand.tactical, fontSize: 8 },

  eyebrow: { color: Brand.tactical, fontSize: 10, marginTop: Spacing.two },
  heading: { fontSize: 22, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 4 },
  subhead: { color: '#6B92B0', fontSize: 10, marginTop: 2 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  sectionLabel: { color: '#6B92B0', fontSize: 10, letterSpacing: 0.5 },

  situationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  situationCard: {
    width: '47.5%',
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  situationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  situationIcon: { fontSize: 18 },
  situationTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  situationSub: { color: '#6B92B0', fontSize: 10, lineHeight: 14 },

  list: { gap: Spacing.two },
  card: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    overflow: 'hidden',
  },
  cardLocked: { opacity: 0.45 },
  cardAccent: { width: 3, alignSelf: 'stretch' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  cardIcon: { fontSize: 22 },
  cardText: { flex: 1, gap: 2, paddingVertical: Spacing.two },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: '#C8D8E8' },
  cardTitleLocked: { color: '#6B92B0' },
  cardDesc: { color: '#6B92B0', fontSize: 11, lineHeight: 15 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: Spacing.one,
  },
  badgeNew: { backgroundColor: Brand.accent + '20' },
  badgeSoon: { backgroundColor: Brand.border },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextNew: { color: Brand.accent },
  badgeTextSoon: { color: '#6B92B0' },
  chevron: { color: Brand.accent, fontSize: 20, paddingRight: Spacing.two },

  budgetShortcut: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.tactical + '40',
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  budgetIcon: { fontSize: 24 },
  budgetText: { flex: 1, gap: 2 },
  budgetTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, color: '#C8D8E8' },
  budgetDesc: { color: '#6B92B0', fontSize: 11 },
});
