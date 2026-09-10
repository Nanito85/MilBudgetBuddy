"""Generate src/data/oconus-cola.ts from the compensation-table fragment
(already produced by gen_oconus_comp.py) + the hand-transcribed Spendable
Income Table (from Spendable-Income-Table(2026-02-01).pdf) + the finalized
45-location OCONUS index mapping (from match_oconus.py + manual edge-case
resolution)."""

import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
COMP_FRAGMENT = os.path.join(SCRIPT_DIR, "comp_tables.ts.fragment")
OUT = os.path.join(REPO_ROOT, "src", "data", "oconus-cola.ts")

with open(COMP_FRAGMENT, encoding='utf-8') as f:
    comp_ts = f.read().strip()

# Spendable Income Table, effective 2026-02-01. Rows = annual compensation
# brackets (upper bound of each bracket, in $), columns = dependents 0,1,2,3,4,5+.
# Transcribed directly from the official PDF.
SPENDABLE_ROWS = [
    # (bracket floor $, [0,1,2,3,4,5+])
    (240000, [61650,65075,68500,71925,75350,78775]),
    (235000, [61020,64410,67800,71190,74580,77970]),
    (230000, [60390,63745,67100,70455,73810,77165]),
    (225000, [59760,63080,66400,69720,73040,76360]),
    (220000, [59040,62320,65600,68880,72160,75440]),
    (215000, [58410,61655,64900,68145,71390,74635]),
    (210000, [57690,60895,64100,67305,70510,73715]),
    (205000, [56970,60135,63300,66465,69630,72795]),
    (200000, [56160,59280,62400,65520,68640,71760]),
    (195000, [55440,58520,61600,64680,67760,70840]),
    (190000, [54720,57760,60800,63840,66880,69920]),
    (185000, [53910,56905,59900,62895,65890,68885]),
    (180000, [53100,56050,59000,61950,64900,67850]),
    (175000, [52290,55195,58100,61005,63910,66815]),
    (170000, [51480,54340,57200,60060,62920,65780]),
    (165000, [50580,53390,56200,59010,61820,64630]),
    (160000, [49770,52535,55300,58065,60830,63595]),
    (155000, [48870,51585,54300,57015,59730,62445]),
    (150000, [47970,50635,53300,55965,58630,61295]),
    (145000, [47070,49685,52300,54915,57530,60145]),
    (140000, [46170,48735,51300,53865,56430,58995]),
    (135000, [45270,47785,50300,52815,55330,57845]),
    (130000, [44280,46740,49200,51660,54120,56580]),
    (125000, [43290,45695,48100,50505,52910,55315]),
    (120000, [42300,44650,47000,49350,51700,54050]),
    (115000, [41310,43605,45900,48195,50490,52785]),
    (110000, [40320,42560,44800,47040,49280,51520]),
    (105000, [39330,41515,43700,45885,48070,50255]),
    (100000, [38250,40375,42500,44625,46750,48875]),
    (95000,  [37170,39235,41300,43365,45430,47495]),
    (90000,  [36090,38095,40100,42105,44110,46115]),
    (85000,  [35010,36955,38900,40845,42790,44735]),
    (80000,  [33930,35815,37700,39585,41470,43355]),
    (75000,  [32850,34675,36500,38325,40150,41975]),
    (0,      [31680,33440,35200,36960,38720,40480]),  # "<= $74,999"
]

# Finalized OCONUS location -> Locality Code / COLA Index mapping.
# (locationLabel must exactly match src/data/oha-rates.ts OHA_RATES entries)
# Index of 0 means "not currently COLA-eligible" (raw DoD index <=100 or no
# data published for that locality), which is common and NOT a bug — e.g.
# Okinawa currently has no OCONUS COLA at all.
LOCATIONS = [
    ('Yokota AB / Tokyo Area', 'JP065', 104),
    ('Okinawa (All Installations)', 'JP027', 0),
    ('CFAY Yokosuka / Camp Zama / NAF Atsugi', 'JP061', 106),
    ('Misawa AB', 'JP023', 0),
    ('Iwakuni MCAS, Japan', 'JP019', 0),
    ('Naval Base Sasebo, Japan', 'JP035', 104),
    ('Camp Humphreys, South Korea', 'KR025', 114),
    ('Osan AB, South Korea', 'KR025', 114),
    ('Camp Walker / Camp Henry, Daegu', 'KR045', 114),
    ('Camp Casey / Camp Red Cloud, South Korea', 'KR177', 104),
    ('Kunsan AB / Camp Carroll, South Korea', 'KR070', 106),
    ('Ramstein AB, Germany', 'DE700', 128),
    ('Stuttgart (HQ EUCOM / AFRICOM)', 'DE055', 132),
    ('Wiesbaden / Clay Kaserne', 'DE355', 136),
    ('Spangdahlem AB, Germany', 'DE741', 124),
    ('Grafenwöhr / Vilseck, Germany', 'DE231', 118),
    ('USAG Ansbach, Germany', 'DE228', 130),
    ('RAF Lakenheath, UK', 'GB352', 124),
    ('RAF Mildenhall, UK', 'GB352', 124),
    ('RAF Croughton / Alconbury, UK', 'GB218', 120),
    ('Aviano AB, Italy', 'IT001', 126),
    ('NAS Sigonella, Sicily', 'IT067', 124),
    ('Naval Support Activity Naples', 'IT055', 130),
    ('Naval Station Rota, Spain', 'ES019', 134),
    ('Morón AB, Spain', 'ES018', 136),
    ('NSA Bahrain (5th Fleet HQ)', 'BH001', 128),
    ('Al Udeid AB, Qatar', 'QA999', 132),
    ('Camp Lemonnier, Djibouti', 'DJ999', 134),
    ('Incirlik AB, Turkey', 'TR001', 0),
    ('USAG Italy (Vicenza)', 'IT073', 120),
    ('Camp Darby, Italy', 'IT035', 126),
    ('SHAPE / Chièvres, Belgium', 'BE019', 128),
    ('Lajes Field, Azores', 'PT015', 108),
    ('NSA Souda Bay, Greece', 'GR001', 126),
    ('Kuwait (Arifjan / Ali Al Salem / Buehring)', 'KW999', 118),
    ('Al Dhafra AB, UAE', 'AE001', 130),
    ('Prince Sultan AB, Saudi Arabia', 'SA999', 126),
    ('Muwaffaq Salti AB, Jordan', 'JO003', 126),
    ('Naval Base Guam / Andersen AFB / Camp Blaz', 'GU001', 122),
    ('Kwajalein Atoll (USAKA)', 'MH999', 114),
    ('Diego Garcia (BIOT)', 'DG999', 124),
    ('Pituffik Space Base (Thule)', 'GL001', 106),
    ('Naval Station Guantanamo Bay (GTMO)', 'CU005', 108),
    ('Soto Cano AB (JTF-Bravo), Honduras', 'HN001', 106),
    ('Fort Buchanan, Puerto Rico', 'PR080', 124),
]

out = []
out.append("""/**
 * OCONUS COLA (Cost-of-Living Allowance overseas) — official DoD data and
 * methodology, sourced directly from DTMO (defensetravel.dod.mil):
 *   - Annual Compensation tables: '2026 Compensation Tables.xlsx' (inside
 *     the CONUS COLA ASCII bulk download — DTMO publishes both in one zip).
 *   - Average Annual Spendable Income Table, effective 2026-02-01
 *     (Spendable-Income-Table PDF).
 *   - Locality COLA Indices, effective 2026-09-01 (Indices spreadsheet).
 *
 * DoD's real calculation (reverse-engineered from these three official
 * sources and cross-validated against the live DTMO rate calculator to the
 * cent for multiple grade/YOS combinations):
 *   1. Look up the member's Annual Compensation (grade x YOS bracket,
 *      with/without dependents).
 *   2. Bracket that figure into the Average Annual Spendable Income Table
 *      to get an annual spendable income (varies by # of dependents).
 *   3. Daily spendable income = annual spendable income / 360.
 *   4. Monthly COLA = daily spendable income x location index, where
 *      location index = (raw DoD index - 100) / 100 (e.g. raw 128 -> 0.28).
 *      A raw index at or below 100 means no COLA is payable there at all.
 *
 * NOTE ON DEPENDENTS: like this app's BAH/OHA data, only a with/without
 * dependents distinction is tracked (not an exact dependent count). The
 * Spendable Income Table has 6 columns (0,1,2,3,4,5+ dependents); this file
 * uses column 0 for "without dependents" and column 1 (one dependent) for
 * "with dependents" as the representative rate, consistent with how
 * with/without-dependents rates are used everywhere else in this app.
 *
 * Okinawa currently shows $0 OCONUS COLA (index 0) — this is CORRECT, not
 * a bug. DoD has not authorized COLA there as of the 2026-09-01 indices;
 * confirmed via both the live rate calculator and this bulk data.
 *
 * HOW TO UPDATE (quarterly — indices change; compensation/spendable-income
 * tables typically update annually or with a COLA/pay raise):
 *   1. Visit defensetravel.dod.mil/site/colaCalc.cfm (or the OCONUS COLA
 *      page under Allowances), download the current "Indices" spreadsheet
 *      and, if updated, the Spendable Income Table PDF and Compensation
 *      Tables xlsx (bundled with the CONUS COLA ASCII zip).
 *   2. Re-run scripts/gen_oconus_comp.py against the new compensation
 *      workbook, then scripts/gen_oconus_cola.py to regenerate this file
 *      (or hand-update OCONUS_LOCATIONS' index values, which is the part
 *      that actually changes quarter to quarter).
 *   3. Update OCONUS_COLA_DATA_QUARTER / OCONUS_COLA_EFFECTIVE_DATE below.
 */

import { PayGrade } from './bah-rates';

export const OCONUS_COLA_DATA_QUARTER = 'Q3 2026 (Sep)';
export const OCONUS_COLA_EFFECTIVE_DATE = '2026-09-01';

/** Flags the data as stale once ~100 days old (indices are typically
 * refreshed quarterly; this gives a comfortable buffer before nagging). */
export function isOconusColaDataStale(): boolean {
  const effective = new Date(OCONUS_COLA_EFFECTIVE_DATE);
  const ageMs = Date.now() - effective.getTime();
  return ageMs > 100 * 24 * 60 * 60 * 1000;
}

export function currentOconusColaQuarterLabel(): string {
  return OCONUS_COLA_DATA_QUARTER;
}

// YOS brackets — identical structure to CONUS COLA / most military pay tables.
export const OCONUS_COLA_YOS_BRACKETS: number[] = [0,2,3,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40];

""")
out.append(comp_ts)
out.append("""
/** Returns the compensation-table array index for the highest YOS bracket <= memberYOS. */
function bracketIndex(yos: number): number {
  let idx = 0;
  for (let i = 0; i < OCONUS_COLA_YOS_BRACKETS.length; i++) {
    if (yos >= OCONUS_COLA_YOS_BRACKETS[i]) idx = i;
    else break;
  }
  return idx;
}
""")

out.append("""
// Average Annual Spendable Income Table, effective 2026-02-01. Each row is
// [bracketFloor, [income at 0,1,2,3,4,5+ dependents]]; bracketFloor is the
// bottom of that compensation bracket (the last row, floor 0, covers
// "<= $74,999"). Brackets are listed highest-first to make the lookup a
// simple first-match walk.
interface SpendableRow { floor: number; income: number[]; }
const SPENDABLE_INCOME_TABLE: SpendableRow[] = [
""")
for floor, incomes in SPENDABLE_ROWS:
    out.append(f"  {{ floor: {floor}, income: [{','.join(str(v) for v in incomes)}] }},")
out.append("];\n")

out.append("""
/** Brackets the given annual compensation into the Spendable Income Table
 * and returns the annual spendable income for the given dependents column
 * (0 = no dependents, 1 = one dependent — see file header note). */
function annualSpendableIncome(annualCompensation: number, hasDependents: boolean): number {
  const col = hasDependents ? 1 : 0;
  for (const row of SPENDABLE_INCOME_TABLE) {
    if (annualCompensation >= row.floor) return row.income[col];
  }
  return SPENDABLE_INCOME_TABLE[SPENDABLE_INCOME_TABLE.length - 1].income[col];
}
""")

out.append("""
export interface OconusColaLocationInfo {
  localityCode: string;
  /** Raw DoD COLA index (baseline 100 = no COLA; e.g. 128 = 28% above baseline). 0 = not currently COLA-eligible at this location. */
  rawIndex: number;
}
""")

out.append(f"// {len(LOCATIONS)} OCONUS locations tracked by this app (matches OHA_RATES in oha-rates.ts).")
out.append("const OCONUS_COLA_LOCATIONS: Record<string, OconusColaLocationInfo> = {")
for label, code, idx in LOCATIONS:
    esc = label.replace("'", "\\'")
    out.append(f"  '{esc}': {{ localityCode: '{code}', rawIndex: {idx} }},")
out.append("};\n")

out.append("""
export function getOconusColaLocationInfo(locationLabel: string): OconusColaLocationInfo | null {
  return OCONUS_COLA_LOCATIONS[locationLabel] ?? null;
}

/** Monthly OCONUS COLA for a member at this OHA locationLabel, or null if
 * this app doesn't track OCONUS COLA data for that location at all. Returns
 * 0 (a real, valid result — distinct from null) when the location is
 * tracked but DoD's raw index is currently <= 100 (i.e. not authorized),
 * e.g. Okinawa as of the 2026-09-01 indices. */
export function getOconusCola(locationLabel: string, grade: PayGrade, yos: number, hasDependents: boolean): number | null {
  const info = getOconusColaLocationInfo(locationLabel);
  if (!info) return null;
  if (info.rawIndex <= 100) return 0;

  const compTable = hasDependents ? ANNUAL_COMPENSATION_WITH_DEP : ANNUAL_COMPENSATION_WITHOUT_DEP;
  const compRates = compTable[grade];
  if (!compRates) return 0;
  const annualComp = compRates[bracketIndex(yos)] ?? 0;
  if (annualComp <= 0) return 0;

  const annualSpendable = annualSpendableIncome(annualComp, hasDependents);
  const dailySpendable = annualSpendable / 360;
  const indexDecimal = (info.rawIndex - 100) / 100;
  // OCONUS COLA is officially a DAILY rate; this app (like DFAS LES
  // estimates generally) converts to a flat 30-day month for display,
  // matching this app's other per-diem-style conversions.
  return Math.round(dailySpendable * indexDecimal * 30);
}

/** The raw DAILY OCONUS COLA rate (DoD's native unit), before the 30-day
 * monthly conversion used by getOconusCola(). Exposed for anyone who wants
 * the unrounded per-diem figure directly. */
export function getOconusColaDaily(locationLabel: string, grade: PayGrade, yos: number, hasDependents: boolean): number | null {
  const info = getOconusColaLocationInfo(locationLabel);
  if (!info) return null;
  if (info.rawIndex <= 100) return 0;

  const compTable = hasDependents ? ANNUAL_COMPENSATION_WITH_DEP : ANNUAL_COMPENSATION_WITHOUT_DEP;
  const compRates = compTable[grade];
  if (!compRates) return 0;
  const annualComp = compRates[bracketIndex(yos)] ?? 0;
  if (annualComp <= 0) return 0;

  const annualSpendable = annualSpendableIncome(annualComp, hasDependents);
  const dailySpendable = annualSpendable / 360;
  const indexDecimal = (info.rawIndex - 100) / 100;
  return Math.round(dailySpendable * indexDecimal * 100) / 100;
}
""")

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print("Wrote oconus-cola.ts")
print("Locations:", len(LOCATIONS))
