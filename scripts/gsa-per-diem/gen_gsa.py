# Usage: python -P gen_gsa.py <zipfile.xlsx> <fiscal_year> <std_lodging> <std_meals> <existing_ts> <out_ts>
import sys, json, openpyxl
zipf, fy, std_l, std_m, existing, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), sys.argv[5], sys.argv[6]
wb = openpyxl.load_workbook(zipf, read_only=True, data_only=True)
ws = wb.worksheets[0]
rows = ws.iter_rows(values_only=True)
hdr = list(next(rows))
ix = {('ZIP' if h == 'Zip' else h): i for i, h in enumerate(hdr)}
months = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep']
D = {}; Z = {}
for r in rows:
    if r[ix['DestinationID']] is None: continue
    did = int(r[ix['DestinationID']])
    if did == 0: continue  # standard CONUS rate, handled by the default
    zipc = str(r[ix['ZIP']]).zfill(5)
    lod = max(int(r[ix[m]]) for m in months)
    meals = int(r[ix['Meals']])
    rec = [r[ix['Name']], r[ix['State']], r[ix['LocationDefined']], lod, meals]
    if did in D and D[did] != rec:
        # same destination must be consistent across its ZIPs
        if D[did][3] != lod or D[did][4] != meals:
            print('WARN inconsistent', did, D[did], rec)
    D.setdefault(did, rec)
    Z[zipc] = did
src = open(existing, encoding='utf-8').read()
tail = src[src.index('export function lookupPerDiemByZip'):]
lines = []
lines.append('/**')
lines.append(f' * GSA CONUS Per Diem Rates — FY{fy} (Oct {fy-1} – Sep {fy})')
lines.append(f' * Generated from GSA\'s FY{fy} per diem ZIP code file (gsa.gov/travel/plan-a-trip/per-diem-rates/per-diem-files).')
lines.append(f' * Lodging is the highest monthly rate of the year (seasonal destinations peak); M&IE is flat.')
lines.append(f' * {len(D)} non-standard destinations + ZIP lookup ({len(Z):,} non-standard ZIPs).')
lines.append(f' * Any ZIP not in the map defaults to the federal standard rate (${std_l} lodging + ${std_m} M&IE = ${std_l+std_m}/day).')
lines.append(' */')
lines.append('')
lines.append(f'export const GSA_YEAR = {fy};')
lines.append(f'export const STANDARD_LODGING = {std_l};')
lines.append(f'export const STANDARD_MEALS   = {std_m};')
lines.append(f'export const STANDARD_TOTAL   = {std_l+std_m};')
lines.append('')
lines.append('export interface PerDiemResult {')
lines.append('  city: string; state: string; county: string;')
lines.append('  lodging: number; meals: number; total: number; isStandard: boolean;')
lines.append('}')
lines.append('')
lines.append('const D: Record<number, [string, string, string, number, number]> = {')
for did in sorted(D):
    n, st, c, l, m = D[did]
    lines.append(f'  {did}: [{json.dumps(n)},{json.dumps(st)},{json.dumps(c)},{l},{m}],')
lines.append('};')
lines.append('')
lines.append('const Z: Record<string, number> = {')
items = [f'{json.dumps(z)}:{d}' for z, d in sorted(Z.items())]
for i in range(0, len(items), 20):
    lines.append('  ' + ','.join(items[i:i+20]) + ',')
lines.append('};')
lines.append('')
open(out, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + tail)
print('destinations', len(D), 'zips', len(Z))
