# MilBudgetBuddy — Feature Reference
**Last updated:** 2026-05-18 (session 2)  
**Stack:** Expo ~55 / React Native 0.83.2 / React 19 / TypeScript / Expo Router / Zustand v5 / AsyncStorage  
**Build ID:** nanito85 · project efdc8b09-9740-4992-bd14-1200d6d0e133  
**Bundle ID:** com.nanito85.MilBudgetBuddy

---

## How to Build a Test APK

```powershell
# Run from: C:\Users\solit\Documents\web\budgetapp\MilBudgetBuddy
$env:EAS_NO_VCS=1; eas build --platform android --profile preview
```

- Downloads as `.apk` — install directly on Android (no Play Store needed)
- Requires EAS login: `eas login` (account: nanito85)
- Git is initialized — `EAS_NO_VCS=1` is no longer needed
- Repo: https://github.com/Nanito85/MilBudgetBuddy (public)

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| ✅ | Complete — code written, TypeScript passes |
| 🔒 | Intentionally locked (AI chat — needs API key) |
| 📋 | Planned — not yet started |

---

---

## 1. App Shell & Navigation ✅

**What it does:** Root layout, tab bar, splash animation, onboarding gate, first-launch disclaimer.

**Files:**
- `src/app/_layout.tsx` — Tabs + Ionicons icons, all non-tab routes registered with `href: null`
- `src/components/animated-icon.tsx` — Animated splash overlay on launch
- `src/components/DisclaimerModal.tsx` — First-launch "not financial advice" modal

**Tab bar icons (Ionicons):**
| Tab | Icon | Route |
|-----|------|-------|
| HOME | shield-checkmark-outline | `index` |
| KIDS | people-outline | `browse` |
| AI | hardware-chip-outline | `chat` |
| MORE | apps-outline | `tools` |

**Launch sequence:**
1. `hydrate()` loads AsyncStorage → `hydrated: true`
2. `DisclaimerModal` renders as a full-screen overlay if `disclaimerAcknowledged === false` (one-time, any user)
3. `OnboardingFlow` renders if `onboarded === false`
4. Main tab navigator

**Notes:**
- All sub-screens are registered here as hidden tabs. When adding a new screen, add `<Tabs.Screen name="..." options={{ href: null }} />` here.
- Standard `Tabs` from `expo-router` — no PNG files needed, Ionicons render as React components.

---

---

## 2. Onboarding Flow ✅

**What it does:** 5-step first-launch flow. Gates entry until complete. All data stored on-device only.

**Files:**
- `src/features/profile/components/OnboardingFlow.tsx` — Step host + all step components
- `src/features/profile/components/BranchSelector.tsx` — Branch button grid
- `src/store/user.store.ts` — Persists all profile data
- `src/types/user.types.ts` — `UserPreferences`, `MilitaryBranch`, `PayGrade`, `RankVariant`

**Steps:**
1. Welcome splash
2. Branch selector
3. Pay grade + name + YOS + **rank variant picker** (for dual-rank grades)
4. Duty station + home state + family size
5. Notification opt-in → lands on app

**Rank variant picker:** Appears automatically on Step 3 when the selected branch + grade has two valid titles (e.g., Army E8 → MSG vs 1SG). See Section 14 for full dual-rank list.

**Notes:**
- Skipping any step is allowed via "Skip for now" — fields remain blank, can be filled in Profile later.
- `setOnboarded()` on finish writes `onboarded: true` to AsyncStorage; `_layout.tsx` checks this on every launch.
- `disclaimerAcknowledged` is a separate boolean in `UserPreferences` — set by `setDisclaimerAcknowledged()` when the user taps "I UNDERSTAND" on the disclaimer modal. Checked independently of `onboarded` so existing users see it on app update.

---

---

## 3. Home Screen ✅

**What it does:** Dashboard greeting, monthly pay summary, budget snapshot bars, daily finance tip.

**Files:**
- `src/app/index.tsx` — Main home screen
- `src/store/user.store.ts` — Profile data (name, rank, pay grade)
- `src/store/tips.store.ts` — Daily tip rotation + saved tips
- `src/data/tips.ts` — 40+ tips across 6 categories

**Sections:**
- Greeting with rank abbreviation + name (e.g., "SGT SMITH")
- Monthly pay breakdown: Base Pay, BAH, BAS, Special Pays → Estimated Net
- Budget snapshot: progress bars per category
- Daily finance tip card with save/dismiss

**Pay data:** FY2026 — Basic Pay (4.5% raise applied), BAS ($492 enlisted / $325.71 officer). BAH is ZIP-keyed at FY2026 rates (4.2% increase applied).

---

---

## 4. Profile Screen ✅

**What it does:** View/edit all service info, see rank insignia badge, manage special pays, kids, notifications, state residence.

**Files:**
- `src/app/profile.tsx` — Full profile screen + all inline modals
- `src/components/RankInsignia.tsx` — Visual chevron badge (branch-colored)
- `src/components/RankVariantPicker.tsx` — Dual-rank selector chips
- `src/data/rank-insignia.ts` — All insignia data + dual-rank variant definitions
- `src/types/user.types.ts` — `getRankAbbrev(branch, grade, variant)`

**Identity card layout:**
```
[Rank Insignia Badge]  SGT
                       SMITH
                       ARMY
```
- Insignia badge auto-shows for all branches except "Other"
- Variant picker appears below identity card only when a dual-rank grade is active

**Modals inside profile.tsx:**
- Edit Service Info (grade, name, YOS, station, family, TSP, dental, SGLI)
- State Picker (50 states + DC, military-exempt flagged)
- Add Special Pay (type chips + numpad entry)
- Add Kid Profile

**Special Pays supported:** Language, ACIP, Submarine, Diving, Jump, SDAP, HDIP, Sea Pay, Hostile Fire, Nuclear, FLPB, AIP, Other

**State tax:** Shows estimated effective state rate on basic pay. Military-exempt states flagged (TX, FL, WA, etc.). Disclaimer to verify with state tax authority.

---

---

## 5. Rank Insignia System ✅

**What it does:** Renders branch-accurate Unicode chevron badges for any rank. Handles dual-rank grades in Army and Marines.

**Files:**
- `src/data/rank-insignia.ts` — Insignia row data + dual-rank variant map
- `src/components/RankInsignia.tsx` — Badge component (`size`: sm / md / lg)
- `src/components/RankVariantPicker.tsx` — Chip selector for dual-rank grades

**Visual symbols used:**
| Symbol | Meaning |
|--------|---------|
| `^` | Chevron up (Army / Marines / AF / SF) |
| `∨` | Chevron down (Navy / CG petty officers) |
| `⌣` | Rocker arc below chevrons |
| `◆` | Diamond (First Sergeant) |
| `★` | Star (SGM / generals / admirals) |
| `⊛` | Star-in-circle (Command Sergeant Major) |
| `✦` | 4-point star device (SMA) |
| `✚` | Crossed rifles (Marine Corps) |
| `⚓` | Anchor (Navy / CG chiefs) |
| `\|` | Officer bar (O1–O3) |
| `◻` | Warrant Officer bar/pip |

**Dual ranks handled:**
| Branch | Grade | Option A (default) | Option B | Option C |
|--------|-------|--------------------|----------|----------|
| Army | E4 | SPC — Specialist | CPL — Corporal | — |
| Army | E8 | MSG — Master Sergeant | 1SG — First Sergeant | — |
| Army | E9 | SGM — Sergeant Major | CSM — Command Sergeant Major | SMA — Sergeant Major of the Army |
| Marines | E8 | MSgt — Master Sergeant | 1stSgt — First Sergeant | — |
| Marines | E9 | MGySgt — Master Gunnery Sergeant | SgtMaj — Sergeant Major | — |

**Used in:** Profile identity card, Onboarding Step 3

---

---

## 6. Kids Tab (Cadet HQ) ✅

**What it does:** Per-child profiles with savings goals, daily chores, and progress tracking. Gender-appropriate color themes.

**Files:**
- `src/app/browse.tsx` — Kids list screen (CADET HQ)
- `src/app/kids/[id].tsx` — Individual kid detail screen
- `src/store/kids.store.ts` — Zustand store, AsyncStorage persistence
- `src/types/kids.types.ts` — `KidProfile`, `Goal`, `Chore`, `BOY_THEME`, `GIRL_THEME`, `getKidTheme()`

**Themes:**
| Gender | Primary | Accent | Background |
|--------|---------|--------|------------|
| Boy | `#1E88E5` bright blue | `#29B6F6` sky blue | `#0A1929` deep navy |
| Girl | `#E91E8C` hot pink | `#FF80AB` light pink | `#1A0A1E` deep plum |

**Kid detail screen features:** Goals with progress bars, chore checklist with today's completion, age-appropriate finance tips.

**Add kid flow:** Nickname → Theme (Blue/Sky or Pink/Purple) → Activate Profile  
**Remove kid:** Long-press card → confirmation alert

**Kid avatar emojis:** 🚀 (boy) · 🌸 (girl) — consistent across browse.tsx and profile.tsx  
**Name display:** Nickname only (no "CADET" prefix) in profile kid rows

---

---

## 7. AI Chat Tab ✅

**What it does:** Anthropic-powered finance assistant. API key is set — will be active on next build.

**Files:**
- `src/app/chat.tsx` — Chat screen
- `src/store/chat.store.ts` — Message history

**Status:** `EXPO_PUBLIC_ANTHROPIC_API_KEY` is set in `.env`. Rebuild with `eas build` to activate.

---

---

## 8. Tools / More Screen ✅

**What it does:** Hub screen linking to all calculators and resources. Also shows profile mini-bar and budget shortcut.

**Files:**
- `src/app/tools.tsx` — Full More screen

**Calculators listed:**
- PCS Calculator, DITY/PPM Move, TLE/TLA, VA Loan, Retirement, Deployment Earnings, Leave Calculator

**Resources listed:**
- TRICARE Estimator, LES Decoder, Credit Score Guide, Investment 101, Schools Finder

---

---

## 9. PCS Calculator ✅

**What it does:** Compare BAH, base pay, and total compensation between current and gaining duty station. Estimates move break-even.

**Files:**
- `src/app/pcs-calculator.tsx`
- `src/features/pcs/components/GradePicker.tsx` — Reusable pay grade selector
- `src/features/pcs/components/StationPicker.tsx` — Searchable installation selector
- `src/data/installations.ts` — 190 installations (CONUS + OCONUS)
- `src/data/bah-rates.ts` — BAH by ZIP + dependency status (FY2026 rates)

**Notes:** BAH is FY2026 (4.2% average DoD increase applied). To update next January: replace the ZIP-keyed rate table in `bah-rates.ts` with the DoD BAH tables at militarypay.defense.gov and update `BAH_DATA_YEAR`.

---

---

## 10. DITY / PPM Move Calculator ✅

**What it does:** Estimates incentive pay for a Personally Procured Move based on authorized weight allowance and cost-per-pound.

**Files:**
- `src/app/dity-calculator.tsx`
- `src/features/dity/utils/dityCalc.ts`

**Key inputs:** Pay grade (sets weight allowance), estimated actual cost, advance pay option.

---

---

## 11. TLE / TLA Calculator ✅

**What it does:** Calculates Temporary Lodging Entitlement (CONUS) or Temporary Lodging Allowance (OCONUS) during PCS transitions.

**Files:**
- `src/app/tle-calculator.tsx`
- `src/features/tle/utils/tleCalc.ts`

**Key inputs:** Location (CONUS/OCONUS), BAH rate, family size, number of days.  
**Reference:** DoD FMR Vol 7A Ch 68 (TLE) and Ch 69 (TLA).

---

---

## 12. VA Loan Calculator ✅

**What it does:** Estimates maximum home price, monthly payment, and funding fee using the VA loan benefit (0% down).

**Files:**
- `src/app/va-loan-calculator.tsx`
- `src/features/va-loan/utils/vaLoanCalc.ts`

**Key inputs:** Pay grade (drives income estimate), YOS, interest rate, loan term, disability status (waives funding fee).  
**Funding fee:** 2.15% first use / 3.3% subsequent (regular military, no down payment). 0% for 10%+ disability rating.

---

---

## 13. Retirement Calculator (BRS vs High-3) ✅

**What it does:** Side-by-side projection of Blended Retirement System vs legacy High-3 pension value to retirement and beyond.

**Files:**
- `src/app/retirement-calculator.tsx`
- `src/features/retirement/utils/retirementCalc.ts`
- `src/features/retirement/components/NumberStepper.tsx` — Reusable +/− stepper

**Key inputs:** Current YOS, target retirement YOS, pay grade, TSP contribution %, assumed return rate.  
**BRS:** 2.0% × YOS multiplier + TSP government match (1% auto + up to 4% matching).  
**High-3:** 2.5% × YOS multiplier, no TSP match.  
**Break-even:** Calculator shows the crossover year where BRS total wealth exceeds High-3.

---

---

## 14. Deployment Earnings Calculator ✅

**What it does:** Full deployment pay breakdown — IDP, CZTE tax exclusion, FSA, HDP-L, SDP interest, and net vs home comparison.

**Files:**
- `src/app/deployment-calculator.tsx`
- `src/features/deployment/utils/deploymentCalc.ts`

**Key inputs:** Grade, YOS, deployment months (1–24), zone type, dependents, BAH continuation, HDP-L level, tax bracket, SDP deposit.

**Zone types:**
| Type | Pays |
|------|------|
| CZTE (Combat Zone) | IDP $225/mo + federal tax exclusion on basic pay |
| IDP Only | IDP $225/mo, no tax exclusion |
| HDP-L Only | Hardship Duty Pay $50–$150/mo, no IDP |

**CZTE officer cap:** E9 max pay ($7,644) + IDP ($225) = $7,869/month excluded from federal tax.  
**FSA:** $250/month after 30 consecutive days separation, with dependents only.  
**SDP:** 10% APR, deposits up to $10,000 while in combat zone.  
**Reference:** DoD FMR Vol 7A Ch 10 (IDP), Ch 17 (HDP-L), Ch 27 (FSA), Ch 51 (SDP); 26 USC §112 (CZTE).

---

---

## 15. Leave Calculator ✅

**What it does:** Terminal leave payout, use-or-lose risk, ETS balance, and total leave value estimate.

**Files:**
- `src/app/leave-calculator.tsx`
- `src/features/leave/utils/leaveCalc.ts`

**Key inputs:** Pay grade, YOS, current leave balance, projected accrual months, leave use plans.

**Key rules:**
- Accrual: 2.5 days/month (30 days/year)
- Carryover cap: 60 days (75 days with Congress-approved exemption)
- Payout cap at ETS: 60 days maximum (10 USC §501)
- Daily rate = (monthly basic pay × 12) ÷ 365
- Use-or-lose deadline: September 30 (FY end) — calculator uses real Date() for dynamic projection
- Orange warning card when use-or-lose risk detected

---

---

## 16. Schools Finder ✅

**What it does:** Look up DoDEA schools and local district info by installation, plus a PCS school checklist and military family rights guide.

**Files:**
- `src/app/schools-finder.tsx`
- `src/data/schools.ts` — School data for ~55 installations, PCS checklist, rights data

**Three tabs:**
1. **School Lookup** — Select installation → shows DoDEA school names (OCONUS) or nearest public district (CONUS) with enrollment links
2. **PCS Guide** — 6-step checklist (request records early, SLO contact, enrollment timeline, etc.)
3. **Your Rights** — 5 expandable items covering McKinney-Vento Act, MIC3 compact, IEP continuity, sports eligibility, graduation requirements

**Notes:** Data is static (no live API). CONUS installations show the local public school district name. OCONUS installations show DoDEA school names. For live school ratings, link out to GreatSchools.org or the DoDEA website.

---

---

## 17. LES Decoder ✅

**What it does:** Explains every field on a Leave and Earnings Statement, a pay verification tool, and a red-flag checker.

**Files:**
- `src/app/les-decoder.tsx`
- `src/data/les-fields.ts` — 28 LES field definitions + 9 red flags

**Three tabs:**
1. **Glossary** — Searchable + filterable by section (Entitlements / Deductions / Leave / Admin). Each field has formula, explanation, and tip.
2. **Verify Pay** — Enter 6 inputs (grade, YOS, zip, dependents, TSP%, SGLI) → runs checks and shows ✓/✗ on each expected value
3. **Red Flags** — 9 items sorted by severity (HIGH / MEDIUM / INFO), with color-coded cards and action steps

**LES sections covered:** Basic Pay, BAH, BAS, IDP, FSA, HDP-L, ACIP, Jump Pay, SRB, Clothing, TLE, COLA, OHA — FICA SS/Med, Federal/State Tax, TSP, SGLI, Dental, Mid-Month Pay — Leave (BF/Earned/Used/Lost/EOM/UYL) — PEBD, DIEMS, ETS, Net Pay, YTD totals.

---

---

## 18. TRICARE Estimator ✅

**What it does:** Compares TRICARE Prime vs Select (or Reserve Select) annual cost for the user's specific situation and usage level.

**Files:**
- `src/app/tricare-estimator.tsx`
- `src/features/tricare/utils/tricareCalc.ts`

**Key inputs:**
| Input | Options |
|-------|---------|
| Coverage Status | Active Duty / Reserve-Guard / Retired (under 65) |
| Pay Grade Tier | E1–E4 / E5+ (affects Select deductible: $50 vs $150) |
| Coverage For | Me Only / + Spouse / Full Family |
| Typical Use | Low ~4 visits / Medium ~10 visits / High 20+ visits |
| Dental (TDP) | None / Member / +1 / Full Family |

**Plan costs modeled (FY2026):**

| | Active Prime | Active Select | Retired Prime | Retired Select | TRS |
|-|---|---|---|---|---|
| Enrollment fee | $0 | $0 | $463 ind / $927 fam/yr (Group B) | $0 | $57.88/mo ind / $286.66/mo fam |
| Deductible | None | $50–$150 ind | None | $150 ind | $150 ind |
| PCM copay | $0 MTF | 20% after ded | $22 | 20% after ded | $22 |
| Specialist | $0 | 20% after ded | $33 | 20% after ded | $33 |
| Catastrophic cap | $1,000 | $1,000 | $3,500 | $3,500 | $3,500 |

**Retired Prime note:** Group A (retired before 1 Jan 2018) = $381.96 ind / $765 fam. Code defaults to Group B (retired on/after 1 Jan 2018) as the more conservative estimate.

**Output:** Side-by-side plan cards with enrollment + deductible + estimated copays + Rx + dental = total annual estimate. "★ BEST FIT" banner on the cheaper plan. Savings callout in dollars.

**Also includes:** Pharmacy cost table (MTF/mail-order/retail × generic/brand/non-formulary), retired dental FEDVIP note, and 4 key decision factors (MTF proximity, referrals, enrollment period, urgent care).

**TDP dental rates:** Member $14.06/mo · +1 $33.99/mo · Family $45.36/mo  
**Retirees:** TDP not available; FEDVIP at benefeds.com (~$25–$55/mo family).  
**Reference:** tricare.mil/costs (FY2026)

---

---

## 19. Credit Score Guide ✅

**What it does:** Explains the 5 credit factors, score tiers, and military-specific protections (SCRA, security freeze).

**Files:**
- `src/app/credit-score.tsx`

**Sections:** Score tiers visual, 5 factors with percentages, military protections, action plan by score range.

---

---

## 20. Investment 101 ✅

**What it does:** BLUF guides to TSP, index funds, and building wealth on a military salary.

**Files:**
- `src/app/invest-101.tsx`

**Topics:** TSP funds (G/F/C/S/I/L), BRS matching, index fund basics, compound interest, common mistakes.

---

---

## 21. Monthly Budget ✅

**What it does:** Set and track monthly spending categories. Linked from Home screen and Tools > Budget shortcut.

**Files:**
- `src/app/budget.tsx`
- `src/store/budget.store.ts`

**Categories:** Housing, Food, Transportation, Utilities, Savings, Entertainment, Clothing, Medical, Other.

---

---

## 22. Pay Data Files ✅

| File | Contents | Year |
|------|----------|------|
| `src/data/basic-pay-rates.ts` | Basic pay table, all grades E1–O10 | FY2026 (4.5% raise) |
| `src/data/bas-rates.ts` | BAS enlisted $492 / officer $325.71 | FY2026 |
| `src/data/bah-rates.ts` | BAH by ZIP, with/without dependents | FY2026 (4.2% avg increase) |
| `src/data/installations.ts` | 190 installations, ZIP + lat/lon | Current |
| `src/data/state-tax.ts` | 50 states + DC, effective rates, military exemptions | Current |
| `src/data/tips.ts` | 40+ finance tips, 6 categories | Current |
| `src/data/les-fields.ts` | 28 LES fields + 9 red flags | Current |
| `src/data/schools.ts` | ~55 installations with school info + PCS data | Current |
| `src/data/rank-insignia.ts` | Insignia rows for all branches/grades + dual-rank map | Current |

**BAH update note:** BAH rates change annually each January. When ready to update:
1. Download the DoD BAH rate tables from militarypay.defense.gov (or apply the announced % increase)
2. Replace the ZIP-keyed lookup in `src/data/bah-rates.ts` (rates are always in $3 increments)
3. Update `BAH_DATA_YEAR` constant

---

---

## 23. Upcoming / Planned Features 📋

These were identified as high-value additions not yet started:

| Feature | Description | Est. Complexity |
|---------|-------------|-----------------|
| **TSP Deep Dive** | Fund allocation (C/S/I/F/G), BRS matching gap visualizer, annual limit tracker ($23,500), projected growth curve | Medium |
| **VA Disability Calculator** | Combined rating math (VA formula, not simple addition), monthly compensation by rating 10–100% | Medium |
| **Net Worth Tracker** | Assets vs liabilities, monthly trend line. The one number that shows if you're moving forward | Small |
| **GI Bill Calculator** | Post-9/11 housing allowance (E5-w/dep BAH), tuition %, book stipend, time remaining | Medium |
| **Pay Day Countdown** | Days until 1st and 15th on the Home screen, with expected take-home amount | Small |
| **SCRA Benefits Guide** | 6% interest cap on pre-service debt, eviction protections, auto lease termination rights | Small |
| **Debt Payoff Planner** | Avalanche vs snowball comparison, enter debts + rates, see payoff date and interest saved | Medium |

---

---

## 24. App Configuration

**`app.json` / `app.config.js` key values:**
```json
{
  "name": "MilBudgetBuddy",
  "slug": "MilBudgetBuddy",
  "bundleIdentifier": "com.nanito85.MilBudgetBuddy",
  "package": "com.nanito85.MilBudgetBuddy"
}
```

**Environment variables (`.env`):**
```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...   # set — AI chat active on next build
```

**EAS profiles (`eas.json`):**
- `preview` → Android APK (direct install, no store)
- `production` → AAB for Google Play submission

**GitHub:**
- Repo: https://github.com/Nanito85/MilBudgetBuddy (public)
- Privacy policy: https://nanito85.github.io/MilBudgetBuddy/privacy-policy.html (GitHub Pages, served from `/docs`)

---

---

## 25. Known Limitations / Before Store Submission

- [x] ~~BAH rates are FY2025~~ — updated to FY2026 (4.2% DoD increase, 2026-05-18)
- [x] ~~AI Chat tab shows locked state~~ — API key set in `.env`, active on next build
- [x] ~~TRICARE rates need verification~~ — corrected to actual FY2026 values from tricare.mil (2026-05-18)
- [x] ~~Privacy policy URL required~~ — live at https://nanito85.github.io/MilBudgetBuddy/privacy-policy.html
- [ ] Schools data is static — no live ratings feed
- [ ] No push notifications wired for pay day reminders yet (notification service exists, daily tip only)
- [ ] App icon and splash screen — confirm final assets in `assets/` before store submission
- [ ] Test on physical device for safe area / notch handling on various Android sizes
- [ ] Store listing assets — screenshots (EAS can generate), short description (80 chars), keywords ready (see session 2 notes)
