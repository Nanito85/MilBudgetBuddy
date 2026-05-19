# MilBudgetBuddy — App Store Listing

## App Name
**MilBudgetBuddy**

## Subtitle (iOS, 30 chars max)
Military Finance & Pay Tools

## Short Description (Google Play, 80 chars max)
Military pay, budget, and finance tools built for service members.

---

## Full Description

**Built for the uniform. Free, private, and offline-first.**

MilBudgetBuddy is the all-in-one financial companion for active duty, Guard, and Reserve service members. Every tool is purpose-built for military pay, benefits, and transitions — no account required, no data sold.

---

### PAY & COMPENSATION
- **LES Dashboard** — Real-time basic pay breakdown with BAH, BAS, TSP, SGLI, and dental deductions pre-loaded for your rank and ZIP
- **Pay Chart** — FY2025 basic pay lookup for all E/W/O grades and years of service
- **Deployment Calculator** — IDP, CZTE tax exclusions, FSA, SDP, and total deployment earnings
- **Leave Calculator** — Terminal leave payout, use-or-lose risk, and ETS balance

### BUDGET & NET WORTH
- **Monthly Budget** — Set allocations per category, log real expenses, track spending vs budget for the current month
- **Net Worth Tracker** — Assets vs liabilities with monthly snapshot history and trend chart
- **Debt Payoff Planner** — Avalanche vs snowball comparison with payoff date and total interest saved
- **TSP Deep Dive** — Fund guide, BRS matching gap analysis, contribution limits, and growth projection

### MILITARY BENEFITS
- **GI Bill Calculator** — Ch. 33 tuition, BAH, and books stipend by ZIP, eligibility tier, and enrollment type
- **VA Disability Calculator** — Combined rating (whole-person method), FY2026 compensation rates, and dependent adders
- **TRICARE Estimator** — Prime vs Select cost comparison for your family size
- **SBP Calculator** — Survivor Benefit Plan premium, 55% annuity, and break-even analysis
- **BAH / BAS Reference** — Lookup your housing and subsistence allowances by ZIP

### PLANNING & TRANSITION
- **ETS / Separation Checklist** — 23-item transition checklist from 12 months out to post-separation
- **SCRA Rights Guide** — Interest rate caps, eviction protections, lease termination, and more
- **Military Tax Guide** — CZTE, state exemptions, MilTax, PCS deductions, and filing extensions
- **Retirement Calculator** — BRS vs High-3 pension value side by side
- **Credit Score Guide** — What matters, what hurts, and how to build credit on a military income

### SMART FEATURES
- **Pay Day Countdown** — Always know how many days until the 1st or 15th (adjusted for weekends)
- **Push Notifications** — Optional daily finance tips + evening-before pay day reminders
- **AI Finance Chat** — Ask military pay, benefits, or budgeting questions in plain English
- **Offline-first** — All data stays on your device. No account. No subscription.

---

## Keywords (iOS, comma-separated, 100 chars max)
military pay,BAH,LES,TSP,GI Bill,VA disability,military budget,soldier,sailor,airman,Marine

## Keywords (Google Play tags)
military finance, army pay, navy pay, BAH calculator, LES decoder, GI Bill, VA disability, TSP, military budget, ETS checklist, SCRA, SBP

---

## Category
- **iOS:** Finance
- **Google Play:** Finance

## Content Rating
Everyone (no mature content, no violence, no IAP)

---

## What's New (v1.0.0)
Initial release. Includes pay chart, LES dashboard, budget tracker with expense logging, net worth history, TSP calculator, GI Bill calculator, VA disability calculator, debt payoff planner, SBP calculator, ETS checklist, SCRA guide, military tax guide, TRICARE estimator, and pay day push notifications.

---

## Privacy Policy Notes
- No user account required
- All financial data stored locally on device (AsyncStorage)
- No analytics, no ad tracking, no data transmitted to servers
- Push notifications are optional and can be disabled at any time
- AI chat uses Anthropic API — only the message text is sent; no PII is transmitted

---

## Screenshot Descriptions (capture in order)

1. **Home / LES Dashboard** — Show a populated rank (E5, 6 YOS) with BAH, BAS, net pay breakdown and pay day countdown
2. **Monthly Budget** — BUDGET tab with categories filled in and a green "remaining" balance
3. **Monthly Budget — SPENDING** — SPENDING tab with a few logged expenses and progress bars
4. **VA Disability Calculator** — Multiple ratings entered, combined result with dependent adders
5. **GI Bill Calculator** — School info filled, monthly benefit breakdown visible
6. **Net Worth — History** — HISTORY tab with 3+ snapshots and bar chart visible
7. **ETS Checklist** — Show partial completion with checkmarks across sections
8. **TSP Calculator** — CALCULATOR tab with projected balance bar chart
9. **Tools screen** — Full grid of all calculators and resources
10. **Pay Chart** — LOOKUP mode showing E7 at 10 YOS pay result

**Screenshot specs:**
- iOS: 6.7" (iPhone 15 Pro Max) — 1290×2796 px
- Android: 6.7" — 1080×2400 px
- Use portrait orientation only

---

## App Store Connect — Required Fields Checklist
- [ ] App name: MilBudgetBuddy
- [ ] Subtitle: Military Finance & Pay Tools
- [ ] Bundle ID: com.nanito85.MilBudgetBuddy
- [ ] SKU: milbudgetbuddy-001
- [ ] Primary language: English (U.S.)
- [ ] Category: Finance / Utilities
- [ ] Age rating: 4+
- [ ] Price: Free
- [ ] Privacy policy URL: (add your privacy policy page)
- [ ] Support URL: (GitHub repo or contact email)
- [ ] Screenshots: 10 per device size listed above
- [ ] App preview video: optional
- [ ] Promotional text (170 chars): "The only military finance app that knows the difference between BAH and BAS — built by a service member, for service members."

---

## Build & Submit Commands

```bash
# Production build
eas build --platform all --profile production

# Submit to stores (after build completes)
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

**Before submitting:**
1. Fill in `ascAppId` and `appleTeamId` in `eas.json`
2. Add `google-service-account.json` for Play Store
3. Verify screenshots are captured at correct resolutions
4. Confirm privacy policy URL is live
