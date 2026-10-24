# Task 5 Report: Sitemap and Guide Modification Dates

## Implementation

- Replaced the sitemap's shared static timestamp with `STATIC_PAGES`, keeping all seven public static paths and assigning each its specified modification date.
- Kept the six-story sitemap mapping based on each story's `modifiedAt` value.
- Updated only the group-dining and galbijjim guides to `2026-10-24`; the family guide and all other story dates remain unchanged.
- Updated the rendered group-guide date assertion to reflect its new public modification label.

## TDD evidence

- RED: the new focused story-date and sitemap tests failed because the guide dates were stale and the sitemap still used a global date.
- GREEN: focused content/discovery tests passed after the implementation (5 passed, 0 failed).
- The full suite initially exposed a stale rendered-date assertion; after updating that assertion, the full suite passed.

## Files changed

- `app/sitemap.ts`
- `lib/content/stories.ts`
- `tests/content-model.test.mjs`
- `tests/search-discovery.test.mjs`
- `tests/public-visible-terms.test.mjs`

## Verification and review

- `node --test --test-name-pattern="priority local-search guides|sitemap|stories export|group and family guides" tests/content-model.test.mjs tests/search-discovery.test.mjs` — passed (5 tests).
- `npm test` — passed (231 passed, 0 failed, 1 skipped).
- `git diff --check` — passed.
- Reviewed the diff: only the two requested guide dates changed; the family guide date stayed at `2026-10-23`; the static paths and story mapping remain intact.

## Concerns

- The full suite skips its optional production-admin runtime test unless `ADMIN_RUNTIME_BASE_URL` is configured.
- The first sandboxed full-suite run was blocked by Windows symlink `EPERM` in the rendered-HTML test; the full suite was rerun unrestricted and passed after correcting the stale date assertion.
- The unrelated untracked indexing plan was preserved and excluded from the commit.
