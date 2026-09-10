# CONUS / OCONUS COLA data pipeline

Regenerates `src/data/conus-cola.ts` and `src/data/oconus-cola.ts` from
official DoD/DTMO source files. Both allowances change on their own
schedules — CONUS COLA indices/rates roughly annually, OCONUS COLA indices
quarterly (the *base rate tables* — compensation & spendable income — only
change annually or with a pay raise).

## Where the source files come from

DTMO's own download buttons are JS/POST-driven with no static, guessable
URL, and `travel.dod.mil` blocks direct `curl`/`WebFetch` (WAF/bot-block on
the whole domain). There's no way to script this end-to-end — download
these by hand, in a real browser, each refresh cycle:

1. Go to https://www.travel.dod.mil/Allowances/CONUS-Cost-of-Living-Allowance/CONUS-COLA-Rate-Lookup/
   and download **"CONUS COLA ASCII Files"** for the current year. This zip
   contains `ccwd{YY}.txt`, `ccwod{YY}.txt`, `cczips{YY}.txt` (CONUS COLA
   base rates + eligible ZIPs) **and** `{YEAR} Compensation Tables.xlsx`
   (used for OCONUS COLA's Annual Compensation lookup — DoD bundles both
   programs' data in the same download).
2. Go to https://www.defensetravel.dod.mil/site/colaCalc.cfm (or the
   OCONUS COLA page under Allowances) and download the current quarter's
   **Indices** spreadsheet (`*_COLA_Indices.xls`) and, if it has changed,
   the **Average Annual Spendable Income Table** PDF.
3. Put all of the above into `scripts/cola-data/sources/` (create it —
   it's gitignored, these are large one-time source files that shouldn't
   ship in the repo).

## Running

```
python scripts/cola-data/gen_conus_cola.py     # writes src/data/conus-cola.ts
python scripts/cola-data/gen_oconus_comp.py     # writes comp_tables.ts.fragment
python scripts/cola-data/gen_oconus_cola.py     # writes src/data/oconus-cola.ts
```

`gen_oconus_cola.py` also embeds the Spendable Income Table (hand-
transcribed from the PDF — DoD doesn't publish it as structured data) and
the OCONUS_COLA_LOCATIONS mapping (this app's OHA locationLabels -> DoD
locality codes/indices, hand-matched once against the Indices spreadsheet).
If the index for a location changes, editing its number directly in
`OCONUS_COLA_LOCATIONS` inside the generated `src/data/oconus-cola.ts` (or
in this script, then re-running it) is faster than a full re-match.

After regenerating, update `CONUS_COLA_DATA_YEAR`/`CONUS_COLA_EFFECTIVE_DATE`
in `conus-cola.ts` and `OCONUS_COLA_DATA_QUARTER`/`OCONUS_COLA_EFFECTIVE_DATE`
in `oconus-cola.ts`, then run `npx tsc --noEmit`.
