/**
 * Per diem rates for overseas (OCONUS) locations.
 * CONUS rates now live in gsa-per-diem.ts (296 GSA destinations, 42K ZIP codes).
 * OCONUS rates: DoD DTMO / JFTR FY2026. Verify at travel.dod.mil before travel.
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
// DoD DTMO JFTR FY2026. Always verify at travel.dod.mil before travel.

export const OCONUS_LOCATIONS: OconusLocation[] = [

  // ── Korea ──────────────────────────────────────────────────────────────────
  { id: 'oc_humphreys',    name: 'Camp Humphreys',             area: 'Pyeongtaek',           country: 'South Korea',   countryCode: 'KOR', lodging: 89,  meals: 59,  total: 148 },
  { id: 'oc_osan',         name: 'Osan AB',                    area: 'Gyeonggi-do',          country: 'South Korea',   countryCode: 'KOR', lodging: 92,  meals: 60,  total: 152 },
  { id: 'oc_camp_casey',   name: 'Camp Casey / Red Cloud',     area: 'Dongducheon',          country: 'South Korea',   countryCode: 'KOR', lodging: 87,  meals: 59,  total: 146 },
  { id: 'oc_daegu',        name: 'Camp Walker / Henry',        area: 'Daegu',                country: 'South Korea',   countryCode: 'KOR', lodging: 88,  meals: 59,  total: 147 },

  // ── Japan ──────────────────────────────────────────────────────────────────
  { id: 'oc_kadena',       name: 'Kadena AB',                  area: 'Okinawa',              country: 'Japan',         countryCode: 'JPN', lodging: 154, meals: 69,  total: 223 },
  { id: 'oc_camp_foster',  name: 'Camp Foster / Kinser / Courtney', area: 'Okinawa',         country: 'Japan',         countryCode: 'JPN', lodging: 155, meals: 69,  total: 224 },
  { id: 'oc_yokosuka',     name: 'Naval Base Yokosuka',        area: 'Kanagawa',             country: 'Japan',         countryCode: 'JPN', lodging: 150, meals: 70,  total: 220 },
  { id: 'oc_yokota',       name: 'Yokota AB',                  area: 'Fussa / Tokyo',        country: 'Japan',         countryCode: 'JPN', lodging: 152, meals: 70,  total: 222 },
  { id: 'oc_zama',         name: 'Camp Zama / Tokyo',          area: 'Kanagawa / Tokyo',     country: 'Japan',         countryCode: 'JPN', lodging: 165, meals: 67,  total: 232 },
  { id: 'oc_misawa',       name: 'Misawa AB',                  area: 'Aomori',               country: 'Japan',         countryCode: 'JPN', lodging: 131, meals: 69,  total: 200 },
  { id: 'oc_iwakuni',      name: 'MCAS Iwakuni',               area: 'Yamaguchi',            country: 'Japan',         countryCode: 'JPN', lodging: 136, meals: 68,  total: 204 },
  { id: 'oc_sasebo',       name: 'Naval Station Sasebo',       area: 'Nagasaki',             country: 'Japan',         countryCode: 'JPN', lodging: 128, meals: 70,  total: 198 },
  { id: 'oc_atsugi',       name: 'NAF Atsugi',                 area: 'Kanagawa',             country: 'Japan',         countryCode: 'JPN', lodging: 148, meals: 70,  total: 218 },
  { id: 'oc_camp_pendleton_jp', name: 'Camp Pendleton (Okinawa)', area: 'Okinawa',          country: 'Japan',         countryCode: 'JPN', lodging: 153, meals: 69,  total: 222 },

  // ── Germany ────────────────────────────────────────────────────────────────
  { id: 'oc_ramstein',     name: 'Ramstein AB',                area: 'Kaiserslautern',       country: 'Germany',       countryCode: 'DEU', lodging: 126, meals: 66,  total: 192 },
  { id: 'oc_grafenwoehr',  name: 'Grafenwöhr / Rose Barracks', area: 'Bavaria',              country: 'Germany',       countryCode: 'DEU', lodging: 122, meals: 67,  total: 189 },
  { id: 'oc_spangdahlem',  name: 'Spangdahlem AB',             area: 'Eifel',                country: 'Germany',       countryCode: 'DEU', lodging: 122, meals: 67,  total: 189 },
  { id: 'oc_wiesbaden',    name: 'Wiesbaden / USAREUR-AF HQ',  area: 'Hesse',                country: 'Germany',       countryCode: 'DEU', lodging: 128, meals: 68,  total: 196 },
  { id: 'oc_patch',        name: 'Patch Barracks / Stuttgart', area: 'Baden-Württemberg',    country: 'Germany',       countryCode: 'DEU', lodging: 126, meals: 67,  total: 193 },
  { id: 'oc_kaiserslautern', name: 'Kaiserslautern (KTown)',   area: 'Rhineland-Palatinate', country: 'Germany',       countryCode: 'DEU', lodging: 122, meals: 66,  total: 188 },
  { id: 'oc_ansbach',      name: 'Ansbach (Storck Barracks)',  area: 'Bavaria',              country: 'Germany',       countryCode: 'DEU', lodging: 119, meals: 65,  total: 184 },
  { id: 'oc_baumholder',   name: 'Baumholder (Smith Barracks)', area: 'Rhineland-Palatinate',country: 'Germany',      countryCode: 'DEU', lodging: 117, meals: 64,  total: 181 },
  { id: 'oc_vilseck',      name: 'Vilseck (Rose Barracks area)', area: 'Bavaria',            country: 'Germany',       countryCode: 'DEU', lodging: 120, meals: 66,  total: 186 },
  { id: 'oc_heidelberg',   name: 'Heidelberg area',            area: 'Baden-Württemberg',    country: 'Germany',       countryCode: 'DEU', lodging: 130, meals: 68,  total: 198 },

  // ── Italy ──────────────────────────────────────────────────────────────────
  { id: 'oc_aviano',       name: 'Aviano AB',                  area: 'Friuli-Venezia Giulia',country: 'Italy',         countryCode: 'ITA', lodging: 136, meals: 68,  total: 204 },
  { id: 'oc_naples',       name: 'NSA Naples / Capodichino',   area: 'Campania',             country: 'Italy',         countryCode: 'ITA', lodging: 148, meals: 70,  total: 218 },
  { id: 'oc_sigonella',    name: 'NAS Sigonella',              area: 'Sicily',               country: 'Italy',         countryCode: 'ITA', lodging: 120, meals: 64,  total: 184 },
  { id: 'oc_vicenza',      name: 'Caserma Ederle / Del Din',   area: 'Veneto',               country: 'Italy',         countryCode: 'ITA', lodging: 143, meals: 69,  total: 212 },
  { id: 'oc_camp_darby',   name: 'Camp Darby',                 area: 'Tuscany (Livorno)',    country: 'Italy',         countryCode: 'ITA', lodging: 138, meals: 68,  total: 206 },
  { id: 'oc_rome',         name: 'Rome (embassy / liaison)',   area: 'Lazio',                country: 'Italy',         countryCode: 'ITA', lodging: 214, meals: 71,  total: 285 },

  // ── Spain ──────────────────────────────────────────────────────────────────
  { id: 'oc_rota',         name: 'Naval Station Rota',         area: 'Rota, Cadiz',          country: 'Spain',         countryCode: 'ESP', lodging: 116, meals: 66,  total: 182 },
  { id: 'oc_moron',        name: 'Morón AB',                   area: 'Sevilla',              country: 'Spain',         countryCode: 'ESP', lodging: 114, meals: 64,  total: 178 },
  { id: 'oc_madrid',       name: 'Madrid (embassy / NATO)',    area: 'Madrid',               country: 'Spain',         countryCode: 'ESP', lodging: 160, meals: 70,  total: 230 },

  // ── United Kingdom ─────────────────────────────────────────────────────────
  { id: 'oc_uk_alconbury', name: 'RAF Alconbury / Mildenhall', area: 'Cambridgeshire',       country: 'United Kingdom',countryCode: 'GBR', lodging: 157, meals: 74,  total: 231 },
  { id: 'oc_uk_lakenheath',name: 'RAF Lakenheath / Feltwell',  area: 'Suffolk',              country: 'United Kingdom',countryCode: 'GBR', lodging: 163, meals: 74,  total: 237 },
  { id: 'oc_uk_croughton', name: 'RAF Croughton',              area: 'Northamptonshire',     country: 'United Kingdom',countryCode: 'GBR', lodging: 159, meals: 74,  total: 233 },
  { id: 'oc_uk_london',    name: 'London (embassy / MOD)',     area: 'Greater London',       country: 'United Kingdom',countryCode: 'GBR', lodging: 306, meals: 84,  total: 390 },
  { id: 'oc_uk_edinburgh', name: 'Edinburgh / Faslane',        area: 'Scotland',             country: 'United Kingdom',countryCode: 'GBR', lodging: 189, meals: 72,  total: 261 },

  // ── Portugal / Azores ──────────────────────────────────────────────────────
  { id: 'oc_lajes',        name: 'Lajes Field',                area: 'Azores',               country: 'Portugal',      countryCode: 'PRT', lodging: 93,  meals: 68,  total: 161 },
  { id: 'oc_lisbon',       name: 'Lisbon (embassy)',           area: 'Lisbon',               country: 'Portugal',      countryCode: 'PRT', lodging: 152, meals: 66,  total: 218 },

  // ── Belgium / Netherlands ──────────────────────────────────────────────────
  { id: 'oc_brussels',     name: 'SHAPE / NATO HQ',            area: 'Mons / Brussels',      country: 'Belgium',       countryCode: 'BEL', lodging: 170, meals: 78,  total: 248 },
  { id: 'oc_chievres',     name: 'Chièvres AB',                area: 'Wallonia',             country: 'Belgium',       countryCode: 'BEL', lodging: 140, meals: 70,  total: 210 },
  { id: 'oc_amsterdam',    name: 'Amsterdam (embassy / NATO)', area: 'North Holland',        country: 'Netherlands',   countryCode: 'NLD', lodging: 175, meals: 78,  total: 253 },

  // ── France ─────────────────────────────────────────────────────────────────
  { id: 'oc_paris',        name: 'Paris / NATO visits',        area: 'Île-de-France',        country: 'France',        countryCode: 'FRA', lodging: 267, meals: 79,  total: 346 },

  // ── Greece ─────────────────────────────────────────────────────────────────
  { id: 'oc_souda_bay',    name: 'NSA Souda Bay',              area: 'Crete',                country: 'Greece',        countryCode: 'GRC', lodging: 126, meals: 71,  total: 197 },
  { id: 'oc_athens',       name: 'Athens (embassy)',           area: 'Attica',               country: 'Greece',        countryCode: 'GRC', lodging: 155, meals: 72,  total: 227 },

  // ── Turkey ─────────────────────────────────────────────────────────────────
  { id: 'oc_incirlik',     name: 'Incirlik AB',                area: 'Adana',                country: 'Turkey',        countryCode: 'TUR', lodging: 62,  meals: 62,  total: 124 },
  { id: 'oc_ankara',       name: 'Ankara (embassy / TUSLOG)',  area: 'Ankara',               country: 'Turkey',        countryCode: 'TUR', lodging: 120, meals: 62,  total: 182 },

  // ── Poland / Romania / Baltics ─────────────────────────────────────────────
  { id: 'oc_warsaw',       name: 'Warsaw / Camp Miron',        area: 'Masovian',             country: 'Poland',        countryCode: 'POL', lodging: 120, meals: 69,  total: 189 },
  { id: 'oc_poznan',       name: 'Poznań (Camp Kosciuszko)',   area: 'Greater Poland',       country: 'Poland',        countryCode: 'POL', lodging: 107, meals: 66,  total: 173 },
  { id: 'oc_camp_silva',   name: 'Camp Silva / Dragão',        area: 'Sintra, Portugal',     country: 'Portugal',      countryCode: 'PRT', lodging: 132, meals: 66,  total: 198 },
  { id: 'oc_bucharest',    name: 'Bucharest / Mihail Kogalniceanu', area: 'Constanta',       country: 'Romania',       countryCode: 'ROU', lodging: 88,  meals: 60,  total: 148 },
  { id: 'oc_tallinn',      name: 'Tallinn / eFP Estonia',      area: 'Harju',                country: 'Estonia',       countryCode: 'EST', lodging: 132, meals: 68,  total: 200 },
  { id: 'oc_riga',         name: 'Riga / eFP Latvia',          area: 'Riga',                 country: 'Latvia',        countryCode: 'LVA', lodging: 119, meals: 65,  total: 184 },
  { id: 'oc_vilnius',      name: 'Vilnius / eFP Lithuania',    area: 'Vilnius',              country: 'Lithuania',     countryCode: 'LTU', lodging: 113, meals: 64,  total: 177 },

  // ── Norway / Scandinavia ───────────────────────────────────────────────────
  { id: 'oc_oslo',         name: 'Oslo / Camp Vaernes',        area: 'Oslo / Trøndelag',     country: 'Norway',        countryCode: 'NOR', lodging: 216, meals: 89,  total: 305 },
  { id: 'oc_stockholm',    name: 'Stockholm (embassy)',        area: 'Stockholm County',     country: 'Sweden',        countryCode: 'SWE', lodging: 188, meals: 79,  total: 267 },
  { id: 'oc_copenhagen',   name: 'Copenhagen (embassy)',       area: 'Capital Region',       country: 'Denmark',       countryCode: 'DNK', lodging: 188, meals: 82,  total: 270 },

  // ── Middle East ────────────────────────────────────────────────────────────
  { id: 'oc_bahrain',      name: 'NSA Bahrain',                area: 'Manama',               country: 'Bahrain',       countryCode: 'BHR', lodging: 127, meals: 69,  total: 196 },
  { id: 'oc_al_udeid',     name: 'Al Udeid AB',                area: 'Doha',                 country: 'Qatar',         countryCode: 'QAT', lodging: 95,  meals: 61,  total: 156 },
  { id: 'oc_camp_arifjan', name: 'Camp Arifjan / Ali Al Salem',area: 'Kuwait',               country: 'Kuwait',        countryCode: 'KWT', lodging: 98,  meals: 60,  total: 158 },
  { id: 'oc_abu_dhabi',    name: 'Al Dhafra AB / NAVCENT',     area: 'Abu Dhabi',            country: 'UAE',           countryCode: 'ARE', lodging: 148, meals: 66,  total: 214 },
  { id: 'oc_dubai',        name: 'Dubai (liaison / port visits)',area: 'Dubai',              country: 'UAE',           countryCode: 'ARE', lodging: 190, meals: 72,  total: 262 },
  { id: 'oc_riyadh',       name: 'Prince Sultan AB / Riyadh',  area: 'Riyadh',               country: 'Saudi Arabia',  countryCode: 'SAU', lodging: 134, meals: 65,  total: 199 },
  { id: 'oc_amman',        name: 'Amman (embassy / exercises)',area: 'Amman',                country: 'Jordan',        countryCode: 'JOR', lodging: 136, meals: 62,  total: 198 },
  { id: 'oc_tel_aviv',     name: 'Tel Aviv / EUCOM visits',    area: 'Tel Aviv-Yafo',        country: 'Israel',        countryCode: 'ISR', lodging: 213, meals: 78,  total: 291 },

  // ── Africa ─────────────────────────────────────────────────────────────────
  { id: 'oc_djibouti',     name: 'Camp Lemonnier',             area: 'Djibouti City',        country: 'Djibouti',      countryCode: 'DJI', lodging: 111, meals: 64,  total: 175 },
  { id: 'oc_nairobi',      name: 'Nairobi (embassy / AFRICOM)',area: 'Nairobi County',       country: 'Kenya',         countryCode: 'KEN', lodging: 116, meals: 60,  total: 176 },
  { id: 'oc_manda_bay',    name: 'Manda Bay (CJTF-HOA)',       area: 'Lamu County',          country: 'Kenya',         countryCode: 'KEN', lodging: 100, meals: 58,  total: 158 },
  { id: 'oc_stuttgart',    name: 'Stuttgart / AFRICOM HQ',     area: 'Baden-Württemberg',    country: 'Germany',       countryCode: 'DEU', lodging: 127, meals: 68,  total: 195 },
  { id: 'oc_accra',        name: 'Accra (embassy / exercises)',area: 'Greater Accra',        country: 'Ghana',         countryCode: 'GHA', lodging: 93,  meals: 55,  total: 148 },
  { id: 'oc_kampala',      name: 'Kampala (SOCOM activities)', area: 'Kampala',              country: 'Uganda',        countryCode: 'UGA', lodging: 79,  meals: 55,  total: 134 },

  // ── Pacific / Indo-Pacific ─────────────────────────────────────────────────
  { id: 'oc_guam',         name: 'Andersen AFB / NS Guam',     area: 'Guam',                 country: 'Guam (US)',     countryCode: 'GUM', lodging: 137, meals: 71,  total: 208 },
  { id: 'oc_tinian',       name: 'Tinian / CNMI',              area: 'Northern Mariana Is.',  country: 'CNMI (US)',    countryCode: 'MNP', lodging: 128, meals: 68,  total: 196 },
  { id: 'oc_darwin',       name: 'Robertson Barracks',         area: 'Northern Territory',   country: 'Australia',     countryCode: 'AUS', lodging: 120, meals: 66,  total: 186 },
  { id: 'oc_sydney',       name: 'Sydney (embassy / exercises)',area: 'New South Wales',      country: 'Australia',     countryCode: 'AUS', lodging: 178, meals: 72,  total: 250 },
  { id: 'oc_singapore',    name: 'Sembawang (RSN) / PACOM',    area: 'Singapore',            country: 'Singapore',     countryCode: 'SGP', lodging: 183, meals: 77,  total: 260 },
  { id: 'oc_philippines',  name: 'Clark / Subic Bay / EDCAs',  area: 'Luzon',                country: 'Philippines',   countryCode: 'PHL', lodging: 75,  meals: 55,  total: 130 },
  { id: 'oc_manila',       name: 'Manila (embassy)',           area: 'Metro Manila',         country: 'Philippines',   countryCode: 'PHL', lodging: 115, meals: 60,  total: 175 },
  { id: 'oc_diego_garcia', name: 'Diego Garcia (BIOT)',        area: 'Indian Ocean',         country: 'Diego Garcia',  countryCode: 'IOT', lodging: 120, meals: 62,  total: 182 },
  { id: 'oc_bangkok',      name: 'Bangkok (embassy / exercises)', area: 'Bangkok',           country: 'Thailand',      countryCode: 'THA', lodging: 132, meals: 61,  total: 193 },
  { id: 'oc_kuala_lumpur', name: 'Kuala Lumpur (embassy)',     area: 'Selangor',             country: 'Malaysia',      countryCode: 'MYS', lodging: 109, meals: 59,  total: 168 },

  // ── Latin America / Caribbean ──────────────────────────────────────────────
  { id: 'oc_soto_cano',    name: 'Soto Cano AB (JTF-B)',       area: 'Comayagua',            country: 'Honduras',      countryCode: 'HND', lodging: 58,  meals: 40,  total: 98  },
  { id: 'oc_guantanamo',   name: 'GTMO / Naval Station',       area: 'Guantánamo Bay',       country: 'Cuba (US base)',countryCode: 'CUB', lodging: 65,  meals: 45,  total: 110 },
  { id: 'oc_miami_jiatf',  name: 'JIATF-S / SOUTHCOM',        area: 'Miami, FL / Doral',    country: 'United States', countryCode: 'USA', lodging: 156, meals: 80,  total: 236 },
  { id: 'oc_colombia',     name: 'Larandia / Bogotá (COLAR)',  area: 'Cundinamarca',         country: 'Colombia',      countryCode: 'COL', lodging: 88,  meals: 57,  total: 145 },
  { id: 'oc_peru',         name: 'Lima / SOF exercises',       area: 'Lima',                 country: 'Peru',          countryCode: 'PER', lodging: 83,  meals: 55,  total: 138 },
  { id: 'oc_panama',       name: 'Panama (embassy / exercises)',area: 'Panama City',         country: 'Panama',        countryCode: 'PAN', lodging: 113, meals: 58,  total: 171 },
  { id: 'oc_puerto_rico',  name: 'Camp Santiago / Fort Buchanan', area: 'Puerto Rico (US)', country: 'Puerto Rico (US)',countryCode: 'PRI', lodging: 148, meals: 68,  total: 216 },

  // ── Afghanistan / Iraq / Hazardous Duty ───────────────────────────────────
  { id: 'oc_bagram',       name: 'Bagram / USFOR-A (legacy)',  area: 'Parwan Province',      country: 'Afghanistan',   countryCode: 'AFG', lodging: 50,  meals: 40,  total: 90  },
  { id: 'oc_baghdad',      name: 'Baghdad / Victory Base',     area: 'Baghdad',              country: 'Iraq',          countryCode: 'IRQ', lodging: 75,  meals: 50,  total: 125 },
  { id: 'oc_erbil',        name: 'Erbil AB (Kurdistan Region)',area: 'Erbil',                country: 'Iraq',          countryCode: 'IRQ', lodging: 78,  meals: 50,  total: 128 },
  { id: 'oc_niger_ag',     name: 'Air Base 101 / 201 (Niger)', area: 'Agadez / Niamey',     country: 'Niger',         countryCode: 'NER', lodging: 62,  meals: 44,  total: 106 },
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
import { CONUS_DESTINATIONS as _CONUS, STANDARD_TOTAL as _STD } from '@/data/gsa-per-diem';

export const PER_DIEM_DATA_YEAR = 2026;

export interface Locality {
  id: string;
  name: string;
  area: string;
  state: string;
  perDiem: number;
  oconus: boolean;
}

export const LOCALITIES: Locality[] = [
  ..._CONUS.map((d) => ({
    id: `conus_${d.did}`,
    name: d.city,
    area: d.county ? `${d.county} County` : d.state,
    state: d.state,
    perDiem: d.total,
    oconus: false,
  })),
  ...OCONUS_LOCATIONS.map((l) => ({
    id: l.id,
    name: l.name,
    area: l.area,
    state: l.countryCode,
    perDiem: l.total,
    oconus: true,
  })),
];

export function searchLocalities(query: string, oconus?: boolean): Locality[] {
  let list = oconus !== undefined ? LOCALITIES.filter((l) => l.oconus === oconus) : LOCALITIES;
  if (!query.trim()) return list.slice(0, 30);
  const q = query.toLowerCase();
  return list.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.area.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q),
  ).slice(0, 20);
}
