# Search Engine Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `https://eomeutteull.com` discoverable and verifiable in Google Search Console and Naver Search Advisor, then submit its sitemap and home URL for crawling.

**Architecture:** Next.js metadata routes generate root-level `robots.txt` and `sitemap.xml` from the existing `SITE.url` canonical source. Root metadata conditionally emits Google and Naver verification tags from build-time Vercel environment variables, so the repository contains no account-specific token values. Official webmaster tools then verify the deployed HTML and receive the same canonical sitemap URL.

**Tech Stack:** Next.js 16 App Router, TypeScript, Node test runner, Vercel CLI, Google Search Console, Naver Search Advisor

## Global Constraints

- Keep `https://eomeutteull.com` as the only canonical host.
- Use Google URL-prefix property verification and Naver HTML meta-tag verification.
- Generate `/robots.txt` and `/sitemap.xml` with Next.js metadata routes.
- Store verification values in `GOOGLE_SITE_VERIFICATION` and `NAVER_SITE_VERIFICATION` Vercel production environment variables.
- Deploy only with `npx vercel --prod --yes`.
- Do not promise indexing dates or search rankings.
- Do not transmit account passwords, OTPs, or recovery information.

---

### Task 1: Search Discovery Routes and Verification Metadata

**Files:**
- Create: `app/robots.ts`
- Create: `app/sitemap.ts`
- Create: `tests/search-discovery.test.mjs`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `SITE.url` from `lib/site-content.ts`.
- Produces: `robots(): MetadataRoute.Robots`, `sitemap(): MetadataRoute.Sitemap`, and conditional root metadata verification tags.

- [ ] **Step 1: Write the failing discovery tests**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("robots allows public crawling and advertises the canonical sitemap", () => {
  const robots = read("app/robots.ts");
  assert.match(robots, /userAgent:\s*"\*"/);
  assert.match(robots, /allow:\s*"\/"/);
  assert.match(robots, /`\$\{SITE\.url\}\/sitemap\.xml`/);
});

test("sitemap publishes the canonical homepage", () => {
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /url:\s*SITE\.url/);
  assert.match(sitemap, /lastModified:/);
});

test("root metadata supports Google and Naver verification tokens", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /NAVER_SITE_VERIFICATION/);
  assert.match(layout, /naver-site-verification/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test`

Expected: FAIL because `app/robots.ts`, `app/sitemap.ts`, and the verification metadata do not exist.

- [ ] **Step 3: Create the metadata routes**

`app/robots.ts`:

```ts
import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site-content";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
```

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site-content";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-07-14T00:00:00+09:00");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: LAST_SIGNIFICANT_UPDATE,
    },
  ];
}
```

- [ ] **Step 4: Add conditional verification metadata**

Add above `metadata` in `app/layout.tsx`:

```ts
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.NAVER_SITE_VERIFICATION;

const verification: Metadata["verification"] = {
  ...(googleVerification ? { google: googleVerification } : {}),
  ...(naverVerification
    ? { other: { "naver-site-verification": naverVerification } }
    : {}),
};
```

Add inside the existing metadata object:

```ts
verification,
```

- [ ] **Step 5: Run tests, lint, and build**

Run these commands separately:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all tests pass, ESLint exits 0, and Next.js lists static `/robots.txt` and `/sitemap.xml` routes.

- [ ] **Step 6: Commit the technical SEO foundation**

```bash
git add app/robots.ts app/sitemap.ts app/layout.tsx tests/search-discovery.test.mjs
git commit -m "feat: add search discovery and verification metadata"
```

### Task 2: Deploy and Validate Public Discovery Files

**Files:**
- No repository changes.

**Interfaces:**
- Consumes: metadata routes from Task 1.
- Produces: public 200 responses at `/robots.txt` and `/sitemap.xml`.

- [ ] **Step 1: Deploy the technical foundation**

Run: `npx vercel --prod --yes`

Expected: deployment state `READY` and alias `https://eomeutteull.com`.

- [ ] **Step 2: Validate production responses**

Run:

```powershell
curl.exe -fsS https://eomeutteull.com/robots.txt
curl.exe -fsS https://eomeutteull.com/sitemap.xml
```

Expected robots content includes:

```text
User-Agent: *
Allow: /
Sitemap: https://eomeutteull.com/sitemap.xml
```

Expected sitemap content contains `<loc>https://eomeutteull.com</loc>`.

### Task 3: Google Search Console Ownership and Submission

**Files:**
- No repository changes; set Vercel production environment only.

**Interfaces:**
- Consumes: Google HTML verification token and public metadata support from Task 1.
- Produces: verified URL-prefix property, submitted sitemap, and requested home URL indexing.

- [ ] **Step 1: Add the URL-prefix property**

Open `https://search.google.com/search-console`, sign in, and add exactly `https://eomeutteull.com` as a URL-prefix property. Select the HTML tag verification method and copy only the `content` value from the Google meta tag.

- [ ] **Step 2: Set the Google production environment value**

Run: `npx vercel env add GOOGLE_SITE_VERIFICATION production`

Input: the exact Google `content` value copied in Step 1.

- [ ] **Step 3: Redeploy and verify the public meta tag**

Run: `npx vercel --prod --yes`

Expected deployed HTML contains `name="google-site-verification"` with the exact token.

- [ ] **Step 4: Complete ownership verification**

Return to Search Console and select Verify. Expected: ownership verification succeeds for `https://eomeutteull.com`.

- [ ] **Step 5: Submit sitemap and indexing request**

Submit `sitemap.xml` in the Sitemaps report. Inspect `https://eomeutteull.com/` and request indexing once.

Expected: sitemap submission is accepted and the indexing request is acknowledged.

### Task 4: Naver Search Advisor Ownership and Submission

**Files:**
- No repository changes; set Vercel production environment only.

**Interfaces:**
- Consumes: Naver HTML verification token and public metadata support from Task 1.
- Produces: verified Naver site, submitted sitemap, and requested home URL collection.

- [ ] **Step 1: Add the site and obtain the Naver token**

Open `https://searchadvisor.naver.com/console/board`, sign in, and add exactly `https://eomeutteull.com`. Select HTML tag verification and copy only the `content` value from `naver-site-verification`.

- [ ] **Step 2: Set the Naver production environment value**

Run: `npx vercel env add NAVER_SITE_VERIFICATION production`

Input: the exact Naver `content` value copied in Step 1.

- [ ] **Step 3: Redeploy and verify the public meta tag**

Run: `npx vercel --prod --yes`

Expected deployed HTML contains `name="naver-site-verification"` with the exact token while retaining the Google tag.

- [ ] **Step 4: Complete ownership verification**

Return to Naver Search Advisor and select ownership verification. Expected: the site appears in the verified site list.

- [ ] **Step 5: Submit sitemap and collection request**

Submit `https://eomeutteull.com/sitemap.xml` under request settings, validate robots.txt, and request collection for `https://eomeutteull.com/` once.

Expected: sitemap and collection requests are accepted without domain mismatch errors.

### Task 5: Final Verification and Repository State

**Files:**
- Test: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: a verified technical and external registration checklist.

- [ ] **Step 1: Run the complete local verification suite**

Run these commands separately:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Verify public production state**

Confirm all of the following:

```text
https://eomeutteull.com/             -> HTTP 200
https://eomeutteull.com/robots.txt   -> HTTP 200, allows /
https://eomeutteull.com/sitemap.xml  -> HTTP 200, canonical URL present
Google verification meta tag         -> present
Naver verification meta tag          -> present
Google sitemap status                 -> accepted or processing
Naver sitemap status                  -> accepted or processing
```

- [ ] **Step 3: Report realistic expectations**

Report that crawler discovery and request submission are complete, while search appearance and ranking remain controlled by each search engine and may take days or weeks.
