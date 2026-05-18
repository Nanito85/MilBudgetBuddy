# Plan: Special Pays (Profile Feature)

Allow servicemembers to add their special and incentive pays so the app can display a more accurate income picture.

---

## Current Status

✅ **Shipped** — Profile screen `src/app/profile.tsx` + store `src/store/user.store.ts`

---

## Supported Pay Types (v1)

| Type Key | Label | Typical Range |
|----------|-------|---------------|
| `language` | Language Proficiency Pay | up to $500/mo |
| `aviation_acip` | Aviation Career Incentive Pay (ACIP) | $125–$1,000/mo |
| `submarine` | Submarine Pay | $75–$835/mo |
| `diving` | Diving Duty Pay | $240/mo |
| `parachute` | Parachute / Jump Pay | $150/mo |
| `sdap` | Special Duty Assignment Pay (SDAP) | $75–$600/mo |
| `hazardous_hdip` | Hazardous Duty Incentive Pay (HDIP) | $150–$250/mo |
| `sea_pay` | Career Sea Pay | $100–$805/mo |
| `hostile_fire` | Hostile Fire / Imminent Danger Pay | $225/mo |
| `nuclear` | Nuclear Officer Pay | $170–$1,000/mo |
| `foreign_language_bonus` | Foreign Language Proficiency Bonus | $50–$1,000/mo |
| `assignment_incentive` | Assignment Incentive Pay (AIP) | varies |
| `other` | Other Special Pay | varies |

---

## Data Model

```typescript
interface SpecialPay {
  id: string;          // timestamp + random suffix
  type: SpecialPayType;
  monthlyAmount: number;
  customLabel?: string; // optional override for display
}
```

Stored in `UserPreferences.specialPays[]` via AsyncStorage.

---

## UI Flow

1. Profile → Special Pays section
2. Tap "+ Add Special Pay"
3. Scroll through pay type chips, select one
4. Enter monthly amount via numpad (no keyboard required)
5. Tap "Add Pay"
6. Row appears with label + monthly amount + remove (✕) button
7. Total monthly special pay shown at bottom of section

---

## Planned Enhancements

### v2 — Total Income Summary Card
Combine Basic Pay (from entered pay grade) + BAH + BAS + special pays to show an estimated monthly gross income on the profile or Today screen.

### v2 — Deployment Pay Toggle
When a member is deployed, toggle on Hostile Fire Pay, Combat Zone Tax Exclusion status, and SDP. Automatically adjust special pay total.

### v2 — Custom Label
Already in the data model (`customLabel`), but the UI doesn't expose it yet. Add a text field in the add-pay form for "Custom nickname (optional)".

---

## References

- DoD Financial Management Regulation (DoDFMR) Volume 7A — Military Pay Policy
- DFAS Special Pay tables: https://www.dfas.mil/militarymembers/payentitlements/
