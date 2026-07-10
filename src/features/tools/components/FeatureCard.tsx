import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  available?: boolean;
  badge?: string;
}

export function FeatureCard({ icon, title, description, onPress, available = true, badge }: FeatureCardProps) {
  const tc = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!available}
      style={({ pressed }) => [
        styles.wrapper,
        !available && styles.wrapperDisabled,
        pressed && available && styles.pressed,
      ]}>
      <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }, available && [styles.cardActive, { borderColor: tc.borderStrong }]]}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: available ? Brand.accent : tc.borderColor }]} />

        <View style={[styles.iconWrap, { backgroundColor: available ? Brand.accent + '18' : tc.borderColor + '4D' }]}>
          <ThemedText style={styles.icon}>{icon}</ThemedText>
        </View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <ThemedText style={[styles.title, { color: tc.textPrimary }, !available && [styles.titleMuted, { color: tc.textMuted }]]}>
              {title.toUpperCase()}
            </ThemedText>
            {badge && (
              <View style={[styles.badge, available ? styles.badgeNew : [styles.badgeSoon, { backgroundColor: tc.borderColor + '80', borderColor: tc.borderColor }]]}>
                <ThemedText type="label" style={[styles.badgeText, { color: available ? '#00080F' : tc.textMuted }]}>
                  {badge}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="small" style={[styles.description, { color: tc.textHint }]}>{description}</ThemedText>
        </View>

        {available && (
          <ThemedText style={styles.chevron}>›</ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  wrapperDisabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    overflow: 'hidden',
  },
  cardActive: {},
  accentBar: {
    width: 3,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginLeft: -4,
  },
  icon: { fontSize: 20 },
  textBlock: { flex: 1, gap: 3, paddingVertical: Spacing.two + 4 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleMuted: {},
  description: { fontSize: 11, lineHeight: 16 },
  badge: {
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: Spacing.one + 2,
  },
  badgeNew: { backgroundColor: Brand.accent },
  badgeSoon: { borderWidth: StyleSheet.hairlineWidth },
  badgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  chevron: { fontSize: 18, color: Brand.accent, paddingRight: Spacing.two + 4, fontWeight: '300' },
});
