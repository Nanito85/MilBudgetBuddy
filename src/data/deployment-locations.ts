/**
 * DoD/IRS-designated Imminent Danger Pay (IDP) and Combat Zone (CZTE)
 * areas — current as of the 2026 designated-areas list.
 *
 * Two separate, overlapping programs:
 *   - IDP (Imminent Danger Pay / Hostile Fire Pay): a flat $225/month for
 *     any part of a month spent in ANY of these areas. DoD FMR Vol 7A Ch 10.
 *   - CZTE (Combat Zone Tax Exclusion): a SUBSET of the IDP areas are also
 *     actual designated Combat Zones under 26 U.S.C. §112 (by Executive
 *     Order, or DoD "direct support" certification tied to one of those
 *     EOs, or by Public Law for the Sinai). In a CZTE zone, basic pay is
 *     excluded from federal income tax — all of it for enlisted/warrant
 *     officers, capped at the E-9 max + IDP for commissioned officers.
 *     Every other IDP-only area gets the $225/mo but stays fully taxable.
 *
 * Sources (cross-referenced, verified directly against irs.gov):
 *   - Current 2026 full designated-areas list: Missouri Secretary of
 *     State's published "Combat Zone, Hostile Fire or Imminent Danger
 *     areas" sheet (sources IRS/DoD designations for voter/tax purposes).
 *   - CZTE legal basis per area: verified directly against the IRS's own
 *     "Combat zones" page (irs.gov/individuals/military/combat-zones) and
 *     IRS Publication 3 (Armed Forces' Tax Guide):
 *       - EO 12744 (Arabian Peninsula, 1991): Persian Gulf, Red Sea, Gulf
 *         of Oman, Gulf of Aden, Arabian Sea (north of 10°N/west of 68°E),
 *         Iraq, Kuwait, Saudi Arabia, Oman, Bahrain, Qatar, UAE — plus
 *         ongoing direct-support areas Jordan (since 3/19/2003), Lebanon
 *         (since 2/12/2015), and Turkey EAST OF 33.51°E longitude only
 *         (since 9/19/2016 — covers Incirlik AB/Diyarbakir; western Turkey
 *         is not included). An EARLIER 2003–2005 direct-support
 *         certification also covered Israel, Egypt, and the E.
 *         Mediterranean Sea, but that one expired — those three are
 *         IDP-only today, not CZTE.
 *       - EO 13119 (Kosovo/former Yugoslavia, 1999): Serbia, Montenegro,
 *         Albania, Kosovo, Adriatic Sea, Ionian Sea (north of 39th
 *         parallel).
 *       - EO 13239 (Afghanistan, 2001) plus its ongoing direct-support
 *         areas: Pakistan, Tajikistan, Jordan, Kyrgyzstan, Uzbekistan
 *         (since 9/19–10/1/2001), Yemen (since 4/10/2002), Djibouti (since
 *         7/1/2002), Somalia and Syria (since 1/1/2004). A separate
 *         Philippines direct-support certification (Mindanao/Sulu, tied to
 *         orders referencing Operation Enduring Freedom) ran 1/9/2002 to
 *         9/30/2015 and has EXPIRED — Philippines is IDP-only today, not
 *         CZTE, despite still appearing on the general danger-pay list.
 *       - Sinai Peninsula: CZTE via the Tax Cuts and Jobs Act (2017), for
 *         multinational peacekeeping (MFO) duty.
 *   - Former Yugoslavia areas (Bosnia, Herzegovina, Croatia, Macedonia)
 *     under the older Public Law 104-117 are NOT in the current 2026 list
 *     at all — no longer any designation, active or otherwise.
 *
 * HOW TO UPDATE: these designations do change (areas get added/removed as
 * operations start/end) — re-check the current-year designated-areas list
 * (search "combat zone hostile fire imminent danger areas <year>") and the
 * IRS's own combat-zone page (irs.gov/individuals/military/combat-zones)
 * for any CZTE reclassification, then update the entries below.
 */

export type DeploymentZoneType = 'czte' | 'idp_only';

export interface DeploymentLocation {
  id: string;
  label: string;
  zoneType: DeploymentZoneType;
}

export const DEPLOYMENT_DATA_EFFECTIVE_YEAR = 2026;

// IDP is a flat rate regardless of location or zone type.
export const IDP_MONTHLY = 225;

function loc(label: string, zoneType: DeploymentZoneType): DeploymentLocation {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return { id, label, zoneType };
}

export const DEPLOYMENT_LOCATIONS: DeploymentLocation[] = [
  loc('Adriatic Sea', 'czte'),
  loc('Afghanistan', 'czte'),
  loc('Albania', 'czte'),
  loc('Algeria', 'idp_only'),
  loc('Arabian Gulf', 'idp_only'),
  loc('Arabian Sea (north of 10°N / west of 68°E)', 'czte'),
  loc('Azerbaijan', 'idp_only'),
  loc('Bab-al-Mandeb Strait', 'idp_only'),
  loc('Bahrain', 'czte'),
  loc('Black Sea', 'idp_only'),
  loc('Burkina Faso', 'idp_only'),
  loc('Burma (Myanmar)', 'idp_only'),
  loc('Burundi', 'idp_only'),
  loc('Cameroon', 'idp_only'),
  loc('Chad', 'idp_only'),
  loc('Colombia', 'idp_only'),
  loc('Congo, Democratic Republic', 'idp_only'),
  loc('Cuba (Guantanamo Bay facilities only)', 'idp_only'),
  loc('Cyprus', 'idp_only'),
  loc('Diego Garcia (Chagos Archipelago & Maldives)', 'idp_only'),
  loc('Djibouti', 'czte'),
  loc('Egypt', 'idp_only'),
  loc('Ethiopia', 'idp_only'),
  loc('Gaza Strip (Mediterranean territorial seas)', 'idp_only'),
  loc('Greece (Island of Crete)', 'idp_only'),
  loc('Gulf of Aden', 'czte'),
  loc('Gulf of Oman', 'czte'),
  loc('Haiti', 'idp_only'),
  loc('Indian Ocean', 'idp_only'),
  loc('Indonesia (Central Sulawesi, Papua)', 'idp_only'),
  loc('Ionian Sea (north of 39th parallel)', 'czte'),
  loc('Iran', 'idp_only'),
  loc('Iraq', 'czte'),
  loc('Israel', 'idp_only'),
  loc('Jordan', 'czte'),
  loc('Kenya', 'idp_only'),
  loc('Kosovo', 'czte'),
  loc('Kuwait', 'czte'),
  loc('Kyrgyzstan', 'czte'),
  loc('Lebanon', 'czte'),
  loc('Libya', 'idp_only'),
  loc('Malaysia (State of Sabah)', 'idp_only'),
  loc('Mali', 'idp_only'),
  loc('Mediterranean Sea', 'idp_only'),
  loc('Montenegro', 'czte'),
  loc('Niger', 'idp_only'),
  loc('Oman', 'czte'),
  loc('Pakistan', 'czte'),
  loc('Persian Gulf', 'czte'),
  // CZTE for this location expired 9/30/2015 (was tied to orders
  // referencing Operation Enduring Freedom) — IDP-only today.
  loc('Philippines (Mindanao, Sulu Archipelago)', 'idp_only'),
  loc('Qatar', 'czte'),
  loc('Red Sea', 'czte'),
  loc('Saudi Arabia', 'czte'),
  loc('Serbia', 'czte'),
  loc('Sinai Peninsula', 'czte'),
  loc('Somalia', 'czte'),
  loc('South Sudan', 'idp_only'),
  loc('Sudan', 'idp_only'),
  loc('Syria', 'czte'),
  loc('Tajikistan', 'czte'),
  loc('Tunisia', 'idp_only'),
  // CZTE only applies east of 33.51°E longitude (Incirlik AB, Diyarbakir),
  // in direct support of the Arabian Peninsula combat zone, since
  // 9/19/2016 — split into two entries so western Turkey doesn't overclaim
  // the tax exclusion it isn't eligible for.
  loc('Turkey (east of 33.51°E — Incirlik AB / Diyarbakir)', 'czte'),
  loc('Turkey (other)', 'idp_only'),
  loc('Uganda', 'idp_only'),
  loc('Ukraine', 'idp_only'),
  loc('United Arab Emirates', 'czte'),
  loc('Uzbekistan', 'czte'),
  loc('Yemen', 'czte'),
].sort((a, b) => a.label.localeCompare(b.label));

const DEPLOYMENT_LOCATION_MAP: Record<string, DeploymentLocation> = Object.fromEntries(
  DEPLOYMENT_LOCATIONS.map((l) => [l.id, l]),
);

export function getDeploymentLocation(id: string | undefined): DeploymentLocation | undefined {
  if (!id) return undefined;
  return DEPLOYMENT_LOCATION_MAP[id];
}
