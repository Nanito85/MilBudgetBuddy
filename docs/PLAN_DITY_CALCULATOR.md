# Plan: DITY / PPM Move Calculator

Estimate the incentive pay a servicemember could receive for a Personally Procured Move (PPM, formerly DITY).

---

## What It Does

The government pays a member 100% of what it would have cost to move them using government transportation. If the member moves themselves cheaper, they keep the savings. This calculator estimates that incentive.

1. Member enters authorized weight allowance (by grade)
2. Member enters actual weight shipped
3. App calculates estimated government cost and projected incentive

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Pay grade | Picker | Determines weight allowance |
| Dependent status | Toggle | Affects weight allowance |
| Origin ZIP | Text | For mileage/rate lookup |
| Destination ZIP | Text | |
| Estimated actual weight (lbs) | Numeric input | What member thinks they'll ship |
| Full PPM or partial | Toggle | Partial = some belongings via GTC |

---

## Core Formula

```
Government Cost = Weight × Government Rate Per Pound × Distance Factor
Incentive (100% PPM) = Government Cost × 100%
After-tax estimate = Incentive × (1 - estimated_tax_rate)
```

**Weight allowances by grade (with dependents):**
| Grade | Allowance (lbs) |
|-------|----------------|
| E1–E3 | 8,000 |
| E4 | 8,000 |
| E5 | 9,000 |
| E6 | 11,000 |
| E7 | 12,500 |
| E8–E9 | 13,500 |
| O1–O3 | 12,000 |
| O4–O6 | 14,500 |
| O7–O10 | 18,000 |

(Without dependents: ~1,000–2,000 lbs less)

**Government rate**: DTMO publishes the "Monetary Allowance in Lieu of Transportation" (MALT) rate and baseline cost-per-pound tables annually.

---

## Output

```
Authorized weight:     9,000 lbs
Your estimated weight: 7,200 lbs (80%)

Government cost (est.): $4,320
Your PPM incentive:     $4,320
After-tax (est. 22%):   ~$3,370

Potential savings vs. pro move: $1,200
```

---

## Files to Create

- `src/app/dity-calculator.tsx`
- `src/features/dity/components/WeightSlider.tsx`
- `src/features/dity/utils/dityCalc.ts`
- `src/data/weight-allowances.ts`

---

## References

- JTR (Joint Travel Regulations) Chapter 5 — PPM rules
- DTMO: https://www.travel.dod.mil/move-portal/personally-procured-move-ppm/

---

## Disclaimer Required

> "This is an estimate only. Actual PPM incentive is calculated by your Transportation Office based on verified weight tickets and current DTMO rates. Always coordinate your PPM with your local TMO/PPPO."
