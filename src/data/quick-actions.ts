export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  route: string;
  color: string;
}

export const ALL_QUICK_ACTIONS: QuickAction[] = [
  { id: 'budget',     icon: '💰', label: 'BUDGET',   sublabel: 'MANAGE',   route: '/budget',               color: '#00C8A8' },
  { id: 'credit',     icon: '📊', label: 'CREDIT',   sublabel: 'SCORE',    route: '/credit-score',         color: '#C8A800' },
  { id: 'pcs',        icon: '🚚', label: 'PCS',      sublabel: 'TRANSFER', route: '/pcs-calculator',       color: '#1565C0' },
  { id: 'va_loan',    icon: '🏠', label: 'VA LOAN',  sublabel: 'CALC',     route: '/va-loan-calculator',   color: '#B71C1C' },
  { id: 'retirement', icon: '🏁', label: 'RETIRE',   sublabel: 'CALC',     route: '/retirement-calculator',color: '#C8A800' },
  { id: 'deployment', icon: '🪖', label: 'DEPLOY',   sublabel: 'PAY',      route: '/deployment-calculator',color: '#2E7D32' },
  { id: 'tricare',    icon: '🏥', label: 'TRICARE',  sublabel: 'ESTIMATE', route: '/tricare-estimator',    color: '#00695C' },
  { id: 'les',        icon: '📄', label: 'LES',      sublabel: 'DECODER',  route: '/les-decoder',          color: '#1A237E' },
  { id: 'dity',       icon: '📦', label: 'DITY',     sublabel: 'MOVE',     route: '/dity-calculator',      color: '#6A1B9A' },
  { id: 'tle',        icon: '🏨', label: 'TLE',      sublabel: 'LODGING',  route: '/tle-calculator',       color: '#00695C' },
  { id: 'leave',      icon: '📅', label: 'LEAVE',    sublabel: 'CALC',     route: '/leave-calculator',     color: '#0277BD' },
  { id: 'schools',    icon: '🏫', label: 'SCHOOLS',  sublabel: 'FINDER',   route: '/schools-finder',       color: '#5C3D11' },
  { id: 'net_worth',  icon: '📈', label: 'NET',      sublabel: 'WORTH',    route: '/net-worth',            color: '#00C8A8' },
  { id: 'scra',       icon: '⚖️', label: 'SCRA',     sublabel: 'RIGHTS',   route: '/scra-guide',           color: '#1A237E' },
  { id: 'ets',        icon: '🎖️', label: 'ETS',      sublabel: 'CHECKLIST',route: '/ets-checklist',        color: '#2E7D32' },
  { id: 'tsp',        icon: '📊', label: 'TSP',      sublabel: 'DEEP DIVE',route: '/tsp-calculator',       color: '#00695C' },
  { id: 'va_dis',     icon: '🏥', label: 'VA DIS',   sublabel: 'RATING',   route: '/va-disability',        color: '#B71C1C' },
  { id: 'gi_bill',    icon: '🎓', label: 'GI BILL',  sublabel: 'CALC',     route: '/gi-bill-calculator',   color: '#1A237E' },
  { id: 'debt',       icon: '💳', label: 'DEBT',     sublabel: 'PAYOFF',   route: '/debt-payoff',          color: '#B71C1C' },
];

export const DEFAULT_QUICK_ACCESS_IDS = ['budget', 'debt', 'credit', 'retirement'];
