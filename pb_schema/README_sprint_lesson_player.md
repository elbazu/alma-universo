# Sprint Lesson Player — PocketBase schema import

## What this file does

`collections_sprint_lesson_player.json` makes two changes:

1. **Updates `lessons`** — adds two new fields:
   - `content_image` (file, max 10 MB): image shown in the lesson player when no video URL is set.
   - `content_url` (URL): optional external link shown at the bottom of the lesson.

2. **Creates `lesson_completions`** — tracks which lessons each user has marked as done.
   Fields: `user` (relation → _users), `lesson` (relation → lessons, cascade-delete).

## How to import

1. Open `https://momatwork-pocketbase-alma-staging.weupli.easypanel.host/_/`
2. **Settings → Import collections**
3. Paste the full contents of `collections_sprint_lesson_player.json`
4. Click **Confirm**.
5. Verify:
   - `lessons` collection now shows `content_image` and `content_url` fields.
   - `lesson_completions` collection appears in the list.

## Notes

- Existing lesson records are unaffected — the new fields default to empty.
- The `lesson_completions` rule `@request.auth.id = user` means each user can
  only read/delete their own completion records.
- No index is required for MVP; add a unique index on `(user, lesson)` later
  to prevent duplicate completions if needed.
