import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
  available?: boolean;
  badge?: string;
}

export function FeatureCard({ icon, title, description, onPress, available = true, badge }: FeatureCardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!available}
      style={({ pressed }) => [
        styles.wrapper,
        !available && styles.wrapperDisabled,
        pressed && available && styles.pressed,
      ]}>
      <View style={[styles.card, available && styles.cardActive]}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: available ? Brand.accent : '#1A3A5C' }]} />

        <View style={[styles.iconWrap, { backgroundColor: available ? Brand.accent + '18' : 'rgba(26,58,92,0.3)' }]}>
          <ThemedText style={styles.icon}>{icon}</ThemedText>
        </View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <ThemedText style={[styles.title, !available && styles.titleMuted]}>
              {title.toUpperCase()}
            </ThemedText>
            {badge && (
              <View style={[styles.badge, available ? styles.badgeNew : styles.badgeSoon]}>
                <ThemedText type="label" style={[styles.badgeText, { color: available ? '#00080F' : '#3D6080' }]}>
                  {badge}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText type="small" style={styles.description}>{description}</ThemedText>
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
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(26,58,92,0.8)',
  },
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
    color: '#C8D8E8',
  },
  titleMuted: { color: '#3D6080' },
  description: { fontSize: 11, lineHeight: 16, color: '#4D7A9A' },
  badge: {
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: Spacing.one + 2,
  },
  badgeNew: { backgroundColor: Brand.accent },
  badgeSoon: { backgroundColor: 'rgba(26,58,92,0.5)', borderWidth: StyleSheet.hairlineWidth, borderColor: Brand.border },
  badgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  chevron: { fontSize: 18, color: Brand.accent, paddingRight: Spacing.two + 4, fontWeight: '300' },
});
