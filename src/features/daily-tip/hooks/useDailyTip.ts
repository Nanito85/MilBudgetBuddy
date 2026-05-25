import { useMemo } from 'react';

import { TIPS } from '@/data/tips';
import { TipCategory } from '@/types/tip.types';
import { FinancialGoal } from '@/types/user.types';
import { dayOfYear } from '@/utils/formatDate';

const GOAL_CATEGORIES: Partial<Record<FinancialGoal, TipCategory[]>> = {
  save_money:       ['budgeting', 'tsp'],
  pay_debt:         ['budgeting', 'credit'],
  pcs_planning:     ['housing'],
  retirement:       ['tsp'],
  family_budgeting: ['budgeting', 'insurance'],
  emergency_fund:   ['budgeting', 'credit'],
};

export function useDailyTip(goal?: FinancialGoal) {
  return useMemo(() => {
    const categories = goal ? GOAL_CATEGORIES[goal] : undefined;
    const pool = categories
      ? TIPS.filter((t) => categories.includes(t.category))
      : TIPS;
    const src = pool.length > 0 ? pool : TIPS;
    return src[dayOfYear() % src.length];
  }, [goal]);
}
