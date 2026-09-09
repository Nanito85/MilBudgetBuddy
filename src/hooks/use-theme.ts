import { Brand, BrandLightText, Colors } from '@/constants/theme';
import { useUserStore } from '@/store/user.store';

export function useTheme() {
  const appTheme = useUserStore((s) => s.appTheme ?? 'dark');
  return Colors[appTheme];
}

export function useAppTheme(): 'dark' | 'light' {
  return useUserStore((s) => s.appTheme ?? 'dark');
}

/** Full adaptive color palette for use in dynamic styles (screens with hardcoded colors) */
export function useThemeColors() {
  const appTheme = useUserStore((s) => s.appTheme ?? 'dark');
  const c = Colors[appTheme];
  const isLight = appTheme === 'light';
  return {
    // Theme base
    ...c,
    isLight,
    // Text
    textPrimary:   c.text,
    textSecondary: c.textSecondary,
    textHint:      c.textHint,
    textMuted:     c.textMuted,
    // Surfaces
    surface:       c.backgroundElement,
    surfaceInner:  c.cardInner,
    inputBg:       c.inputBg,
    // Borders
    borderColor:   c.border,
    borderStrong:  c.borderStrong,
    // Brand — primary/danger/classified measure fine as text on light
    // backgrounds as-is (>=4.5:1); tactical/accent/success/warning were
    // tuned bright for the dark-mode background and fail badly as light-mode
    // TEXT color (2.0-2.8:1) — see BrandLightText's comment in
    // constants/theme.ts. Swap those four to their darker light-safe
    // variant in light mode; everything else stays the shared brand hue.
    accent:        isLight ? BrandLightText.accent   : Brand.accent,
    tactical:      isLight ? BrandLightText.tactical : Brand.tactical,
    primary:       Brand.primary,
    danger:        Brand.danger,
    success:       isLight ? BrandLightText.success  : Brand.success,
    warning:       isLight ? BrandLightText.warning  : Brand.warning,
    classified:    Brand.classified,
  };
}
