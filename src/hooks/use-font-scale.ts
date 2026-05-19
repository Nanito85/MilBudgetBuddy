import { useUserStore } from '@/store/user.store';

export function useFontScale(): number {
  return useUserStore((s) => s.fontScale ?? 1.0);
}
