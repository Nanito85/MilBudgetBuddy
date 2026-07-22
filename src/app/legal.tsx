import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth.store';
import { useUserStore } from '@/store/user.store';

const SUPPORT_EMAIL = 'support@milbudgetbuddy.com';
const PRIVACY_URL = 'https://milbudgetbuddy.com/privacy';
const TERMS_URL = 'https://milbudgetbuddy.com/terms';

type Section = 'privacy' | 'terms' | null;

export default function LegalScreen() {
  const router = useRouter();
  const tc = useThemeColors();
  const [expanded, setExpanded] = useState<Section>(null);
  const [deleting, setDeleting] = useState(false);
  const { user, deleteAccount } = useAuthStore();
  const resetAll = useUserStore((s) => s.resetAll);

  const toggle = (section: Section) =>
    setExpanded((prev) => (prev === section ? null : section));

  const handleDeleteAccount = () => {
    if (!user) {
      Alert.alert('Not Signed In', 'You need to be signed in to delete your account.');
      return;
    }
    Alert.alert(
      'Delete Account',
      'This will immediately and permanently delete your account and all synced data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch {
              Alert.alert('Error', 'Could not delete account. You may need to sign out and sign back in first, then try again.');
            } finally {
              setDeleting(false);
            }
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
          <ThemedText style={[styles.pageTitle, { color: tc.textPrimary }]}>LEGAL & PRIVACY</ThemedText>

          {/* Privacy Policy */}
          <View style={[styles.section, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <Pressable style={styles.sectionHeader} onPress={() => toggle('privacy')}>
              <ThemedText style={[styles.sectionTitle, { color: tc.textPrimary }]}>Privacy Policy</ThemedText>
              <ThemedText style={styles.chevron}>{expanded === 'privacy' ? '▲' : '▼'}</ThemedText>
            </Pressable>
            {expanded === 'privacy' && (
              <View style={[styles.sectionBody, { borderTopColor: tc.borderColor }]}>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  MilBudgetBuddy collects only information you provide directly — pay grade, location (ZIP code), and family
                  size — to calculate military pay entitlements. This data is stored locally on your device and optionally
                  synced to your Firebase account if you sign in.
                </ThemedText>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  We do not sell your data. Anonymous usage analytics (screen views, feature usage counts) may be collected
                  to improve the app. If you sign in, your pay profile and budget data (pay grade, ZIP code, TSP
                  contributions, and similar entries) sync to your Firebase account so you can access them across devices.
                  We do not store payment card details.
                </ThemedText>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  Firebase Authentication is used for optional account sign-in. Google's privacy policy applies to that
                  service.
                </ThemedText>
                <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.linkBtn}>
                  <ThemedText style={styles.linkText}>View Full Privacy Policy →</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Terms of Service */}
          <View style={[styles.section, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <Pressable style={styles.sectionHeader} onPress={() => toggle('terms')}>
              <ThemedText style={[styles.sectionTitle, { color: tc.textPrimary }]}>Terms of Service</ThemedText>
              <ThemedText style={styles.chevron}>{expanded === 'terms' ? '▲' : '▼'}</ThemedText>
            </Pressable>
            {expanded === 'terms' && (
              <View style={[styles.sectionBody, { borderTopColor: tc.borderColor }]}>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  MilBudgetBuddy provides military pay estimates and financial planning tools for informational purposes only.
                  All calculations are based on publicly available DoD pay tables and are not guaranteed to be accurate for
                  your specific situation.
                </ThemedText>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  This app is not affiliated with, endorsed by, or operated by the Department of Defense or any branch of
                  the United States Armed Forces. Always verify your pay and entitlements with your finance office or
                  official myPay account.
                </ThemedText>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  MilBudgetBuddy Pro is available as a monthly ($4.99/month) or annual ($49.99/year) auto-renewing
                  subscription, billed through Google Play or the App Store. Subscriptions renew automatically unless
                  cancelled at least 24 hours before the renewal date, and no refunds are provided for partial periods.
                </ThemedText>
                <ThemedText style={[styles.bodyText, { color: tc.textSecondary }]}>
                  You can manage or cancel your subscription anytime through your device's App Store or Google Play
                  account settings.
                </ThemedText>
                <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={styles.linkBtn}>
                  <ThemedText style={styles.linkText}>View Full Terms of Service →</ThemedText>
                </Pressable>
              </View>
            )}
          </View>

          {/* Support */}
          <View style={[styles.section, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.sectionTitle, { color: tc.textPrimary }]}>Support</ThemedText>
            <ThemedText style={[styles.supportBody, { color: tc.textSecondary }]}>
              For help, feedback, or questions, contact us at:
            </ThemedText>
            <Pressable onPress={handleContact} style={styles.contactRow}>
              <ThemedText style={styles.contactEmail}>{SUPPORT_EMAIL}</ThemedText>
            </Pressable>
          </View>

          {/* Account Deletion */}
          <View style={[styles.section, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
            <ThemedText style={[styles.sectionTitle, { color: tc.textPrimary }]}>Data & Account Deletion</ThemedText>
            <ThemedText style={[styles.supportBody, { color: tc.textSecondary }]}>
              You may delete your account and all associated cloud data at any time. Deletion is immediate and
              permanent.
            </ThemedText>
            <Pressable onPress={handleDeleteAccount} disabled={deleting} style={styles.deleteBtn}>
              {deleting ? (
                <ActivityIndicator color="#FF6666" />
              ) : (
                <ThemedText style={styles.deleteBtnText}>Delete Account Now</ThemedText>
              )}
            </Pressable>
          </View>

          <ThemedText style={[styles.footer, { color: tc.textMuted }]}>
            MilBudgetBuddy is not affiliated with the DoD. Pay figures are estimates only.{'\n'}
            © 2024–2026 MilBudgetBuddy. All rights reserved.
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
  pageTitle: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },

  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  sectionTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, padding: Spacing.three },
  chevron: { fontSize: 12, color: Brand.tactical, paddingRight: Spacing.three },

  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  bodyText: { fontSize: 12, lineHeight: 18 },

  linkBtn: { alignSelf: 'flex-start', paddingTop: 4 },
  linkText: { fontSize: 12, color: Brand.accent, fontWeight: '700' },

  supportBody: { fontSize: 12, lineHeight: 18, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
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
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: Spacing.two,
  },
});
