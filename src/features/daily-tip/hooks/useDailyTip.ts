import { useMemo } from 'react';

import { TIPS } from '@/data/tips';
import { Tip } from '@/types/tip.types';
import { dayOfYear } from '@/utils/formatDate';

export function useDailyTip(): Tip {
  return useMemo(() => {
    const index = dayOfYear() % TIPS.length;
    return TIPS[index];
  }, []);
}
