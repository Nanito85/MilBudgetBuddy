import { useMemo } from 'react';

import { TIPS } from '@/data/tips';
import { TipCategory } from '@/types/tip.types';

export function useCategories() {
  return useMemo(() => {
    const map = new Map<TipCategory, number>();
    for (const tip of TIPS) {
      map.set(tip.category, (map.get(tip.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  }, []);
}

export function useTipsByCategory(category: TipCategory) {
  return useMemo(() => TIPS.filter((t) => t.category === category), [category]);
}
