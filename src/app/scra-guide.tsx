import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

interface Protection {
  id: string;
  icon: string;
  title: string;
  summary: string;
  details: string;
  action: string;
}

const PROTECTIONS: Protection[] = [
  {
    id: 'interest',
    icon: '📉',
    title: '6% Interest Rate Cap',
    summary: 'Pre-service debt interest is capped at 6% APR while on active duty.',
    details:
      'Under 50 USC §3937, any debt incurred before active duty (credit cards, auto loans, student loans, mortgages) is capped at 6% interest per year for the duration of active duty service.\n\n' +
      '• Creditor must forgive interest above 6% — they cannot add it back later.\n' +
      '• Covers all pre-service obligations: personal loans, credit cards, mortgages.\n' +
      '• Does NOT automatically apply — you must notify the lender in writing with a copy of your orders.\n' +
      '• Spouse\'s pre-service debts are also covered if the service member was also a co-obligor.',
    action: 'Send written notice + copy of orders to each lender. You can also use the CFPB Servicemembers Civil Relief Act request letter template at consumerfinance.gov.',
  },
  {
    id: 'mortgage',
    icon: '🏠',
    title: 'Mortgage Foreclosure Protection',
    summary: 'Courts must stay or delay foreclosures during active duty.',
    details:
      'Under 50 USC §3953, a court may stay a foreclosure proceeding or adjust the terms of a mortgage obligation if the service member\'s ability to pay was materially affected by military service.\n\n' +
      '• Applies to mortgages originated before active duty entry.\n' +
      '• Creditor cannot foreclose by court action or power-of-sale without a court order.\n' +
      '• Courts can also reduce monthly payments to reflect 6% cap.\n' +
      '• Protections extend 1 year after release from active duty for primary residence foreclosures.',
    action: 'Contact a JAG attorney or military legal assistance office if facing foreclosure. Do not ignore lender notices — seek help immediately.',
  },
  {
    id: 'eviction',
    icon: '🔑',
    title: 'Eviction Protection',
    summary: 'Landlords cannot evict you or your dependents without a court order while on active duty.',
    details:
      'Under 50 USC §3951, landlords must obtain a court order to evict a service member or their family from rented premises during active duty if monthly rent is at or below the threshold ($10,542.60/month in 2026, adjusted annually by DoD).\n\n' +
      '• Court may stay the eviction for up to 3 months upon service member\'s application.\n' +
      '• Applies to the primary residence of the service member or dependents.\n' +
      '• Does not excuse unpaid rent — it only provides court protection and time.',
    action: 'If receiving an eviction notice, contact the installation legal assistance office immediately. A JAG attorney can file for a stay on your behalf.',
  },
  {
    id: 'lease',
    icon: '🚗',
    title: 'Lease & Auto Contract Termination',
    summary: 'You can terminate residential leases and auto leases upon receiving qualifying orders.',
    details:
      'Under 50 USC §3955 (both residential and motor vehicle leases are covered by this same section):\n\n' +
      'RESIDENTIAL LEASES: You may terminate a lease entered into before or during service if you receive orders for a PCS of 90+ miles, or deployment of 90+ days.\n' +
      '• Termination effective 30 days after next rent payment due date after delivering notice.\n' +
      '• Must provide written notice + copy of orders to the landlord.\n\n' +
      'AUTO LEASES: You may terminate an auto lease if you are called to active duty for 180+ days, or receive PCS orders from CONUS to OCONUS (or OCONUS to a new location).\n' +
      '• Provide written notice + copy of orders to dealer/lender.\n' +
      '• No early termination fee may be charged.',
    action: 'Send certified mail notice + orders to landlord or auto lender. Keep the return receipt as proof. No fee should be charged for qualifying lease terminations.',
  },
  {
    id: 'credit',
    icon: '📊',
    title: 'Credit & Default Protections',
    summary: 'Creditors cannot take adverse action solely due to SCRA-reduced payments.',
    details:
      'Under 50 USC §3938, a creditor may not:\n' +
      '• Accelerate a debt, terminate a contract, or repossess property solely because of your SCRA-reduced interest rate.\n' +
      '• Report a default to a credit bureau if the default was caused by a court-ordered reduction.\n\n' +
      'ACTIVE DUTY ALERT: You can place a free 1-year active duty alert on your credit report (all 3 bureaus). This requires creditors to verify your identity before issuing new credit.\n\n' +
      'FREE CREDIT FREEZE: Active duty members may freeze their credit reports at no cost with Equifax, Experian, and TransUnion for the duration of deployment.',
    action: 'Place an active duty alert by calling any one of the three major bureaus — they must notify the others. Visit AnnualCreditReport.com for free reports.',
  },
  {
    id: 'taxes',
    icon: '🗓️',
    title: 'Tax Filing Deadline Extensions',
    summary: 'Combat zone and OCONUS service can extend IRS and state filing deadlines.',
    details:
      'Under 26 USC §7508 and DoD Instruction 7000.14-R:\n\n' +
      '• Service in a Combat Zone (CZ) or Qualified Hazardous Duty Area (QHDA) extends all IRS deadlines (filing, payment, audits) by the period of service + 180 days.\n' +
      '• Hospitalization due to combat zone injury also extends deadlines.\n' +
      '• Most states mirror the federal extension for active duty military.\n' +
      '• No interest or penalty accrues during the extension period.',
    action: 'Notify your tax preparer of any CZ/QHDA service. Write "COMBAT ZONE" or the specific zone name on the top of paper returns. Use MilTax (Military OneSource) for free filing.',
  },
  {
    id: 'storage',
    icon: '🔒',
    title: 'Storage Lien Protection',
    summary: 'Storage facilities cannot sell your belongings without a court order while you are on active duty.',
    details:
      'Under 50 USC §3958, a storage facility that has a lien on your property:\n\n' +
      '• Cannot enforce that lien (sell or auction property) during active duty without first obtaining a court order.\n' +
      '• Court may stay enforcement for up to 3 months.\n' +
      '• Applies to motor vehicles, household goods, or other stored property.',
    action: 'If a storage company threatens to auction your property, contact legal assistance immediately. Provide proof of active duty status to the facility and the court if needed.',
  },
  {
    id: 'default',
    icon: '⚖️',
    title: 'Default Judgment Protection',
    summary: 'Courts must appoint an attorney and delay civil cases if you cannot appear due to military service.',
    details:
      'Under 50 USC §3931:\n\n' +
      '• In any civil court case where the defendant is a service member and may be unable to appear due to military service, the court must appoint a military attorney to represent them.\n' +
      '• The court must also grant at least a 90-day stay of proceedings upon application.\n' +
      '• This prevents default judgments against service members who are deployed or otherwise unavailable.',
    action: 'If you receive notice of a civil lawsuit while deployed or on active duty, immediately contact a JAG attorney. They can file for a stay on your behalf at no cost.',
  },
];

function ProtectionCard({ item }: { item: Protection }) {
  const tc = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable
      onPress={() => setExpanded((v) => !v)}
      style={({ pressed }) => [styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardIcon}>{item.icon}</ThemedText>
        <View style={styles.cardMeta}>
          <ThemedText style={[styles.cardTitle, { color: tc.textPrimary }]}>{item.title.toUpperCase()}</ThemedText>
          <ThemedText style={[styles.cardSummary, { color: tc.textHint }]}>{item.summary}</ThemedText>
        </View>
        <ThemedText style={styles.chevron}>{expanded ? '∧' : '∨'}</ThemedText>
      </View>
      {expanded && (
        <View style={styles.cardBody}>
          <View style={[styles.divider, { backgroundColor: tc.borderColor }]} />
          <ThemedText style={[styles.details, { color: tc.textSecondary }]}>{item.details}</ThemedText>
          <View style={styles.actionBox}>
            <ThemedText style={styles.actionLabel}>⚡ WHAT TO DO</ThemedText>
            <ThemedText style={[styles.actionText, { color: tc.textPrimary }]}>{item.action}</ThemedText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function ScraGuideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  return (
    <ThemedView style={{ flex: 1 }}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => (router.back())}
          style={styles.back}>
          <ThemedText style={styles.backChevron}>‹</ThemedText>
        </Pressable>
        <ThemedText style={styles.title}>SCRA Guide</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <ThemedView type="backgroundElement" style={styles.heroBanner}>
          <ThemedText style={styles.heroEyebrow}>SERVICEMEMBERS CIVIL RELIEF ACT</ThemedText>
          <ThemedText style={[styles.heroTitle, { color: tc.textPrimary }]}>Know Your Rights</ThemedText>
          <ThemedText style={[styles.heroBody, { color: tc.textHint }]}>
            The SCRA (50 USC Chapter 50) provides automatic legal and financial protections the moment you go on active duty. These rights do not apply automatically — you must assert them.
          </ThemedText>
        </ThemedView>

        <View style={styles.sectionLabelRow}>
          <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
          <ThemedText style={[styles.sectionLabel, { color: tc.textMuted }]}>PROTECTIONS — TAP TO EXPAND</ThemedText>
          <View style={[styles.sectionLine, { backgroundColor: tc.borderColor }]} />
        </View>

        {PROTECTIONS.map((p) => (
          <ProtectionCard key={p.id} item={p} />
        ))}

        <ThemedView type="backgroundElement" style={styles.disclaimer}>
          <ThemedText style={styles.disclaimerTitle}>⚠ Important Notice</ThemedText>
          <ThemedText style={[styles.disclaimerText, { color: tc.textHint }]}>
            This guide is for general information only and is not legal advice. Specific protections depend on individual circumstances, the type of debt, and state law. Always consult a JAG attorney or your installation's legal assistance office for your specific situation. JAG legal assistance is FREE for active duty service members and their families.
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.resourceBox}>
          <ThemedText style={[styles.resourceTitle, { color: tc.textPrimary }]}>📞 Free Resources</ThemedText>
          <ThemedText style={[styles.resourceItem, { color: tc.textHint }]}>• JAG / Legal Assistance Office — installation-based, free</ThemedText>
          <ThemedText style={[styles.resourceItem, { color: tc.textHint }]}>• Military OneSource — 800-342-9647 (24/7)</ThemedText>
          <ThemedText style={[styles.resourceItem, { color: tc.textHint }]}>• CFPB Servicemember Affairs — consumerfinance.gov/servicemembers</ThemedText>
          <ThemedText style={[styles.resourceItem, { color: tc.textHint }]}>• DoD SCRA portal — scra.dmdc.osd.mil (verify status for lenders)</ThemedText>
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

  content: { paddingHorizontal: Spacing.three, gap: Spacing.two, paddingTop: Spacing.one },

  heroBanner: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.tactical,
    gap: 4,
    marginBottom: Spacing.one,
  },
  heroEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Brand.tactical },
  heroTitle: { fontSize: 22, fontWeight: '900' },
  heroBody: { fontSize: 12, lineHeight: 18, marginTop: 4 },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionLine: { flex: 1, height: 1 },
  sectionLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },

  card: {
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  cardMeta: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  cardSummary: { fontSize: 11, lineHeight: 16 },
  chevron: { fontSize: 14, color: Brand.tactical, width: 16, textAlign: 'center' },

  cardBody: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, gap: Spacing.two },
  divider: { height: 1 },
  details: { fontSize: 12, lineHeight: 19 },
  actionBox: {
    backgroundColor: Brand.tactical + '15',
    borderRadius: 4,
    padding: Spacing.two,
    gap: 4,
    borderLeftWidth: 2,
    borderLeftColor: Brand.tactical,
  },
  actionLabel: { fontSize: 9, fontWeight: '800', color: Brand.tactical, letterSpacing: 1 },
  actionText: { fontSize: 12, lineHeight: 18 },

  disclaimer: {
    borderRadius: 4,
    padding: Spacing.three,
    borderLeftWidth: 3,
    borderLeftColor: Brand.warning,
    gap: 6,
    marginTop: Spacing.two,
  },
  disclaimerTitle: { fontSize: 12, fontWeight: '700', color: Brand.warning },
  disclaimerText: { fontSize: 11, lineHeight: 17 },

  resourceBox: {
    borderRadius: 4,
    padding: Spacing.three,
    gap: 6,
  },
  resourceTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  resourceItem: { fontSize: 11, lineHeight: 17 },
});
