# Plan: PCS Calculator

Compare total compensation between two duty stations so a servicemember can make an informed decision about an upcoming PCS.

---

## What It Does

1. Member selects **current duty station** (installation or ZIP)
2. Member selects **gaining duty station**
3. App looks up and displays side-by-side:
   - Basic Allowance for Housing (BAH) — grade + dependent status
   - Cost of Living Allowance (COLA) — OCONUS stations
   - Basic Pay (unchanged, but shown for reference)
   - Any applicable OHA (Overseas Housing Allowance) for OCONUS
4. Shows **net monthly difference** and **annual difference**

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Pay grade | Picker (E1–O10, W1–W5) | |
| Dependent status | Toggle (with / without) | Affects BAH rate |
| Current duty station | Search / picker | ZIP or installation name |
| Gaining duty station | Search / picker | ZIP or installation name |

---

## Data Sources

- **BAH rates**: Defense Travel Management Office (DTMO) publishes annual BAH tables as a public dataset. Download and bundle as JSON, update each January.
  - URL: https://www.travel.dod.mil/allowances/basic-allowance-for-housing/
- **COLA rates**: DTMO COLA index table (CONUS COLA and OCONUS COLA are different).
- **Installation → ZIP mapping**: Use a static lookup table of major installations with associated ZIP codes.

> **Important**: Do NOT use a live API call for BAH — DTMO does not provide a public REST API. Bundle the annual table as a local JSON file and prompt the user to check rates on DTMO if the data may be outdated.

---

## UI Layout

```
[ Current Station ]        [ Gaining Station ]
   Fort Liberty, NC           Schofield Barracks, HI

   BAH (E5 w/dep): $1,458     BAH: $2,736
   COLA:           $0         COLA: $184
   ─────────────────────────────────────────
   Monthly total:  $1,458     Monthly total: $2,920

   Monthly increase:  +$1,462
   Annual increase:  +$17,544
```

---

## Files to Create

- `src/app/pcs-calculator.tsx` — screen
- `src/features/pcs/components/StationPicker.tsx`
- `src/features/pcs/components/ComparisonTable.tsx`
- `src/data/bah-rates.json` — bundled annual table
- `src/data/installations.json` — installation → ZIP lookup

---

## Edge Cases

- Member without dependents vs. with dependents toggle
- OCONUS stations: show OHA + COLA instead of BAH
- Rate data year — show disclaimer with the data year and DTMO link
- Guard/Reserve: BAH only applies on active-duty orders; add note

---

## Disclaimer Required

> "BAH rates shown are for [year]. Rates are updated annually by DTMO. Always verify current rates at travel.dod.mil before making PCS decisions."
