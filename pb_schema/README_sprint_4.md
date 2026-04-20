# Sprint 4 — PocketBase schema import

## What this adds

1. **New collection: `user_profiles`** — 1:1 with `users` (auth). Holds:
   - Display fields: `first_name`, `last_name`, `username`, `avatar`, `bio`
   - Location: `location_text` + optional `location_lat` / `location_lng`
   - `myers_briggs` (select 16 types)
   - `social_links` (JSON array of `{platform, url}` — order preserved)
   - Visibility toggles: `show_location`, `show_membership_date`, `show_online_status`
   - Beta-reserved audit flags: `name_renamed_at`, `username_changed_at`
   - Counters: `followers_count`, `contributions_count`
   - Unique indexes on `user` and (conditional) on `username`.

2. **Updated `enrollments` collection** — two new boolean fields:
   - `pinned` — user pinned this course to the top of Mis Cursos.
   - `hidden` — user hid this course from the default list (still accessible via the "Ocultos" drawer).
   - `updateRule` is now `@request.auth.id = user.id` so users can toggle those fields on their own enrollments. (Pre-Sprint-4 it was `null`.)

## Import steps

1. Go to PocketBase admin UI → **Settings → Import collections**.
2. Paste the contents of `pb_schema/collections_sprint_4.json` (or upload the file).
3. Review the diff. Expected changes:
   - `+ user_profiles` (new collection)
   - `enrollments.fields` gets `pinned` and `hidden` (both bool)
   - `enrollments.updateRule` changes `null → @request.auth.id = user.id`
4. Apply.

## What happens on first login for each user

The app auto-creates an empty `user_profiles` row the first time a user
opens the Perfil pane (via `fetchOrCreateProfile` in `lib/profile.ts`).
No manual seeding is needed.

## Testing checklist

- [ ] Log in as any non-admin test user → open Settings → Perfil → fill name, bio, location → save → reload → values persist.
- [ ] Upload avatar → appears in navbar dropdown.
- [ ] Add Instagram + YouTube social links, reorder with up/down arrows, save.
- [ ] Toggle "Mostrar mi ubicación" off → save → reload → stays off.
- [ ] Open Cuenta → change password → success message → confirm re-login works.
- [ ] Open Cuenta → change email → check inbox for confirmation link.
- [ ] Open Mis cursos (as admin Alma) → see all published courses, with admin cog on each (shows "Pronto" tooltip).
- [ ] As non-admin → Mis cursos shows their enrollments. Pin/hide icons work. Hidden ones collapse into the "Ocultos" section.
