/**
 * School data keyed by installation ID (from installations.ts).
 *
 * DoDEA (Dept of Defense Education Activity) operates ~160 schools at military
 * installations worldwide. CONUS installations generally feed into local public
 * school districts funded by Impact Aid (20 USC §7701). OCONUS installations
 * use DoDEA schools exclusively.
 *
 * Sources:
 *  - DoDEA school finder: dodea.edu/schools
 *  - Military Interstate Children's Compact: mic3.net
 *  - School Liaison Program: dodea.edu/Partnership/schoolliaison
 */

export interface DoDEASchool {
  name: string;
  grades: string;   // e.g. "K–5", "6–8", "9–12", "K–12"
  type: 'Elementary' | 'Middle' | 'High' | 'K-12';
}

export interface InstallationSchoolInfo {
  installationId: string;
  hasDoDEA: boolean;
  dodea: DoDEASchool[];
  localDistrict?: string;       // CONUS: name of the local public school district
  districtUrl?: string;
  sloNotes?: string;            // SLO / school liaison notes
  notes?: string;
}

// Installations with no DoDEA but strong local districts
const LOCAL: Omit<InstallationSchoolInfo, 'hasDoDEA' | 'dodea'> & { hasDoDEA?: false } = {
  installationId: '',
  localDistrict: '',
};

export const SCHOOL_DATA: InstallationSchoolInfo[] = [
  // ── ARMY — CONUS ───────────────────────────────────────────────────────────
  {
    installationId: 'fort_liberty',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Cumberland County Schools (NC)',
    districtUrl: 'www.ccs.k12.nc.us',
    sloNotes: 'SLO office located on post. Cumberland County operates 10+ schools near the installation including district-run "military-friendly" schools.',
  },
  {
    installationId: 'fort_campbell',
    hasDoDEA: true,
    dodea: [
      { name: 'Barsanti Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Wassom Middle School',        grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Clarksville-Montgomery County School System (TN) / Fort Campbell Independent School District (KY)',
    notes: 'DoDEA operates on-post Elementary and Middle School. High school students attend Clarksville-area schools (e.g., Northeast HS, Rossview HS in TN, or Christian County HS in KY).',
  },
  {
    installationId: 'fort_cavazos',
    hasDoDEA: true,
    dodea: [
      { name: 'Montague Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Clear Creek Elementary',     grades: 'K–5', type: 'Elementary' },
      { name: 'Patterson Middle School',    grades: '6–8', type: 'Middle' },
      { name: 'Fort Cavazos High School',   grades: '9–12', type: 'High' },
    ],
    localDistrict: 'Killeen ISD / Copperas Cove ISD (TX)',
    notes: 'DoDEA operates full K–12 pipeline on post.',
  },
  {
    installationId: 'fort_bliss',
    hasDoDEA: true,
    dodea: [
      { name: 'MacArthur Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Magoffin Middle School',       grades: '6–8', type: 'Middle' },
      { name: 'Andress High School',          grades: '9–12', type: 'High' },
    ],
    localDistrict: 'Ysleta ISD / El Paso ISD (TX)',
  },
  {
    installationId: 'fort_drum',
    hasDoDEA: true,
    dodea: [
      { name: 'Bowe Elementary School',    grades: 'K–5', type: 'Elementary' },
      { name: 'LaMoure Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Wheeler Middle School',     grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Carthage Central School District / Indian River Central School District (NY)',
    notes: 'DoDEA operates two on-post elementary schools and a middle school. High school students attend Carthage Central HS or Indian River Central HS off-post. Fort Drum is relatively isolated — SLO is highly recommended.',
  },
  {
    installationId: 'fort_moore',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Muscogee County School District (GA)',
    districtUrl: 'www.muscogee.k12.ga.us',
    sloNotes: 'Muscogee County has a strong military family support program. SLO office at Fort Moore coordinates enrollment.',
  },
  {
    installationId: 'fort_stewart',
    hasDoDEA: true,
    dodea: [
      { name: 'Diamond Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Sims Middle School',         grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Liberty County School System (GA)',
    notes: 'DoDEA operates elementary and middle schools on post. High school students attend Liberty County HS or Frank Long Middle in the Liberty County district.',
  },
  {
    installationId: 'fort_knox',
    hasDoDEA: true,
    dodea: [
      { name: 'Van Voorhis Elementary',  grades: 'K–5', type: 'Elementary' },
      { name: 'Kingsolver Elementary',   grades: 'K–5', type: 'Elementary' },
      { name: 'Fort Knox Middle School', grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Hardin County Schools (KY)',
    notes: 'DoDEA operates two on-post elementary schools and one middle school. High school students attend North Hardin HS or Elizabethtown HS in the Hardin County district.',
  },
  {
    installationId: 'fort_sill',
    hasDoDEA: true,
    dodea: [
      { name: 'MacArthur Elementary',  grades: 'K–5', type: 'Elementary' },
      { name: 'Upton Middle School',   grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Lawton Public Schools (OK)',
    notes: 'DoDEA operates elementary and middle school on post. High school students attend Lawton Public Schools — MacArthur HS and Eisenhower HS are closest.',
  },
  {
    installationId: 'fort_novosel',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Dale County Schools / Enterprise City Schools (AL)',
  },
  {
    installationId: 'fort_irwin',
    hasDoDEA: true,
    dodea: [
      { name: 'Silver Valley Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Silver Valley Middle',     grades: '6–8', type: 'Middle' },
      { name: 'Silver Valley High',       grades: '9–12', type: 'High' },
    ],
    notes: 'NTC is highly isolated (Mojave Desert). DoDEA runs K–12 on post.',
  },
  {
    installationId: 'schofield',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Hawaii Department of Education — Central District (HI)',
    districtUrl: 'www.hawaiipublicschools.org',
    sloNotes: 'Hawaii has a single statewide school district. Wahiawa ES, Leilehua HS, and Wheeler MS are near post.',
  },
  {
    installationId: 'fort_wainwright',
    hasDoDEA: true,
    dodea: [
      { name: 'Wainwright Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Wainwright Middle School',     grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Fairbanks North Star Borough School District (AK)',
    notes: 'DoDEA operates on-post elementary and middle school. High school students attend Lathrop HS or West Valley HS in the Fairbanks North Star Borough district.',
  },
  {
    installationId: 'fort_leonard_wood',
    hasDoDEA: true,
    dodea: [
      { name: 'Pershing Park Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Freedom Middle School',    grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Waynesville R-VI School District (MO)',
  },
  {
    installationId: 'fort_carson',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Fountain-Fort Carson School District 8 / Harrison D-2 (CO)',
    districtUrl: 'www.ffc8.org',
    sloNotes: 'Fountain-Fort Carson D8 is a recognized military-friendly district with strong transition support.',
  },
  {
    installationId: 'jblm',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Clover Park School District / North Thurston Public Schools (WA)',
    districtUrl: 'www.cloverpark.k12.wa.us',
  },

  // ── NAVY — CONUS ──────────────────────────────────────────────────────────
  {
    installationId: 'ns_norfolk',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Norfolk City Public Schools / Virginia Beach City Public Schools (VA)',
    districtUrl: 'www.npsk12.com',
    sloNotes: 'Multiple districts serve the Hampton Roads area. Check with the Installation SLO for nearest school by BAH zip.',
  },
  {
    installationId: 'nas_pensacola',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Escambia County School District (FL)',
    districtUrl: 'www.escambiaschools.org',
  },
  {
    installationId: 'nas_jacksonville',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Duval County Public Schools (FL)',
    districtUrl: 'www.dcps.duvalschools.org',
  },
  {
    installationId: 'nas_san_diego',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'San Diego Unified School District (CA)',
    districtUrl: 'www.sandi.net',
  },
  {
    installationId: 'jbphh',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Hawaii Department of Education — Honolulu District (HI)',
    districtUrl: 'www.hawaiipublicschools.org',
  },
  {
    installationId: 'subase_new_london',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Groton Public Schools (CT)',
    districtUrl: 'www.groton.k12.ct.us',
  },
  {
    installationId: 'guam_navy',
    hasDoDEA: true,
    dodea: [
      { name: 'Andersen Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Guam Middle School (DoDEA)', grades: '6–8',  type: 'Middle' },
      { name: 'John F. Kennedy HS (DoDEA)', grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific serves both naval base and Andersen AFB families in Guam.',
  },

  // ── MARINES — CONUS ────────────────────────────────────────────────────────
  {
    installationId: 'camp_lejeune',
    hasDoDEA: true,
    dodea: [
      { name: 'Camp Knox Elementary',   grades: 'K–5', type: 'Elementary' },
      { name: 'Tarawa Terrace Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Lejeune High School',    grades: '9–12', type: 'High' },
    ],
    localDistrict: 'Onslow County Schools (NC)',
    districtUrl: 'www.onslow.k12.nc.us',
  },
  {
    installationId: 'camp_pendleton',
    hasDoDEA: true,
    dodea: [
      { name: 'De Luz Elementary School',  grades: 'K–5', type: 'Elementary' },
      { name: 'Santa Margarita Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Cesar Chavez Elementary',   grades: 'K–5', type: 'Elementary' },
      { name: 'Camp Pendleton Middle',     grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Fallbrook Union Elementary / Oceanside USD (CA)',
  },
  {
    installationId: 'quantico',
    hasDoDEA: true,
    dodea: [
      { name: 'Jefferson Davis Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Quantico Middle/High School', grades: '6–12', type: 'High' },
    ],
    localDistrict: 'Prince William County Public Schools (VA)',
  },
  {
    installationId: 'mcas_beaufort',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Beaufort County School District (SC)',
    districtUrl: 'www.beaufort.k12.sc.us',
  },
  {
    installationId: 'mcas_cherry_point',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Craven County Schools (NC)',
  },
  {
    installationId: 'mcb_hawaii',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Hawaii Department of Education — Windward District (HI)',
    districtUrl: 'www.hawaiipublicschools.org',
    notes: 'Kailua ES, King Intermediate, and Kailua HS are the primary neighborhood schools.',
  },

  // ── AIR FORCE — CONUS ─────────────────────────────────────────────────────
  {
    installationId: 'jble',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Hampton City Schools / Poquoson City Public Schools (VA)',
    districtUrl: 'www.hampton.k12.va.us',
  },
  {
    installationId: 'jba',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Prince George\'s County Public Schools (MD)',
    districtUrl: 'www.pgcps.org',
  },
  {
    installationId: 'macdill',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Hillsborough County Public Schools (FL)',
    districtUrl: 'www.sdhc.k12.fl.us',
  },
  {
    installationId: 'eglin',
    hasDoDEA: true,
    dodea: [
      { name: 'Annette P. Edwins Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Pryor Middle School',           grades: '6–8', type: 'Middle' },
    ],
    localDistrict: 'Okaloosa County School District (FL)',
  },
  {
    installationId: 'travis',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Travis Unified School District (CA)',
    districtUrl: 'www.travisusd.org',
    notes: 'Travis USD is specifically formed to serve Travis AFB families — very military-aware.',
  },
  {
    installationId: 'nellis',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Clark County School District (NV)',
    districtUrl: 'www.ccsd.net',
  },
  {
    installationId: 'hill',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Davis School District / Ogden City School District (UT)',
  },
  {
    installationId: 'minot',
    hasDoDEA: true,
    dodea: [
      { name: 'Jim Hill Elementary', grades: 'K–5', type: 'Elementary' },
    ],
    localDistrict: 'Minot Public Schools (ND)',
    notes: 'Minot AFB is relatively isolated. Most families use Minot Public Schools.',
  },
  {
    installationId: 'keesler',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Biloxi Public Schools (MS)',
    districtUrl: 'www.biloxischools.net',
  },
  {
    installationId: 'maxwell',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Montgomery County Public Schools (AL)',
  },

  // ── OCONUS — KOREA ─────────────────────────────────────────────────────────
  {
    installationId: 'camp_humphreys',
    hasDoDEA: true,
    dodea: [
      { name: 'Humphreys Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Humphreys Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Humphreys High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'Largest U.S. overseas installation. DoDEA Pacific — Korea District.',
  },
  {
    installationId: 'osan',
    hasDoDEA: true,
    dodea: [
      { name: 'Osan Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Osan Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Osan American HS',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Korea District.',
  },
  {
    installationId: 'camp_walker',
    hasDoDEA: true,
    dodea: [
      { name: 'Daegu Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Daegu Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Daegu American HS',       grades: '9–12', type: 'High' },
    ],
    notes: 'USAG Daegu area. DoDEA Pacific — Korea District.',
  },

  // ── OCONUS — JAPAN ─────────────────────────────────────────────────────────
  {
    installationId: 'kadena',
    hasDoDEA: true,
    dodea: [
      { name: 'Bob Hope Elementary',      grades: 'K–5',  type: 'Elementary' },
      { name: 'Kadena Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Kadena Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Kadena High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Japan District, Okinawa area.',
  },
  {
    installationId: 'yokosuka',
    hasDoDEA: true,
    dodea: [
      { name: 'Sullivans Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Yokosuka Middle School',      grades: '6–8',  type: 'Middle' },
      { name: 'Nile C. Kinnick HS',          grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Japan District. Kinnick HS is one of the top-performing DoDEA schools.',
  },
  {
    installationId: 'yokota',
    hasDoDEA: true,
    dodea: [
      { name: 'Yokota East Elementary', grades: 'K–5',  type: 'Elementary' },
      { name: 'Yokota West Elementary', grades: 'K–5',  type: 'Elementary' },
      { name: 'Yokota Middle School',   grades: '6–8',  type: 'Middle' },
      { name: 'Yokota High School',     grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Japan District, Kanto Plains area.',
  },
  {
    installationId: 'camp_zama',
    hasDoDEA: true,
    dodea: [
      { name: 'Zama American Elementary', grades: 'K–5', type: 'Elementary' },
      { name: 'Zama Middle High School',  grades: '6–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Japan District.',
  },
  {
    installationId: 'mcb_butler',
    hasDoDEA: true,
    dodea: [
      { name: 'Zukeran Elementary',      grades: 'K–5',  type: 'Elementary' },
      { name: 'Lester Elementary',       grades: 'K–5',  type: 'Elementary' },
      { name: 'Mike Davis Elementary',   grades: 'K–5',  type: 'Elementary' },
      { name: 'Okinawa Amelia Earhart IS', grades: '6–8', type: 'Middle' },
      { name: 'Kubasaki High School',    grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Japan District, Okinawa. Multiple schools serve all Camp Butler family housing areas.',
  },
  {
    installationId: 'misawa',
    hasDoDEA: true,
    dodea: [
      { name: 'Misawa Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Misawa Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Edgren High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Pacific — Japan District, northern Japan.',
  },

  // ── OCONUS — GERMANY ───────────────────────────────────────────────────────
  {
    installationId: 'ramstein',
    hasDoDEA: true,
    dodea: [
      { name: 'Ramstein Elementary School',   grades: 'K–5',  type: 'Elementary' },
      { name: 'Ramstein Intermediate School', grades: '3–5',  type: 'Elementary' },
      { name: 'Ramstein Middle School',       grades: '6–8',  type: 'Middle' },
      { name: 'Ramstein High School',         grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Kaiserslautern District. Ramstein HS is one of the largest DoDEA schools.',
  },
  {
    installationId: 'grafenwoehr',
    hasDoDEA: true,
    dodea: [
      { name: 'Grafenwöhr Elementary School',   grades: 'K–5',  type: 'Elementary' },
      { name: 'Vilseck Middle School',           grades: '6–8',  type: 'Middle' },
      { name: 'Vilseck High School',             grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Bavaria District. Serves Grafenwöhr, Vilseck, and Hohenfels communities.',
  },
  {
    installationId: 'wiesbaden',
    hasDoDEA: true,
    dodea: [
      { name: 'Wiesbaden Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Wiesbaden Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Wiesbaden High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Kaiserslautern District.',
  },
  {
    installationId: 'stuttgart',
    hasDoDEA: true,
    dodea: [
      { name: 'Patch Elementary School',   grades: 'K–5',  type: 'Elementary' },
      { name: 'Robinson Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Stuttgart Middle School',   grades: '6–8',  type: 'Middle' },
      { name: 'Stuttgart High School',     grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Bavaria District. Serves USAG Stuttgart (Patch and Robinson Barracks).',
  },
  {
    installationId: 'baumholder',
    hasDoDEA: true,
    dodea: [
      { name: 'Baumholder Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Baumholder Middle High School', grades: '6–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Kaiserslautern District.',
  },
  {
    installationId: 'ansbach',
    hasDoDEA: true,
    dodea: [
      { name: 'Ansbach Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Ansbach Middle High School', grades: '6–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Bavaria District.',
  },

  // ── OCONUS — ITALY ─────────────────────────────────────────────────────────
  {
    installationId: 'aviano',
    hasDoDEA: true,
    dodea: [
      { name: 'Aviano Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Aviano Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Aviano High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Mediterranean District.',
  },
  {
    installationId: 'vicenza',
    hasDoDEA: true,
    dodea: [
      { name: 'Vicenza Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Vicenza Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Vicenza High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Mediterranean District.',
  },
  {
    installationId: 'naples',
    hasDoDEA: true,
    dodea: [
      { name: 'Naples Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Naples Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Naples High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Mediterranean District. Serves NSA Naples families.',
  },

  // ── OCONUS — UK / SPAIN / MIDDLE EAST ──────────────────────────────────────
  {
    installationId: 'lakenheath',
    hasDoDEA: true,
    dodea: [
      { name: 'Lakenheath Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Lakenheath Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Lakenheath High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — UK District. Also serves RAF Mildenhall and RAF Alconbury families.',
  },
  {
    installationId: 'mildenhall',
    hasDoDEA: true,
    dodea: [
      { name: 'Feltwell Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    notes: 'DoDEA Europe — UK District. Middle/HS students attend Lakenheath.',
  },
  {
    installationId: 'rota',
    hasDoDEA: true,
    dodea: [
      { name: 'Rota Elementary School', grades: 'K–5',  type: 'Elementary' },
      { name: 'Rota Middle School',     grades: '6–8',  type: 'Middle' },
      { name: 'Rota High School',       grades: '9–12', type: 'High' },
    ],
    notes: 'DoDEA Europe — Mediterranean District.',
  },

  // ── OCONUS — PACIFIC ───────────────────────────────────────────────────────
  {
    installationId: 'andersen',
    hasDoDEA: true,
    dodea: [
      { name: 'Andersen Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    notes: 'DoDEA Pacific. Middle/HS students typically attend Guam public schools or Guam High School.',
  },

  // ── ARMY — CONUS (additional) ──────────────────────────────────────────────
  {
    installationId: 'fort_sam_houston',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'North East ISD / San Antonio ISD (TX)',
    districtUrl: 'www.neisd.net',
    sloNotes: 'JBSA-Fort Sam Houston SLO coordinates with NEISD. MacArthur HS, Lee HS, and Johnson HS serve the area.',
  },
  {
    installationId: 'fort_eisenhower',
    hasDoDEA: true,
    dodea: [
      { name: 'Eisenhower Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    localDistrict: 'Columbia County School System (GA)',
    notes: 'DoDEA operates one on-post elementary. Middle and high school students attend Columbia County schools — Evans HS and Harlem HS are primary.',
  },
  {
    installationId: 'fort_leavenworth',
    hasDoDEA: true,
    dodea: [
      { name: 'Eisenhower Elementary School', grades: 'K–5', type: 'Elementary' },
      { name: 'Sherman Army High School',     grades: '9–12', type: 'High' },
    ],
    localDistrict: 'Leavenworth USD 453 (KS)',
    notes: 'DoDEA operates elementary and high school on post. Middle school students attend Leavenworth Middle School in USD 453.',
  },
  {
    installationId: 'fort_johnson',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Vernon Parish School Board (LA)',
    sloNotes: 'Leesville HS, Pickering HS, and South Beauregard HS serve the Fort Johnson area. Contact SLO for school zone by address.',
  },
  {
    installationId: 'fort_richardson',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Anchorage School District (AK)',
    districtUrl: 'www.asdk12.org',
    notes: 'JBER-Richardson families use Anchorage School District. Romig MS and East HS are closest to post housing.',
  },
  {
    installationId: 'fort_huachuca',
    hasDoDEA: true,
    dodea: [
      { name: 'Cochise Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    localDistrict: 'Sierra Vista Unified School District (AZ)',
    notes: 'DoDEA operates one on-post elementary. Middle and high school students use SVUSD — Buena HS and Cochise MS are primary.',
  },
  {
    installationId: 'fort_belvoir',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Fairfax County Public Schools (VA)',
    districtUrl: 'www.fcps.edu',
    notes: 'FCPS is one of the largest and highest-performing districts in the country. Bryant Alternative HS and Lee HS are near post.',
  },
  {
    installationId: 'fort_myer',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Arlington Public Schools (VA)',
    districtUrl: 'www.apsva.us',
  },
  {
    installationId: 'redstone_arsenal',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Huntsville City Schools (AL)',
    districtUrl: 'www.huntsvillecityschools.org',
    notes: 'Huntsville City Schools has a strong STEM focus. Huntsville HS and Grissom HS serve families near Redstone.',
  },
  {
    installationId: 'aberdeen_pg',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Harford County Public Schools (MD)',
    districtUrl: 'www.hcps.org',
  },
  {
    installationId: 'white_sands',
    hasDoDEA: true,
    dodea: [
      { name: 'White Sands Elementary School', grades: 'K–8', type: 'K-12' },
    ],
    localDistrict: 'Las Cruces Public Schools / Tularosa Municipal Schools (NM)',
    notes: 'Isolated installation. DoDEA operates K–8 on post. High school students commute to Las Cruces or Tularosa.',
  },
  {
    installationId: 'usma',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Highland Falls-Fort Montgomery Central School District (NY)',
    notes: 'Highland Falls-Fort Montgomery CSD serves West Point families. The district has a dedicated military family liaison.',
  },
  {
    installationId: 'carlisle_barracks',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Carlisle Area School District (PA)',
    districtUrl: 'www.carlislepa.org',
  },
  {
    installationId: 'fort_hamilton',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'New York City DOE — District 20 (NY)',
    notes: 'Fort Hamilton is in Brooklyn. NYC DOE serves the area. Contact the SLO for school selection guidance in the NYC system.',
  },
  {
    installationId: 'fort_dix',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'New Hanover Township School District / Wrightstown Borough Schools (NJ)',
    notes: 'JB MDL families near Fort Dix area use local NJ districts. Contact SLO for school zone by housing address.',
  },
  {
    installationId: 'fort_detrick',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Frederick County Public Schools (MD)',
    districtUrl: 'www.fcps.org',
  },

  // ── NAVY — CONUS (additional) ──────────────────────────────────────────────
  {
    installationId: 'nbk',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Central Kitsap School District / Bremerton School District (WA)',
    districtUrl: 'www.cksd.wednet.edu',
  },
  {
    installationId: 'nas_whidbey',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Oak Harbor School District (WA)',
    districtUrl: 'www.ohsd.net',
    notes: 'Oak Harbor SD is a very military-friendly district — approximately 40% of students are from military families. Strong transition support.',
  },
  {
    installationId: 'nas_lemoore',
    hasDoDEA: true,
    dodea: [
      { name: 'Lemoore Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    localDistrict: 'Lemoore Union Elementary / Lemoore Union High School District (CA)',
    notes: 'DoDEA operates one elementary on post. Middle and HS students attend Kings County schools — Lemoore HS is primary.',
  },
  {
    installationId: 'nas_north_island',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Coronado Unified School District (CA)',
    districtUrl: 'www.coronadousd.net',
    notes: 'Coronado USD is a small, high-performing district. Coronado HS serves the island community.',
  },
  {
    installationId: 'ns_great_lakes',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'North Chicago Community Unit School District 187 (IL)',
    notes: 'Primarily a training command — many families live off base in Lake County. District 187 or Waukegan CUSD serve most families.',
  },
  {
    installationId: 'nas_oceana',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Virginia Beach City Public Schools (VA)',
    districtUrl: 'www.vbschools.com',
    notes: 'VBCPS is a large military-friendly district. Princess Anne HS, Kempsville HS, and Kellam HS are near the base.',
  },
  {
    installationId: 'nas_patuxent',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'St. Mary\'s County Public Schools (MD)',
    districtUrl: 'www.smcps.org',
  },
  {
    installationId: 'ns_newport',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Newport Public Schools (RI)',
    districtUrl: 'www.newportschools.org',
  },
  {
    installationId: 'nas_corpus_christi',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Corpus Christi ISD (TX)',
    districtUrl: 'www.ccisd.us',
  },
  {
    installationId: 'subase_kings_bay',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Camden County Schools (GA)',
    notes: 'St. Marys HS and Camden County HS serve the Kings Bay community.',
  },
  {
    installationId: 'nws_charleston',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Berkeley County School District (SC)',
    districtUrl: 'www.bcsdschools.net',
  },
  {
    installationId: 'nas_fallon',
    hasDoDEA: true,
    dodea: [
      { name: 'Fallon Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    localDistrict: 'Churchill County School District (NV)',
    notes: 'DoDEA operates one on-post elementary. Churchill County HS serves middle and high school students.',
  },

  // ── MARINES — CONUS (additional) ──────────────────────────────────────────
  {
    installationId: 'mcas_miramar',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'San Diego Unified School District (CA)',
    districtUrl: 'www.sandi.net',
    notes: 'Mira Mesa HS and Scripps Ranch HS are the primary high schools. Contact SLO for school zones.',
  },
  {
    installationId: 'mcas_new_river',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Onslow County Schools (NC)',
    districtUrl: 'www.onslow.k12.nc.us',
    notes: 'Shares a district with Camp Lejeune. Dixon HS and Jacksonville HS serve the area.',
  },
  {
    installationId: 'mcas_yuma',
    hasDoDEA: true,
    dodea: [
      { name: 'Holbrook Elementary School', grades: 'K–5', type: 'Elementary' },
    ],
    localDistrict: 'Yuma Union High School District / Crane Elementary District (AZ)',
    notes: 'DoDEA operates one on-post elementary. Middle and HS students use the Yuma Union district — Cibola HS and Kofa HS are primary.',
  },

  // ── AIR FORCE — CONUS (additional) ────────────────────────────────────────
  {
    installationId: 'wpafb',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Fairborn City Schools / Beavercreek City Schools (OH)',
    districtUrl: 'www.fairborn.k12.oh.us',
    notes: 'Fairborn HS and Beavercreek HS are the primary schools. Both districts have strong STEM programs aligned with the base\'s aerospace mission.',
  },
  {
    installationId: 'tinker',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Midwest City-Del City School District / Choctaw-Nicoma Park Schools (OK)',
    districtUrl: 'www.mid-del.net',
  },
  {
    installationId: 'barksdale',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'Bossier Parish Schools (LA)',
    districtUrl: 'www.bossierschools.org',
    notes: 'Airline HS and Bossier HS are the primary schools for Barksdale families.',
  },
  {
    installationId: 'fort_mcnair',
    hasDoDEA: false,
    dodea: [],
    localDistrict: 'DC Public Schools (DC)',
    districtUrl: 'dcps.dc.gov',
    notes: 'Small installation in Washington DC. DCPS serves the area; many families opt for DC charter schools.',
  },
];

// Build lookup map by installationId
const SCHOOL_MAP = new Map<string, InstallationSchoolInfo>(
  SCHOOL_DATA.map((s) => [s.installationId, s]),
);

export function getSchoolInfo(installationId: string): InstallationSchoolInfo | null {
  return SCHOOL_MAP.get(installationId) ?? null;
}

// ── PCS school checklist ──────────────────────────────────────────────────────

export const PCS_CHECKLIST = [
  {
    step: 1,
    title: 'Get Records Before You Leave',
    body: 'Request official academic records, immunization records, IEP/504 documents, and sports physicals from your current school. Ask for sealed originals and unofficial copies.',
    icon: '📋',
  },
  {
    step: 2,
    title: 'Contact the SLO Early',
    body: 'The School Liaison Officer (SLO) at your gaining installation can tell you exactly which schools serve each neighborhood, enrollment timelines, and any registration requirements. Contact them 60–90 days out.',
    icon: '📞',
  },
  {
    step: 3,
    title: 'Research the School District',
    body: 'Check if the gaining state is part of the Military Interstate Children\'s Compact (MIC3). Review the district website for course equivalency policies — some states require different credits for graduation.',
    icon: '🔍',
  },
  {
    step: 4,
    title: 'Know Your Rights (McKinney-Vento)',
    body: 'Under McKinney-Vento, military children experiencing housing instability can enroll immediately, even without records. Schools cannot delay enrollment while waiting for transcripts.',
    icon: '⚖️',
  },
  {
    step: 5,
    title: 'Enroll ASAP',
    body: 'Enroll as soon as housing is confirmed. For popular DoDEA schools, spaces may be limited. Bring: PCS orders, proof of residence, immunization records, and birth certificate.',
    icon: '🏫',
  },
  {
    step: 6,
    title: 'Flag IEP / 504 Needs',
    body: 'If your child has an IEP or 504 plan, notify the new school IN WRITING before the first day. The gaining school has 30 days to review and accept, revise, or develop a new plan.',
    icon: '📌',
  },
];

// ── Know-your-rights items ─────────────────────────────────────────────────────

export const RIGHTS_DATA = [
  {
    icon: '🤝',
    title: 'MIC3 Compact',
    body: 'The Military Interstate Children\'s Compact Commission covers 50 states + DC. It ensures credit transfers, course placement, and enrollment/eligibility rules work across state lines for military families. Check mic3.net.',
  },
  {
    icon: '🏠',
    title: 'McKinney-Vento Act',
    body: 'Provides protections for children experiencing housing instability (includes time in temporary housing during PCS). Schools must enroll immediately, provide transportation, and resolve disputes quickly.',
  },
  {
    icon: '📚',
    title: 'Credit Flexibility',
    body: 'Under MIC3, states must grant immediate course or educational program placement, waive local policies that differ from the sending state, and give military children the same opportunity to qualify for advanced programs.',
  },
  {
    icon: '🎓',
    title: 'Graduation Requirements',
    body: 'If your child has met graduation requirements in a previous state, MIC3 member states must waive specific course requirements (not total credits). The school must work with the family — not penalize military kids.',
  },
  {
    icon: '⚽',
    title: 'Sports & Activities',
    body: 'Military children cannot be denied immediate participation in sports or extracurricular activities based on scheduling, practice, or tryout dates that conflict with PCS timing.',
  },
];
