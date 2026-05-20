/**
 * MHA (Military Housing Area) master database.
 *
 * This is the single source of truth for all duty-station location lookups.
 * To add a new installation: add an entry here AND ensure the ZIP (or a ZIP_ALIAS)
 * exists in bah-rates.ts so the rate lookup resolves correctly.
 *
 * Source: DoD BAH MHA designations — militarypay.defense.gov
 * Effective: FY2026 (January 1, 2026)
 */

export interface MhaLocation {
  label:   string;   // Full display name (installation / city)
  zip:     string;   // Representative MHA ZIP code (must exist in bah-rates RAW or ZIP_ALIAS)
  state:   string;   // Two-letter state/territory code
  branch?: string;   // Service branch (only set when non-obvious, e.g. 'USCG')
  city?:   string;   // Nearby city name for search fallback
}

export const MHA_LOCATIONS: MhaLocation[] = [
  // ── NORTHEAST ─────────────────────────────────────────────────────────────
  { label: 'Fort Drum, NY',                   zip: '13602', state: 'NY', city: 'Watertown' },
  { label: 'Fort Hamilton, NY',               zip: '11252', state: 'NY', city: 'Brooklyn' },
  { label: 'West Point (USMA), NY',           zip: '10996', state: 'NY', city: 'West Point' },
  { label: 'JBMDL, NJ',                       zip: '08641', state: 'NJ', city: 'Wrightstown' },
  { label: 'Carlisle Barracks, PA',           zip: '17013', state: 'PA', city: 'Carlisle' },
  { label: 'Hanscom AFB, MA',                 zip: '01731', state: 'MA', city: 'Bedford' },
  { label: 'NSB New London, CT',              zip: '06340', state: 'CT', city: 'Groton' },

  // ── MID-ATLANTIC ──────────────────────────────────────────────────────────
  { label: 'DC / Joint Base Andrews Area',    zip: '20762', state: 'MD', city: 'Camp Springs' },
  { label: 'Fort Meade, MD',                  zip: '20755', state: 'MD', city: 'Odenton' },
  { label: 'NAS Patuxent River, MD',          zip: '20670', state: 'MD', city: 'Lexington Park' },
  { label: 'Aberdeen Proving Ground, MD',     zip: '21005', state: 'MD', city: 'Aberdeen' },
  { label: 'Fort Detrick, MD',                zip: '21702', state: 'MD', city: 'Frederick' },
  { label: 'Fort Belvoir, VA',                zip: '22060', state: 'VA', city: 'Fort Belvoir' },
  { label: 'Fort Myer / Arlington, VA',       zip: '22211', state: 'VA', city: 'Arlington' },
  { label: 'Quantico, VA',                    zip: '22134', state: 'VA', city: 'Quantico' },
  { label: 'Norfolk / Hampton Roads, VA',     zip: '23511', state: 'VA', city: 'Norfolk' },

  // ── SOUTHEAST ─────────────────────────────────────────────────────────────
  { label: 'Fort Liberty, NC',                zip: '28301', state: 'NC', city: 'Fayetteville' },
  { label: 'Camp Lejeune, NC',                zip: '28542', state: 'NC', city: 'Jacksonville' },
  { label: 'Seymour Johnson AFB, NC',         zip: '27531', state: 'NC', city: 'Goldsboro' },
  { label: 'Fort Jackson, SC',                zip: '29207', state: 'SC', city: 'Columbia' },
  { label: 'Shaw AFB, SC',                    zip: '29152', state: 'SC', city: 'Sumter' },
  { label: 'Fort Eisenhower, GA',             zip: '30905', state: 'GA', city: 'Augusta' },
  { label: 'Fort Moore, GA',                  zip: '31905', state: 'GA', city: 'Columbus' },
  { label: 'Fort Stewart, GA',                zip: '31314', state: 'GA', city: 'Hinesville' },
  { label: 'NAS Jacksonville, FL',            zip: '32212', state: 'FL', city: 'Jacksonville' },
  { label: 'MacDill AFB, FL',                 zip: '33621', state: 'FL', city: 'Tampa' },
  { label: 'NAS Pensacola, FL',               zip: '32508', state: 'FL', city: 'Pensacola' },
  { label: 'Fort Novosel, AL',                zip: '36322', state: 'AL', city: 'Daleville' },
  { label: 'Redstone Arsenal, AL',            zip: '35809', state: 'AL', city: 'Huntsville' },
  { label: 'Keesler AFB, MS',                 zip: '39534', state: 'MS', city: 'Biloxi' },

  // ── SOUTH / SOUTH-CENTRAL ─────────────────────────────────────────────────
  { label: 'Barksdale AFB, LA',               zip: '71110', state: 'LA', city: 'Bossier City' },
  { label: 'Fort Johnson, LA',                zip: '71446', state: 'LA', city: 'Leesville' },
  { label: 'Fort Cavazos, TX',                zip: '76544', state: 'TX', city: 'Killeen' },
  { label: 'Sheppard AFB, TX',                zip: '76311', state: 'TX', city: 'Wichita Falls' },
  { label: 'Dyess AFB, TX',                   zip: '79607', state: 'TX', city: 'Abilene' },
  { label: 'Fort Bliss, TX',                  zip: '79916', state: 'TX', city: 'El Paso' },
  { label: 'Joint Base San Antonio (JBSA)',   zip: '78234', state: 'TX', city: 'San Antonio' },
  { label: 'Fort Sill, OK',                   zip: '73503', state: 'OK', city: 'Lawton' },
  { label: 'Tinker AFB, OK',                  zip: '73145', state: 'OK', city: 'Oklahoma City' },

  // ── MIDWEST ───────────────────────────────────────────────────────────────
  { label: 'Scott AFB, IL',                   zip: '62225', state: 'IL', city: 'O\'Fallon' },
  { label: 'Wright-Patterson AFB, OH',        zip: '45433', state: 'OH', city: 'Dayton' },
  { label: 'Fort Knox, KY',                   zip: '40121', state: 'KY', city: 'Radcliff' },
  { label: 'Fort Campbell, KY/TN',            zip: '37040', state: 'KY', city: 'Clarksville' },
  { label: 'Fort Leonard Wood, MO',           zip: '65473', state: 'MO', city: 'Waynesville' },
  { label: 'Offutt AFB, NE',                  zip: '68113', state: 'NE', city: 'Bellevue' },
  { label: 'Fort Leavenworth, KS',            zip: '66027', state: 'KS', city: 'Leavenworth' },
  { label: 'Ellsworth AFB, SD',               zip: '57706', state: 'SD', city: 'Box Elder' },
  { label: 'Malmstrom AFB, MT',               zip: '59402', state: 'MT', city: 'Great Falls' },
  { label: 'Minot AFB, ND',                   zip: '58705', state: 'ND', city: 'Minot' },

  // ── WEST / MOUNTAIN ───────────────────────────────────────────────────────
  { label: 'Fort Huachuca, AZ',               zip: '85613', state: 'AZ', city: 'Sierra Vista' },
  { label: 'Davis-Monthan AFB, AZ',           zip: '85707', state: 'AZ', city: 'Tucson' },
  { label: 'Luke AFB, AZ',                    zip: '85308', state: 'AZ', city: 'Glendale' },
  { label: 'White Sands Missile Range, NM',   zip: '88002', state: 'NM', city: 'Las Cruces' },
  { label: 'Hill AFB, UT',                    zip: '84056', state: 'UT', city: 'Ogden' },
  { label: 'Mountain Home AFB, ID',           zip: '83648', state: 'ID', city: 'Mountain Home' },
  { label: 'Nellis AFB, NV',                  zip: '89191', state: 'NV', city: 'Las Vegas' },
  { label: 'Fort Carson, CO',                 zip: '80913', state: 'CO', city: 'Colorado Springs' },

  // ── PACIFIC COAST ─────────────────────────────────────────────────────────
  { label: 'Fort Irwin / NTC, CA',            zip: '92310', state: 'CA', city: 'Barstow' },
  { label: 'NAS Lemoore, CA',                 zip: '93245', state: 'CA', city: 'Lemoore' },
  { label: 'Vandenberg SFB, CA',              zip: '93437', state: 'CA', city: 'Lompoc' },
  { label: 'Travis AFB, CA',                  zip: '94535', state: 'CA', city: 'Fairfield' },
  { label: 'Presidio of Monterey, CA',        zip: '93944', state: 'CA', city: 'Monterey' },
  { label: 'San Diego / Camp Pendleton, CA',  zip: '92054', state: 'CA', city: 'San Diego' },
  { label: 'NAS Whidbey Island, WA',          zip: '98278', state: 'WA', city: 'Oak Harbor' },
  { label: 'JBLM — Tacoma / Lakewood, WA',   zip: '98433', state: 'WA', city: 'Tacoma' },
  { label: 'Naval Station Everett, WA',       zip: '98201', state: 'WA', city: 'Everett' },

  // ── ALASKA & HAWAII ───────────────────────────────────────────────────────
  { label: 'JBER — Anchorage, AK',            zip: '99501', state: 'AK', city: 'Anchorage' },
  { label: 'Fort Wainwright — Fairbanks, AK', zip: '99703', state: 'AK', city: 'Fairbanks' },
  { label: 'Hawaii — Schofield / JBPHH',      zip: '96818', state: 'HI', city: 'Honolulu' },

  // ── COAST GUARD ───────────────────────────────────────────────────────────
  { label: 'CG Base Portsmouth, NH',          zip: '03801', state: 'NH', branch: 'USCG', city: 'Portsmouth' },
  { label: 'CG Base Boston, MA',              zip: '02110', state: 'MA', branch: 'USCG', city: 'Boston' },
  { label: 'CG AIRSTA Cape Cod, MA',          zip: '02563', state: 'MA', branch: 'USCG', city: 'Sandwich' },
  { label: 'CG Base New Haven, CT',           zip: '06512', state: 'CT', branch: 'USCG', city: 'New Haven' },
  { label: 'CG Sector New York, NY',          zip: '10305', state: 'NY', branch: 'USCG', city: 'Staten Island' },
  { label: 'CG Base Philadelphia, PA',        zip: '19112', state: 'PA', branch: 'USCG', city: 'Philadelphia' },
  { label: 'CG ISC Baltimore, MD',            zip: '21230', state: 'MD', branch: 'USCG', city: 'Baltimore' },
  { label: 'CG Base Portsmouth, VA',          zip: '23703', state: 'VA', branch: 'USCG', city: 'Portsmouth' },
  { label: 'CG Base Elizabeth City, NC',      zip: '27909', state: 'NC', branch: 'USCG', city: 'Elizabeth City' },
  { label: 'CG Sector Charleston, SC',        zip: '29405', state: 'SC', branch: 'USCG', city: 'Charleston' },
  { label: 'CG AIRSTA Savannah, GA',          zip: '31408', state: 'GA', branch: 'USCG', city: 'Savannah' },
  { label: 'CG Sector Jacksonville, FL',      zip: '32210', state: 'FL', branch: 'USCG', city: 'Jacksonville' },
  { label: 'CG Base Miami Beach, FL',         zip: '33139', state: 'FL', branch: 'USCG', city: 'Miami Beach' },
  { label: 'CG AIRSTA Clearwater, FL',        zip: '33762', state: 'FL', branch: 'USCG', city: 'Clearwater' },
  { label: 'CG Sector Mobile, AL',            zip: '36615', state: 'AL', branch: 'USCG', city: 'Mobile' },
  { label: 'CG Base Memphis, TN',             zip: '38103', state: 'TN', branch: 'USCG', city: 'Memphis' },
  { label: 'CG Base New Orleans, LA',         zip: '70129', state: 'LA', branch: 'USCG', city: 'New Orleans' },
  { label: 'CG Base Galveston, TX',           zip: '77553', state: 'TX', branch: 'USCG', city: 'Galveston' },
  { label: 'CG AIRSTA Corpus Christi, TX',    zip: '78419', state: 'TX', branch: 'USCG', city: 'Corpus Christi' },
  { label: 'CG Base Cleveland, OH',           zip: '44114', state: 'OH', branch: 'USCG', city: 'Cleveland' },
  { label: 'CG Base Detroit, MI',             zip: '48226', state: 'MI', branch: 'USCG', city: 'Detroit' },
  { label: 'CG Base Chicago, IL',             zip: '60605', state: 'IL', branch: 'USCG', city: 'Chicago' },
  { label: 'CG AIRSTA Sacramento, CA',        zip: '95655', state: 'CA', branch: 'USCG', city: 'McClellan' },
  { label: 'CG Base Alameda / San Francisco', zip: '94501', state: 'CA', branch: 'USCG', city: 'Alameda' },
  { label: 'CG Base Los Angeles, CA',         zip: '90731', state: 'CA', branch: 'USCG', city: 'San Pedro' },
  { label: 'CG Base San Diego, CA',           zip: '92135', state: 'CA', branch: 'USCG', city: 'San Diego' },
  { label: 'CG AIRSTA Port Angeles, WA',      zip: '98363', state: 'WA', branch: 'USCG', city: 'Port Angeles' },
  { label: 'CG Base Seattle, WA',             zip: '98134', state: 'WA', branch: 'USCG', city: 'Seattle' },
  { label: 'CG Base Portland, OR',            zip: '97217', state: 'OR', branch: 'USCG', city: 'Portland' },
  { label: 'CG Base Honolulu, HI',            zip: '96819', state: 'HI', branch: 'USCG', city: 'Honolulu' },
  { label: 'CG Base Juneau, AK',              zip: '99801', state: 'AK', branch: 'USCG', city: 'Juneau' },
  { label: 'CG AIRSTA Sitka, AK',             zip: '99835', state: 'AK', branch: 'USCG', city: 'Sitka' },
  { label: 'CG Base Kodiak, AK',              zip: '99615', state: 'AK', branch: 'USCG', city: 'Kodiak' },
];

/**
 * Search MHA locations by any of: label, city, state, ZIP, or branch.
 * Returns empty array when query is blank.
 */
export function searchMhaLocations(query: string): MhaLocation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MHA_LOCATIONS.filter(
    (m) =>
      m.label.toLowerCase().includes(q) ||
      m.zip.includes(q) ||
      m.state.toLowerCase() === q ||
      (m.city?.toLowerCase().includes(q) ?? false) ||
      (m.branch?.toLowerCase().includes(q) ?? false),
  );
}

/** Look up a single MHA location by ZIP code. */
export function getMhaByZip(zip: string): MhaLocation | undefined {
  return MHA_LOCATIONS.find((m) => m.zip === zip);
}
