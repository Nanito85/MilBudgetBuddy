# Releasing MilBudgetBuddy

## OTA update vs. store build

`runtimeVersion` uses the `appVersion` policy, so an OTA update only reaches store builds whose `app.json` `version` matches.

- **JS/TS-only change** → OTA update (below).
- **Any native change** (new native module, Expo SDK / React Native bump, `app.json` plugin, icon, or permission change) → bump `version` and do a new store build. Never ship these by OTA.

## OTA update (production)

`eas update` bundles the **working tree**, not the last commit, so start clean.

1. `git status` shows nothing you don't intend to ship. Stash any work in progress.
2. `npx tsc --noEmit -p .`
3. `npm test`, which runs `scripts/verify-calculations.ts`. Every check must pass.
4. Commit, then push the branch; CI runs on `master` and `release/**`.
5. Publish:
   ```
   npx eas update --channel production --platform all --environment preview --message "<what changed>" --non-interactive
   ```
   The production build profile intentionally uses the `preview` EAS environment, because the production env's `SENTRY_AUTH_TOKEN` is invalid. Fix that token before switching.
6. Phones pick up the update after the app is closed and reopened, usually twice.
7. Sentry events carry `update_id` and `update_channel` tags (see `src/services/sentry.ts`), so a new error can be matched to the update that introduced it.

Rollback: `npx eas update:rollback`, or republish the previous group with `npx eas update:republish`.

## Store build

```
eas build --platform all --profile production --auto-submit
```

- Store builds read the EAS environment, not the local `.env`. A new `EXPO_PUBLIC_*` variable must also be added with `eas env:create`.
- Preview builds no longer run on every push. Start them by hand from GitHub Actions → CI → Run workflow.

## After shipping

- Merge the release branch back to `master`. GitHub Pages (privacy policy, terms, support) deploys from `master/docs`, so hosted policy changes are not live until then.
- Before rate rollover dates, update the rate tables: Oct 1 (GSA per diem), Dec 1 (VA compensation), Jan 1 (pay, BAH, BAS, tax brackets, TSP/IRA limits). See `scripts/rate-check/`.

## Two-device sync check (before any change to `firestore-sync.ts` or a store)

1. Sign in to the same account on devices A and B.
2. On A, edit a budget category. On B, confirm the change appears.
3. On B, open Command Mode, Net Worth, and Debt Payoff. On A, confirm the edit is still there and was not reverted.
4. Force-quit B, edit on A, reopen B, and confirm B shows A's edit.
