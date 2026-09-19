# Automatic Online Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collect new Naver Blog search results daily, hold them for authenticated owner moderation, and show only approved results on the public restaurant website.

**Architecture:** A small reviews domain normalizes NAVER API HUB responses, persists pending/approved/rejected records in Neon, and exposes a cron route plus authenticated admin actions. Public pages read only approved records and fall back to the existing curated review evidence whenever review storage is unavailable.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Node test runner, Neon Postgres, NAVER API HUB Search API, Vercel Cron.

## Global Constraints

- Use only `GET https://naverapihub.apigw.ntruss.com/search/v1/blog` for automated discovery.
- Never scrape Naver Place visitor reviews or publish collected results automatically.
- Search `어믜뜰`, `어믜뜰 등갈비찜`, and `어믜뜰 청주` once per day with `display=20`, `start=1`, `sort=date`, and `format=json`.
- Only HTTPS `blog.naver.com` post URLs whose title or description contains `어믜뜰` may enter moderation.
- Keep search-result title and description wording unchanged except for safe removal of highlight tags and HTML entity decoding.
- Do not expose API keys, database URLs, reviewer profile details, ratings, review counts, or `AggregateRating`.
- Production deployment, NAVER API HUB registration, Neon migration, and Vercel environment changes require final user approval.
- Follow the approved Pencil frame `후기 자동 업데이트 관리자·공개 흐름 승인안` in `C:\vibecoding\my-shop\초안`.

---

### Task 1: Normalize and validate NAVER blog candidates

**Files:**
- Create: `lib/online-reviews/types.ts`
- Create: `lib/online-reviews/normalize.ts`
- Test: `tests/online-review-normalize.test.mjs`

**Interfaces:**
- Consumes: unknown NAVER API item objects.
- Produces: `normalizeNaverBlogItem(value, discoveredAt): OnlineReviewCandidate | null` and `dedupeOnlineReviewCandidates(items): OnlineReviewCandidate[]`.

- [ ] **Step 1: Write the failing normalization tests**

Cover safe `<b>` removal, entity decoding, exact `어믜뜰` relevance, YYYYMMDD validation, HTTPS Naver Blog URL normalization, non-Naver rejection, JavaScript URL rejection, malformed object rejection, and first-result URL deduplication.

```js
const result = normalizeNaverBlogItem({
  title: "청주 <b>어믜뜰</b> 후기",
  link: "https://blog.naver.com/example/123?trackingCode=abc",
  description: "등갈비찜 &amp; 셀프바",
  bloggername: "청주 기록",
  bloggerlink: "blog.naver.com/example",
  postdate: "20260917",
}, "2026-09-17T00:00:00.000Z");
assert.equal(result.title, "청주 어믜뜰 후기");
assert.equal(result.sourceUrl, "https://blog.naver.com/example/123");
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/online-review-normalize.test.mjs`

Expected: FAIL because `lib/online-reviews/normalize.ts` does not exist.

- [ ] **Step 3: Implement the minimal types and normalizer**

Define exact fields:

```ts
export type OnlineReviewStatus = "pending" | "approved" | "rejected";

export type OnlineReviewCandidate = {
  sourceUrl: string;
  title: string;
  description: string;
  bloggerName: string;
  bloggerUrl: string;
  publishedOn: string;
  discoveredAt: string;
};
```

Read each input property once, cap text lengths, reject invalid dates and URLs, remove only tags from a small safe text decoder, and delete known tracking query parameters while preserving the post path.

- [ ] **Step 4: Run the normalization tests and verify GREEN**

Run: `node --test tests/online-review-normalize.test.mjs`

Expected: all normalization tests pass.

- [ ] **Step 5: Commit the domain boundary**

```bash
git add lib/online-reviews/types.ts lib/online-reviews/normalize.ts tests/online-review-normalize.test.mjs
git commit -m "feat: normalize Naver blog review candidates"
```

---

### Task 2: Add Neon schema and review repository

**Files:**
- Create: `migrations/002_create_online_reviews.sql`
- Create: `scripts/migrate-online-reviews.mjs`
- Create: `lib/online-reviews/database.ts`
- Create: `lib/online-reviews/repository.ts`
- Modify: `package.json`
- Test: `tests/online-review-repository.test.mjs`

**Interfaces:**
- Consumes: `OnlineReviewCandidate`, query executor, moderation status, result limit.
- Produces: `insertPendingReviews`, `loadApprovedOnlineReviews`, `loadOnlineReviewDashboard`, `moderateOnlineReview`, `startOnlineReviewSyncRun`, and `finishOnlineReviewSyncRun`.

- [ ] **Step 1: Write failing repository and migration tests**

Require parameterized SQL, URL-primary-key deduplication, pending-only insert, approved-only public selection, bounded limits from 1 through 20, stable row mapping, valid status transitions, safe absent-credential errors, two tables, status checks, and indexes.

```js
const inserted = await insertPendingReviews([candidate], async (text, params) => {
  calls.push({ text, params });
  return [{ source_url: candidate.sourceUrl }];
});
assert.equal(inserted, 1);
assert.match(normalizeSql(calls[0].text), /on conflict \(source_url\) do nothing/);
```

- [ ] **Step 2: Run the repository test and verify RED**

Run: `node --test tests/online-review-repository.test.mjs`

Expected: FAIL because the repository and migration do not exist.

- [ ] **Step 3: Add canonical SQL migration**

Create `online_reviews` with the fields and checks from the approved spec, plus indexes on `(status, published_on desc)` and `(status, discovered_at desc)`. Create `online_review_sync_runs` with `running|success|failed`, nonnegative `discovered_count`, and a descending start-time index.

- [ ] **Step 4: Implement the database adapter and repository**

`database.ts` must read only `REVIEWS_DATABASE_URL` and emit only `REVIEWS_DATABASE_URL is not configured` when absent. Map database rows through explicit field reads and return no unexpected executor fields.

```ts
export async function loadApprovedOnlineReviews(
  limit: number,
  query: ReviewQueryExecutor = databaseQuery,
): Promise<OnlineReview[]>;
```

Use `least/greatest` nowhere for the limit; validate and bind the limit as a query parameter so tests prove bounds.

- [ ] **Step 5: Add the migration CLI and package command**

Add `"migrate:online-reviews": "node scripts/migrate-online-reviews.mjs"`. The script reads `migrations/002_create_online_reviews.sql`, uses `DATABASE_URL` then `REVIEWS_DATABASE_URL`, executes once, and reports only stable credential-free errors.

- [ ] **Step 6: Run repository tests and verify GREEN**

Run: `node --test tests/online-review-repository.test.mjs`

Expected: all repository and migration tests pass.

- [ ] **Step 7: Commit persistence**

```bash
git add migrations/002_create_online_reviews.sql scripts/migrate-online-reviews.mjs lib/online-reviews/database.ts lib/online-reviews/repository.ts package.json tests/online-review-repository.test.mjs
git commit -m "feat: persist moderated online reviews"
```

---

### Task 3: Add official API client, sync service, and protected cron route

**Files:**
- Create: `lib/online-reviews/naver-client.ts`
- Create: `lib/online-reviews/sync.ts`
- Create: `lib/online-reviews/cron-auth.ts`
- Create: `app/api/cron/reviews/route.ts`
- Create: `vercel.json`
- Test: `tests/online-review-sync.test.mjs`
- Test: `tests/online-review-cron-contract.test.mjs`

**Interfaces:**
- Consumes: NAVER API HUB credentials, `fetch`, repository functions, cron authorization header.
- Produces: `searchNaverBlog`, `syncOnlineReviews`, `isAuthorizedCronRequest`, and a daily GET route.

- [ ] **Step 1: Write failing API and sync tests**

Assert exact endpoint, query parameters, credential headers, credential-free error messages, non-2xx containment, three independent search calls, cross-query deduplication, partial-failure recording, maximum 60 candidates, and no response-body logging.

```js
assert.equal(url.origin + url.pathname,
  "https://naverapihub.apigw.ntruss.com/search/v1/blog");
assert.equal(url.searchParams.get("sort"), "date");
assert.equal(options.headers["X-NCP-APIGW-API-KEY-ID"], "client-id");
```

- [ ] **Step 2: Run sync tests and verify RED**

Run: `node --test tests/online-review-sync.test.mjs tests/online-review-cron-contract.test.mjs`

Expected: FAIL because the client, sync service, route, and configuration do not exist.

- [ ] **Step 3: Implement the API client and sync service**

Use injected `fetch` and repository functions in tests. Convert each result through `normalizeNaverBlogItem`, dedupe, insert pending rows, and finish the run with `success` only when all three searches succeed. Throw stable codes such as `NAVER_API_CREDENTIALS_MISSING` and `NAVER_API_REQUEST_FAILED` without response payloads.

- [ ] **Step 4: Implement protected cron authentication and route**

Use constant-time byte comparison for `Bearer` tokens of equal length. The route returns `401` for invalid authorization, `200` with `{ ok: true, discoveredCount }` for success, and `503` with `{ ok: false }` for contained failures. Never return internal errors.

- [ ] **Step 5: Configure the daily schedule**

Create:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [{ "path": "/api/cron/reviews", "schedule": "0 0 * * *" }]
}
```

This requests 00:00 UTC, approximately 09:00 KST, within Vercel Hobby timing precision.

- [ ] **Step 6: Run sync tests and verify GREEN**

Run: `node --test tests/online-review-sync.test.mjs tests/online-review-cron-contract.test.mjs`

Expected: all sync and cron tests pass.

- [ ] **Step 7: Commit automated collection**

```bash
git add lib/online-reviews/naver-client.ts lib/online-reviews/sync.ts lib/online-reviews/cron-auth.ts app/api/cron/reviews/route.ts vercel.json tests/online-review-sync.test.mjs tests/online-review-cron-contract.test.mjs
git commit -m "feat: collect Naver blog reviews daily"
```

---

### Task 4: Build the authenticated review moderation dashboard

**Files:**
- Modify: `lib/admin/urls.ts`
- Create: `app/admin/reviews/page.tsx`
- Create: `app/admin/reviews/actions.ts`
- Create: `components/admin/online-reviews-dashboard.tsx`
- Modify: `components/admin/ai-visits-dashboard.tsx`
- Modify: `app/admin/admin.module.css`
- Test: `tests/admin-auth.test.mjs`
- Test: `tests/admin-reviews-contract.test.mjs`

**Interfaces:**
- Consumes: existing signed admin cookie, dashboard repository data, `sourceUrl` and allowed action.
- Produces: authenticated `/admin/reviews`, approve/exclude/hide actions, and exact admin return-path support.

- [ ] **Step 1: Write failing authentication and dashboard contract tests**

Require `/admin/reviews` as an exact same-origin next path, reject encoded/open redirects, verify session before DB access, require server actions to verify again, allow only `approved|rejected|pending`, revalidate `/` and `/reviews`, and render accessible 48px controls, source links, states, timestamps, empty states, and load errors.

- [ ] **Step 2: Run admin tests and verify RED**

Run: `node --test tests/admin-auth.test.mjs tests/admin-reviews-contract.test.mjs`

Expected: FAIL because `/admin/reviews` and moderation actions do not exist.

- [ ] **Step 3: Extend exact admin redirect paths**

Change `sanitizeAdminNext` and `canonicalizeAdminPath` to return only `/admin/ai-visits` or `/admin/reviews`; retain the legacy malformed AI-visit variants already tested, and reject all other values.

- [ ] **Step 4: Implement the authenticated page and actions**

Authenticate before loading dashboard data. Actions must authenticate independently, parse form values once, call `moderateOnlineReview`, then call `revalidatePath("/")`, `revalidatePath("/reviews")`, and `revalidatePath("/admin/reviews")`.

- [ ] **Step 5: Implement responsive dashboard presentation**

Match the Pencil frame: summary cards, pending cards first, source/date/title/description, external original link, `홈페이지 공개`, `제외`, and `공개 중지` controls. Add reciprocal admin navigation between AI visits and reviews.

- [ ] **Step 6: Run admin tests and verify GREEN**

Run: `node --test tests/admin-auth.test.mjs tests/admin-reviews-contract.test.mjs`

Expected: all admin authentication and review dashboard tests pass.

- [ ] **Step 7: Commit moderation UI**

```bash
git add lib/admin/urls.ts app/admin/reviews/page.tsx app/admin/reviews/actions.ts components/admin/online-reviews-dashboard.tsx components/admin/ai-visits-dashboard.tsx app/admin/admin.module.css tests/admin-auth.test.mjs tests/admin-reviews-contract.test.mjs
git commit -m "feat: moderate collected reviews in admin"
```

---

### Task 5: Render approved reviews with resilient public fallbacks

**Files:**
- Create: `lib/online-reviews/public.ts`
- Create: `components/site/online-review-cards.tsx`
- Create: `components/site/online-review-cards.module.css`
- Modify: `app/page.tsx`
- Modify: `app/reviews/page.tsx`
- Test: `tests/public-online-reviews.test.mjs`
- Modify: `tests/homepage-contract.test.mjs`
- Modify: `tests/routes-contract.test.mjs`

**Interfaces:**
- Consumes: approved repository records or repository failure.
- Produces: `loadPublicOnlineReviews(limit): Promise<OnlineReview[]>` and accessible public cards linking to original Naver Blog posts.

- [ ] **Step 1: Write failing public rendering and fallback tests**

Require approved-only loading, `[]` on missing configuration or repository failure, limit 3 on home, limit 6 on reviews, external safe links, visible source and date, no ratings, and continued rendering of `REVIEW_ITEMS` when no approved online reviews exist.

- [ ] **Step 2: Run public tests and verify RED**

Run: `node --test tests/public-online-reviews.test.mjs tests/homepage-contract.test.mjs tests/routes-contract.test.mjs`

Expected: FAIL because the public loader and cards do not exist.

- [ ] **Step 3: Implement the safe public loader and cards**

The loader checks `REVIEWS_DATABASE_URL` before querying and catches repository failures without logging secrets. The cards display the unchanged safe title and description, blogger name, publication date, and `네이버에서 원문 보기` link with `target="_blank" rel="noreferrer"`.

- [ ] **Step 4: Integrate home with static fallback**

Make `HomePage` async and request three approved reviews. If results exist, render `OnlineReviewCards`; otherwise render the existing `REVIEW_ITEMS` map unchanged. Export `revalidate = 3600`.

- [ ] **Step 5: Integrate the reviews page**

Keep the existing visitor-review evidence section. Load up to six approved online reviews and render a separate `최근 온라인 후기` section only when one or more are available. Export `revalidate = 3600`.

- [ ] **Step 6: Run public tests and verify GREEN**

Run: `node --test tests/public-online-reviews.test.mjs tests/homepage-contract.test.mjs tests/routes-contract.test.mjs`

Expected: all public and existing contract tests pass.

- [ ] **Step 7: Commit public integration**

```bash
git add lib/online-reviews/public.ts components/site/online-review-cards.tsx components/site/online-review-cards.module.css app/page.tsx app/reviews/page.tsx tests/public-online-reviews.test.mjs tests/homepage-contract.test.mjs tests/routes-contract.test.mjs
git commit -m "feat: show approved online reviews publicly"
```

---

### Task 6: Full verification and preview-readiness handoff

**Files:**
- Modify only if verification finds a defect in files already listed above.
- Create: `docs/superpowers/plans/2026-09-17-automatic-online-reviews-release-checklist.md`

**Interfaces:**
- Consumes: completed feature.
- Produces: evidence that the branch is safe to configure in Preview without changing Production.

- [ ] **Step 1: Run the focused suite**

Run:

```bash
node --test tests/online-review-normalize.test.mjs tests/online-review-repository.test.mjs tests/online-review-sync.test.mjs tests/online-review-cron-contract.test.mjs tests/admin-auth.test.mjs tests/admin-reviews-contract.test.mjs tests/public-online-reviews.test.mjs tests/homepage-contract.test.mjs tests/routes-contract.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 2: Run the complete quality gates**

Run `npm test`, `npm run lint`, and `npm run build`.

Expected: zero failures. Existing intentional skips may remain documented.

- [ ] **Step 3: Verify Pencil parity and responsive source contracts**

Compare the administrator summary, moderation actions, source labels, safety note, and public recent-review cards with Pencil frame `rvw001`. Confirm 390px rules preserve 48px controls and single-column cards.

- [ ] **Step 4: Write the release checklist**

Record exact required external steps without performing them:

1. Register NAVER API HUB Blog Search application.
2. Create or select Preview Neon database.
3. Run `npm run migrate:online-reviews` against Preview.
4. Set the four Preview environment variables.
5. Deploy Preview.
6. Trigger one authorized collection request.
7. Verify pending item is not public.
8. Approve one item and verify home/reviews visibility.
9. Review browser console, accessibility, and Vercel logs.
10. Ask for final Production approval.

- [ ] **Step 5: Commit verification documentation**

```bash
git add docs/superpowers/plans/2026-09-17-automatic-online-reviews-release-checklist.md
git commit -m "docs: add online reviews release checklist"
```

## Plan Self-Review

- Spec coverage: official API, three queries, daily schedule, moderation, persistence, public fallback, security, error containment, responsive UI, Preview validation, and Production approval each map to a task.
- Placeholder scan: every step names its concrete files, behavior, commands, and expected result.
- Type consistency: `OnlineReviewCandidate`, `OnlineReview`, `OnlineReviewStatus`, `ReviewQueryExecutor`, and the repository function names are introduced before every consumer.
- Scope: Naver Place scraping, automatic publication, ratings, alerts, editing, and replies remain explicitly excluded.
