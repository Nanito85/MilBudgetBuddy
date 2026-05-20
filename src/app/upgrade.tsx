import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Spacing } from '@/constants/theme';
import { IAP_PRICE_DISPLAY, PROMO_DAYS } from '@/constants/features';
import { useEntitlement } from '@/hooks/use-entitlement';
import { purchasePro, restorePurchases } from '@/services/iap';

// ── Feature comparison ──────────────────────────────────────────────────────────

const FREE_FEATURES = [
  { label: 'Pay Chart lookup', included: true },
  { label: 'BAH Guide (FY2026 rates)', included: true },
  { label: 'LES Pay Statement Decoder', included: true },
  { label: 'PCS Calculator', included: true },
  { label: '3 budget categories', included: true },
  { label: '1 kid profile', included: true },
  { label: '20+ calculators & guides', included: false },
  { label: 'Full budget (all categories)', included: false },
  { label: 'Multiple kid profiles', included: false },
  { label: 'Net Worth Tracker', included: false },
  { label: 'Savings Goals', included: false },
];

const PRO_FEATURES = [
  { label: '24+ calculators & tools', icon: '💰' },
  { label: 'All budget categories + custom', icon: '📊' },
  { label: 'Multiple kids profiles', icon: '👨‍👩‍👧‍👦' },
  { label: 'Net Worth Tracker', icon: '📈' },
  { label: 'Savings Goals', icon: '🎯' },
  { label: 'Deployment & TSP planning', icon: '🪖' },
  { label: 'VA Disability & GI Bill', icon: '🎖️' },
  { label: 'One-time purchase — no sub', icon: '✅' },
];

// ── Main Screen ─────────────────────────────────────────────────────────────────

export default function UpgradeScreen() {
  const router = useRouter();
  const { isPro, isPromo, status, daysLeft } = useEntitlement();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    const success = await purchasePro();
    setLoading(false);
    if (success) router.back();
  };

  const handleRestore = async () => {
    setLoading(true);
    await restorePurchases();
    setLoading(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>

          {/* Header */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}>
            <ThemedText style={styles.backText}>‹ Back</ThemedText>
          </Pressable>

          <View style={styles.heroSection}>
            <ThemedText style={styles.eyebrow}>// MILBUDGETBUDDY</ThemedText>
            <ThemedText style={styles.heroTitle}>UPGRADE TO PRO</ThemedText>
            <ThemedText style={styles.heroSub}>
              Unlock the full military finance toolkit — every calculator, every guide, unlimited budgeting.
            </ThemedText>
          </View>

          {/* Promo / status banner */}
          {isPromo && daysLeft > 0 && (
            <View style={styles.promoBanner}>
              <ThemedText style={styles.promoIcon}>⏳</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.promoTitle}>
                  FREE ACCESS — {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
                </ThemedText>
                <ThemedText style={styles.promoBody}>
                  You're in the early-adopter window. After {PROMO_DAYS} days, non-Pro features become limited.
                </ThemedText>
              </View>
            </View>
          )}

          {isPro && status === 'pro' && (
            <View style={[styles.promoBanner, { borderColor: Brand.success + '40', backgroundColor: Brand.success + '10' }]}>
              <ThemedText style={styles.promoIcon}>✅</ThemedText>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.promoTitle, { color: Brand.success }]}>
                  YOU'RE PRO — ALL FEATURES UNLOCKED
                </ThemedText>
                <ThemedText style={styles.promoBody}>
                  Thank you for supporting MilBudgetBuddy. Every feature is unlocked forever.
                </ThemedText>
              </View>
            </View>
          )}

          {/* Pro features grid */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>// WHAT YOU GET WITH PRO</ThemedText>
            <View style={styles.proGrid}>
              {PRO_FEATURES.map((f) => (
                <View key={f.label} style={styles.proFeatureCard}>
                  <ThemedText style={styles.proFeatureIcon}>{f.icon}</ThemedText>
                  <ThemedText style={styles.proFeatureLabel}>{f.label}</ThemedText>
                </View>
              ))}
            </View>
          </View>

          {/* Free vs Pro comparison */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionLabel}>// FREE VS PRO</ThemedText>
            <View style={styles.compareTable}>
              {FREE_FEATURES.map((f) => (
                <View key={f.label} style={styles.compareRow}>
                  <ThemedText style={[styles.compareCheck, { color: f.included ? Brand.tactical : '#3D5870' }]}>
                    {f.included ? '✓' : '✗'}
                  </ThemedText>
                  <ThemedText style={[styles.compareLabel, !f.included && styles.compareLocked]}>
                    {f.label}
                  </ThemedText>
                  {!f.included && (
                    <View style={styles.proBadge}>
                      <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Price */}
          {!isPro || status === 'promo' ? (
            <>
              <View style={styles.priceSection}>
                <ThemedText style={styles.priceAmount}>{IAP_PRICE_DISPLAY}</ThemedText>
                <ThemedText style={styles.priceSub}>One-time purchase · No subscription · No auto-renewal</ThemedText>
              </View>

              <Pressable
                onPress={handlePurchase}
                disabled={loading}
                style={({ pressed }) => [styles.purchaseBtn, (loading || pressed) && { opacity: 0.7 }]}>
                <ThemedText style={styles.purchaseBtnText}>
                  {loading ? 'PROCESSING...' : `UPGRADE FOR ${IAP_PRICE_DISPLAY}`}
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleRestore}
                disabled={loading}
                style={styles.restoreBtn}>
                <ThemedText style={styles.restoreBtnText}>
                  Already purchased? Restore
                </ThemedText>
              </Pressable>
            </>
          ) : null}

          {/* Footer note */}
          <ThemedText style={styles.footerNote}>
            All your data is saved regardless of plan. Upgrading unlocks features — it never deletes anything.
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

  heroSection: { gap: Spacing.one, paddingBottom: Spacing.two },
  eyebrow: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 1, color: '#C8D8E8', marginTop: 2 },
  heroSub: { fontSize: 13, lineHeight: 20, color: '#6B92B0', marginTop: 4 },

  promoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: Brand.accent + '10',
    borderWidth: 1,
    borderColor: Brand.accent + '40',
    borderRadius: 6,
    padding: Spacing.three,
  },
  promoIcon: { fontSize: 20, lineHeight: 24 },
  promoTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, color: Brand.accent, marginBottom: 2 },
  promoBody: { fontSize: 11, lineHeight: 16, color: '#6B92B0' },

  section: { gap: Spacing.two },
  sectionLabel: { color: Brand.tactical, fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  proGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  proFeatureCard: {
    width: '47.5%',
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 6,
    padding: Spacing.two + 2,
    gap: 4,
  },
  proFeatureIcon: { fontSize: 20, lineHeight: 26 },
  proFeatureLabel: { fontSize: 11, fontWeight: '700', color: '#C8D8E8', lineHeight: 15 },

  compareTable: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.border,
    gap: Spacing.two,
  },
  compareCheck: { fontSize: 14, fontWeight: '800', width: 16, textAlign: 'center' },
  compareLabel: { flex: 1, fontSize: 13, color: '#C8D8E8' },
  compareLocked: { color: '#6B92B0' },
  proBadge: {
    backgroundColor: Brand.accent + '20',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  proBadgeText: { color: Brand.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  priceSection: { alignItems: 'center', paddingVertical: Spacing.two, gap: 4 },
  priceAmount: { fontSize: 36, fontWeight: '900', color: Brand.accent, letterSpacing: 0.5 },
  priceSub: { fontSize: 11, color: '#6B92B0', textAlign: 'center' },

  purchaseBtn: {
    backgroundColor: Brand.accent,
    borderRadius: 6,
    padding: Spacing.three + 2,
    alignItems: 'center',
  },
  purchaseBtnText: { color: '#04080F', fontSize: 15, fontWeight: '900', letterSpacing: 1 },

  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.two },
  restoreBtnText: { color: Brand.tactical, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  footerNote: {
    fontSize: 11,
    color: '#3D5870',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.three,
  },
});
