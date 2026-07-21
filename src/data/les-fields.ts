/**
 * LES field dictionary — plain-English explanations for every line item
 * on the DFAS myPay Leave and Earnings Statement.
 *
 * Source: DFAS LES Guide (dfas.mil), DoD FMR Vol 7A, DoD Instruction 1340.22.
 */

export type LESSection = 'entitlements' | 'deductions' | 'leave' | 'admin';

export interface LESField {
  id: string;
  name: string;         // Exactly as printed on the LES
  plainName: string;    // Human-readable label
  section: LESSection;
  summary: string;      // One-sentence plain English
  detail: string;       // Full explanation
  formula?: string;     // How it's calculated
  tip?: string;         // Watch for this / common issue
}

export const LES_FIELDS: LESField[] = [

  // ── ENTITLEMENTS ──────────────────────────────────────────────────────────

  {
    id: 'basepay',
    name: 'BASEPAY',
    plainName: 'Basic Pay',
    section: 'entitlements',
    summary: 'Your core monthly salary based on rank and years of service.',
    detail: 'Basic Pay is your monthly salary set by the DoD pay tables (updated every January). It is taxable income. The amount is determined by your pay grade (E-1 through O-10) and your years of creditable service.',
    formula: 'DoD Pay Table [Grade][YOS] ÷ 2 (if mid-month)',
    tip: 'If your Basic Pay looks lower than expected, check that your Pay Entry Base Date (PEBD) is correct — an error there directly reduces your pay grade step.',
  },
  {
    id: 'bah',
    name: 'BAH',
    plainName: 'Basic Allowance for Housing',
    section: 'entitlements',
    summary: 'Tax-free housing allowance based on your duty station zip code and dependent status.',
    detail: 'BAH covers the cost of off-post housing in your duty station area. Rates are set each January and vary by MHA (Military Housing Area) zip code. BAH is NOT taxable income — it does not count toward your gross pay for tax purposes. If you live in the barracks / single government quarters (no dependents), you receive Partial BAH instead — a flat $50.10/month regardless of rank or location. If you live in on-base government family housing, you receive no BAH at all — housing is provided in place of the allowance.',
    formula: 'DoD BAH Table [MHA Zip][Grade][With or Without Dependents]',
    tip: 'BAH should match the rate for your duty station zip, not where you currently live off post. If you moved to a new duty station and BAH hasn\'t updated, contact your S1.',
  },
  {
    id: 'bas',
    name: 'BAS',
    plainName: 'Basic Allowance for Subsistence',
    section: 'entitlements',
    summary: 'Tax-free monthly food allowance — flat rate by enlisted or officer status.',
    detail: 'BAS is a flat monthly amount to offset the cost of food. It is not taxable. Enlisted members receive a higher rate than officers (officers historically were assumed to have higher pay). BAS continues during deployment and does not depend on whether you eat in the dining facility.',
    formula: 'Enlisted: $492.00/mo | Officer: $325.71/mo (FY2026)',
    tip: 'If you are being deducted a "MEAL DEDUCTION" (Separate Rations offset), it will appear under deductions. This happens when you are on orders to a location with a government dining facility.',
  },
  {
    id: 'idp',
    name: 'HAZPAY / IDP',
    plainName: 'Imminent Danger Pay (IDP / HFP)',
    section: 'entitlements',
    summary: '$225/month for serving in a designated imminent danger or hostile fire area.',
    detail: 'Imminent Danger Pay and Hostile Fire Pay are the same rate ($225/month) and cover service in areas designated by the Secretary of Defense. Any portion of a calendar month spent in a designated zone qualifies for the full month\'s payment. This pay does NOT by itself create a Combat Zone Tax Exclusion — that requires a separate CZTE designation.',
    formula: '$225.00 flat — any day in zone = full month',
    tip: 'Watch the start date carefully. If your orders say you entered the zone on the 2nd, you should still receive the full month. If the LES shows a pro-rated amount, that may be an error.',
  },
  {
    id: 'fsa',
    name: 'FSA',
    plainName: 'Family Separation Allowance',
    section: 'entitlements',
    summary: '$250/month when deployed away from your family for 30+ consecutive days.',
    detail: 'FSA compensates for the added costs of maintaining a separate household during extended separations. It requires: (1) active duty orders, (2) you have dependents, and (3) you have been separated for 30 consecutive days. It is not paid the first partial month — it begins on day 31.',
    formula: '$250.00/month — begins on day 31 of separation',
    tip: 'If you are in a combat zone AND qualify for FSA, both IDP and FSA should appear on your LES. Missing FSA after 30 days is a common error — have your admin section initiate an FSA transaction.',
  },
  {
    id: 'hdp',
    name: 'HDP-L',
    plainName: 'Hardship Duty Pay – Location',
    section: 'entitlements',
    summary: '$50–$150/month for assignment to a hardship duty location.',
    detail: 'HDP-L compensates for unusually harsh living conditions at designated locations. The rate ($50, $100, or $150/month) is set based on the hardship level of the specific location. It is separate from IDP — you can receive both if the location is both a hardship location and an IDP zone.',
    formula: '$50, $100, or $150/month depending on location designation',
  },
  {
    id: 'avia_career',
    name: 'AVIA CR INC',
    plainName: 'Aviation Career Incentive Pay (ACIP / Flight Pay)',
    section: 'entitlements',
    summary: 'Monthly pay for rated/career aviators based on years of aviation service.',
    detail: 'ACIP is paid to officers who hold an aeronautical designation and have made a commitment to remain in aviation. Rates vary from $125/month to $840/month depending on years of aviation service. Warrant officer aviators receive different rates. ACIP is taxable.',
    formula: 'DoD ACIP table [Years of Aviation Service]',
  },
  {
    id: 'jump_pay',
    name: 'JUMP',
    plainName: 'Parachute Pay (Jump Pay)',
    section: 'entitlements',
    summary: '$150/month for rated parachutists who perform a jump each month.',
    detail: 'Hazardous Duty Incentive Pay for parachute jumping. Requires at least one jump per month to receive. HALO-qualified personnel receive higher rates. This pay appears under the "HAZARDOUS DUTY" category on some LES formats.',
    formula: '$150/month (static line) | $225/month (HALO/HAHO)',
    tip: 'If you didn\'t jump that month, you should NOT see this pay. If you see it for a no-jump month, it could indicate a system error — report to finance.',
  },
  {
    id: 'srb',
    name: 'SRB',
    plainName: 'Selective Reenlistment Bonus (SRB)',
    section: 'entitlements',
    summary: 'Reenlistment bonus paid in lump sum or installments for critical MOS/rates.',
    detail: 'SRB is a cash bonus for reenlisting into a skill the military is having trouble retaining. Can be paid as a lump sum or in annual installments. The SRB amount is tracked in a special LES field showing total authorized, total paid, and remaining balance. SRB is taxable income in the year received.',
    tip: 'Watch the SRB tracking fields in the admin section of your LES. The "SRB/ACCRU" field shows accrued balance. If installments stop showing up on anniversary dates, contact your retention NCO.',
  },
  {
    id: 'clothing',
    name: 'CLOTHING',
    plainName: 'Clothing Allowance',
    section: 'entitlements',
    summary: 'Annual allowance to maintain your uniform — usually paid once per year.',
    detail: 'Enlisted members receive an annual clothing allowance to offset the cost of replacing worn uniforms and equipment. The rate depends on years of service. Officers do not receive a clothing allowance (they receive an initial uniform allowance at commissioning). The annual payment typically appears once per year on the anniversary of your service entry date.',
  },
  {
    id: 'tle',
    name: 'TLE',
    plainName: 'Temporary Lodging Expense (TLE)',
    section: 'entitlements',
    summary: 'Reimbursement for temporary lodging during a PCS move (CONUS).',
    detail: 'TLE offsets lodging costs during the transition period of a PCS move, limited to 21 days total, split between your old duty station (before departure) and new duty station (after arrival) as your orders authorize. The daily rate is based on your family size and the local per diem rate, capped at $290/day combined. TLE is not taxable.',
    formula: 'Per diem rate × family % (65% alone, 100% +1 dep, +35%/+25% per additional dep) × days, capped at $290/day (max 21 days)',
  },
  {
    id: 'cola',
    name: 'COLA',
    plainName: 'Cost of Living Allowance (CONUS COLA)',
    section: 'entitlements',
    summary: 'Additional allowance for high-cost CONUS locations where BAH does not fully cover cost of living.',
    detail: 'CONUS COLA is paid at a small number of very high cost-of-living locations in the continental US (primarily Hawaii non-OCONUS equivalent). It supplements BAH where housing costs alone don\'t capture total cost differences. COLA is taxable.',
  },
  {
    id: 'oha',
    name: 'OHA',
    plainName: 'Overseas Housing Allowance',
    section: 'entitlements',
    summary: 'OCONUS equivalent of BAH — covers rental costs at your overseas duty station.',
    detail: 'OHA is paid instead of BAH when stationed overseas. Unlike BAH, OHA is based on actual documented rental costs up to a maximum rate. You also receive a Move-In Housing Allowance (MIHA) for one-time setup costs and a Utility/Recurring Maintenance Allowance (UTIL) for monthly utilities.',
    tip: 'OHA requires you to submit your rental contract through your housing office. If you are not receiving OHA after submitting, check that housing has processed your lease.',
  },

  // ── DEDUCTIONS ─────────────────────────────────────────────────────────────

  {
    id: 'fica_ss',
    name: 'FICA SOC SEC TAX',
    plainName: 'Social Security Tax (FICA)',
    section: 'deductions',
    summary: '6.2% of basic pay, up to the annual wage base.',
    detail: 'Social Security tax (OASDI) is 6.2% of your basic pay up to the annual wage base ($176,100 in 2025). Note: only BASIC PAY is subject to FICA — allowances (BAH, BAS) are not. If you deploy to a combat zone, FICA is deferred (not waived) and may be collected in bulk later.',
    formula: 'Basic Pay × 6.2% (capped at annual wage base)',
    tip: 'Deployed to a combat zone? FICA deductions are deferred, not eliminated. They will be collected in December or when you return. Don\'t spend that money.',
  },
  {
    id: 'fica_med',
    name: 'FICA MED TAX',
    plainName: 'Medicare Tax (FICA)',
    section: 'deductions',
    summary: '1.45% of basic pay — no wage base cap.',
    detail: 'Medicare tax is 1.45% of basic pay with no upper limit. Like Social Security, only basic pay (not allowances) is subject to this tax. This funds Medicare Part A.',
    formula: 'Basic Pay × 1.45% (no cap)',
  },
  {
    id: 'fed_tax',
    name: 'FED TAXES',
    plainName: 'Federal Income Tax Withholding',
    section: 'deductions',
    summary: 'Federal income tax withheld based on your W-4 on file.',
    detail: 'Federal income tax is withheld from your taxable income (basic pay + special pays). BAH and BAS are NOT taxable. The amount withheld depends on the W-4 information you filed (filing status, allowances/adjustments). You can change your W-4 at any time through myPay. In a CZTE combat zone, basic pay is excluded from federal tax for enlisted/warrant; officers are capped at E9 max pay + IDP.',
    formula: 'Taxable income × IRS withholding tables per W-4',
    tip: 'If you recently changed your marital status or had a child, update your W-4 through myPay to avoid over- or under-withholding. Significant life changes can result in unexpected tax bills.',
  },
  {
    id: 'state_tax',
    name: 'STATE TAXES',
    plainName: 'State Income Tax Withholding',
    section: 'deductions',
    summary: 'State income tax based on your state of legal residence, not where you\'re stationed.',
    detail: 'Under the Servicemembers Civil Relief Act (SCRA), you pay state taxes based on your state of legal residence (domicile), not your duty station state. ~17 states exempt military basic pay entirely. Verify your state of legal residence with your S1 is correct — it directly determines your state tax withholding.',
    tip: 'If you are stationed in a high-tax state but your home state is tax-free (TX, FL, WA, etc.), you should NOT see state tax deducted. If you do, your home state may be set incorrectly — file a DD Form 2058 to correct it.',
  },
  {
    id: 'tsp',
    name: 'TSP CONTRIB',
    plainName: 'Thrift Savings Plan Contribution',
    section: 'deductions',
    summary: 'Your elected TSP contribution — taken from basic pay before or after tax.',
    detail: 'TSP is the military\'s retirement investment account, similar to a 401(k). You can contribute traditional (pre-tax) or Roth (post-tax). The 2026 IRS limit is $24,500/year ($32,500 if 50+). Under BRS, the government matches up to 4% of basic pay after year 2. The match does not appear as a deduction — it shows as a separate entitlement on your LES.',
    formula: 'Basic Pay × your elected contribution %',
    tip: 'Under BRS, if you are not contributing at least 5% you are leaving government match money on the table. The first 3% is matched dollar-for-dollar; the next 2% is matched 50 cents on the dollar.',
  },
  {
    id: 'tsp_defer',
    name: 'TSP DEFERRED',
    plainName: 'TSP Year-to-Date Tax-Deferred Amount',
    section: 'deductions',
    summary: 'Running total of pre-tax TSP contributions — informational only, not a new deduction.',
    detail: 'This field shows the cumulative total of your traditional (pre-tax) TSP contributions for the year. It is informational — it tracks how close you are to the annual IRS contribution limit. When this number approaches $24,500, additional pre-tax contributions will stop.',
  },
  {
    id: 'sgli',
    name: 'SGLI',
    plainName: 'Servicemembers\' Group Life Insurance',
    section: 'deductions',
    summary: '$29/month for $500,000 of life insurance coverage (default).',
    detail: 'SGLI provides low-cost life insurance to all active duty members. The standard election is $500,000 coverage at $29/month. You can reduce coverage in $50,000 increments or opt out entirely. Family SGLI (FSGLI) provides coverage for spouses and dependent children at an additional premium.',
    formula: 'Coverage ÷ $1,000 × $0.058 (standard rate)',
    tip: 'SGLI is one of the cheapest life insurance rates available. Opting out to save $29/month is usually not worth the risk — especially if you have dependents.',
  },
  {
    id: 'dental',
    name: 'DENTAL',
    plainName: 'TRICARE Dental Program (TDP) Premium',
    section: 'deductions',
    summary: 'Your share of the TRICARE dental plan premium.',
    detail: 'Active duty members receive free dental care through military treatment facilities. The TDP premium is for family dental coverage (spouse and dependents). The member\'s individual dental care is covered at no cost through the military dental clinic — the premium shown is for family enrollment only.',
    tip: 'The family dental premium shown is split between the member and the government. If the amount seems high, verify your enrollment tier (enrolled vs not enrolled).',
  },
  {
    id: 'mid_mo',
    name: 'MID-MO PAY',
    plainName: 'Mid-Month Pay Advance',
    section: 'deductions',
    summary: 'The advance payment you received on the 1st or 15th — deducted at end of month.',
    detail: 'Active duty members are paid semi-monthly: an advance on the 1st (or 15th) and the balance at end of month (EOM). The mid-month pay shown here is the amount already paid to you that is being offset from the current period\'s entitlements. This is not a penalty — it is just showing the reconciliation math.',
    formula: 'Gross ÷ 2 — shown as a deduction against the full-month entitlement',
    tip: 'Your actual take-home is the EOM NET AMOUNT at the bottom of the LES, not the gross entitlement total minus all deductions plus this line.',
  },
  {
    id: 'allotment',
    name: 'ALLOTMENT',
    plainName: 'Discretionary Allotment',
    section: 'deductions',
    summary: 'A fixed recurring payment directed to a bank, savings account, or creditor.',
    detail: 'Allotments are voluntary instructions to direct a fixed dollar amount from your pay to a specific destination every month — savings accounts, car payments, rent, family support, etc. Up to 6 allotments can be active at a time. You set them up and change them through myPay.',
    tip: 'Allotments are NOT flexible — they process every month regardless of whether you have enough money. If your pay changes (pay raise, field problem deductions), your allotment still processes and can overdraft your account.',
  },
  {
    id: 'debt',
    name: 'DEBT / COLLECTION',
    plainName: 'Debt Repayment / Collection',
    section: 'deductions',
    summary: 'Government debt being repaid — overpayments, travel advances, or other balances.',
    detail: 'If you owe the government money (pay overpayment, outstanding travel advance, government equipment damage), DFAS will establish a debt and begin collecting it by deducting from your pay. The collection will show here with a description. Debt collection cannot reduce your pay below the required minimum net pay.',
    tip: 'Always check what a debt collection is for. If you disagree with the debt, you have 30 days from the first notice to request a waiver through your chain of command. Do not ignore debt collection letters.',
  },

  // ── LEAVE ──────────────────────────────────────────────────────────────────

  {
    id: 'leave_bf',
    name: 'BF BAL',
    plainName: 'Brought Forward Balance',
    section: 'leave',
    summary: 'Leave balance carried over from the previous month.',
    detail: 'This is your leave balance at the start of the current pay period, carried over from the previous period. It should exactly match last month\'s "EOM BAL" field.',
    tip: 'If BF BAL does not match last month\'s EOM BAL, report it to your admin section immediately. This can cause cumulative leave discrepancies that are hard to unwind later.',
  },
  {
    id: 'leave_ernd',
    name: 'ERND',
    plainName: 'Leave Earned This Period',
    section: 'leave',
    summary: '2.5 days accrued for the current month.',
    detail: 'Active duty members earn 2.5 days of leave per calendar month (30 days per year). This field shows the days accrued in the current pay period. Partial months (first/last month) earn a prorated amount.',
    formula: '2.5 days per full month of active duty',
    tip: 'In your first month of active duty, you may earn a partial amount based on the entry date. Verify this matches your actual start date.',
  },
  {
    id: 'leave_used',
    name: 'USED',
    plainName: 'Leave Used This Period',
    section: 'leave',
    summary: 'Days of approved leave taken in this pay period.',
    detail: 'Shows the leave days recorded as used in this pay period. This should match your DA 31 (Army) / AF Form 988 / leave request approval. If you didn\'t take leave this period, this should be 0.',
    tip: 'Verify this matches your approved leave chit. Unauthorized leave will also appear here and can result in AWOL status — always have your leave approved in writing before departing.',
  },
  {
    id: 'leave_lost',
    name: 'LOST',
    plainName: 'Leave Lost / Forfeited',
    section: 'leave',
    summary: 'Leave forfeited because the balance exceeded the 60-day carryover limit.',
    detail: 'Leave balances exceeding 60 days are forfeited at the end of the fiscal year (Sep 30) unless you have an approved Use or Lose waiver. If this field shows anything other than 0, you lost leave that had real monetary value — request leave more proactively.',
    formula: 'Days over 60 at Sep 30 FY end',
    tip: 'If LOST shows a number, calculate what it cost you: (Basic Pay × 12 ÷ 365) × days lost. Request leave before Sep 30 if your balance is approaching 60 days.',
  },
  {
    id: 'leave_eom',
    name: 'EOM BAL',
    plainName: 'End of Month Leave Balance',
    section: 'leave',
    summary: 'Total leave days remaining at the end of this pay period.',
    detail: 'Your leave balance after all accruals and usage this period. This number carries forward as next month\'s BF BAL. This is the balance you can use for leave, terminal leave at ETS, or receive as a payout at separation (capped at 60 days paid).',
    formula: 'BF BAL + ERND − USED − LOST',
  },
  {
    id: 'leave_use_lose',
    name: 'USE/LOSE',
    plainName: 'Use or Lose',
    section: 'leave',
    summary: 'Days that will be forfeited at fiscal year end (Sep 30) if not used.',
    detail: 'This field projects how many days will be lost at Sep 30 if you don\'t take additional leave. It appears on LES statements as the fiscal year end approaches. Any number here is money you will lose — plan leave immediately.',
    tip: 'If this field shows anything > 0 in August, request leave immediately or submit a Use or Lose waiver to your commander if operational needs prevented you from taking leave.',
  },

  // ── ADMIN / IDENTIFICATION ─────────────────────────────────────────────────

  {
    id: 'pebd',
    name: 'PEBD',
    plainName: 'Pay Entry Base Date',
    section: 'admin',
    summary: 'The date used to calculate years of service for pay purposes.',
    detail: 'PEBD is the notional date that gives you credit for all your active duty and qualifying Reserve/Guard service. It directly determines your YOS step on the pay table. PEBD is adjusted forward for any time you were AWOL, lost time, or time gaps. It is not always your actual entry date.',
    tip: 'Verify your PEBD matches your actual service history. A wrong PEBD means you are being paid at the wrong pay step. Even a 1-year error can cost you thousands per year.',
  },
  {
    id: 'diems',
    name: 'DIEMS',
    plainName: 'Date Initially Entered Military Service',
    section: 'admin',
    summary: 'The date you first entered ANY military service — determines which retirement system you fall under.',
    detail: 'DIEMS is used to determine your retirement eligibility and which system applies: pre-BRS members (DIEMS before Jan 1, 2018) are under Legacy/High-3. Members with DIEMS on or after Jan 1, 2018 fall under BRS automatically. This date cannot be changed except to correct a genuine error.',
    tip: 'If you served in the reserves/guard before going active, your DIEMS may be earlier than your active duty entry date. This is correct — it reflects your first military affiliation.',
  },
  {
    id: 'ets',
    name: 'ETS',
    plainName: 'Expiration Term of Service',
    section: 'admin',
    summary: 'Your contract end date — when your current enlistment or service obligation expires.',
    detail: 'ETS is the date your current service obligation ends. After this date you are eligible for separation unless you reenlist or extend. Verify this date matches your reenlistment/extension documents. If you have taken terminal leave, your final day of active duty will precede the ETS by the number of terminal leave days.',
    tip: 'If you are approaching ETS and the date looks wrong, check that any reenlistment or extension has been processed and reflected in your records.',
  },
  {
    id: 'grade',
    name: 'GRADE',
    plainName: 'Pay Grade',
    section: 'admin',
    summary: 'Your current pay grade — used to look up your basic pay on the DoD pay table.',
    detail: 'Pay grade runs from E-1 through E-9 for enlisted, W-1 through W-5 for warrant officers, and O-1 through O-10 for commissioned officers. Promotions should update here on the effective date of your promotion orders. Verify this matches your current rank.',
  },
  {
    id: 'yrs_svc',
    name: 'YRS SVC',
    plainName: 'Years of Service (for pay)',
    section: 'admin',
    summary: 'Your creditable years of service calculated from your PEBD — determines your pay step.',
    detail: 'This is the number of years counted from your PEBD to the current date, rounded down to whole years. This number is what determines which column of the pay table your grade falls in. At certain milestones (2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20 years) your base pay automatically increases.',
    tip: 'If this number looks off, re-verify your PEBD. One year of error here can mean the wrong pay step.',
  },
  {
    id: 'net_amt',
    name: 'NET AMT',
    plainName: 'Net Pay (Take-Home)',
    section: 'admin',
    summary: 'Your actual take-home pay deposited to your bank — the bottom line.',
    detail: 'NET AMT is what gets deposited. It is: Total Entitlements − Total Deductions − Total Allotments. This is the number to reconcile with your bank statement. If it differs from what was deposited, check for suspended allotments or LES corrections.',
    formula: 'Total Entitlements − Total Deductions − Total Allotments',
    tip: 'Always compare NET AMT to your bank deposit within 3 days of payday. Discrepancies should be reported to finance within 60 days — the DoD Debt Management policy limits correction windows.',
  },
  {
    id: 'ytd_ent',
    name: 'YTD ENT',
    plainName: 'Year-to-Date Entitlements',
    section: 'admin',
    summary: 'Cumulative total of all pay and allowances received this calendar year.',
    detail: 'Running total of all money credited to you since January 1. This includes taxable and non-taxable entitlements combined. Your W-2 Box 1 (federal wages) will be lower than this number because it excludes tax-free allowances (BAH, BAS).',
  },
  {
    id: 'ytd_ded',
    name: 'YTD DED',
    plainName: 'Year-to-Date Deductions',
    section: 'admin',
    summary: 'Cumulative total of all deductions since January 1.',
    detail: 'Running total of all taxes, insurance premiums, TSP contributions, and other deductions taken so far this year. Useful for tax planning. Your W-2 Box 4 (Social Security withheld) and Box 6 (Medicare withheld) should reconcile to the FICA amounts here.',
  },
  {
    id: 'remarks',
    name: 'REMARKS',
    plainName: 'Remarks / Remarks Section',
    section: 'admin',
    summary: 'Administrative notes, pay adjustments, or one-time transactions this period.',
    detail: 'The REMARKS block contains plain-text notes about anything unusual on this LES — retroactive pay adjustments, one-time bonuses, corrections, or informational messages from DFAS. Always read this section. Pay adjustment explanations, CZTE notifications, and SRB installment tracking often appear here.',
    tip: 'If you see an unexpected dollar amount on your LES and can\'t find it in the line items, check REMARKS. Retroactive pay corrections often only appear as a single combined adjustment and are explained in remarks.',
  },
];

// Build lookup
const FIELD_MAP = new Map<string, LESField>(LES_FIELDS.map((f) => [f.id, f]));
export function getLESField(id: string): LESField | undefined {
  return FIELD_MAP.get(id);
}

export function searchLESFields(query: string): LESField[] {
  if (!query.trim()) return LES_FIELDS;
  const q = query.toLowerCase();
  return LES_FIELDS.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.plainName.toLowerCase().includes(q) ||
      f.summary.toLowerCase().includes(q),
  );
}

// ── Common LES errors (Red Flags) ─────────────────────────────────────────────

export const RED_FLAGS = [
  {
    icon: '🚨',
    title: 'Wrong Pay Grade on LES',
    severity: 'HIGH' as const,
    body: 'Your GRADE field doesn\'t match your current rank. Promotion orders have an effective date — if that date has passed and your LES still shows the old grade, contact your S1 immediately. Every day at the wrong grade is money not received.',
    action: 'Provide your promotion orders to your S1. Finance can process a retroactive correction.',
  },
  {
    icon: '🚨',
    title: 'Wrong PEBD — Wrong Pay Step',
    severity: 'HIGH' as const,
    body: 'Your Pay Entry Base Date (PEBD) determines your years-of-service step on the pay table. If PEBD is off by even one year, you are paid at the wrong step. This is a common error when service gaps, breaks, or reserve time were not properly credited.',
    action: 'Pull your service record (ERB/ORB/SURF) and compare PEBD to your actual entry dates. Submit a DA 3508 or equivalent for correction.',
  },
  {
    icon: '🚨',
    title: 'State Tax Deducted — Wrong Home State',
    severity: 'HIGH' as const,
    body: 'Under the SCRA, you pay state taxes based on your legal residence (domicile), not your duty station. If you\'re from a no-tax state (TX, FL, WA, AK, SD, WY, NV, TN, NH) but your LES shows state tax being deducted, your home state is set wrong in DFAS.',
    action: 'Submit DD Form 2058 (State of Legal Residence Certificate) to your S1. Request a refund of incorrectly withheld state taxes.',
  },
  {
    icon: '⚠️',
    title: 'Missing BAH — Recently Acquired Dependents',
    severity: 'MEDIUM' as const,
    body: 'If you recently married or had a child and are not yet receiving BAH With Dependents, you are leaving money on the table. BAH with dependents is higher than without. The effective date is typically the date of marriage/birth, but it must be submitted.',
    action: 'Submit your marriage certificate / birth certificate to your S1 to update dependent status in DEERS and trigger the BAH adjustment.',
  },
  {
    icon: '⚠️',
    title: 'No FSA After 30+ Days Deployed',
    severity: 'MEDIUM' as const,
    body: 'If you have dependents and have been deployed for more than 30 consecutive days but FSA ($250/month) is not appearing on your LES, that is an entitlement not being paid.',
    action: 'Have your admin section initiate an FSA transaction. Retroactive payment for missed months is possible — document the deployment dates.',
  },
  {
    icon: '⚠️',
    title: 'FICA Still Deducted in Combat Zone',
    severity: 'MEDIUM' as const,
    body: 'In a CZTE-designated combat zone, FICA is supposed to be deferred (not collected). If you see FICA SOC SEC TAX continuing to be deducted at full rate after entering a combat zone, the CZTE flag may not have been set.',
    action: 'Contact your unit S1 to ensure your CZTE effective date is entered. Note: deferred FICA will eventually be collected in a lump sum.',
  },
  {
    icon: '⚠️',
    title: 'Use/Lose Balance Above 0 in August',
    severity: 'MEDIUM' as const,
    body: 'The USE/LOSE field shows days that will be forfeited at Sep 30. If it shows more than 0 in August or September, you need to take leave immediately or submit a Use or Lose waiver (if denied leave for operational reasons).',
    action: 'Request leave immediately, or submit a Use or Lose memorandum through your chain of command if mission requirements prevented you from taking leave.',
  },
  {
    icon: '💡',
    title: 'TSP Below 5% Under BRS',
    severity: 'INFO' as const,
    body: 'Under the Blended Retirement System (BRS), the government matches TSP contributions up to 5% of basic pay. If your TSP CONTRIB is below 5%, you are declining free matching contributions.',
    action: 'Log in to myPay and increase your TSP contribution to at least 5% to capture the full government match.',
  },
  {
    icon: '💡',
    title: 'No Roth TSP Despite Combat Zone',
    severity: 'INFO' as const,
    body: 'In a combat zone (CZTE), your basic pay is not taxed. TSP contributions made during this period can be Roth (post-tax) and since the money was never taxed, you get tax-free growth AND tax-free withdrawal — essentially triple tax advantage.',
    action: 'Switch to Roth TSP contributions on myPay while in a CZTE combat zone. You can contribute up to $69,000/year (limit increases in combat zones).',
  },
];
