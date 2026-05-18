# Plan: Leave Calculator

Calculate terminal leave payout value and help servicemembers track use-or-lose leave before fiscal year end.

---

## What It Does

### Mode 1: Terminal Leave Payout
Estimate the lump-sum payment for unused leave days at separation or retirement.

### Mode 2: Use-or-Lose Tracker
Show how many leave days a member must use before October 1 to avoid losing them (cap is 60 days for most; 120 days for high-deployment members with approved exception).

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Pay grade | Picker | Used to calculate daily rate |
| Current leave balance | Numeric (days) | |
| Mode | Toggle | Terminal Payout / Use-or-Lose |
| **Terminal mode**: separation date | Date picker | |
| **Use-or-lose mode**: current date | Auto (today) | |
| Leave accrual rate | Auto | Standard: 2.5 days/month |
| Leave carry-forward limit | Toggle | 60 days (standard) / 120 days (approved) |

---

## Core Formulas

### Daily Leave Rate
```
Daily Rate = (Annual Basic Pay) / 365
           = (Monthly Basic Pay × 12) / 365
```

### Terminal Leave Payout
```
Days earned by separation = current_balance + (months_remaining × 2.5)
Days sellable = min(days_earned, 60)  -- 60-day sell-back cap at separation
Terminal payout = days_sellable × daily_rate
```

Note: The 60-day sell-back cap applies at separation. Use-or-lose before FY end applies to the carry-forward cap (also typically 60 days).

### Use-or-Lose Calculation
```
Days accrued by Oct 1 = current_balance + (months_until_oct1 × 2.5)
Days that will be lost = max(0, days_accrued - carry_forward_limit)
Days to use before Oct 1 = days_that_will_be_lost
```

---

## Output

### Terminal Leave
```
Pay grade: E-7
Monthly basic pay: $3,727
Daily rate: $147.28

Current leave balance: 45 days
Days until separation (Aug 15): 3.5 months
Days accrued by separation: 45 + 8.75 = 53.75 days
Days sellable (60-day cap): 53.75 days

Terminal leave payout: $7,912
(or take 53 days terminal leave ending on separation date)
```

### Use-or-Lose
```
Today: May 17  |  FY end (Oct 1): 4.5 months away
Current balance: 58 days
Accrued by Oct 1: 58 + 11.25 = 69.25 days
Carry cap: 60 days

Days at risk: 9.25 days
Days to schedule before Oct 1: 10 days

Value of days at risk: $1,473
```

---

## Files to Create

- `src/app/leave-calculator.tsx`
- `src/features/leave/components/LeaveModePicker.tsx`
- `src/features/leave/components/PayoutSummary.tsx`
- `src/features/leave/utils/leaveCalc.ts`

---

## References

- 10 U.S.C. § 701 — leave accrual and carryover rules
- DFAS Leave: https://www.dfas.mil/militarymembers/payentitlements/leave/
- JTR Chapter 7 — leave policies

---

## Notes

- High-deployment members may carry up to 120 days if approved — add a toggle
- Reserve/Guard: leave rules differ; add a disclaimer
- The 60-day sell-back cap at separation is a lifetime cap — members who have already sold back leave in a previous separation may have a reduced cap
