import '@/global.css';

import { Platform } from 'react-native';

// ── Tactical Dark Palette (both light and dark = always dark military) ─────────
export const Colors = {
  light: {
    text: '#C8D8E8',
    background: '#0A1628',
    backgroundElement: '#0F2040',
    backgroundSelected: '#1A3560',
    textSecondary: '#5580A0',
  },
  dark: {
    text: '#C8D8E8',
    background: '#04080F',
    backgroundElement: '#080E1C',
    backgroundSelected: '#0D1A2E',
    textSecondary: '#3D6080',
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
