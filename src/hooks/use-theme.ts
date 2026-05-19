import { Brand, Colors } from '@/constants/theme';
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
    // Brand (same in both modes)
    accent:        Brand.accent,
    tactical:      Brand.tactical,
    primary:       Brand.primary,
    danger:        Brand.danger,
    success:       Brand.success,
    warning:       Brand.warning,
    classified:    Brand.classified,
  };
}
