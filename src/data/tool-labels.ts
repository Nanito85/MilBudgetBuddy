import { ALL_TOOLS } from '@/data/tools-catalog';

/**
 * Route → display label/icon, for turning a raw pathname (what gets sent in
 * a `screen_view` analytics event, e.g. "/bah-guide") into something readable
 * in the admin "Tool Usage" chart.
 *
 * Every Tools-screen route is derived from data/tools-catalog.ts (the same
 * shared source used by app/(tabs)/tools.tsx and data/quick-actions.ts) so
 * there's only one place that types out each tool's title/icon — this used
 * to be a fully independent hand-typed copy of the same ~35 entries, with a
 * comment explaining that was deliberate to avoid importing the *screen*
 * file (app/(tabs)/tools.tsx) into a plain data module. Now that the shared
 * catalog is itself a plain data module with no screen-mounting side
 * effects, that concern no longer applies. Only the handful of non-Tools-
 * screen routes (tabs, /profile, /paywall) are still listed by hand below.
 *
 * Anything not listed here just falls back to a formatted version of the
 * route itself — a new screen added without a label entry still shows up,
 * just less prettily, instead of being dropped from the chart.
 */
export interface ToolLabel {
  title: string;
  icon: string;
}

const NON_TOOL_LABELS: Record<string, ToolLabel> = {
  // Tabs
  '/':          { title: 'Home',     icon: '🛡️' },
  '/budget':    { title: 'Budget',   icon: '💼' },
  '/kids':      { title: 'Kids',     icon: '👨‍👩‍👧' },
  '/tools':     { title: 'Tools',    icon: '🧰' },
  '/settings':  { title: 'Settings', icon: '⚙️' },

  // Other
  '/profile': { title: 'Profile',    icon: '🪖' },
  '/paywall': { title: 'Pro Paywall',icon: '⭐' },
};

export const TOOL_LABELS: Record<string, ToolLabel> = {
  ...NON_TOOL_LABELS,
  ...Object.fromEntries(ALL_TOOLS.map((t) => [t.route, { title: t.title, icon: t.icon }])),
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
