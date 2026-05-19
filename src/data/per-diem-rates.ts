/**
 * Per diem rates bundled for planning purposes.
 * CONUS rates: GSA FY2025 (Oct 2024 – Sep 2025).
 * OCONUS rates: DoD JFTR FY2025 approximate.
 * Always verify current rates at gsa.gov (CONUS) or defensetravel.dod.mil (OCONUS).
 */

export interface Locality {
  id: string;
  name: string;               // installation or city name
  area: string;               // metro / county description
  state: string;              // state/country abbreviation
  perDiem: number;            // full daily rate (lodging + M&IE), $/day
  oconus: boolean;
}

export const PER_DIEM_DATA_YEAR = 2025;

export const LOCALITIES: Locality[] = [
  // ── CONUS — High-cost ────────────────────────────────────────────────────────
  { id: 'honolulu',       name: 'Schofield / JBPHH',       area: 'Honolulu County, HI',         state: 'HI', perDiem: 369, oconus: false },
  { id: 'san_diego',      name: 'Camp Pendleton / NB SD',   area: 'San Diego County, CA',         state: 'CA', perDiem: 279, oconus: false },
  { id: 'dc_area',        name: 'Joint Base Andrews / Pentagon', area: 'DC / Northern VA / MD',  state: 'DC', perDiem: 248, oconus: false },
  { id: 'anchorage',      name: 'JBER / Fort Wainwright',   area: 'Anchorage, AK',               state: 'AK', perDiem: 249, oconus: false },
  { id: 'jblm',           name: 'Joint Base Lewis-McChord', area: 'Pierce County, WA',           state: 'WA', perDiem: 218, oconus: false },
  { id: 'whidbey',        name: 'NAS Whidbey Island',       area: 'Island County, WA',           state: 'WA', perDiem: 218, oconus: false },
  { id: 'ft_meade',       name: 'Fort Meade / NSA',         area: 'Anne Arundel County, MD',     state: 'MD', perDiem: 216, oconus: false },
  { id: 'norfolk',        name: 'Naval Station Norfolk / JBLE', area: 'Hampton Roads, VA',       state: 'VA', perDiem: 189, oconus: false },
  { id: 'quantico',       name: 'MCB Quantico',             area: 'Prince William County, VA',   state: 'VA', perDiem: 202, oconus: false },
  { id: 'macdill',        name: 'MacDill AFB',              area: 'Hillsborough County, FL',     state: 'FL', perDiem: 222, oconus: false },
  { id: 'ft_carson',      name: 'Fort Carson / Peterson SFB', area: 'El Paso County, CO',        state: 'CO', perDiem: 194, oconus: false },
  { id: 'jbsa',           name: 'Fort Sam Houston / JBSA',  area: 'Bexar County, TX',            state: 'TX', perDiem: 184, oconus: false },
  { id: 'jacksonville_fl',name: 'NAS Jacksonville / Mayport', area: 'Duval County, FL',          state: 'FL', perDiem: 177, oconus: false },
  { id: 'pensacola',      name: 'NAS Pensacola / Eglin AFB', area: 'Escambia/Okaloosa County, FL', state: 'FL', perDiem: 177, oconus: false },
  // ── CONUS — Standard rate ────────────────────────────────────────────────────
  { id: 'fort_liberty',   name: 'Fort Liberty',             area: 'Cumberland County, NC',       state: 'NC', perDiem: 166, oconus: false },
  { id: 'camp_lejeune',   name: 'MCB Camp Lejeune',         area: 'Onslow County, NC',           state: 'NC', perDiem: 166, oconus: false },
  { id: 'fort_campbell',  name: 'Fort Campbell',            area: 'Montgomery County, TN',       state: 'TN', perDiem: 166, oconus: false },
  { id: 'fort_cavazos',   name: 'Fort Cavazos',             area: 'Bell County, TX',             state: 'TX', perDiem: 166, oconus: false },
  { id: 'fort_bliss',     name: 'Fort Bliss',               area: 'El Paso County, TX',          state: 'TX', perDiem: 166, oconus: false },
  { id: 'fort_drum',      name: 'Fort Drum',                area: 'Jefferson County, NY',        state: 'NY', perDiem: 166, oconus: false },
  { id: 'fort_moore',     name: 'Fort Moore',               area: 'Muscogee County, GA',         state: 'GA', perDiem: 166, oconus: false },
  { id: 'fort_stewart',   name: 'Fort Stewart',             area: 'Liberty County, GA',          state: 'GA', perDiem: 166, oconus: false },
  { id: 'fort_eisenhower',name: 'Fort Eisenhower',          area: 'Richmond County, GA',         state: 'GA', perDiem: 166, oconus: false },
  { id: 'fort_knox',      name: 'Fort Knox',                area: 'Hardin County, KY',           state: 'KY', perDiem: 166, oconus: false },
  { id: 'fort_leavenworth',name: 'Fort Leavenworth',        area: 'Leavenworth County, KS',      state: 'KS', perDiem: 166, oconus: false },
  { id: 'fort_sill',      name: 'Fort Sill',                area: 'Comanche County, OK',         state: 'OK', perDiem: 166, oconus: false },
  { id: 'tinker',         name: 'Tinker AFB',               area: 'Oklahoma County, OK',         state: 'OK', perDiem: 166, oconus: false },
  { id: 'barksdale',      name: 'Barksdale AFB',            area: 'Bossier Parish, LA',          state: 'LA', perDiem: 166, oconus: false },
  { id: 'fort_johnson',   name: 'Fort Johnson',             area: 'Vernon Parish, LA',           state: 'LA', perDiem: 166, oconus: false },
  { id: 'wpafb',          name: 'Wright-Patterson AFB',     area: 'Greene County, OH',           state: 'OH', perDiem: 166, oconus: false },
  { id: 'offutt',         name: 'Offutt AFB',               area: 'Sarpy County, NE',            state: 'NE', perDiem: 166, oconus: false },
  { id: 'minot',          name: 'Minot AFB',                area: 'Ward County, ND',             state: 'ND', perDiem: 166, oconus: false },
  { id: 'scott',          name: 'Scott AFB',                area: "St. Clair County, IL",        state: 'IL', perDiem: 166, oconus: false },
  { id: 'fort_novosel',   name: 'Fort Novosel',             area: 'Dale County, AL',             state: 'AL', perDiem: 166, oconus: false },
  { id: 'fort_irwin',    name: 'Fort Irwin (NTC)',          area: 'San Bernardino County, CA',   state: 'CA', perDiem: 184, oconus: false },
  { id: 'fort_huachuca', name: 'Fort Huachuca',             area: 'Cochise County, AZ',          state: 'AZ', perDiem: 166, oconus: false },
  { id: 'fort_belvoir',  name: 'Fort Belvoir',              area: 'Fairfax County, VA',          state: 'VA', perDiem: 221, oconus: false },
  { id: 'fort_wainwright',name: 'Fort Wainwright',          area: 'Fairbanks, AK',               state: 'AK', perDiem: 243, oconus: false },
  { id: 'fort_richardson',name: 'Fort Richardson (JBER)',   area: 'Anchorage, AK',               state: 'AK', perDiem: 249, oconus: false },
  { id: 'redstone',      name: 'Redstone Arsenal',          area: 'Madison County, AL',          state: 'AL', perDiem: 166, oconus: false },
  { id: 'aberdeen',      name: 'Aberdeen Proving Ground',   area: 'Harford County, MD',          state: 'MD', perDiem: 200, oconus: false },
  { id: 'fort_leonard_wood', name: 'Fort Leonard Wood',     area: 'Pulaski County, MO',          state: 'MO', perDiem: 166, oconus: false },
  { id: 'usma',          name: 'West Point (USMA)',          area: 'Orange County, NY',           state: 'NY', perDiem: 226, oconus: false },
  { id: 'fort_hamilton', name: 'Fort Hamilton',             area: 'Brooklyn, NY',                state: 'NY', perDiem: 321, oconus: false },
  { id: 'fort_dix',      name: 'JB McGuire-Dix-Lakehurst', area: 'Burlington County, NJ',       state: 'NJ', perDiem: 192, oconus: false },
  { id: 'fort_detrick',  name: 'Fort Detrick',              area: 'Frederick County, MD',        state: 'MD', perDiem: 187, oconus: false },
  { id: 'ns_newport',    name: 'Naval Station Newport',     area: 'Newport County, RI',          state: 'RI', perDiem: 205, oconus: false },
  { id: 'ns_great_lakes',name: 'Naval Station Great Lakes', area: 'Lake County, IL',             state: 'IL', perDiem: 174, oconus: false },
  { id: 'nbk',           name: 'Naval Base Kitsap',         area: 'Kitsap County, WA',           state: 'WA', perDiem: 215, oconus: false },
  { id: 'nas_oceana',    name: 'NAS Oceana',                area: 'Virginia Beach, VA',          state: 'VA', perDiem: 189, oconus: false },
  { id: 'nas_patuxent',  name: 'NAS Patuxent River',        area: "St. Mary's County, MD",       state: 'MD', perDiem: 198, oconus: false },
  { id: 'nas_corpus_christi', name: 'NAS Corpus Christi',   area: 'Nueces County, TX',           state: 'TX', perDiem: 166, oconus: false },
  { id: 'subase_kings_bay', name: 'Sub Base Kings Bay',     area: 'Camden County, GA',           state: 'GA', perDiem: 166, oconus: false },
  { id: 'nas_lemoore',   name: 'NAS Lemoore',              area: 'Kings County, CA',             state: 'CA', perDiem: 166, oconus: false },
  { id: 'nas_north_island', name: 'NAS North Island',       area: 'Coronado, CA',                state: 'CA', perDiem: 279, oconus: false },
  { id: 'nas_fallon',    name: 'NAS Fallon',                area: 'Churchill County, NV',        state: 'NV', perDiem: 166, oconus: false },
  { id: 'mcas_miramar',  name: 'MCAS Miramar',             area: 'San Diego County, CA',         state: 'CA', perDiem: 279, oconus: false },
  { id: 'mcas_yuma',     name: 'MCAS Yuma',                 area: 'Yuma County, AZ',             state: 'AZ', perDiem: 166, oconus: false },
  { id: 'mcas_beaufort', name: 'MCAS Beaufort',             area: 'Beaufort County, SC',         state: 'SC', perDiem: 166, oconus: false },
  { id: 'mcas_cherry_point', name: 'MCAS Cherry Point',     area: 'Craven County, NC',           state: 'NC', perDiem: 166, oconus: false },
  { id: 'mcas_new_river',name: 'MCAS New River',            area: 'Onslow County, NC',           state: 'NC', perDiem: 166, oconus: false },
  { id: 'mcb_hawaii',    name: 'MCB Hawaii (Kaneohe Bay)',  area: 'Honolulu County, HI',         state: 'HI', perDiem: 369, oconus: false },
  { id: 'hill',          name: 'Hill AFB',                  area: 'Davis County, UT',            state: 'UT', perDiem: 166, oconus: false },
  { id: 'nellis',        name: 'Nellis AFB',                area: 'Clark County, NV',            state: 'NV', perDiem: 197, oconus: false },
  { id: 'keesler',       name: 'Keesler AFB',               area: 'Harrison County, MS',         state: 'MS', perDiem: 166, oconus: false },
  { id: 'maxwell',       name: 'Maxwell AFB',               area: 'Montgomery County, AL',       state: 'AL', perDiem: 166, oconus: false },
  { id: 'travis',        name: 'Travis AFB',                area: 'Solano County, CA',           state: 'CA', perDiem: 199, oconus: false },
  { id: 'scott',         name: 'Scott AFB',                 area: "St. Clair County, IL",        state: 'IL', perDiem: 166, oconus: false },
  { id: 'nbvc',          name: 'Naval Base Ventura County', area: 'Ventura County, CA',          state: 'CA', perDiem: 237, oconus: false },
  { id: 'schofield',     name: 'Schofield Barracks',        area: 'Honolulu County, HI',         state: 'HI', perDiem: 369, oconus: false },
  // ── OCONUS ───────────────────────────────────────────────────────────────────
  { id: 'oc_humphreys',   name: 'Camp Humphreys',           area: 'Pyeongtaek, South Korea',     state: 'KOR', perDiem: 148, oconus: true },
  { id: 'oc_ramstein',    name: 'Ramstein AB',              area: 'Kaiserslautern, Germany',     state: 'DEU', perDiem: 192, oconus: true },
  { id: 'oc_grafenwoehr', name: 'Grafenwöhr / Rose Barracks', area: 'Bavaria, Germany',          state: 'DEU', perDiem: 189, oconus: true },
  { id: 'oc_spangdahlem', name: 'Spangdahlem AB',           area: 'Eifel, Germany',              state: 'DEU', perDiem: 189, oconus: true },
  { id: 'oc_kadena',      name: 'Kadena AB',                area: 'Okinawa, Japan',              state: 'JPN', perDiem: 223, oconus: true },
  { id: 'oc_yokosuka',    name: 'Naval Base Yokosuka',      area: 'Kanagawa, Japan',             state: 'JPN', perDiem: 220, oconus: true },
  { id: 'oc_misawa',      name: 'Misawa AB',                area: 'Aomori, Japan',               state: 'JPN', perDiem: 200, oconus: true },
  { id: 'oc_bahrain',     name: 'NSA Bahrain',              area: 'Manama, Bahrain',             state: 'BHR', perDiem: 196, oconus: true },
  { id: 'oc_aviano',      name: 'Aviano AB',                area: 'Friuli, Italy',               state: 'ITA', perDiem: 204, oconus: true },
  { id: 'oc_naples',      name: 'NSA Naples',               area: 'Naples, Italy',               state: 'ITA', perDiem: 218, oconus: true },
  { id: 'oc_rota',        name: 'Naval Station Rota',       area: 'Rota, Spain',                 state: 'ESP', perDiem: 182, oconus: true },
  { id: 'oc_lajes',       name: 'Lajes Field',              area: 'Azores, Portugal',            state: 'PRT', perDiem: 161, oconus: true },
];

export function searchLocalities(query: string, oconus?: boolean): Locality[] {
  let list = oconus !== undefined ? LOCALITIES.filter((l) => l.oconus === oconus) : LOCALITIES;
  if (!query.trim()) return list;
  const q = query.toLowerCase();
  return list.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.area.toLowerCase().includes(q) ||
      l.state.toLowerCase().includes(q),
  );
}
