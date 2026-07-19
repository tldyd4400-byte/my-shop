# Eomeutteull Search Growth Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 Pencil 화면을 기준으로 어믜뜰 홈페이지를 검색 유입, 신뢰 형성, 네이버 예약 클릭을 연결하는 다중 페이지 Next.js 사이트로 개편한다.

**Architecture:** Next.js 16 App Router의 정적 페이지 구조를 유지하고, 매장·메뉴·FAQ·후기·이야기 데이터를 `lib/content`에 집중시킨다. 페이지 본문, 메타데이터, JSON-LD가 같은 데이터를 읽게 하며, 공통 레이아웃·CTA·미디어·분석 링크는 재사용 컴포넌트로 분리한다.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind CSS 4 PostCSS 기반 전역 CSS, `next/image`, Node `node:test`, GA4 선택적 로딩, Vercel

## Global Constraints

- 구현 방향이 바뀌면 코드보다 `C:\vibecoding\my-shop\초안` Pencil 문서를 먼저 수정하고 승인받는다.
- 승인 화면: 홈 `nbWb8`/`P5HwS`, 메뉴 `L9nOd`/`TRPxk`, 오시는 길 `aBnhc`/`st3gr`, FAQ `nX5Og`/`gF926`, 매장 `fnMKB`/`SIy3J`, 후기 `gM0n1`/`d5ez9`, 이야기 `ADXdd`/`t8p2s`, 상세 `snNJo`/`Hluol`.
- 색상은 Clay `#9B6B43`, Green `#355843`, Hanji `#FFFDF8`, Ink `#2B2118`, Line `#D8CBB8`, Muted `#6E6258`, Paper `#F7F1E6`, Red `#A52A24`, Red Dark `#7F1D1D`, Straw `#C9A96E`, White `#FFFFFF`을 사용한다.
- 데스크톱 1440px, 모바일 390px을 기준으로 하고 주요 CTA 높이는 54~58px, 모든 터치 대상은 최소 48px이다.
- CMS, 관리자 화면, 데이터베이스, 자체 예약·결제 API를 추가하지 않는다.
- 확인되지 않은 예약 혜택, 평점, 후기 수를 표시하거나 `AggregateRating`으로 만들지 않는다.
- 화면과 JSON-LD는 같은 중앙 데이터를 사용한다.
- 85.7MB 원본 영상은 배포하지 않는다. 720p 웹 영상은 최대 12MB를 목표로 한다.
- GA4가 설정되지 않아도 모든 링크와 페이지는 정상 동작해야 한다.
- 네이버 예약 완료 데이터가 없으므로 외부 링크 클릭을 예약 완료로 계산하지 않는다.
- 모든 작업 단위는 `pnpm test`, 관련 계약 테스트, `pnpm lint`, `pnpm build` 중 해당하는 검사를 통과해야 한다.

---

## File Structure

### Create

- `lib/content/types.ts`: 매장, 메뉴, FAQ, 후기, 이야기 타입
- `lib/content/store.ts`: 상호, 주소, 전화, 영업시간, 링크, 메뉴, FAQ, 후기
- `lib/content/stories.ts`: 이야기 목록과 상세 본문 데이터
- `lib/seo/metadata.ts`: 페이지 메타데이터 생성
- `lib/seo/schema.ts`: Restaurant, BreadcrumbList, FAQPage, Article JSON-LD 생성
- `components/seo/json-ld.tsx`: 안전한 JSON-LD 출력
- `components/site/analytics-link.tsx`: GA4 이벤트를 선택적으로 기록하는 링크
- `components/site/site-header.tsx`: 전체 페이지 공통 내비게이션
- `components/site/site-footer.tsx`: 전체 페이지 공통 푸터
- `components/site/mobile-action-bar.tsx`: 모바일 전화·길찾기·예약 행동
- `components/site/hero-media.tsx`: 이미지·영상 히어로와 poster 대체
- `components/site/proof-strip.tsx`: 핵심 근거 띠
- `components/site/reservation-cta.tsx`: 네이버 예약 CTA
- `components/site/location-panel.tsx`: 정적 지도·주소·시간·주차
- `components/site/faq-list.tsx`: 질문과 직접 답변
- `components/site/experience-steps.tsx`: 실제 사진·영상 네 단계
- `components/site/story-card.tsx`: 이야기 목록 카드
- `components/site/menu-view-tracker.tsx`: 메뉴 페이지 세션당 1회 조회 이벤트
- `components/site/story-read-tracker.tsx`: 이야기 상세 50% 스크롤 또는 30초 읽기 이벤트
- `app/menu/page.tsx`
- `app/store/page.tsx`
- `app/location/page.tsx`
- `app/faq/page.tsx`
- `app/reviews/page.tsx`
- `app/stories/page.tsx`
- `app/stories/[slug]/page.tsx`
- `tests/content-model.test.mjs`
- `tests/routes-contract.test.mjs`
- `tests/seo-schema.test.mjs`
- `tests/media-contract.test.mjs`
- `tests/analytics-contract.test.mjs`
- `public/images/eomeuittul/step-1-ribs.png`
- `public/images/eomeuittul/step-2-selfbar.jpg`
- `public/images/eomeuittul/step-4-bingsu.png`
- `public/images/eomeuittul/naver-map-location.png`
- `public/media/eomeuittul/hero-brand-720p.mp4`
- `public/media/eomeuittul/step-3-shabu-720p.mp4`

### Modify

- `app/layout.tsx`: 공통 레이아웃, 기본 메타데이터, 선택적 GA4
- `app/page.tsx`: 승인된 홈 V2 조합
- `app/globals.css`: 디자인 토큰, 반응형, 모든 공통·페이지 스타일
- `app/sitemap.ts`: 모든 정적·이야기 URL
- `app/robots.ts`: 공개 수집과 canonical sitemap
- `next.config.ts`: 보안·미디어 응답 헤더
- `package.json`: 기존 테스트 명령 유지
- `tests/homepage-contract.test.mjs`: 신규 홈 계약으로 갱신
- `tests/search-discovery.test.mjs`: 전체 sitemap·robots 계약으로 갱신

### Delete after migration

- `components/home/site-header.tsx`: 새 공통 헤더로 교체 후 삭제
- `lib/site-content.ts`: 모든 소비자가 `lib/content`로 이동한 뒤 삭제

---

### Task 1: Central Content Model

**Files:**
- Create: `lib/content/types.ts`
- Create: `lib/content/store.ts`
- Create: `lib/content/stories.ts`
- Create: `tests/content-model.test.mjs`

**Interfaces:**
- Produces: `STORE`, `MENU_ITEMS`, `FAQ_ITEMS`, `REVIEW_ITEMS`, `DINING_STEPS`, `STORIES`, `getStory(slug)`
- Produces types: `StoreInfo`, `MenuItem`, `FaqItem`, `ReviewItem`, `DiningStep`, `Story`

- [ ] **Step 1: Write the failing content contract test**

```js
// tests/content-model.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("central content contains approved store facts", () => {
  const source = read("lib/content/store.ts");
  assert.match(source, /어믜뜰 등갈비찜 청주봉명동본점/);
  assert.match(source, /백봉로 213-1 1층/);
  assert.match(source, /0507-1449-0004/);
  assert.match(source, /11:00/);
  assert.match(source, /22:00/);
  assert.match(source, /15:30/);
  assert.match(source, /16:30/);
  assert.match(source, /월요일/);
});

test("central content avoids volatile hard-coded claims", () => {
  const source = read("lib/content/store.ts");
  assert.doesNotMatch(source, /AggregateRating/);
  assert.doesNotMatch(source, /낙지파전 또는/);
  assert.match(source, /최신 혜택/);
});

test("content contains eight FAQs and four initial stories", () => {
  const store = read("lib/content/store.ts");
  const stories = read("lib/content/stories.ts");
  assert.equal((store.match(/question:/g) ?? []).length, 8);
  assert.equal((stories.match(/slug:/g) ?? []).length, 4);
});
```

- [ ] **Step 2: Run the test and confirm the files are missing**

Run: `node --test tests/content-model.test.mjs`

Expected: FAIL with `ENOENT` for `lib/content/store.ts`.

- [ ] **Step 3: Add the shared types**

```ts
// lib/content/types.ts
export type OpeningPeriod = {
  label: string;
  days: readonly string[];
  opens: string;
  closes: string;
};

export type StoreInfo = {
  name: string;
  fullName: string;
  url: string;
  phoneDisplay: string;
  phoneHref: string;
  address: string;
  parking: string;
  seats: string;
  placeUrl: string;
  bookingUrl: string;
  directionsUrl: string;
  image: string;
  openingPeriods: readonly OpeningPeriod[];
};

export type MenuItem = {
  slug: "spicy" | "soy";
  name: string;
  price: string;
  description: string;
  includes: string;
  image: string;
  imageAlt: string;
};

export type FaqItem = { question: string; answer: string };
export type ReviewItem = {
  title: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  checkedAt: string;
};
export type DiningStep = {
  number: string;
  title: string;
  body: string;
  media: string;
  mediaType: "image" | "video";
  alt: string;
};
export type StorySection = {
  heading: string;
  body: string;
  image?: string;
  imageAlt?: string;
};
export type Story = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  modifiedAt: string;
  image: string;
  imageAlt: string;
  sections: readonly StorySection[];
};
```

- [ ] **Step 4: Add the approved store, menu, FAQ, review, and step data**

```ts
// lib/content/store.ts
import type {
  DiningStep,
  FaqItem,
  MenuItem,
  ReviewItem,
  StoreInfo,
} from "./types";

export const STORE: StoreInfo = {
  name: "어믜뜰",
  fullName: "어믜뜰 등갈비찜 청주봉명동본점",
  url: "https://eomeutteull.com",
  phoneDisplay: "0507-1449-0004",
  phoneHref: "tel:050714490004",
  address: "충북 청주시 흥덕구 백봉로 213-1 1층",
  parking: "건물 뒤 무료 지상주차장 · 점심시간 및 17시 이후 도로 주차 가능",
  seats: "12테이블 · 52석 · 6인 단체석 2테이블",
  placeUrl: "https://map.naver.com/p/entry/place/2021816208",
  bookingUrl:
    "https://search.naver.com/search.naver?query=%EC%96%B4%EB%AF%9C%EB%9C%B0%20%EB%93%B1%EA%B0%88%EB%B9%84%EC%B0%9C%20%EC%B2%AD%EC%A3%BC%EB%B4%89%EB%AA%85%EB%8F%99%EB%B3%B8%EC%A0%90",
  directionsUrl:
    "https://map.naver.com/p/search/%EC%B6%A9%EB%B6%81%20%EC%B2%AD%EC%A3%BC%EC%8B%9C%20%ED%9D%A5%EB%8D%95%EA%B5%AC%20%EB%B0%B1%EB%B4%89%EB%A1%9C%20213-1",
  image: "/images/eomeuittul/hero-table.jpg",
  openingPeriods: [
    { label: "화~금 점심", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "15:30" },
    { label: "화~금 저녁", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "16:30", closes: "22:00" },
    { label: "토~일", days: ["Saturday", "Sunday"], opens: "11:00", closes: "22:00" },
  ],
};

export const MENU_ITEMS: readonly MenuItem[] = [
  { slug: "spicy", name: "매운 등갈비찜 세트", price: "19,900원", description: "매콤한 육수에 재료를 더해 샤브처럼 끓여 먹는 대표 메뉴", includes: "임궁밥 · 메밀전 포함", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "붉은 육수와 채소를 함께 담은 어믜뜰 매운 등갈비찜" },
  { slug: "soy", name: "간장 등갈비찜 세트", price: "19,900원", description: "달콤짭짤한 간장 양념으로 남녀노소 편안하게 즐기는 메뉴", includes: "임궁밥 · 메밀전 포함", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "채소와 함께 담은 어믜뜰 간장 등갈비찜" },
];

export const FAQ_ITEMS: readonly FaqItem[] = [
  { question: "월요일에도 영업하나요?", answer: "매주 월요일은 정기휴무입니다." },
  { question: "브레이크 타임이 있나요?", answer: "평일 15:30~16:30이며 주말·공휴일은 제외됩니다." },
  { question: "주차할 수 있나요?", answer: "건물 뒤 무료 지상주차장을 이용할 수 있습니다." },
  { question: "포장이나 배달이 되나요?", answer: "포장은 가능하며 배달은 운영하지 않습니다." },
  { question: "매운맛이 걱정돼요.", answer: "매운 등갈비찜과 간장 등갈비찜 중 선택할 수 있습니다." },
  { question: "네이버 예약 혜택이 있나요?", answer: "네이버 예약 페이지에서 현재 제공되는 최신 혜택을 확인해 주세요." },
  { question: "아이와 함께 갈 수 있나요?", answer: "유아의자를 이용할 수 있습니다." },
  { question: "단체 이용이 가능한가요?", answer: "단체 이용이 가능하며 방문 전 전화 문의를 권장합니다." },
];

export const REVIEW_ITEMS: readonly ReviewItem[] = [
  { title: "색다른 한 상", summary: "등갈비찜과 샤브샤브를 함께 즐기는 이색적인 조합이라는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
  { title: "부드러운 등갈비", summary: "등갈비가 부드러워 가족과 함께 먹기 좋았다는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
  { title: "골라 먹는 재미", summary: "채소를 자유롭게 더하고 메밀전과 함께 먹는 방식이 재미있다는 반응이 있습니다.", sourceLabel: "네이버 방문자 리뷰 일부 요약", sourceUrl: STORE.placeUrl, checkedAt: "2026-07-19" },
];

export const DINING_STEPS: readonly DiningStep[] = [
  { number: "01", title: "등갈비찜 선택", body: "매운맛과 간장맛 중 취향에 맞게 고릅니다.", media: "/images/eomeuittul/step-1-ribs.png", mediaType: "image", alt: "채소와 함께 차려진 어믜뜰 등갈비찜" },
  { number: "02", title: "재료 담기", body: "셀프바에서 채소, 버섯, 떡과 당면을 담습니다.", media: "/images/eomeuittul/step-2-selfbar.jpg", mediaType: "image", alt: "채소와 버섯, 떡과 당면이 준비된 어믜뜰 셀프바" },
  { number: "03", title: "샤브처럼 끓이기", body: "고른 재료를 등갈비찜과 함께 끓여 나누어 먹습니다.", media: "/media/eomeuittul/step-3-shabu-720p.mp4", mediaType: "video", alt: "등갈비찜에 셀프바 재료를 넣어 끓이는 모습" },
  { number: "04", title: "빙수로 마무리", body: "매콤한 한 상 뒤 수제우유빙수로 마무리합니다.", media: "/images/eomeuittul/step-4-bingsu.png", mediaType: "image", alt: "어믜뜰 수제우유빙수" },
];
```

- [ ] **Step 5: Add the four story records and lookup**

```ts
// lib/content/stories.ts
import type { Story } from "./types";

export const STORIES: readonly Story[] = [
  { slug: "how-to-enjoy-ribs", title: "처음 보는 등갈비찜, 이렇게 즐겨요", description: "등갈비 선택부터 수제우유빙수까지 네 단계를 소개합니다.", category: "메뉴 이야기", readingTime: "5분", publishedAt: "2026-07-19", modifiedAt: "2026-07-19", image: "/images/eomeuittul/step-1-ribs.png", imageAlt: "채소와 함께 차려진 어믜뜰 등갈비찜", sections: [
    { heading: "등갈비찜에서 시작해 한 상의 경험으로", body: "어믜뜰의 식사는 원하는 재료를 고르고 함께 끓이며 각자의 취향으로 한 상을 완성합니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어믜뜰 매운 등갈비찜" },
    { heading: "네 단계로 즐기기", body: "매운맛 또는 간장맛을 고르고 셀프바 재료를 담아 샤브처럼 끓인 뒤 수제우유빙수로 마무리합니다." },
  ] },
  { slug: "family-dining-guide", title: "청주 봉명동 가족 외식 가이드", description: "좌석, 주차, 아이 동반과 예약 정보를 가족 외식 관점에서 정리합니다.", category: "방문 가이드", readingTime: "4분", publishedAt: "2026-07-19", modifiedAt: "2026-07-19", image: "/images/eomeuittul/facade.jpg", imageAlt: "어믜뜰 청주봉명동본점 외관", sections: [
    { heading: "가족과 편안하게 머무는 자리", body: "12테이블과 52석, 유아의자와 단체석을 갖추고 있습니다.", image: "/images/eomeuittul/interior.jpg", imageAlt: "어믜뜰 실제 매장 내부" },
    { heading: "방문 전에 확인할 정보", body: "건물 뒤 무료 지상주차장을 이용할 수 있으며 월요일은 정기휴무입니다." },
  ] },
  { slug: "self-bar-guide", title: "30여 종 셀프바를 즐기는 법", description: "채소와 버섯, 떡과 당면으로 나만의 한 상을 만드는 법을 소개합니다.", category: "식사 방법", readingTime: "4분", publishedAt: "2026-07-19", modifiedAt: "2026-07-19", image: "/images/eomeuittul/step-2-selfbar.jpg", imageAlt: "어믜뜰 셀프바", sections: [
    { heading: "취향대로 담는 재료", body: "원하는 채소와 버섯, 떡과 당면을 담아 등갈비찜과 함께 끓입니다.", image: "/images/eomeuittul/step-2-selfbar.jpg", imageAlt: "채소와 버섯이 준비된 셀프바" },
    { heading: "구성은 달라질 수 있어요", body: "셀프바 재료는 매장 상황에 따라 일부 달라질 수 있습니다." },
  ] },
  { slug: "spicy-or-soy", title: "매운맛과 간장맛, 무엇을 고를까", description: "첫 방문자가 취향에 맞는 등갈비찜을 고를 수 있도록 비교합니다.", category: "메뉴 선택", readingTime: "3분", publishedAt: "2026-07-19", modifiedAt: "2026-07-19", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어믜뜰 간장 등갈비찜", sections: [
    { heading: "매콤한 한 상", body: "칼칼한 육수와 채소를 함께 즐기고 싶다면 매운 등갈비찜을 고릅니다.", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어믜뜰 매운 등갈비찜" },
    { heading: "편안한 간장 한 상", body: "달콤짭짤한 맛을 선호하거나 아이와 함께라면 간장 등갈비찜을 선택할 수 있습니다.", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어믜뜰 간장 등갈비찜" },
  ] },
];

export function getStory(slug: string): Story | undefined {
  return STORIES.find((story) => story.slug === slug);
}
```

- [ ] **Step 6: Run the content tests**

Run: `node --test tests/content-model.test.mjs`

Expected: 3 tests PASS.

- [ ] **Step 7: Commit the content model**

```bash
git add lib/content tests/content-model.test.mjs
git commit -m "feat: add restaurant content model"
```

---

### Task 2: Metadata and Structured Data Helpers

**Files:**
- Create: `lib/seo/metadata.ts`
- Create: `lib/seo/schema.ts`
- Create: `components/seo/json-ld.tsx`
- Create: `tests/seo-schema.test.mjs`

**Interfaces:**
- Consumes: `STORE`, `FAQ_ITEMS`, `Story`
- Produces: `createPageMetadata`, `websiteSchema`, `restaurantSchema`, `breadcrumbSchema`, `faqSchema`, `articleSchema`, `JsonLd`

- [ ] **Step 1: Write the failing SEO helper contract**

```js
// tests/seo-schema.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("SEO helpers provide canonical metadata and approved schemas", () => {
  const metadata = read("lib/seo/metadata.ts");
  const schema = read("lib/seo/schema.ts");
  assert.match(metadata, /metadataBase/);
  assert.match(metadata, /alternates/);
  assert.match(metadata, /openGraph/);
  for (const type of ["WebSite", "Restaurant", "BreadcrumbList", "FAQPage", "Article"]) {
    assert.match(schema, new RegExp(type));
  }
  assert.doesNotMatch(schema, /AggregateRating/);
});
```

- [ ] **Step 2: Run it and confirm failure**

Run: `node --test tests/seo-schema.test.mjs`

Expected: FAIL with `ENOENT` for `lib/seo/metadata.ts`.

- [ ] **Step 3: Implement the metadata factory**

```ts
// lib/seo/metadata.ts
import type { Metadata } from "next";
import { STORE } from "@/lib/content/store";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

export function createPageMetadata(input: MetadataInput): Metadata {
  const image = input.image ?? STORE.image;
  return {
    metadataBase: new URL(STORE.url),
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: input.type ?? "website",
      locale: "ko_KR",
      url: input.path,
      siteName: STORE.name,
      title: input.title,
      description: input.description,
      images: [{ url: image, alt: input.title }],
    },
  };
}
```

- [ ] **Step 4: Implement schema factories and safe output**

```ts
// lib/seo/schema.ts
import { FAQ_ITEMS, MENU_ITEMS, STORE } from "@/lib/content/store";
import type { Story } from "@/lib/content/types";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${STORE.url}/#website`,
    name: STORE.name,
    url: STORE.url,
    inLanguage: "ko-KR",
    publisher: { "@id": `${STORE.url}/#restaurant` },
  };
}

export function restaurantSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${STORE.url}/#restaurant`,
    name: STORE.fullName,
    alternateName: STORE.name,
    url: STORE.url,
    telephone: STORE.phoneDisplay,
    image: [`${STORE.url}${STORE.image}`],
    sameAs: [STORE.placeUrl],
    servesCuisine: ["한식", "등갈비찜"],
    acceptsReservations: true,
    address: { "@type": "PostalAddress", streetAddress: "백봉로 213-1 1층", addressLocality: "청주시", addressRegion: "충청북도", addressCountry: "KR" },
    openingHoursSpecification: STORE.openingPeriods.map((period) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: period.days, opens: period.opens, closes: period.closes })),
    menu: `${STORE.url}/menu`,
    hasMenu: { "@type": "Menu", hasMenuSection: { "@type": "MenuSection", name: "대표 메뉴", hasMenuItem: MENU_ITEMS.map((item) => ({ "@type": "MenuItem", name: item.name, description: item.description, offers: { "@type": "Offer", price: item.price.replace(/[^0-9]/g, ""), priceCurrency: "KRW" } })) } },
  };
}

export function breadcrumbSchema(items: readonly { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: `${STORE.url}${item.path}` })) };
}

export function faqSchema() {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ_ITEMS.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
}

export function articleSchema(story: Story) {
  return { "@context": "https://schema.org", "@type": "Article", headline: story.title, description: story.description, image: `${STORE.url}${story.image}`, datePublished: story.publishedAt, dateModified: story.modifiedAt, author: { "@type": "Organization", name: STORE.name }, publisher: { "@id": `${STORE.url}/#restaurant` }, mainEntityOfPage: `${STORE.url}/stories/${story.slug}` };
}
```

```tsx
// components/seo/json-ld.tsx
export function JsonLd({ data }: { data: Record<string, unknown> | readonly Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
```

- [ ] **Step 5: Run the SEO helper tests**

Run: `node --test tests/seo-schema.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit SEO helpers**

```bash
git add lib/seo components/seo tests/seo-schema.test.mjs
git commit -m "feat: add shared SEO schema helpers"
```

---

### Task 3: Shared Navigation, Footer, and Analytics Links

**Files:**
- Create: `components/site/analytics-link.tsx`
- Create: `components/site/site-header.tsx`
- Create: `components/site/site-footer.tsx`
- Create: `components/site/mobile-action-bar.tsx`
- Create: `tests/analytics-contract.test.mjs`

**Interfaces:**
- Consumes: `STORE`
- Produces: `AnalyticsLink`, `SiteHeader`, `SiteFooter`, `MobileActionBar`

- [ ] **Step 1: Write failing navigation and analytics contracts**

```js
// tests/analytics-contract.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared navigation exposes every public route", () => {
  const header = read("components/site/site-header.tsx");
  for (const path of ["/menu", "/store", "/location", "/faq", "/reviews", "/stories"]) assert.match(header, new RegExp(path));
});

test("analytics link records approved events without blocking navigation", () => {
  const link = read("components/site/analytics-link.tsx");
  assert.match(link, /window\.gtag\?\./);
  assert.match(link, /event_name/);
  assert.doesNotMatch(link, /preventDefault/);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `node --test tests/analytics-contract.test.mjs`

Expected: FAIL with missing component files.

- [ ] **Step 3: Implement the non-blocking analytics link**

```tsx
// components/site/analytics-link.tsx
"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: "naver_reservation_click" | "naver_map_click" | "phone_click";
  placement: string;
};

export function AnalyticsLink({ eventName, placement, onClick, ...props }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    window.gtag?.("event", eventName, { event_name: eventName, placement, page_path: window.location.pathname });
    onClick?.(event);
  }
  return <a {...props} onClick={handleClick} />;
}
```

- [ ] **Step 4: Implement shared site chrome**

```tsx
// components/site/site-header.tsx
"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";

const links = [["메뉴", "/menu"], ["매장", "/store"], ["오시는 길", "/location"], ["FAQ", "/faq"], ["후기", "/reviews"], ["이야기", "/stories"]] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return <header className="site-header"><div className="shell header-inner"><Link className="brand" href="/">{STORE.name}</Link><nav className="desktop-nav" aria-label="주요 메뉴">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<AnalyticsLink className="button button-primary button-small" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="header">네이버 예약</AnalyticsLink></nav><button className="mobile-menu-button" type="button" aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "메뉴 닫기" : "메뉴 열기"} onClick={() => setOpen((value) => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></div><nav id="mobile-navigation" className="mobile-nav" hidden={!open}>{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav></header>;
}
```

```tsx
// components/site/site-footer.tsx
import { STORE } from "@/lib/content/store";
export function SiteFooter() { return <footer className="site-footer"><div className="shell footer-inner"><div><strong>{STORE.name}</strong><p>{STORE.fullName}</p></div><p>{STORE.address} · {STORE.phoneDisplay}</p></div></footer>; }
```

```tsx
// components/site/mobile-action-bar.tsx
import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";
export function MobileActionBar() { return <nav className="mobile-actions" aria-label="빠른 작업"><AnalyticsLink href={STORE.phoneHref} eventName="phone_click" placement="mobile_bar">전화</AnalyticsLink><AnalyticsLink href={STORE.directionsUrl} target="_blank" rel="noreferrer" eventName="naver_map_click" placement="mobile_bar">길찾기</AnalyticsLink><AnalyticsLink className="mobile-action-primary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="mobile_bar">예약</AnalyticsLink></nav>; }
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/analytics-contract.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit shared chrome**

```bash
git add components/site tests/analytics-contract.test.mjs
git commit -m "feat: add shared navigation and action tracking"
```

---

### Task 4: Production Media and Shared Visual Components

**Files:**
- Create media files listed in File Structure
- Create: `components/site/hero-media.tsx`
- Create: `components/site/experience-steps.tsx`
- Create: `components/site/proof-strip.tsx`
- Create: `components/site/reservation-cta.tsx`
- Create: `components/site/location-panel.tsx`
- Create: `components/site/faq-list.tsx`
- Create: `components/site/story-card.tsx`
- Create: `tests/media-contract.test.mjs`

**Interfaces:**
- Consumes: `DINING_STEPS`, `FAQ_ITEMS`, `STORE`, `Story`
- Produces all shared content sections used by route tasks

- [ ] **Step 1: Write failing media contracts**

```js
// tests/media-contract.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const asset = (path) => new URL(`../public/${path}`, import.meta.url);

test("approved step and map assets exist", () => {
  for (const path of ["images/eomeuittul/step-1-ribs.png", "images/eomeuittul/step-2-selfbar.jpg", "images/eomeuittul/step-4-bingsu.png", "images/eomeuittul/naver-map-location.png", "media/eomeuittul/hero-brand-720p.mp4", "media/eomeuittul/step-3-shabu-720p.mp4"]) assert.equal(existsSync(asset(path)), true, path);
});

test("hero video stays within the approved budget", () => {
  assert.ok(statSync(asset("media/eomeuittul/hero-brand-720p.mp4")).size <= 12 * 1024 * 1024);
});

test("published JPEG assets contain no EXIF block", () => {
  const bytes = readFileSync(asset("images/eomeuittul/step-2-selfbar.jpg"));
  assert.equal(bytes.includes(Buffer.from("Exif\0\0", "latin1")), false);
});
```

- [ ] **Step 2: Run and confirm missing assets**

Run: `node --test tests/media-contract.test.mjs`

Expected: FAIL because the new public assets do not exist.

- [ ] **Step 3: Copy approved images into public**

Run in PowerShell:

```powershell
Copy-Item -LiteralPath 'C:\vibecoding\my-shop\초안-assets\step-1-ribs.png' -Destination 'public\images\eomeuittul\step-1-ribs.png'
Copy-Item -LiteralPath 'C:\vibecoding\my-shop\초안-assets\step-2-selfbar.jpg' -Destination 'public\images\eomeuittul\step-2-selfbar.jpg'
Copy-Item -LiteralPath 'C:\vibecoding\my-shop\초안-assets\step-4-bingsu.png' -Destination 'public\images\eomeuittul\step-4-bingsu.png'
Copy-Item -LiteralPath 'C:\vibecoding\my-shop\초안-assets\naver-map-location.png' -Destination 'public\images\eomeuittul\naver-map-location.png'
```

Expected: four destination files exist.

- [ ] **Step 4: Install ffmpeg with explicit approval if it is unavailable**

Run: `ffmpeg -version`

Expected if installed: first line begins with `ffmpeg version`.

If the command is missing, request user approval and run:

```powershell
winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
```

Expected: installation succeeds, then a fresh shell returns an ffmpeg version.

- [ ] **Step 5: Encode the two web videos**

```powershell
New-Item -ItemType Directory -Force -Path 'public\media\eomeuittul'
ffmpeg -y -i 'C:\Users\ksgoe\OneDrive\Desktop\숑이\인스타그램\영상\에디터j\어믜뜰 영상\02_어믜뜰_영문_여자.mp4' -vf 'scale=-2:720' -c:v libx264 -preset slow -crf 26 -movflags +faststart -an 'public\media\eomeuittul\hero-brand-720p.mp4'
ffmpeg -y -i 'C:\vibecoding\my-shop\초안-assets\step-3-shabu.mp4' -vf 'scale=-2:720' -c:v libx264 -preset slow -crf 25 -movflags +faststart -an 'public\media\eomeuittul\step-3-shabu-720p.mp4'
```

Expected: both commands exit 0. If the hero size test exceeds 12MB, rerun only the hero command with `-crf 29` and recheck.

- [ ] **Step 6: Strip EXIF from the copied JPEG**

Run:

```powershell
ffmpeg -y -i 'public\images\eomeuittul\step-2-selfbar.jpg' -map_metadata -1 'public\images\eomeuittul\step-2-selfbar-clean.jpg'
Move-Item -Force -LiteralPath 'public\images\eomeuittul\step-2-selfbar-clean.jpg' -Destination 'public\images\eomeuittul\step-2-selfbar.jpg'
```

Expected: the EXIF test passes.

- [ ] **Step 7: Implement shared visual components**

```tsx
// components/site/hero-media.tsx
import Image from "next/image";
import type { ReactNode } from "react";
export function HeroMedia({ title, eyebrow, description, image, imageAlt, video, children }: { title: ReactNode; eyebrow: string; description: string; image: string; imageAlt: string; video?: string; children: ReactNode }) { return <section className="hero-media"><div className="hero-background">{video ? <video autoPlay muted loop playsInline preload="metadata" poster={image} aria-label={imageAlt}><source src={video} type="video/mp4" /></video> : <Image src={image} alt={imageAlt} fill priority sizes="100vw" />}</div><div className="hero-overlay" /><div className="shell hero-content"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p><div className="hero-actions">{children}</div></div></section>; }
```

```tsx
// components/site/experience-steps.tsx
import Image from "next/image";
import { DINING_STEPS } from "@/lib/content/store";
export function ExperienceSteps() { return <section className="experience section-pad surface-paper"><div className="shell"><h2>익숙한 등갈비찜에 새로운 식사 경험</h2><p>고르고, 넣고, 함께 끓여 먹는 과정까지 즐거운 어믜뜰만의 네 단계</p><ol className="experience-grid">{DINING_STEPS.map((step) => <li key={step.number} className="experience-card">{step.mediaType === "video" ? <video muted loop playsInline controls preload="metadata" poster="/images/eomeuittul/step-1-ribs.png"><source src={step.media} type="video/mp4" /></video> : <Image src={step.media} alt={step.alt} width={520} height={320} />}<span>{step.number}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol></div></section>; }
```

```tsx
// components/site/proof-strip.tsx
export function ProofStrip({ items }: { items: readonly string[] }) { return <section className="proof-strip" aria-label="핵심 정보"><div className="shell proof-strip-inner">{items.map((item) => <strong key={item}>{item}</strong>)}</div></section>; }
```

```tsx
// components/site/reservation-cta.tsx
import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";
export function ReservationCta({ placement = "section" }: { placement?: string }) { return <section className="reservation-cta section-pad"><div className="shell reservation-cta-inner"><div><p className="eyebrow">NAVER RESERVATION</p><h2>한 상을 직접 경험해 보세요</h2><p>네이버 예약 페이지에서 최신 예약 시간과 현재 제공되는 혜택을 확인할 수 있습니다.</p></div><AnalyticsLink className="button button-primary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement={placement}>네이버에서 예약하기</AnalyticsLink></div></section>; }
```

```tsx
// components/site/location-panel.tsx
import Image from "next/image";
import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";
export function LocationPanel() { return <section className="location-panel section-pad"><div className="shell location-grid"><Image src="/images/eomeuittul/naver-map-location.png" alt="어믜뜰 청주봉명동본점의 네이버 지도 위치" width={650} height={424} /><div><h2>{STORE.fullName}</h2><p>{STORE.address}</p><p>화~일 11:00~22:00 · 월요일 정기휴무<br />평일 브레이크 15:30~16:30</p><p>{STORE.parking}</p><AnalyticsLink className="button button-secondary" href={STORE.directionsUrl} target="_blank" rel="noreferrer" eventName="naver_map_click" placement="location_panel">네이버 지도에서 보기</AnalyticsLink></div></div></section>; }
```

```tsx
// components/site/faq-list.tsx
import type { FaqItem } from "@/lib/content/types";
export function FaqList({ items }: { items: readonly FaqItem[] }) { return <div className="faq-list">{items.map((item, index) => <details key={item.question} open={index === 0}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div>; }
```

```tsx
// components/site/story-card.tsx
import Image from "next/image";
import Link from "next/link";
import type { Story } from "@/lib/content/types";
export function StoryCard({ story }: { story: Story }) { return <article className="story-card"><Image src={story.image} alt={story.imageAlt} width={640} height={360} /><p>{story.category} · {story.readingTime}</p><h2><Link href={`/stories/${story.slug}`}>{story.title}</Link></h2><p>{story.description}</p></article>; }
```

- [ ] **Step 8: Run media tests**

Run: `node --test tests/media-contract.test.mjs`

Expected: PASS.

- [ ] **Step 9: Commit media and shared components**

```bash
git add public/images/eomeuittul public/media/eomeuittul components/site tests/media-contract.test.mjs
git commit -m "feat: add optimized restaurant media sections"
```

---

### Task 5: Global Layout and Design System CSS

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `SiteHeader`, `SiteFooter`, `MobileActionBar`, `STORE`
- Produces: common page shell and all shared visual class contracts

- [ ] **Step 1: Update the existing layout contract test first**

Add to `tests/homepage-contract.test.mjs`:

```js
test("root layout uses shared chrome and optional GA4", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /SiteHeader/);
  assert.match(layout, /SiteFooter/);
  assert.match(layout, /MobileActionBar/);
  assert.match(layout, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(layout, /lang="ko"/);
});
```

- [ ] **Step 2: Run and confirm the new contract fails**

Run: `node --test tests/homepage-contract.test.mjs`

Expected: FAIL because the current layout lacks shared chrome and GA4.

- [ ] **Step 3: Replace the root layout**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { MobileActionBar } from "@/components/site/mobile-action-bar";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { STORE } from "@/lib/content/store";
import "./globals.css";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.NAVER_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(STORE.url),
  title: { default: "청주 봉명동 맛집 어믜뜰 | 색다른 등갈비찜", template: "%s | 어믜뜰" },
  description: "청주 봉명동에서 등갈비찜과 30여 종 셀프바를 샤브처럼 즐기는 어믜뜰입니다.",
  verification: { ...(googleVerification ? { google: googleVerification } : {}), ...(naverVerification ? { other: { "naver-site-verification": naverVerification } } : {}) },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><SiteHeader />{children}<SiteFooter /><MobileActionBar />{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" /><Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}');`}</Script></> : null}</body></html>;
}
```

- [ ] **Step 4: Replace global CSS with the shared foundation**

```css
/* app/globals.css */
@import "tailwindcss";
:root { --clay:#9b6b43; --green:#355843; --hanji:#fffdf8; --ink:#2b2118; --line:#d8cbb8; --muted:#6e6258; --paper:#f7f1e6; --red:#a52a24; --red-dark:#7f1d1d; --straw:#c9a96e; --white:#fff; }
* { box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { margin:0; color:var(--ink); background:var(--hanji); font-family:Inter,Arial,sans-serif; font-size:17px; line-height:1.6; }
img,video { display:block; max-width:100%; }
a { color:inherit; text-decoration:none; }
button,a { -webkit-tap-highlight-color:transparent; }
:focus-visible { outline:3px solid var(--straw); outline-offset:3px; }
.shell { width:min(1296px,calc(100% - 48px)); margin:0 auto; }
.section-pad { padding:64px 0; }
.surface-paper { background:var(--paper); }
.surface-hanji { background:var(--hanji); }
.eyebrow { margin:0; color:var(--straw); font-weight:800; letter-spacing:.05em; }
.button { min-height:54px; padding:0 24px; display:inline-flex; align-items:center; justify-content:center; border-radius:6px; font-weight:700; }
.button-primary { color:var(--white); background:var(--red); }
.button-secondary { color:var(--white); background:var(--green); }
.button-small { min-height:48px; padding:0 20px; }
.site-header { min-height:88px; background:var(--hanji); border-bottom:1px solid var(--line); position:relative; z-index:20; }
.header-inner,.footer-inner { min-height:88px; display:flex; align-items:center; justify-content:space-between; gap:32px; }
.brand { font-size:30px; font-weight:800; }
.desktop-nav { display:flex; align-items:center; gap:28px; font-weight:700; }
.mobile-menu-button,.mobile-nav,.mobile-actions { display:none; }
.site-footer { min-height:200px; color:var(--white); background:#261d17; }
.site-footer p { color:var(--line); }
.hero-media { min-height:720px; position:relative; overflow:hidden; color:var(--white); background:#261d17; }
.hero-background,.hero-overlay { position:absolute; inset:0; }
.hero-background img,.hero-background video { width:100%; height:100%; object-fit:cover; }
.hero-overlay { background:#1d1009a8; }
.hero-content { position:relative; min-height:720px; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; gap:20px; }
.hero-content h1 { max-width:760px; margin:0; font-size:clamp(44px,5vw,64px); line-height:1.2; }
.hero-content>p:not(.eyebrow) { max-width:720px; margin:0; font-size:20px; }
.hero-actions { display:flex; gap:12px; flex-wrap:wrap; }
.proof-strip { color:var(--white); background:var(--red-dark); }
.proof-strip-inner { min-height:110px; display:flex; align-items:center; justify-content:center; gap:64px; text-align:center; }
.experience-grid { list-style:none; padding:0; display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
.experience-card { padding:24px; background:var(--hanji); border:1px solid var(--line); border-radius:6px; }
.experience-card img,.experience-card video { width:100%; aspect-ratio:4/3; object-fit:cover; }
.location-grid,.reservation-cta-inner { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
.faq-list { display:grid; gap:10px; }
.faq-list details { padding:18px 22px; border:1px solid var(--line); background:var(--hanji); border-radius:4px; }
.faq-list summary { cursor:pointer; font-weight:700; }
.mobile-actions { position:fixed; left:0; right:0; bottom:0; z-index:30; min-height:82px; padding:10px 12px; gap:8px; background:#261d17; }
.mobile-actions a { flex:1; min-height:62px; display:flex; align-items:center; justify-content:center; color:var(--white); background:var(--clay); border-radius:6px; font-weight:700; }
.mobile-actions a:nth-child(2) { background:var(--green); }
.mobile-actions .mobile-action-primary { background:var(--red); }
@media (max-width:767px) { body { font-size:16px; padding-bottom:82px; } .shell { width:calc(100% - 48px); } .section-pad { padding:42px 0; } .site-header,.header-inner { min-height:68px; } .brand { font-size:26px; } .desktop-nav { display:none; } .mobile-menu-button { display:inline-flex; min-width:48px; min-height:48px; align-items:center; justify-content:center; border:0; background:transparent; } .mobile-nav { display:grid; padding:18px 24px; gap:14px; background:var(--hanji); border-top:1px solid var(--line); } .mobile-nav[hidden] { display:none; } .mobile-actions { display:flex; } .hero-media,.hero-content { min-height:560px; } .hero-content h1 { font-size:34px; } .hero-content>p:not(.eyebrow) { font-size:17px; } .hero-actions { width:100%; } .hero-actions .button { width:100%; } .proof-strip-inner { min-height:190px; flex-direction:column; gap:14px; padding:24px 0; } .experience-grid { grid-template-columns:1fr; } .experience-card { display:grid; grid-template-columns:78px 1fr; gap:10px 18px; } .experience-card img,.experience-card video { grid-row:1/4; width:78px; height:78px; } .location-grid,.reservation-cta-inner { grid-template-columns:1fr; } .footer-inner { padding:42px 0 100px; align-items:flex-start; flex-direction:column; } }
@media (prefers-reduced-motion:reduce) { html { scroll-behavior:auto; } video { display:none; } }
```

- [ ] **Step 5: Add safe response headers**

```ts
// next.config.ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { async headers() { return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }] }]; } };
export default nextConfig;
```

- [ ] **Step 6: Run contracts, lint, and build**

Run: `pnpm test && pnpm lint && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 7: Commit the global shell**

```bash
git add app/layout.tsx app/globals.css next.config.ts tests/homepage-contract.test.mjs
git commit -m "feat: add approved site shell"
```

---

### Task 6: Search-Focused Home Page

**Files:**
- Modify: `app/page.tsx`
- Modify: `tests/homepage-contract.test.mjs`

**Interfaces:**
- Consumes all shared visual components, content, metadata, schema helpers
- Produces `/`

- [ ] **Step 1: Replace the home contract with the V2 section contract**

```js
test("home V2 exposes approved media, proof, trust, and conversion sections", () => {
  const page = read("app/page.tsx");
  for (const component of ["HeroMedia", "ProofStrip", "ExperienceSteps", "ReservationCta", "LocationPanel", "FaqList", "JsonLd"]) assert.match(page, new RegExp(component));
  assert.match(page, /hero-brand-720p\.mp4/);
  assert.match(page, /청주 봉명동 맛집 어믜뜰/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/homepage-contract.test.mjs`

Expected: FAIL because the current home does not use the V2 components or video.

- [ ] **Step 3: Compose the approved home page**

```tsx
// app/page.tsx
import Image from "next/image";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { FAQ_ITEMS, MENU_ITEMS, REVIEW_ITEMS, STORE } from "@/lib/content/store";
import { createPageMetadata } from "@/lib/seo/metadata";
import { faqSchema, restaurantSchema, websiteSchema } from "@/lib/seo/schema";

export const metadata = createPageMetadata({ title: "청주 봉명동 맛집 어믜뜰 | 색다른 등갈비찜", description: "청주 봉명동에서 등갈비찜과 30여 종 셀프바를 샤브처럼 즐기는 어믜뜰입니다.", path: "/" });

export default function HomePage() { return <main><JsonLd data={[websiteSchema(), restaurantSchema(), faqSchema()]} /><HeroMedia eyebrow="BRAND FILM · 청주 봉명동" title={<>처음 보는 등갈비찜,<br />함께 끓여 더 맛있는 한 상</>} description="부드러운 등갈비와 30여 종의 채소를 취향대로 더해 샤브처럼 즐기는 어믜뜰만의 색다른 한 상" image="/images/eomeuittul/hero-table.jpg" imageAlt="등갈비찜과 메밀전, 채소가 함께 차려진 어믜뜰 한 상" video="/media/eomeuittul/hero-brand-720p.mp4"><AnalyticsLink className="button button-primary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="home_hero">네이버에서 예약하기</AnalyticsLink><a className="button button-secondary" href="/menu">메뉴 먼저 보기</a></HeroMedia><ProofStrip items={["청주 봉명동 본점", "30여 종 채소 셀프바", "등갈비찜 + 샤브의 색다른 조합", "네이버 예약 가능"]} /><section className="brand-story section-pad"><div className="shell split-section"><Image src="/images/eomeuittul/hero-table.jpg" alt="어믜뜰 등갈비찜 한 상" width={640} height={440} /><div><p className="eyebrow">늘 자식 쪽으로 기울던 접시, 그날의 식탁</p><h2>엄마의 마음으로 푸짐하게 차려내는 한 상</h2><p>좋은 것은 자식 앞으로 밀어주시고 하나라도 더 챙겨주시던 마음. 어믜뜰은 누군가를 배부르게 먹이고 싶은 그 마음을 닮은 식당입니다.</p></div></div></section><ExperienceSteps /><section className="menu-preview section-pad"><div className="shell"><h2>한 상에 빠짐없이 담았습니다</h2><div className="menu-grid">{MENU_ITEMS.map((item) => <article key={item.slug}><Image src={item.image} alt={item.imageAlt} width={640} height={360} /><h3>{item.name}</h3><strong>{item.price}</strong><p>{item.description}</p></article>)}</div></div></section><ReservationCta placement="home_mid" /><section className="review-preview section-pad surface-paper"><div className="shell"><h2>손님이 먼저 알아본 어믜뜰</h2><div className="review-grid">{REVIEW_ITEMS.map((review) => <article key={review.title}><h3>{review.title}</h3><p>{review.summary}</p><a href={review.sourceUrl} target="_blank" rel="noreferrer">원문 보기</a></article>)}</div></div></section><section className="faq-section section-pad"><div className="shell"><h2>방문 전 궁금한 점</h2><FaqList items={FAQ_ITEMS.slice(0,4)} /></div></section><LocationPanel /></main>; }
```

- [ ] **Step 4: Add route-section CSS**

Append to `app/globals.css`:

```css
.split-section { display:grid; grid-template-columns:1fr 1.1fr; gap:64px; align-items:center; }
.split-section img { width:100%; height:408px; object-fit:cover; }
.split-section h2,.menu-preview h2,.review-preview h2,.faq-section h2 { font-size:40px; line-height:1.3; }
.menu-preview { color:var(--white); background:#2f3f32; }
.menu-grid,.review-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }
.menu-grid article,.review-grid article { padding:26px; color:var(--ink); background:var(--hanji); border:1px solid var(--line); border-radius:6px; }
.menu-grid img { width:100%; height:220px; object-fit:cover; }
.review-grid { grid-template-columns:repeat(3,1fr); }
@media (max-width:767px) { .split-section,.menu-grid,.review-grid { grid-template-columns:1fr; } .split-section h2,.menu-preview h2,.review-preview h2,.faq-section h2 { font-size:30px; } .split-section img { height:220px; } }
```

- [ ] **Step 5: Run tests, lint, and build**

Run: `pnpm test && pnpm lint && pnpm build`

Expected: PASS and `/` appears in the Next build route list.

- [ ] **Step 6: Commit home V2**

```bash
git add app/page.tsx app/globals.css tests/homepage-contract.test.mjs
git commit -m "feat: build search-focused home page"
```

---

### Task 7: Menu and Store Routes

**Files:**
- Create: `app/menu/page.tsx`
- Create: `app/store/page.tsx`
- Create: `tests/routes-contract.test.mjs`

**Interfaces:**
- Consumes content, hero, proof, experience, reservation, location, schema helpers
- Produces `/menu` and `/store`

- [ ] **Step 1: Write failing route contracts**

```js
// tests/routes-contract.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
for (const route of ["menu", "store"]) test(`${route} route exists`, () => assert.equal(existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)), true));
test("menu and store use approved content", () => { assert.match(read("app/menu/page.tsx"), /ExperienceSteps/); assert.match(read("app/menu/page.tsx"), /MENU_ITEMS/); assert.match(read("app/store/page.tsx"), /identity-wall\.jpg/); assert.match(read("app/store/page.tsx"), /LocationPanel/); });
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/routes-contract.test.mjs`

Expected: FAIL because route files do not exist.

- [ ] **Step 3: Build `/menu`**

Create `app/menu/page.tsx` with `createPageMetadata({ title: "청주 갈비찜 메뉴 | 어믜뜰 청주봉명동본점", description: "매운 등갈비찜과 간장 등갈비찜의 가격, 구성과 어믜뜰 식사 순서를 확인하세요.", path: "/menu" })`, `HeroMedia`, `ProofStrip`, both `MENU_ITEMS`, the actual self-bar image, `ExperienceSteps`, `ReservationCta`, and `JsonLd` with `restaurantSchema()` plus `breadcrumbSchema([{name:"홈",path:"/"},{name:"메뉴",path:"/menu"}])`.

Use this exact composition:

```tsx
export default function MenuPage() { return <main><JsonLd data={[restaurantSchema(), breadcrumbSchema([{ name:"홈", path:"/" }, { name:"메뉴", path:"/menu" }])]} /><HeroMedia eyebrow="MENU · 청주갈비찜" title={<>등갈비찜에서 시작해<br />나만의 한 상으로</>} description="매운맛과 간장맛을 고르고 셀프바 재료를 더해 샤브처럼 즐겨보세요." image="/images/eomeuittul/spicy-ribs.jpg" imageAlt="어믜뜰 매운 등갈비찜"><AnalyticsLink className="button button-primary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="menu_hero">네이버에서 예약하기</AnalyticsLink></HeroMedia><ProofStrip items={["매운맛·간장맛", "세트 19,900원", "임궁밥·메밀전 포함", "30여 종 셀프바"]} /><section className="menu-page section-pad"><div className="shell menu-grid">{MENU_ITEMS.map((item) => <article key={item.slug}><Image src={item.image} alt={item.imageAlt} width={640} height={420} /><h2>{item.name}</h2><strong>{item.price}</strong><p>{item.includes}</p><p>{item.description}</p></article>)}</div></section><section className="self-bar section-pad"><div className="shell split-section"><Image src="/images/eomeuittul/step-2-selfbar.jpg" alt="어믜뜰 셀프바" width={640} height={440} /><div><p className="eyebrow">30여 종 채소 · 버섯 · 떡 · 당면</p><h2>취향대로 담아 나만의 한 상</h2><p>재료 구성은 매장 상황에 따라 달라질 수 있습니다.</p></div></div></section><ExperienceSteps /><ReservationCta placement="menu_bottom" /></main>; }
```

- [ ] **Step 4: Build `/store`**

Create `app/store/page.tsx` with metadata title `어믜뜰 매장 소개 | 청주 봉명동 가족 외식`, hero image `facade.jpg`, proof values, three alternating sections using `hero-table.jpg`, `identity-wall.jpg`, `interior.jpg`, `LocationPanel`, and Restaurant plus breadcrumb JSON-LD. Use the approved text “누군가를 배부르게 먹이고 싶은 마음”, “늘 자식 쪽으로 기울던 접시”, and `STORE.seats` without adding new claims.

- [ ] **Step 5: Run route tests and build**

Run: `node --test tests/routes-contract.test.mjs && pnpm lint && pnpm build`

Expected: menu/store assertions PASS and build lists `/menu` and `/store`.

- [ ] **Step 6: Commit both routes**

```bash
git add app/menu app/store tests/routes-contract.test.mjs
git commit -m "feat: add menu and store pages"
```

---

### Task 8: Location and FAQ Routes

**Files:**
- Create: `app/location/page.tsx`
- Create: `app/faq/page.tsx`
- Modify: `tests/routes-contract.test.mjs`

**Interfaces:**
- Produces `/location` and `/faq`

- [ ] **Step 1: Add failing route-specific assertions**

```js
for (const route of ["location", "faq"]) test(`${route} route exists`, () => assert.equal(existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)), true));

test("location and FAQ expose direct-answer information", () => {
  const location = read("app/location/page.tsx");
  const faq = read("app/faq/page.tsx");
  assert.match(location, /LocationPanel/);
  assert.match(location, /STORE\.parking/);
  assert.match(faq, /FAQ_ITEMS/);
  assert.match(faq, /faqSchema/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/routes-contract.test.mjs`

Expected: FAIL on the new assertions.

- [ ] **Step 3: Implement `/location`**

Use metadata `어믜뜰 오시는 길·주차 | 청주 봉명동 맛집`, a map hero, `ProofStrip`, `LocationPanel`, a parking section that explicitly says actual parking/entrance photos replace the map area only when provided, four visit FAQs, and Restaurant plus breadcrumb JSON-LD. Include `AnalyticsLink` for phone and map actions.

- [ ] **Step 4: Implement `/faq`**

Use metadata `어믜뜰 FAQ | 예약·주차·영업시간·포장`, interior hero, `ProofStrip`, `FaqList` with all eight `FAQ_ITEMS`, `LocationPanel`, and FAQPage plus breadcrumb JSON-LD. The page must not say that FAQ rich results are guaranteed.

- [ ] **Step 5: Run route and schema tests**

Run: `node --test tests/routes-contract.test.mjs tests/seo-schema.test.mjs && pnpm lint && pnpm build`

Expected: PASS and build lists both routes.

- [ ] **Step 6: Commit location and FAQ**

```bash
git add app/location app/faq tests/routes-contract.test.mjs
git commit -m "feat: add location and FAQ pages"
```

---

### Task 9: Evidence-Based Reviews Route

**Files:**
- Create: `app/reviews/page.tsx`
- Modify: `tests/routes-contract.test.mjs`

**Interfaces:**
- Consumes: `REVIEW_ITEMS`, `STORE.placeUrl`
- Produces: `/reviews`

- [ ] **Step 1: Add the failing review evidence contract**

```js
test("reviews route exists", () => {
  assert.equal(existsSync(new URL("../app/reviews/page.tsx", import.meta.url)), true);
});

test("reviews show source links and confirmation dates without aggregate rating", () => {
  const page = read("app/reviews/page.tsx");
  assert.match(page, /REVIEW_ITEMS/);
  assert.match(page, /checkedAt/);
  assert.match(page, /sourceUrl/);
  assert.doesNotMatch(page, /AggregateRating/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/routes-contract.test.mjs`

Expected: FAIL because reviews page is missing.

- [ ] **Step 3: Implement the approved reviews page**

Create `app/reviews/page.tsx` with metadata `어믜뜰 방문자 후기 | 청주 봉명동 등갈비찜`, soy-ribs hero, proof strip `네이버 원문 링크`, `2026.07.19 확인`, `후기 일부 발췌`, `반복 반응 중심 요약`, three review cards showing `sourceLabel`, `summary`, `checkedAt`, and `sourceUrl`, the actual self-bar and soy-ribs supporting sections, `ReservationCta`, `LocationPanel`, and BreadcrumbList only.

- [ ] **Step 4: Run tests and build**

Run: `node --test tests/routes-contract.test.mjs tests/seo-schema.test.mjs && pnpm lint && pnpm build`

Expected: PASS and `/reviews` is generated.

- [ ] **Step 5: Commit reviews**

```bash
git add app/reviews tests/routes-contract.test.mjs
git commit -m "feat: add sourced visitor reviews page"
```

---

### Task 10: Stories Index and Static Detail Pages

**Files:**
- Create: `app/stories/page.tsx`
- Create: `app/stories/[slug]/page.tsx`
- Modify: `tests/routes-contract.test.mjs`

**Interfaces:**
- Consumes: `STORIES`, `getStory`, `StoryCard`, `articleSchema`
- Produces: `/stories` and four static story URLs

- [ ] **Step 1: Add failing story route assertions**

```js
test("story index and detail routes exist", () => {
  assert.equal(existsSync(new URL("../app/stories/page.tsx", import.meta.url)), true);
  assert.equal(existsSync(new URL("../app/stories/[slug]/page.tsx", import.meta.url)), true);
});

test("stories use static params, article metadata, and related content", () => {
  const index = read("app/stories/page.tsx");
  const detail = read("app/stories/[slug]/page.tsx");
  assert.match(index, /STORIES/);
  assert.match(index, /StoryCard/);
  assert.match(detail, /generateStaticParams/);
  assert.match(detail, /generateMetadata/);
  assert.match(detail, /articleSchema/);
  assert.match(detail, /notFound/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/routes-contract.test.mjs`

Expected: FAIL because story routes are missing.

- [ ] **Step 3: Implement the stories index**

```tsx
// app/stories/page.tsx
import { HeroMedia } from "@/components/site/hero-media";
import { StoryCard } from "@/components/site/story-card";
import { ReservationCta } from "@/components/site/reservation-cta";
import { STORIES } from "@/lib/content/stories";
import { createPageMetadata } from "@/lib/seo/metadata";
export const metadata = createPageMetadata({ title:"어믜뜰 이야기 | 청주 맛집·등갈비찜 가이드", description:"등갈비찜을 즐기는 법, 셀프바, 청주 봉명동 가족 외식 정보를 확인하세요.", path:"/stories" });
export default function StoriesPage() { return <main><HeroMedia eyebrow="STORIES · 청주 봉명동 맛집 이야기" title={<>메뉴를 알면<br />한 상이 더 즐거워집니다</>} description="등갈비찜을 맛있게 즐기는 법부터 가족 외식과 방문 정보까지 전합니다." image="/images/eomeuittul/hero-table.jpg" imageAlt="어믜뜰 등갈비찜 한 상"><a className="button button-primary" href="#story-list">추천 이야기 읽기</a></HeroMedia><section id="story-list" className="stories-grid section-pad"><div className="shell story-grid">{STORIES.map((story) => <StoryCard key={story.slug} story={story} />)}</div></section><ReservationCta placement="stories_bottom" /></main>; }
```

- [ ] **Step 4: Implement static story detail generation**

```tsx
// app/stories/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { ReservationCta } from "@/components/site/reservation-cta";
import { StoryCard } from "@/components/site/story-card";
import { FAQ_ITEMS } from "@/lib/content/store";
import { getStory, STORIES } from "@/lib/content/stories";
import { createPageMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema";

export function generateStaticParams() { return STORIES.map((story) => ({ slug: story.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const story = getStory(slug); if (!story) return {}; return createPageMetadata({ title: `${story.title} | 어믜뜰`, description: story.description, path: `/stories/${story.slug}`, image: story.image, type: "article" }); }
export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const story = getStory(slug); if (!story) notFound(); const related = STORIES.filter((item) => item.slug !== story.slug).slice(0,2); return <main><JsonLd data={[articleSchema(story), breadcrumbSchema([{ name:"홈", path:"/" }, { name:"이야기", path:"/stories" }, { name:story.title, path:`/stories/${story.slug}` }])]} /><HeroMedia eyebrow={`${story.category} · ${story.readingTime}`} title={story.title} description={story.description} image={story.image} imageAlt={story.imageAlt}><a className="button button-primary" href="#article">이야기 읽기</a></HeroMedia><article id="article" className="article-body section-pad"><div className="shell">{story.sections.map((section) => <section key={section.heading}>{section.image ? <Image src={section.image} alt={section.imageAlt ?? ""} width={760} height={500} /> : null}<h2>{section.heading}</h2><p>{section.body}</p></section>)}{story.slug === "how-to-enjoy-ribs" ? <ExperienceSteps /> : null}<FaqList items={FAQ_ITEMS.slice(4)} /></div></article><section className="related-stories section-pad"><div className="shell story-grid">{related.map((item) => <StoryCard key={item.slug} story={item} />)}</div></section><ReservationCta placement="story_bottom" /></main>; }
```

- [ ] **Step 5: Add story layout CSS**

```css
.story-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:22px; }
.story-card { padding:24px; background:var(--hanji); border:1px solid var(--line); }
.story-card img { width:100%; aspect-ratio:16/9; object-fit:cover; }
.article-body>.shell { max-width:900px; }
.article-body section { margin-bottom:64px; }
.article-body h2 { font-size:36px; line-height:1.3; }
.related-stories { color:var(--white); background:#2f3f32; }
@media (max-width:767px) { .story-grid { grid-template-columns:1fr; } .article-body h2 { font-size:28px; } }
```

- [ ] **Step 6: Run tests and build**

Run: `node --test tests/routes-contract.test.mjs tests/seo-schema.test.mjs && pnpm lint && pnpm build`

Expected: PASS and build lists `/stories` plus the four slugs.

- [ ] **Step 7: Commit stories**

```bash
git add app/stories app/globals.css tests/routes-contract.test.mjs
git commit -m "feat: add searchable restaurant stories"
```

---

### Task 11: Sitemap, Robots, Final Migration Cleanup, and Analytics Read Events

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`
- Create: `components/site/menu-view-tracker.tsx`
- Create: `components/site/story-read-tracker.tsx`
- Modify: `app/menu/page.tsx`
- Modify: `app/stories/[slug]/page.tsx`
- Modify: `tests/search-discovery.test.mjs`
- Modify: `tests/analytics-contract.test.mjs`
- Delete: `components/home/site-header.tsx`
- Delete: `lib/site-content.ts`

**Interfaces:**
- Consumes: `STORE`, `STORIES`
- Produces complete discovery files and clean imports

- [ ] **Step 1: Expand failing discovery tests**

```js
test("sitemap publishes every static and story URL", () => {
  const sitemap = read("app/sitemap.ts");
  for (const path of ["/menu", "/store", "/location", "/faq", "/reviews", "/stories"]) assert.match(sitemap, new RegExp(path));
  assert.match(sitemap, /STORIES\.map/);
});
```

Append the read-event contract to `tests/analytics-contract.test.mjs`:

```js
test("menu and story read events are session-deduplicated", () => {
  const menu = read("components/site/menu-view-tracker.tsx");
  const story = read("components/site/story-read-tracker.tsx");
  assert.match(menu, /menu_view:/);
  assert.match(menu, /sessionStorage/);
  assert.match(menu, /menu_view/);
  assert.match(story, /story_read:/);
  assert.match(story, /scrollY/);
  assert.match(story, /30_000/);
  assert.match(story, /sessionStorage/);
  assert.match(story, /story_read/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tests/search-discovery.test.mjs tests/analytics-contract.test.mjs`

Expected: FAIL because sitemap currently contains only the homepage.

- [ ] **Step 3: Implement complete sitemap and robots**

```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
import { STORE } from "@/lib/content/store";
import { STORIES } from "@/lib/content/stories";
const lastModified = new Date("2026-07-19T00:00:00+09:00");
export default function sitemap(): MetadataRoute.Sitemap { const staticPaths = ["", "/menu", "/store", "/location", "/faq", "/reviews", "/stories"]; return [...staticPaths.map((path) => ({ url: `${STORE.url}${path}`, lastModified })), ...STORIES.map((story) => ({ url: `${STORE.url}/stories/${story.slug}`, lastModified: new Date(`${story.modifiedAt}T00:00:00+09:00`) }))]; }
```

```ts
// app/robots.ts
import type { MetadataRoute } from "next";
import { STORE } from "@/lib/content/store";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent:"*", allow:"/" }, sitemap:`${STORE.url}/sitemap.xml`, host:STORE.url }; }
```

- [ ] **Step 4: Add page-read event components without changing navigation**

```tsx
// components/site/menu-view-tracker.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function MenuViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `menu_view:${pathname}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    window.gtag?.("event", "menu_view", { page_path: pathname });
  }, [pathname]);

  return null;
}
```

Mount `<MenuViewTracker />` immediately after `<JsonLd ... />` in `app/menu/page.tsx`, and add this import:

```tsx
import { MenuViewTracker } from "@/components/site/menu-view-tracker";
```

```tsx
// components/site/story-read-tracker.tsx
"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function StoryReadTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `story_read:${pathname}`;
    if (window.sessionStorage.getItem(key)) return;

    let sent = false;
    const send = () => {
      if (sent || window.sessionStorage.getItem(key)) return;
      sent = true;
      window.sessionStorage.setItem(key, "1");
      window.gtag?.("event", "story_read", { page_path: pathname });
      window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.5) send();
    };
    const timer = window.setTimeout(send, 30_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
```

Mount `<StoryReadTracker />` immediately after `<JsonLd ... />` in `app/stories/[slug]/page.tsx`, and add this import:

```tsx
import { StoryReadTracker } from "@/components/site/story-read-tracker";
```

The trackers only report engagement signals. They do not alter navigation, claim a completed reservation, or render visible markup.

- [ ] **Step 5: Remove migrated legacy files and imports**

Run: `rg -n "components/home/site-header|lib/site-content" app components lib tests`

Expected before deletion: no matches. Then delete only the two legacy files listed in this task.

- [ ] **Step 6: Run the full local gate**

Run: `pnpm test && pnpm lint && pnpm build`

Expected: all tests pass, lint exits 0, build exits 0, sitemap includes 11 public URLs.

- [ ] **Step 7: Commit discovery and cleanup**

```bash
git add app/sitemap.ts app/robots.ts app/menu app/stories components/site/menu-view-tracker.tsx components/site/story-read-tracker.tsx tests
git rm components/home/site-header.tsx lib/site-content.ts
git commit -m "feat: finalize search discovery and analytics"
```

---

### Task 12: Visual QA, Production Validation, and Vercel Release

**Files:**
- Verify only; modify only files implicated by a failing deterministic check

**Interfaces:**
- Consumes the completed application
- Produces a verified production deployment

- [ ] **Step 1: Run the complete automated gate from a clean shell**

Run: `pnpm test`

Expected: all Node tests PASS.

Run: `pnpm lint`

Expected: exit 0 with no ESLint errors.

Run: `pnpm build`

Expected: exit 0 and all 11 public URLs appear as static routes.

- [ ] **Step 2: Start production mode locally**

Run: `pnpm start`

Expected: server listens on `http://localhost:3000` using the successful build.

- [ ] **Step 3: Verify desktop and mobile against Pencil**

Open every route at 1440px and 390px. For each route verify:

- no horizontal scrollbar or clipped text;
- header and mobile action bar match approved hierarchy;
- CTA height is at least 48px;
- image and video crops match the Pencil intent;
- mobile bottom action does not cover the final content;
- focus order reaches header links, page CTA, FAQ, and footer;
- reduced-motion mode shows poster instead of an autoplaying video.

Expected: no visual discrepancy that changes hierarchy, copy, facts, or actions.

- [ ] **Step 4: Verify links and analytics with browser developer tools**

Click reservation, map, and phone actions from hero, content, and mobile bar. Confirm default navigation still occurs. With `NEXT_PUBLIC_GA_MEASUREMENT_ID` configured, confirm one GA4 event per click. Without the variable, confirm there is no console error.

Expected: external links open official Naver or telephone destinations and no action is blocked by analytics.

- [ ] **Step 5: Validate discovery and structured data locally**

Open:

- `http://localhost:3000/robots.txt`
- `http://localhost:3000/sitemap.xml`
- page source for `/`, `/faq`, and `/stories/how-to-enjoy-ribs`

Expected: robots and sitemap return 200; Restaurant, FAQPage, Article, and BreadcrumbList JSON-LD match visible text; no AggregateRating appears.

- [ ] **Step 6: Deploy to Vercel production**

Run: `vercel --prod`

Expected: deployment status `Ready` and the production alias points to `https://eomeutteull.com`.

- [ ] **Step 7: Verify production responses**

Run in PowerShell:

```powershell
$urls = @('https://eomeutteull.com','https://eomeutteull.com/menu','https://eomeutteull.com/store','https://eomeutteull.com/location','https://eomeutteull.com/faq','https://eomeutteull.com/reviews','https://eomeutteull.com/stories','https://eomeutteull.com/robots.txt','https://eomeutteull.com/sitemap.xml')
$urls | ForEach-Object { $r = Invoke-WebRequest -UseBasicParsing -Uri $_; [PSCustomObject]@{ Url = $_; Status = $r.StatusCode } }
```

Expected: every URL returns status 200.

- [ ] **Step 8: Submit and measure**

Use Google Search Console and 네이버 서치어드바이저 URL inspection for `/`, `/menu`, `/location`, `/faq`, and the first story. Submit the sitemap in both tools. Record the release date and compare impressions, clicks, CTR, average position, `naver_reservation_click`, `naver_map_click`, and `phone_click` after 28 complete days against the preceding 28 days.

Expected: submission accepted; no promise is made about indexing time or ranking.

- [ ] **Step 9: Commit only deterministic QA fixes, if any**

If Step 1 through Step 5 required code changes, rerun the complete gate and commit those exact fixes:

```bash
git add app components lib public tests
git commit -m "fix: resolve final redesign QA findings"
```

If no files changed, do not create an empty commit.
