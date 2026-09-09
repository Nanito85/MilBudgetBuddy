import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0C1826',
    background: '#F2F5F9',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DCEAF6',
    textSecondary: '#3F586F',
    // Extended semantic colors for light mode
    cardInner: '#EEF3F9',
    inputBg: '#E9EFF6',
    border: '#C7D6E3',
    borderStrong: '#9FB6CC',
    textHint: '#5A748C',
    textMuted: '#6E859B',
  },
  dark: {
    // Brightened for legibility on the near-black tactical background.
    text: '#E6EEF7',
    background: '#04080F',
    backgroundElement: '#0C1626',
    backgroundSelected: '#14273F',
    textSecondary: '#A6C0D8',
    // Extended semantic colors for dark mode
    cardInner: '#0A1220',
    inputBg: '#101E30',
    border: '#23415F',
    borderStrong: '#315C87',
    textHint: '#86A4BE',
    textMuted: '#7189A2',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'Menlo',
    data: 'Courier New',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
    data: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
    data: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Brand = {
  // Core
  primary: '#1565C0',
  primaryLight: '#1E88E5',
  primaryDim: '#0D3A80',
  // Accent / Classified amber
  accent: '#F0A500',
  accentLight: '#FFD166',
  // HUD / data display
  tactical: '#00C8A8',
  tacticalDim: 'rgba(0,200,168,0.15)',
  // Status
  danger: '#D32F2F',
  success: '#00B27A',
  warning: '#E8961A',
  // Military identity
  classified: '#CC2020',
  border: '#1A3A5C',
  borderBright: '#2A5A8C',
} as const;

// Light-mode-safe TEXT/ICON variants of the brand accent colors above.
// tactical/accent/success/warning were tuned bright specifically for
// legibility on the near-black dark-mode background (Colors.dark.background,
// #04080F) — measured contrast there is excellent. Used as literal text/icon
// color on a LIGHT background, though, they measure 2.0-2.8:1 against WCAG's
// 4.5:1 (text) / 3:1 (large text/icons) minimum — a washed-out, hard-to-read
// pastel rather than a real accent color. These are darker shades of the
// same hues, each verified >=4.5:1 against both light-mode background colors
// (#F2F5F9 and #FFFFFF). Only for TEXT/ICON color — decorative background
// tints (`Brand.tactical + '20'` etc.) don't carry the same contrast
// requirement and are left using the bright brand hue in both modes.
export const BrandLightText = {
  tactical: '#00695C',
  accent:   '#8F5C00',
  success:  '#046A46',
  warning:  '#8A5A00',
} as const;
