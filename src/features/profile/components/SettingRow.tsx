import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  showChevron?: boolean;
}

export function SettingRow({
  label,
  value,
  onPress,
  rightElement,
  destructive = false,
  showChevron = false,
}: SettingRowProps) {
  const content = (
    <View style={styles.row}>
      <ThemedText
        style={[styles.label, destructive && styles.labelDestructive]}
        themeColor={destructive ? undefined : 'text'}>
        {label}
      </ThemedText>
      <View style={styles.right}>
        {value && (
          <ThemedText type="small" themeColor="textSecondary">
            {value}
          </ThemedText>
        )}
        {rightElement}
        {showChevron && (
          <ThemedText themeColor="textSecondary" style={styles.chevron}>
            ›
          </ThemedText>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.sectionHeader}>
      {title}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    minHeight: 48,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  labelDestructive: {
    color: '#E53E3E',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  pressed: {
    opacity: 0.6,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
    fontWeight: '600',
  },
});
