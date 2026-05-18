# Plan: TLE / TLA Calculator

Calculate Temporary Lodging Expense (TLE) entitlement for CONUS moves and Temporary Lodging Allowance (TLA) for OCONUS moves.

---

## Background

- **TLE (CONUS)**: Paid when a member cannot move into permanent housing immediately. Covers a member up to 10 days total (5 days at old duty station + 5 days at new, or 10 combined at new).
- **TLA (OCONUS)**: Similar but for overseas assignments. Duration can be longer (up to 60 days).

---

## What It Does

1. Member selects CONUS or OCONUS move
2. Enters family composition
3. App calculates maximum entitlement per day and total maximum

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Move type | Toggle | CONUS (TLE) / OCONUS (TLA) |
| Pay grade | Picker | Affects per-diem rate |
| Spouse present | Toggle | |
| Number of dependent children | Stepper (0–8) | |
| Number of TLE days requested | Stepper | Max 10 CONUS / up to 60 OCONUS |

---

## TLE Formula (CONUS)

```
Daily TLE = Member Per Diem + (Spouse Factor × Per Diem) + (Children Factor × Per Diem)
```

Per JTR, daily rate factors:
- Member alone: 65% of locality per diem
- With spouse: member 65% + spouse 16.25%
- Each dependent child: 8.125% of locality per diem

Locality per diem is set by GSA. Bundle the most common installation locality rates.

---

## TLA Formula (OCONUS)

TLA uses the OCONUS per diem rate for that country/location:
- First 30 days: 90% of per diem
- Days 31–60: 65% of per diem

Family composition factors same as TLE.

---

## Output

```
Move type: CONUS TLE
Family: Member + Spouse + 2 children
Locality per diem: $185/day (Jacksonville, NC)

Daily TLE entitlement: $198.38
  Member:   $120.25  (65%)
  Spouse:   $30.06   (16.25%)
  Child ×2: $30.06   (2 × 8.125% × $185)
  Meals factor included

Maximum 10-day TLE: $1,983.80
```

---

## Files to Create

- `src/app/tle-calculator.tsx`
- `src/features/tle/components/FamilyComposer.tsx`
- `src/features/tle/utils/tleCalc.ts`
- `src/data/per-diem-rates.ts` — locality rates for major installations

---

## References

- JTR Chapter 5, Part D (TLE) and Part H (TLA)
- GSA Per Diem rates: https://www.gsa.gov/travel/plan-book/per-diem-rates

---

## Disclaimer

> "TLE/TLA entitlements are determined by your gaining unit's finance office using official JTR rates and your specific orders. This calculator provides an estimate for planning purposes only."
