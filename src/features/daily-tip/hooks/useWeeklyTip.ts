import { useMemo } from 'react';

import { TIPS } from '@/data/tips';
import { TipCategory } from '@/types/tip.types';
import { FinancialGoal } from '@/types/user.types';
import { weekOfYear } from '@/utils/formatDate';

const GOAL_CATEGORIES: Partial<Record<FinancialGoal, TipCategory[]>> = {
  save_money:       ['budgeting', 'tsp'],
  pay_debt:         ['budgeting', 'credit'],
  pcs_planning:     ['housing'],
  retirement:       ['tsp'],
  family_budgeting: ['budgeting', 'insurance'],
  emergency_fund:   ['budgeting', 'credit'],
};

/**
 * Rotates to a new tip every week (same tip Mon–Sun, next one the following
 * week) rather than daily — with 58 tips in the library that's about a year
 * of unique content before it repeats.
 */
export function useWeeklyTip(goal?: FinancialGoal) {
  return useMemo(() => {
    const categories = goal ? GOAL_CATEGORIES[goal] : undefined;
    const pool = categories
      ? TIPS.filter((t) => categories.includes(t.category))
      : TIPS;
    const src = pool.length > 0 ? pool : TIPS;
    return src[weekOfYear() % src.length];
  }, [goal]);
}
