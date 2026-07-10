import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { useThemeColors } from '@/hooks/use-theme';

interface Props extends ViewProps {
  accentColor?: string;
  cornerSize?: number;
  children: React.ReactNode;
}

export function TacticalCard({ accentColor, cornerSize = 12, style, children, ...rest }: Props) {
  const tc = useThemeColors();
  const cs = cornerSize;
  const bw = 2;
  const activeAccent = accentColor ?? tc.borderColor;

  return (
    <View style={[styles.card, { backgroundColor: tc.surface, borderColor: tc.borderColor }, style]} {...rest}>
      {/* Corner brackets */}
      <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: bw, borderLeftWidth: bw, width: cs, height: cs, borderColor: activeAccent }]} />
      <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: bw, borderRightWidth: bw, width: cs, height: cs, borderColor: activeAccent }]} />
      <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: bw, borderLeftWidth: bw, width: cs, height: cs, borderColor: activeAccent }]} />
      <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: bw, borderRightWidth: bw, width: cs, height: cs, borderColor: activeAccent }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  corner: {
    position: 'absolute',
    zIndex: 1,
  },
});
