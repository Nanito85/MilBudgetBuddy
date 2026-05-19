import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Brand, Fonts, ThemeColor } from '@/constants/theme';
import { useFontScale } from '@/hooks/use-font-scale';
import { useAppTheme, useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'data' | 'label' | 'classified';
  themeColor?: ThemeColor;
};

// Dark-palette text colors that are unreadable on a light background → corrected values
const LIGHT_COLOR_FIX: Record<string, string> = {
  '#c8d8e8': '#0D1E2E',
  '#4d7a9a': '#1A4A6A',
  '#3d6080': '#1A3A5C',
  '#6a8aa8': '#1A4A6A',
  '#7a9ab5': '#1A4070',
  '#8aa8c0': '#0D3050',
  '#6b92b0': '#1A4A6A',
  '#9ab8cc': '#0D3050',
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const scale = useFontScale();
  const appTheme = useAppTheme();
  const isLight = appTheme === 'light';

  const baseStyle = (() => {
    switch (type) {
      case 'default':    return { fontSize: 15 * scale, lineHeight: 22 * scale, fontWeight: '500' as const, letterSpacing: 0.1 };
      case 'small':      return { fontSize: 13 * scale, lineHeight: 18 * scale, fontWeight: '500' as const, letterSpacing: 0.2 };
      case 'smallBold':  return { fontSize: 13 * scale, lineHeight: 18 * scale, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const };
      case 'title':      return { fontSize: 44 * scale, lineHeight: 48 * scale, fontWeight: '900' as const, letterSpacing: -1 };
      case 'subtitle':   return { fontSize: 28 * scale, lineHeight: 34 * scale, fontWeight: '800' as const, letterSpacing: -0.5 };
      case 'link':       return { lineHeight: 30 * scale, fontSize: 14 * scale };
      case 'linkPrimary':return { lineHeight: 30 * scale, fontSize: 14 * scale, color: Brand.tactical };
      case 'code':       return { fontFamily: Fonts.mono, fontWeight: (Platform.OS === 'android' ? '700' : '500') as '700' | '500', fontSize: 12 * scale, letterSpacing: 0.5 };
      case 'data':       return { fontFamily: Fonts.data, fontSize: 15 * scale, fontWeight: '700' as const, letterSpacing: 0.5, color: Brand.tactical };
      case 'label':      return { fontSize: Math.max(10, 10 * scale), fontWeight: '700' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const };
      case 'classified': return { fontSize: 9 * scale, fontWeight: '800' as const, letterSpacing: 3, textTransform: 'uppercase' as const, color: Brand.classified };
      default:           return {};
    }
  })();

  // Flatten inline style, then apply scaling + light-mode color correction
  const flat = StyleSheet.flatten(style) as Record<string, any> | undefined;
  let processedStyle: Record<string, any> | undefined;
  if (flat) {
    processedStyle = { ...flat };
    // Scale any explicitly provided fontSize so large/xlarge settings apply everywhere
    if (flat.fontSize != null) {
      processedStyle.fontSize = (flat.fontSize as number) * scale;
      if (flat.lineHeight != null) {
        processedStyle.lineHeight = (flat.lineHeight as number) * scale;
      }
    }
    // In light mode, correct dark-palette text colors to readable equivalents
    if (isLight && flat.color) {
      const fixed = LIGHT_COLOR_FIX[(flat.color as string).toLowerCase()];
      if (fixed) processedStyle.color = fixed;
    }
  }

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        baseStyle,
        processedStyle,
      ]}
      {...rest}
    />
  );
}
