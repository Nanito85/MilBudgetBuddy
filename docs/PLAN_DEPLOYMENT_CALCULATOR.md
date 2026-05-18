# Plan: Deployment Earnings Calculator

Calculate how much extra a servicemember earns during a deployment, including special pays, tax exclusions, and savings potential.

---

## What It Does

1. Member enters basic info and deployment details
2. App shows monthly and total deployment earnings
3. Highlights tax savings from Combat Zone Tax Exclusion (CZTE)
4. Shows Savings Deposit Program (SDP) return if they deposit

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Pay grade | Picker | |
| Deployment duration (months) | Stepper (1–15) | |
| Combat zone eligible | Toggle | Triggers CZTE |
| Hostile Fire / IDP | Toggle | $225/mo while in theater |
| Family Separation Allowance | Toggle | $250/mo if dependents |
| SDP deposit amount | Numeric | Max $10,000, 10% APR |
| Current federal tax bracket | Picker | 10/12/22/24% |

---

## Key Benefits to Calculate

### Combat Zone Tax Exclusion (CZTE)
- All military pay (Basic Pay + special pays) earned in a designated combat zone is excluded from federal income tax for enlisted members.
- Officers: only up to the highest enlisted pay (E9 equivalent) is excluded.

### Savings Deposit Program (SDP)
- Available when deployed to a designated combat zone for 30+ days
- Earns 10% APR (fixed, guaranteed by DoD)
- Maximum deposit: $10,000
- Returned with interest when member leaves the combat zone

### Special Pays That Activate in Combat Zones
- Hostile Fire / Imminent Danger Pay: $225/mo
- Family Separation Allowance: $250/mo (if dependents)

---

## Core Calculations

```
Monthly gross (deployed) = Basic Pay + FSA + HFP + any other special pays
CZTE_savings = Monthly_BasicPay × tax_bracket_rate (enlisted, full exclusion)
SDP_return = 10,000 × 0.10 × (months / 12)  -- if deposited

Total deployment earnings = Monthly gross × months
Tax savings vs. non-deployed = CZTE_savings × months
```

---

## Output

```
6-month deployment, E-6, combat zone eligible, with dependents

Monthly breakdown:
  Basic Pay:              $3,294
  Hostile Fire Pay:       $225
  Family Sep Allowance:   $250
  Total monthly:          $3,769

Total deployment earnings: $22,614
Federal tax savings (22%): $4,342  (CZTE)

Savings Deposit Program ($10,000):
  6-month return: $500 (10% APR)
  Total returned: $10,500

Deployment total value: $27,456
```

---

## Files to Create

- `src/app/deployment-calculator.tsx`
- `src/features/deployment/components/EarningsSummary.tsx`
- `src/features/deployment/components/SDPCard.tsx`
- `src/features/deployment/utils/deploymentCalc.ts`

---

## References

- IRS Publication 3 (Armed Forces Tax Guide): https://www.irs.gov/pub/irs-pdf/p3.pdf
- DFAS SDP: https://www.dfas.mil/militarymembers/payentitlements/sdp/
- DoD designated combat zones: https://militarypay.defense.gov/

---

## Disclaimer

> "Tax exclusion eligibility depends on your specific deployment orders and IRS-designated combat zone status. Consult your unit tax advisor or a MilTax specialist for official guidance."
