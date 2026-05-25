import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';

const SUPPORT_EMAIL = 'support@milbudgetbuddy.com';
const PRIVACY_URL = 'https://milbudgetbuddy.com/privacy';
const TERMS_URL = 'https://milbudgetbuddy.com/terms';

type Section = 'privacy' | 'terms' | null;

export default function LegalScreen() {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Section>(null);
  const { user } = useAuthStore();
  const resetAll = useUserStore((s) => s.resetAll);

  const toggle = (section: Section) =>
    setExpanded((prev) => (prev === section ? null : section));

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              `Send a deletion request to ${SUPPORT_EMAIL}? We will process it within 30 days per our Privacy Policy.`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Request',
                  onPress: () => {
                    const subject = encodeURIComponent('Account Deletion Request');
                    const body = encodeURIComponent(
                      `Please delete my account.\n\nUID: ${user?.uid ?? 'N/A'}\nEmail: ${user?.email ?? 'N/A'}`,
                    );
                    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const handleContact = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('MilBudgetBuddy Support')}`);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>

          <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
          <ThemedText style={styles.pageTitle}>LEGAL & PRIVACY</ThemedText>

          {/* Privacy Policy */}
          <View style={styles.section}>
            <Pressable style={styles.sectionHeader} onPress={() => toggle('privacy')}>
              <ThemedText style={styles.sectionTitle}>Privacy Policy</ThemedText>
              <ThemedText style={styles.chevron}>{expanded === 'privacy' ? '▲' : '▼'}</ThemedText>
            </Pressable>
            {expanded === 'privacy' && (
              <View style={styles.sectionBody}>
                <ThemedText style={styles.bodyText}>
                  MilBudgetBuddy collects only information you provide directly — pay grade, location (ZIP code), and family
                  size — to calculate military pay entitlements. This data is stored locally on your device and optionally
                  synced to your Firebase account if you sign in.
                </ThemedText>
                <ThemedText style={styles.bodyText}>
                  We do not sell your data. Anonymous usage analytics (screen views, feature usage counts) may be collected
                  to improve the app. No personally identifiable financial data is sent to our servers.
                </ThemedText>
                <ThemedText style={styles.bodyText}>
                  Firebase Authentication is used for optional account sign-in. Google's privacy policy applies to that
                  service. In-app purchase receipts are verified server-side through Google Play; we do not store payment
                  details.
                </ThemedText>
                <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.linkBtn}>
                  <ThemedText style={styles.linkText}>View Full Privacy Policy →</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Terms of Service */}
          <View style={styles.section}>
            <Pressable style={styles.sectionHeader} onPress={() => toggle('terms')}>
              <ThemedText style={styles.sectionTitle}>Terms of Service</ThemedText>
              <ThemedText style={styles.chevron}>{expanded === 'terms' ? '▲' : '▼'}</ThemedText>
            </Pressable>
            {expanded === 'terms' && (
              <View style={styles.sectionBody}>
                <ThemedText style={styles.bodyText}>
                  MilBudgetBuddy provides military pay estimates and financial planning tools for informational purposes only.
                  All calculations are based on publicly available DoD pay tables and are not guaranteed to be accurate for
                  your specific situation.
                </ThemedText>
                <ThemedText style={styles.bodyText}>
                  This app is not affiliated with, endorsed by, or operated by the Department of Defense or any branch of
                  the United States Armed Forces. Always verify your pay and entitlements with your finance office or
                  official myPay account.
                </ThemedText>
                <ThemedText style={styles.bodyText}>
                  Pro upgrade is a one-time, non-refundable purchase unless required by applicable law. Purchases are
                  processed through Google Play.
                </ThemedText>
                <ThemedText style={styles.bodyText}>
                  Subscription disclosure: This app offers a one-time lifetime purchase for {'“'}Pro\{'”'} access. There is no
                  auto-renewing subscription. No charges will recur after your single purchase.
                </ThemedText>
                <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={styles.linkBtn}>
                  <ThemedText style={styles.linkText}>View Full Terms of Service →</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Support */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Support</ThemedText>
            <ThemedText style={styles.supportBody}>
              For help, feedback, or questions, contact us at:
            </ThemedText>
            <Pressable onPress={handleContact} style={styles.contactRow}>
              <ThemedText style={styles.contactEmail}>{SUPPORT_EMAIL}</ThemedText>
            </Pressable>
          </View>

          {/* Account Deletion */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Data & Account Deletion</ThemedText>
            <ThemedText style={styles.supportBody}>
              You may request deletion of your account and all associated data at any time. We will process deletion
              requests within 30 days.
            </ThemedText>
            <Pressable onPress={handleDeleteAccount} style={styles.deleteBtn}>
              <ThemedText style={styles.deleteBtnText}>Request Account Deletion</ThemedText>
            </Pressable>
          </View>

          <ThemedText style={styles.footer}>
            MilBudgetBuddy is not affiliated with the DoD. Pay figures are estimates only.{'\n'}
            © 2024–2025 MilBudgetBuddy. All rights reserved.
          </ThemedText>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },

  backBtn: { paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backText: { fontSize: 16, fontWeight: '600', color: Brand.tactical, lineHeight: 22 },

  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#C8D8E8', letterSpacing: 1, marginBottom: 4 },

  section: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#C8D8E8', letterSpacing: 0.5, padding: Spacing.three },
  chevron: { fontSize: 12, color: Brand.tactical, paddingRight: Spacing.three },

  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bodyText: { fontSize: 12, lineHeight: 18, color: '#8AABCC' },

  linkBtn: { alignSelf: 'flex-start', paddingTop: 4 },
  linkText: { fontSize: 12, color: Brand.accent, fontWeight: '700' },

  supportBody: { fontSize: 12, lineHeight: 18, color: '#8AABCC', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  contactRow: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  contactEmail: { fontSize: 13, fontWeight: '700', color: Brand.accent },

  deleteBtn: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 4,
    padding: Spacing.two + 2,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#FF6666', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  footer: {
    fontSize: 10,
    color: '#3D5870',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: Spacing.two,
  },
});
