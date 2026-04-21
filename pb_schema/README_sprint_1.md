# Sprint 1 — PocketBase schema import guide

Sprint 1 adds two new collections (`modules` and `lessons`) and updates the
write-access rules on three existing collections (`courses`, `categories`, `rules`)
so that Alma's admin account can create/update/delete records from the app UI.

---

## Step 1 — Import the schema

1. Open the PocketBase admin UI:
   `https://momatwork-pocketbase-alma-staging.weupli.easypanel.host/_/`
2. Go to **Settings → Import collections**.
3. Paste the full contents of `collections_sprint_1.json`.
4. Click **Review** then **Confirm**.

PocketBase's import is **additive and non-destructive** — it only updates
what you provide and leaves all other collections untouched. Existing data
in `courses`, `categories`, and `rules` is preserved.

> **What changes:**
> - `courses` → `createRule`, `updateRule`, `deleteRule` now allow Alma's email.
> - `categories` → same rule update.
> - `rules` → same rule update.
> - NEW: `modules` collection (belongs to a course).
> - NEW: `lessons` collection (belongs to a module).

---

## Step 2 — No seed data needed

The new `modules` and `lessons` collections start empty. You'll populate them
from the Classroom admin UI in the app once Sprint 1 is deployed.

---

## Smoke check

After import, visit `/_/` and confirm you see **modules** and **lessons** in
the Collections list. Click on **courses** → **Rules** and confirm Create/Update/Delete
now show `@request.auth.email = "zuniga.elba@gmail.com"` instead of being empty.

---

## If something goes wrong

- **"collection already exists" warning** — this is safe; PB updates in place.
- **Rules didn't change on courses/categories/rules** — you may need to import
  only those three collection objects (copy just their `{}` from the JSON).
  The new `modules` and `lessons` objects can be imported separately if needed.
