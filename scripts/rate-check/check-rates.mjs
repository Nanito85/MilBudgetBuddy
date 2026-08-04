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
const currentYear = today.getUTCFullYear();
const isJanuary = today.getUTCMonth() === 0; // most annual tables turn over Jan 1

const FIELDS = [
  { name: 'BAH_DATA_YEAR',       file: 'src/data/bah-rates.ts',       kind: 'year' },
  { name: 'BAH_EFFECTIVE_DATE',  file: 'src/data/bah-rates.ts',       kind: 'date' },
  { name: 'BAS_DATA_YEAR',       file: 'src/data/bas-rates.ts',       kind: 'year' },
  { name: 'BASIC_PAY_DATA_YEAR', file: 'src/data/basic-pay-rates.ts', kind: 'year' },
  { name: 'PER_DIEM_DATA_YEAR',  file: 'src/data/per-diem-rates.ts',  kind: 'year' },
  { name: 'VA_LOAN_DATA_YEAR',   file: 'src/data/va-loan-rates.ts',   kind: 'year' },
  { name: 'PPM_DATA_YEAR',       file: 'src/data/weight-allowances.ts', kind: 'year' },
  { name: 'OHA_EFFECTIVE_DATE',  file: 'src/data/oha-rates.ts',       kind: 'date' },
];

const results = FIELDS.map((f) => {
  const value = extractConst(f.file, f.name);
  let stale = false;
  let note = '';

  if (value == null) {
    stale = true;
    note = 'Could not read value — constant or file may have moved';
  } else if (f.kind === 'year') {
    stale = Number(value) < currentYear;
    note = stale ? `Data year ${value} is behind current year ${currentYear}` : 'OK';
  } else {
    const effective = new Date(value);
    const days = Math.floor((today - effective) / 86400000);
    if (f.name === 'OHA_EFFECTIVE_DATE') {
      // Matches isOhaDataStale()'s own 45-day threshold in src/data/oha-rates.ts
      stale = days > 45;
      note = `${days} days since effective (OHA updates ~twice monthly; flag threshold 45 days)`;
    } else {
      stale = days > 400; // most other effective dates are annual
      note = `${days} days since effective`;
    }
  }
  return { ...f, value, stale, note };
});

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
    "Most annual tables (BAH, BAS, basic pay, DLA, MALT, per diem) update effective " +
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
