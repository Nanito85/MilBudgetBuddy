import { Colors } from '@/constants/theme';
import { useUserStore } from '@/store/user.store';

export function useTheme() {
  const appTheme = useUserStore((s) => s.appTheme ?? 'dark');
  return Colors[appTheme];
}

export function useAppTheme(): 'dark' | 'light' {
  return useUserStore((s) => s.appTheme ?? 'dark');
}
