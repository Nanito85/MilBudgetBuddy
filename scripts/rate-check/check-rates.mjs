#!/usr/bin/env node
// Monthly financial-data freshness check, run by
// .github/workflows/rate-check.yml on the 1st of every month.
//
// This script NEVER writes to any app data file and never auto-publishes
// anything. It only computes staleness against the app's own effective-date
// constants and drafts a GitHub issue body for a human to review — per
// explicit decision, dollar figures are never auto-applied without someone
// checking the primary source first (DTMO/GSA scraping has proven unreliable
// during manual verification passes; this exists to prompt a *reminder*,
// not to be trusted as a data source on its own).

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

function extractConst(file, name) {
  const src = readFileSync(path.join(root, file), 'utf8');
  const m = src.match(new RegExp(`export const ${name}\\s*=\\s*['"]?([^'";]+)['"]?`));
  return m ? m[1].trim() : null;
}

const today = new Date();
const year = today.getUTCFullYear();
const month = today.getUTCMonth() + 1; // 1-12
const day = today.getUTCDate();
const onOrAfter = (m, d) => month > m || (month === m && day >= d);

// Every dataset with the date it rolls over each year. `expected` is the data
// year the app should be on today; anything older is flagged. (The old check
// compared to the calendar year only, so it could never notice GSA's Oct 1
// fiscal-year flip, and it didn't watch VA, tax, COLA, GS, GI Bill or TSP.)
const calendarYear = () => year;                          // Jan 1 tables
const fiscalYear = () => (onOrAfter(10, 1) ? year + 1 : year); // Oct 1 (GSA FY)
const academicStart = () => (onOrAfter(8, 1) ? year : year - 1); // Aug 1 (GI Bill)

const FIELDS = [
  { name: 'BASIC_PAY_DATA_YEAR',  file: 'src/data/basic-pay-rates.ts',  rollover: 'Jan 1', expected: calendarYear },
  { name: 'BAH_DATA_YEAR',        file: 'src/data/bah-rates.ts',        rollover: 'Jan 1 (published mid-Dec)', expected: calendarYear },
  { name: 'BAS_DATA_YEAR',        file: 'src/data/bas-rates.ts',        rollover: 'Jan 1', expected: calendarYear },
  { name: 'CONUS_COLA_DATA_YEAR', file: 'src/data/conus-cola.ts',       rollover: 'Jan 1', expected: calendarYear },
  { name: 'FEDERAL_TAX_DATA_YEAR',file: 'src/data/federal-tax.ts',      rollover: 'Jan 1 (IRS publishes ~Oct)', expected: calendarYear },
  { name: 'LIMITS_YEAR',          file: 'src/data/annual-limits.ts',  rollover: 'Jan 1 (IRS publishes ~Nov)', expected: calendarYear },
  { name: 'GS_PAY_DATA_YEAR',     file: 'src/data/gs-pay-rates.ts',     rollover: 'Jan (first full pay period)', expected: calendarYear },
  { name: 'VA_LOAN_DATA_YEAR',    file: 'src/data/va-loan-rates.ts',    rollover: 'Jan 1', expected: calendarYear },
  { name: 'PPM_DATA_YEAR',        file: 'src/data/weight-allowances.ts', rollover: 'Jan 1', expected: calendarYear },
  { name: 'GSA_YEAR',             file: 'src/data/gsa-per-diem.ts',     rollover: 'Oct 1 (GSA fiscal year)', expected: fiscalYear },
  { name: 'GI_BILL_DATA_YEAR',    file: 'src/features/gi-bill/utils/giBillCalc.ts', rollover: 'Aug 1', expected: academicStart, parse: (v) => Number(String(v).slice(0, 4)) },
];
// Dated datasets: flagged once older than `maxDays`.
const DATED = [
  { name: 'VA_COMP_EFFECTIVE_DATE',    file: 'src/features/va/utils/vaDisabilityCalc.ts', rollover: 'Dec 1 (SSA COLA)', maxDays: 365 },
  { name: 'OHA_EFFECTIVE_DATE',        file: 'src/data/oha-rates.ts',   rollover: 'about twice a month', maxDays: 45 },
  { name: 'OCONUS_COLA_EFFECTIVE_DATE',file: 'src/data/oconus-cola.ts', rollover: 'about twice a month', maxDays: 45 },
];

const results = [
  ...FIELDS.map((f) => {
    const raw = extractConst(f.file, f.name);
    if (raw == null) return { ...f, value: null, stale: true, note: 'Could not read value — constant or file may have moved' };
    const have = f.parse ? f.parse(raw) : Number(raw);
    const want = f.expected();
    const stale = have < want;
    return { ...f, value: raw, stale, note: stale ? `On ${have}, should be ${want} (rolls over ${f.rollover})` : `OK (rolls over ${f.rollover})` };
  }),
  ...DATED.map((f) => {
    const raw = extractConst(f.file, f.name);
    if (raw == null) return { ...f, value: null, stale: true, note: 'Could not read value — constant or file may have moved' };
    const days = Math.floor((today - new Date(raw)) / 86400000);
    const stale = days > f.maxDays;
    return { ...f, value: raw, stale, note: `${days} days since effective (updates ${f.rollover}; flag after ${f.maxDays})` };
  }),
];

const isJanuary = month === 1; // most annual tables turn over Jan 1
const anyStale = results.some((r) => r.stale) || isJanuary;

// Best-effort reachability probe only — never trusted as a data source, just
// shown so a human knows whether direct DTMO access might be possible again.
const probeUrls = [
  'https://www.travel.dod.mil/Allowances/Overseas-Housing-Allowance/OHA-Rate-Lookup/',
];
const probes = [];
for (const url of probeUrls) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) });
    probes.push(`- ${url} → HTTP ${res.status}`);
  } catch (e) {
    probes.push(`- ${url} → unreachable (${e.message})`);
  }
}

const lines = [];
lines.push(`# Monthly Financial Data Freshness Check — ${today.toISOString().slice(0, 10)}`);
lines.push('');
lines.push(
  "Automated check. **Nothing here is auto-applied** — this only flags what to " +
  "manually re-verify, following the established methodology (WebFetch primary " +
  "sources directly, never trust AI-search summaries alone for dollar figures)."
);
lines.push('');
lines.push('## Data freshness');
lines.push('| Field | File | Value | Status |');
lines.push('|---|---|---|---|');
for (const r of results) {
  lines.push(`| ${r.name} | ${r.file} | ${r.value ?? 'N/A'} | ${r.stale ? '⚠️ ' + r.note : '✅ ' + r.note} |`);
}
lines.push('');
if (isJanuary) {
  lines.push('## ⚠️ January reminder');
  lines.push(
    "Most annual tables (BAH, BAS, basic pay, tax brackets, TSP limits, DLA, MALT) update effective " +
    "January 1 each year. Verify all of these against current-year DoD/GSA sources " +
    'even if the table above shows "OK" — last year\'s rollover may not be caught yet.'
  );
  lines.push('');
}
lines.push('## Known gaps from prior verification passes');
lines.push(
  '- Japan mainland / Korea OHA rates (Yokota, Misawa, Iwakuni, Sasebo, Yokosuka, ' +
  'Camp Humphreys, Osan, Camp Casey, Kunsan, Daegu) were never independently ' +
  'confirmed — Okinawa was fixed, these were not.'
);
lines.push(
  '- Osan AB and Camp Humphreys reportedly share one OHA area per an official ' +
  '(unfetchable) Air Force announcement — the app currently models them as separate areas.'
);
lines.push('');
lines.push('## Source reachability probe (informational only — never trust content from a blocked/unverified fetch)');
lines.push(...probes);
lines.push('');
lines.push('_Generated automatically by `.github/workflows/rate-check.yml`. Close this issue once reviewed — a new one opens next month if anything is still stale._');

const body = lines.join('\n');
console.log(body);

writeFileSync(path.join(root, 'rate-check-issue-body.md'), body);

if (process.env.GITHUB_OUTPUT) {
  writeFileSync(process.env.GITHUB_OUTPUT, `should_open=${anyStale}\n`, { flag: 'a' });
}
