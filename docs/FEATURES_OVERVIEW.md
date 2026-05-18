# MilBudgetBuddy — Features Overview

Master planning document. Each feature links to its own plan file.

---

## Status Legend
- ✅ Shipped
- 🔨 In Progress
- 📋 Planned
- 💡 Idea / Backlog

---

## Core App

| Feature | Status | Notes |
|---------|--------|-------|
| 4-tab navigation (Today, Browse, Tools, Profile) | ✅ | NativeTabs (mobile) + custom web tab bar |
| 60 rotating daily tips (6 categories) | ✅ | Deterministic rotation via dayOfYear % count |
| Save / bookmark tips | ✅ | AsyncStorage via tips.store |
| Browse by category | ✅ | 2-column grid + category detail + tip detail |
| Onboarding flow (3 steps) | ✅ | Welcome → Branch → Notifications |
| Profile: branch selector | ✅ | Chip grid |
| Profile: daily tip notifications | ✅ | expo-notifications, configurable time |
| Profile: special pays | ✅ | Add/remove, numpad input, monthly total |
| AI Finance Chat | ⏸ Paused | Screen built, key not inserted yet |

---

## Tools Tab — Education

| Feature | Status | Plan File |
|---------|--------|-----------|
| Investment 101 | ✅ | [PLAN_INVESTMENTS.md](PLAN_INVESTMENTS.md) |

---

## Tools Tab — Calculators

| Feature | Status | Plan File |
|---------|--------|-----------|
| PCS Calculator | 📋 | [PLAN_PCS_CALCULATOR.md](PLAN_PCS_CALCULATOR.md) |
| DITY / PPM Move Calculator | 📋 | [PLAN_DITY_CALCULATOR.md](PLAN_DITY_CALCULATOR.md) |
| TLE / TLA Calculator | 📋 | [PLAN_TLE_CALCULATOR.md](PLAN_TLE_CALCULATOR.md) |
| Schools Finder | 📋 | [PLAN_SCHOOLS_FINDER.md](PLAN_SCHOOLS_FINDER.md) |
| Retirement Calculator (BRS vs High-3) | 📋 | [PLAN_RETIREMENT_CALCULATOR.md](PLAN_RETIREMENT_CALCULATOR.md) |
| VA Loan Calculator | 📋 | [PLAN_VA_LOAN_CALCULATOR.md](PLAN_VA_LOAN_CALCULATOR.md) |
| Deployment Earnings Calculator | 📋 | [PLAN_DEPLOYMENT_CALCULATOR.md](PLAN_DEPLOYMENT_CALCULATOR.md) |
| Leave Calculator | 📋 | [PLAN_LEAVE_CALCULATOR.md](PLAN_LEAVE_CALCULATOR.md) |

---

## Build Order Recommendation

1. **PCS Calculator** — highest demand; BAH data is publicly available
2. **Retirement Calculator** — BRS vs High-3 is a frequent servicemember decision
3. **DITY / PPM** — straightforward math, good quick win
4. **TLE / TLA** — simple but genuinely useful at PCS time
5. **VA Loan** — broad appeal, standard mortgage math
6. **Deployment Earnings** — niche but high value for deployed members
7. **Leave Calculator** — simple terminal leave math
8. **Schools Finder** — requires external data source (GreatSchools API or similar)
