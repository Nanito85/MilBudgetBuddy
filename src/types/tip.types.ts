export type TipCategory =
  | 'tsp'
  | 'credit'
  | 'investing'
  | 'budgeting'
  | 'housing'
  | 'insurance';

export interface Tip {
  id: string;
  title: string;
  body: string;
  category: TipCategory;
  tags: string[];
}

export const CATEGORY_LABELS: Record<TipCategory, string> = {
  tsp: 'TSP',
  credit: 'Credit',
  investing: 'Investing',
  budgeting: 'Budgeting',
  housing: 'Housing & BAH',
  insurance: 'Insurance',
};

export const CATEGORY_ICONS: Record<TipCategory, string> = {
  tsp: 'chart.bar.fill',
  credit: 'creditcard.fill',
  investing: 'arrow.up.right.circle.fill',
  budgeting: 'dollarsign.circle.fill',
  housing: 'house.fill',
  insurance: 'shield.fill',
};

export const CATEGORY_COLORS: Record<TipCategory, { bg: string; text: string }> = {
  tsp: { bg: '#1B3A6B', text: '#FFFFFF' },
  credit: { bg: '#7C3AED', text: '#FFFFFF' },
  investing: { bg: '#059669', text: '#FFFFFF' },
  budgeting: { bg: '#C9A84C', text: '#1A1A1A' },
  housing: { bg: '#EA580C', text: '#FFFFFF' },
  insurance: { bg: '#0284C7', text: '#FFFFFF' },
};

export const CATEGORY_DESCRIPTIONS: Record<TipCategory, string> = {
  tsp: 'Retirement savings & matching',
  credit: 'Scores, debt & protection',
  investing: 'Markets, IRAs & growth',
  budgeting: 'Pay, spending & saving',
  housing: 'VA loans, BAH & PCS',
  insurance: 'SGLI, TRICARE & auto',
};
