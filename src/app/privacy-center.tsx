import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

const PRIVACY_URL = 'https://nanito85.github.io/MilBudgetBuddy/privacy-policy.html';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <ThemedText style={s.sectionTitle}>{title}</ThemedText>
      {children}
    </View>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  const tc = useThemeColors();
  return (
    <View style={[s.row, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
      <ThemedText style={s.rowIcon}>{icon}</ThemedText>
      <View style={s.rowText}>
        <ThemedText style={[s.rowLabel, { color: tc.textPrimary }]}>{label}</ThemedText>
        <ThemedText style={[s.rowValue, { color: tc.textSecondary }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

export default function PrivacyCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();

  return (
    <ThemedView style={s.container}>
      <SafeAreaView edges={['top']}>
        <View style={[s.header, { borderBottomColor: tc.borderColor }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <ThemedText style={s.backText}>‹ Back</ThemedText>
          </Pressable>
          <ThemedText style={[s.title, { color: tc.textPrimary }]}>PRIVACY CENTER</ThemedText>
          <View style={s.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <ThemedText style={s.heroIcon}>🔐</ThemedText>
          <ThemedText style={[s.heroTitle, { color: tc.textPrimary }]}>YOUR DATA STAYS ON YOUR DEVICE</ThemedText>
          <ThemedText style={[s.heroSub, { color: tc.textSecondary }]}>
            MilBudgetBuddy stores all financial data locally on your phone. We do not sell,
            share, or monetize your personal or financial information.
          </ThemedText>
        </View>

        <Section title="WHAT DATA WE COLLECT">
          <Row icon="📱" label="Local Device Storage" value="Profile, budget, expenses, savings goals — stored on your device only via AsyncStorage" />
          <Row icon="☁️" label="Cloud Sync (if signed in)" value="Your data is synced to your personal Firebase account. Only you can access it." />
          <Row icon="🪪" label="Account Info" value="Email address only, if you create an account. Used for sync and account recovery." />
          <Row icon="📊" label="Anonymous Analytics" value="App opens and feature usage — no names, no pay data, no PII. Used to improve the app." />
          <Row icon="❌" label="What We Never Collect" value="Your LES data, actual pay amounts, SSN, bank info, or any sensitive military information." />
        </Section>

        <Section title="HOW YOUR DATA IS PROTECTED">
          <Row icon="🔒" label="Local Encryption" value="AsyncStorage data is protected by your device's built-in encryption and lock screen." />
          <Row icon="🔐" label="Cloud Encryption" value="Firebase encrypts all data in transit (TLS) and at rest (AES-256)." />
          <Row icon="🚫" label="No Third-Party Sale" value="We never sell your data to third parties, advertisers, or data brokers." />
          <Row icon="✅" label="GDPR / CCPA" value="You can request deletion of all data at any time using the Delete Account option." />
        </Section>

        <Section title="YOUR RIGHTS">
          <Row icon="📤" label="Export Your Data" value="All data is stored locally — you can access it directly or use the Financial Readiness Worksheet to export." />
          <Row icon="🗑️" label="Delete Your Data" value="Delete Account (Settings → Account) permanently removes all cloud data. Local data can be cleared via Settings → Reset All Data." />
          <Row icon="👁️" label="Data Transparency" value="You can view all stored data at any time in the app — profile, budget, expenses, goals." />
        </Section>

        <Section title="CHILDREN'S PRIVACY">
          <ThemedText style={[s.bodyText, { color: tc.textSecondary }]}>
            The Kids / Cadet HQ feature stores only a nickname and savings goals for children.
            No PII is collected from minors. Parent controls all child data and can delete it at any time.
            This app is not directed at children under 13.
          </ThemedText>
        </Section>

        <View style={s.linksCard}>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_URL)}
            style={({ pressed }) => [s.linkBtn, pressed && { opacity: 0.7 }]}>
            <ThemedText style={s.linkBtnText}>FULL PRIVACY POLICY ↗</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/terms' as any)}
            style={({ pressed }) => [s.linkBtnSecondary, { borderColor: tc.borderColor }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={[s.linkBtnSecondaryText, { color: tc.textSecondary }]}>TERMS OF SERVICE →</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={[s.contactText, { color: tc.textMuted }]}>
          Questions? Contact us at: privacy@milbudgetbuddy.app
        </ThemedText>

      </ScrollView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },

  hero: {
    alignItems: 'center', gap: Spacing.two,
    backgroundColor: Brand.tactical + '10', borderWidth: 1,
    borderColor: Brand.tactical + '30', borderRadius: 12, padding: Spacing.four,
  },
  heroIcon: { fontSize: 40 },
  heroTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.8, textAlign: 'center' },
  heroSub: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  section: { gap: Spacing.two },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: Brand.accent, letterSpacing: 1 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    borderRadius: 8, padding: Spacing.two + 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { fontSize: 18, width: 28, textAlign: 'center', marginTop: 2 },
  rowText: { flex: 1, gap: 3 },
  rowLabel: { fontSize: 12, fontWeight: '700' },
  rowValue: { fontSize: 11, lineHeight: 16 },
  bodyText: { fontSize: 12, lineHeight: 18 },

  linksCard: { gap: Spacing.two },
  linkBtn: {
    backgroundColor: Brand.tactical, borderRadius: 6,
    padding: Spacing.three, alignItems: 'center',
  },
  linkBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  linkBtnSecondary: {
    borderWidth: 1, borderRadius: 6,
    padding: Spacing.three, alignItems: 'center',
  },
  linkBtnSecondaryText: { fontSize: 13, fontWeight: '700' },
  contactText: { fontSize: 11, textAlign: 'center' },
});
