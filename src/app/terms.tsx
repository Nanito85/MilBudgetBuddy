import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

const LAST_UPDATED = 'May 2026';

function Article({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  const tc = useThemeColors();
  return (
    <View style={[s.article, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
      <ThemedText style={s.articleNum}>{num}</ThemedText>
      <ThemedText style={[s.articleTitle, { color: tc.textPrimary }]}>{title}</ThemedText>
      {children}
    </View>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  const tc = useThemeColors();
  return <ThemedText style={[s.para, { color: tc.textSecondary }]}>{children}</ThemedText>;
}

export default function TermsScreen() {
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
          <ThemedText style={[s.title, { color: tc.textPrimary }]}>TERMS OF SERVICE</ThemedText>
          <View style={s.backBtn} />
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.five }]}
        showsVerticalScrollIndicator={false}>

        <ThemedText style={[s.updated, { color: tc.textMuted }]}>Last updated: {LAST_UPDATED}</ThemedText>

        <Article num="1." title="ACCEPTANCE OF TERMS">
          <Para>
            By downloading, installing, or using MilBudgetBuddy ("the App"), you agree to be bound
            by these Terms of Service. If you do not agree, do not use the App.
          </Para>
        </Article>

        <Article num="2." title="DESCRIPTION OF SERVICE">
          <Para>
            MilBudgetBuddy is a personal finance tool designed for US military service members, veterans,
            and military families. The App provides pay estimates, budget tracking, calculators, and
            financial education tools. The App is not affiliated with the Department of Defense, DFAS,
            or any branch of the US Armed Forces.
          </Para>
        </Article>

        <Article num="3." title="FINANCIAL DISCLAIMER">
          <Para>
            ALL CALCULATIONS, ESTIMATES, AND PROJECTIONS PROVIDED BY THIS APP ARE FOR INFORMATIONAL
            PURPOSES ONLY AND DO NOT CONSTITUTE FINANCIAL, TAX, LEGAL, OR INVESTMENT ADVICE.
          </Para>
          <Para>
            Pay estimates are based on publicly available DoD pay tables and may not reflect your
            exact take-home pay. Actual amounts vary based on individual circumstances, state taxes,
            allotments, and other factors. Always verify your pay with your official LES from myPay.dfas.mil.
          </Para>
          <Para>
            VA disability ratings, GI Bill benefits, and retirement calculations are estimates only.
            Contact the VA or your finance office for official determinations.
          </Para>
        </Article>

        <Article num="4." title="SUBSCRIPTION AND IN-APP PURCHASES">
          <Para>
            MilBudgetBuddy Pro is available as a monthly ($4.99/month) or annual ($49.99/year) subscription.
            Subscriptions automatically renew unless cancelled at least 24 hours before the renewal date.
            You may manage or cancel subscriptions through your device's App Store or Google Play account settings.
            No refunds are provided for partial subscription periods.
          </Para>
          <Para>
            To cancel (iOS): Settings → Apple ID → Subscriptions → MilBudgetBuddy → Cancel.{'\n'}
            To cancel (Android): Play Store → Subscriptions → MilBudgetBuddy → Cancel.
          </Para>
        </Article>

        <Article num="5." title="RESTORE PURCHASES">
          <Para>
            If you previously purchased a Pro subscription and need to restore access, use the
            "Restore Purchases" option in the app's Settings screen. Contact support if you
            experience issues restoring your subscription.
          </Para>
        </Article>

        <Article num="6." title="USER DATA AND PRIVACY">
          <Para>
            Your financial data is stored locally on your device. If you create an account, data
            is synced to Firebase using your credentials. We do not sell your data. See our
            Privacy Policy for full details.
          </Para>
        </Article>

        <Article num="7." title="LIMITATION OF LIABILITY">
          <Para>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, MILBUDGETBUDDY AND ITS DEVELOPERS SHALL NOT
            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING
            FROM USE OF THE APP. YOUR SOLE REMEDY FOR DISSATISFACTION WITH THE APP IS TO STOP
            USING IT.
          </Para>
        </Article>

        <Article num="8." title="CHANGES TO TERMS">
          <Para>
            We may update these terms at any time. Continued use of the App after changes constitutes
            acceptance. Material changes will be communicated through the App.
          </Para>
        </Article>

        <Article num="9." title="CONTACT">
          <Para>
            For support or legal inquiries: support@milbudgetbuddy.app{'\n'}
            Privacy questions: privacy@milbudgetbuddy.app
          </Para>
        </Article>

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
  updated: { fontSize: 10, textAlign: 'center' },

  article: {
    borderRadius: 8, padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth, gap: Spacing.one + 2,
  },
  articleNum: { fontSize: 9, fontWeight: '800', color: Brand.accent, letterSpacing: 0.5 },
  articleTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  para: { fontSize: 12, lineHeight: 18 },
});
