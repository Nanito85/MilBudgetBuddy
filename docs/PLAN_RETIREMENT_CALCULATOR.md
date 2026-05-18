# Plan: Retirement Calculator

Project and compare BRS (Blended Retirement System) vs. High-3 pension values so a servicemember can understand their long-term retirement outcome.

---

## Background

- **High-3**: Legacy system. 20-year cliff vest. Pension = 2.5% × years of service × average of highest 3 years of basic pay.
- **BRS**: Post-2018 default. Reduced pension (2.0% multiplier) + government TSP match (up to 5%) + continuation pay at ~12 years.
- Members who joined between Jan 1, 2006 and Dec 31, 2017 had a one-time election opportunity. Members after Jan 1, 2018 are automatically in BRS.

---

## What It Does

1. Member inputs their situation
2. App projects annual and monthly pension under each system
3. Shows TSP balance projection for BRS
4. Displays break-even point (at what age does BRS catch up to High-3 due to TSP growth)

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Pay grade at retirement | Picker | E1–O10, W1–W5 |
| Years of service at retirement | Slider (0–40) | |
| Current years of service | Slider | For BRS continuation pay |
| System | Toggle or auto-select | BRS / High-3 / Compare both |
| TSP contribution rate | Slider (0–15%) | For BRS projection |
| Expected annual return on TSP | Slider (4–10%, default 7%) | |

---

## Core Formulas

**High-3 Monthly Pension:**
```
Monthly = (years × 0.025 × avg_high3_basic_pay) / 12
```

**BRS Monthly Pension:**
```
Monthly = (years × 0.020 × avg_high3_basic_pay) / 12
```

**BRS TSP at Retirement:**
```
TSP = FV(member_contribution + govt_match_4%, years, monthly_basic_pay, rate)
```
Government matches dollar-for-dollar up to 3%, then 50 cents per dollar up to 5%.

**Continuation Pay (BRS only, ~12 YOS):**
```
Active duty: 2.5× to 13× monthly basic pay (branch varies)
```

---

## Output

```
At 20 years, retiring as E-8:

HIGH-3
Monthly pension: $2,847
Annual pension:  $34,164
Lifetime value (to age 80): $1,025,000

BRS
Monthly pension: $2,277  (–$570 vs High-3)
TSP balance:     $287,000 (assumed 7% growth)
Annual pension:  $27,324

Break-even age: 68
(BRS total > High-3 total after drawing TSP)
```

---

## Files to Create

- `src/app/retirement-calculator.tsx`
- `src/features/retirement/components/RetirementSummaryCard.tsx`
- `src/features/retirement/components/BreakEvenChart.tsx` (simple bar, no charting library)
- `src/features/retirement/utils/retirementCalc.ts`
- `src/data/basic-pay-rates.ts` — current DoD pay tables

---

## References

- BRS explainer: https://militarypay.defense.gov/BlendedRetirement/
- DoD pay tables: https://militarypay.defense.gov/Pay/Basic-Pay/

---

## Disclaimer

> "Retirement projections are estimates. Actual pension amounts depend on your official service record, basic pay at time of retirement, and any approved changes to retirement law. Consult your installation's financial readiness office for official guidance."
