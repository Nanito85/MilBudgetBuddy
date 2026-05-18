# Plan: Investment Education (Investment 101)

BLUF + detailed investment education tailored for servicemembers.

---

## Current Status

✅ **Shipped** — `src/app/invest-101.tsx`

---

## Topics Covered (v1)

1. **What Is a Stock** — ownership share in a company, price moves with value
2. **What Is an Index Fund** — basket of stocks tracking an index (S&P 500, etc.)
3. **ETF vs Mutual Fund** — both hold many stocks; ETF trades intraday, mutual fund does not
4. **Compound Interest** — returns on returns; time in market > timing the market
5. **The S&P 500** — 500 largest US companies, ~10% average annual return historically
6. **How to Start on Junior Enlisted Pay** — TSP, Roth IRA, $50/mo example

---

## Planned Enhancements

### v2 — Interactive Compound Interest Calculator
Add a calculator at the bottom of the Compound Interest card:
- Inputs: starting amount, monthly contribution, years, expected annual return
- Output: projected balance with a simple bar visualization
- File: `src/features/invest/components/CompoundCalc.tsx`

### v2 — TSP Deep Dive Card
Dedicated topic: TSP funds (G, F, C, S, I, L Funds), lifecycle funds, contribution limits, BRS matching.

### v2 — Blended Retirement System (BRS) Connection
Link Investment 101 to the planned Retirement Calculator.

### v3 — VA Home Loan as an Investment Tool
Explain how VA loans with $0 down can be used to buy and rent out properties (house hacking).

---

## Content Notes

- All content should use military-specific examples (E4 with $400/mo disposable, deployment savings)
- Avoid specific stock picks — keep it index-fund focused
- Reference: TSP.gov, IRS Roth IRA limits, Investopedia for definitions
