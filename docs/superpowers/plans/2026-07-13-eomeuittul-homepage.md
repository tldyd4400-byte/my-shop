# Eomeuittul Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the default Next.js starter page with the approved responsive public homepage for 어믜뜰 등갈비찜 청주봉명동본점 and redeploy it to Vercel.

**Architecture:** Keep the route statically generated. Store restaurant copy and links in one typed content module, isolate the interactive mobile header in a small client component, and compose semantic server-rendered homepage sections in `app/page.tsx`. Use one brand stylesheet and local raster assets so the page remains readable without JavaScript and does not depend on a database or third-party API.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 base pipeline, custom CSS, lucide-react, Node.js built-in test runner, Vercel.

## Global Constraints

- Implement only the public homepage; do not implement the admin login or dashboard.
- Keep the page statically generated with no database, authentication, payment, reservation API, or map API.
- Use the approved colors: `#9F2F1F`, `#2A2520`, `#F4E4C8`, `#FFF8EA`, `#F7EEDC`, `#D8B86A`, `#3A3028`, `#6F6258`, `#D9C3A3`, `#496B3A`.
- Body text must be at least 16px and normally 18px; primary actions must be 52–56px tall and all touch targets at least 48px.
- Treat generated food and interior images as test-only assets and replace them with real restaurant photos before commercial launch.
- Use `tel:050714490004`; use Naver search URLs until exact Place and booking URLs are supplied.
- Preserve readable content and the phone link when JavaScript is disabled.

---

## File Structure

- Create `lib/site-content.ts`: typed restaurant content, menu, FAQ, steps, contact and Naver links.
- Create `components/home/site-header.tsx`: desktop navigation and accessible mobile menu state.
- Modify `app/page.tsx`: semantic server-rendered page sections and image usage.
- Modify `app/globals.css`: brand tokens, responsive layout, focus states and mobile fixed actions.
- Modify `app/layout.tsx`: Korean metadata, `lang="ko"`, Korean-friendly font stack.
- Create `public/images/eomeuittul-ribs-spicy.png`: test-only hero/spicy menu image.
- Create `public/images/eomeuittul-ribs-soy.png`: test-only soy menu image.
- Create `public/images/eomeuittul-interior.png`: test-only warm dining-room image.
- Create `public/images/eomeuittul-group-seating.png`: test-only group seating image.
- Create `tests/homepage-contract.test.mjs`: source-level content, metadata, link, accessibility and asset contract tests.

---

### Task 1: Homepage Contract and Typed Content

**Files:**
- Create: `tests/homepage-contract.test.mjs`
- Create: `lib/site-content.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `SITE`, `NAV_ITEMS`, `DINING_STEPS`, `MENU_ITEMS`, and `FAQ_ITEMS` for `app/page.tsx` and `components/home/site-header.tsx`.
- Produces: `pnpm test` running `node --test tests/*.test.mjs`.

- [ ] **Step 1: Write the failing source contract test**

```js
// tests/homepage-contract.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage contains the approved public sections and contact links", () => {
  const page = read("app/page.tsx");
  for (const id of ["story", "guide", "menu", "space", "faq", "visit"]) {
    assert.match(page, new RegExp(`id=[{]?['\"]${id}['\"]`));
  }
  assert.match(page, /tel:050714490004/);
  assert.match(page, /네이버 예약/);
});

test("layout uses Korean metadata and document language", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /lang="ko"/);
  assert.match(layout, /어믜뜰 등갈비찜 청주봉명동본점/);
});

test("test-only visual assets exist", () => {
  for (const name of [
    "eomeuittul-ribs-spicy.png",
    "eomeuittul-ribs-soy.png",
    "eomeuittul-interior.png",
    "eomeuittul-group-seating.png",
  ]) {
    assert.equal(existsSync(new URL(`../public/images/${name}`, import.meta.url)), true, name);
  }
});
```

- [ ] **Step 2: Add the test command and verify the contract fails**

Add to `package.json` scripts:

```json
"test": "node --test tests/*.test.mjs"
```

Run: `pnpm test`

Expected: FAIL because the approved sections, metadata and image assets do not yet exist.

- [ ] **Step 3: Create the typed content module**

```ts
// lib/site-content.ts
export const SITE = {
  name: "어믜뜰",
  fullName: "어믜뜰 등갈비찜 청주봉명동본점",
  phoneDisplay: "0507-1449-0004",
  phoneHref: "tel:050714490004",
  address: "충북 청주시 흥덕구 백봉로 213-1 1층",
  naverSearch: "https://search.naver.com/search.naver?query=%EC%96%B4%EB%AF%9C%EB%9C%B0%20%EB%93%B1%EA%B0%88%EB%B9%84%EC%B0%9C%20%EC%B2%AD%EC%A3%BC%EB%B4%89%EB%AA%85%EB%8F%99%EB%B3%B8%EC%A0%90",
  naverDirections: "https://map.naver.com/p/search/%EC%B6%A9%EB%B6%81%20%EC%B2%AD%EC%A3%BC%EC%8B%9C%20%ED%9D%A5%EB%8D%95%EA%B5%AC%20%EB%B0%B1%EB%B4%89%EB%A1%9C%20213-1",
} as const;

export const NAV_ITEMS = [
  ["어믜뜰 이야기", "#story"],
  ["메뉴", "#menu"],
  ["맛있게 즐기는 법", "#guide"],
  ["오시는 길", "#visit"],
] as const;

export const DINING_STEPS = [
  { number: "01", title: "보글보글 끓인다", body: "등갈비와 매콤한 육수가 충분히 어우러질 때까지 끓입니다." },
  { number: "02", title: "취향대로 고른다", body: "30여 종 셀프바에서 채소, 버섯, 떡과 당면을 고릅니다." },
  { number: "03", title: "한 냄비에 더한다", body: "함께 고른 재료를 넣고 샤브처럼 익혀 나누어 먹습니다." },
  { number: "04", title: "빙수로 마무리한다", body: "매콤한 한 상 끝에 수제 우유빙수로 입안을 달랩니다." },
] as const;

export const MENU_ITEMS = [
  { name: "매운 등갈비찜 세트", price: "19,900원", image: "/images/eomeuittul-ribs-spicy.png", description: "매콤한 육수와 등갈비를 샤브처럼. 임궁밥과 메밀전이 함께 제공됩니다." },
  { name: "간장 등갈비찜 세트", price: "19,900원", image: "/images/eomeuittul-ribs-soy.png", description: "달콤짭짤한 간장 양념과 부드러운 등갈비. 남녀노소 편하게 즐기는 한 상입니다." },
] as const;

export const FAQ_ITEMS = [
  ["매운 음식을 못 먹어도 방문할 수 있나요?", "달콤짭짤한 간장 등갈비찜 세트를 준비하고 있습니다."],
  ["단체 예약이 가능한가요?", "52석 규모이며 네이버 예약과 전화 예약 모두 가능합니다."],
  ["주차는 어디에 하나요?", "건물 뒤편 지상주차장을 무료로 이용할 수 있습니다."],
  ["포장이나 배달이 가능한가요?", "포장은 가능하며 배달은 운영하지 않습니다."],
] as const;
```

- [ ] **Step 4: Commit the contract and content**

```powershell
git add package.json tests/homepage-contract.test.mjs lib/site-content.ts
git commit -m "test: define homepage content contract"
```

---

### Task 2: Generate Test-Only Restaurant Imagery

**Files:**
- Create: `public/images/eomeuittul-ribs-spicy.png`
- Create: `public/images/eomeuittul-ribs-soy.png`
- Create: `public/images/eomeuittul-interior.png`
- Create: `public/images/eomeuittul-group-seating.png`

**Interfaces:**
- Produces: four local raster assets referenced by `MENU_ITEMS` and `app/page.tsx`.

- [ ] **Step 1: Read and invoke the image-generation skill**

Generate a cohesive four-image set with no text, logos, people facing camera, prices or signage. Use warm natural light and realistic Korean restaurant photography. Required prompts:

```text
Hero/spicy ribs: Steaming Korean spicy braised pork ribs in a wide black pot, rich gochujang-red broth, mushrooms, green onion, rice cakes and vegetables ready to be added shabu-style, generous family meal, warm ocher and dark wood table, realistic editorial food photography, landscape 4:3, no text, no logo.

Soy ribs: Korean soy-braised pork ribs in a wide ceramic pot, glossy amber-brown sauce, shiitake mushrooms and vegetables, warm family table, realistic editorial food photography, landscape 4:3, no text, no logo.

Interior: Warm Korean family restaurant interior with ocher plaster, straw texture, dark wood tables, cream tableware, tidy and welcoming, no visible brand signage, realistic architectural photography, landscape 4:3, no text, no logo.

Group seating: Spacious warm Korean restaurant group seating area, connected dark wood tables for six-person gatherings, ocher and hanji-toned walls, tidy place settings, realistic architectural photography, landscape 4:3, no text, no logo.
```

- [ ] **Step 2: Save and inspect the generated images**

Save the chosen results to the exact paths above. Inspect each image to confirm the dish is recognizable, there is no generated text, and no real restaurant identity is implied.

- [ ] **Step 3: Run the asset portion of the contract test**

Run: `pnpm test`

Expected: the asset existence test passes while page and metadata tests still fail.

- [ ] **Step 4: Commit the visual assets**

```powershell
git add public/images
git commit -m "feat: add test restaurant imagery"
```

---

### Task 3: Accessible Header and Homepage Sections

**Files:**
- Create: `components/home/site-header.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `SITE`, `NAV_ITEMS`, `DINING_STEPS`, `MENU_ITEMS`, `FAQ_ITEMS` from `lib/site-content.ts`.
- Produces: accessible section IDs `story`, `guide`, `menu`, `space`, `faq`, `visit` and the phone/booking links required by the contract test.

- [ ] **Step 1: Confirm the page contract still fails**

Run: `pnpm test`

Expected: FAIL for missing public section IDs and phone link.

- [ ] **Step 2: Implement the client-only header interaction**

Create `components/home/site-header.tsx` with this public interface:

```tsx
"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NAV_ITEMS, SITE } from "@/lib/site-content";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="#top" aria-label={`${SITE.name} 홈`}>{SITE.name}</a>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          <a className="button button-primary button-small" href={SITE.naverSearch} target="_blank" rel="noreferrer">네이버 예약</a>
        </nav>
        <button className="mobile-menu-button" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <nav id="mobile-navigation" className="mobile-nav" aria-label="모바일 메뉴" hidden={!open}>
        {NAV_ITEMS.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Implement the semantic homepage**

Replace `app/page.tsx` with a server component that:

- imports `Image`, lucide icons, `SiteHeader`, and every exported content constant;
- renders `<main id="top">` with the exact six required section IDs;
- uses `<Image fill sizes>` within ratio-controlled wrappers for all four test images;
- maps steps, menus and FAQs from typed constants;
- renders `SITE.phoneHref`, `SITE.naverSearch`, and `SITE.naverDirections` as real anchors;
- adds `aria-label="테스트용으로 제작된 매운 등갈비찜 이미지"` or equivalent truthful Korean alt text to every generated image;
- includes a mobile `.mobile-actions` footer with 전화, 길찾기 and 예약 links.

The visible approved copy must include:

```tsx
<p className="eyebrow">청주 봉명동 · 샤브형 등갈비찜 전문점</p>
<h1>늘 자식 쪽으로 기울던 접시,<br />그날의 식탁</h1>
<p className="hero-lead">엄마의 마음으로 푸짐하게 차려내는<br />어믜뜰만의 등갈비찜 한 상</p>
```

- [ ] **Step 4: Run the contract test**

Run: `pnpm test`

Expected: homepage section and phone-link test passes; metadata test still fails until Task 4.

- [ ] **Step 5: Commit the semantic page**

```powershell
git add components/home/site-header.tsx app/page.tsx
git commit -m "feat: build restaurant homepage sections"
```

---

### Task 4: Brand Styling and Korean Metadata

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: class names emitted by `SiteHeader` and `app/page.tsx`.
- Produces: responsive 390px, 768px and 1440px layouts, visible focus states, image fallbacks and Korean SEO metadata.

- [ ] **Step 1: Implement Korean metadata without remote font dependency**

Replace Google font imports in `app/layout.tsx` and use:

```tsx
export const metadata: Metadata = {
  title: "어믜뜰 등갈비찜 청주봉명동본점",
  description: "청주 봉명동에서 샤브처럼 즐기는 매운 등갈비찜 한 상. 메뉴, 예약, 주차와 오시는 길을 확인하세요.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace starter styles with brand tokens and layout rules**

Keep the existing Tailwind imports, then define these root tokens and required responsive behavior in `app/globals.css`:

```css
:root {
  --gochujang: #9f2f1f;
  --deep: #2a2520;
  --body: #3a3028;
  --muted: #6f6258;
  --ocher: #f4e4c8;
  --rice: #fff8ea;
  --hanji: #f7eedc;
  --straw: #d8b86a;
  --green: #496b3a;
  --hairline: #d9c3a3;
}

html { scroll-behavior: smooth; }
body { margin: 0; background: var(--ocher); color: var(--body); font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", sans-serif; font-size: 18px; line-height: 1.65; }
.shell { width: min(1200px, calc(100% - 48px)); margin-inline: auto; }
.button { min-height: 52px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: 8px; padding: 0 22px; font-weight: 700; }
.button-primary { background: var(--gochujang); color: var(--rice); }
.image-frame { position: relative; overflow: hidden; border-radius: 8px; background: var(--hairline); }
.image-frame img { object-fit: cover; }
a:focus-visible, button:focus-visible { outline: 3px solid var(--straw); outline-offset: 3px; }
```

Add desktop grid rules for hero, story, menus, space and visit; tablet 2-column rules at `max-width: 1023px`; mobile single-column rules and `.mobile-actions` at `max-width: 639px`. Ensure `.mobile-actions` is fixed above the viewport bottom, each action is at least 56px high, and `body` gains enough bottom padding so no content is covered.

- [ ] **Step 3: Run all static checks**

Run: `pnpm test`

Expected: all contract tests PASS.

Run: `pnpm lint`

Expected: exit code 0 with no ESLint errors.

Run: `pnpm build`

Expected: exit code 0 and route `/` marked static.

- [ ] **Step 4: Commit the brand implementation**

```powershell
git add app/globals.css app/layout.tsx
git commit -m "feat: apply responsive restaurant brand"
```

---

### Task 5: Visual QA, GitHub and Vercel Deployment

**Files:**
- Modify only files required by concrete QA findings.

**Interfaces:**
- Consumes: completed homepage implementation.
- Produces: verified GitHub `main` and Vercel production deployment.

- [ ] **Step 1: Start the local production site**

Run: `pnpm build` then `pnpm start`.

Expected: the server starts and `/` responds with HTTP 200.

- [ ] **Step 2: Inspect the three required viewports**

Capture and inspect full-page screenshots at 390×844, 768×1024 and 1440×1000. Verify no horizontal overflow, clipped text, overlapping fixed actions, missing images, unreadable contrast or touch targets below 48px.

- [ ] **Step 3: Re-run the completion gate after any QA fixes**

Run: `pnpm test`, `pnpm lint`, and `pnpm build`.

Expected: all commands exit 0; the test runner reports zero failures; `/` remains static.

- [ ] **Step 4: Commit concrete QA fixes if needed**

```powershell
git add app components lib public tests package.json
git commit -m "fix: polish responsive homepage"
```

Skip this commit only if the worktree has no QA changes.

- [ ] **Step 5: Push the completed commits**

Run: `git push origin main`

Expected: GitHub reports `main -> main` with no rejection.

- [ ] **Step 6: Deploy and verify production**

Run: `vercel deploy --prod --yes`

Expected: deployment reaches `READY` and aliases `https://my-shop-ecru-six.vercel.app`.

Run an HTTP GET against the production alias.

Expected: status 200 and returned HTML contains `어믜뜰 등갈비찜 청주봉명동본점`.
