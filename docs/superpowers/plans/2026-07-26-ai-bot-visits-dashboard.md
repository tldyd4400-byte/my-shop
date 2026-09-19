# AI Bot Visits Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record AI/search crawler visits to public pages without storing identifying data and show authenticated 30-day purpose/bot statistics at `/admin/ai-visits`.

**Architecture:** Next.js 16 `proxy.ts` classifies public GET/HEAD requests and uses `NextFetchEvent.waitUntil()` for non-blocking Neon inserts. Focused pure modules own classification, privacy normalization, request eligibility, summary calculation, URL safety, and signed password sessions; server-rendered admin routes query Neon and render the approved B-layout dashboard.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Node 24, Node test runner, `@neondatabase/serverless` HTTP driver, Vercel, Neon Postgres.

## Global Constraints

- Work only in `C:\vibecoding\my-shop\.worktrees\eomeutteull-search-growth` on `codex/eomeutteull-search-growth-implementation`.
- Follow strict RED → GREEN → REFACTOR; every production function must be preceded by a failing behavior test.
- Keep public pages statically rendered and preserve existing URLs and customer-facing copy.
- Never store raw IP, IP hash, referrer, cookie/session source, name, phone number, or query string.
- Store only `created_at`, sanitized pathname, bounded sanitized User-Agent, `bot_id`, `bot_name`, `vendor`, and one of four purpose values.
- Customer-visible pages must not display `SEO`, `GEO`, `LLM`, `JSON-LD`, `schema.org`, or `구조화 데이터`.
- Admin routes, API routes, `_next`, images, media, uploads, and static assets must never be collected.
- Collection failure must only emit a warning; it must never fail or delay the public response.
- Admin password input must be checked against a scrypt hash; session cookies must be HMAC-signed, `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Production deployment is a HOLD until the user explicitly approves the exact ready Preview deployment.
- Do not push a Git remote.

## File Map

**Create**

- `lib/ai-visits/types.ts` — shared bot/event/summary types and purpose labels.
- `lib/ai-visits/bot-registry.ts` — the single ordered bot registry.
- `lib/ai-visits/classify.ts` — `classifyAiBot(userAgent)`.
- `lib/ai-visits/privacy.ts` — pathname and User-Agent sanitizers.
- `lib/ai-visits/request-policy.ts` — public HTML GET/HEAD eligibility.
- `lib/ai-visits/event.ts` — privacy-safe event creation.
- `lib/ai-visits/summary.ts` — current/previous 30-day aggregation.
- `lib/ai-visits/database.ts` — guarded Neon query creation.
- `lib/ai-visits/repository.ts` — insert and dashboard aggregate queries.
- `migrations/001_create_ai_visits.sql` — table, constraints, indexes.
- `scripts/migrate-ai-visits.mjs` — idempotent migration runner.
- `lib/admin/auth.ts` — scrypt password verification and signed sessions.
- `lib/admin/urls.ts` — canonical admin paths and safe next sanitizer.
- `proxy.ts` — canonical URL correction and non-blocking bot recording.
- `components/site/route-chrome.tsx` — omit public chrome on `/admin/**`.
- `app/admin/admin.module.css` — login/dashboard responsive presentation.
- `app/admin/layout.tsx` — noindex admin shell.
- `app/admin/login/page.tsx` — password form.
- `app/admin/login/actions.ts` — login Server Action.
- `app/admin/logout/route.ts` — session cookie deletion.
- `app/admin/ai-visits/page.tsx` — protected server dashboard.
- `components/admin/ai-visits-dashboard.tsx` — approved B-layout presentation.
- `tests/ai-bot-classifier.test.mjs`
- `tests/ai-visit-event.test.mjs`
- `tests/ai-visit-summary.test.mjs`
- `tests/ai-visit-repository.test.mjs`
- `tests/admin-auth.test.mjs`
- `tests/ai-visit-proxy.test.mjs`
- `tests/admin-pages-contract.test.mjs`
- `tests/public-visible-terms.test.mjs`

**Modify**

- `package.json` and lockfile — add Neon dependency and migration script; extend test glob automatically through existing `tests/*.test.mjs`.
- `.gitignore` — ignore `.superpowers/brainstorm/` local visual companion state.
- `app/layout.tsx` — render `RouteChrome` instead of unconditional public chrome.
- `app/globals.css` — only shared focus/button behavior if required; admin-specific styling stays in module CSS.

---

### Task 1: Ordered Bot Classification Registry

**Files:**
- Create: `lib/ai-visits/types.ts`
- Create: `lib/ai-visits/bot-registry.ts`
- Create: `lib/ai-visits/classify.ts`
- Create: `tests/ai-bot-classifier.test.mjs`

**Interfaces:**
- Produces: `classifyAiBot(userAgent: string | null | undefined): BotIdentity | null`.
- Produces: `Purpose = "search_indexing" | "training" | "realtime_citation" | "other"`.
- Later tasks consume `BotIdentity` and `PURPOSE_LABELS`.

- [ ] **Step 1: Write the failing classification test**

Create a table-driven Node test containing every required UA and expected purpose, plus precedence and fallback cases:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { classifyAiBot } from "../lib/ai-visits/classify.ts";

const cases = [
  ["GPTBot/1.0", "gptbot", "OpenAI", "training"],
  ["OAI-SearchBot/1.0", "oai-searchbot", "OpenAI", "search_indexing"],
  ["ChatGPT-User/1.0", "chatgpt-user", "OpenAI", "realtime_citation"],
  ["OAI-AdsBot/1.0", "oai-adsbot", "OpenAI", "other"],
  ["ClaudeBot/1.0", "claudebot", "Anthropic", "training"],
  ["Claude-SearchBot/1.0", "claude-searchbot", "Anthropic", "search_indexing"],
  ["Claude-User/1.0", "claude-user", "Anthropic", "realtime_citation"],
  ["Claude-Web/1.0", "claude-web", "Anthropic", "realtime_citation"],
  ["anthropic-ai", "anthropic-ai", "Anthropic", "training"],
  ["PerplexityBot/1.0", "perplexitybot", "Perplexity", "search_indexing"],
  ["Perplexity-User/1.0", "perplexity-user", "Perplexity", "realtime_citation"],
  ["Googlebot/2.1", "googlebot", "Google", "search_indexing"],
  ["Googlebot-Image/1.0", "googlebot-image", "Google", "search_indexing"],
  ["Googlebot-Video/1.0", "googlebot-video", "Google", "search_indexing"],
  ["GoogleOther/1.0", "googleother", "Google", "search_indexing"],
  ["GoogleOther-Image/1.0", "googleother-image", "Google", "search_indexing"],
  ["GoogleOther-Video/1.0", "googleother-video", "Google", "search_indexing"],
  ["Google-Extended", "google-extended", "Google", "training"],
  ["Yeti/1.1", "yeti", "Naver", "search_indexing"],
  ["NaverBot/1.0", "naverbot", "Naver", "search_indexing"],
  ["bingbot/2.0", "bingbot", "Microsoft", "search_indexing"],
  ["msnbot/2.0", "msnbot", "Microsoft", "search_indexing"],
  ["BingPreview/1.0", "bingpreview", "Microsoft", "search_indexing"],
  ["MicrosoftPreview/1.0", "microsoftpreview", "Microsoft", "search_indexing"],
  ["Applebot/1.0", "applebot", "Apple", "search_indexing"],
  ["Applebot-Extended/1.0", "applebot-extended", "Apple", "training"],
  ["DuckAssistBot/1.2", "duckassistbot", "DuckDuckGo", "realtime_citation"],
  ["DuckDuckBot/1.0", "duckduckbot", "DuckDuckGo", "search_indexing"],
  ["Amazonbot/0.1", "amazonbot", "Amazon", "training"],
  ["Amzn-SearchBot/0.1", "amzn-searchbot", "Amazon", "search_indexing"],
  ["Amzn-User/0.1", "amzn-user", "Amazon", "realtime_citation"],
  ["Meta-WebIndexer/1.1", "meta-webindexer", "Meta", "search_indexing"],
  ["Meta-ExternalFetcher/1.1", "meta-externalfetcher", "Meta", "realtime_citation"],
  ["Meta-ExternalAgent/1.1", "meta-externalagent", "Meta", "training"],
  ["Meta-ExternalAds/1.1", "meta-externalads", "Meta", "other"],
  ["FacebookExternalHit/1.1", "facebookexternalhit", "Meta", "other"],
  ["CCBot/2.0", "ccbot", "Common Crawl", "training"],
  ["Bytespider/1.0", "bytespider", "ByteDance", "training"],
  ["YouBot/1.0", "youbot", "You.com", "search_indexing"],
  ["cohere-ai", "cohere-ai", "Cohere", "training"],
  ["MistralAI-User/1.0", "mistralai-user", "Mistral AI", "realtime_citation"],
];

test("classifies the approved bot registry", () => {
  for (const [ua, botId, vendor, purpose] of cases) {
    assert.deepEqual(classifyAiBot(ua), {
      botId,
      botName: ua.split("/")[0],
      vendor,
      purpose,
    });
  }
});

test("uses specific patterns before parent bot patterns", () => {
  assert.equal(classifyAiBot("Googlebot-Image/1.0")?.botId, "googlebot-image");
  assert.equal(classifyAiBot("Applebot-Extended/1.0")?.purpose, "training");
});

test("uses other only for generic crawler signals and ignores browsers", () => {
  assert.equal(classifyAiBot("ExampleSpider/1.0")?.purpose, "other");
  assert.equal(classifyAiBot("Mozilla/5.0 Chrome/126"), null);
  assert.equal(classifyAiBot(null), null);
});
```

Use explicit expected `botName` values in the final test table rather than deriving names for aliases such as `FacebookExternalHit`.

- [ ] **Step 2: Run the classifier test and confirm RED**

Run: `node --test tests/ai-bot-classifier.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/ai-visits/classify.ts`.

- [ ] **Step 3: Implement the types, registry, and classifier**

Use an ordered readonly registry and escaped literal substring matching:

```ts
export type Purpose =
  | "search_indexing"
  | "training"
  | "realtime_citation"
  | "other";

export type BotIdentity = {
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
};

export const PURPOSE_LABELS: Record<Purpose, string> = {
  search_indexing: "검색 인덱싱",
  training: "학습",
  realtime_citation: "실시간 인용",
  other: "기타",
};
```

```ts
import { BOT_REGISTRY } from "./bot-registry.ts";
import type { BotIdentity } from "./types.ts";

const GENERIC_BOT_PATTERN = /bot|crawler|spider|fetcher|slurp/i;

export function classifyAiBot(userAgent: string | null | undefined): BotIdentity | null {
  if (!userAgent) return null;
  const known = BOT_REGISTRY.find(({ pattern }) => pattern.test(userAgent));
  if (known) {
    const { pattern: _pattern, ...identity } = known;
    return identity;
  }
  return GENERIC_BOT_PATTERN.test(userAgent)
    ? { botId: "generic-crawler", botName: "기타 크롤러", vendor: "Unknown", purpose: "other" }
    : null;
}
```

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/ai-bot-classifier.test.mjs && npm test`

Expected: classifier tests PASS and the complete suite reports zero failures.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-visits/types.ts lib/ai-visits/bot-registry.ts lib/ai-visits/classify.ts tests/ai-bot-classifier.test.mjs
git commit -m "feat: classify AI and search bots"
```

---

### Task 2: Privacy-Safe Event and Public Request Policy

**Files:**
- Create: `lib/ai-visits/privacy.ts`
- Create: `lib/ai-visits/request-policy.ts`
- Create: `lib/ai-visits/event.ts`
- Create: `tests/ai-visit-event.test.mjs`

**Interfaces:**
- Consumes: `BotIdentity` from Task 1.
- Produces: `isCollectableRequest({ method, pathname }): boolean`.
- Produces: `createAiVisitEvent({ pathname, userAgent, bot, now }): AiVisitEvent`.

- [ ] **Step 1: Write failing privacy and exclusion tests**

Cover query removal, control characters, 512-character UA cap, public GET/HEAD, and every excluded route family:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { createAiVisitEvent } from "../lib/ai-visits/event.ts";
import { isCollectableRequest } from "../lib/ai-visits/request-policy.ts";

const bot = { botId: "gptbot", botName: "GPTBot", vendor: "OpenAI", purpose: "training" };

test("creates only the approved privacy-safe fields", () => {
  const event = createAiVisitEvent({
    pathname: "/menu?phone=010-0000-0000#secret",
    userAgent: `GPTBot/1.0\r\n${"x".repeat(700)}`,
    bot,
    now: new Date("2026-07-26T00:00:00.000Z"),
  });
  assert.deepEqual(Object.keys(event).sort(), [
    "botId", "botName", "createdAt", "path", "purpose", "userAgent", "vendor",
  ]);
  assert.equal(event.path, "/menu");
  assert.equal(event.userAgent.length, 512);
  assert.doesNotMatch(event.userAgent, /[\r\n]/);
  for (const forbidden of ["ip", "ipHash", "referrer", "cookie", "session", "phone", "name"]) {
    assert.equal(forbidden in event, false);
  }
});

test("collects public HTML GET and HEAD only", () => {
  assert.equal(isCollectableRequest({ method: "GET", pathname: "/menu" }), true);
  assert.equal(isCollectableRequest({ method: "HEAD", pathname: "/stories/example" }), true);
  for (const pathname of [
    "/admin/ai-visits", "/api/health", "/_next/static/a.js", "/_next/image",
    "/images/a.webp", "/media/a.mp4", "/uploads/a.pdf", "/favicon.ico",
    "/robots.txt", "/sitemap.xml", "/styles/site.css", "/script.js",
  ]) assert.equal(isCollectableRequest({ method: "GET", pathname }), false, pathname);
  assert.equal(isCollectableRequest({ method: "POST", pathname: "/menu" }), false);
});
```

- [ ] **Step 2: Run focused test and confirm RED**

Run: `node --test tests/ai-visit-event.test.mjs`

Expected: FAIL because the event and policy modules do not exist.

- [ ] **Step 3: Implement minimal sanitizers, policy, and event creation**

Use `new URL(pathname, "https://internal.invalid").pathname`, fall back to `/` on malformed input, remove C0/C1 controls, and truncate to 512 code units. Static extension detection must be case-insensitive and include image, video, font, JS, CSS, map, document, and archive extensions.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/ai-visit-event.test.mjs && npm test`

Expected: all focused cases and the full suite PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-visits/privacy.ts lib/ai-visits/request-policy.ts lib/ai-visits/event.ts tests/ai-visit-event.test.mjs
git commit -m "feat: create privacy-safe bot visit events"
```

---

### Task 3: Deterministic 30-Day Summary

**Files:**
- Create: `lib/ai-visits/summary.ts`
- Create: `tests/ai-visit-summary.test.mjs`

**Interfaces:**
- Produces: `summarizeAiVisits(rows: AiVisitRow[], now: Date): AiVisitSummary`.
- Produces each bot row with `count`, `previousCount`, `change`, `changePercent`, `isNew`, `lastVisitedAt`, and `topPath`.

- [ ] **Step 1: Write failing boundary and change tests**

Use fixed UTC dates with current, previous, and out-of-window rows. Assert purpose totals, bot totals, latest timestamp, stable top-path tie breaking, positive/negative changes, and `isNew` when previous is zero.

```js
const now = new Date("2026-07-26T00:00:00.000Z");
const rows = [
  row("2026-07-25T00:00:00Z", "googlebot", "search_indexing", "/menu"),
  row("2026-07-24T00:00:00Z", "googlebot", "search_indexing", "/faq"),
  row("2026-07-23T00:00:00Z", "chatgpt-user", "realtime_citation", "/menu"),
  row("2026-06-25T00:00:00Z", "googlebot", "search_indexing", "/menu"),
  row("2026-05-01T00:00:00Z", "gptbot", "training", "/"),
];
const summary = summarizeAiVisits(rows, now);
assert.equal(summary.total, 3);
assert.deepEqual(summary.byPurpose, {
  search_indexing: 2, training: 0, realtime_citation: 1, other: 0,
});
assert.equal(summary.bots[0].topPath, "/faq");
assert.equal(summary.bots.find((bot) => bot.botId === "chatgpt-user").isNew, true);
```

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/ai-visit-summary.test.mjs`

Expected: FAIL with missing summary module.

- [ ] **Step 3: Implement the pure summary function**

Use half-open UTC ranges `[now-30d, now)` and `[now-60d, now-30d)`. Sort bot rows by current count descending, then `botName` ascending. For tied paths, sort by count descending then path ascending.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/ai-visit-summary.test.mjs && npm test`

Expected: PASS with zero failures.

- [ ] **Step 5: Commit**

```bash
git add lib/ai-visits/summary.ts tests/ai-visit-summary.test.mjs
git commit -m "feat: summarize AI visits by purpose and bot"
```

---

### Task 4: Neon Schema and Repository

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json` or active lockfile produced by npm
- Create: `migrations/001_create_ai_visits.sql`
- Create: `scripts/migrate-ai-visits.mjs`
- Create: `lib/ai-visits/database.ts`
- Create: `lib/ai-visits/repository.ts`
- Create: `tests/ai-visit-repository.test.mjs`

**Interfaces:**
- Produces: `recordAiVisit(event, query?)` where tests inject a fake parameterized query executor.
- Produces: `loadAiVisitRows(now, query?)` returning only the last 60 days.
- `database.ts` throws `AI_VISITS_DATABASE_URL is not configured` without exposing credentials.

- [ ] **Step 1: Write failing repository tests**

Inject a fake executor and assert the insert SQL uses placeholders, exactly seven event values, and no IP/referrer columns. Assert the read query uses a bound 60-day cutoff.

```js
const calls = [];
await recordAiVisit(event, async (text, params) => calls.push({ text, params }));
assert.match(calls[0].text, /insert into ai_visits/i);
assert.match(calls[0].text, /\$1/);
assert.doesNotMatch(calls[0].text, /ip|referrer|cookie|session/i);
assert.equal(calls[0].params.length, 7);
```

Also read `migrations/001_create_ai_visits.sql` and assert the purpose check constraint, identity primary key, `timestamptz`, and three indexes are present while forbidden columns are absent.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/ai-visit-repository.test.mjs`

Expected: FAIL because repository and migration files are absent.

- [ ] **Step 3: Install the official Neon driver**

Run: `npm install @neondatabase/serverless@^1.0.0`

Expected: package manifest and lockfile add the dependency without audit execution errors.

- [ ] **Step 4: Implement schema and repository**

Migration must be idempotent:

```sql
create table if not exists ai_visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text not null check (char_length(path) between 1 and 2048),
  user_agent text not null check (char_length(user_agent) between 1 and 512),
  bot_id text not null,
  bot_name text not null,
  vendor text not null,
  purpose text not null check (purpose in ('search_indexing','training','realtime_citation','other'))
);
create index if not exists ai_visits_created_at_idx on ai_visits (created_at desc);
create index if not exists ai_visits_purpose_created_at_idx on ai_visits (purpose, created_at desc);
create index if not exists ai_visits_bot_created_at_idx on ai_visits (bot_id, created_at desc);
```

The migration runner reads `DATABASE_URL`, creates `neon(url)`, and executes the trusted SQL file with `sql.query(migrationText)`. It exits nonzero with a credential-free message if the variable is absent or migration fails.

- [ ] **Step 5: Run repository tests and production build**

Run: `node --test tests/ai-visit-repository.test.mjs && npm test && npm run build`

Expected: repository tests, complete suite, TypeScript, and build PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json migrations/001_create_ai_visits.sql scripts/migrate-ai-visits.mjs lib/ai-visits/database.ts lib/ai-visits/repository.ts tests/ai-visit-repository.test.mjs
git commit -m "feat: persist AI visits in Neon"
```

Use the actual generated lockfile path if the repository selects a different active lockfile; never stage unrelated lockfiles.

---

### Task 5: Password Sessions and Safe Admin URLs

**Files:**
- Create: `lib/admin/auth.ts`
- Create: `lib/admin/urls.ts`
- Create: `tests/admin-auth.test.mjs`

**Interfaces:**
- Produces: `hashAdminPassword(password, salt?)`, `verifyAdminPassword(password, encodedHash)`, `createAdminSession(secret, now?)`, `verifyAdminSession(token, secret, now?)`.
- Produces: `sanitizeAdminNext(value): "/admin/ai-visits"`.
- Produces: `canonicalizeAdminPath(pathname): string | null`.

- [ ] **Step 1: Write failing cryptographic and URL tests**

Assert correct/wrong passwords, different salts, signed session acceptance, tamper rejection, expiry rejection, and safe cookie options. Test `/admin/ai-visits%22`, decoded quote, and `/admin/ai-visit`; reject `https://evil.example`, `//evil.example`, backslashes, encoded protocol-relative forms, controls, and malformed encoding.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/admin-auth.test.mjs`

Expected: FAIL because admin modules do not exist.

- [ ] **Step 3: Implement scrypt and HMAC helpers**

Use `node:crypto` `scrypt`, `randomBytes`, `createHmac`, and `timingSafeEqual`. Encode the password hash as `scrypt$N$r$p$saltBase64url$hashBase64url`; use fixed approved cost parameters in both hash and verify. Encode the session as `payloadBase64url.signatureBase64url`, with payload `{ exp: unixSeconds }`, and compare signatures only after equal-length buffers are confirmed.

Cookie options:

```ts
export const ADMIN_COOKIE_NAME = "eomeutteull_admin";
export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/admin",
  maxAge: 60 * 60 * 8,
};
```

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/admin-auth.test.mjs && npm test && npm run build`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add lib/admin/auth.ts lib/admin/urls.ts tests/admin-auth.test.mjs
git commit -m "feat: secure admin password sessions"
```

---

### Task 6: Proxy Collection and URL Correction

**Files:**
- Create: `proxy.ts`
- Create: `tests/ai-visit-proxy.test.mjs`

**Interfaces:**
- Consumes classifier, request policy, event creator, repository, and canonical URL helper.
- Produces Next.js `proxy(request, event)` and static matcher.

- [ ] **Step 1: Write failing proxy behavior tests**

Test a pure exported helper `planProxyAction({ method, pathname, userAgent, now })` so tests do not require a server. Assert canonical redirect outranks collection, public bot requests return an event, browser/admin/static requests return no event, and event fields match the registry.

Add a source contract assertion that `proxy.ts` calls `event.waitUntil`, wraps `recordAiVisit` with `.catch`, emits `console.warn`, returns `NextResponse.next()`, and contains no `await recordAiVisit`.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/ai-visit-proxy.test.mjs`

Expected: FAIL because `proxy.ts` is absent.

- [ ] **Step 3: Implement the proxy**

```ts
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const action = planProxyAction({
    method: request.method,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get("user-agent"),
    now: new Date(),
  });
  if (action.redirectPath) {
    return NextResponse.redirect(new URL(action.redirectPath, request.url), 308);
  }
  if (action.event) {
    event.waitUntil(
      recordAiVisit(action.event).catch((error) => {
        console.warn("[ai-visits] record failed", error instanceof Error ? error.name : "UnknownError");
      }),
    );
  }
  return NextResponse.next();
}
```

Use a constant negative matcher excluding API, `_next/static`, `_next/image`, favicon, sitemap, robots, and extension assets; retain runtime policy checks as defense in depth.

- [ ] **Step 4: Run focused tests, suite, lint, and build**

Run: `node --test tests/ai-visit-proxy.test.mjs && npm test && npm run lint && npm run build`

Expected: all commands exit 0; build route output remains static for public pages and reports Proxy.

- [ ] **Step 5: Commit**

```bash
git add proxy.ts tests/ai-visit-proxy.test.mjs
git commit -m "feat: record bot visits from Next proxy"
```

---

### Task 7: Protected Admin Login and Chrome Boundary

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/site/route-chrome.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/admin.module.css`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/actions.ts`
- Create: `app/admin/logout/route.ts`
- Create: `tests/admin-pages-contract.test.mjs`

**Interfaces:**
- Login action consumes `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET`.
- Admin pages verify the same signed cookie server-side; Proxy is not the sole authorization boundary.
- `RouteChrome` omits customer header/footer/mobile actions under `/admin`.

- [ ] **Step 1: Write failing admin route contract tests**

Assert files exist; login copy is natural Korean; action uses password verification, sanitized next, and secure cookie options; logout clears the cookie; admin metadata is `noindex, nofollow`; `RouteChrome` checks `usePathname()` and root layout uses it.

- [ ] **Step 2: Run test and confirm RED**

Run: `node --test tests/admin-pages-contract.test.mjs`

Expected: FAIL because admin routes and RouteChrome are absent.

- [ ] **Step 3: Implement protected login/logout and chrome boundary**

The login action must return `비밀번호를 확인해 주세요.` for all auth/config failures without logging the password. On success set the signed cookie and `redirect(sanitizeAdminNext(formData.get("next")))`. Logout expires only `ADMIN_COOKIE_NAME` and redirects to `/admin/login`.

- [ ] **Step 4: Run focused/full tests and build**

Run: `node --test tests/admin-pages-contract.test.mjs && npm test && npm run lint && npm run build`

Expected: PASS; build includes `/admin/login` and `/admin/logout`; public routes remain available.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx components/site/route-chrome.tsx app/admin/layout.tsx app/admin/admin.module.css app/admin/login/page.tsx app/admin/login/actions.ts app/admin/logout/route.ts tests/admin-pages-contract.test.mjs
git commit -m "feat: add protected admin login"
```

---

### Task 8: Authenticated B-Layout Dashboard and Visible-Term Guard

**Files:**
- Create: `components/admin/ai-visits-dashboard.tsx`
- Create: `app/admin/ai-visits/page.tsx`
- Modify: `app/admin/admin.module.css`
- Modify: `tests/admin-pages-contract.test.mjs`
- Create: `tests/public-visible-terms.test.mjs`

**Interfaces:**
- Dashboard component consumes `AiVisitSummary` only and performs no DB/auth work.
- Page verifies session, redirects when invalid, loads rows, calls `summarizeAiVisits`, and passes the result to the component.

- [ ] **Step 1: Extend failing dashboard tests**

Assert the protected page verifies the session before querying. Assert component source includes all KPI labels, required table headers, three purpose explanations, `AI 어시스턴트별 방문`, `봇`, `방문`, `변화`, and the exact empty state. Assert mobile card and desktop table class names are present.

Create a visible-term test that builds or reads rendered public HTML, removes `script`, `style`, `head`, comments, and tags, decodes common HTML entities, then rejects the six forbidden terms only in visible customer text. Admin paths are explicitly excluded.

- [ ] **Step 2: Run focused tests and confirm RED**

Run: `node --test tests/admin-pages-contract.test.mjs tests/public-visible-terms.test.mjs`

Expected: FAIL because dashboard files and visible-output guard are absent.

- [ ] **Step 3: Implement the dashboard and responsive module CSS**

Render four KPI cards, desktop semantic table, mobile bot cards, and three purpose cards. Use `<time dateTime={...}>` for latest visits. For database failures render the approved load-error message without stack traces. Add `export const dynamic = "force-dynamic"` only to the admin dashboard page, never to public pages.

- [ ] **Step 4: Run focused/full tests, lint, and build**

Run: `node --test tests/admin-pages-contract.test.mjs tests/public-visible-terms.test.mjs && npm test && npm run lint && npm run build`

Expected: all tests PASS; build lists public routes as static and `/admin/ai-visits` as dynamic.

- [ ] **Step 5: Commit**

```bash
git add components/admin/ai-visits-dashboard.tsx app/admin/ai-visits/page.tsx app/admin/admin.module.css tests/admin-pages-contract.test.mjs tests/public-visible-terms.test.mjs
git commit -m "feat: show authenticated AI visit dashboard"
```

---

### Task 9: Neon Provisioning, Preview Verification, and Production Gate

**Files:**
- Modify: `.gitignore`
- No secrets or generated `.env*` files are committed.

**Interfaces:**
- Vercel environments provide `DATABASE_URL`, `ADMIN_PASSWORD_HASH`, and `ADMIN_SESSION_SECRET`.
- Produces a verified Preview URL and one-time temporary admin password for the user.

- [ ] **Step 1: Clean local-only visual state**

Add `/.superpowers/brainstorm/` to `.gitignore`, verify `.superpowers/` no longer appears in `git status`, then commit only `.gitignore`:

```bash
git add .gitignore
git commit -m "chore: ignore local visual companion state"
```

- [ ] **Step 2: Run final local verification before external setup**

Run: `npm test && npm run lint && npm run build`

Expected: zero test failures, lint exit 0, build exit 0, public routes static, admin dashboard dynamic, Proxy present.

- [ ] **Step 3: Connect Neon through the approved Vercel Marketplace flow**

Run the project-local CLI from the linked project:

```bash
./node_modules/.bin/vercel integration add neon
```

Complete only the already-approved Neon creation/connection scope. Do not approve paid upgrades; if Marketplace requires payment or a broader permission, stop and mark the operation HOLD for the user. After connection, run `./node_modules/.bin/vercel env ls` and verify a database connection variable exists without printing its value.

- [ ] **Step 4: Pull Preview/Development environment and migrate**

Run:

```bash
./node_modules/.bin/vercel env pull .env.local --environment=preview
npm run migrate:ai-visits
```

Expected: migration exits 0. Query `information_schema.columns`, `pg_indexes`, and the purpose constraint through a credential-safe verification script; assert required schema exists and forbidden columns do not.

- [ ] **Step 5: Generate and configure one-time admin credentials**

Generate a 24-character URL-safe password and a separate 32-byte session secret with `node:crypto`. Run the project hash helper to produce `ADMIN_PASSWORD_HASH`. Add only hash and secret to Preview and Production encrypted Vercel environments using stdin; never place the password or secret in a committed file or shell history. Keep the one-time password only for the final user report.

- [ ] **Step 6: Deploy Preview and verify HTTP behavior**

Run: `./node_modules/.bin/vercel deploy --yes`

Verify Preview:

- `/` returns 200.
- `/admin/ai-visits` redirects to canonical login.
- valid login reaches `/admin/ai-visits` with 200.
- `/admin/ai-visits%22`, `/admin/ai-visits"`, and `/admin/ai-visit` correct without 404.
- external/protocol-relative `next` values cannot redirect off-origin.

- [ ] **Step 7: Send all 15 required synthetic User-Agents to Preview**

Send requests to `/menu` using:

```text
GPTBot/1.0
OAI-SearchBot/1.0
ChatGPT-User/1.0
ClaudeBot/1.0
Claude-SearchBot/1.0
Claude-User/1.0
PerplexityBot/1.0
Perplexity-User/1.0
DuckAssistBot/1.2
Amazonbot/0.1
Amzn-SearchBot/0.1
Meta-WebIndexer/1.1
Meta-ExternalFetcher/1.1
Bytespider/1.0
cohere-ai
```

Query Neon and assert each row has exact `bot_id`, `purpose`, path `/menu`, no query string, and no forbidden columns. Verify admin KPI/table reflects the inserted rows.

- [ ] **Step 8: Browser and runtime log verification**

Open Preview `/` and authenticated `/admin/ai-visits`; check desktop and 390px layouts. Read browser console and require zero errors. Inspect recent Vercel logs and require no `EACCES`, `permission denied`, `TypeError`, or `ReferenceError`; an intentional test warning must be distinguished from an unexpected runtime failure.

- [ ] **Step 9: Present the Production approval gate**

Report the exact Preview URL, test/lint/build outputs, synthetic row count and mapping result, console result, runtime-log result, and rollback deployment reference. Ask the user for explicit Production deployment approval. Do not run `vercel deploy --prod`, modify production aliases, or push Git before that approval.

- [ ] **Step 10: After explicit approval, deploy and re-run production verification**

Run: `./node_modules/.bin/vercel deploy --prod --yes`

Then repeat homepage, admin auth, URL correction, synthetic UA, database, browser console, and runtime log checks against `https://eomeutteull.com`. Record the previous Production deployment as the rollback target. Report any failed operation as FAIL/HOLD rather than inferring success.

---

## Plan Self-Review

- Spec coverage: classification, privacy, exclusion, non-blocking recording, Neon persistence, 30-day summary, authentication, B-layout dashboard, URL correction, open redirect prevention, visible-term guard, local gates, Preview operations, synthetic UAs, console/log checks, rollback reference, and Production approval are each assigned to a task.
- Placeholder scan: every task contains concrete file paths, commands, expected evidence, and implementation details; no unresolved placeholder remains.
- Type consistency: `BotIdentity`, `AiVisitEvent`, `AiVisitRow`, `AiVisitSummary`, `recordAiVisit`, `summarizeAiVisits`, `sanitizeAdminNext`, and session helper names are consistent across producer and consumer tasks.
- Scope: no IP hash/referrer, CMS, user database, traffic deduplication, charts, retention automation, or search-performance promises are introduced.
