# Eomeuittul Real Photos and Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace temporary homepage imagery with owner-provided restaurant photos, add an attributed Naver visitor-review section, and strengthen local SEO/AEO/GEO signals without unofficial live scraping.

**Architecture:** Keep the public page statically generated. Store approved restaurant, image, review, and structured-data content in `lib/site-content.ts`; render it semantically in `app/page.tsx`; and preserve all visual behavior in `app/globals.css`. Reviews are curated excerpts from the user-provided HAR, anonymized, and linked to the official Naver Place entry rather than refreshed through an undocumented API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Next Image, custom CSS/Tailwind pipeline, lucide-react, Node.js built-in test runner.

## Global Constraints

- Follow the approved Pencil screens in `C:\vibecoding\my-shop\초안` before changing implementation.
- Body text must remain at least 16px; review copy is 17-18px.
- Use only owner-provided photos for hero, menu, story, space, and exterior imagery.
- Do not expose reviewer names, profile images, user IDs, HAR headers, cookies, or private request data.
- Do not implement unofficial live Naver scraping; link review excerpts to `https://map.naver.com/p/entry/place/2021816208`.
- Keep the homepage statically generated and readable without client-side JavaScript.
- Add Restaurant, FAQPage, and WebSite JSON-LD based only on verified store information.
- Do not claim a working shared admin CMS until authentication and a persistent Vercel-compatible datastore are configured.

---

### Task 1: Real-Asset and Review Contract

**Files:**
- Modify: `tests/homepage-contract.test.mjs`
- Test: `tests/homepage-contract.test.mjs`

**Interfaces:**
- Produces a source-level contract for the `reviews` section, owned image filenames, Naver Place attribution, and JSON-LD types.

- [ ] **Step 1: Add failing assertions**

Add tests requiring `id="reviews"`, `VISITOR_REVIEWS`, the Naver Place ID `2021816208`, the eight approved `.jpg` assets, removal of all `테스트용` labels, and JSON-LD identifiers `Restaurant`, `FAQPage`, and `WebSite`.

- [ ] **Step 2: Verify RED**

Run: `npm.cmd test`

Expected: FAIL because the review section, owned public assets, and structured data do not exist yet.

---

### Task 2: Publish Owned Photos and Curated Review Data

**Files:**
- Create: `public/images/eomeuittul/hero-table.jpg`
- Create: `public/images/eomeuittul/spicy-ribs.jpg`
- Create: `public/images/eomeuittul/soy-ribs.jpg`
- Create: `public/images/eomeuittul/buckwheat-pancake.jpg`
- Create: `public/images/eomeuittul/imgung-rice.jpg`
- Create: `public/images/eomeuittul/interior.jpg`
- Create: `public/images/eomeuittul/facade.jpg`
- Create: `public/images/eomeuittul/identity-wall.jpg`
- Modify: `lib/site-content.ts`

**Interfaces:**
- Produces `SITE.placeUrl`, `SITE.image`, revised `MENU_ITEMS`, and `VISITOR_REVIEWS` entries with `quote`, `rating`, and `sourceLabel`.

- [ ] **Step 1: Copy the approved Pencil assets into the public image directory**

Copy the exact eight files from `초안-assets` without modifying the source originals.

- [ ] **Step 2: Add minimal typed content**

Add three anonymized excerpts covering the approved themes: unusual shabu-style ribs, tenderness suitable for parents/older guests, and the self-bar/buckwheat-pancake experience. Point every review to `SITE.placeUrl`.

- [ ] **Step 3: Run the contract**

Run: `npm.cmd test`

Expected: asset checks pass; page and JSON-LD checks remain red.

---

### Task 3: Homepage Photo and Review Implementation

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes `VISITOR_REVIEWS` and owned image paths from `lib/site-content.ts`.
- Produces semantic section `#reviews`, three responsive review cards, real-photo hero/story/menu/space imagery, and Naver attribution links.

- [ ] **Step 1: Replace every temporary image and label**

Use `spicy-ribs.jpg` for the hero, `hero-table.jpg` for the story, the spicy/soy files for menu cards, and `interior.jpg` for the space section. Remove `테스트용` badges and captions.

- [ ] **Step 2: Render the approved review section**

Place `#reviews` between `#space` and `#faq`. Include the approved keyword proof line and map three review cards from `VISITOR_REVIEWS`. Keep excerpts in blockquotes and mark attribution links as external.

- [ ] **Step 3: Match the Pencil responsive layout**

Use a three-column desktop review grid and one-column mobile stack. Ensure all text remains at least 16px, cards use at most 6px corner radius, and no nested card composition is introduced.

- [ ] **Step 4: Verify GREEN for homepage behavior**

Run: `npm.cmd test`

Expected: photo and review assertions pass; only structured-data assertions may remain red.

---

### Task 4: Local SEO, AEO, and GEO Structured Data

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `lib/site-content.ts`

**Interfaces:**
- Produces static JSON-LD graphs for `Restaurant`, `FAQPage`, and `WebSite`, canonical/Open Graph metadata, and location-specific title/description.

- [ ] **Step 1: Add metadata assertions if not already covered**

Require canonical metadata, Open Graph image usage, and verified Korean store naming in the contract.

- [ ] **Step 2: Verify RED**

Run: `npm.cmd test`

Expected: FAIL for missing canonical/Open Graph or JSON-LD values.

- [ ] **Step 3: Add static structured data**

Render escaped JSON-LD from trusted constants only. Use the verified name, address, phone, opening hours, menu descriptions, FAQ answers, owner image, and Naver Place URL. Do not add unverified latitude/longitude, aggregate rating, or price range.

- [ ] **Step 4: Verify GREEN**

Run: `npm.cmd test`

Expected: all contract tests PASS.

---

### Task 5: Completion Gate and Visual QA

**Files:**
- Modify only files required by concrete QA findings.

**Interfaces:**
- Produces a verified local homepage ready for the next production deployment step.

- [ ] **Step 1: Run static checks**

Run: `npm.cmd test`, `npm.cmd run lint`, and `npm.cmd run build`.

Expected: all commands exit 0 and `/` is statically generated.

- [ ] **Step 2: Inspect desktop and mobile screenshots**

Verify 1440px and 390px views for nonblank real images, readable review cards, no horizontal overflow, no overlap with fixed mobile actions, and no remaining temporary-image wording.

- [ ] **Step 3: Re-run checks after any QA fix**

Run the full test, lint, and build commands again. Confirm the development server still returns HTTP 200 on `http://localhost:3000`.

- [ ] **Step 4: Compare implementation with Pencil**

Confirm section order, selected imagery, review themes, typography minimums, and admin capability wording match the latest approved Pencil draft.
