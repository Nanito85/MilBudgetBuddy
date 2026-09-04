import { getToolById } from '@/data/tools-catalog';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  sublabel: string;
  route: string;
  color: string;
}

// Route/icon/color for everything except 'budget' (Budget is a tab, not a
// Tools-screen entry, so it has no data/tools-catalog.ts counterpart) are
// derived from that shared catalog by id rather than hand-typed here a
// second time — this file used to maintain a fully independent copy of
// each tool's route/icon/color, currently verified in sync for all 19
// overlapping entries but with nothing enforcing that.
//
// This module is imported by QuickActionsGrid (rendered on Home, the
// first screen after launch) and OnboardingFlow (the first screen a new
// user ever sees), both evaluated on every single app start — so a
// missing catalog id here must NEVER throw; that would crash the app for
// every user on every launch, trading one broken tile for the whole app.
// Instead it logs (visible in dev/Sentry) and falls back to a route that
// always exists, so a future id mismatch degrades to "this tile opens the
// Tools screen instead of the specific tool" rather than a broken app.
function catalogTool(catalogId: string) {
  const t = getToolById(catalogId);
  if (!t) {
    console.error(`quick-actions.ts: no data/tools-catalog.ts entry for id "${catalogId}" — falling back to /tools`);
    return { icon: '🛠️', route: '/tools', color: '#888888' };
  }
  return t;
}

export const ALL_QUICK_ACTIONS: QuickAction[] = [
  { id: 'budget',     icon: '💰', label: 'BUDGET',   sublabel: 'MANAGE',   route: '/budget',               color: '#00C8A8' },
  { id: 'credit',     icon: catalogTool('credit').icon,       label: 'CREDIT',   sublabel: 'SCORE',    route: catalogTool('credit').route,       color: catalogTool('credit').color },
  { id: 'pcs',        icon: catalogTool('pcs').icon,          label: 'PCS',      sublabel: 'TRANSFER', route: catalogTool('pcs').route,          color: catalogTool('pcs').color },
  { id: 'va_loan',    icon: catalogTool('va_loan').icon,      label: 'VA LOAN',  sublabel: 'CALC',     route: catalogTool('va_loan').route,      color: catalogTool('va_loan').color },
  { id: 'retirement', icon: catalogTool('retirement').icon,   label: 'RETIRE',   sublabel: 'CALC',     route: catalogTool('retirement').route,   color: catalogTool('retirement').color },
  { id: 'deployment', icon: catalogTool('deployment').icon,   label: 'DEPLOY',   sublabel: 'PAY',      route: catalogTool('deployment').route,   color: catalogTool('deployment').color },
  { id: 'tricare',    icon: catalogTool('tricare').icon,      label: 'TRICARE',  sublabel: 'ESTIMATE', route: catalogTool('tricare').route,      color: catalogTool('tricare').color },
  { id: 'les',        icon: catalogTool('les').icon,          label: 'LES',      sublabel: 'DECODER',  route: catalogTool('les').route,          color: catalogTool('les').color },
  { id: 'dity',       icon: catalogTool('dity').icon,         label: 'DITY',     sublabel: 'MOVE',     route: catalogTool('dity').route,         color: catalogTool('dity').color },
  { id: 'tle',        icon: catalogTool('tle').icon,          label: 'TLE',      sublabel: 'LODGING',  route: catalogTool('tle').route,          color: catalogTool('tle').color },
  { id: 'leave',      icon: catalogTool('leave').icon,        label: 'LEAVE',    sublabel: 'CALC',     route: catalogTool('leave').route,        color: catalogTool('leave').color },
  { id: 'schools',    icon: catalogTool('schools').icon,      label: 'SCHOOLS',  sublabel: 'FINDER',   route: catalogTool('schools').route,      color: catalogTool('schools').color },
  { id: 'net_worth',  icon: catalogTool('net_worth').icon,    label: 'NET',      sublabel: 'WORTH',    route: catalogTool('net_worth').route,    color: catalogTool('net_worth').color },
  { id: 'scra',       icon: catalogTool('scra').icon,         label: 'SCRA',     sublabel: 'RIGHTS',   route: catalogTool('scra').route,         color: catalogTool('scra').color },
  { id: 'ets',        icon: catalogTool('ets').icon,          label: 'ETS',      sublabel: 'CHECKLIST',route: catalogTool('ets').route,          color: catalogTool('ets').color },
  { id: 'tsp',        icon: catalogTool('tsp').icon,          label: 'TSP',      sublabel: 'DEEP DIVE',route: catalogTool('tsp').route,          color: catalogTool('tsp').color },
  // id stays 'va_dis' (matches what's already stored in existing users'
  // quickAccessIds), the catalog entry it maps to is 'va_disability'.
  { id: 'va_dis',     icon: catalogTool('va_disability').icon,label: 'VA DIS',   sublabel: 'RATING',   route: catalogTool('va_disability').route,color: catalogTool('va_disability').color },
  { id: 'gi_bill',    icon: catalogTool('gi_bill').icon,      label: 'GI BILL',  sublabel: 'CALC',     route: catalogTool('gi_bill').route,      color: catalogTool('gi_bill').color },
  { id: 'debt',       icon: catalogTool('debt').icon,         label: 'DEBT',     sublabel: 'PAYOFF',   route: catalogTool('debt').route,         color: catalogTool('debt').color },
];

export const DEFAULT_QUICK_ACCESS_IDS = ['budget', 'debt', 'credit', 'retirement'];

export function getDefaultQuickAccessIds(
  serviceStatus?: 'active' | 'reserve' | 'retired' | 'civilian',
  financialGoal?: string,
): string[] {
  if (serviceStatus === 'retired') {
    return ['retirement', 'va_dis', 'ets', 'tricare'];
  }
  if (serviceStatus === 'reserve') {
    switch (financialGoal) {
      case 'retirement':       return ['tsp', 'retirement', 'va_dis', 'gi_bill'];
      case 'pay_debt':         return ['debt', 'budget', 'credit', 'les'];
      case 'pcs_planning':     return ['pcs', 'dity', 'leave', 'tle'];
      case 'family_budgeting': return ['budget', 'tricare', 'schools', 'leave'];
      default:                 return ['budget', 'tsp', 'leave', 'deployment'];
    }
  }
  // active duty (default)
  switch (financialGoal) {
    case 'save_money':       return ['budget', 'tsp', 'credit', 'net_worth'];
    case 'pay_debt':         return ['debt', 'budget', 'credit', 'les'];
    case 'pcs_planning':     return ['pcs', 'dity', 'tle', 'va_loan'];
    case 'retirement':       return ['tsp', 'retirement', 'scra', 'net_worth'];
    case 'family_budgeting': return ['budget', 'tricare', 'schools', 'pcs'];
    case 'emergency_fund':   return ['budget', 'debt', 'credit', 'net_worth'];
    default:                 return DEFAULT_QUICK_ACCESS_IDS;
  }
}
