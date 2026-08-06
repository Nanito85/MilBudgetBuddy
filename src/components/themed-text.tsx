import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Brand, Fonts, ThemeColor } from '@/constants/theme';
import { useFontScale } from '@/hooks/use-font-scale';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code' | 'data' | 'label' | 'classified';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const scale = useFontScale();

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

  // Scale any explicitly provided fontSize so large/xlarge settings apply everywhere
  const flat = StyleSheet.flatten(style) as Record<string, any> | undefined;
  let processedStyle: Record<string, any> | undefined;
  if (flat) {
    processedStyle = { ...flat };
    if (flat.fontSize != null) {
      const scaledFontSize = (flat.fontSize as number) * scale;
      processedStyle.fontSize = scaledFontSize;
      if (flat.lineHeight != null) {
        processedStyle.lineHeight = (flat.lineHeight as number) * scale;
      } else {
        // Caller overrode fontSize but not lineHeight — left alone, this would
        // fall through to baseStyle's lineHeight, which was sized for that
        // `type`'s own default fontSize, not this one. At best that mismatch
        // clips ascenders/descenders/emoji; at the larger fontScale settings
        // (Large/X-Large/XX-Large) it gets worse since only the type's fixed
        // lineHeight was scaling, disconnected from the actual rendered size.
        // Derive a sane one from the font size actually being rendered instead.
        processedStyle.lineHeight = Math.ceil(scaledFontSize * 1.25);
      }
    }
  }

  return (
    <Text
      // The app has its own Normal/Large/X-Large/XX-Large text-size setting
      // (useFontScale above) as the intended accessibility control. RN's
      // `allowFontScaling` defaults to true, which layers the OS Dynamic Type
      // setting on top of that multiplicatively — on a device with both an
      // enlarged system text size AND XX-Large selected in-app, sizes compound
      // well past what these fixed-layout cards/badges were built for and text
      // clips. Disabling it makes the in-app setting the sole, predictable
      // driver; callers can still opt back in by passing allowFontScaling.
      allowFontScaling={false}
      style={[
        { color: theme[themeColor ?? 'text'] },
        baseStyle,
        processedStyle,
      ]}
      {...rest}
    />
  );
}
