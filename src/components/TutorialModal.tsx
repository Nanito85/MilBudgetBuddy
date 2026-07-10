import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native';

import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';

const { width: SCREEN_W } = Dimensions.get('window');

// ── Tutorial slide data ───────────────────────────────────────────────────────

interface Slide {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    id: 'welcome',
    icon: '🎖️',
    title: 'WELCOME TO\nMILBUDGETBUDDY',
    subtitle: 'Your personal military financial command center',
    bullets: [
      'Built exclusively for active duty, reserve, and veteran members',
      'All calculations use official DoD, JTR, and GSA data',
      'Your data stays on your device — private and secure',
    ],
    accentColor: Brand.accent,
  },
  {
    id: 'pay',
    icon: '💰',
    title: 'PAY STATEMENT',
    subtitle: 'Know exactly what you earn and where it goes',
    bullets: [
      'Estimates base pay, BAH, BAS, and special pays by rank & duty station',
      'Shows deductions (TSP, SGLI, dental) and take-home net',
      'Use the LES Decoder to understand every field on your pay stub',
    ],
    accentColor: '#00C8A8',
  },
  {
    id: 'budget',
    icon: '📊',
    title: 'BUDGET OPS',
    subtitle: 'Allocate pay, track spending, hit your targets',
    bullets: [
      'Set monthly budgets across customizable spending categories',
      'Log expenses and see real-time spend vs. budget',
      'Financial Readiness Score tracks your overall financial health',
    ],
    accentColor: Brand.tactical,
  },
  {
    id: 'tools',
    icon: '🛠️',
    title: 'TOOLS & CALCULATORS',
    subtitle: 'Plan every phase of your military career',
    bullets: [
      'TLE/TLA Calculator — estimate lodging reimbursement during PCS moves',
      'BAH Calculator — look up housing allowance by ZIP code and dependents',
      'Retirement Planner — project your pension and BRS blended benefit',
      'Debt Tracker, TSP Optimizer, Credit Score Guide, and more',
    ],
    accentColor: '#208AEF',
  },
  {
    id: 'pcs',
    icon: '📦',
    title: 'PCS PLANNING',
    subtitle: 'Navigate your move with confidence',
    bullets: [
      'PCS Cost Estimator breaks down DPS entitlements and DITY pay',
      'TLE/TLA shows your daily lodging & meal reimbursement rates',
      'Search by base name, city, or ZIP — all 500+ CONUS installations included',
    ],
    accentColor: '#C8A800',
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'PERSONALIZING THE APP',
    subtitle: 'Set it once, get accurate results every time',
    bullets: [
      'Complete your Personnel File with rank, branch, and duty station',
      'Adjust Quick Access tiles to surface the tools you use most',
      'Re-open this tutorial anytime from Settings → Tutorial',
    ],
    accentColor: Brand.primary,
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface TutorialModalProps {
  visible: boolean;
  onDismiss: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TutorialModal({ visible, onDismiss }: TutorialModalProps) {
  const tc = useThemeColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const isLast = activeIndex === SLIDES.length - 1;

  const onViewRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const goNext = () => {
    if (isLast) {
      onDismiss();
      return;
    }
    flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
  };

  const skip = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  };

  const currentAccent = SLIDES[activeIndex]?.accentColor ?? Brand.accent;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>

          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: currentAccent }]} />

          {/* Header */}
          <View style={styles.headerRow}>
            <ThemedText style={[styles.headerTag, { color: currentAccent }]}>
              // ORIENTATION
            </ThemedText>
            <Pressable onPress={skip} hitSlop={12}>
              <ThemedText style={[styles.skipText, { color: tc.textMuted }]}>SKIP ✕</ThemedText>
            </Pressable>
          </View>

          {/* Slides */}
          <FlatList
            ref={flatRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(s) => s.id}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
            renderItem={({ item }) => (
              <View style={styles.slide}>
                <ThemedText style={styles.slideIcon}>{item.icon}</ThemedText>
                <ThemedText style={[styles.slideTitle, { color: item.accentColor }]}>
                  {item.title}
                </ThemedText>
                <ThemedText style={[styles.slideSubtitle, { color: tc.textSecondary }]}>{item.subtitle}</ThemedText>
                <View style={styles.bulletList}>
                  {item.bullets.map((b: string, i: number) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: item.accentColor }]} />
                      <ThemedText style={[styles.bulletText, { color: tc.textSecondary }]}>{b}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          />

          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex
                    ? [styles.dotActive, { backgroundColor: currentAccent }]
                    : [styles.dotInactive, { backgroundColor: tc.borderColor }],
                ]}
              />
            ))}
          </View>

          {/* CTA */}
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: currentAccent },
              pressed && { opacity: 0.8 },
            ]}>
            <ThemedText style={styles.ctaText}>
              {isLast ? "LET'S GO  →" : 'NEXT  →'}
            </ThemedText>
          </Pressable>

          {/* Progress fraction */}
          <ThemedText style={[styles.progress, { color: tc.textMuted }]}>
            {activeIndex + 1} / {SLIDES.length}
          </ThemedText>

        </View>
      </Animated.View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4,8,15,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two + 2,
    paddingBottom: Spacing.one,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: 'monospace',
  },
  skipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  slide: {
    width: SCREEN_W - Spacing.three * 2,
    maxWidth: 420,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  slideIcon: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    fontFamily: 'monospace',
    lineHeight: 24,
  },
  slideSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  bulletList: {
    gap: Spacing.one + 2,
    marginTop: Spacing.one,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.one + 2,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: Spacing.two,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
  },
  dotInactive: {
    width: 6,
  },
  cta: {
    marginHorizontal: Spacing.three,
    borderRadius: 4,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#04080F',
    fontFamily: 'monospace',
  },
  progress: {
    textAlign: 'center',
    fontSize: 11,
    paddingVertical: Spacing.two,
    letterSpacing: 0.5,
  },
});
