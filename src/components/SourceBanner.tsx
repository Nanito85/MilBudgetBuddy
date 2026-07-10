import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme';

export type ConfidenceLevel = 'official' | 'estimated' | 'user_input';

interface SourceEntry {
  label: string;
  url?: string;
  confidence: ConfidenceLevel;
  year?: number;
}

interface Props {
  sources: SourceEntry[];
  disclaimer?: string;
}

const CONFIDENCE_META: Record<ConfidenceLevel, { icon: string; color: string; text: string }> = {
  official:    { icon: '🟢', color: '#00B27A', text: 'Official Rate'   },
  estimated:   { icon: '🟡', color: '#C8A800', text: 'Estimated'       },
  user_input:  { icon: '🔴', color: '#E74C3C', text: 'User Input'      },
};

export function SourceBanner({ sources, disclaimer }: Props) {
  const tc = useThemeColors();
  return (
    <View style={[s.container, { backgroundColor: tc.surface, borderColor: tc.borderColor }]}>
      {sources.map((src, i) => {
        const meta = CONFIDENCE_META[src.confidence];
        return (
          <View key={i} style={s.row}>
            <ThemedText style={s.icon}>{meta.icon}</ThemedText>
            <View style={s.textWrap}>
              <ThemedText style={[s.label, { color: meta.color }]}>
                {meta.text}{src.year ? ` · FY${src.year}` : ''}
              </ThemedText>
              {src.url ? (
                <Pressable onPress={() => Linking.openURL(src.url!)} hitSlop={8}>
                  <ThemedText style={[s.source, { color: tc.textSecondary }]}>{src.label} ↗</ThemedText>
                </Pressable>
              ) : (
                <ThemedText style={[s.source, { color: tc.textSecondary }]}>{src.label}</ThemedText>
              )}
            </View>
          </View>
        );
      })}
      {disclaimer && (
        <View style={[s.disclaimerRow, { borderTopColor: tc.borderColor }]}>
          <ThemedText style={[s.disclaimerText, { color: tc.textMuted }]}>{disclaimer}</ThemedText>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: 6,
    borderWidth: 1,
    padding: Spacing.two + 2,
    gap: Spacing.one + 2,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one + 2 },
  icon: { fontSize: 11, lineHeight: 16, marginTop: 1 },
  textWrap: { flex: 1, gap: 1 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  source: { fontSize: 10, lineHeight: 14 },
  disclaimerRow: {
    borderTopWidth: 1,
    paddingTop: Spacing.one + 2,
    marginTop: Spacing.one,
  },
  disclaimerText: { fontSize: 9, lineHeight: 13 },
});
