/**
 * The full Tools screen catalog — every calculator/guide/tool in the app,
 * with its route, icon, description, and search tags.
 *
 * Extracted out of app/(tabs)/tools.tsx so it can be a single source of
 * truth shared with data/quick-actions.ts (Home screen's customizable
 * Quick Access tiles). Before this, quick-actions.ts hand-typed its own
 * completely separate copy of each tool's route/icon/color — currently
 * verified in sync for all 19 overlapping entries, but nothing enforced
 * that, which is exactly the kind of duplication that broke OHA location
 * lookups: rename a route here, forget the other copy exists, and a
 * user's pinned quick-access tile silently points at a dead route.
 */

export interface ToolItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
  available: boolean;
  badge?: string;
  color: string;
  tags?: string[]; // for search
}

export const PAY_ENTITLEMENTS: ToolItem[] = [
  { id: 'pay_chart',    icon: '💰', color: '#00695C', title: 'Pay Chart',
    description: 'FY2026 base pay by rank and years of service — official DFAS rates', route: '/pay-chart', available: true, tags: ['salary','base pay','basic pay'] },
  { id: 'promotion',    icon: '⭐', color: '#C8A800', title: 'Promotion Pay Predictor', badge: 'New',
    description: 'See exactly how much your next promotion is worth — monthly, annual, and 5-year impact', route: '/promotion-calculator', available: true, tags: ['promotion','rank','raise','increase','next rank'] },
  { id: 'bah_guide',   icon: '🏛️', color: '#1565C0', title: 'BAH / OHA Guide',          description: 'Housing allowance lookup by ZIP and rank — includes OCONUS OHA rates',  route: '/bah-guide',          available: true, tags: ['housing','allowance','bah','oha'] },
  { id: 'tdy_optimizer',icon: '✈️', color: '#C8A800', title: 'TDY Per Diem Optimizer',  description: 'GSA FY2026 per diem rates — see how much you can pocket under the limit', route: '/tdy-optimizer',      available: true, tags: ['tdy','travel','per diem'] },
  { id: 'gs_pay',      icon: '🏛️', color: '#37474F', title: 'GS Pay Calculator',        description: 'Federal civilian GS pay by grade, step, and locality — with military comparison', route: '/gs-pay-calculator', available: true, tags: ['civilian','gs','federal','general schedule'] },
  { id: 'leave',       icon: '📅', color: '#0277BD', title: 'Leave Payout Calculator',  description: 'How much your unused leave days are worth when you separate',            route: '/leave-calculator',   available: true, tags: ['leave','terminal','separation'] },
  { id: 'reserves',    icon: '🎖️', color: '#1565C0', title: 'Reserve & Guard Hub',      description: 'Drill pay, retirement points, TRICARE Reserve Select, mobilization',    route: '/reserves',           available: true, tags: ['reserve','guard','drill','arng','selres'] },
];

export const PCS_TRAVEL: ToolItem[] = [
  { id: 'pcs',         icon: '🚚', color: '#1565C0', title: 'PCS Calculator',           description: 'Compare BAH and total pay between duty stations — find your best move',  route: '/pcs-calculator',     available: true, tags: ['pcs','move','duty station','bah compare'] },
  { id: 'dity',        icon: '📦', color: '#6A1B9A', title: 'Self-Move Pay (DITY/PPM)', description: 'How much the military pays you to move yourself — estimate your profit', route: '/dity-calculator',    available: true, tags: ['dity','ppm','move','truck'] },
  { id: 'tle',         icon: '🏨', color: '#00695C', title: 'TLA/TLE Reimbursement',   description: 'Hotel reimbursement during a PCS move — how many days and how much',     route: '/tle-calculator',     available: true, tags: ['tle','tla','lodging','hotel','pcs'] },
  { id: 'offbase',     icon: '🏠', color: '#1565C0', title: 'Off-Base vs Barracks',    description: 'BAH eligibility by grade — break-even rent and net savings analysis',    route: '/offbase-calculator', available: true, tags: ['barracks','off base','bah','housing','rent'] },
  { id: 'schools',     icon: '🏫', color: '#5C3D11', title: 'Schools Finder',           description: 'Find and compare rated schools near military installations',              route: '/schools-finder',     available: true, tags: ['schools','education','pcs','kids','family'] },
];

export const BUDGET_WEALTH: ToolItem[] = [
  { id: 'debt',        icon: '💳', color: '#B71C1C', title: 'Debt Payoff Planner',      description: 'Avalanche vs snowball — fastest path to debt-free with your payoff date', route: '/debt-payoff',        available: true, tags: ['debt','credit card','loans','payoff'] },
  { id: 'money_flow',  icon: '🗺️', color: '#00B27A', title: 'Where to Put Your Money',  description: '6-step order of operations for saving and investing each month',           route: '/money-flowchart',   available: true, tags: ['savings','invest','priority','order'] },
  { id: 'savings_rate',icon: '🎯', color: '#0277BD', title: 'Savings Rate Tracker',     description: 'Your savings percentage and how close you are to financial independence', route: '/savings-rate',       available: true, tags: ['savings','fire','fi','financial freedom'] },
  { id: 'roth_ira',    icon: '📈', color: '#6A1B9A', title: 'Roth IRA Tracker',         description: 'FY2026 contribution limits, balance tracker, and 30-year projection',    route: '/roth-ira',           available: true, tags: ['roth','ira','retirement','invest'] },
  { id: 'car_loan',    icon: '🚗', color: '#D32F2F', title: 'Car Loan Reality Check',   description: 'True cost of a car payment — monthly burden and TSP opportunity cost',   route: '/car-loan',           available: true, tags: ['car','loan','auto','vehicle','payment'] },
  { id: 'net_worth',   icon: '📈', color: '#00C8A8', title: 'Net Worth Tracker',        description: 'Assets vs liabilities — track your one true financial number over time', route: '/net-worth',          available: true, tags: ['net worth','assets','liabilities','wealth'] },
];

export const RETIREMENT_VA: ToolItem[] = [
  { id: 'retirement',  icon: '🏁', color: '#C8A800', title: 'Retirement Calculator',    description: 'BRS vs High-3 side by side — pension, TSP, and break-even analysis',   route: '/retirement-calculator', available: true, tags: ['retirement','brs','high3','pension','20 year'] },
  { id: 'tsp',         icon: '📊', color: '#00695C', title: 'TSP Deep Dive',            description: 'Fund guide, BRS match gap, and 30-year projection by allocation',        route: '/tsp-calculator',     available: true, tags: ['tsp','401k','retirement','invest','funds'] },
  { id: 'sbp',         icon: '🛡️', color: '#1A237E', title: 'Survivor Benefit Plan',   description: 'SBP premium, 55% annuity, break-even, and actuarial scenario',           route: '/sbp-calculator',     available: true, tags: ['sbp','survivor','spouse','pension','widow'] },
  { id: 'va_loan',     icon: '🏠', color: '#B71C1C', title: 'VA Loan Calculator',       description: 'How much home you can afford using your VA benefit — no PMI',            route: '/va-loan-calculator', available: true, tags: ['va loan','home','mortgage','house','buy'] },
  { id: 'va_disability',icon: '🎖️',color: '#B71C1C', title: 'VA Disability Calculator', description: 'Combined rating using the official VA formula — FY2026 compensation',   route: '/va-disability',      available: true, tags: ['va','disability','rating','compensation','100%'] },
  { id: 'gi_bill',     icon: '🎓', color: '#1A237E', title: 'GI Bill Calculator',       description: 'Chapter 33 BAH by ZIP, eligibility tiers, and remaining benefit',        route: '/gi-bill-calculator', available: true, tags: ['gi bill','education','college','chapter 33','mha'] },
];

export const DEPLOYMENT: ToolItem[] = [
  { id: 'deployment',         icon: '🪖', color: '#2E7D32', title: 'Deployment Pay Calculator',  description: 'IDP, CZTE, FSA, SDP — your full tax-free deployment pay breakdown',   route: '/deployment-calculator', available: true, tags: ['deploy','combat','idp','czte','tax free'] },
  { id: 'deployment_savings', icon: '💰', color: '#2E7D32', title: 'Deployment Savings Planner', description: 'CZTE/IDP toggles, SDP eligibility, and savings goal tracker',          route: '/deployment-savings',    available: true, tags: ['deploy','savings','goal','czte','sdp'] },
];

export const RESOURCES: ToolItem[] = [
  { id: 'les',         icon: '📄', color: '#1A237E', title: 'LES Decoder',               description: 'Every line on your pay statement explained — verify your math',          route: '/les-decoder',        available: true, tags: ['les','pay statement','entitlements','deductions'] },
  { id: 'tax_guide',   icon: '🧾', color: '#1A237E', title: 'Military Tax Guide',         description: 'What military pay is tax-free, how to file, and state exemptions',       route: '/tax-guide',          available: true, tags: ['tax','irs','state','w2','combat zone'] },
  { id: 'scra',        icon: '⚖️', color: '#1A237E', title: 'SCRA Legal Protections',    description: '6% interest cap, lease breaks, eviction protection — know your rights',  route: '/scra-guide',         available: true, tags: ['scra','legal','rights','interest','lease'] },
  { id: 'tricare',     icon: '🏥', color: '#00695C', title: 'TRICARE Estimator',          description: 'Compare Prime, Select, Overseas — copays, deductibles, out-of-pocket',  route: '/tricare-estimator',  available: true, tags: ['tricare','health','insurance','prime','select'] },
  { id: 'credit',      icon: '📊', color: '#C8A800', title: 'Credit Score Guide',         description: 'How your score works, what hurts it, and the roadmap to 800+',           route: '/credit-score',       available: true, tags: ['credit','score','fico','report','loan'] },
  { id: 'invest',      icon: '📈', color: '#2A9D8F', title: 'Investing Basics',           description: 'Index funds, TSP, Roth IRA — plain-English guide for service members',   route: '/invest-101',         available: true, tags: ['invest','index fund','etf','stock','market'] },
  { id: 'ets',         icon: '🎖️', color: '#2E7D32', title: 'Separation Checklist',      description: '12-month step-by-step transition timeline for getting out',               route: '/ets-checklist',      available: true, tags: ['ets','separation','transition','dd214','tap'] },
];

export const COMMAND_TOOLS: ToolItem[] = [
  { id: 'life_events',  icon: '📋', color: '#1565C0', title: 'Life Event Checklists',      description: 'PCS, promotion, deployment, marriage, newborn — mission-critical checklists', route: '/life-events',    available: true, tags: ['pcs','promotion','deploy','marriage','baby','checklist'] },
  { id: 'command_mode', icon: '🎖️', color: '#F0A500', title: 'Financial Readiness Worksheet', description: 'Self-generated pay worksheet — voluntary disclosure to chain of command', route: '/command-mode', available: true, tags: ['command','readiness','worksheet','export','share'] }, // = Brand.accent
];

export const ALL_TOOLS: ToolItem[] = [
  ...PAY_ENTITLEMENTS, ...PCS_TRAVEL, ...BUDGET_WEALTH, ...RETIREMENT_VA, ...DEPLOYMENT, ...RESOURCES, ...COMMAND_TOOLS,
];

export function getToolById(id: string): ToolItem | undefined {
  return ALL_TOOLS.find((t) => t.id === id);
}
