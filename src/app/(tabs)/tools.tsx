import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

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
  tags?: string[]; // for search
}

const RECENTLY_USED_KEY = 'mbb_recently_used_tools';
const MAX_RECENT = 6;

// ── Tool Categories ─────────────────────────────────────────────────────────────

const PAY_ENTITLEMENTS: MenuItem[] = [
  { id: 'pay_chart',    icon: '💰', color: '#00695C', title: 'Pay Chart',
    description: 'FY2026 base pay by rank and years of service — official DFAS rates', route: '/pay-chart', available: true, tags: ['salary','base pay','basic pay'] },
  { id: 'promotion',    icon: '⭐', color: '#C8A800', title: 'Promotion Pay Predictor', badge: 'New',
    description: 'See exactly how much your next promotion is worth — monthly, annual, and 5-year impact', route: '/promotion-calculator', available: true, tags: ['promotion','rank','raise','increase','next rank'] },
  { id: 'bah_guide',   icon: '🏛️', color: '#1565C0', title: 'BAH / OHA Guide',          description: 'Housing allowance lookup by ZIP and rank — includes OCONUS OHA rates',  route: '/bah-guide',          available: true, tags: ['housing','allowance','bah','oha'] },
  { id: 'tdy_optimizer',icon: '✈️', color: '#C8A800', title: 'TDY Per Diem Optimizer',  description: 'GSA FY2026 per diem rates — see how much you can pocket under the limit', route: '/tdy-optimizer',      available: true, tags: ['tdy','travel','per diem'] },
  { id: 'gs_pay',      icon: '🏛️', color: '#37474F', title: 'GS Pay Calculator',        description: 'Federal civilian GS pay by grade, step, and locality — with military comparison', route: '/gs-pay-calculator', available: true, tags: ['civilian','gs','federal','general schedule'] },
  { id: 'leave',       icon: '📅', color: '#0277BD', title: 'Leave Payout Calculator',  description: 'How much your unused leave days are worth when you separate',            route: '/leave-calculator',   available: true, tags: ['leave','terminal','separation'] },
  { id: 'reserves',    icon: '🎖️', color: '#1565C0', title: 'Reserve & Guard Hub',      description: 'Drill pay, retirement points, TRICARE Reserve Select, mobilization',    route: '/reserves',           available: true, tags: ['reserve','guard','drill','arng','selres'] },
];

const PCS_TRAVEL: MenuItem[] = [
  { id: 'pcs',         icon: '🚚', color: '#1565C0', title: 'PCS Calculator',           description: 'Compare BAH and total pay between duty stations — find your best move',  route: '/pcs-calculator',     available: true, tags: ['pcs','move','duty station','bah compare'] },
  { id: 'dity',        icon: '📦', color: '#6A1B9A', title: 'Self-Move Pay (DITY/PPM)', description: 'How much the military pays you to move yourself — estimate your profit', route: '/dity-calculator',    available: true, tags: ['dity','ppm','move','truck'] },
  { id: 'tle',         icon: '🏨', color: '#00695C', title: 'TLA/TLE Reimbursement',   description: 'Hotel reimbursement during a PCS move — how many days and how much',     route: '/tle-calculator',     available: true, tags: ['tle','tla','lodging','hotel','pcs'] },
  { id: 'offbase',     icon: '🏠', color: '#1565C0', title: 'Off-Base vs Barracks',    description: 'BAH eligibility by grade — break-even rent and net savings analysis',    route: '/offbase-calculator', available: true, tags: ['barracks','off base','bah','housing','rent'] },
  { id: 'schools',     icon: '🏫', color: '#5C3D11', title: 'Schools Finder',           description: 'Find and compare rated schools near military installations',              route: '/schools-finder',     available: true, tags: ['schools','education','pcs','kids','family'] },
];

const BUDGET_WEALTH: MenuItem[] = [
  { id: 'debt',        icon: '💳', color: '#B71C1C', title: 'Debt Payoff Planner',      description: 'Avalanche vs snowball — fastest path to debt-free with your payoff date', route: '/debt-payoff',        available: true, tags: ['debt','credit card','loans','payoff'] },
  { id: 'money_flow',  icon: '🗺️', color: '#00B27A', title: 'Where to Put Your Money',  description: '6-step order of operations for saving and investing each month',           route: '/money-flowchart',   available: true, tags: ['savings','invest','priority','order'] },
  { id: 'savings_rate',icon: '🎯', color: '#0277BD', title: 'Savings Rate Tracker',     description: 'Your savings percentage and how close you are to financial independence', route: '/savings-rate',       available: true, tags: ['savings','fire','fi','financial freedom'] },
  { id: 'roth_ira',    icon: '📈', color: '#6A1B9A', title: 'Roth IRA Tracker',         description: 'FY2026 contribution limits, balance tracker, and 30-year projection',    route: '/roth-ira',           available: true, tags: ['roth','ira','retirement','invest'] },
  { id: 'car_loan',    icon: '🚗', color: '#D32F2F', title: 'Car Loan Reality Check',   description: 'True cost of a car payment — monthly burden and TSP opportunity cost',   route: '/car-loan',           available: true, tags: ['car','loan','auto','vehicle','payment'] },
  { id: 'net_worth',   icon: '📈', color: '#00C8A8', title: 'Net Worth Tracker',        description: 'Assets vs liabilities — track your one true financial number over time', route: '/net-worth',          available: true, tags: ['net worth','assets','liabilities','wealth'] },
];

const RETIREMENT_VA: MenuItem[] = [
  { id: 'retirement',  icon: '🏁', color: '#C8A800', title: 'Retirement Calculator',    description: 'BRS vs High-3 side by side — pension, TSP, and break-even analysis',   route: '/retirement-calculator', available: true, tags: ['retirement','brs','high3','pension','20 year'] },
  { id: 'tsp',         icon: '📊', color: '#00695C', title: 'TSP Deep Dive',            description: 'Fund guide, BRS match gap, and 30-year projection by allocation',        route: '/tsp-calculator',     available: true, tags: ['tsp','401k','retirement','invest','funds'] },
  { id: 'sbp',         icon: '🛡️', color: '#1A237E', title: 'Survivor Benefit Plan',   description: 'SBP premium, 55% annuity, break-even, and actuarial scenario',           route: '/sbp-calculator',     available: true, tags: ['sbp','survivor','spouse','pension','widow'] },
  { id: 'va_loan',     icon: '🏠', color: '#B71C1C', title: 'VA Loan Calculator',       description: 'How much home you can afford using your VA benefit — no PMI',            route: '/va-loan-calculator', available: true, tags: ['va loan','home','mortgage','house','buy'] },
  { id: 'va_disability',icon: '🎖️',color: '#B71C1C', title: 'VA Disability Calculator', description: 'Combined rating using the official VA formula — FY2026 compensation',   route: '/va-disability',      available: true, tags: ['va','disability','rating','compensation','100%'] },
  { id: 'gi_bill',     icon: '🎓', color: '#1A237E', title: 'GI Bill Calculator',       description: 'Chapter 33 BAH by ZIP, eligibility tiers, and remaining benefit',        route: '/gi-bill-calculator', available: true, tags: ['gi bill','education','college','chapter 33','mha'] },
];

const DEPLOYMENT: MenuItem[] = [
  { id: 'deployment',         icon: '🪖', color: '#2E7D32', title: 'Deployment Pay Calculator',  description: 'IDP, CZTE, FSA, SDP — your full tax-free deployment pay breakdown',   route: '/deployment-calculator', available: true, tags: ['deploy','combat','idp','czte','tax free'] },
  { id: 'deployment_savings', icon: '💰', color: '#2E7D32', title: 'Deployment Savings Planner', description: 'CZTE/IDP toggles, SDP eligibility, and savings goal tracker',          route: '/deployment-savings',    available: true, tags: ['deploy','savings','goal','czte','sdp'] },
];

const RESOURCES: MenuItem[] = [
  { id: 'les',         icon: '📄', color: '#1A237E', title: 'LES Decoder',               description: 'Every line on your pay statement explained — verify your math',          route: '/les-decoder',        available: true, tags: ['les','pay statement','entitlements','deductions'] },
  { id: 'tax_guide',   icon: '🧾', color: '#1A237E', title: 'Military Tax Guide',         description: 'What military pay is tax-free, how to file, and state exemptions',       route: '/tax-guide',          available: true, tags: ['tax','irs','state','w2','combat zone'] },
  { id: 'scra',        icon: '⚖️', color: '#1A237E', title: 'SCRA Legal Protections',    description: '6% interest cap, lease breaks, eviction protection — know your rights',  route: '/scra-guide',         available: true, tags: ['scra','legal','rights','interest','lease'] },
  { id: 'tricare',     icon: '🏥', color: '#00695C', title: 'TRICARE Estimator',          description: 'Compare Prime, Select, Overseas — copays, deductibles, out-of-pocket',  route: '/tricare-estimator',  available: true, tags: ['tricare','health','insurance','prime','select'] },
  { id: 'credit',      icon: '📊', color: '#C8A800', title: 'Credit Score Guide',         description: 'How your score works, what hurts it, and the roadmap to 800+',           route: '/credit-score',       available: true, tags: ['credit','score','fico','report','loan'] },
  { id: 'invest',      icon: '📈', color: '#2A9D8F', title: 'Investing Basics',           description: 'Index funds, TSP, Roth IRA — plain-English guide for service members',   route: '/invest-101',         available: true, tags: ['invest','index fund','etf','stock','market'] },
  { id: 'ets',         icon: '🎖️', color: '#2E7D32', title: 'Separation Checklist',      description: '12-month step-by-step transition timeline for getting out',               route: '/ets-checklist',      available: true, tags: ['ets','separation','transition','dd214','tap'] },
];

const COMMAND_TOOLS: MenuItem[] = [
  { id: 'life_events',  icon: '📋', color: '#1565C0', title: 'Life Event Checklists',      description: 'PCS, promotion, deployment, marriage, newborn — mission-critical checklists', route: '/life-events',    available: true, tags: ['pcs','promotion','deploy','marriage','baby','checklist'] },
  { id: 'command_mode', icon: '🎖️', color: Brand.accent, title: 'Financial Readiness Worksheet', description: 'Self-generated pay worksheet — voluntary disclosure to chain of command', route: '/command-mode', available: true, tags: ['command','readiness','worksheet','export','share'] },
];

const ALL_TOOLS = [...PAY_ENTITLEMENTS, ...PCS_TRAVEL, ...BUDGET_WEALTH, ...RETIREMENT_VA, ...DEPLOYMENT, ...RESOURCES, ...COMMAND_TOOLS];

// ── Category definitions ────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
  eyebrow: string;
  color: string;
  items: MenuItem[];
}

const CATEGORIES: Category[] = [
  { id: 'pay',        label: 'PAY & ENTITLEMENTS',    eyebrow: '// MILITARY COMPENSATION',  color: '#00695C', items: PAY_ENTITLEMENTS },
  { id: 'pcs',        label: 'PCS & TRAVEL',          eyebrow: '// MOVES & REIMBURSEMENTS', color: '#1565C0', items: PCS_TRAVEL },
  { id: 'budget',     label: 'BUDGET & WEALTH',       eyebrow: '// PERSONAL FINANCE',       color: '#B71C1C', items: BUDGET_WEALTH },
  { id: 'retirement', label: 'RETIREMENT & VETERANS', eyebrow: '// LONG-TERM READINESS',    color: '#C8A800', items: RETIREMENT_VA },
  { id: 'deployment', label: 'DEPLOYMENT',            eyebrow: '// COMBAT ZONE FINANCE',    color: '#2E7D32', items: DEPLOYMENT },
  { id: 'resources',  label: 'GUIDES & RESOURCES',    eyebrow: '// REFERENCE & EDUCATION',  color: '#1A237E', items: RESOURCES },
  { id: 'command',    label: 'FINANCIAL COMMAND',     eyebrow: '// READINESS & OPERATIONS', color: Brand.accent, items: COMMAND_TOOLS },
];

// ── Quick Situations ────────────────────────────────────────────────────────────

const SITUATIONS = [
  { id: 'pcs',     icon: '🚚', title: 'Moving / PCS',       subtitle: 'Compare pay, housing & schools', route: '/pcs-calculator',     color: '#1565C0' },
  { id: 'deploy',  icon: '🪖', title: 'Deploying',           subtitle: 'Extra pay, tax savings & goals', route: '/deployment-calculator', color: '#2E7D32' },
  { id: 'ets',     icon: '🎖️', title: 'Getting Out',         subtitle: 'Separation checklist & leave',   route: '/ets-checklist',      color: '#C8A800' },
  { id: 'housing', icon: '🏠', title: 'Housing Decision',    subtitle: 'BAH lookup, on vs off-base',     route: '/bah-guide',          color: '#00695C' },
];

// ── Components ─────────────────────────────────────────────────────────────────

function MenuCard({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: tc.surface, borderBottomColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
      <View style={[styles.cardAccent, { backgroundColor: item.color }]} />
      <View style={[styles.iconWrap, { backgroundColor: item.color + '20' }]}>
        <ThemedText style={styles.cardIcon}>{item.icon}</ThemedText>
      </View>
      <View style={styles.cardText}>
        <ThemedText style={[styles.cardTitle, { color: tc.textPrimary }]}>{item.title}</ThemedText>
        <ThemedText type="small" style={[styles.cardDesc, { color: tc.textSecondary }]}>{item.description}</ThemedText>
      </View>
      {item.badge && (
        <View style={[styles.badge, item.badge === 'New' ? styles.badgeNew : { backgroundColor: tc.borderColor }]}>
          <ThemedText type="label" style={[styles.badgeText, item.badge === 'New' ? styles.badgeTextNew : { color: tc.textSecondary }]}>
            {item.badge.toUpperCase()}
          </ThemedText>
        </View>
      )}
      <ThemedText style={styles.chevron}>›</ThemedText>
    </Pressable>
  );
}

function CategorySection({
  category, onPress,
}: {
  category: Category;
  onPress: (item: MenuItem) => void;
}) {
  const tc = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[styles.categoryBlock, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
      <Pressable onPress={() => setExpanded(v => !v)} style={styles.categoryHeader} hitSlop={8}>
        <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.categoryEyebrow, { color: tc.textMuted }]}>{category.eyebrow}</ThemedText>
          <ThemedText style={[styles.categoryLabel, { color: category.color }]}>{category.label}</ThemedText>
        </View>
        <ThemedText style={[styles.categoryCount, { color: category.color }]}>{category.items.length}</ThemedText>
        <ThemedText style={[styles.categoryChevron, { color: category.color }]}>{expanded ? '▲' : '▼'}</ThemedText>
      </Pressable>
      {expanded && (
        <View style={[styles.categoryItems, { borderTopColor: tc.borderColor }]}>
          {category.items.map((item) => (
            <MenuCard key={item.id} item={item} onPress={() => onPress(item)} />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function ToolsScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(RECENTLY_USED_KEY).then((raw) => {
      if (raw) setRecentIds(JSON.parse(raw));
    });
  }, []);

  const recentTools = useMemo(
    () => recentIds.map((id) => ALL_TOOLS.find((t) => t.id === id)).filter(Boolean) as MenuItem[],
    [recentIds],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_TOOLS.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.includes(q)),
    );
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const handlePress = (item: MenuItem) => {
    if (!item.available) return;
    // Track recently used
    const updated = [item.id, ...recentIds.filter((id) => id !== item.id)].slice(0, MAX_RECENT);
    setRecentIds(updated);
    AsyncStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
    router.push(item.route as any);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: BottomTabInset + Spacing.five }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        <SafeAreaView>
          <ThemedText type="label" style={styles.eyebrow}>// FINANCE OPERATIONS CENTER</ThemedText>
          <ThemedText style={[styles.heading, { color: tc.textPrimary }]}>OPS TOOLKIT</ThemedText>
          <ThemedText type="label" style={[styles.subhead, { color: tc.textSecondary }]}>{ALL_TOOLS.length} TOOLS · CALCULATORS · INTEL</ThemedText>
        </SafeAreaView>

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
          <ThemedText style={styles.searchIcon}>🔍</ThemedText>
          <TextInput
            style={[styles.searchInput, { color: tc.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search all tools..."
            placeholderTextColor={tc.textMuted}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <ThemedText style={[styles.searchClear, { color: tc.textMuted }]}>✕</ThemedText>
            </Pressable>
          )}
        </View>

        {/* ── SEARCH RESULTS ── */}
        {isSearching ? (
          <View style={styles.list}>
            {searchResults.length === 0 ? (
              <ThemedText style={[styles.searchEmpty, { color: tc.textMuted }]}>No tools match "{searchQuery}"</ThemedText>
            ) : (
              searchResults.map((item) => (
                <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
              ))
            )}
          </View>
        ) : (
          <>
            {/* Quick Situations */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
              <ThemedText style={[styles.sectionLabelText, { color: tc.textSecondary }]}>I WILL BE...</ThemedText>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
            </View>
            <View style={styles.situationGrid}>
              {SITUATIONS.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => router.push(s.route as any)}
                  style={({ pressed }) => [styles.situationCard, { backgroundColor: tc.surface, borderColor: s.color + '40' }, pressed && { opacity: 0.7 }]}>
                  <View style={[styles.situationIconWrap, { backgroundColor: s.color + '20' }]}>
                    <ThemedText style={styles.situationIcon}>{s.icon}</ThemedText>
                  </View>
                  <ThemedText style={[styles.situationTitle, { color: s.color }]}>{s.title.toUpperCase()}</ThemedText>
                  <ThemedText type="small" style={[styles.situationSub, { color: tc.textSecondary }]}>{s.subtitle}</ThemedText>
                </Pressable>
              ))}
            </View>


            {/* Recently Used */}
            {recentTools.length > 0 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
                  <ThemedText style={[styles.sectionLabelText, { color: tc.textSecondary }]}>RECENTLY USED</ThemedText>
                  <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
                </View>
                <View style={styles.list}>
                  {recentTools.map((item) => (
                    <MenuCard key={item.id} item={item} onPress={() => handlePress(item)} />
                  ))}
                </View>
              </>
            )}

            {/* Categories */}
            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                onPress={handlePress}
              />
            ))}

            {/* Settings */}
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
              <ThemedText style={[styles.sectionLabelText, { color: tc.textSecondary }]}>APP</ThemedText>
              <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
            </View>
            <Pressable
              onPress={() => router.push('/settings' as any)}
              style={({ pressed }) => [styles.shortcutRow, { backgroundColor: tc.surface }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={styles.shortcutIcon}>⚙️</ThemedText>
              <View style={styles.shortcutText}>
                <ThemedText style={[styles.shortcutTitle, { color: tc.textPrimary }]}>SETTINGS</ThemedText>
                <ThemedText type="small" style={[styles.shortcutDesc, { color: tc.textSecondary }]}>Profile, text size, notifications, quick-access tiles</ThemedText>
              </View>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ThemedView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, gap: Spacing.three },

  eyebrow: { color: Brand.tactical, fontSize: 10, marginTop: Spacing.two },
  heading: { fontSize: 22, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  subhead: { fontSize: 10, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 8, paddingHorizontal: Spacing.three, paddingVertical: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  searchClear: { fontSize: 14, paddingHorizontal: 4 },
  searchEmpty: { fontSize: 13, textAlign: 'center', paddingVertical: Spacing.four },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: StyleSheet.hairlineWidth },
  sectionLabelText: { fontSize: 10, letterSpacing: 0.5, fontWeight: '700' },

  situationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  situationCard: {
    width: '47.5%',
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 6,
    padding: Spacing.two, gap: Spacing.one,
  },
  situationIconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  situationIcon: { fontSize: 18 },
  situationTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  situationSub: { fontSize: 12, lineHeight: 16 },

  // Category section
  categoryBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  categoryDot: { width: 4, height: 32, borderRadius: 2 },
  categoryEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  categoryLabel: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginTop: 1 },
  categoryCount: { fontSize: 11, fontWeight: '700', opacity: 0.7, marginRight: 4 },
  categoryChevron: { fontSize: 12, fontWeight: '700' },
  categoryItems: { gap: 1, borderTopWidth: StyleSheet.hairlineWidth },

  list: { gap: Spacing.two },
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    overflow: 'hidden',
  },
  cardAccent: { width: 3, alignSelf: 'stretch' },
  iconWrap: { width: 44, height: 44, borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.two },
  cardIcon: { fontSize: 22 },
  cardText: { flex: 1, gap: 2, paddingVertical: Spacing.two },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2, marginRight: Spacing.one },
  badgeNew: { backgroundColor: Brand.accent + '20' },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeTextNew: { color: Brand.accent },
  chevron: { color: Brand.accent, fontSize: 20, paddingRight: Spacing.two },

  shortcutRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.tactical + '30', borderRadius: 6,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three,
  },
  shortcutIcon: { fontSize: 24, lineHeight: 30 },
  shortcutText: { flex: 1, gap: 2 },
  shortcutTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  shortcutDesc: { fontSize: 12 },

  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Brand.accent + '10', borderWidth: 1,
    borderColor: Brand.accent + '40', borderRadius: 6, padding: Spacing.three,
  },
  promoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Brand.tactical + '10', borderWidth: 1,
    borderColor: Brand.tactical + '40', borderRadius: 6, padding: Spacing.three,
  },
  bannerIcon: { fontSize: 20, lineHeight: 24 },
  bannerTitle: { fontSize: 12, fontWeight: '800', color: Brand.accent, letterSpacing: 0.3 },
  promoBannerTitle: { fontSize: 12, fontWeight: '800', color: Brand.tactical, letterSpacing: 0.3 },
  bannerSub: { fontSize: 10, marginTop: 1 },
});
