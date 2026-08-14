/**
 * Per diem rates for overseas (OCONUS) locations.
 * CONUS rates now live in gsa-per-diem.ts (296 GSA destinations, 15,157 ZIP codes).
 * OCONUS rates: State Dept Foreign Per Diem Rates (DSSR 925 / aoprals.state.gov), the source
 * DoD PDTATAC uses for JTR OCONUS per diem. Where the exact base town isn't separately listed,
 * the country's "[Other]" rate is used (or the nearest listed city, where that's the applicable
 * DoD PDTATAC convention — e.g. Osan AB uses the Pyeongtaek rate, RAF Alconbury uses the UK
 * "[Other]" rate rather than distant Cambridge). Where multiple seasonal rates exist for a
 * location, the highest is used (same peak-season convention as the CONUS GSA data).
 *
 * Every entry below was diffed 2026-08-13 against the actual State Dept February 2026 DSSR bulk
 * file (`February2026PD.xls`, retrieved via the Wayback Machine — aoprals.state.gov itself
 * requires a live session and can't be fetched directly, same issue noted for travel.dod.mil in
 * project memory). 6 entries were off (Madrid, Warsaw, Poznań, Bucharest/Kogălniceanu, Darwin,
 * Vicenza — some by >40%, e.g. Bucharest was using the Bucharest-city rate for what's actually
 * the separately-listed, much cheaper Constanța-Kogălniceanu AB rate) and were corrected; the
 * rest matched exactly. Baghdad intentionally uses Iraq's "[Other]" rate rather than DSSR's own
 * literal ~$11/day Baghdad line (which reflects government-furnished lodging for in-country
 * State Dept staff, not a usable TLA planning figure) — this is deliberate, not an error.
 * Bagram is dated (Afghanistan drawdown; DSSR's real Afghanistan rates are similarly near-zero
 * for the same government-furnished-lodging reason) and kept only as a legacy placeholder.
 *
 * Guam, CNMI (Tinian), and Puerto Rico are technically on a separate DoD non-foreign OCONUS
 * per diem schedule, not this DSSR 925 file — confirmed absent from the DSSR bulk file entirely
 * during this pass — but they're kept here (not moved to nonforeign-oconus-rates.ts) because
 * their Installation entries are already plain `oconus: true` and correctly resolve to TLA/OHA
 * through pcsCalc.ts's country-scoped match; only Hawaii/Alaska needed the separate
 * nonForeignOconus routing, since they're the OCONUS-for-travel/CONUS-for-BAH edge case.
 * oc_guam/oc_tinian/oc_puerto_rico rates were re-sourced 2026-08-13 from third-party DTMO
 * aggregators (previously unverified estimates, materially too low) — see
 * nonforeign-oconus-rates.ts's header for the same caveat on those. Guantanamo Bay
 * (oc_guantanamo) was not re-verified this pass — still an estimate. Verify at travel.dod.mil
 * before travel.
 */

export { STANDARD_LODGING, STANDARD_MEALS, STANDARD_TOTAL, CONUS_DESTINATIONS, lookupPerDiemByZip, searchConusDest } from '@/data/gsa-per-diem';
export type { PerDiemResult, PerDiemDestination } from '@/data/gsa-per-diem';

// ── OCONUS interface ─────────────────────────────────────────────────────────

export interface OconusLocation {
  id: string;
  name: string;
  area: string;
  country: string;
  countryCode: string;
  lodging: number;    // $/night max
  meals: number;      // M&IE $/day
  total: number;      // lodging + meals
}

// ── OCONUS Locations ─────────────────────────────────────────────────────────
// State Dept Foreign Per Diem Rates, effective January 2026. Always verify at travel.dod.mil
// or your installation's finance office before travel — rates update monthly.

export const OCONUS_LOCATIONS: OconusLocation[] = [

  // ── Korea ──────────────────────────────────────────────────────────────────
  { id: 'oc_humphreys', name: 'Camp Humphreys', area: 'Pyeongtaek', country: 'South Korea', countryCode: 'KOR', lodging: 64, meals: 49, total: 113 },
  { id: 'oc_osan', name: 'Osan AB', area: 'Gyeonggi-do', country: 'South Korea', countryCode: 'KOR', lodging: 64, meals: 49, total: 113 },
  { id: 'oc_camp_casey', name: 'Camp Casey / Red Cloud', area: 'Dongducheon', country: 'South Korea', countryCode: 'KOR', lodging: 60, meals: 40, total: 100 },
  { id: 'oc_daegu', name: 'Camp Walker / Henry', area: 'Daegu', country: 'South Korea', countryCode: 'KOR', lodging: 116, meals: 103, total: 219 },

  // ── Japan ──────────────────────────────────────────────────────────────────
  { id: 'oc_kadena', name: 'Kadena AB', area: 'Okinawa', country: 'Japan', countryCode: 'JPN', lodging: 344, meals: 125, total: 469 },
  { id: 'oc_camp_foster', name: 'Camp Foster / Kinser / Courtney', area: 'Okinawa', country: 'Japan', countryCode: 'JPN', lodging: 344, meals: 125, total: 469 },
  { id: 'oc_yokosuka', name: 'Naval Base Yokosuka', area: 'Kanagawa', country: 'Japan', countryCode: 'JPN', lodging: 193, meals: 124, total: 317 },
  { id: 'oc_yokota', name: 'Yokota AB', area: 'Fussa / Tokyo', country: 'Japan', countryCode: 'JPN', lodging: 358, meals: 125, total: 483 },
  { id: 'oc_zama', name: 'Camp Zama / Tokyo', area: 'Kanagawa / Tokyo', country: 'Japan', countryCode: 'JPN', lodging: 358, meals: 125, total: 483 },
  { id: 'oc_misawa', name: 'Misawa AB', area: 'Aomori', country: 'Japan', countryCode: 'JPN', lodging: 208, meals: 107, total: 315 },
  { id: 'oc_iwakuni', name: 'MCAS Iwakuni', area: 'Yamaguchi', country: 'Japan', countryCode: 'JPN', lodging: 208, meals: 107, total: 315 },
  { id: 'oc_sasebo', name: 'Naval Station Sasebo', area: 'Nagasaki', country: 'Japan', countryCode: 'JPN', lodging: 160, meals: 92, total: 252 },
  { id: 'oc_atsugi', name: 'NAF Atsugi', area: 'Kanagawa', country: 'Japan', countryCode: 'JPN', lodging: 193, meals: 124, total: 317 },
  { id: 'oc_camp_pendleton_jp', name: 'Camp Pendleton (Okinawa)', area: 'Okinawa', country: 'Japan', countryCode: 'JPN', lodging: 344, meals: 125, total: 469 },

  // ── Germany ────────────────────────────────────────────────────────────────
  { id: 'oc_ramstein', name: 'Ramstein AB', area: 'Kaiserslautern', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_grafenwoehr', name: 'Grafenwöhr / Rose Barracks', area: 'Bavaria', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_spangdahlem', name: 'Spangdahlem AB', area: 'Eifel', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_wiesbaden', name: 'Wiesbaden / USAREUR-AF HQ', area: 'Hesse', country: 'Germany', countryCode: 'DEU', lodging: 247, meals: 132, total: 379 },
  { id: 'oc_patch', name: 'Patch Barracks / Stuttgart', area: 'Baden-Württemberg', country: 'Germany', countryCode: 'DEU', lodging: 251, meals: 147, total: 398 },
  { id: 'oc_kaiserslautern', name: 'Kaiserslautern (KTown)', area: 'Rhineland-Palatinate', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_ansbach', name: 'Ansbach (Storck Barracks)', area: 'Bavaria', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_baumholder', name: 'Baumholder (Smith Barracks)', area: 'Rhineland-Palatinate', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_vilseck', name: 'Vilseck (Rose Barracks area)', area: 'Bavaria', country: 'Germany', countryCode: 'DEU', lodging: 237, meals: 140, total: 377 },
  { id: 'oc_heidelberg', name: 'Heidelberg area', area: 'Baden-Württemberg', country: 'Germany', countryCode: 'DEU', lodging: 276, meals: 151, total: 427 },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { id: 'oc_aviano', name: 'Aviano AB', area: 'Friuli-Venezia Giulia', country: 'Italy', countryCode: 'ITA', lodging: 117, meals: 89, total: 206 },
  { id: 'oc_naples', name: 'NSA Naples / Capodichino', area: 'Campania', country: 'Italy', countryCode: 'ITA', lodging: 377, meals: 169, total: 546 },
  { id: 'oc_sigonella', name: 'NAS Sigonella', area: 'Sicily', country: 'Italy', countryCode: 'ITA', lodging: 177, meals: 128, total: 305 },
  { id: 'oc_vicenza', name: 'Caserma Ederle / Del Din', area: 'Veneto', country: 'Italy', countryCode: 'ITA', lodging: 237, meals: 127, total: 364 },
  { id: 'oc_camp_darby', name: 'Camp Darby', area: 'Tuscany (Livorno)', country: 'Italy', countryCode: 'ITA', lodging: 280, meals: 135, total: 415 },
  { id: 'oc_rome', name: 'Rome (embassy / liaison)', area: 'Lazio', country: 'Italy', countryCode: 'ITA', lodging: 489, meals: 179, total: 668 },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { id: 'oc_rota', name: 'Naval Station Rota', area: 'Rota, Cadiz', country: 'Spain', countryCode: 'ESP', lodging: 153, meals: 100, total: 253 },
  { id: 'oc_moron', name: 'Morón AB', area: 'Sevilla', country: 'Spain', countryCode: 'ESP', lodging: 153, meals: 100, total: 253 },
  { id: 'oc_madrid', name: 'Madrid (embassy / NATO)', area: 'Madrid', country: 'Spain', countryCode: 'ESP', lodging: 399, meals: 139, total: 538 },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  { id: 'oc_uk_alconbury', name: 'RAF Alconbury / Mildenhall', area: 'Cambridgeshire', country: 'United Kingdom', countryCode: 'GBR', lodging: 252, meals: 108, total: 360 },
  { id: 'oc_uk_lakenheath', name: 'RAF Lakenheath / Feltwell', area: 'Suffolk', country: 'United Kingdom', countryCode: 'GBR', lodging: 252, meals: 108, total: 360 },
  { id: 'oc_uk_croughton', name: 'RAF Croughton', area: 'Northamptonshire', country: 'United Kingdom', countryCode: 'GBR', lodging: 252, meals: 108, total: 360 },
  { id: 'oc_uk_london', name: 'London (embassy / MOD)', area: 'Greater London', country: 'United Kingdom', countryCode: 'GBR', lodging: 424, meals: 174, total: 598 },
  { id: 'oc_uk_edinburgh', name: 'Edinburgh / Faslane', area: 'Scotland', country: 'United Kingdom', countryCode: 'GBR', lodging: 674, meals: 170, total: 844 },

  // ── Portugal / Azores ──────────────────────────────────────────────────────
  { id: 'oc_lajes', name: 'Lajes Field', area: 'Azores', country: 'Portugal', countryCode: 'PRT', lodging: 102, meals: 67, total: 169 },
  { id: 'oc_lisbon', name: 'Lisbon (embassy)', area: 'Lisbon', country: 'Portugal', countryCode: 'PRT', lodging: 280, meals: 112, total: 392 },

  // ── Belgium / Netherlands ──────────────────────────────────────────────────
  { id: 'oc_brussels', name: 'SHAPE / NATO HQ', area: 'Mons / Brussels', country: 'Belgium', countryCode: 'BEL', lodging: 196, meals: 120, total: 316 },
  { id: 'oc_chievres', name: 'Chièvres AB', area: 'Wallonia', country: 'Belgium', countryCode: 'BEL', lodging: 196, meals: 120, total: 316 },
  { id: 'oc_amsterdam', name: 'Amsterdam (embassy / NATO)', area: 'North Holland', country: 'Netherlands', countryCode: 'NLD', lodging: 453, meals: 192, total: 645 },

  // ── France ─────────────────────────────────────────────────────────────────
  { id: 'oc_paris', name: 'Paris / NATO visits', area: 'Île-de-France', country: 'France', countryCode: 'FRA', lodging: 511, meals: 173, total: 684 },

  // ── Greece ─────────────────────────────────────────────────────────────────
  { id: 'oc_souda_bay', name: 'NSA Souda Bay', area: 'Crete', country: 'Greece', countryCode: 'GRC', lodging: 181, meals: 127, total: 308 },
  { id: 'oc_athens', name: 'Athens (embassy)', area: 'Attica', country: 'Greece', countryCode: 'GRC', lodging: 341, meals: 144, total: 485 },

  // ── Turkey ─────────────────────────────────────────────────────────────────
  { id: 'oc_incirlik', name: 'Incirlik AB', area: 'Adana', country: 'Turkey', countryCode: 'TUR', lodging: 163, meals: 97, total: 260 },
  { id: 'oc_ankara', name: 'Ankara (embassy / TUSLOG)', area: 'Ankara', country: 'Turkey', countryCode: 'TUR', lodging: 230, meals: 119, total: 349 },

  // ── Poland / Romania / Baltics ─────────────────────────────────────────────
  { id: 'oc_warsaw', name: 'Warsaw / Camp Miron', area: 'Masovian', country: 'Poland', countryCode: 'POL', lodging: 198, meals: 108, total: 306 },
  { id: 'oc_poznan', name: 'Poznań (Camp Kosciuszko)', area: 'Greater Poland', country: 'Poland', countryCode: 'POL', lodging: 128, meals: 102, total: 230 },
  { id: 'oc_camp_silva', name: 'Camp Silva / Dragão', area: 'Sintra, Portugal', country: 'Portugal', countryCode: 'PRT', lodging: 280, meals: 112, total: 392 },
  { id: 'oc_bucharest', name: 'Bucharest / Mihail Kogalniceanu', area: 'Constanta', country: 'Romania', countryCode: 'ROU', lodging: 124, meals: 90, total: 214 },
  { id: 'oc_tallinn', name: 'Tallinn / eFP Estonia', area: 'Harju', country: 'Estonia', countryCode: 'EST', lodging: 217, meals: 139, total: 356 },
  { id: 'oc_riga', name: 'Riga / eFP Latvia', area: 'Riga', country: 'Latvia', countryCode: 'LVA', lodging: 217, meals: 132, total: 349 },
  { id: 'oc_vilnius', name: 'Vilnius / eFP Lithuania', area: 'Vilnius', country: 'Lithuania', countryCode: 'LTU', lodging: 240, meals: 144, total: 384 },

  // ── Norway / Scandinavia ───────────────────────────────────────────────────
  { id: 'oc_oslo', name: 'Oslo / Camp Vaernes', area: 'Oslo / Trøndelag', country: 'Norway', countryCode: 'NOR', lodging: 247, meals: 148, total: 395 },
  { id: 'oc_stockholm', name: 'Stockholm (embassy)', area: 'Stockholm County', country: 'Sweden', countryCode: 'SWE', lodging: 289, meals: 152, total: 441 },
  { id: 'oc_copenhagen', name: 'Copenhagen (embassy)', area: 'Capital Region', country: 'Denmark', countryCode: 'DNK', lodging: 309, meals: 141, total: 450 },

  // ── Middle East ────────────────────────────────────────────────────────────
  { id: 'oc_bahrain', name: 'NSA Bahrain', area: 'Manama', country: 'Bahrain', countryCode: 'BHR', lodging: 251, meals: 126, total: 377 },
  { id: 'oc_al_udeid', name: 'Al Udeid AB', area: 'Doha', country: 'Qatar', countryCode: 'QAT', lodging: 240, meals: 165, total: 405 },
  { id: 'oc_camp_arifjan', name: 'Camp Arifjan / Ali Al Salem', area: 'Kuwait', country: 'Kuwait', countryCode: 'KWT', lodging: 285, meals: 143, total: 428 },
  { id: 'oc_abu_dhabi', name: 'Al Dhafra AB / NAVCENT', area: 'Abu Dhabi', country: 'UAE', countryCode: 'ARE', lodging: 328, meals: 149, total: 477 },
  { id: 'oc_dubai', name: 'Dubai (liaison / port visits)', area: 'Dubai', country: 'UAE', countryCode: 'ARE', lodging: 383, meals: 173, total: 556 },
  { id: 'oc_riyadh', name: 'Prince Sultan AB / Riyadh', area: 'Riyadh', country: 'Saudi Arabia', countryCode: 'SAU', lodging: 416, meals: 178, total: 594 },
  { id: 'oc_amman', name: 'Amman (embassy / exercises)', area: 'Amman', country: 'Jordan', countryCode: 'JOR', lodging: 242, meals: 102, total: 344 },
  { id: 'oc_tel_aviv', name: 'Tel Aviv / EUCOM visits', area: 'Tel Aviv-Yafo', country: 'Israel', countryCode: 'ISR', lodging: 590, meals: 209, total: 799 },

  // ── Africa ─────────────────────────────────────────────────────────────────
  { id: 'oc_djibouti', name: 'Camp Lemonnier', area: 'Djibouti City', country: 'Djibouti', countryCode: 'DJI', lodging: 260, meals: 120, total: 380 },
  { id: 'oc_nairobi', name: 'Nairobi (embassy / AFRICOM)', area: 'Nairobi County', country: 'Kenya', countryCode: 'KEN', lodging: 250, meals: 77, total: 327 },
  { id: 'oc_manda_bay', name: 'Manda Bay (CJTF-HOA)', area: 'Lamu County', country: 'Kenya', countryCode: 'KEN', lodging: 231, meals: 87, total: 318 },
  { id: 'oc_stuttgart', name: 'Stuttgart / AFRICOM HQ', area: 'Baden-Württemberg', country: 'Germany', countryCode: 'DEU', lodging: 251, meals: 147, total: 398 },
  { id: 'oc_accra', name: 'Accra (embassy / exercises)', area: 'Greater Accra', country: 'Ghana', countryCode: 'GHA', lodging: 497, meals: 123, total: 620 },
  { id: 'oc_kampala', name: 'Kampala (SOCOM activities)', area: 'Kampala', country: 'Uganda', countryCode: 'UGA', lodging: 250, meals: 71, total: 321 },

  // ── Pacific / Indo-Pacific ─────────────────────────────────────────────────
  { id: 'oc_guam',         name: 'Andersen AFB / NS Guam',     area: 'Guam',                 country: 'Guam (US)',     countryCode: 'GUM', lodging: 179, meals: 124, total: 303 },
  { id: 'oc_tinian',       name: 'Tinian / CNMI',              area: 'Northern Mariana Is.',  country: 'CNMI (US)',    countryCode: 'MNP', lodging: 161, meals: 95,  total: 256 },
  { id: 'oc_darwin', name: 'Robertson Barracks', area: 'Northern Territory', country: 'Australia', countryCode: 'AUS', lodging: 192, meals: 117, total: 309 },
  { id: 'oc_sydney', name: 'Sydney (embassy / exercises)', area: 'New South Wales', country: 'Australia', countryCode: 'AUS', lodging: 260, meals: 136, total: 396 },
  { id: 'oc_singapore', name: 'Sembawang (RSN) / PACOM', area: 'Singapore', country: 'Singapore', countryCode: 'SGP', lodging: 302, meals: 162, total: 464 },
  { id: 'oc_philippines', name: 'Clark / Subic Bay / EDCAs', area: 'Luzon', country: 'Philippines', countryCode: 'PHL', lodging: 131, meals: 90, total: 221 },
  { id: 'oc_manila', name: 'Manila (embassy)', area: 'Metro Manila', country: 'Philippines', countryCode: 'PHL', lodging: 198, meals: 91, total: 289 },
  { id: 'oc_diego_garcia', name: 'Diego Garcia (BIOT)', area: 'Indian Ocean', country: 'Diego Garcia', countryCode: 'IOT', lodging: 147, meals: 80, total: 227 },
  { id: 'oc_bangkok', name: 'Bangkok (embassy / exercises)', area: 'Bangkok', country: 'Thailand', countryCode: 'THA', lodging: 259, meals: 118, total: 377 },
  { id: 'oc_kuala_lumpur', name: 'Kuala Lumpur (embassy)', area: 'Selangor', country: 'Malaysia', countryCode: 'MYS', lodging: 210, meals: 84, total: 294 },

  // ── Latin America / Caribbean ──────────────────────────────────────────────
  { id: 'oc_soto_cano', name: 'Soto Cano AB (JTF-B)', area: 'Comayagua', country: 'Honduras', countryCode: 'HND', lodging: 130, meals: 80, total: 210 },
  { id: 'oc_guantanamo',   name: 'GTMO / Naval Station',       area: 'Guantánamo Bay',       country: 'Cuba (US base)',countryCode: 'CUB', lodging: 65,  meals: 45,  total: 110 },
  { id: 'oc_miami_jiatf',  name: 'JIATF-S / SOUTHCOM',        area: 'Miami, FL / Doral',    country: 'United States', countryCode: 'USA', lodging: 156, meals: 80,  total: 236 },
  { id: 'oc_colombia', name: 'Larandia / Bogotá (COLAR)', area: 'Cundinamarca', country: 'Colombia', countryCode: 'COL', lodging: 141, meals: 88, total: 229 },
  { id: 'oc_peru', name: 'Lima / SOF exercises', area: 'Lima', country: 'Peru', countryCode: 'PER', lodging: 250, meals: 103, total: 353 },
  { id: 'oc_panama', name: 'Panama (embassy / exercises)', area: 'Panama City', country: 'Panama', countryCode: 'PAN', lodging: 173, meals: 99, total: 272 },
  { id: 'oc_puerto_rico',  name: 'Camp Santiago / Fort Buchanan', area: 'Puerto Rico (US)', country: 'Puerto Rico (US)',countryCode: 'PRI', lodging: 245, meals: 148, total: 393 },

  // ── Afghanistan / Iraq / Hazardous Duty ───────────────────────────────────
  { id: 'oc_bagram',       name: 'Bagram / USFOR-A (legacy)',  area: 'Parwan Province',      country: 'Afghanistan',   countryCode: 'AFG', lodging: 50,  meals: 40,  total: 90  },
  { id: 'oc_baghdad', name: 'Baghdad / Victory Base', area: 'Baghdad', country: 'Iraq', countryCode: 'IRQ', lodging: 247, meals: 82, total: 329 },
  { id: 'oc_erbil', name: 'Erbil AB (Kurdistan Region)', area: 'Erbil', country: 'Iraq', countryCode: 'IRQ', lodging: 211, meals: 65, total: 276 },
  { id: 'oc_niger_ag', name: 'Air Base 101 / 201 (Niger)', area: 'Agadez / Niamey', country: 'Niger', countryCode: 'NER', lodging: 177, meals: 84, total: 261 },
];

export function searchOconus(query: string): OconusLocation[] {
  if (!query.trim()) return OCONUS_LOCATIONS;
  const q = query.toLowerCase();
  return OCONUS_LOCATIONS.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.area.toLowerCase().includes(q) ||
      l.country.toLowerCase().includes(q) ||
      l.countryCode.toLowerCase().includes(q),
  );
}

// ── Legacy compat (tle-calculator, LocalityPicker) ───────────────────────────
import { CONUS_DESTINATIONS as _CONUS, lookupPerDiemByZip as _lookupPD } from '@/data/gsa-per-diem';
import { INSTALLATIONS } from '@/data/installations';
import { lookupNonForeignOconus } from '@/data/nonforeign-oconus-rates';

export const PER_DIEM_DATA_YEAR = 2026;

export interface Locality {
  id: string;
  name: string;
  area: string;
  state: string;
  lodging: number;  // max lodging $/night
  meals: number;    // M&IE $/day
  perDiem: number;  // lodging + meals
  oconus: boolean;
}

export const LOCALITIES: Locality[] = [
  // GSA CONUS city/county destinations (296 non-standard areas)
  ..._CONUS.map((d) => ({
    id: `conus_${d.did}`,
    name: d.city,
    area: d.county ? `${d.county} County` : d.state,
    state: d.state,
    lodging: d.maxLodging,
    meals: d.meals,
    perDiem: d.total,
    oconus: false,
  })),

  // All CONUS military installations — searchable by base name. Hawaii/Alaska are
  // excluded here even though `oconus` is false on them (they draw BAH like CONUS) —
  // they're non-foreign OCONUS for travel/per-diem purposes and belong in the OCONUS
  // list below with the correct DoD rate, not a GSA CONUS lookup.
  ...INSTALLATIONS
    .filter((i) => !i.oconus && !i.nonForeignOconus && !!i.mhaZip)
    .map((i) => {
      const pd = _lookupPD(i.mhaZip);
      return {
        id: `inst_${i.id}`,
        name: i.name,
        area: `${i.city}, ${i.state} · ${i.branch}`,
        state: i.state,
        lodging: pd.lodging,
        meals: pd.meals,
        perDiem: pd.total,
        oconus: false,
      };
    }),

  // Foreign OCONUS per diem locations
  ...OCONUS_LOCATIONS.map((l) => ({
    id: l.id,
    name: l.name,
    area: l.area,
    state: l.countryCode,
    lodging: l.lodging,
    meals: l.meals,
    perDiem: l.total,
    oconus: true,
  })),

  // Non-foreign OCONUS (Hawaii/Alaska) military installations — TLA, not TLE.
  ...INSTALLATIONS
    .filter((i) => i.nonForeignOconus)
    .map((i) => {
      const pd = lookupNonForeignOconus(i.city, i.state as 'HI' | 'AK');
      return {
        id: `inst_${i.id}`,
        name: i.name,
        area: `${i.city}, ${i.state} · ${i.branch}`,
        state: i.state,
        lodging: pd.lodging,
        meals: pd.meals,
        perDiem: pd.total,
        oconus: true,
      };
    }),
];

export function searchLocalities(query: string, oconus?: boolean): Locality[] {
  const list = oconus !== undefined ? LOCALITIES.filter((l) => l.oconus === oconus) : LOCALITIES;
  if (!query.trim()) return list.slice(0, 30);
  const q = query.toLowerCase();
  return list.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.area.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q),
  ).slice(0, 50);
}
