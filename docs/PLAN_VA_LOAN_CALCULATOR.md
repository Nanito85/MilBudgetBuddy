# Plan: VA Loan Calculator

Help servicemembers estimate how much home they can afford using their VA loan benefit, and compare VA loan costs to conventional financing.

---

## What It Does

1. Member inputs income, desired loan amount, and term
2. App calculates estimated monthly payment (P&I + funding fee)
3. Shows comparison: VA loan (0% down) vs. conventional (20% down, no PMI)
4. Displays VA funding fee based on usage and down payment

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Home price | Numeric | |
| Down payment % | Slider (0–20%) | VA allows 0% |
| Loan term | Picker | 15 or 30 years |
| Interest rate | Numeric input | User enters current rate |
| First use of VA benefit | Toggle | Affects funding fee |
| Regular military vs. Reserves | Toggle | Affects funding fee |
| Monthly gross income | Numeric | For DTI calculation |
| Monthly debts | Numeric | Student loans, car payment, etc. |

---

## VA Funding Fee Table (2024)

| Down Payment | First Use | Subsequent Use |
|-------------|-----------|----------------|
| < 5% | 2.15% | 3.30% |
| 5–9.99% | 1.50% | 1.50% |
| ≥ 10% | 1.25% | 1.25% |

Funding fee is waived for veterans with a service-connected disability rating.

---

## Core Calculations

```
Loan Amount = Home Price × (1 - down_payment_pct)
Funding Fee = Loan Amount × funding_fee_rate  (rolled into loan)
Total Loan = Loan Amount + Funding Fee

Monthly P&I = Total Loan × [r(1+r)^n] / [(1+r)^n - 1]
  where r = monthly_rate, n = months

DTI = (Monthly P&I + other_debts) / gross_income
VA guideline: DTI should stay ≤ 41%

VA Residual Income Requirement:
  After all debts paid, family needs minimum residual income
  (varies by region and family size — bundle the VA table)
```

---

## Output

```
Home price:    $350,000
Down payment:  $0 (VA benefit)
Funding fee:   $7,525 (2.15%, rolled in)
Total loan:    $357,525
Rate:          6.875%  (30-year)

Monthly P&I:   $2,349
Est. taxes+ins: $320
Total payment: $2,669

DTI: 38% ✅ (below 41% guideline)
Residual income: $1,240 ✅

vs. Conventional (20% down, no PMI):
  Down payment needed: $70,000
  Monthly P&I:         $2,079 (loan $280,000)
  Savings vs VA:       $270/mo (but costs $70K upfront)
```

---

## Files to Create

- `src/app/va-loan-calculator.tsx`
- `src/features/va-loan/components/PaymentBreakdown.tsx`
- `src/features/va-loan/components/VsConventional.tsx`
- `src/features/va-loan/utils/vaLoanCalc.ts`
- `src/data/va-residual-income.ts`

---

## References

- VA Loan Guaranty: https://www.benefits.va.gov/homeloans/
- Funding fee table: https://www.va.gov/housing-assistance/home-loans/funding-fee-and-closing-costs/
- VA Pamphlet 26-7 (lender handbook) for residual income tables

---

## Disclaimer

> "This calculator provides estimates for planning purposes. Actual loan terms, rates, and approval depend on your lender, credit profile, and current market conditions. Contact a VA-approved lender for a formal quote."
