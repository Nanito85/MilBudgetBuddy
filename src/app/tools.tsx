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

// ── Data ───────────────────────────────────────────────────────────────────────

const CALCULATORS: MenuItem[] = [
  {
    id: 'pcs',
    icon: '🚚',
    title: 'PCS Calculator',
    description: 'Compare BAH, COLA & total pay between duty stations',
    route: '/pcs-calculator',
    available: true,
    badge: 'New',
    color: '#1565C0',
  },
  {
    id: 'dity',
    icon: '📦',
    title: 'DITY / PPM Move',
    description: 'Estimate your incentive pay for a personally procured move',
    route: '/dity-calculator',
    available: true,
    badge: 'New',
    color: '#6A1B9A',
  },
  {
    id: 'tle',
    icon: '🏨',
    title: 'TLE / TLA Calculator',
    description: 'Calculate temporary lodging entitlement for your family',
    route: '/tle-calculator',
    available: true,
    badge: 'New',
    color: '#00695C',
  },
  {
    id: 'va_loan',
    icon: '🏠',
    title: 'VA Loan Calculator',
    description: 'How much house can you afford with your VA loan benefit',
    route: '/va-loan-calculator',
    available: true,
    badge: 'New',
    color: '#B71C1C',
  },
  {
    id: 'retirement',
    icon: '🏁',
    title: 'Retirement Calculator',
    description: 'Project your BRS vs High-3 pension value side by side',
    route: '/retirement-calculator',
    available: true,
    badge: 'New',
    color: '#C8A800',
  },
  {
    id: 'deployment',
    icon: '🪖',
    title: 'Deployment Earnings',
    description: 'IDP, CZTE tax exclusions, FSA, SDP & total deployment pay',
    route: '/deployment-calculator',
    available: true,
    badge: 'New',
    color: '#2E7D32',
  },
  {
    id: 'leave',
    icon: '📅',
    title: 'Leave Calculator',
    description: 'Terminal leave payout, use-or-lose risk & ETS balance',
    route: '/leave-calculator',
    available: true,
    badge: 'New',
    color: '#0277BD',
  },
];

const RESOURCES: MenuItem[] = [
  {
    id: 'tricare',
    icon: '🏥',
    title: 'TRICARE Estimator',
    description: 'Compare Prime vs Select costs for your family size and usage',
    route: '/tricare-estimator',
    available: true,
    badge: 'New',
    color: '#00695C',
  },
  {
    id: 'les',
    icon: '📄',
    title: 'LES Decoder',
    description: 'Understand every line of your LES + verify your pay math',
    route: '/les-decoder',
    available: true,
    badge: 'New',
    color: '#1A237E',
  },
  {
    id: 'credit',
    icon: '📊',
    title: 'Credit Score Guide',
    description: 'Understand your score, the 5 factors, and how to build it',
    route: '/credit-score',
    available: true,
    badge: 'New',
    color: '#C8A800',
  },
  {
    id: 'invest',
    icon: '📈',
    title: 'Investment 101',
    description: 'BLUF guides to TSP, index funds & building wealth',
    route: '/invest-101',
    available: true,
    badge: 'New',
    color: '#2A9D8F',
  },
  {
    id: 'schools',
    icon: '🏫',
    title: 'Schools Finder',
    description: 'Find and compare rated schools near military installations',
    route: '/schools-finder',
    available: true,
    badge: 'New',
    color: '#5C3D11',
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

        {/* Calculators */}
        <SectionLabel text="CALCULATORS" />
        <View style={styles.list}>
          {CALCULATORS.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
          ))}
        </View>

        {/* Resources */}
        <SectionLabel text="RESOURCES" />
        <View style={styles.list}>
          {RESOURCES.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
          ))}
        </View>

        {/* Budget shortcut */}
        <SectionLabel text="BUDGET" />
        <Pressable
          onPress={() => router.push('/budget' as any)}
          style={({ pressed }) => [styles.budgetShortcut, pressed && { opacity: 0.7 }]}>
          <ThemedText style={styles.budgetIcon}>💰</ThemedText>
          <View style={styles.budgetText}>
            <ThemedText style={styles.budgetTitle}>MONTHLY BUDGET</ThemedText>
            <ThemedText type="label" style={styles.budgetDesc}>Set and track your spending categories</ThemedText>
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

  eyebrow: { color: Brand.tactical, fontSize: 9, marginTop: Spacing.two },
  heading: { fontSize: 30, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 4 },
  subhead: { color: '#3D6080', fontSize: 9, marginTop: 2 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Brand.border },
  sectionLabel: { color: '#3D6080', fontSize: 9 },

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
  cardTitleLocked: { color: '#3D6080' },
  cardDesc: { color: '#4D7A9A', fontSize: 9, lineHeight: 13 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: Spacing.one,
  },
  badgeNew: { backgroundColor: Brand.accent + '20' },
  badgeSoon: { backgroundColor: Brand.border },
  badgeText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextNew: { color: Brand.accent },
  badgeTextSoon: { color: '#3D6080' },
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
  budgetDesc: { color: '#4D7A9A', fontSize: 9 },
});
