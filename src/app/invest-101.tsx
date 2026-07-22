import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

interface Topic {
  id: string;
  icon: string;
  title: string;
  bluf: string;
  military: string;
  detail: string;
  actions: string[];
}

const TOPICS: Topic[] = [
  {
    id: 'stocks',
    icon: '📊',
    title: 'What Is a Stock?',
    bluf: 'A stock is a tiny ownership share in a company. When the company grows in value, your share grows with it — and you can sell it for a profit.',
    military: "Think of it like buying a piece of a base exchange franchise. If the franchise earns more money, your piece is worth more. The military's TSP C Fund is essentially a large basket of stocks.",
    detail:
      'When a company like Apple or Amazon needs money to grow, it sells small pieces of ownership called shares (stocks) to the public. Millions of people buy and sell these shares daily on exchanges like the NYSE or NASDAQ. Stock prices rise when more people want to buy than sell, and fall when more people want to sell.\n\nYou can profit two ways: (1) sell the stock for more than you paid, or (2) receive dividends — cash payments companies make to shareholders from their profits.\n\nRisk: Individual stocks can drop 50–90% in value. A company can go bankrupt and your shares become worthless. This is why most financial experts recommend buying many stocks at once through index funds rather than picking individual companies.',
    actions: [
      'Do NOT start with individual stocks. Master index funds first.',
      'If you want stock exposure, the TSP C Fund (S&P 500) is your starting point.',
      'Never invest money you may need within 5 years.',
    ],
  },
  {
    id: 'index_funds',
    icon: '📦',
    title: 'What Is an Index Fund?',
    bluf: 'An index fund automatically buys every stock in a market index (like the S&P 500), giving you instant diversification at near-zero cost. Over 90% of professional fund managers fail to beat index funds long-term.',
    military: 'The TSP C Fund IS an S&P 500 index fund. The I Fund tracks international stocks. The S Fund tracks smaller U.S. companies. You already have access to the best index funds in the world at roughly 0.03-0.06% fees depending on the fund — cheaper than almost any civilian option.',
    detail:
      "An index is a list of companies that meets certain criteria — the S&P 500 includes the 500 largest U.S. public companies. An index fund simply buys all of them at once in proportion to their size.\n\nWhy this is powerful:\n- Instant diversification: one purchase = ownership in 500 companies\n- Near-zero fees: 0.03–0.05% vs 1%+ for managed funds\n- The fee difference on $100,000 over 30 years: ~$100,000 in lost growth\n- Historically returns ~10% annually (7% after inflation)\n\nThe alternative — paying a fund manager to pick stocks — sounds appealing but fails in practice. Over any 15-year period, 90%+ of actively managed funds underperform their benchmark index after fees.\n\nPopular index funds outside TSP: Vanguard VTSAX/VTI, Fidelity FZROX, Schwab SWTSX.",
    actions: [
      'In TSP: allocate to C Fund (S&P 500), S Fund (small cap), and I Fund (international) — or just use the L Fund for your retirement year.',
      'Outside TSP: open a Roth IRA at Fidelity, Vanguard, or Schwab and buy a total market index fund.',
      'Set contributions to auto-invest monthly and never look at the balance during downturns.',
    ],
  },
  {
    id: 'etf',
    icon: '🗂️',
    title: 'ETF vs. Mutual Fund',
    bluf: 'An ETF (Exchange-Traded Fund) is an index fund you buy like a stock — in real time throughout the day. A mutual fund only prices once per day. For most investors, the difference is minor. Both are excellent for long-term wealth building.',
    military: 'TSP uses mutual fund-style pricing (once per day). If you invest outside TSP in a brokerage account, you\'ll typically buy ETFs (like VTI or VOO) which are slightly more tax-efficient and flexible.',
    detail:
      'ETFs and index mutual funds hold the same underlying assets (stocks/bonds) but trade differently:\n\nMutual funds: priced once at market close. You buy/sell at end-of-day price. No commission in most cases at major brokerages.\n\nETFs: priced and traded continuously during market hours like a stock. Typically slightly lower expense ratios. More tax-efficient in taxable accounts.\n\nFor a Roth IRA or 401(k)/TSP, the distinction barely matters — both compound tax-free. For a regular taxable brokerage account, ETFs are slightly more tax-efficient.\n\nPopular ETFs: VTI (total U.S. market), VOO (S&P 500), VXUS (international), BND (bonds).',
    actions: [
      'Inside TSP or Roth IRA: mutual fund vs ETF distinction does not matter.',
      'If opening a taxable brokerage account, prefer ETFs for tax efficiency.',
      "Start with a single total market fund (VTI or FZROX) rather than trying to mix and match.",
    ],
  },
  {
    id: 'compound',
    icon: '⚡',
    title: 'Compound Interest',
    bluf: 'Compound interest means earning returns on your previous returns. A dollar invested at 18 is worth dramatically more at retirement than a dollar invested at 28. Starting early — even with small amounts — is the single most powerful financial move available to a junior enlisted member.',
    military: 'An E-2 who contributes just $100/month to TSP at age 18 will have ~$306,000 at age 60 (assuming 7% real return). The same $100/month starting at age 28 yields ~$144,000. The 10-year head start is worth over $160,000 — without contributing a single extra dollar.',
    detail:
      'Compound interest is interest on interest.\n\nSimple interest: $1,000 at 7% = $70/year, every year.\nCompound interest: Year 1: $1,070. Year 2: $1,070 × 7% = $74.90 gain. Year 3: $1,144.90 × 7% = $80.14 gain.\n\nThe gains grow every year because the base grows every year. Over decades this creates exponential — not linear — growth.\n\n$10,000 at 7% annual return:\n- 10 years: $19,672\n- 20 years: $38,697\n- 30 years: $76,123\n- 40 years: $149,745\n\nThe math does not require you to be rich. It requires time and consistency. Two rules:\n1. Start as early as possible (even $50/month matters at 18).\n2. Never interrupt it — every year you miss is permanently expensive.',
    actions: [
      "Open a Roth IRA today if you haven't — even $50/month makes a meaningful difference over a 20-year career.",
      'Increase TSP contributions by 1% every time you receive a pay raise.',
      'Treat investment contributions like a bill — non-negotiable, automated on payday.',
    ],
  },
  {
    id: 'sp500',
    icon: '🇺🇸',
    title: 'The S&P 500',
    bluf: 'The S&P 500 is an index of the 500 largest U.S. public companies. It has returned an average of ~10% per year since 1957. Every major market crash in history has fully recovered and gone on to new highs.',
    military: 'The TSP C Fund tracks the S&P 500. If you invest in nothing else, the C Fund alone — consistently contributed to throughout a military career — will build significant retirement wealth.',
    detail:
      "The S&P 500 (Standard & Poor's 500) is maintained by S&P Global and includes companies like Apple, Microsoft, Amazon, Google, Berkshire Hathaway, and 496 others. The index is weighted by market capitalization — bigger companies make up a larger percentage.\n\nHistorical performance:\n- Average annual return (1957–2024): ~10.5% nominal, ~7.5% after inflation\n- Worst single year: -38.5% (2008)\n- Worst decade: flat (2000–2009 'lost decade')\n- Every 20-year period in history has been profitable\n\nMarket corrections (10%+ drops) happen every ~2 years. Bear markets (20%+ drops) happen every ~3–5 years. Both are normal and temporary. Panic-selling during a correction locks in losses and misses the recovery.\n\nThe only strategy that reliably captures S&P 500 returns: buy consistently, hold long-term, never sell during downturns.",
    actions: [
      'In TSP: invest in C Fund. It mirrors the S&P 500 at roughly a 0.035% expense ratio.',
      'Outside TSP: VOO (Vanguard S&P 500 ETF) or FXAIX (Fidelity) are excellent options.',
      "Do not try to time the market — 'time in market' beats 'timing the market' every decade.",
    ],
  },
  {
    id: 'start',
    icon: '🚀',
    title: 'How to Start on Junior Enlisted Pay',
    bluf: "You don't need much money to start building wealth. The order of operations matters more than the amount. Follow these steps in order and you will be ahead of 90% of Americans by the time you make E-5.",
    military: 'Military members have unique advantages: no state income tax in many states, tax-free deployment pay, the best retirement account in the country (TSP with fees around 0.03-0.06%), and TRICARE eliminating healthcare costs. These advantages compound just like investments.',
    detail:
      'Order of Operations for a Junior Enlisted Member:\n\n1. Emergency fund: $1,000 minimum in a savings account. This prevents you from going into credit card debt when something breaks.\n\n2. TSP: Contribute at least 5% if in BRS to capture the full government match. This is an instant 100% return on that money.\n\n3. High-Interest Debt: Pay off any credit cards above 10% APR. This guaranteed return beats any investment.\n\n4. Roth IRA: Open one at Fidelity (no minimum). Contribute up to $7,500/year. Invest in FZROX (total market index, 0% expense ratio).\n\n5. Increase TSP: After maxing Roth IRA, increase TSP contributions. Max is $24,500/year for FY2026.\n\n6. Taxable brokerage: After maxing both, open a taxable account and invest in index ETFs.\n\nOn E-3 pay (~$2,200/month), a realistic goal is:\n- $50–100/month into TSP (gets $50–100 government match in BRS)\n- $50/month into Roth IRA\n- Total: ~$100–200/month invested\n\nAt 7% real return over 20 years: $150/month = ~$78,000. At 30 years: $151,000.',
    actions: [
      "If in BRS and contributing less than 5% to TSP, fix this first — the match is free money you're leaving behind.",
      'Open a Roth IRA at Fidelity (fidelity.com). No minimum, no fees, best zero-cost index funds.',
      'Automate contributions to both TSP and Roth IRA on payday so they never touch your checking account.',
    ],
  },
];

function TopicCard({ topic }: { topic: Topic }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <ThemedText style={styles.cardIcon}>{topic.icon}</ThemedText>
        </View>
        <View style={styles.cardTitleBlock}>
          <ThemedText style={styles.cardTitle}>{topic.title}</ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.chevron}>
          {expanded ? '▾' : '▸'}
        </ThemedText>
      </Pressable>

      {/* BLUF — always visible */}
      <View style={styles.blufBlock}>
        <View style={styles.blufLabel}>
          <ThemedText style={styles.blufTag}>BLUF</ThemedText>
        </View>
        <ThemedText type="small" style={styles.blufText}>
          {topic.bluf}
        </ThemedText>
      </View>

      {expanded && (
        <>
          <View style={styles.divider} />

          {/* Military angle */}
          <View style={styles.militaryBlock}>
            <ThemedText style={styles.militaryTag}>🪖 Military Angle</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bodyText}>
              {topic.military}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Deep dive */}
          <View style={styles.detailBlock}>
            <ThemedText style={styles.sectionLabel}>Deep Dive</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.bodyText}>
              {topic.detail}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          {/* Action items */}
          <View style={styles.actionsBlock}>
            <ThemedText style={styles.sectionLabel}>Action Items</ThemedText>
            {topic.actions.map((a, i) => (
              <View key={i} style={styles.actionRow}>
                <ThemedText style={styles.actionNum}>{i + 1}</ThemedText>
                <ThemedText type="small" style={styles.actionText}>
                  {a}
                </ThemedText>
              </View>
            ))}
          </View>
        </>
      )}
    </ThemedView>
  );
}

export default function Invest101Screen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ThemedText style={styles.backText}>← Back</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
          EDUCATION
        </ThemedText>
        <ThemedText style={styles.title}>Investment 101</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Each topic opens with a BLUF — then tap to expand the full explanation and action items.
        </ThemedText>

        <View style={styles.list}>
          {TOPICS.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
          This content is for educational purposes only and does not constitute financial advice.
          Rates and limits reflect FY2026 figures. Consult a CFP for personalized guidance.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  backText: { color: Brand.primaryLight, fontWeight: '600', fontSize: 15, lineHeight: 21 },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  eyebrow: { letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  subtitle: { lineHeight: 20 },
  list: { gap: Spacing.two },
  card: { borderRadius: Spacing.three, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Spacing.two,
    backgroundColor: `${Brand.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { fontSize: 18 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  chevron: { fontSize: 16, fontWeight: '600' },
  blufBlock: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: `${Brand.primary}10`,
    borderRadius: Spacing.two,
    padding: Spacing.two + 2,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  blufLabel: {
    backgroundColor: Brand.primary,
    borderRadius: 4,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    flexShrink: 0,
  },
  blufTag: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  blufText: { flex: 1, lineHeight: 20, fontWeight: '500' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.15)',
    marginHorizontal: Spacing.three,
    marginVertical: Spacing.two,
  },
  militaryBlock: { paddingHorizontal: Spacing.three, gap: Spacing.one },
  militaryTag: { fontSize: 13, fontWeight: '700' },
  detailBlock: { paddingHorizontal: Spacing.three, gap: Spacing.two },
  actionsBlock: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two },
  sectionLabel: { fontSize: 13, fontWeight: '700' },
  bodyText: { lineHeight: 22 },
  actionRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'flex-start' },
  actionNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.primary,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
    flexShrink: 0,
  },
  actionText: { flex: 1, lineHeight: 20 },
  disclaimer: { textAlign: 'center', lineHeight: 18, fontSize: 11 },
});
