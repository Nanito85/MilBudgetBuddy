/**
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


const ANNUAL_COMPENSATION_WITH_DEP: Record<PayGrade, number[]> = {
  E1: [74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708,74708],
  E2: [76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558,76558],
  E3: [78918,80593,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314,82314],
  E4: [80256,81768,83454,85110,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585,86585],
  E5: [85079,87479,89148,90756,92290,94075,94972,95221,95221,95221,95221,95221,95221,95221,95221,95221,95221,95221,95221,95221,95221],
  E6: [89395,92610,94161,95673,97241,100786,102163,104753,105548,106125,106802,106802,106802,106802,106802,106802,106802,106802,106802,106802,106802],
  E7: [95252,98630,100179,102218,103797,106461,107965,110911,113831,115822,117939,118759,121513,122989,128620,128620,128620,128620,128620,128620,128620],
  E8: [0,0,0,0,0,113601,116607,118465,120690,123102,127458,129668,133477,135825,141608,141608,143753,143753,143753,143753,143753],
  E9: [0,0,0,0,0,0,130910,132786,135427,138575,141751,146820,151125,155641,162562,162562,168821,168821,175417,175417,182346],
  W1: [88854,92963,94066,96369,99044,103254,105676,109075,112401,115022,117438,120364,120364,120364,120364,120364,120364,120364,120364,120364,120364],
  W2: [100255,104280,105507,106353,109355,114943,117722,120443,123781,126391,128749,131575,133484,135145,135145,135145,135145,135145,135145,135145,135145],
  W3: [107935,109918,112457,113328,116136,121659,127411,130122,133291,136922,143481,147896,150540,153355,157185,157185,157185,157185,157185,157185,157185],
  W4: [114840,120028,122144,124229,127825,131378,135232,141328,146682,151775,155954,160020,165986,170892,176489,176489,179308,179308,179308,179308,179308],
  W5: [0,0,0,0,0,0,0,0,0,0,0,168970,175956,181162,186280,186280,193189,193189,200421,200421,208039],
  O1E: [0,0,0,106945,110423,112900,115427,117911,121317,121317,121317,121317,121317,121317,121317,121317,121317,121317,121317,121317,121317],
  O2E: [0,0,0,122011,123609,126133,130402,133794,136563,136563,136563,136563,136563,136563,136563,136563,136563,136563,136563,136563,136563],
  O3E: [0,0,0,135664,140461,145720,149108,154692,159416,162121,165813,165813,165813,165813,165813,165813,165813,165813,165813,165813,165813],
  O1: [88453,90049,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403,98403],
  O2: [98552,104615,114399,116944,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542,118542],
  O3: [110112,118989,124947,132295,137001,142261,145648,151233,154157,154157,154157,154157,154157,154157,154157,154157,154157,154157,154157,154157,154157],
  O4: [125574,138050,144645,146099,152208,158763,166935,173275,177690,180225,181691,181691,181691,181691,181691,181691,181691,181691,181691,181691,181691],
  O5: [143022,155515,163216,164666,169479,172346,178670,183317,189320,198001,201871,205697,210043,210043,210043,210043,210043,210043,210043,210043,210043],
  O6: [165056,176733,185279,185279,185811,191777,192569,192569,200385,213385,221013,228642,232983,237379,245953,245953,248658,248658,248658,248658,248658],
  O7: [205601,212035,215012,217384,221665,225902,230791,235669,240572,256269,269599,269599,269599,269599,270667,270667,274827,274827,274827,274827,274827],
  O8: [233782,239247,242865,243880,248524,256269,258075,265435,267556,273896,283074,291527,296475,296475,296475,296475,296475,296475,296475,296475,296475],
  O9: [0,0,0,0,0,0,0,0,0,0,0,296475,296475,296475,296475,296475,296475,296475,296475,296475,296475],
  O10: [0,0,0,0,0,0,0,0,0,0,0,296475,296475,296475,296475,296475,296475,296475,296475,296475,296475],
};

const ANNUAL_COMPENSATION_WITHOUT_DEP: Record<PayGrade, number[]> = {
  E1: [61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068,61068],
  E2: [64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934,64934],
  E3: [65468,67748,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225,70225],
  E4: [68608,70785,73214,75598,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722,77722],
  E5: [76160,79616,82020,84335,86545,89116,90407,90765,90765,90765,90765,90765,90765,90765,90765,90765,90765,90765,90765,90765,90765],
  E6: [78154,82784,85018,87195,89454,94559,96545,100387,101565,102422,103425,103425,103425,103425,103425,103425,103425,103425,103425,103425,103425],
  E7: [87008,91874,94104,97040,99351,103303,105533,109399,112319,114310,116427,117247,120001,121477,127248,127248,127248,127248,127248,127248,127248],
  E8: [0,0,0,0,0,114536,117542,119400,121625,124095,128566,130835,134688,136824,142085,142085,144036,144036,144036,144036,144036],
  E9: [0,0,0,0,0,0,131222,133147,135575,138438,141328,145939,149855,153964,160259,160259,165953,165953,171932,171932,178074],
  W1: [78449,84367,85955,89314,93282,99065,101488,104886,108213,110833,113249,116176,116176,116176,116176,116176,116176,116176,116176,116176,116176],
  W2: [95132,101049,102869,104124,108110,113697,116477,119198,122555,125233,127653,130554,132457,133968,133968,133968,133968,133968,133968,133968,133968],
  W3: [107077,110017,112859,113730,116538,122067,127971,130753,133972,137275,143242,147258,149663,152224,155708,155708,155708,155708,155708,155708,155708],
  W4: [116724,121915,124087,126226,129917,133564,137259,142805,147674,152308,156109,159808,165235,169699,174697,174697,177195,177195,177195,177195,177195],
  W5: [0,0,0,0,0,0,0,0,0,0,0,171647,177839,182455,187552,187552,194461,194461,201693,201693,209311],
  O1E: [0,0,0,105035,109778,112255,114782,117266,120672,120672,120672,120672,120672,120672,120672,120672,120672,120672,120672,120672,120672],
  O2E: [0,0,0,122288,123928,126518,130900,134288,136808,136808,136808,136808,136808,136808,136808,136808,136808,136808,136808,136808,136808],
  O3E: [0,0,0,136901,141264,146049,149130,154211,158508,160968,164327,164327,164327,164327,164327,164327,164327,164327,164327,164327,164327],
  O1: [83046,85345,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562,97562],
  O2: [95919,104911,114973,117518,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116,119116],
  O3: [111685,120574,126657,134198,138561,143346,146427,151507,154168,154168,154168,154168,154168,154168,154168,154168,154168,154168,154168,154168,154168],
  O4: [126473,138688,144688,146010,151567,157531,164964,170732,174728,176974,178274,178274,178274,178274,178274,178274,178274,178274,178274,178274,178274],
  O5: [141163,152528,159533,160852,165231,167839,173592,177780,183101,191215,195085,198912,203257,203257,203257,203257,203257,203257,203257,203257,203257],
  O6: [162329,172951,180695,180695,181166,186455,187157,187157,194512,207511,215140,223344,228196,233109,242624,242624,245570,245570,245570,245570,245570],
  O7: [199780,206214,209191,211563,215844,220340,225804,231256,236736,253917,268434,268434,268434,268434,269596,269596,274210,274210,274210,274210,274210],
  O8: [229148,235255,239299,240426,245483,253917,255884,263899,266208,273149,283605,292583,297626,297626,297626,297626,297626,297626,297626,297626,297626],
  O9: [0,0,0,0,0,0,0,0,0,0,0,297626,297626,297626,297626,297626,297626,297626,297626,297626,297626],
  O10: [0,0,0,0,0,0,0,0,0,0,0,297626,297626,297626,297626,297626,297626,297626,297626,297626,297626],
};

/** Returns the compensation-table array index for the highest YOS bracket <= memberYOS. */
function bracketIndex(yos: number): number {
  let idx = 0;
  for (let i = 0; i < OCONUS_COLA_YOS_BRACKETS.length; i++) {
    if (yos >= OCONUS_COLA_YOS_BRACKETS[i]) idx = i;
    else break;
  }
  return idx;
}


// Average Annual Spendable Income Table, effective 2026-02-01. Each row is
// [bracketFloor, [income at 0,1,2,3,4,5+ dependents]]; bracketFloor is the
// bottom of that compensation bracket (the last row, floor 0, covers
// "<= $74,999"). Brackets are listed highest-first to make the lookup a
// simple first-match walk.
interface SpendableRow { floor: number; income: number[]; }
const SPENDABLE_INCOME_TABLE: SpendableRow[] = [

  { floor: 240000, income: [61650,65075,68500,71925,75350,78775] },
  { floor: 235000, income: [61020,64410,67800,71190,74580,77970] },
  { floor: 230000, income: [60390,63745,67100,70455,73810,77165] },
  { floor: 225000, income: [59760,63080,66400,69720,73040,76360] },
  { floor: 220000, income: [59040,62320,65600,68880,72160,75440] },
  { floor: 215000, income: [58410,61655,64900,68145,71390,74635] },
  { floor: 210000, income: [57690,60895,64100,67305,70510,73715] },
  { floor: 205000, income: [56970,60135,63300,66465,69630,72795] },
  { floor: 200000, income: [56160,59280,62400,65520,68640,71760] },
  { floor: 195000, income: [55440,58520,61600,64680,67760,70840] },
  { floor: 190000, income: [54720,57760,60800,63840,66880,69920] },
  { floor: 185000, income: [53910,56905,59900,62895,65890,68885] },
  { floor: 180000, income: [53100,56050,59000,61950,64900,67850] },
  { floor: 175000, income: [52290,55195,58100,61005,63910,66815] },
  { floor: 170000, income: [51480,54340,57200,60060,62920,65780] },
  { floor: 165000, income: [50580,53390,56200,59010,61820,64630] },
  { floor: 160000, income: [49770,52535,55300,58065,60830,63595] },
  { floor: 155000, income: [48870,51585,54300,57015,59730,62445] },
  { floor: 150000, income: [47970,50635,53300,55965,58630,61295] },
  { floor: 145000, income: [47070,49685,52300,54915,57530,60145] },
  { floor: 140000, income: [46170,48735,51300,53865,56430,58995] },
  { floor: 135000, income: [45270,47785,50300,52815,55330,57845] },
  { floor: 130000, income: [44280,46740,49200,51660,54120,56580] },
  { floor: 125000, income: [43290,45695,48100,50505,52910,55315] },
  { floor: 120000, income: [42300,44650,47000,49350,51700,54050] },
  { floor: 115000, income: [41310,43605,45900,48195,50490,52785] },
  { floor: 110000, income: [40320,42560,44800,47040,49280,51520] },
  { floor: 105000, income: [39330,41515,43700,45885,48070,50255] },
  { floor: 100000, income: [38250,40375,42500,44625,46750,48875] },
  { floor: 95000, income: [37170,39235,41300,43365,45430,47495] },
  { floor: 90000, income: [36090,38095,40100,42105,44110,46115] },
  { floor: 85000, income: [35010,36955,38900,40845,42790,44735] },
  { floor: 80000, income: [33930,35815,37700,39585,41470,43355] },
  { floor: 75000, income: [32850,34675,36500,38325,40150,41975] },
  { floor: 0, income: [31680,33440,35200,36960,38720,40480] },
];


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


export interface OconusColaLocationInfo {
  localityCode: string;
  /** Raw DoD COLA index (baseline 100 = no COLA; e.g. 128 = 28% above baseline). 0 = not currently COLA-eligible at this location. */
  rawIndex: number;
}

// 45 OCONUS locations tracked by this app (matches OHA_RATES in oha-rates.ts).
const OCONUS_COLA_LOCATIONS: Record<string, OconusColaLocationInfo> = {
  'Yokota AB / Tokyo Area': { localityCode: 'JP065', rawIndex: 104 },
  'Okinawa (All Installations)': { localityCode: 'JP027', rawIndex: 0 },
  'CFAY Yokosuka / Camp Zama / NAF Atsugi': { localityCode: 'JP061', rawIndex: 106 },
  'Misawa AB': { localityCode: 'JP023', rawIndex: 0 },
  'Iwakuni MCAS, Japan': { localityCode: 'JP019', rawIndex: 0 },
  'Naval Base Sasebo, Japan': { localityCode: 'JP035', rawIndex: 104 },
  'Camp Humphreys, South Korea': { localityCode: 'KR025', rawIndex: 114 },
  'Osan AB, South Korea': { localityCode: 'KR025', rawIndex: 114 },
  'Camp Walker / Camp Henry, Daegu': { localityCode: 'KR045', rawIndex: 114 },
  'Camp Casey / Camp Red Cloud, South Korea': { localityCode: 'KR177', rawIndex: 104 },
  'Kunsan AB / Camp Carroll, South Korea': { localityCode: 'KR070', rawIndex: 106 },
  'Ramstein AB, Germany': { localityCode: 'DE700', rawIndex: 128 },
  'Stuttgart (HQ EUCOM / AFRICOM)': { localityCode: 'DE055', rawIndex: 132 },
  'Wiesbaden / Clay Kaserne': { localityCode: 'DE355', rawIndex: 136 },
  'Spangdahlem AB, Germany': { localityCode: 'DE741', rawIndex: 124 },
  'Grafenwöhr / Vilseck, Germany': { localityCode: 'DE231', rawIndex: 118 },
  'USAG Ansbach, Germany': { localityCode: 'DE228', rawIndex: 130 },
  'RAF Lakenheath, UK': { localityCode: 'GB352', rawIndex: 124 },
  'RAF Mildenhall, UK': { localityCode: 'GB352', rawIndex: 124 },
  'RAF Croughton / Alconbury, UK': { localityCode: 'GB218', rawIndex: 120 },
  'Aviano AB, Italy': { localityCode: 'IT001', rawIndex: 126 },
  'NAS Sigonella, Sicily': { localityCode: 'IT067', rawIndex: 124 },
  'Naval Support Activity Naples': { localityCode: 'IT055', rawIndex: 130 },
  'Naval Station Rota, Spain': { localityCode: 'ES019', rawIndex: 134 },
  'Morón AB, Spain': { localityCode: 'ES018', rawIndex: 136 },
  'NSA Bahrain (5th Fleet HQ)': { localityCode: 'BH001', rawIndex: 128 },
  'Al Udeid AB, Qatar': { localityCode: 'QA999', rawIndex: 132 },
  'Camp Lemonnier, Djibouti': { localityCode: 'DJ999', rawIndex: 134 },
  'Incirlik AB, Turkey': { localityCode: 'TR001', rawIndex: 0 },
  'USAG Italy (Vicenza)': { localityCode: 'IT073', rawIndex: 120 },
  'Camp Darby, Italy': { localityCode: 'IT035', rawIndex: 126 },
  'SHAPE / Chièvres, Belgium': { localityCode: 'BE019', rawIndex: 128 },
  'Lajes Field, Azores': { localityCode: 'PT015', rawIndex: 108 },
  'NSA Souda Bay, Greece': { localityCode: 'GR001', rawIndex: 126 },
  'Kuwait (Arifjan / Ali Al Salem / Buehring)': { localityCode: 'KW999', rawIndex: 118 },
  'Al Dhafra AB, UAE': { localityCode: 'AE001', rawIndex: 130 },
  'Prince Sultan AB, Saudi Arabia': { localityCode: 'SA999', rawIndex: 126 },
  'Muwaffaq Salti AB, Jordan': { localityCode: 'JO003', rawIndex: 126 },
  'Naval Base Guam / Andersen AFB / Camp Blaz': { localityCode: 'GU001', rawIndex: 122 },
  'Kwajalein Atoll (USAKA)': { localityCode: 'MH999', rawIndex: 114 },
  'Diego Garcia (BIOT)': { localityCode: 'DG999', rawIndex: 124 },
  'Pituffik Space Base (Thule)': { localityCode: 'GL001', rawIndex: 106 },
  'Naval Station Guantanamo Bay (GTMO)': { localityCode: 'CU005', rawIndex: 108 },
  'Soto Cano AB (JTF-Bravo), Honduras': { localityCode: 'HN001', rawIndex: 106 },
  'Fort Buchanan, Puerto Rico': { localityCode: 'PR080', rawIndex: 124 },
};


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
