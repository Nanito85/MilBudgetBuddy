/** Approximate lat/lon for CONUS military installations — used for Haversine distance estimates. */

export interface InstallationCoords {
  lat: number;
  lon: number;
}

export const INSTALLATION_COORDS: Record<string, InstallationCoords> = {
  // Army
  fort_liberty:        { lat: 35.13,  lon: -78.99 },
  fort_campbell:       { lat: 36.67,  lon: -87.47 },
  fort_cavazos:        { lat: 31.13,  lon: -97.78 },
  fort_bliss:          { lat: 31.81,  lon: -106.42 },
  fort_sam_houston:    { lat: 29.45,  lon: -98.44 },
  fort_carson:         { lat: 38.72,  lon: -104.78 },
  jblm:                { lat: 47.12,  lon: -122.57 },
  fort_drum:           { lat: 44.05,  lon: -75.77 },
  fort_eisenhower:     { lat: 33.41,  lon: -82.15 },
  fort_moore:          { lat: 32.35,  lon: -84.99 },
  fort_stewart:        { lat: 31.87,  lon: -81.61 },
  fort_leavenworth:    { lat: 39.36,  lon: -94.92 },
  fort_knox:           { lat: 37.89,  lon: -85.96 },
  fort_sill:           { lat: 34.65,  lon: -98.40 },
  fort_novosel:        { lat: 31.31,  lon: -85.72 },
  fort_johnson:        { lat: 31.05,  lon: -93.22 },
  schofield:           { lat: 21.49,  lon: -158.04 },
  fort_wainwright:     { lat: 64.83,  lon: -147.65 },
  fort_richardson:     { lat: 61.27,  lon: -149.68 },
  fort_irwin:          { lat: 35.26,  lon: -116.68 },
  fort_huachuca:       { lat: 31.55,  lon: -110.34 },
  fort_leonard_wood:   { lat: 37.74,  lon: -92.14 },
  fort_belvoir:        { lat: 38.72,  lon: -77.15 },
  fort_myer:           { lat: 38.88,  lon: -77.07 },
  fort_hamilton:       { lat: 40.60,  lon: -74.04 },
  fort_dix:            { lat: 40.01,  lon: -74.62 },
  fort_detrick:        { lat: 39.43,  lon: -77.42 },
  redstone_arsenal:    { lat: 34.68,  lon: -86.64 },
  aberdeen_pg:         { lat: 39.47,  lon: -76.13 },
  white_sands:         { lat: 32.38,  lon: -106.48 },
  usma:                { lat: 41.39,  lon: -73.96 },
  carlisle_barracks:   { lat: 40.20,  lon: -77.19 },
  fort_mcnair:         { lat: 38.87,  lon: -77.01 },
  presidio_monterey:   { lat: 36.59,  lon: -121.88 },
  // Navy
  ns_norfolk:          { lat: 36.94,  lon: -76.33 },
  nas_jacksonville:    { lat: 30.23,  lon: -81.68 },
  nas_pensacola:       { lat: 30.35,  lon: -87.32 },
  nas_san_diego:       { lat: 32.70,  lon: -117.20 },
  nbk:                 { lat: 47.56,  lon: -122.62 },
  ns_mayport:          { lat: 30.39,  lon: -81.43 },
  jbphh:               { lat: 21.36,  lon: -157.97 },
  nas_whidbey:         { lat: 48.35,  lon: -122.66 },
  nbvc:                { lat: 34.12,  lon: -119.11 },
  nas_lemoore:         { lat: 36.33,  lon: -119.95 },
  nas_north_island:    { lat: 32.70,  lon: -117.21 },
  nas_patuxent:        { lat: 38.29,  lon: -76.41 },
  ns_newport:          { lat: 41.50,  lon: -71.33 },
  ns_great_lakes:      { lat: 42.28,  lon: -87.83 },
  nas_oceana:          { lat: 36.82,  lon: -76.03 },
  subase_new_london:   { lat: 41.39,  lon: -72.09 },
  subase_kings_bay:    { lat: 30.80,  lon: -81.59 },
  nas_fallon:          { lat: 39.42,  lon: -118.70 },
  nas_corpus_christi:  { lat: 27.70,  lon: -97.29 },
  // Marines
  camp_lejeune:        { lat: 34.68,  lon: -77.36 },
  camp_pendleton:      { lat: 33.37,  lon: -117.42 },
  quantico:            { lat: 38.52,  lon: -77.30 },
  mcas_miramar:        { lat: 32.87,  lon: -117.14 },
  mcas_beaufort:       { lat: 32.48,  lon: -80.72 },
  mcas_cherry_point:   { lat: 34.90,  lon: -76.88 },
  mcas_new_river:      { lat: 34.71,  lon: -77.44 },
  mcas_yuma:           { lat: 32.66,  lon: -114.61 },
  mcagcc_29palms:      { lat: 34.24,  lon: -116.15 },
  mcb_hawaii:          { lat: 21.45,  lon: -157.76 },
  mclb_albany:         { lat: 31.58,  lon: -84.10 },
  mclb_barstow:        { lat: 34.85,  lon: -117.02 },
  mcrd_parris_island:  { lat: 32.34,  lon: -80.68 },
  mcrd_san_diego:      { lat: 32.75,  lon: -117.19 },
  mcmwtc_bridgeport:   { lat: 38.27,  lon: -119.23 },
  marine_barracks_dc:  { lat: 38.88,  lon: -76.99 },
  // Air Force
  jble:                { lat: 37.08,  lon: -76.36 },
  jba:                 { lat: 38.81,  lon: -76.87 },
  macdill:             { lat: 27.85,  lon: -82.52 },
  eglin:               { lat: 30.48,  lon: -86.53 },
  wpafb:               { lat: 39.83,  lon: -84.05 },
  tinker:              { lat: 35.41,  lon: -97.39 },
  barksdale:           { lat: 32.50,  lon: -93.66 },
  travis:              { lat: 38.27,  lon: -121.93 },
  nellis:              { lat: 36.24,  lon: -115.03 },
  hill:                { lat: 41.12,  lon: -111.97 },
  minot:               { lat: 48.42,  lon: -101.35 },
  keesler:             { lat: 30.42,  lon: -88.92 },
  maxwell:             { lat: 32.38,  lon: -86.36 },
};

/** Haversine great-circle distance in miles between two lat/lon points. */
export function haversineMiles(a: InstallationCoords, b: InstallationCoords): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const chord =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLon *
      sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord));
}

/** Estimate driving distance ≈ straight-line × 1.25 factor, rounded to nearest 25 miles. */
export function estimateDrivingMiles(from: string, to: string): number | null {
  const a = INSTALLATION_COORDS[from];
  const b = INSTALLATION_COORDS[to];
  if (!a || !b) return null;
  return Math.round((haversineMiles(a, b) * 1.25) / 25) * 25;
}
