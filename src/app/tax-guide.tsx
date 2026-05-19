import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';

interface TaxSection {
  id: string;
  icon: string;
  title: string;
  summary: string;
  body: string;
  tip?: string;
}

const SECTIONS: TaxSection[] = [
  {
    id: 'czte',
    icon: '🪖',
    title: 'Combat Zone Tax Exclusion (CZTE)',
    summary: 'Basic pay earned while serving in a designated combat zone is fully excluded from federal income tax.',
    body:
      'Enlisted members and warrant officers: 100% of basic pay earned in a CZ month is excluded. Officers: capped at the highest enlisted pay plus special pays (e.g., hostile fire pay).\n\n' +
      'A month counts if you serve even one day in the combat zone. Hospitalization from CZ wounds also qualifies.\n\n' +
      'CURRENT DESIGNATED COMBAT ZONES (examples):\n' +
      '• Arabian Peninsula (Afghanistan, Kuwait, Oman, Qatar, Bahrain, UAE, Jordan, Djibouti, Yemen)\n' +
      '• Sinai Peninsula\n' +
      '• Kosovo area (Operation Joint Guard/Noble Eagle overlap)\n\n' +
      'TAX-FREE PAYS DURING CZ SERVICE:\n' +
      '• Basic pay (enlisted: 100% | officers: capped)\n' +
      '• SRB / reenlistment bonuses earned during CZ month\n' +
      '• Imminent Danger / Hostile Fire Pay ($225/mo)\n' +
      '• TSP contributions: can contribute to Roth TSP from tax-free combat pay — powerful because the gains come out tax-free too',
    tip: 'If you contribute to Roth TSP from combat zone pay, those contributions AND their earnings are never taxed. Maximize Roth TSP contributions in CZ months.',
  },
  {
    id: 'state',
    icon: '🏛️',
    title: 'State Income Tax Exemptions',
    summary: 'Nine states exempt all military pay. Others exempt partial amounts or have no income tax at all.',
    body:
      'STATES WITH NO INCOME TAX (all residents benefit):\n' +
      'Alaska, Florida, Nevada, New Hampshire (wages only), South Dakota, Tennessee (wages only), Texas, Washington, Wyoming\n\n' +
      'STATES THAT FULLY EXEMPT ACTIVE DUTY MILITARY PAY:\n' +
      'Arkansas, Hawaii, Illinois, Iowa, Kansas, Louisiana, Michigan, Minnesota, Missouri, Montana, New Jersey, New Mexico, New York, Ohio, Oregon, Pennsylvania, Rhode Island, South Carolina, Utah, Vermont, Wisconsin\n\n' +
      'STATES WITH PARTIAL EXEMPTIONS OR CONDITIONS:\n' +
      '• California: no exemption for active duty pay\n' +
      '• Virginia: exempts active duty if domicile is VA\n' +
      '• Georgia, North Carolina: partial exemptions, verify current law\n\n' +
      'SCRA HOME STATE RULE:\n' +
      'Under SCRA §4001, you can maintain your state of domicile (home of record) for tax purposes regardless of where you are stationed. If your home state has no income tax, you can file there even while stationed in a high-tax state.',
    tip: 'Your state of domicile is where you intend to return after the military — not necessarily where you are stationed. Choosing a no-income-tax state as your domicile (if legitimate) can save thousands per year.',
  },
  {
    id: 'miltax',
    icon: '💻',
    title: 'MilTax — Free Federal and State Filing',
    summary: 'MilTax is the Department of Defense\'s free tax preparation and filing software, available to all active duty and most reserve members.',
    body:
      'MilTax is provided by Military OneSource and uses H&R Block tax software at no cost.\n\n' +
      'WHO CAN USE IT:\n' +
      '• Active duty service members\n' +
      '• National Guard and Reserve members called to active duty\n' +
      '• Retired military (within 365 days of separation)\n' +
      '• Eligible family members\n\n' +
      'WHAT IT COVERS:\n' +
      '• Federal returns: all major forms (1040, Schedule A, D, etc.)\n' +
      '• State returns: up to three state returns at no cost\n' +
      '• Military-specific fields: combat pay exclusion, SGLI, BAH, BAS\n' +
      '• E-filing included\n\n' +
      'OTHER FREE OPTIONS:\n' +
      '• VITA (Volunteer Income Tax Assistance): in-person help on base, free\n' +
      '• IRS Free File: if income under $73,000\n' +
      '• JAG / Legal Assistance: can review returns and advise',
    tip: 'Use MilTax if you have combat zone income, SGLI, or multiple state filings — standard commercial software often mishandles these military-specific items.',
  },
  {
    id: 'moving',
    icon: '🚚',
    title: 'PCS Move Deductions and Exclusions',
    summary: 'Service members can deduct unreimbursed PCS moving expenses. Government-paid moves are excluded from income.',
    body:
      'WHAT\'S EXCLUDED FROM INCOME:\n' +
      '• Government-funded HHG shipment: not taxable income\n' +
      '• DPS/GTC travel reimbursements for PCS: not taxable\n' +
      '• Advance Pay (MIHA/MIAP): not income\n\n' +
      'TAX BREAK FOR CIVILIAN SPOUSES:\n' +
      'Under the Military Spouses Residency Relief Act (MSRRA), a military spouse can maintain their state of domicile even when accompanying the service member to a new duty station. This means no state income tax in the new state if they maintain their original state domicile.\n\n' +
      'DITY/PPM MOVE TAX TREATMENT:\n' +
      '• PPM incentive pay (the government payment for a personally procured move) IS taxable income.\n' +
      '• However, actual moving costs that exceed the incentive are deductible on Form 3903.\n' +
      '• Keep all receipts: fuel, rental trucks, packing materials.\n\n' +
      'FORM 3903:\n' +
      'Armed Forces members can still deduct unreimbursed qualified moving expenses on Form 3903. This is an above-the-line deduction (reduces AGI).',
    tip: 'Track all out-of-pocket PCS expenses with receipts. Anything not reimbursed by the government may be deductible on Form 3903.',
  },
  {
    id: 'bah_bas',
    icon: '🏠',
    title: 'BAH and BAS Are Tax-Free',
    summary: 'Basic Allowance for Housing and Basic Allowance for Subsistence are not subject to federal or state income tax.',
    body:
      'WHAT\'S NOT TAXED:\n' +
      '• BAH (all types: with/without dependents, partial, OHA)\n' +
      '• BAS (both enlisted and officer rates)\n' +
      '• COLA (Cost of Living Allowance) — Alaska, Hawaii, OCONUS\n' +
      '• Clothing allowance\n' +
      '• Family separation allowance (FSA)\n' +
      '• Hostile Fire / Imminent Danger Pay\n\n' +
      'WHAT IS TAXABLE:\n' +
      '• Basic pay\n' +
      '• Special pays (flight pay, sub pay, jump pay, ACIP, etc.)\n' +
      '• Reenlistment bonuses / SRB (unless earned in a CZ month)\n' +
      '• PPM/DITY incentive pay\n\n' +
      'WHY THIS MATTERS FOR FILING:\n' +
      'Your W-2 (DFAS) shows only taxable wages in Box 1. BAH and BAS are excluded. This is why military members\' W-2 Box 1 is often much lower than their total compensation.',
    tip: 'When applying for a mortgage or other loan, use your total compensation (basic pay + BAH + BAS + special pays) for qualification — lenders familiar with VA loans understand this.',
  },
  {
    id: 'sgli',
    icon: '🛡️',
    title: 'SGLI / VGLI Tax Treatment',
    summary: 'SGLI premiums are paid with pre-tax dollars. Death benefits are generally tax-free to beneficiaries.',
    body:
      'SGLI PREMIUMS:\n' +
      '• Deducted pre-tax from basic pay — reduces your taxable income.\n' +
      '• Shown on your LES but NOT added back to taxable wages on W-2.\n\n' +
      'SGLI DEATH BENEFIT:\n' +
      '• Up to $400,000 paid to beneficiaries.\n' +
      '• Generally not subject to federal income tax (IRC §101).\n' +
      '• Interest earned on the benefit after death is taxable.\n\n' +
      'VGLI (after separation):\n' +
      '• Premiums are NOT pre-tax — paid with after-tax dollars.\n' +
      '• Death benefit still tax-free to beneficiaries.\n\n' +
      'TRAUMATIC SGLI (TSGLI):\n' +
      '• Payments for qualifying traumatic injuries are also excluded from gross income.',
    tip: 'Name beneficiaries carefully — SGLI proceeds pass outside your estate and are not controlled by your will. Update beneficiaries after marriage, divorce, or birth of a child.',
  },
  {
    id: 'extensions',
    icon: '📅',
    title: 'Tax Filing Extensions for Combat Zone',
    summary: 'Deployment to a combat zone automatically extends your IRS filing and payment deadlines.',
    body:
      'AUTOMATIC EXTENSION (IRC §7508):\n' +
      '• All IRS deadlines (filing, payment, audits, collection) are extended by the number of days in the combat zone PLUS 180 days.\n' +
      '• No form required — the extension is automatic.\n' +
      '• Applies to the service member AND their spouse (if filing jointly).\n' +
      '• No interest or penalty during the extension period.\n\n' +
      'EXAMPLE:\n' +
      'Deployed Jan 1 – Sep 30 (273 days in CZ). Extension = 273 + 180 = 453 days from April 15 deadline.\n\n' +
      'HOSPITALIZATION EXTENSION:\n' +
      'If hospitalized as a result of CZ service, the extension continues through the hospitalization period (up to 5 years for continuous hospitalization).\n\n' +
      'STATE EXTENSIONS:\n' +
      'Most states mirror the federal CZ extension — check with your state tax agency or JAG.',
    tip: 'Even with an extension, consider filing as soon as you return — if you\'re owed a refund, you won\'t receive it until you file. Extensions only apply to the deadline, not the refund.',
  },
  {
    id: 'tsp_tax',
    icon: '📊',
    title: 'TSP Tax Strategy',
    summary: 'Traditional TSP reduces taxable income now. Roth TSP grows tax-free. Combat zone Roth contributions are especially powerful.',
    body:
      'TRADITIONAL TSP:\n' +
      '• Contributions reduce your current taxable income (pre-tax).\n' +
      '• Withdrawals in retirement are taxed as ordinary income.\n' +
      '• Good when you expect to be in a lower tax bracket in retirement.\n\n' +
      'ROTH TSP:\n' +
      '• Contributions are after-tax — no upfront tax break.\n' +
      '• Qualified withdrawals in retirement are completely tax-free.\n' +
      '• Good for junior enlisted (low tax bracket now) and combat zone deployments.\n\n' +
      'COMBAT ZONE ROTH STRATEGY:\n' +
      'When contributing to Roth TSP from combat zone tax-excluded pay:\n' +
      '• The contribution is never taxed (excluded from income).\n' +
      '• The growth and qualified withdrawals are also tax-free.\n' +
      '• Result: truly tax-free money from input to output.\n\n' +
      'FY2026 CONTRIBUTION LIMITS:\n' +
      '• Under 50: $23,500/year\n' +
      '• Age 50–59 & 64+: $31,000/year (+$7,500 catch-up)\n' +
      '• Age 60–63: $34,750/year (+$11,250 super catch-up, SECURE 2.0)',
    tip: 'If deploying to a combat zone: maximize Roth TSP contributions. It\'s the most tax-advantaged investing opportunity available — potentially $23,500 in permanently tax-free growth per deployment.',
  },
];

function SectionCard({ section }: { section: TaxSection }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardIcon}>{section.icon}</ThemedText>
        <View style={styles.cardMeta}>
          <ThemedText style={styles.cardTitle}>{section.title.toUpperCase()}</ThemedText>
          <ThemedText style={styles.cardSummary}>{section.summary}</ThemedText>
        </View>
        <ThemedText style={styles.chevron}>{expanded ? '∧' : '∨'}</ThemedText>
      </View>
      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.divider} />
          <ThemedText style={styles.bodyText}>{section.body}</ThemedText>
          {section.tip && (
            <View style={styles.tipBox}>
              <ThemedText style={styles.tipLabel}>⚡ PRO TIP</ThemedText>
              <ThemedText style={styles.tipText}>{section.tip}</ThemedText>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function TaxGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.push('/'))}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>Military Tax Guide</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>FY2026 MILITARY TAX REFERENCE</ThemedText>
          <ThemedText style={styles.heroTitle}>Tax-Free. Tax-Deferred. Tax-Smart.</ThemedText>
          <ThemedText style={styles.heroBody}>
            Military compensation has more tax advantages than almost any other profession. Understanding them is worth thousands of dollars a year.
          </ThemedText>
        </ThemedView>

        <View style={styles.sectionRow}>
          <View style={styles.sectionLine} />
          <ThemedText style={styles.sectionLabel}>TAP TO EXPAND</ThemedText>
          <View style={styles.sectionLine} />
        </View>

        {SECTIONS.map((s) => <SectionCard key={s.id} section={s} />)}

        <ThemedView type="backgroundElement" style={styles.resourceBox}>
          <ThemedText style={styles.resourceTitle}>📞 Free Tax Help</ThemedText>
          <ThemedText style={styles.resourceItem}>• MilTax (H&R Block): militaryonesource.mil/miltax</ThemedText>
          <ThemedText style={styles.resourceItem}>• VITA on-base: search "VITA site" on IRS.gov</ThemedText>
          <ThemedText style={styles.resourceItem}>• JAG / Legal Assistance: installation legal office</ThemedText>
          <ThemedText style={styles.resourceItem}>• IRS military page: irs.gov/military</ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerTitle}>⚠ Not Tax Advice</ThemedText>
          <ThemedText style={styles.disclaimerText}>
            This guide is for general informational purposes only. Tax laws change annually. Your situation may differ based on state of domicile, filing status, and other factors. For specific guidance, use MilTax, consult VITA, or see a JAG legal assistance officer.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.three, paddingBottom: Spacing.two,
  },
  back: { width: 40, justifyContent: 'center' },
  backChevron: { fontSize: 28, fontWeight: '300', color: Brand.primary },
  title: { fontSize: 18, fontWeight: '700' },

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: { borderRadius: 4, padding: Spacing.three, borderLeftWidth: 3, borderLeftColor: Brand.accent, gap: 4 },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.accent },
  heroTitle: { fontSize: 20, fontWeight: '900', color: '#C8D8E8' },
  heroBody: { fontSize: 12, lineHeight: 18, color: '#4D7A9A', marginTop: 4 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: 1, backgroundColor: Brand.border },
  sectionLabel: { fontSize: 8, fontWeight: '700', color: '#3D6080', letterSpacing: 0.8 },

  card: { backgroundColor: '#080E1C', borderWidth: 1, borderColor: Brand.border, borderRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: Spacing.three, gap: Spacing.two },
  cardIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  cardMeta: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#C8D8E8', letterSpacing: 0.5 },
  cardSummary: { fontSize: 11, color: '#4D7A9A', lineHeight: 16 },
  chevron: { fontSize: 14, color: Brand.tactical, width: 16, textAlign: 'center' },

  cardBody: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two },
  divider: { height: 1, backgroundColor: Brand.border },
  bodyText: { fontSize: 12, lineHeight: 19, color: '#8AA8C0' },
  tipBox: { backgroundColor: Brand.accent + '15', borderRadius: 4, padding: Spacing.two, gap: 4, borderLeftWidth: 2, borderLeftColor: Brand.accent },
  tipLabel: { fontSize: 9, fontWeight: '800', color: Brand.accent, letterSpacing: 1 },
  tipText: { fontSize: 12, lineHeight: 18, color: '#C8D8E8' },

  resourceBox: { borderRadius: 4, padding: Spacing.three, gap: 6 },
  resourceTitle: { fontSize: 13, fontWeight: '700', color: '#C8D8E8', marginBottom: 2 },
  resourceItem: { fontSize: 11, lineHeight: 17, color: '#4D7A9A' },

  disclaimer: { borderRadius: 4, padding: Spacing.three, borderLeftWidth: 3, borderLeftColor: Brand.warning, gap: 6 },
  disclaimerTitle: { fontSize: 12, fontWeight: '700', color: Brand.warning },
  disclaimerText: { fontSize: 11, lineHeight: 17, color: '#4D7A9A' },
});
