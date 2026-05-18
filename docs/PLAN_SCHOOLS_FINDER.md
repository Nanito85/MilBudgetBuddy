# Plan: Schools Finder

Help military families find and compare schools near their gaining installation, filtered by children's ages/grades.

---

## What It Does

1. Member enters gaining installation (or ZIP)
2. Enters ages or grade levels of their children
3. App displays nearby schools with ratings, type, and distance

---

## Inputs

| Field | Type | Notes |
|-------|------|-------|
| Installation / ZIP | Search picker | |
| Child grades | Multi-select | PreK, K, 1–12 — filters school type shown |

---

## School Types to Show

- Elementary (K–5 or K–6)
- Middle School (6–8)
- High School (9–12)
- DoDEA schools (on-post, available at many OCONUS and some CONUS installations)

---

## Data Source Options

### Option A: GreatSchools API (Recommended)
- Free tier available, returns school ratings, type, address, distance
- Requires API key
- URL: https://developer.greatschools.org/
- Store key as `EXPO_PUBLIC_GREATSCHOOLS_API_KEY`

### Option B: National Center for Education Statistics (NCES)
- Public dataset, no API key needed
- Less real-time, but no dependency on third-party
- Download and bundle a filtered dataset of schools near major installations

### Option C: Static curated list
- Manually curate 10–20 schools per major installation (Fort Liberty, Camp Pendleton, etc.)
- Zero API dependency, works offline
- Best for MVP, replace later with live data

**Recommendation**: Start with Option C (static) for launch, then upgrade to GreatSchools API.

---

## UI Layout

```
Installation: Fort Liberty, NC

Your children: 2nd grade, 9th grade

ELEMENTARY SCHOOLS (2nd grade)
─────────────────────────────
[ Bowley Elementary ]  ★ 7/10  0.8 mi
  Type: Public  |  Grades: K–5

[ Manchester Elementary ]  ★ 8/10  2.1 mi
  Type: Public  |  Grades: K–5

HIGH SCHOOLS (9th grade)
────────────────────────
[ Gray's Creek High ]  ★ 6/10  4.2 mi
  Type: Public  |  Grades: 9–12
```

---

## DoDEA Integration

Show a prominent DoDEA badge if there is a DoDEA school at the installation. DoDEA schools are tuition-free for DoD dependents and are often the first choice for military families.

DoDEA school directory: https://www.dodea.edu/schools/

---

## Files to Create

- `src/app/schools-finder.tsx`
- `src/features/schools/components/SchoolCard.tsx`
- `src/features/schools/components/InstallationPicker.tsx`
- `src/data/schools-static.ts` — static curated list for MVP
- `src/services/greatschools.ts` — API integration (later phase)

---

## Notes

- Always link out to the school's official website or GreatSchools profile for full details
- Add disclaimer that ratings change and families should visit schools in person
- EFMP (Exceptional Family Member Program) families have additional considerations — add a note pointing to EFMP resources
