"""Generate the Annual Compensation table portion of src/data/oconus-cola.ts
from '{YEAR} Compensation Tables.xlsx' (bundled inside the CONUS COLA ASCII
zip download -- see README.md). Writes comp_tables.ts.fragment next to this
script; gen_oconus_cola.py picks that fragment up automatically."""
import os
import pandas as pd

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(SCRIPT_DIR, "sources", "2026 Compensation Tables.xlsx")

GRADE_MAP = {
    'O-10':'O10','O-9':'O9','O-8':'O8','O-7':'O7','O-6':'O6','O-5':'O5','O-4':'O4',
    'O-3':'O3','O-2':'O2','O-1':'O1',
    'O-3 E':'O3E','O-2 E':'O2E','O-1 E':'O1E',
    'W-5':'W5','W-4':'W4','W-3':'W3','W-2':'W2','W-1':'W1',
    'E-9':'E9','E-8':'E8','E-7':'E7','E-6':'E6','E-5':'E5','E-4':'E4','E-3':'E3','E-2':'E2','E-1':'E1',
}
GRADE_ORDER = ['E1','E2','E3','E4','E5','E6','E7','E8','E9',
               'W1','W2','W3','W4','W5',
               'O1E','O2E','O3E','O1','O2','O3','O4','O5','O6','O7','O8','O9','O10']

def parse_sheet(sheet_name):
    df = pd.read_excel(SRC, sheet_name=sheet_name, header=None)
    out = {}
    for i in range(len(df)):
        raw_grade = df.iloc[i, 0]
        if not isinstance(raw_grade, str):
            continue
        raw_grade = raw_grade.strip()
        if raw_grade not in GRADE_MAP:
            continue
        grade = GRADE_MAP[raw_grade]
        vals = df.iloc[i, 1:22].tolist()
        vals = [int(round(float(v))) for v in vals]  # round to nearest dollar
        out[grade] = vals
    return out

wd = parse_sheet('comp w dep')
wod = parse_sheet('comp wo dep')

def emit_table(name, table):
    lines = [f"const {name}: Record<PayGrade, number[]> = {{"]
    for g in GRADE_ORDER:
        vals = table.get(g, [0]*21)
        lines.append(f"  {g}: [{','.join(str(v) for v in vals)}],")
    lines.append("};")
    return '\n'.join(lines)

with open(os.path.join(SCRIPT_DIR, 'comp_tables.ts.fragment'), 'w', encoding='utf-8') as f:
    f.write(emit_table("ANNUAL_COMPENSATION_WITH_DEP", wd))
    f.write("\n\n")
    f.write(emit_table("ANNUAL_COMPENSATION_WITHOUT_DEP", wod))
    f.write("\n")

print("Wrote comp_tables.ts.fragment")
print("E5 wo dep:", wod.get('E5'))
print("E1 wo dep:", wod.get('E1'))
