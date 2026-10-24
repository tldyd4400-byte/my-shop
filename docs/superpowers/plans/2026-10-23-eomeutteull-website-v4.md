# 어믜뜰 홈페이지 V4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 네이버 스마트플레이스에서 확인한 최신 운영 정보와 메뉴 17개를 홈페이지에 반영하고, 청주갈비찜·회식·단체모임·가족외식 검색 유입을 네이버 예약과 전화 상담으로 전환한다.

**Architecture:** `lib/content/store.ts`를 매장·메뉴·후기 스냅샷의 단일 사실 원본으로 확장하고 모든 페이지와 JSON-LD가 그 데이터를 소비하게 한다. 페이지는 기존 Next.js App Router 구조와 공용 컴포넌트를 유지하며, 새 메뉴 분류와 방문 결정 정보만 작은 전용 컴포넌트로 분리한다. 네이버 리뷰 평점은 확인일이 있는 화면용 스냅샷으로만 표시하고 `AggregateRating` 스키마에는 넣지 않는다.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, TypeScript 5, Node test runner, CSS, Vercel

## Global Constraints

- 승인된 Pencil 원본은 `C:\vibecoding\my-shop\초안`의 `플레이스 최신화 V4 홈페이지·예약 전환 승인안`이다.
- 승인된 설계서는 `docs/superpowers/specs/2026-10-23-eomeutteull-place-refresh-and-conversion-design.md`다.
- 새 CMS, 신규 데이터베이스, 결제·예약 API, 네이버 방문자 리뷰 스크래핑을 추가하지 않는다.
- 홈페이지에는 실제로 없는 바 형태 카운터석을 표시하지 않는다.
- 비건 안내는 완전 비건 조리를 보장하지 않고 육수·소스 확인 필요성을 명시한다.
- 네이버 예약 URL은 `https://m.booking.naver.com/booking/6/bizes/1611967/items/7499930?area=bmp&theme=place`다.
- 운영 배포와 네이버 저장은 각각 사용자 최종 승인 후 실행한다.
- 모든 코드 변경은 실패 테스트 → 최소 구현 → 통과 테스트 순서로 진행한다.

## File Structure

- `lib/content/types.ts`: 확장된 매장, 메뉴, 리뷰 스냅샷 타입
- `lib/content/store.ts`: 최신 운영 정보, 메뉴 17개, FAQ, 리뷰 스냅샷
- `lib/content/stories.ts`: 가족외식·단체모임·청주갈비찜 이야기의 최신 문구와 수정일
- `lib/seo/schema.ts`: 분류된 Menu/MenuSection/MenuItem과 최신 시설 정보
- `app/page.tsx`: V4 히어로, 신뢰 정보, 메뉴 분류 미리보기, 단체 전환
- `app/menu/page.tsx`: 17개 전체 메뉴와 포장 할인·비건 주의문
- `app/location/page.tsx`: 최신 영업시간·휴무·주차·접근성
- `app/reviews/page.tsx`: 2026-10-23 리뷰 스냅샷과 출처·확인일
- `app/faq/page.tsx`: 포장·단체·접근성·콜키지 질문
- `app/stories/[slug]/page.tsx`: 모임·회식 가이드의 최신 단체 전환 정보
- `app/sitemap.ts`: 실제 V4 배포 기준 변경일
- `components/site/menu-category-grid.tsx`: 분류별 메뉴 카드 렌더링
- `components/site/visit-facts.tsx`: 영업시간·주차·접근성 요약
- `components/site/group-dining-panel.tsx`: 52명·통대관·콜키지 무료 CTA
- `components/site/mobile-action-bar.tsx`: 모바일 전화·길찾기·예약 고정 CTA
- `app/globals.css`: V4 그리드, 메뉴 분류, 방문 정보, 390px 반응형
- `tests/content-model.test.mjs`: 중앙 콘텐츠 정확성
- `tests/homepage-contract.test.mjs`: 홈 섹션과 문구 계약
- `tests/routes-contract.test.mjs`: 메뉴·위치·후기·FAQ 계약
- `tests/seo-schema.test.mjs`: 구조화 데이터 계약
- `tests/search-discovery.test.mjs`: sitemap 최신화 계약
- `tests/public-visible-terms.test.mjs`: 빌드된 모든 공개 페이지의 사실·금지 문구 검사

---

### Task 1: 최신 매장·메뉴 데이터 모델

**Files:**
- Modify: `lib/content/types.ts:1-44`
- Modify: `lib/content/store.ts:1-81`
- Test: `tests/content-model.test.mjs`

**Interfaces:**
- Produces: `MenuCategory`, `MenuItem`, `ReviewSnapshot`, 확장된 `StoreInfo`
- Produces: `MENU_CATEGORIES`, `MENU_ITEMS`, `REVIEW_SNAPSHOT`, `STORE`
- Consumes: 기존 `FaqItem`, `ReviewItem`, `DiningStep`

- [ ] **Step 1: 최신 사실 계약 테스트를 작성한다**

`tests/content-model.test.mjs`의 import에 `MENU_CATEGORIES`와 `REVIEW_SNAPSHOT`을 추가한다. 기존 두 항목 전체 배열만 비교하는 `assert.deepEqual(MENU_ITEMS, [...])`는 제거하고 다음 최신 사실 테스트를 넣는다. FAQ·후기·식사 단계에 대한 기존 단언은 유지한다.

```js
test("central content exports the verified 2026-10-23 store snapshot", () => {
  assert.equal(STORE.lastOrder, "21:00");
  assert.equal(STORE.regularClosure, "매주 월요일");
  assert.equal(STORE.holidayClosure, "설·추석 당일");
  assert.equal(STORE.maxGroupSize, 52);
  assert.equal(STORE.privateHire, "최대 인원 이용 시 통대관 협의");
  assert.equal(STORE.corkage, "외부 주류 반입 가능 · 콜키지 무료");
  assert.deepEqual(STORE.accessibility, [
    "휠체어 이용 가능 출입구",
    "휠체어 이용 가능 좌석",
    "휠체어 이용 가능 화장실",
  ]);
  assert.deepEqual(STORE.openingPeriods, [
    { label: "화~금 점심", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "11:00", closes: "15:30" },
    { label: "화~금 저녁", days: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "16:30", closes: "22:00" },
    { label: "토~일", days: ["Saturday", "Sunday"], opens: "11:00", closes: "22:00" },
  ]);
});

test("central content exports all 17 verified menu items in four categories", () => {
  assert.deepEqual(MENU_CATEGORIES.map(({ id, label }) => ({ id, label })), [
    { id: "set", label: "대표 세트" },
    { id: "side", label: "곁들임" },
    { id: "extra", label: "추가 메뉴" },
    { id: "takeout", label: "포장 할인" },
  ]);
  assert.equal(MENU_ITEMS.length, 17);
  assert.deepEqual(
    MENU_ITEMS.map(({ name, priceAmount }) => ({ name, priceAmount })),
    [
      { name: "매운등갈비찜 세트 1인", priceAmount: 19900 },
      { name: "간장등갈비찜 세트 1인", priceAmount: 19900 },
      { name: "특별한 수제우유빙수", priceAmount: 0 },
      { name: "임궁밥", priceAmount: 4900 },
      { name: "메밀전", priceAmount: 4900 },
      { name: "육전", priceAmount: 12000 },
      { name: "바삭대파전병", priceAmount: 3000 },
      { name: "납작만두", priceAmount: 2000 },
      { name: "어린이밥", priceAmount: 3500 },
      { name: "계란찜", priceAmount: 2000 },
      { name: "간장등갈비 추가", priceAmount: 15000 },
      { name: "매운등갈비 추가", priceAmount: 15000 },
      { name: "우삼겹 100g 추가", priceAmount: 4900 },
      { name: "포장 반조리 매운등갈비찜 단품 1인", priceAmount: 14000 },
      { name: "포장 반조리 간장등갈비찜 단품 1인", priceAmount: 14000 },
      { name: "포장 반조리 매운등갈비찜 세트 1인", priceAmount: 19000 },
      { name: "포장 반조리 간장등갈비찜 세트 1인", priceAmount: 19000 },
    ],
  );
  assert.equal(MENU_ITEMS.filter((item) => item.minimumOrder === 2).length, 4);
});

test("review snapshot records source and checked date without schema claims", () => {
  assert.deepEqual(REVIEW_SNAPSHOT, {
    rating: 4.94,
    participants: 362,
    checkedAt: "2026-10-23",
    sourceLabel: "네이버 스마트플레이스 관리자 화면",
    sourceUrl: STORE.placeUrl,
  });
});
```

- [ ] **Step 2: 새 테스트가 실패하는지 확인한다**

Run: `node --test tests/content-model.test.mjs`

Expected: `MENU_CATEGORIES` 또는 `REVIEW_SNAPSHOT` export가 없거나 `StoreInfo` 필드가 없어 FAIL.

- [ ] **Step 3: 타입을 확장한다**

`lib/content/types.ts`의 `StoreInfo`와 `MenuItem`을 다음 인터페이스로 교체하고 새 타입을 추가한다.

```ts
export type MenuCategoryId = "set" | "side" | "extra" | "takeout";

export type MenuCategory = {
  id: MenuCategoryId;
  label: string;
  description: string;
};

export type MenuItem = {
  slug: string;
  category: MenuCategoryId;
  name: string;
  price: string;
  priceAmount: number;
  description: string;
  includes: string;
  minimumOrder?: number;
  badge?: string;
  image: string;
  imageAlt: string;
};

export type ReviewSnapshot = {
  rating: number;
  participants: number;
  checkedAt: string;
  sourceLabel: string;
  sourceUrl: string;
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
  maxGroupSize: number;
  groupBooking: string;
  privateHire: string;
  corkage: string;
  lastOrder: string;
  regularClosure: string;
  holidayClosure: string;
  accessibility: readonly string[];
  familyFacilities: readonly string[];
  placeUrl: string;
  bookingUrl: string;
  directionsUrl: string;
  image: string;
  openingPeriods: readonly OpeningPeriod[];
};
```

- [ ] **Step 4: 중앙 콘텐츠를 최신 값으로 구현한다**

`lib/content/store.ts`에서 타입 import를 확장하고 다음 상수를 사용한다.

```ts
export const MENU_CATEGORIES: readonly MenuCategory[] = [
  { id: "set", label: "대표 세트", description: "매운맛과 간장맛 중 선택 · 2인 이상 주문" },
  { id: "side", label: "곁들임", description: "등갈비찜과 함께 즐기는 식사와 사이드" },
  { id: "extra", label: "추가 메뉴", description: "더 푸짐하게 즐기는 등갈비와 우삼겹" },
  { id: "takeout", label: "포장 할인", description: "집과 캠핑에서도 끓여 먹는 반조리 메뉴" },
];

const menuItem = (
  item: Omit<MenuItem, "includes" | "image" | "imageAlt"> &
    Partial<Pick<MenuItem, "includes" | "image" | "imageAlt">>,
): MenuItem => ({
  includes: "",
  image: STORE.image,
  imageAlt: `${item.name} 메뉴 안내`,
  ...item,
});

export const MENU_ITEMS: readonly MenuItem[] = [
  menuItem({ slug: "spicy-set", category: "set", name: "매운등갈비찜 세트 1인", price: "19,900원", priceAmount: 19900, description: "매콤한 육수에 채소를 더해 샤브처럼 끓여 먹는 대표 메뉴", includes: "등갈비찜 · 셀프바 · 수제우유빙수", minimumOrder: 2, badge: "대표", image: "/images/eomeuittul/spicy-ribs.jpg", imageAlt: "어믜뜰 매운등갈비찜 세트" }),
  menuItem({ slug: "soy-set", category: "set", name: "간장등갈비찜 세트 1인", price: "19,900원", priceAmount: 19900, description: "달콤짭짤하고 맵지 않아 아이와 부모님도 편하게 즐기는 메뉴", includes: "등갈비찜 · 셀프바 · 수제우유빙수", minimumOrder: 2, image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "어믜뜰 간장등갈비찜 세트" }),
  menuItem({ slug: "milk-bingsu", category: "side", name: "특별한 수제우유빙수", price: "무료", priceAmount: 0, description: "식사 후 제공되는 특별한 후식", badge: "후식 서비스", image: "/images/eomeuittul/step-4-bingsu.png", imageAlt: "어믜뜰 수제우유빙수" }),
  menuItem({ slug: "imgung-rice", category: "side", name: "임궁밥", price: "4,900원", priceAmount: 4900, description: "곤드레와 궁채나물로 만든 나물밥", image: "/images/eomeuittul/imgung-rice.jpg", imageAlt: "곤드레와 궁채나물로 만든 임궁밥" }),
  menuItem({ slug: "buckwheat-pancake", category: "side", name: "메밀전", price: "4,900원", priceAmount: 4900, description: "등갈비찜과 곁들이기 좋은 고소한 메밀전", image: "/images/eomeuittul/buckwheat-pancake.jpg", imageAlt: "어믜뜰 메밀전" }),
  menuItem({ slug: "beef-pancake", category: "side", name: "육전", price: "12,000원", priceAmount: 12000, description: "부드러운 소고기에 계란옷을 입혀 구운 육전" }),
  menuItem({ slug: "green-onion-roll", category: "side", name: "바삭대파전병", price: "3,000원", priceAmount: 3000, description: "바삭하게 즐기는 대파전병" }),
  menuItem({ slug: "flat-dumpling", category: "side", name: "납작만두", price: "2,000원", priceAmount: 2000, description: "노릇하게 구운 바삭하고 쫄깃한 납작만두" }),
  menuItem({ slug: "kids-rice", category: "side", name: "어린이밥", price: "3,500원", priceAmount: 3500, description: "간장등갈비로 구성한 어린이 메뉴" }),
  menuItem({ slug: "steamed-egg", category: "side", name: "계란찜", price: "2,000원", priceAmount: 2000, description: "매운맛을 부드럽게 잡아주는 계란찜" }),
  menuItem({ slug: "extra-soy-ribs", category: "extra", name: "간장등갈비 추가", price: "15,000원", priceAmount: 15000, description: "달콤짭짤한 간장등갈비 추가" }),
  menuItem({ slug: "extra-spicy-ribs", category: "extra", name: "매운등갈비 추가", price: "15,000원", priceAmount: 15000, description: "매콤한 등갈비 추가" }),
  menuItem({ slug: "extra-beef", category: "extra", name: "우삼겹 100g 추가", price: "4,900원", priceAmount: 4900, description: "국물과 함께 즐기는 고소한 우삼겹" }),
  menuItem({ slug: "takeout-spicy-single", category: "takeout", name: "포장 반조리 매운등갈비찜 단품 1인", price: "14,000원", priceAmount: 14000, description: "집이나 캠핑에서 끓여 먹는 반조리 단품", minimumOrder: 2, badge: "포장 할인" }),
  menuItem({ slug: "takeout-soy-single", category: "takeout", name: "포장 반조리 간장등갈비찜 단품 1인", price: "14,000원", priceAmount: 14000, description: "집이나 캠핑에서 끓여 먹는 반조리 단품", minimumOrder: 2, badge: "포장 할인" }),
  menuItem({ slug: "takeout-spicy-set", category: "takeout", name: "포장 반조리 매운등갈비찜 세트 1인", price: "19,000원", priceAmount: 19000, description: "셀프바 구성까지 함께 즐기는 반조리 세트", badge: "포장 할인" }),
  menuItem({ slug: "takeout-soy-set", category: "takeout", name: "포장 반조리 간장등갈비찜 세트 1인", price: "19,000원", priceAmount: 19000, description: "셀프바 구성까지 함께 즐기는 반조리 세트", badge: "포장 할인" }),
];

export const REVIEW_SNAPSHOT: ReviewSnapshot = {
  rating: 4.94,
  participants: 362,
  checkedAt: "2026-10-23",
  sourceLabel: "네이버 스마트플레이스 관리자 화면",
  sourceUrl: STORE.placeUrl,
};
```

`STORE`에는 다음 필드를 추가한다.

```ts
privateHire: "최대 인원 이용 시 통대관 협의",
corkage: "외부 주류 반입 가능 · 콜키지 무료",
lastOrder: "21:00",
regularClosure: "매주 월요일",
holidayClosure: "설·추석 당일",
accessibility: ["휠체어 이용 가능 출입구", "휠체어 이용 가능 좌석", "휠체어 이용 가능 화장실"],
familyFacilities: ["유아의자", "어린이밥"],
```

- [ ] **Step 5: 데이터 테스트를 통과시킨다**

Run: `node --test tests/content-model.test.mjs`

Expected: 모든 content-model 테스트 PASS.

- [ ] **Step 6: 중앙 콘텐츠 변경을 커밋한다**

```bash
git add lib/content/types.ts lib/content/store.ts tests/content-model.test.mjs
git commit -m "feat: centralize verified place and menu facts"
```

---

### Task 2: 메뉴·시설 구조화 데이터와 sitemap

**Files:**
- Modify: `lib/seo/schema.ts:1-65`
- Modify: `app/sitemap.ts:1-19`
- Test: `tests/seo-schema.test.mjs`
- Test: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: `MENU_CATEGORIES`, `MENU_ITEMS`, `STORE`
- Produces: `restaurantSchema()`의 네 개 `MenuSection`과 최신 시설 정보

- [ ] **Step 1: 구조화 데이터 실패 테스트를 작성한다**

`tests/seo-schema.test.mjs`의 import에 `MENU_CATEGORIES`를 추가하고 기존 schema 테스트의 메뉴 단언을 다음으로 바꾼다.

```js
assert.deepEqual(
  restaurant.amenityFeature.map((item) => item.name),
  ["단체 이용", "통대관", "무료주차", "유아의자", "휠체어 이용 가능"],
);
assert.equal(restaurant.hasMenu.hasMenuSection.length, MENU_CATEGORIES.length);
assert.equal(
  restaurant.hasMenu.hasMenuSection.flatMap((section) => section.hasMenuItem).length,
  MENU_ITEMS.length,
);
assert.equal(restaurant.hasMenu.hasMenuSection[0].hasMenuItem[0].offers.price, "19900");
assert.equal(JSON.stringify(restaurant).includes("AggregateRating"), false);
```

`tests/search-discovery.test.mjs`에 날짜 계약을 추가한다.

```js
assert.match(sitemap, /2026-10-23T00:00:00\+09:00/);
```

- [ ] **Step 2: 두 테스트 파일이 실패하는지 확인한다**

Run: `node --test tests/seo-schema.test.mjs tests/search-discovery.test.mjs`

Expected: 단일 `MenuSection`과 이전 sitemap 날짜 때문에 FAIL.

- [ ] **Step 3: 분류된 Menu schema를 구현한다**

`lib/seo/schema.ts` import에 `MENU_CATEGORIES`를 추가하고 `amenityFeature`와 `hasMenu`를 다음 형태로 바꾼다.

```ts
amenityFeature: [
  { "@type": "LocationFeatureSpecification", name: "단체 이용", value: true },
  { "@type": "LocationFeatureSpecification", name: "통대관", value: true, description: STORE.privateHire },
  { "@type": "LocationFeatureSpecification", name: "무료주차", value: true },
  { "@type": "LocationFeatureSpecification", name: "유아의자", value: true },
  { "@type": "LocationFeatureSpecification", name: "휠체어 이용 가능", value: true, description: STORE.accessibility.join(" · ") },
],
hasMenu: {
  "@type": "Menu",
  hasMenuSection: MENU_CATEGORIES.map((category) => ({
    "@type": "MenuSection",
    name: category.label,
    description: category.description,
    hasMenuItem: MENU_ITEMS.filter((item) => item.category === category.id).map((item) => ({
      "@type": "MenuItem",
      name: item.name,
      description: item.description,
      offers: {
        "@type": "Offer",
        price: String(item.priceAmount),
        priceCurrency: "KRW",
      },
    })),
  })),
},
```

- [ ] **Step 4: sitemap 변경일을 구현한다**

```ts
const LAST_SIGNIFICANT_UPDATE = new Date("2026-10-23T00:00:00+09:00");
```

- [ ] **Step 5: 구조화 데이터와 sitemap 테스트를 통과시킨다**

Run: `node --test tests/seo-schema.test.mjs tests/search-discovery.test.mjs`

Expected: PASS.

- [ ] **Step 6: SEO 변경을 커밋한다**

```bash
git add lib/seo/schema.ts app/sitemap.ts tests/seo-schema.test.mjs tests/search-discovery.test.mjs
git commit -m "feat: publish grouped menu and verified amenities schema"
```

---

### Task 3: 홈 V4 전환 화면

**Files:**
- Create: `components/site/menu-category-grid.tsx`
- Create: `components/site/visit-facts.tsx`
- Modify: `components/site/group-dining-panel.tsx:1-28`
- Modify: `app/page.tsx:1-171`
- Modify: `app/globals.css`
- Test: `tests/homepage-contract.test.mjs`

**Interfaces:**
- Consumes: `MENU_CATEGORIES`, `MENU_ITEMS`, `REVIEW_SNAPSHOT`, `STORE`
- Produces: `MenuCategoryGrid({ compact?: boolean })`, `VisitFacts()`

- [ ] **Step 1: V4 홈 계약 테스트를 작성한다**

`tests/homepage-contract.test.mjs`에서 V2 이름을 V4로 바꾸고 다음 단언을 추가한다.

```js
for (const phrase of [
  "회식도 가족외식도",
  "함께 끓여 더 즐거운 한 상",
  "52명 모임 상담",
  "전체 메뉴 보기",
  "메뉴 17개 최신 가격",
  "매장 뒤 무료 주차",
]) assert.match(page, new RegExp(phrase));

for (const source of ["MenuCategoryGrid", "VisitFacts", "REVIEW_SNAPSHOT"]) {
  assert.match(page, new RegExp(source));
}
assert.match(page, /placement="home_group"/);
assert.match(page, /STORE\.bookingUrl/);
assert.match(page, /STORE\.phoneHref/);
```

같은 파일의 기존 금지 정규식에서는 화면에 출처·확인일과 함께 표시할 `평점`만 제거한다. `AggregateRating`, `rating:`, `review-rating`, 확인되지 않은 메뉴명과 예약 완료·확정 표현 금지는 그대로 유지한다.

- [ ] **Step 2: 홈 계약 테스트가 실패하는지 확인한다**

Run: `node --test tests/homepage-contract.test.mjs`

Expected: V4 문구와 새 컴포넌트가 없어 FAIL.

- [ ] **Step 3: 메뉴 분류 컴포넌트를 구현한다**

`components/site/menu-category-grid.tsx`를 다음 내용으로 만든다.

```tsx
import { MENU_CATEGORIES, MENU_ITEMS } from "@/lib/content/store";

export function MenuCategoryGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`menu-category-grid${compact ? " menu-category-grid--compact" : ""}`}>
      {MENU_CATEGORIES.map((category) => {
        const items = MENU_ITEMS.filter((item) => item.category === category.id);
        const visibleItems = compact ? items.slice(0, 4) : items;
        return (
          <section className="menu-category" id={`menu-${category.id}`} key={category.id}>
            <p className="eyebrow">{category.label}</p>
            <h3>{category.description}</h3>
            <ul>
              {visibleItems.map((item) => (
                <li key={item.slug}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                    {item.minimumOrder ? <small>{item.minimumOrder}인 이상 주문</small> : null}
                  </div>
                  <span>{item.price}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: 방문 결정 정보 컴포넌트를 구현한다**

`components/site/visit-facts.tsx`를 다음 내용으로 만든다.

```tsx
import { STORE } from "@/lib/content/store";

export function VisitFacts() {
  return (
    <section className="visit-facts section-pad" aria-labelledby="visit-facts-title">
      <div className="shell visit-facts-grid">
        <div>
          <p className="eyebrow">HOURS &amp; ACCESS</p>
          <h2 id="visit-facts-title">방문 전에 이것만 확인하세요</h2>
          <dl>
            <div><dt>화~금</dt><dd>11:00~22:00 · 15:30~16:30 브레이크타임</dd></div>
            <div><dt>토·일·공휴일</dt><dd>11:00~22:00 · 브레이크타임 없음</dd></div>
            <div><dt>라스트오더</dt><dd>{STORE.lastOrder}</dd></div>
            <div><dt>휴무</dt><dd>{STORE.regularClosure} · {STORE.holidayClosure}</dd></div>
            <div><dt>주차</dt><dd>{STORE.parking}</dd></div>
          </dl>
        </div>
        <div>
          <h3>가족과 휠체어 이용자도 편안하게</h3>
          <ul>{[...STORE.familyFacilities, ...STORE.accessibility].map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: 홈과 단체 패널을 V4로 조합한다**

`app/page.tsx`의 히어로 제목·설명·행동과 ProofStrip을 다음 값으로 바꾸고, 기존 두 메뉴 미리보기 자리에 `<MenuCategoryGrid compact />`, LocationPanel 앞에 `<VisitFacts />`를 배치한다.

```tsx
title={<><span>회식도 가족외식도,</span><br />함께 끓여 더 즐거운 한 상</>}
description="매운·간장 등갈비찜 세트 1인 19,900원 · 2인 이상 · 최대 52명 단체 이용과 통대관 상담 · 무료 주차"
```

히어로 행동은 다음 세 개를 같은 순서로 둔다.

```tsx
<AnalyticsLink className="button button-primary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="home_hero">네이버 예약하기</AnalyticsLink>
<AnalyticsLink className="button button-secondary" href={STORE.phoneHref} eventName="group_inquiry_click" placement="home_hero">52명 모임 상담</AnalyticsLink>
<Link className="button button-tertiary" href="/menu">전체 메뉴 보기</Link>
```

ProofStrip은 다음 값을 사용한다.

```tsx
items={[
  `네이버 평점 ${REVIEW_SNAPSHOT.rating} / 5 · ${REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인`,
  `메뉴 ${MENU_ITEMS.length}개 최신 가격`,
  `2~${STORE.maxGroupSize}명 단체석 · 통대관 협의`,
  "매장 뒤 무료 주차",
]}
```

`components/site/group-dining-panel.tsx` 설명에는 `STORE.privateHire`, `STORE.corkage`, `주류 주문 필수 아님`을 추가하고 네이버 예약·전화 상담 CTA를 함께 둔다.

- [ ] **Step 6: V4 CSS를 구현한다**

`app/globals.css`에 다음 규칙을 추가하고 기존 767px 미디어쿼리에 모바일 한 열 규칙을 넣는다.

```css
.menu-category-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.menu-category { background: var(--hanji); border: 1px solid var(--line); border-radius: 6px; padding: 28px; }
.menu-category ul { display: grid; gap: 0; margin: 24px 0 0; padding: 0; list-style: none; }
.menu-category li { display: flex; justify-content: space-between; gap: 24px; border-top: 1px solid var(--line); padding: 18px 0; }
.menu-category li p, .menu-category li small { color: var(--muted); margin: 4px 0 0; }
.menu-category li > span { white-space: nowrap; font-weight: 700; }
.visit-facts { background: var(--paper); }
.visit-facts-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 48px; }
.visit-facts dl div { display: grid; grid-template-columns: 150px 1fr; gap: 16px; border-top: 1px solid var(--line); padding: 14px 0; }
.button-tertiary { background: var(--hanji); color: var(--ink); border: 1px solid var(--line); }
@media (max-width: 767px) {
  .menu-category-grid, .visit-facts-grid { grid-template-columns: 1fr; }
  .menu-category { padding: 22px; }
  .menu-category li { align-items: flex-start; gap: 12px; }
  .visit-facts dl div { grid-template-columns: 1fr; gap: 2px; }
}
```

- [ ] **Step 7: 홈 계약 테스트를 통과시킨다**

Run: `node --test tests/homepage-contract.test.mjs`

Expected: PASS.

- [ ] **Step 8: 홈 V4를 커밋한다**

```bash
git add app/page.tsx app/globals.css components/site/menu-category-grid.tsx components/site/visit-facts.tsx components/site/group-dining-panel.tsx tests/homepage-contract.test.mjs
git commit -m "feat: add v4 homepage conversion flow"
```

---

### Task 4: 전체 메뉴·위치·FAQ 페이지 최신화

**Files:**
- Modify: `app/menu/page.tsx`
- Modify: `app/location/page.tsx`
- Modify: `app/faq/page.tsx`
- Modify: `components/site/location-panel.tsx`
- Modify: `lib/content/store.ts`
- Test: `tests/routes-contract.test.mjs`

**Interfaces:**
- Consumes: `MenuCategoryGrid`, `VisitFacts`, `MENU_ITEMS`, `STORE`, `FAQ_ITEMS`
- Produces: 메뉴 17개 전체 렌더, 최신 방문·접근성·포장 질문

- [ ] **Step 1: 라우트 계약 테스트를 최신 사실로 바꾼다**

`tests/routes-contract.test.mjs`의 메뉴·위치·FAQ 테스트에 다음 단언을 추가한다.

```js
assert.match(read("app/menu/page.tsx"), /<MenuCategoryGrid \/>/);
assert.match(read("app/menu/page.tsx"), /육수·소스 등 동물성 재료 포함 여부/);
assert.match(read("app/menu/page.tsx"), /포장 할인/);
assert.match(read("app/location/page.tsx"), /<VisitFacts \/>/);
assert.match(read("app/location/page.tsx"), /설·추석 당일/);
assert.match(read("app/location/page.tsx"), /휠체어/);
assert.match(read("app/faq/page.tsx"), /콜키지/);
assert.match(read("app/faq/page.tsx"), /52명/);
```

기존 메뉴 페이지 테스트의 `item.price`와 `item.includes` 소스 직접 사용 단언은 삭제하고 `<MenuCategoryGrid />` 단언으로 대체한다. 가격·구성 데이터의 정확성은 `tests/content-model.test.mjs`가 담당한다.

- [ ] **Step 2: 라우트 계약이 실패하는지 확인한다**

Run: `node --test tests/routes-contract.test.mjs`

Expected: 새 컴포넌트와 문구가 없어 FAIL.

- [ ] **Step 3: 메뉴 페이지를 분류형 전체 목록으로 구현한다**

`app/menu/page.tsx`에서 기존 `MENU_ITEMS.map` 두 카드 목록을 `<MenuCategoryGrid />`로 교체한다. ProofStrip은 다음을 사용한다.

```tsx
items={[
  "매운·간장 세트 19,900원",
  "대표 세트 2인 이상",
  "수제우유빙수 후식 무료",
  "반조리 포장 할인",
]}
```

셀프바 설명 아래에 다음 문구를 추가한다.

```tsx
<p className="notice-copy">
  셀프바에서 채소를 자유롭게 선택할 수 있습니다. 완전 비건 식사가 필요하다면 육수·소스 등 동물성 재료 포함 여부를 매장에 먼저 확인해 주세요.
</p>
```

- [ ] **Step 4: 위치 페이지를 최신 운영 정보로 구현한다**

`app/location/page.tsx`에 `<VisitFacts />`를 추가하고 ProofStrip을 다음 값으로 바꾼다.

```tsx
items={[
  "화~금 11:00~22:00",
  "평일 15:30~16:30 브레이크타임",
  "월요일 · 설/추석 당일 휴무",
  "건물 뒤 무료 지상주차장",
]}
```

접근성 설명은 `STORE.accessibility.join(" · ")`을 사용한다.

- [ ] **Step 5: FAQ를 최신 질문으로 구현한다**

`lib/content/store.ts`의 FAQ에 다음 네 질문을 포함시킨다.

```ts
{ question: "한 팀 몇 명까지 이용할 수 있나요?", answer: "한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다." },
{ question: "콜키지 비용이 있나요?", answer: "외부 주류를 가져올 수 있으며 콜키지는 무료입니다. 주류 주문은 필수가 아닙니다." },
{ question: "휠체어로 이용할 수 있나요?", answer: "휠체어 이용 가능 출입구와 좌석, 화장실이 있습니다." },
{ question: "포장 메뉴는 할인되나요?", answer: "반조리 단품은 1인 14,000원, 반조리 세트는 1인 19,000원으로 준비되어 있습니다. 단품은 2인 이상 주문입니다." },
```

`tests/content-model.test.mjs`의 기존 `FAQ_ITEMS` 전체 배열 기대값 끝에도 위 네 항목을 같은 순서로 추가한다.

- [ ] **Step 6: 라우트 계약 테스트를 통과시킨다**

Run: `node --test tests/content-model.test.mjs tests/routes-contract.test.mjs`

Expected: PASS.

- [ ] **Step 7: 메뉴·위치·FAQ 변경을 커밋한다**

```bash
git add app/menu/page.tsx app/location/page.tsx app/faq/page.tsx components/site/location-panel.tsx lib/content/store.ts tests/content-model.test.mjs tests/routes-contract.test.mjs
git commit -m "feat: publish full menu and current visit information"
```

---

### Task 5: 모임·회식·가족외식 검색 콘텐츠

**Files:**
- Modify: `lib/content/stories.ts`
- Modify: `app/stories/[slug]/page.tsx`
- Test: `tests/content-model.test.mjs`
- Test: `tests/routes-contract.test.mjs`
- Test: `tests/public-visible-terms.test.mjs`

**Interfaces:**
- Consumes: `STORE.privateHire`, `STORE.corkage`, `STORE.maxGroupSize`, `MENU_ITEMS`
- Produces: 검색 질문에 직접 답하는 최신 이야기 본문과 FAQ

- [ ] **Step 1: 이야기 최신화 실패 테스트를 작성한다**

`tests/content-model.test.mjs`에 다음 단언을 추가한다.

```js
const groupStory = getStory("cheongju-group-dining");
assert.equal(groupStory?.modifiedAt, "2026-10-23");
assert.match(JSON.stringify(groupStory), /콜키지 무료/);
assert.match(JSON.stringify(groupStory), /주류 주문은 필수가 아닙니다/);
assert.match(JSON.stringify(groupStory), /설·추석 당일/);

const familyStory = getStory("family-dining-guide");
assert.equal(familyStory?.modifiedAt, "2026-10-23");
assert.match(JSON.stringify(familyStory), /어린이밥/);
assert.match(JSON.stringify(familyStory), /휠체어/);
```

`tests/public-visible-terms.test.mjs`의 group route 검사에 다음을 추가한다.

```js
assert.ok(text.includes("콜키지 무료"));
assert.ok(text.includes("주류 주문은 필수가 아닙니다"));
assert.ok(text.includes("네이버에서 예약하기"));
```

- [ ] **Step 2: 이야기 테스트가 실패하는지 확인한다**

Run: `node --test tests/content-model.test.mjs tests/routes-contract.test.mjs tests/public-visible-terms.test.mjs`

Expected: 2026-10-23 수정일과 새 문구가 없어 FAIL.

- [ ] **Step 3: 가족외식과 단체모임 이야기를 최신화한다**

`lib/content/stories.ts`의 두 story에서 `modifiedAt`을 `2026-10-23`으로 바꾸고 다음 사실을 본문에 넣는다.

```ts
{
  heading: "회식과 단체모임을 한자리에서",
  body: "2명부터 한 팀 최대 52명까지 이용할 수 있습니다. 최대 인원 이용 시 통대관으로 협의하며 날짜·시간·인원을 방문 전에 알려주세요. 주류 주문은 필수가 아니고 외부 주류 반입 시 콜키지는 무료입니다.",
  image: "/images/eomeuittul/interior.jpg",
  imageAlt: "최대 52명이 이용할 수 있는 어믜뜰 내부 좌석",
}
```

```ts
{
  heading: "아이와 휠체어 이용자도 편안하게",
  body: "간장등갈비찜과 어린이밥, 유아의자를 이용할 수 있습니다. 휠체어 이용 가능 출입구와 좌석, 화장실을 갖추고 있습니다.",
  image: "/images/eomeuittul/soy-ribs.jpg",
  imageAlt: "가족외식으로 즐기는 어믜뜰 간장등갈비찜",
}
```

- [ ] **Step 4: 단체 이야기 CTA와 메뉴 필터를 구현한다**

`app/stories/[slug]/page.tsx`의 단체 메뉴는 `category === "set"`인 두 대표 세트만 렌더하고, 기존 전화 상담과 함께 네이버 예약 CTA를 항상 표시한다.

```tsx
{MENU_ITEMS.filter((item) => item.category === "set").map((item) => (
  <article key={item.slug}>
    {item.image ? <Image src={item.image} alt={item.imageAlt ?? ""} width={640} height={420} /> : null}
    <h3>{item.name}</h3>
    <strong>{item.price}</strong>
    <p>{item.description}</p>
    {item.minimumOrder ? <p>{item.minimumOrder}인 이상 주문</p> : null}
  </article>
))}
```

- [ ] **Step 5: 이야기 계약 테스트를 통과시킨다**

Run: `node --test tests/content-model.test.mjs tests/routes-contract.test.mjs tests/public-visible-terms.test.mjs`

Expected: PASS.

- [ ] **Step 6: 이야기 변경을 커밋한다**

```bash
git add lib/content/stories.ts app/stories/[slug]/page.tsx tests/content-model.test.mjs tests/routes-contract.test.mjs tests/public-visible-terms.test.mjs
git commit -m "feat: strengthen group and family dining guides"
```

---

### Task 6: 최신 리뷰 스냅샷과 안전한 출처 표시

**Files:**
- Modify: `app/reviews/page.tsx`
- Modify: `app/reviews/reviews.module.css`
- Test: `tests/routes-contract.test.mjs`
- Test: `tests/homepage-contract.test.mjs`
- Test: `tests/seo-schema.test.mjs`

**Interfaces:**
- Consumes: `REVIEW_SNAPSHOT`, `REVIEW_ITEMS`, `STORE.placeUrl`
- Produces: 확인일이 표시된 평점 스냅샷; JSON-LD에는 평점을 추가하지 않음

- [ ] **Step 1: 리뷰 표시 계약 테스트를 작성한다**

기존 `reviews route presents checked source summaries without ratings` 테스트를 다음 계약으로 교체한다.

```js
test("reviews route shows the verified dated rating snapshot without rating schema", () => {
  const page = read("app/reviews/page.tsx");
  assert.match(page, /REVIEW_SNAPSHOT/);
  assert.match(page, /REVIEW_SNAPSHOT\.rating/);
  assert.match(page, /REVIEW_SNAPSHOT\.participants/);
  assert.match(page, /REVIEW_SNAPSHOT\.checkedAt/);
  assert.match(page, /전체 실시간 후기 데이터가 아닌/);
  assert.match(page, /href=\{REVIEW_SNAPSHOT\.sourceUrl\}/);
  assert.doesNotMatch(page, /AggregateRating/);
  assert.doesNotMatch(read("lib/seo/schema.ts"), /AggregateRating/);
});
```

`routes avoid unverified claims`의 전체 라우트 금지 정규식에서도 출처와 확인일이 있는 화면용 `평점`만 제거한다. `AggregateRating`, `rating:`, `reviewCount`와 나머지 금지 표현은 유지한다. `REVIEW_ITEMS` 자체에 평점·별점·리뷰 수를 넣지 않는 테스트도 그대로 유지한다.

- [ ] **Step 2: 리뷰 테스트가 실패하는지 확인한다**

Run: `node --test tests/routes-contract.test.mjs tests/homepage-contract.test.mjs tests/seo-schema.test.mjs`

Expected: 2026-07-19 문구와 `REVIEW_SNAPSHOT` 미사용으로 FAIL.

- [ ] **Step 3: 리뷰 스냅샷 UI를 구현한다**

`app/reviews/page.tsx`에 `REVIEW_SNAPSHOT`을 import하고 ProofStrip과 근거 헤더를 다음처럼 바꾼다.

```tsx
<ProofStrip items={[
  `네이버 평점 ${REVIEW_SNAPSHOT.rating} / 5`,
  `${REVIEW_SNAPSHOT.participants}명 참여`,
  `${REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인`,
  "네이버 원문 링크",
]} />
```

```tsx
<aside className={styles.ratingSnapshot} aria-label="확인일 기준 네이버 평점">
  <strong>{REVIEW_SNAPSHOT.rating} / 5</strong>
  <span>{REVIEW_SNAPSHOT.participants}명 참여</span>
  <time dateTime={REVIEW_SNAPSHOT.checkedAt}>{REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인</time>
  <a href={REVIEW_SNAPSHOT.sourceUrl} target="_blank" rel="noreferrer">네이버에서 최신 정보 보기</a>
</aside>
```

설명에는 `전체 실시간 후기 데이터가 아닌 확인일 기준 관리자 화면 스냅샷`임을 명시한다.

- [ ] **Step 4: 리뷰 스냅샷 스타일을 구현한다**

```css
.ratingSnapshot { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; margin-top: 24px; padding: 24px; background: #fffdf8; border: 1px solid #d8cbb8; border-radius: 6px; }
.ratingSnapshot strong { font-size: 32px; color: #a52a24; }
.ratingSnapshot a { min-height: 48px; display: inline-flex; align-items: center; font-weight: 700; text-decoration: underline; }
@media (max-width: 767px) { .ratingSnapshot { align-items: flex-start; flex-direction: column; } }
```

- [ ] **Step 5: 리뷰 관련 테스트를 통과시킨다**

Run: `node --test tests/routes-contract.test.mjs tests/homepage-contract.test.mjs tests/seo-schema.test.mjs`

Expected: PASS, `AggregateRating` 없음.

- [ ] **Step 6: 리뷰 변경을 커밋한다**

```bash
git add app/reviews/page.tsx app/reviews/reviews.module.css tests/routes-contract.test.mjs tests/homepage-contract.test.mjs tests/seo-schema.test.mjs
git commit -m "feat: show verified dated review snapshot"
```

---

### Task 7: 전체 회귀 검사와 시각 검수

**Files:**
- Modify when required by failures: files changed in Tasks 1-6
- Test: all `tests/*.test.mjs`

**Interfaces:**
- Consumes: 완성된 V4 공개 사이트
- Produces: 로컬 승인용 데스크톱·모바일 검증 결과

- [ ] **Step 1: 전체 단위·계약 테스트를 실행한다**

Run: `npm test`

Expected: 모든 테스트 PASS.

- [ ] **Step 2: lint를 실행한다**

Run: `npm run lint`

Expected: ESLint error 0건.

- [ ] **Step 3: production build를 실행한다**

Run: `npm run build -- --webpack`

Expected: Next.js production build 성공, `/`, `/menu`, `/location`, `/faq`, `/reviews`, `/stories/cheongju-group-dining` 생성 성공.

- [ ] **Step 4: 로컬 서버를 실행한다**

Run: `npm run dev -- --hostname 127.0.0.1 --port 3016`

Expected: `http://127.0.0.1:3016`에서 응답.

- [ ] **Step 5: 데스크톱 화면을 검수한다**

확인 URL과 기준:

- `/`: 히어로 CTA 3개, 평점·17개 메뉴·52명·무료 주차, 메뉴 분류, 단체 CTA
- `/menu`: 메뉴 17개, 네 분류, 가격, 2인 조건, 비건 주의문
- `/location`: 최신 시간·휴무·주차·접근성
- `/reviews`: 4.94/5, 362명, 2026.10.23, 출처 링크
- `/stories/cheongju-group-dining`: 52명, 통대관, 콜키지 무료, 전화·예약 CTA

Expected: Pencil V4의 정보 위계와 순서가 일치하고 가로 넘침이 없음.

- [ ] **Step 6: 390px 모바일 화면을 검수한다**

확인 기준:

- 하단 전화·길찾기·예약 바가 콘텐츠를 가리지 않음
- 모든 버튼 높이 44px 이상
- 메뉴 분류와 방문 정보가 한 열
- 히어로 CTA가 겹치지 않음
- 영상 실패 시 포스터와 CTA 유지

Expected: 390px에서 가로 스크롤 없음.

- [ ] **Step 7: 운영 전 검증 수정만 별도 커밋한다**

```bash
git add app components lib tests
git commit -m "fix: resolve v4 verification findings"
```

검증 수정이 없으면 이 커밋 단계는 건너뛴다.

---

### Task 8: Draft PR, 최종 승인, 배포와 검색 재수집

**Files:**
- No code changes unless CI reports a failure

**Interfaces:**
- Consumes: Task 7의 통과된 브랜치
- Produces: 검토 가능한 Draft PR, 사용자 최종 승인 후 운영 배포

- [ ] **Step 1: 브랜치 상태와 변경 범위를 확인한다**

Run: `git status --short && git log --oneline --decorate -8`

Expected: 계획과 무관한 tracked 변경 없음. 기존 untracked `docs/superpowers/plans/2026-07-27-search-indexing-completion.md`는 건드리지 않음.

- [ ] **Step 2: 원격 브랜치에 푸시한다**

Run: `git push -u origin codex/eomeutteull-search-growth-implementation`

Expected: push 성공.

- [ ] **Step 3: Draft PR을 생성하거나 기존 PR을 갱신한다**

PR 본문에는 다음을 포함한다.

```markdown
## 변경 내용
- 네이버 확인 기준 메뉴 17개와 영업 정보 최신화
- 최대 52명·통대관·무료 주차 예약 전환 강화
- 청주갈비찜·회식·가족외식 검색 답변형 콘텐츠
- 확인일이 있는 네이버 리뷰 평점 스냅샷
- Menu/FAQ/Restaurant schema와 sitemap 최신화

## 검증
- npm test
- npm run lint
- npm run build -- --webpack
- 데스크톱·390px 모바일 수동 검수

## 배포 제한
- 사용자 최종 승인 전 production merge/deploy 금지
```

Expected: Draft PR 생성, CI 통과.

- [ ] **Step 4: 사용자에게 최종 화면과 검증 결과를 제시한다**

제시 항목:

- 홈·메뉴·위치·후기·단체 가이드 데스크톱 화면
- 홈·메뉴 390px 모바일 화면
- 메뉴 17개와 가격 대조표
- 테스트·lint·build 결과
- 네이버 예약 URL 확인 결과

Expected: 사용자가 production 게시 여부를 판단할 수 있음.

- [ ] **Step 5: production 게시 직전 사용자 최종 승인을 받는다**

승인 문구: `홈페이지 V4 운영 배포 승인`

Expected: 명시적 승인 전에는 다음 단계로 가지 않음.

- [ ] **Step 6: 승인 후 PR을 merge하고 Vercel 배포를 확인한다**

Run: `gh pr merge --squash --delete-branch=false`

Expected: merge 성공, Vercel production deployment Ready.

- [ ] **Step 7: 운영 URL을 검증한다**

확인 URL:

- `https://eomeutteull.com/`
- `https://eomeutteull.com/menu`
- `https://eomeutteull.com/location`
- `https://eomeutteull.com/reviews`
- `https://eomeutteull.com/stories/cheongju-group-dining`
- `https://eomeutteull.com/sitemap.xml`
- `https://eomeutteull.com/robots.txt`

Expected: 모두 HTTP 200, canonical 도메인 일치, 예약 버튼이 현재 Naver item으로 이동.

- [ ] **Step 8: Google과 네이버에 재수집을 요청한다**

Google Search Console:

- sitemap `https://eomeutteull.com/sitemap.xml` 상태 확인
- `/`, `/menu`, `/reviews`, `/stories/cheongju-group-dining` URL 검사 및 색인 요청

네이버 서치어드바이저:

- sitemap 상태 확인
- 동일 네 URL 수집 요청

Expected: 요청 접수 상태 확인. 검색 순위 상승을 완료 조건으로 사용하지 않음.
