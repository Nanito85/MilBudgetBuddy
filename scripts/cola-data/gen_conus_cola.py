"""Generate src/data/conus-cola.ts from the official 2026CC.zip ASCII files."""
import re

import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(SCRIPT_DIR, "sources")
GRADE_ORDER = ['E1','E2','E3','E4','E5','E6','E7','E8','E9',
               'W1','W2','W3','W4','W5',
               'O1E','O2E','O3E','O1','O2','O3','O4','O5','O6','O7','O8','O9','O10']

def norm_grade(raw):
    # file uses e.g. "O10", "O3E", "E1", "W2" -- already matches our PayGrade codes
    return raw.strip()

def parse_rate_file(path):
    rows = {}
    with open(path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            parts = line.split(';')
            grade = norm_grade(parts[0])
            vals = [int(v) for v in parts[1:]]
            rows[grade] = vals
    return rows

wd = parse_rate_file(f"{SRC}\\ccwd26.txt")
wod = parse_rate_file(f"{SRC}\\ccwod26.txt")

YOS_BRACKETS = [0,2,3,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40]

def emit_table(name, table):
    lines = [f"const {name}: Record<PayGrade, number[]> = {{"]
    for g in GRADE_ORDER:
        vals = table.get(g, [0]*21)
        lines.append(f"  {g}: [{','.join(str(v) for v in vals)}],")
    lines.append("};")
    return '\n'.join(lines)

# Parse ZIP index file
zips = []
with open(f"{SRC}\\cczips26.txt", encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        parts = line.split(';')
        zip_code = parts[0].strip()
        index = int(parts[1].strip())
        raw_area = parts[2].strip()
        # Title-case the area but keep the trailing 2-letter state code upper.
        area = raw_area.title()
        m = re.match(r'^(.*,\s*)([A-Za-z]{2})$', area)
        if m:
            area = m.group(1) + m.group(2).upper()
        zips.append((zip_code, index, area))

# Build area -> list of zips, and area -> index (should be consistent per area)
from collections import defaultdict
area_index = {}
area_zips = defaultdict(list)
for z, idx, area in zips:
    area_zips[area].append(z)
    area_index[area] = idx

out = []
out.append("""/**
 * CONUS COLA (Cost-of-Living Allowance in the continental US) — official DoD
 * data, sourced directly from the DTMO CONUS COLA ASCII bulk files
 * (travel.dod.mil/Allowances/CONUS-Cost-of-Living-Allowance/CONUS-COLA-Rate-Lookup/
 * -> "CONUS COLA ASCII Files"), not estimated or reconstructed.
 *
 * Real methodology (DoD's own, from ASCII-TABLE-STRUCTURE.pdf in the same
 * bulk file): monthly CONUS COLA = base rate (by grade + YOS, with/without
 * dependents) x location index (by duty ZIP). NOT a taxable-income-bracket
 * lookup like OCONUS COLA uses — this is much simpler.
 *
 * CONUS COLA applies only in a small number of very-high-cost-of-living
 * areas — as of 2026, 18 distinct areas covering """ + str(len(zips)) + """ ZIP codes,
 * almost entirely coastal CA/NY/WA/MD/VA metros. Most CONUS ZIPs are NOT
 * eligible and correctly return null, not $0 — getConusColaZipInfo()
 * distinguishes "not eligible" from "eligible at $0" this way.
 *
 * HOW TO UPDATE (effective dates below; DTMO updates most/all of this
 * annually, indices can update more often):
 *   1. Visit the URL above, download "CONUS COLA ASCII Files" for the
 *      current year (a ZIP containing ccwd{YY}.txt, ccwod{YY}.txt,
 *      cczips{YY}.txt, semicolon-delimited).
 *   2. Re-run scripts/gen_conus_cola.py (or hand-update the tables below)
 *      against the new files.
 *   3. Update CONUS_COLA_DATA_YEAR and CONUS_COLA_EFFECTIVE_DATE.
 */

import { PayGrade } from './bah-rates';

export const CONUS_COLA_DATA_YEAR = 2026;
export const CONUS_COLA_EFFECTIVE_DATE = '2026-01-01';

// [minYOS brackets]: <2, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40
export const CONUS_COLA_YOS_BRACKETS: number[] = """ + str(YOS_BRACKETS) + """;

// Monthly base rate ($) by grade + YOS bracket — WITH dependents. Multiply
// by the destination ZIP's index (see CONUS_COLA_ZIP_INDEX) to get the
// actual monthly CONUS COLA payment. A rate of 0 means that grade/YOS
// combination doesn't qualify for CONUS COLA at all (e.g. O9/O10 need 20+
// YOS to realistically hold that grade).
""")
out.append(emit_table("CONUS_COLA_BASE_WITH_DEP", wd))
out.append("")
out.append("// Monthly base rate ($) by grade + YOS bracket — WITHOUT dependents.")
out.append(emit_table("CONUS_COLA_BASE_WITHOUT_DEP", wod))
out.append("")

out.append("""
/** Returns the base-rate array index for the highest YOS bracket <= memberYOS. */
function bracketIndex(yos: number): number {
  let idx = 0;
  for (let i = 0; i < CONUS_COLA_YOS_BRACKETS.length; i++) {
    if (yos >= CONUS_COLA_YOS_BRACKETS[i]) idx = i;
    else break;
  }
  return idx;
}

export interface ConusColaZipInfo {
  index: number;
  area: string;
}
""")

out.append(f"// {len(zips)} ZIP codes across {len(area_zips)} CONUS COLA-eligible areas (2026).")
out.append("const CONUS_COLA_ZIP_INDEX: Record<string, ConusColaZipInfo> = {")
for z, idx, area in zips:
    out.append(f'  "{z}": {{ index: {idx}, area: "{area}" }},')
out.append("};")

out.append("""
/** Null = this ZIP is not in a CONUS COLA-eligible area (the normal case —
 * only ~18 high-cost metro areas qualify). Distinct from a real $0 result. */
export function getConusColaZipInfo(zip: string): ConusColaZipInfo | null {
  return CONUS_COLA_ZIP_INDEX[zip] ?? null;
}

/** Monthly CONUS COLA for a member at this ZIP, or null if the ZIP isn't
 * in a COLA-eligible area at all. */
export function getConusCola(zip: string, grade: PayGrade, yos: number, hasDependents: boolean): number | null {
  const info = getConusColaZipInfo(zip);
  if (!info) return null;
  const table = hasDependents ? CONUS_COLA_BASE_WITH_DEP : CONUS_COLA_BASE_WITHOUT_DEP;
  const rates = table[grade];
  if (!rates) return 0;
  const base = rates[bracketIndex(yos)] ?? 0;
  return Math.round(base * info.index);
}
""")

REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
with open(os.path.join(REPO_ROOT, "src", "data", "conus-cola.ts"), 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print("Wrote conus-cola.ts")
print("Areas:", list(area_zips.keys()))
print("Zip count:", len(zips))
