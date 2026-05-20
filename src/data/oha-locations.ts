/**
 * OHA (Overseas Housing Allowance) location reference database.
 *
 * OHA ceiling rates are set QUARTERLY by DTMO and fluctuate with local exchange rates.
 * This file is the location reference only — actual rates must be verified at dtmo.mil.
 *
 * To add a new OCONUS location: add an entry below with the correct region and note.
 * Source: JTR Chapter 10 / DTMO OHA rate tables.
 */

export interface OhaLocation {
  label:   string;   // Installation / city name
  country: string;   // Host nation
  region:  string;   // Geographic region for grouping/filtering
  note:    string;   // Context on the local housing market
}

export const OHA_LOCATIONS: OhaLocation[] = [
  // ── JAPAN ─────────────────────────────────────────────────────────────────
  {
    label:   'Yokota AB / Tokyo Area',
    country: 'Japan',
    region:  'Asia-Pacific',
    note:    'High cost-of-living zone. OHA ceiling is set quarterly and is typically among the highest in the Pacific. Tokyo metro housing is USD-equivalent expensive.',
  },
  {
    label:   'Kadena AB, Okinawa',
    country: 'Japan',
    region:  'Asia-Pacific',
    note:    'US forces operate under SOFA. OHA covers typical off-base apartment rent in the Okinawa civilian market.',
  },
  {
    label:   'CFAY Yokosuka',
    country: 'Japan',
    region:  'Asia-Pacific',
    note:    'Navy Fleet Activities Yokosuka. High rental demand near the base; OHA ceiling is substantial.',
  },
  {
    label:   'Misawa AB',
    country: 'Japan',
    region:  'Asia-Pacific',
    note:    'Northern Honshu. Lower cost of living than the Tokyo or Okinawa areas.',
  },
  {
    label:   'Camp Foster / Futenma, Okinawa',
    country: 'Japan',
    region:  'Asia-Pacific',
    note:    'Marine Corps, Okinawa. Rental market similar to Kadena AB area.',
  },
  {
    label:   'Iwakuni MCAS, Japan',
    country: 'Japan',
    region:  'Asia-Pacific',
    note:    'Marine Corps Air Station. Western Honshu — moderate local rental market.',
  },

  // ── SOUTH KOREA ───────────────────────────────────────────────────────────
  {
    label:   'Camp Humphreys, South Korea',
    country: 'South Korea',
    region:  'Asia-Pacific',
    note:    'Largest US overseas installation. Most junior enlisted live on-post. Senior NCOs and officers use OHA for off-post housing in the Pyeongtaek area.',
  },
  {
    label:   'Osan AB, South Korea',
    country: 'South Korea',
    region:  'Asia-Pacific',
    note:    'Smaller installation. OHA covers local housing in the Pyeongtaek / Songtan area.',
  },
  {
    label:   'Camp Walker / Daegu, South Korea',
    country: 'South Korea',
    region:  'Asia-Pacific',
    note:    'US Army Garrison Daegu. OHA reflects regional Korean housing costs, generally lower than Seoul area.',
  },

  // ── GERMANY ───────────────────────────────────────────────────────────────
  {
    label:   'Ramstein AB, Germany',
    country: 'Germany',
    region:  'Europe',
    note:    'USAFE Headquarters — Kaiserslautern area. High euro-denominated rental market. OHA is adjusted when USD/EUR shifts significantly.',
  },
  {
    label:   'Stuttgart (HQ EUCOM / AFRICOM)',
    country: 'Germany',
    region:  'Europe',
    note:    'Premium housing market in Baden-Württemberg. Strong competition from civilian tech sector drives rents higher.',
  },
  {
    label:   'Wiesbaden / Clay Kaserne',
    country: 'Germany',
    region:  'Europe',
    note:    'US Army Europe HQ. Strong rental competition in Hesse state near Frankfurt.',
  },
  {
    label:   'Spangdahlem AB, Germany',
    country: 'Germany',
    region:  'Europe',
    note:    'Rural Eifel region — lower cost than Frankfurt or Ramstein.',
  },
  {
    label:   'Grafenwöhr / Vilseck, Germany',
    country: 'Germany',
    region:  'Europe',
    note:    'Training area garrison in rural Bavaria. Moderate housing market.',
  },

  // ── UNITED KINGDOM ────────────────────────────────────────────────────────
  {
    label:   'RAF Lakenheath, UK',
    country: 'United Kingdom',
    region:  'Europe',
    note:    'GBP-denominated rents. OHA fluctuates with the USD/GBP exchange rate. Suffolk county market.',
  },
  {
    label:   'RAF Mildenhall, UK',
    country: 'United Kingdom',
    region:  'Europe',
    note:    'Co-located with Lakenheath. Same housing market area — Suffolk, East Anglia.',
  },
  {
    label:   'RAF Croughton / Alconbury, UK',
    country: 'United Kingdom',
    region:  'Europe',
    note:    'Smaller US footprint. Northamptonshire / Cambridgeshire area.',
  },

  // ── ITALY ─────────────────────────────────────────────────────────────────
  {
    label:   'Aviano AB, Italy',
    country: 'Italy',
    region:  'Europe',
    note:    'Northern Italy, Friuli region. Euro-denominated rents. Moderate compared to major Italian cities.',
  },
  {
    label:   'NAS Sigonella, Sicily',
    country: 'Italy',
    region:  'Europe',
    note:    'Sicily. Generally lower cost than mainland Italy.',
  },
  {
    label:   'Naval Support Activity Naples',
    country: 'Italy',
    region:  'Europe',
    note:    'Naples metro area. Busy rental market near the base.',
  },

  // ── SPAIN / PORTUGAL ──────────────────────────────────────────────────────
  {
    label:   'Naval Station Rota, Spain',
    country: 'Spain',
    region:  'Europe',
    note:    'Southern Spain (Cádiz province). Generally lower-cost European market.',
  },
  {
    label:   'Morón AB, Spain',
    country: 'Spain',
    region:  'Europe',
    note:    'Seville province. Moderate Spanish housing costs.',
  },
  {
    label:   'Lajes Field, Azores',
    country: 'Portugal',
    region:  'Europe',
    note:    'Remote island posting. Limited off-base housing; most personnel live on-post.',
  },

  // ── MIDDLE EAST ───────────────────────────────────────────────────────────
  {
    label:   'NSA Bahrain (5th Fleet HQ)',
    country: 'Bahrain',
    region:  'Middle East',
    note:    'US NAVCENT Headquarters. OHA covers villa or apartment rent in the Manama / Juffair area.',
  },
  {
    label:   'Al Udeid AB, Qatar',
    country: 'Qatar',
    region:  'Middle East',
    note:    'Largest USAF base in Middle East. Most personnel live on-base; OHA applies to those authorized off-post.',
  },
  {
    label:   'Ali Al Salem AB, Kuwait',
    country: 'Kuwait',
    region:  'Middle East',
    note:    'Predominantly on-post housing. OHA applies when off-post is authorized.',
  },

  // ── AFRICA ────────────────────────────────────────────────────────────────
  {
    label:   'Camp Lemonnier, Djibouti',
    country: 'Djibouti',
    region:  'Africa',
    note:    'East Africa CJTF-HOA hub. High hardship differential applies. Limited off-base civilian housing market.',
  },

  // ── SPECIAL / REMOTE ──────────────────────────────────────────────────────
  {
    label:   'Guantanamo Bay, Cuba',
    country: 'Cuba',
    region:  'Caribbean',
    note:    'GTMO. Essentially no off-base civilian market. Nearly all personnel live on-post; OHA rarely applicable.',
  },
  {
    label:   'Thule AB / Pituffik Space Base, Greenland',
    country: 'Greenland (Denmark)',
    region:  'Arctic',
    note:    'Arctic posting. OHA is modest; virtually all personnel live on-post by necessity.',
  },
  {
    label:   'Diego Garcia (BIOT)',
    country: 'British Indian Ocean Territory',
    region:  'Indian Ocean',
    note:    'Remote atoll. All personnel live on-post. OHA does not typically apply.',
  },
  {
    label:   'Incirlik AB, Turkey',
    country: 'Turkey',
    region:  'Europe',
    note:    'Southern Turkey. OHA is set in USD-equivalent for the Turkish lira market.',
  },
];

/**
 * Search OHA locations by label, country, or region.
 * Returns empty array when query is blank.
 */
export function searchOhaLocations(query: string): OhaLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return OHA_LOCATIONS.filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.country.toLowerCase().includes(q) ||
      o.region.toLowerCase().includes(q),
  );
}
