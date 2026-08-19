import { zipToState } from '@/data/zip-state-ranges';

export interface Installation {
  id: string;
  name: string;
  city: string;
  state: string;
  mhaZip: string;
  // `oconus` drives BAH-vs-OHA: Hawaii and Alaska get standard BAH (not OHA,
  // since the 2018 JTR reform folded them into the CONUS-style BAH system), so
  // they are correctly `oconus: false` here — do not "fix" that.
  oconus: boolean;
  // Separate flag for PCS-travel classification (TLE vs TLA, per diem schedule,
  // COLA type). Hawaii and Alaska are non-foreign OCONUS: they draw BAH like
  // CONUS, but they are NOT CONUS for travel purposes — a PCS move there/away
  // uses TLA (60 days, no $/day cap) on the DoD non-foreign per diem schedule,
  // never GSA CONUS per-diem or the TLE $290/day cap. See src/data/nonforeign-oconus-rates.ts.
  nonForeignOconus?: boolean;
  branch: 'Army' | 'Navy' | 'Marines' | 'Air Force' | 'Space Force' | 'Coast Guard' | 'Joint';
}

export const INSTALLATIONS: Installation[] = [
  // ── ARMY ─────────────────────────────────────────────────────────────────────
  { id: 'fort_liberty',        name: 'Fort Liberty',              city: 'Fayetteville',       state: 'NC', mhaZip: '28301', oconus: false, branch: 'Army' },
  { id: 'fort_campbell',       name: 'Fort Campbell',             city: 'Clarksville',        state: 'TN', mhaZip: '37040', oconus: false, branch: 'Army' },
  { id: 'fort_cavazos',        name: 'Fort Cavazos',              city: 'Killeen',            state: 'TX', mhaZip: '76544', oconus: false, branch: 'Army' },
  { id: 'fort_bliss',          name: 'Fort Bliss',                city: 'El Paso',            state: 'TX', mhaZip: '79916', oconus: false, branch: 'Army' },
  { id: 'fort_sam_houston',    name: 'Fort Sam Houston (JBSA)',   city: 'San Antonio',        state: 'TX', mhaZip: '78234', oconus: false, branch: 'Army' },
  { id: 'fort_carson',         name: 'Fort Carson',               city: 'Colorado Springs',   state: 'CO', mhaZip: '80913', oconus: false, branch: 'Army' },
  { id: 'jblm',                name: 'Joint Base Lewis-McChord',  city: 'Tacoma',             state: 'WA', mhaZip: '98433', oconus: false, branch: 'Joint' },
  { id: 'fort_drum',           name: 'Fort Drum',                 city: 'Watertown',          state: 'NY', mhaZip: '13602', oconus: false, branch: 'Army' },
  { id: 'fort_eisenhower',     name: 'Fort Eisenhower',           city: 'Augusta',            state: 'GA', mhaZip: '30905', oconus: false, branch: 'Army' },
  { id: 'fort_moore',          name: 'Fort Moore',                city: 'Columbus',           state: 'GA', mhaZip: '31905', oconus: false, branch: 'Army' },
  { id: 'fort_stewart',        name: 'Fort Stewart',              city: 'Hinesville',         state: 'GA', mhaZip: '31314', oconus: false, branch: 'Army' },
  { id: 'fort_leavenworth',    name: 'Fort Leavenworth',          city: 'Leavenworth',        state: 'KS', mhaZip: '66027', oconus: false, branch: 'Army' },
  { id: 'fort_knox',           name: 'Fort Knox',                 city: 'Radcliff',           state: 'KY', mhaZip: '40121', oconus: false, branch: 'Army' },
  { id: 'fort_sill',           name: 'Fort Sill',                 city: 'Lawton',             state: 'OK', mhaZip: '73503', oconus: false, branch: 'Army' },
  { id: 'fort_novosel',        name: 'Fort Novosel',              city: 'Daleville',          state: 'AL', mhaZip: '36322', oconus: false, branch: 'Army' },
  { id: 'fort_johnson',        name: 'Fort Johnson',              city: 'Leesville',          state: 'LA', mhaZip: '71446', oconus: false, branch: 'Army' },
  { id: 'schofield',           name: 'Schofield Barracks',        city: 'Wahiawa',            state: 'HI', mhaZip: '96818', oconus: false, nonForeignOconus: true, branch: 'Army' },
  { id: 'fort_wainwright',     name: 'Fort Wainwright',           city: 'Fairbanks',          state: 'AK', mhaZip: '99703', oconus: false, nonForeignOconus: true, branch: 'Army' },
  { id: 'fort_richardson',     name: 'Fort Richardson (JBER)',    city: 'Anchorage',          state: 'AK', mhaZip: '99501', oconus: false, nonForeignOconus: true, branch: 'Army' },
  { id: 'fort_irwin',          name: 'Fort Irwin (NTC)',          city: 'Fort Irwin',         state: 'CA', mhaZip: '92310', oconus: false, branch: 'Army' },
  { id: 'fort_hunter_liggett', name: 'Fort Hunter Liggett',       city: 'Jolon',              state: 'CA', mhaZip: '93928', oconus: false, branch: 'Army' },
  { id: 'presidio_monterey',   name: 'Presidio of Monterey',      city: 'Monterey',           state: 'CA', mhaZip: '93944', oconus: false, branch: 'Army' },
  { id: 'fort_huachuca',       name: 'Fort Huachuca',             city: 'Sierra Vista',       state: 'AZ', mhaZip: '85613', oconus: false, branch: 'Army' },
  { id: 'fort_leonard_wood',   name: 'Fort Leonard Wood',         city: 'Waynesville',        state: 'MO', mhaZip: '65473', oconus: false, branch: 'Army' },
  { id: 'fort_belvoir',        name: 'Fort Belvoir',              city: 'Fort Belvoir',       state: 'VA', mhaZip: '22060', oconus: false, branch: 'Army' },
  { id: 'fort_myer',           name: 'Fort Myer-Henderson Hall',  city: 'Arlington',          state: 'VA', mhaZip: '22211', oconus: false, branch: 'Army' },
  { id: 'fort_mcnair',         name: 'Fort Lesley J. McNair',     city: 'Washington',         state: 'DC', mhaZip: '20319', oconus: false, branch: 'Army' },
  { id: 'usma',                name: 'West Point (USMA)',          city: 'West Point',         state: 'NY', mhaZip: '10996', oconus: false, branch: 'Army' },
  { id: 'carlisle_barracks',   name: 'Carlisle Barracks (USAWC)', city: 'Carlisle',           state: 'PA', mhaZip: '17013', oconus: false, branch: 'Army' },
  { id: 'fort_hamilton',       name: 'Fort Hamilton',             city: 'Brooklyn',           state: 'NY', mhaZip: '11252', oconus: false, branch: 'Army' },
  { id: 'fort_dix',            name: 'Joint Base McGuire-Dix-Lakehurst', city: 'Wrightstown', state: 'NJ', mhaZip: '08641', oconus: false, branch: 'Joint' },
  { id: 'fort_detrick',        name: 'Fort Detrick',              city: 'Frederick',          state: 'MD', mhaZip: '21702', oconus: false, branch: 'Army' },
  { id: 'redstone_arsenal',    name: 'Redstone Arsenal',          city: 'Huntsville',         state: 'AL', mhaZip: '35809', oconus: false, branch: 'Army' },
  { id: 'aberdeen_pg',         name: 'Aberdeen Proving Ground',   city: 'Aberdeen',           state: 'MD', mhaZip: '21005', oconus: false, branch: 'Army' },
  { id: 'white_sands',         name: 'White Sands Missile Range', city: 'White Sands',        state: 'NM', mhaZip: '88002', oconus: false, branch: 'Army' },
  { id: 'yuma_pg',             name: 'Yuma Proving Ground',       city: 'Yuma',               state: 'AZ', mhaZip: '85365', oconus: false, branch: 'Army' },
  { id: 'fort_riley',          name: 'Fort Riley',                city: 'Junction City',      state: 'KS', mhaZip: '66442', oconus: false, branch: 'Army' },
  { id: 'fort_gregg_adams',    name: 'Fort Gregg-Adams',          city: 'Petersburg',         state: 'VA', mhaZip: '23230', oconus: false, branch: 'Army' },

  // ── NAVY ─────────────────────────────────────────────────────────────────────
  { id: 'ns_norfolk',          name: 'Naval Station Norfolk',     city: 'Norfolk',            state: 'VA', mhaZip: '23511', oconus: false, branch: 'Navy' },
  { id: 'nas_jacksonville',    name: 'NAS Jacksonville',          city: 'Jacksonville',       state: 'FL', mhaZip: '32212', oconus: false, branch: 'Navy' },
  { id: 'nas_pensacola',       name: 'NAS Pensacola',             city: 'Pensacola',          state: 'FL', mhaZip: '32508', oconus: false, branch: 'Navy' },
  { id: 'nas_san_diego',       name: 'Naval Base San Diego',      city: 'San Diego',          state: 'CA', mhaZip: '92136', oconus: false, branch: 'Navy' },
  { id: 'nbk',                 name: 'Naval Base Kitsap',         city: 'Bremerton',          state: 'WA', mhaZip: '98312', oconus: false, branch: 'Navy' },
  { id: 'ns_mayport',          name: 'Naval Station Mayport',     city: 'Jacksonville',       state: 'FL', mhaZip: '32228', oconus: false, branch: 'Navy' },
  { id: 'jbphh',               name: 'JB Pearl Harbor-Hickam',    city: 'Honolulu',           state: 'HI', mhaZip: '96818', oconus: false, nonForeignOconus: true, branch: 'Joint' },
  { id: 'nas_whidbey',         name: 'NAS Whidbey Island',        city: 'Oak Harbor',         state: 'WA', mhaZip: '98278', oconus: false, branch: 'Navy' },
  { id: 'nsa_mid_south',       name: 'NSA Mid-South (Millington)',city: 'Millington',         state: 'TN', mhaZip: '38053', oconus: false, branch: 'Navy' },
  { id: 'nbvc',                name: 'Naval Base Ventura County', city: 'Point Mugu',         state: 'CA', mhaZip: '93042', oconus: false, branch: 'Navy' },
  { id: 'nas_lemoore',         name: 'NAS Lemoore',               city: 'Lemoore',            state: 'CA', mhaZip: '93246', oconus: false, branch: 'Navy' },
  { id: 'nas_north_island',    name: 'NAS North Island (NBSD)',   city: 'Coronado',           state: 'CA', mhaZip: '92118', oconus: false, branch: 'Navy' },
  { id: 'nas_patuxent',        name: 'NAS Patuxent River',        city: 'Patuxent River',     state: 'MD', mhaZip: '20670', oconus: false, branch: 'Navy' },
  { id: 'ns_newport',          name: 'Naval Station Newport',     city: 'Newport',            state: 'RI', mhaZip: '02841', oconus: false, branch: 'Navy' },
  { id: 'ns_great_lakes',      name: 'Naval Station Great Lakes', city: 'Great Lakes',        state: 'IL', mhaZip: '60088', oconus: false, branch: 'Navy' },
  { id: 'nas_fallon',          name: 'NAS Fallon',                city: 'Fallon',             state: 'NV', mhaZip: '89406', oconus: false, branch: 'Navy' },
  { id: 'nas_oceana',          name: 'NAS Oceana',                city: 'Virginia Beach',     state: 'VA', mhaZip: '23460', oconus: false, branch: 'Navy' },
  { id: 'nas_kingsville',      name: 'NAS Kingsville',            city: 'Kingsville',         state: 'TX', mhaZip: '78363', oconus: false, branch: 'Navy' },
  { id: 'nas_corpus_christi',  name: 'NAS Corpus Christi',        city: 'Corpus Christi',     state: 'TX', mhaZip: '78419', oconus: false, branch: 'Navy' },
  { id: 'subase_new_london',   name: 'Sub Base New London',       city: 'Groton',             state: 'CT', mhaZip: '06340', oconus: false, branch: 'Navy' },
  { id: 'subase_kings_bay',    name: 'Sub Base Kings Bay',        city: 'Kings Bay',          state: 'GA', mhaZip: '31547', oconus: false, branch: 'Navy' },
  { id: 'usna',                name: 'US Naval Academy',          city: 'Annapolis',          state: 'MD', mhaZip: '21402', oconus: false, branch: 'Navy' },
  { id: 'nas_joint_reserve',   name: 'JRB Fort Worth (NAS)',      city: 'Fort Worth',         state: 'TX', mhaZip: '76127', oconus: false, branch: 'Navy' },
  { id: 'nws_earle',           name: 'Naval Weapons Station Earle', city: 'Colts Neck',       state: 'NJ', mhaZip: '07722', oconus: false, branch: 'Navy' },
  { id: 'nws_charleston',      name: 'Naval Weapons Station Charleston', city: 'Goose Creek', state: 'SC', mhaZip: '29445', oconus: false, branch: 'Navy' },
  { id: 'nas_meridian',        name: 'NAS Meridian',              city: 'Meridian',           state: 'MS', mhaZip: '39301', oconus: false, branch: 'Navy' },

  // ── MARINES ──────────────────────────────────────────────────────────────────
  { id: 'camp_lejeune',        name: 'MCB Camp Lejeune',          city: 'Jacksonville',       state: 'NC', mhaZip: '28542', oconus: false, branch: 'Marines' },
  { id: 'camp_pendleton',      name: 'MCB Camp Pendleton',        city: 'Oceanside',          state: 'CA', mhaZip: '92058', oconus: false, branch: 'Marines' },
  { id: 'quantico',            name: 'MCB Quantico',              city: 'Triangle',           state: 'VA', mhaZip: '22134', oconus: false, branch: 'Marines' },
  { id: 'mcas_miramar',        name: 'MCAS Miramar',              city: 'San Diego',          state: 'CA', mhaZip: '92145', oconus: false, branch: 'Marines' },
  { id: 'mcas_beaufort',       name: 'MCAS Beaufort',             city: 'Beaufort',           state: 'SC', mhaZip: '29904', oconus: false, branch: 'Marines' },
  { id: 'mcas_cherry_point',   name: 'MCAS Cherry Point',         city: 'Havelock',           state: 'NC', mhaZip: '28533', oconus: false, branch: 'Marines' },
  { id: 'mcas_new_river',      name: 'MCAS New River',            city: 'Jacksonville',       state: 'NC', mhaZip: '28542', oconus: false, branch: 'Marines' },
  { id: 'mcas_yuma',           name: 'MCAS Yuma',                 city: 'Yuma',               state: 'AZ', mhaZip: '85365', oconus: false, branch: 'Marines' },
  { id: 'mcagcc_29palms',      name: 'MCAGCC Twentynine Palms',   city: 'Twentynine Palms',   state: 'CA', mhaZip: '92278', oconus: false, branch: 'Marines' },
  { id: 'mcb_hawaii',          name: 'MCB Hawaii (Kaneohe Bay)',   city: 'Kailua',             state: 'HI', mhaZip: '96744', oconus: false, nonForeignOconus: true, branch: 'Marines' },
  { id: 'mcsf_blount_island',  name: 'MCSF Blount Island',        city: 'Jacksonville',       state: 'FL', mhaZip: '32226', oconus: false, branch: 'Marines' },
  { id: 'mclb_albany',         name: 'MCLB Albany',               city: 'Albany',             state: 'GA', mhaZip: '31701', oconus: false, branch: 'Marines' },
  { id: 'mclb_barstow',        name: 'MCLB Barstow',              city: 'Barstow',            state: 'CA', mhaZip: '92311', oconus: false, branch: 'Marines' },
  { id: 'mcrd_parris_island',  name: 'MCRD Parris Island',        city: 'Parris Island',      state: 'SC', mhaZip: '29902', oconus: false, branch: 'Marines' },
  { id: 'mcrd_san_diego',      name: 'MCRD San Diego',            city: 'San Diego',          state: 'CA', mhaZip: '92140', oconus: false, branch: 'Marines' },
  { id: 'mcmwtc_bridgeport',   name: 'MCMWTC Bridgeport',         city: 'Bridgeport',         state: 'CA', mhaZip: '93517', oconus: false, branch: 'Marines' },
  { id: 'marine_barracks_dc',  name: 'Marine Barracks Washington (8th & I)', city: 'Washington', state: 'DC', mhaZip: '20319', oconus: false, branch: 'Marines' },

  // ── AIR FORCE ────────────────────────────────────────────────────────────────
  { id: 'jble',                name: 'JB Langley-Eustis',         city: 'Hampton',            state: 'VA', mhaZip: '23665', oconus: false, branch: 'Air Force' },
  { id: 'jba',                 name: 'Joint Base Andrews',        city: 'Camp Springs',       state: 'MD', mhaZip: '20762', oconus: false, branch: 'Joint' },
  { id: 'macdill',             name: 'MacDill AFB',               city: 'Tampa',              state: 'FL', mhaZip: '33621', oconus: false, branch: 'Air Force' },
  { id: 'eglin',               name: 'Eglin AFB',                 city: 'Fort Walton Beach',  state: 'FL', mhaZip: '32542', oconus: false, branch: 'Air Force' },
  { id: 'wpafb',               name: 'Wright-Patterson AFB',      city: 'Dayton',             state: 'OH', mhaZip: '45433', oconus: false, branch: 'Air Force' },
  { id: 'tinker',              name: 'Tinker AFB',                city: 'Oklahoma City',      state: 'OK', mhaZip: '73145', oconus: false, branch: 'Air Force' },
  { id: 'barksdale',           name: 'Barksdale AFB',             city: 'Shreveport',         state: 'LA', mhaZip: '71110', oconus: false, branch: 'Air Force' },
  { id: 'minot',               name: 'Minot AFB',                 city: 'Minot',              state: 'ND', mhaZip: '58705', oconus: false, branch: 'Air Force' },
  { id: 'offutt',              name: 'Offutt AFB',                city: 'Omaha',              state: 'NE', mhaZip: '68113', oconus: false, branch: 'Air Force' },
  { id: 'scott',               name: 'Scott AFB',                 city: "O'Fallon",           state: 'IL', mhaZip: '62225', oconus: false, branch: 'Air Force' },
  { id: 'peterson',            name: 'Peterson SFB / Schriever',  city: 'Colorado Springs',   state: 'CO', mhaZip: '80913', oconus: false, branch: 'Space Force' },
  { id: 'jbsa_lacklend',       name: 'JBSA-Lackland AFB',         city: 'San Antonio',        state: 'TX', mhaZip: '78236', oconus: false, branch: 'Air Force' },
  { id: 'dyess',               name: 'Dyess AFB',                 city: 'Abilene',            state: 'TX', mhaZip: '79607', oconus: false, branch: 'Air Force' },
  { id: 'goodfellow',          name: 'Goodfellow AFB',            city: 'San Angelo',         state: 'TX', mhaZip: '76908', oconus: false, branch: 'Air Force' },
  { id: 'sheppard',            name: 'Sheppard AFB',              city: 'Wichita Falls',      state: 'TX', mhaZip: '76311', oconus: false, branch: 'Air Force' },
  { id: 'laughlin',            name: 'Laughlin AFB',              city: 'Del Rio',            state: 'TX', mhaZip: '78843', oconus: false, branch: 'Air Force' },
  { id: 'keesler',             name: 'Keesler AFB',               city: 'Biloxi',             state: 'MS', mhaZip: '39534', oconus: false, branch: 'Air Force' },
  { id: 'columbus',            name: 'Columbus AFB',              city: 'Columbus',           state: 'MS', mhaZip: '39701', oconus: false, branch: 'Air Force' },
  { id: 'maxwell',             name: 'Maxwell AFB',               city: 'Montgomery',         state: 'AL', mhaZip: '36112', oconus: false, branch: 'Air Force' },
  { id: 'shaw',                name: 'Shaw AFB',                  city: 'Sumter',             state: 'SC', mhaZip: '29152', oconus: false, branch: 'Air Force' },
  { id: 'seymour_johnson',     name: 'Seymour Johnson AFB',       city: 'Goldsboro',          state: 'NC', mhaZip: '27531', oconus: false, branch: 'Air Force' },
  { id: 'pope',                name: 'Pope Army Airfield',        city: 'Fayetteville',       state: 'NC', mhaZip: '28308', oconus: false, branch: 'Air Force' },
  { id: 'dover',               name: 'Dover AFB',                 city: 'Dover',              state: 'DE', mhaZip: '19902', oconus: false, branch: 'Air Force' },
  { id: 'mcguire',             name: 'JB McGuire-Dix-Lakehurst',  city: 'Wrightstown',        state: 'NJ', mhaZip: '08641', oconus: false, branch: 'Joint' },
  { id: 'hanscom',             name: 'Hanscom AFB',               city: 'Bedford',            state: 'MA', mhaZip: '01731', oconus: false, branch: 'Air Force' },
  { id: 'pease',               name: 'Pease ANGB / Tradeport',    city: 'Portsmouth',         state: 'NH', mhaZip: '03803', oconus: false, branch: 'Air Force' },
  { id: 'travis',              name: 'Travis AFB',                city: 'Fairfield',          state: 'CA', mhaZip: '94535', oconus: false, branch: 'Air Force' },
  { id: 'edwards',             name: 'Edwards AFB',               city: 'Edwards',            state: 'CA', mhaZip: '93524', oconus: false, branch: 'Air Force' },
  { id: 'vandenberg',          name: 'Vandenberg SFB',            city: 'Lompoc',             state: 'CA', mhaZip: '93437', oconus: false, branch: 'Space Force' },
  { id: 'los_angeles',         name: 'Los Angeles AFB',           city: 'El Segundo',         state: 'CA', mhaZip: '90245', oconus: false, branch: 'Space Force' },
  { id: 'hill',                name: 'Hill AFB',                  city: 'Ogden',              state: 'UT', mhaZip: '84056', oconus: false, branch: 'Air Force' },
  { id: 'mountain_home',       name: 'Mountain Home AFB',         city: 'Mountain Home',      state: 'ID', mhaZip: '83648', oconus: false, branch: 'Air Force' },
  { id: 'fairchild',           name: 'Fairchild AFB',             city: 'Spokane',            state: 'WA', mhaZip: '99011', oconus: false, branch: 'Air Force' },
  { id: 'malmstrom',           name: 'Malmstrom AFB',             city: 'Great Falls',        state: 'MT', mhaZip: '59402', oconus: false, branch: 'Air Force' },
  { id: 'ellsworth',           name: 'Ellsworth AFB',             city: 'Box Elder',          state: 'SD', mhaZip: '57706', oconus: false, branch: 'Air Force' },
  { id: 'whiteman',            name: 'Whiteman AFB',              city: 'Knob Noster',        state: 'MO', mhaZip: '65336', oconus: false, branch: 'Air Force' },
  { id: 'kirtland',            name: 'Kirtland AFB',              city: 'Albuquerque',        state: 'NM', mhaZip: '87117', oconus: false, branch: 'Air Force' },
  { id: 'cannon',              name: 'Cannon AFB',                city: 'Clovis',             state: 'NM', mhaZip: '88103', oconus: false, branch: 'Air Force' },
  { id: 'holloman',            name: 'Holloman AFB',              city: 'Alamogordo',         state: 'NM', mhaZip: '88330', oconus: false, branch: 'Air Force' },
  { id: 'luke',                name: 'Luke AFB',                  city: 'Glendale',           state: 'AZ', mhaZip: '85309', oconus: false, branch: 'Air Force' },
  { id: 'davis_monthan',       name: 'Davis-Monthan AFB',         city: 'Tucson',             state: 'AZ', mhaZip: '85707', oconus: false, branch: 'Air Force' },
  { id: 'nellis',              name: 'Nellis AFB',                city: 'Las Vegas',          state: 'NV', mhaZip: '89191', oconus: false, branch: 'Air Force' },
  { id: 'creech',              name: 'Creech AFB',                city: 'Indian Springs',     state: 'NV', mhaZip: '89018', oconus: false, branch: 'Air Force' },
  { id: 'beale',               name: 'Beale AFB',                 city: 'Marysville',         state: 'CA', mhaZip: '95903', oconus: false, branch: 'Air Force' },
  { id: 'moody',               name: 'Moody AFB',                 city: 'Valdosta',           state: 'GA', mhaZip: '31699', oconus: false, branch: 'Air Force' },
  { id: 'robins',              name: 'Robins AFB',                city: 'Warner Robins',      state: 'GA', mhaZip: '31098', oconus: false, branch: 'Air Force' },
  { id: 'patrick',             name: 'Patrick SFB',               city: 'Satellite Beach',    state: 'FL', mhaZip: '32937', oconus: false, branch: 'Space Force' },
  { id: 'tyndall',             name: 'Tyndall AFB',               city: 'Panama City',        state: 'FL', mhaZip: '32403', oconus: false, branch: 'Air Force' },
  { id: 'hurlburt',            name: 'Hurlburt Field',            city: 'Mary Esther',        state: 'FL', mhaZip: '32544', oconus: false, branch: 'Air Force' },
  { id: 'ft_george_meade',     name: 'Fort Meade / NSA',          city: 'Odenton',            state: 'MD', mhaZip: '20755', oconus: false, branch: 'Joint' },
  { id: 'altus',               name: 'Altus AFB',                 city: 'Altus',              state: 'OK', mhaZip: '73523', oconus: false, branch: 'Air Force' },
  { id: 'vance',               name: 'Vance AFB',                 city: 'Enid',               state: 'OK', mhaZip: '73705', oconus: false, branch: 'Air Force' },
  { id: 'little_rock',         name: 'Little Rock AFB',           city: 'Jacksonville',       state: 'AR', mhaZip: '72099', oconus: false, branch: 'Air Force' },
  { id: 'jb_elmendorf',        name: 'JBER Elmendorf',            city: 'Anchorage',          state: 'AK', mhaZip: '99506', oconus: false, nonForeignOconus: true, branch: 'Joint' },
  { id: 'eielson',             name: 'Eielson AFB',               city: 'North Pole',         state: 'AK', mhaZip: '99702', oconus: false, nonForeignOconus: true, branch: 'Air Force' },
  { id: 'jb_charleston',       name: 'Joint Base Charleston',     city: 'North Charleston',   state: 'SC', mhaZip: '29404', oconus: false, branch: 'Air Force' },
  { id: 'jb_pearl_hickam',     name: 'JB Pearl Harbor-Hickam',    city: 'Honolulu',           state: 'HI', mhaZip: '96818', oconus: false, nonForeignOconus: true, branch: 'Joint' },
  { id: 'mcconnell',           name: 'McConnell AFB',             city: 'Wichita',            state: 'KS', mhaZip: '67210', oconus: false, branch: 'Air Force' },
  { id: 'grand_forks',         name: 'Grand Forks AFB',           city: 'Grand Forks',        state: 'ND', mhaZip: '58201', oconus: false, branch: 'Air Force' },
  { id: 'fe_warren',           name: 'F.E. Warren AFB',           city: 'Cheyenne',           state: 'WY', mhaZip: '82001', oconus: false, branch: 'Space Force' },
  { id: 'buckley_sfb',         name: 'Buckley SFB',               city: 'Aurora',             state: 'CO', mhaZip: '80202', oconus: false, branch: 'Space Force' },
  { id: 'cape_canaveral_sfs',  name: 'Cape Canaveral SFS',        city: 'Cape Canaveral',     state: 'FL', mhaZip: '32925', oconus: false, branch: 'Space Force' },

  // ── COAST GUARD ──────────────────────────────────────────────────────────────
  { id: 'cg_island',           name: 'USCG Training Center Cape May', city: 'Cape May',       state: 'NJ', mhaZip: '08204', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_alameda',          name: 'USCG Sector San Francisco',  city: 'Alameda',           state: 'CA', mhaZip: '94501', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_portsmouth',       name: 'USCG Sector Hampton Roads',  city: 'Portsmouth',        state: 'VA', mhaZip: '23703', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_clearwater',       name: 'USCG Air Station Clearwater', city: 'Clearwater',       state: 'FL', mhaZip: '33762', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_elizabeth_city',   name: 'USCG Aviation Technical Training', city: 'Elizabeth City', state: 'NC', mhaZip: '27909', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_petaluma',         name: 'USCG Training Center Petaluma', city: 'Petaluma',        state: 'CA', mhaZip: '94952', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_new_london',       name: 'USCG Academy',               city: 'New London',        state: 'CT', mhaZip: '06320', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_kodiak',           name: 'USCG Base Kodiak',           city: 'Kodiak',            state: 'AK', mhaZip: '99615', oconus: false, nonForeignOconus: true, branch: 'Coast Guard' },
  { id: 'cg_miami',            name: 'USCG Sector Miami',              city: 'Miami',          state: 'FL', mhaZip: '33132', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_honolulu',         name: 'USCG Base Honolulu',             city: 'Honolulu',       state: 'HI', mhaZip: '96813', oconus: false, nonForeignOconus: true, branch: 'Coast Guard' },
  { id: 'cg_barbers_point',    name: 'USCG Air Station Barbers Point', city: 'Kapolei',        state: 'HI', mhaZip: '96818', oconus: false, nonForeignOconus: true, branch: 'Coast Guard' },
  // ── COAST GUARD — Northeast ───────────────────────────────────────────────────
  { id: 'cg_boston',           name: 'USCG Sector New England',        city: 'Boston',         state: 'MA', mhaZip: '02110', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_airsta_capecod',   name: 'USCG Air Station Cape Cod',      city: 'Bourne',         state: 'MA', mhaZip: '02563', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_portsmouth_nh',    name: 'USCG Sector Northern New England', city: 'Portsmouth',   state: 'NH', mhaZip: '03801', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_new_haven',        name: 'USCG Sector Long Island Sound',  city: 'New Haven',      state: 'CT', mhaZip: '06512', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_new_york',         name: 'USCG Sector New York',           city: 'Staten Island',  state: 'NY', mhaZip: '10305', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_philadelphia',     name: 'USCG Sector Delaware Bay',       city: 'Philadelphia',   state: 'PA', mhaZip: '19112', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_baltimore',        name: 'USCG ISC Baltimore',             city: 'Baltimore',      state: 'MD', mhaZip: '21230', oconus: false, branch: 'Coast Guard' },
  // ── COAST GUARD — Southeast ───────────────────────────────────────────────────
  { id: 'cg_charleston',       name: 'USCG Sector Charleston',         city: 'Charleston',     state: 'SC', mhaZip: '29405', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_savannah',         name: 'USCG Air Station Savannah',      city: 'Savannah',       state: 'GA', mhaZip: '31408', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_jacksonville',     name: 'USCG Sector Jacksonville',       city: 'Jacksonville',   state: 'FL', mhaZip: '32210', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_mobile',           name: 'USCG Sector Mobile',             city: 'Mobile',         state: 'AL', mhaZip: '36615', oconus: false, branch: 'Coast Guard' },
  // ── COAST GUARD — South / Gulf ────────────────────────────────────────────────
  { id: 'cg_memphis',          name: 'USCG Sector Memphis',            city: 'Memphis',        state: 'TN', mhaZip: '38103', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_new_orleans',      name: 'USCG Sector New Orleans',        city: 'New Orleans',    state: 'LA', mhaZip: '70129', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_galveston',        name: 'USCG Sector Houston-Galveston',  city: 'Galveston',      state: 'TX', mhaZip: '77553', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_corpus_christi',   name: 'USCG Air Station Corpus Christi', city: 'Corpus Christi', state: 'TX', mhaZip: '78419', oconus: false, branch: 'Coast Guard' },
  // ── COAST GUARD — Great Lakes ────────────────────────────────────────────────
  { id: 'cg_cleveland',        name: 'USCG Sector Lake Erie',          city: 'Cleveland',      state: 'OH', mhaZip: '44114', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_detroit',          name: 'USCG Sector Detroit',            city: 'Detroit',        state: 'MI', mhaZip: '48226', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_chicago',          name: 'USCG Sector Lake Michigan',      city: 'Chicago',        state: 'IL', mhaZip: '60605', oconus: false, branch: 'Coast Guard' },
  // ── COAST GUARD — California / Southwest ─────────────────────────────────────
  { id: 'cg_san_pedro',        name: 'USCG Sector Los Angeles-Long Beach', city: 'San Pedro',  state: 'CA', mhaZip: '90731', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_san_diego',        name: 'USCG Sector San Diego',          city: 'San Diego',      state: 'CA', mhaZip: '92135', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_sacramento',       name: 'USCG Air Station Sacramento',    city: 'Sacramento',     state: 'CA', mhaZip: '95655', oconus: false, branch: 'Coast Guard' },
  // ── COAST GUARD — Pacific Northwest ──────────────────────────────────────────
  { id: 'cg_portland',         name: 'USCG Sector Columbia River',     city: 'Portland',       state: 'OR', mhaZip: '97217', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_seattle',          name: 'USCG Sector Puget Sound',        city: 'Seattle',        state: 'WA', mhaZip: '98134', oconus: false, branch: 'Coast Guard' },
  { id: 'cg_port_angeles',     name: 'USCG Air Station Port Angeles',  city: 'Port Angeles',   state: 'WA', mhaZip: '98363', oconus: false, branch: 'Coast Guard' },
  // ── COAST GUARD — Alaska ──────────────────────────────────────────────────────
  { id: 'cg_anchorage',        name: 'USCG Sector Anchorage',          city: 'Anchorage',      state: 'AK', mhaZip: '99501', oconus: false, nonForeignOconus: true, branch: 'Coast Guard' },
  { id: 'cg_juneau',           name: 'USCG Sector Juneau',             city: 'Juneau',         state: 'AK', mhaZip: '99801', oconus: false, nonForeignOconus: true, branch: 'Coast Guard' },
  { id: 'cg_sitka',            name: 'USCG Air Station Sitka',         city: 'Sitka',          state: 'AK', mhaZip: '99835', oconus: false, nonForeignOconus: true, branch: 'Coast Guard' },

  // ── RESERVE & RECRUITING COMMAND HEADQUARTERS ───────────────────────────────
  // These share their MHA/BAH rate with the covered installation they're
  // co-located at (same city/MHA) — listed separately so members whose duty
  // station IS the recruiting or reserve command itself (not a line unit) can
  // find themselves by name.
  { id: 'usarec_knox',        name: 'US Army Recruiting Command (Fort Knox)',        city: 'Radcliff',          state: 'KY', mhaZip: '40121', oconus: false, branch: 'Army' },
  { id: 'navy_recruit_cmd',   name: 'Navy Recruiting Command (NSA Mid-South)',       city: 'Millington',        state: 'TN', mhaZip: '38053', oconus: false, branch: 'Navy' },
  { id: 'mcrc_quantico',      name: 'Marine Corps Recruiting Command (Quantico)',    city: 'Triangle',          state: 'VA', mhaZip: '22134', oconus: false, branch: 'Marines' },
  { id: 'afrs_jbsa',          name: 'Air Force Recruiting Service (JBSA-Randolph)',  city: 'San Antonio',       state: 'TX', mhaZip: '78234', oconus: false, branch: 'Air Force' },
  { id: 'ssr_peterson',       name: 'Space Force Recruiting Service (Peterson SFB)', city: 'Colorado Springs',  state: 'CO', mhaZip: '80913', oconus: false, branch: 'Space Force' },
  { id: 'cg_recruit_cmd',     name: 'Coast Guard Recruiting Command (Arlington)',    city: 'Arlington',         state: 'VA', mhaZip: '22211', oconus: false, branch: 'Coast Guard' },
  { id: 'usarc_liberty',      name: 'US Army Reserve Command (Fort Liberty)',        city: 'Fayetteville',      state: 'NC', mhaZip: '28301', oconus: false, branch: 'Army' },
  { id: 'marforres_no',       name: 'Marine Forces Reserve (New Orleans)',           city: 'New Orleans',       state: 'LA', mhaZip: '70129', oconus: false, branch: 'Marines' },
  { id: 'afrc_robins',        name: 'Air Force Reserve Command (Robins AFB)',        city: 'Warner Robins',     state: 'GA', mhaZip: '31098', oconus: false, branch: 'Air Force' },
  { id: 'navres_norfolk',     name: 'Navy Reserve Forces Command (Norfolk)',         city: 'Norfolk',           state: 'VA', mhaZip: '23511', oconus: false, branch: 'Navy' },
  { id: 'cg_reserve_mcnair',  name: 'Coast Guard Reserve (Washington, DC)',          city: 'Washington',        state: 'DC', mhaZip: '20319', oconus: false, branch: 'Coast Guard' },
  { id: 'ang_readiness_andrews', name: 'Air National Guard Readiness Center (Andrews)', city: 'Camp Springs',  state: 'MD', mhaZip: '20762', oconus: false, branch: 'Air Force' },
  { id: 'arng_belvoir',       name: 'Army National Guard Readiness Center (Fort Belvoir)', city: 'Fort Belvoir', state: 'VA', mhaZip: '22060', oconus: false, branch: 'Army' },

  // ── OCONUS — KOREA ───────────────────────────────────────────────────────────
  { id: 'camp_humphreys',      name: 'Camp Humphreys (USAG Humphreys)', city: 'Pyeongtaek',   state: 'South Korea', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'osan',                name: 'Osan AB',                    city: 'Pyeongtaek',         state: 'South Korea', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'kunsan',              name: 'Kunsan AB',                  city: 'Kunsan',             state: 'South Korea', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'camp_walker',         name: 'Camp Walker (USAG Daegu)',   city: 'Daegu',              state: 'South Korea', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'camp_red_cloud',      name: 'Camp Red Cloud',             city: 'Uijeongbu',          state: 'South Korea', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'camp_casey',          name: 'Camp Casey (USAG Area I)',   city: 'Dongducheon',        state: 'South Korea', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'camp_carroll',        name: 'Camp Carroll',               city: 'Waegwan',            state: 'South Korea', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'camp_henry',          name: 'Camp Henry (USAG Daegu)',    city: 'Daegu',              state: 'South Korea', mhaZip: '', oconus: true, branch: 'Army' },

  // ── OCONUS — JAPAN ───────────────────────────────────────────────────────────
  { id: 'kadena',              name: 'Kadena AB',                  city: 'Okinawa',            state: 'Japan', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'yokosuka',            name: 'Naval Base Yokosuka',        city: 'Yokosuka',           state: 'Japan', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'yokota',              name: 'Yokota AB',                  city: 'Fussa',              state: 'Japan', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'mcb_butler',          name: 'Camp Butler (MCB Okinawa)',  city: 'Ginowan',            state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'mcas_futenma',        name: 'MCAS Futenma (Okinawa)',     city: 'Ginowan',            state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'camp_foster',         name: 'Camp Foster (Okinawa)',      city: 'Okinawa',            state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'camp_courtney',       name: 'Camp Courtney (Okinawa)',    city: 'Uruma',              state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'camp_kinser',         name: 'Camp Kinser (Okinawa)',      city: 'Urasoe',             state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'misawa',              name: 'Misawa AB',                  city: 'Misawa',             state: 'Japan', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'atsugi',              name: 'Naval Air Facility Atsugi',  city: 'Yamato',             state: 'Japan', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'sasebo',              name: 'Naval Base Sasebo',          city: 'Sasebo',             state: 'Japan', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'camp_zama',           name: 'Camp Zama (USAG Japan)',     city: 'Zama',               state: 'Japan', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'mcas_iwakuni',        name: 'MCAS Iwakuni',               city: 'Iwakuni',            state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'torii_station',       name: 'Torii Station',              city: 'Yomitan',            state: 'Japan', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'camp_schwab',         name: 'Camp Schwab (Okinawa)',      city: 'Nago',               state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'camp_hansen',         name: 'Camp Hansen (Okinawa)',      city: 'Kin',                state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'camp_mctureous',      name: 'Camp McTureous (Okinawa)',   city: 'Uruma',              state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'camp_gonsalves',      name: 'Camp Gonsalves (JWTC, Okinawa)', city: 'Kunigami',        state: 'Japan', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'white_beach',         name: 'White Beach Naval Facility', city: 'Uruma',              state: 'Japan', mhaZip: '', oconus: true, branch: 'Navy' },

  // ── OCONUS — GERMANY / EUROPE ─────────────────────────────────────────────────
  { id: 'ramstein',            name: 'Ramstein AB',                city: 'Ramstein-Miesenbach', state: 'Germany', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'spangdahlem',         name: 'Spangdahlem AB',             city: 'Spangdahlem',        state: 'Germany', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'grafenwoehr',         name: 'Grafenwöhr / Rose Barracks', city: 'Grafenwöhr',         state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'baumholder',          name: 'Baumholder Military Community', city: 'Baumholder',      state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'kleber',              name: 'Kleber Kaserne (USAG Rheinland-Pfalz)', city: 'Kaiserslautern', state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'wiesbaden',           name: 'USAG Wiesbaden',             city: 'Wiesbaden',          state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'ansbach',             name: 'USAG Ansbach',               city: 'Ansbach',            state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'vilseck',             name: 'Vilseck (USAG Bavaria)',     city: 'Vilseck',            state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'stuttgart',           name: 'USAG Stuttgart',             city: 'Stuttgart',          state: 'Germany', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'aviano',              name: 'Aviano AB',                  city: 'Aviano',             state: 'Italy', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'vicenza',             name: 'USAG Italy (Vicenza)',       city: 'Vicenza',            state: 'Italy', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'sigonella',           name: 'NAS Sigonella',              city: 'Catania',            state: 'Italy', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'naples',              name: 'NSA Naples',                 city: 'Naples',             state: 'Italy', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'incirlik',            name: 'Incirlik AB',                city: 'Adana',              state: 'Turkey', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'lajes',               name: 'Lajes Field',                city: 'Terceira',           state: 'Azores (Portugal)', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'rota',                name: 'Naval Station Rota',         city: 'Rota',               state: 'Spain', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'mildenhall',          name: 'RAF Mildenhall',             city: 'Suffolk',            state: 'United Kingdom', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'lakenheath',          name: 'RAF Lakenheath',             city: 'Suffolk',            state: 'United Kingdom', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'alconbury',           name: 'RAF Alconbury',              city: 'Huntingdon',         state: 'United Kingdom', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'mons',                name: 'SHAPE / USAG Benelux',       city: 'Mons',               state: 'Belgium', mhaZip: '', oconus: true, branch: 'Joint' },
  { id: 'camp_darby',          name: 'Camp Darby',                 city: 'Livorno',            state: 'Italy', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'patch_barracks',      name: 'Patch Barracks (EUCOM)',     city: 'Stuttgart',          state: 'Germany', mhaZip: '', oconus: true, branch: 'Joint' },
  { id: 'souda_bay',           name: 'NSA Souda Bay',              city: 'Crete',              state: 'Greece', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'raf_croughton',       name: 'RAF Croughton',              city: 'Northamptonshire',   state: 'United Kingdom', mhaZip: '', oconus: true, branch: 'Joint' },
  { id: 'moron',               name: 'Morón AB',                   city: 'Morón de la Frontera', state: 'Spain', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'chievres',            name: 'Chièvres Air Base (USAG Belgium)', city: 'Chièvres',    state: 'Belgium', mhaZip: '', oconus: true, branch: 'Army' },

  // ── OCONUS — MIDDLE EAST / AFRICA ────────────────────────────────────────────
  { id: 'bahrain',             name: 'NSA Bahrain (C5F)',          city: 'Manama',             state: 'Bahrain', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'camp_arifjan',        name: 'Camp Arifjan',               city: 'Ahmadi',             state: 'Kuwait', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'al_udeid',            name: 'Al Udeid AB (CENTCOM/AFCENT)', city: 'Doha',             state: 'Qatar', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'ali_al_salem',        name: 'Ali Al Salem AB',            city: 'Ali Al Salem',       state: 'Kuwait', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'jbab_diego_garcia',   name: 'Diego Garcia (BIOT)',        city: 'Diego Garcia',       state: 'British Indian Ocean Territory', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'camp_lemonnier',      name: 'Camp Lemonnier',             city: 'Djibouti City',      state: 'Djibouti', mhaZip: '', oconus: true, branch: 'Joint' },
  { id: 'al_dhafra',           name: 'Al Dhafra AB',               city: 'Abu Dhabi',          state: 'United Arab Emirates', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'prince_sultan',       name: 'Prince Sultan AB',           city: 'Al Kharj',           state: 'Saudi Arabia', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'camp_buehring',       name: 'Camp Buehring',              city: 'Udairi',             state: 'Kuwait', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'muwaffaq_salti',      name: 'Muwaffaq Salti AB',          city: 'Azraq',              state: 'Jordan', mhaZip: '', oconus: true, branch: 'Air Force' },

  // ── OCONUS — PACIFIC ─────────────────────────────────────────────────────────
  { id: 'guam_navy',           name: 'Naval Base Guam',            city: 'Apra Harbor',        state: 'Guam', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'andersen',            name: 'Andersen AFB',               city: 'Yigo',               state: 'Guam', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'camp_blaz',           name: 'Marine Corps Base Camp Blaz', city: 'Dededo',            state: 'Guam', mhaZip: '', oconus: true, branch: 'Marines' },
  { id: 'kwajalein',           name: 'Kwajalein Atoll (USAKA)',    city: 'Kwajalein',          state: 'Marshall Islands', mhaZip: '', oconus: true, branch: 'Army' },
  { id: 'thule',               name: 'Pituffik Space Base (Thule)', city: 'Pituffik',          state: 'Greenland', mhaZip: '', oconus: true, branch: 'Space Force' },
  { id: 'camp_smith',          name: 'Camp H.M. Smith (INDOPACOM)', city: 'Halawa',            state: 'HI', mhaZip: '96818', oconus: false, nonForeignOconus: true, branch: 'Joint' },

  // ── OCONUS — AMERICAS ────────────────────────────────────────────────────────
  { id: 'gtmo',                name: 'Naval Station Guantanamo Bay', city: 'Guantanamo Bay',   state: 'Cuba', mhaZip: '', oconus: true, branch: 'Navy' },
  { id: 'soto_cano',           name: 'Soto Cano AB (JTF-Bravo)',   city: 'Comayagua',          state: 'Honduras', mhaZip: '', oconus: true, branch: 'Air Force' },
  { id: 'fort_buchanan',       name: 'Fort Buchanan',               city: 'Guaynabo',          state: 'Puerto Rico', mhaZip: '', oconus: true, branch: 'Army' },
];

export function searchInstallations(query: string): Installation[] {
  if (!query.trim()) return INSTALLATIONS;
  const q = query.toLowerCase();
  return INSTALLATIONS.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.city.toLowerCase().includes(q) ||
      i.state.toLowerCase().includes(q) ||
      i.branch.toLowerCase().includes(q),
  );
}

/** Returns all CONUS installations that have BAH data (for duty station pickers). */
export function getConusInstallations(): Installation[] {
  return INSTALLATIONS.filter(i => !i.oconus && i.mhaZip);
}

/** Returns all OCONUS installations (for OHA reference). */
export function getOconusInstallations(): Installation[] {
  return INSTALLATIONS.filter(i => i.oconus);
}

/** Finds the first installation matching a given MHA zip code. */
export function getInstallationByZip(zip: string | undefined | null): Installation | null {
  if (!zip) return null;
  return INSTALLATIONS.find(i => i.mhaZip === zip) ?? null;
}

/** Finds an installation by its stable id (needed for OCONUS stations, which have no mhaZip). */
export function getInstallationById(id: string | undefined | null): Installation | null {
  if (!id) return null;
  return INSTALLATIONS.find(i => i.id === id) ?? null;
}

// ── ZIP fallback ─────────────────────────────────────────────────────────────
// BAH rates only exist for the installations listed above. A member stationed
// somewhere not on that list (a recruiting sub-station, a reserve center, an
// IMA billet in a random city) still needs *a* usable number, so we point them
// at the nearest covered installation's rate by state and say so plainly —
// this is a labeled approximation, never a fabricated rate for their exact ZIP.

// States/territories with no covered installation of their own — mapped to
// the nearest state that does have one.
const NEIGHBOR_STATE: Record<string, string> = {
  IA: 'NE', // Omaha (Offutt AFB) sits on the Iowa border
  IN: 'OH', // Wright-Patterson AFB (Dayton) is just across the Indiana border
  ME: 'NH', // Portsmouth (Pease) is the nearest covered New England MHA
  MN: 'IL', // Naval Station Great Lakes is the nearest covered Upper-Midwest MHA
  VT: 'NH', // Portsmouth (Pease) is the nearest covered New England MHA
  WI: 'IL', // Naval Station Great Lakes is directly across the state line
  WV: 'VA', // Fort Belvoir/DC area is the nearest covered MHA for most of WV
  WY: 'CO', // Colorado Springs is the nearest covered Mountain-West MHA
};

/** Returns a real covered installation to use as a same-state (or nearest-neighbor) BAH stand-in. */
export function getStateFallbackAnchor(state: string, seen: Set<string> = new Set()): Installation | null {
  if (seen.has(state)) return null; // guard against a cyclical NEIGHBOR_STATE entry
  seen.add(state);
  const inState = INSTALLATIONS.find((i) => !i.oconus && !!i.mhaZip && i.state === state);
  if (inState) return inState;
  const neighbor = NEIGHBOR_STATE[state];
  return neighbor ? getStateFallbackAnchor(neighbor, seen) : null;
}

/**
 * Resolves an arbitrary CONUS ZIP code (recruiting sub-station, reserve
 * center, random-city assignment) to an approximate BAH stand-in. The
 * returned installation is real and its rate is real — it just isn't
 * necessarily the member's literal duty city, which is why the name is
 * annotated so that's visible everywhere it's displayed downstream.
 */
export function getApproxInstallationForZip(zip: string): Installation | null {
  const state = zipToState(zip);
  if (!state) return null;
  const anchor = getStateFallbackAnchor(state);
  if (!anchor) return null;
  return {
    ...anchor,
    id: `zip_${zip}`,
    name: `Near ZIP ${zip} (≈ ${anchor.city}, ${anchor.state} rates)`,
  };
}
