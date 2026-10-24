# GSA CONUS per diem (src/data/gsa-per-diem.ts)

GSA publishes new rates each fiscal year, effective **October 1**. The files are posted in late August or September at
https://www.gsa.gov/travel/plan-a-trip/per-diem-rates/per-diem-files.

1. Download the fiscal year's **ZIP code file** (`.xlsx`) and note the standard CONUS lodging and M&IE rates from its **per diem rates** file.
2. Run:
   ```
   python -P scripts/gsa-per-diem/gen_gsa.py <zip-file.xlsx> <fiscal-year> <std-lodging> <std-meals> src/data/gsa-per-diem.ts <out.ts>
   ```
   The generator keeps the lookup functions at the bottom of the existing file and regenerates the `D` (destinations) and `Z` (ZIP → destination) tables. Lodging is each destination's highest monthly rate.
3. Check the result against the per diem rates file (each destination's max lodging and M&IE), then copy `<out.ts>` over `src/data/gsa-per-diem.ts`.
4. Run `npm test` and update any "FY20xx" per diem labels in the UI.

FY2027 (effective 2026-10-01) came from `FY2027PerDiemZipCode_Validated090126.xlsx`, with a standard rate of $113 lodging and $68 M&IE. All 295 destinations matched `FY2027_PerDiemRates_Validated090126.xlsx`.
