/**
 * Route → display label/icon, for turning a raw pathname (what gets sent in
 * a `screen_view` analytics event, e.g. "/bah-guide") into something readable
 * in the admin "Tool Usage" chart. Titles/icons are copied from the Tools
 * screen's menu data (src/app/(tabs)/tools.tsx) rather than importing it, so
 * this stays a plain data module with no screen-mounting side effects.
 *
 * Anything not listed here just falls back to a formatted version of the
 * route itself — a new screen added without a label entry still shows up,
 * just less prettily, instead of being dropped from the chart.
 */
export interface ToolLabel {
  title: string;
  icon: string;
}

export const TOOL_LABELS: Record<string, ToolLabel> = {
  // Tabs
  '/':          { title: 'Home',     icon: '🛡️' },
  '/budget':    { title: 'Budget',   icon: '💼' },
  '/kids':      { title: 'Kids',     icon: '👨‍👩‍👧' },
  '/tools':     { title: 'Tools',    icon: '🧰' },
  '/settings':  { title: 'Settings', icon: '⚙️' },

  // Pay & Entitlements
  '/pay-chart':           { title: 'Pay Chart',                  icon: '💰' },
  '/promotion-calculator':{ title: 'Promotion Pay Predictor',     icon: '⭐' },
  '/bah-guide':           { title: 'BAH / OHA Guide',             icon: '🏛️' },
  '/tdy-optimizer':       { title: 'TDY Per Diem Optimizer',      icon: '✈️' },
  '/gs-pay-calculator':   { title: 'GS Pay Calculator',           icon: '🏛️' },
  '/leave-calculator':    { title: 'Leave Payout Calculator',     icon: '📅' },
  '/reserves':            { title: 'Reserve & Guard Hub',         icon: '🎖️' },

  // PCS & Travel
  '/pcs-calculator':      { title: 'PCS Calculator',              icon: '🚚' },
  '/dity-calculator':     { title: 'Self-Move Pay (DITY/PPM)',    icon: '📦' },
  '/tle-calculator':      { title: 'TLA/TLE Reimbursement',       icon: '🏨' },
  '/offbase-calculator':  { title: 'Off-Base vs Barracks',        icon: '🏠' },
  '/schools-finder':      { title: 'Schools Finder',              icon: '🏫' },

  // Budget & Wealth
  '/debt-payoff':         { title: 'Debt Payoff Planner',         icon: '💳' },
  '/money-flowchart':     { title: 'Where to Put Your Money',     icon: '🗺️' },
  '/savings-rate':        { title: 'Savings Rate Tracker',        icon: '🎯' },
  '/roth-ira':            { title: 'Roth IRA Tracker',            icon: '📈' },
  '/car-loan':            { title: 'Car Loan Reality Check',      icon: '🚗' },
  '/net-worth':           { title: 'Net Worth Tracker',           icon: '📈' },

  // Retirement & Veterans
  '/retirement-calculator':{ title: 'Retirement Calculator',      icon: '🏁' },
  '/tsp-calculator':       { title: 'TSP Deep Dive',              icon: '📊' },
  '/sbp-calculator':       { title: 'Survivor Benefit Plan',      icon: '🛡️' },
  '/va-loan-calculator':   { title: 'VA Loan Calculator',         icon: '🏠' },
  '/va-disability':        { title: 'VA Disability Calculator',   icon: '🎖️' },
  '/gi-bill-calculator':   { title: 'GI Bill Calculator',         icon: '🎓' },

  // Deployment
  '/deployment-calculator':{ title: 'Deployment Pay Calculator',  icon: '🪖' },
  '/deployment-savings':   { title: 'Deployment Savings Planner', icon: '💰' },

  // Guides & Resources
  '/les-decoder':          { title: 'LES Decoder',                icon: '📄' },
  '/tax-guide':            { title: 'Military Tax Guide',         icon: '🧾' },
  '/scra-guide':           { title: 'SCRA Legal Protections',     icon: '⚖️' },
  '/tricare-estimator':    { title: 'TRICARE Estimator',          icon: '🏥' },
  '/credit-score':         { title: 'Credit Score Guide',         icon: '📊' },
  '/invest-101':           { title: 'Investing Basics',           icon: '📈' },
  '/ets-checklist':        { title: 'Separation Checklist',       icon: '🎖️' },

  // Financial Command
  '/life-events':          { title: 'Life Event Checklists',      icon: '📋' },
  '/command-mode':         { title: 'Financial Readiness Worksheet', icon: '🎖️' },

  // Other
  '/profile':              { title: 'Profile',                    icon: '🪖' },
  '/paywall':               { title: 'Pro Paywall',               icon: '⭐' },
  '/pcs-calculator/':       { title: 'PCS Calculator',            icon: '🚚' },
};

export function labelForRoute(route: string): ToolLabel {
  if (TOOL_LABELS[route]) return TOOL_LABELS[route];
  // Fallback: "/gi-bill-calculator" → "Gi Bill Calculator"
  const cleaned = route.replace(/^\//, '').replace(/[-/]/g, ' ').trim();
  const title = cleaned.length > 0
    ? cleaned.replace(/\b\w/g, (ch) => ch.toUpperCase())
    : route;
  return { title, icon: '❔' };
}
