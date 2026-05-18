import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useUserStore } from '@/store/user.store';
import { ThemedText } from './themed-text';

export function DisclaimerModal() {
  const disclaimerAcknowledged = useUserStore((s) => s.disclaimerAcknowledged);
  const setDisclaimerAcknowledged = useUserStore((s) => s.setDisclaimerAcknowledged);

  if (disclaimerAcknowledged) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.accentBar} />
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <ThemedText style={styles.title}>IMPORTANT NOTICE</ThemedText>
            <ThemedText style={styles.section}>Not Financial Advice</ThemedText>
            <ThemedText style={styles.body2}>
              MilBudgetBuddy provides educational tools and estimates only. The figures shown —
              pay calculations, BAH amounts, TRICARE cost estimates, retirement projections, and
              all other outputs — are approximations for informational purposes and may not
              reflect your actual entitlements or costs.
            </ThemedText>
            <ThemedText style={styles.section}>Official Sources</ThemedText>
            <ThemedText style={styles.body2}>
              Always verify your pay and benefits with your finance office, MyPay (dfas.mil),
              milConnect, or the appropriate military personnel system. Tax guidance should come
              from a qualified tax professional or MilTax (via Military OneSource).
            </ThemedText>
            <ThemedText style={styles.section}>No Liability</ThemedText>
            <ThemedText style={styles.body2}>
              The developer assumes no responsibility for financial decisions made based on
              information provided by this app. Investment and insurance choices should be made
              in consultation with licensed professionals.
            </ThemedText>
          </ScrollView>
          <Pressable
            onPress={setDisclaimerAcknowledged}
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }]}>
            <ThemedText style={styles.btnText}>I UNDERSTAND — CONTINUE</ThemedText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,8,15,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0A1628',
    borderWidth: 1,
    borderColor: '#0D1E2E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    backgroundColor: Brand.accent,
  },
  body: {
    maxHeight: 420,
  },
  bodyContent: {
    padding: Spacing.three,
    gap: 8,
  },
  title: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    color: Brand.tactical,
    marginBottom: 12,
  },
  section: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Brand.accent,
    marginTop: 8,
  },
  body2: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8BAFC8',
  },
  btn: {
    margin: Spacing.two,
    backgroundColor: Brand.accent,
    borderRadius: 3,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#04080F',
  },
});
