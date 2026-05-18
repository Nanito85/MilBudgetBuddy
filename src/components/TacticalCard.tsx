import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { Brand } from '@/constants/theme';

interface Props extends ViewProps {
  accentColor?: string;
  cornerSize?: number;
  children: React.ReactNode;
}

export function TacticalCard({ accentColor = Brand.border, cornerSize = 12, style, children, ...rest }: Props) {
  const cs = cornerSize;
  const bw = 2;

  return (
    <View style={[styles.card, style]} {...rest}>
      {/* Corner brackets */}
      <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: bw, borderLeftWidth: bw, width: cs, height: cs, borderColor: accentColor }]} />
      <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: bw, borderRightWidth: bw, width: cs, height: cs, borderColor: accentColor }]} />
      <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: bw, borderLeftWidth: bw, width: cs, height: cs, borderColor: accentColor }]} />
      <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: bw, borderRightWidth: bw, width: cs, height: cs, borderColor: accentColor }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#080E1C',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(26,58,92,0.8)',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    zIndex: 1,
  },
});
