# PocketBase schema — Mi Alma en el Universo

This folder holds the Sprint 0 schema for the hub. Each file is designed to be imported through the PocketBase admin UI — no CLI required.

## Files

| File | Purpose |
| --- | --- |
| `collections.json` | All 14 collections (courses, enrollments, posts, comments, reactions, notifications, chat, user preferences, payment methods, transactions, feature flags, etc.) |
| `seed_feature_flags.json` | Default feature flag rows. Paste each row into the `feature_flags` collection after import. |

## How to import collections

1. Open the PocketBase admin UI:
   - **Staging**: https://momatwork-pocketbase-alma-staging.weupli.easypanel.host/_/
2. Go to **Settings → Import collections**.
3. Paste the entire contents of `collections.json` into the text area.
4. Review the diff PocketBase shows. It should add all collections (no deletions).
5. Click **Review → Confirm**.

## How to seed feature flags

After importing, go to **Collections → feature_flags → New record** and create one row per entry in `seed_feature_flags.json`. All flags start **disabled** — that's the safe default for beta.

Only flip `paywall_enabled` and `stripe_enabled` to `true` once billing is fully wired. The app reads these flags at runtime, so toggling them takes effect immediately.

## Notes on rules

- `listRule: ""` (empty string) means **anyone signed in or not** can list the records. For public-read collections (courses, categories, rules, feature_flags, posts, comments, reactions) this is intentional — the marketing/landing pages need to read course metadata without auth.
- `createRule: null` means **only admin** via the PocketBase admin UI can insert. Promote rules to `"@request.auth.id != ''"` once you're ready to let members post.
- Per-user collections (`enrollments`, `notifications`, `payment_methods`, `transactions`, `user_preferences`) are locked so a user can only see their own rows.

## When schemas change

Re-export from PocketBase admin (**Settings → Export collections**) and commit the updated `collections.json`. That keeps schema history in git.
