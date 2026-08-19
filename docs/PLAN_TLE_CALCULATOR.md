# Plan: TLE / TLA Calculator

> **⚠️ SUPERSEDED — do not use this doc as a spec.** This was the original
> pre-build plan. The shipped implementation deliberately diverges from the
> formula and rules below because they turned out to be wrong (verified
> against the current JTR). Kept only for historical context on the feature's
> origin. For the actual, current rules, read the code directly:
> - `src/features/tle/utils/tleCalc.ts` — formula, day caps, $290/day TLE
>   combined cap, JTR citations
> - `src/app/tle-calculator.tsx` — UI/inputs
> - `src/data/per-diem-rates.ts`, `src/data/nonforeign-oconus-rates.ts` —
>   locality rate data and sourcing/vintage notes
>
> Known divergences from this plan, as actually implemented:
> - TLE max is **21 days** (not 10) — increased effective 27 Nov 2024 per
>   PDTATAC MAP 66-24.
> - Family percentage table is **65% alone / 100% flat with the first
>   dependent / +35% per additional dependent 12+ / +25% per additional
>   dependent under 12** — not the flat "spouse 16.25% + child 8.125%" split
>   described below, which does not match the real JTR family-member table.
> - TLE has a **$290/day combined lodging + M&IE cap** (JTR par. 050601,
>   PDTATAC MAP 66-24(R), FY2026) — not described in this plan at all.
> - TLA applies **the same flat family percentage every day**, with no
>   90%/65% two-tier day-range schedule as described below (that schedule
>   appears to be from an older JTR edition and was not carried into current
>   guidance — confirmed 2026-08-19 against a primary DTMO source, see
>   `tleCalc.ts` for the citation).
> - Location selection is a **picker over a bundled dataset** (installations
>   + GSA CONUS destinations + OCONUS locations), not a pay-grade-driven
>   lookup — pay grade does not affect TLE/TLA per diem, so it was dropped.
>
> Full audit: see conversation history (2026-08-18) for the file-by-file
> review that surfaced these divergences.

---

## Background (original, superseded — see warning above)

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
