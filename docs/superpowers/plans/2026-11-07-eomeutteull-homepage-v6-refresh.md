# 어믜뜰 홈페이지 V6 최신화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2026-11-07 네이버 스마트플레이스 검증값을 단일 콘텐츠 모델에 반영하고, 홈페이지에 최신 정보 스트립과 방문 목적 3개 카드를 추가해 메뉴 확인·가족외식 안내·모임 상담·네이버 예약 행동을 명확히 연결한다.

**Architecture:** `lib/content/store.ts`가 영업시간·메뉴·편의시설·후기 스냅샷·방문 목적·홈 FAQ의 단일 기준이 된다. 서버 컴포넌트인 `LatestStoreFacts`와 `VisitIntentGrid`는 중앙 데이터를 파생해 공개 HTML을 만들고, `AnalyticsLink`는 기본 링크 이동을 막지 않은 채 `visit_intent_click`만 추가한다. 화면 FAQ와 FAQPage JSON-LD는 동일한 `HOME_FAQ_ITEMS` 배열을 사용하며, 네이버의 제3자 리뷰 수치는 화면 스냅샷으로만 표시하고 Restaurant 스키마에는 넣지 않는다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS, Node.js `node:test`, pnpm, Vercel Preview

## Global Constraints

- Pencil 원본은 `C:\vibecoding\my-shop\초안`, 승인 프레임은 `v6h0001` (`홈페이지 V6 최신화와 방문 목적 선택 Pencil 승인안`)이다.
- 기존 브랜드 영상, 식사 4단계, 메뉴, V5 모임·회식, 승인 후기, FAQ, 오시는 길을 유지한다.
- 홈페이지 H1은 한 개이고 canonical은 `https://eomeutteull.com/`이다.
- 검색 의도는 `청주갈비찜`, `청주 회식`, `청주 가족외식`이며 중복 랜딩페이지를 만들지 않는다.
- 2026-11-07 검증 영업값은 화~금 11:00~22:00, 15:30~16:30 브레이크타임, 토~일 11:00~22:00, 라스트오더 21:00, 매주 월요일 및 설·추석 당일 휴무다.
- 대표 세트는 매운등갈비찜·간장등갈비찜 1인 19,900원, 2인 이상 주문이며 공개 메뉴는 17개다.
- 주차는 건물 뒤 무료 지상주차장이고, 스마트플레이스에서 점심시간 및 17시 이후 매장 앞 도로 주차 가능 문구를 확인했다.
- 단체는 2~52명, 최대 인원 이용 시 통대관 협의이며 날짜·시간·예상 인원을 사전 상담한다.
- 공개 리뷰 스냅샷은 평점 4.94, 평점 425개, 389명 참여, 방문자 리뷰 446개, 블로그 리뷰 213개, 상단 전체 표시 666개, 확인일 2026-11-07이다.
- 방문자·블로그·상단 전체 리뷰 수치는 서로 다른 네이버 분류이므로 합산하거나 재계산하지 않는다.
- 스마트플레이스에 유지 중인 `비건 메뉴`, `카운터석`, `방문접수/출장` 표시는 홈페이지 확정 홍보 문구로 확대하지 않는다.
- 방문자 닉네임과 리뷰 전문을 복제하지 않고 반복적으로 확인된 장점만 요약한다.
- `AggregateRating`과 `Review` 구조화 데이터를 추가하지 않는다.
- 1440px, 390px, 320px에서 검사하고 모든 행동 링크는 최소 48px 높이를 유지한다.
- 운영 배포와 `main` 병합은 사용자 최종 승인 전까지 HOLD다.

## File Map

- Modify: `lib/content/types.ts` — 검증일과 방문 목적 데이터 타입
- Modify: `lib/content/store.ts` — 2026-11-07 검증값, 홈 FAQ, 방문 목적 단일 데이터
- Modify: `app/reviews/page.tsx` — 리뷰 설명 날짜를 중앙 스냅샷에서 파생
- Create: `components/site/latest-store-facts.tsx` — 최신 운영 정보 스트립
- Create: `components/site/visit-intent-grid.tsx` — 처음 방문·가족외식·모임회식 3개 카드
- Modify: `components/site/analytics-link.tsx` — `visit_intent_click` 허용
- Modify: `app/page.tsx` — V6 섹션 순서, 홈 FAQ, 히어로 메뉴 행동 연결
- Modify: `app/globals.css` — 데스크톱 3열, 모바일 1열, 320px 줄바꿈
- Modify: `app/sitemap.ts` — 실제 변경된 `/`와 `/reviews` 수정일
- Modify: `tests/content-model.test.mjs` — 검증값과 중앙 콘텐츠 계약
- Modify: `tests/homepage-contract.test.mjs` — V6 구성·순서·반응형 계약
- Modify: `tests/analytics-contract.test.mjs` — 신규 행동 이벤트 계약
- Modify: `tests/seo-schema.test.mjs` — 화면 FAQ와 JSON-LD 동일성 및 평점 스키마 금지
- Modify: `tests/search-discovery.test.mjs` — sitemap 날짜와 URL 중복 방지
- Modify: `tests/routes-contract.test.mjs` — 최신 후기 확인일 계약

---

### Task 1: 검증된 중앙 콘텐츠와 리뷰 스냅샷

**Files:**
- Modify: `lib/content/types.ts`
- Modify: `lib/content/store.ts`
- Modify: `app/reviews/page.tsx`
- Modify: `tests/content-model.test.mjs`
- Modify: `tests/routes-contract.test.mjs`

**Interfaces:**
- Produces: `STORE.verifiedAt: string`, `STORE.verificationSource: string`
- Produces: `HOME_FAQ_ITEMS: readonly FaqItem[]`
- Produces: `VISIT_INTENT_ITEMS: readonly VisitIntentItem[]`
- Produces: `VisitIntentItem` with `id`, `number`, `label`, `title`, `summary`, `href`, `ctaLabel`, `placement`, `featured`
- Produces: `REVIEW_SNAPSHOT` with the exact 2026-11-07 public values
- Consumes: existing `STORE`, `MENU_ITEMS`, `FaqItem`, `ReviewSnapshot`

- [ ] **Step 1: Write the failing central-content tests**

Add `HOME_FAQ_ITEMS` and `VISIT_INTENT_ITEMS` to the import in `tests/content-model.test.mjs`, replace the review snapshot expectation, and add these tests:

```js
test("V6 store facts carry the 2026-11-07 verification source", () => {
  assert.equal(STORE.verifiedAt, "2026-11-07");
  assert.equal(
    STORE.verificationSource,
    "네이버 스마트플레이스·공개 플레이스",
  );
  assert.equal(STORE.lastOrder, "21:00");
  assert.equal(STORE.regularClosure, "매주 월요일");
  assert.equal(STORE.holidayClosure, "설·추석 당일");
  assert.equal(STORE.maxGroupSize, 52);
  assert.equal(STORE.privateHire, "최대 인원 이용 시 통대관 협의");
});

test("V6 home direct answers are centralized and numeric", () => {
  assert.deepEqual(HOME_FAQ_ITEMS, [
    {
      question: "처음 방문하면 무엇을 주문하나요?",
      answer:
        "매운 등갈비찜 또는 간장 등갈비찜 세트는 1인 19,900원이며 2인 이상 주문합니다. 셀프바에서 고른 재료를 함께 끓여 먹습니다.",
    },
    {
      question: "아이와 함께 먹을 수 있나요?",
      answer:
        "맵지 않은 간장 등갈비찜과 어린이밥이 있고 유아의자를 이용할 수 있습니다. 휠체어 이용 가능 출입구·좌석·화장실도 등록되어 있습니다.",
    },
    {
      question: "회식은 몇 명까지 가능한가요?",
      answer:
        "한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다. 날짜·시간·예상 인원을 전화로 알려주세요.",
    },
    {
      question: "주차와 예약은 어떻게 하나요?",
      answer:
        "건물 뒤 무료 지상주차장을 이용할 수 있습니다. 일반 식사는 네이버 예약, 단체·통대관은 전화 상담을 이용합니다.",
    },
  ]);
});

test("V6 visit intents expose three crawlable next steps", () => {
  assert.deepEqual(
    VISIT_INTENT_ITEMS.map(
      ({ id, href, placement, featured }) => ({
        id,
        href,
        placement,
        featured: Boolean(featured),
      }),
    ),
    [
      {
        id: "first-visit",
        href: "/menu",
        placement: "home_intent_first_visit",
        featured: false,
      },
      {
        id: "family-dining",
        href: "/stories/family-dining-guide",
        placement: "home_intent_family_dining",
        featured: false,
      },
      {
        id: "group-dining",
        href: "/stories/cheongju-group-dining",
        placement: "home_intent_group_dining",
        featured: true,
      },
    ],
  );
});

test("review snapshot records the verified public Naver counts without deriving totals", () => {
  assert.deepEqual(REVIEW_SNAPSHOT, {
    rating: 4.94,
    ratingCount: 425,
    participants: 389,
    visitorReviewCount: 446,
    blogReviewCount: 213,
    totalDisplayedReviewCount: 666,
    checkedAt: "2026-11-07",
    sourceLabel: "네이버 플레이스 공개 리뷰 화면",
    sourceUrl: STORE.reviewUrl,
  });
  assert.notEqual(
    REVIEW_SNAPSHOT.totalDisplayedReviewCount,
    REVIEW_SNAPSHOT.visitorReviewCount + REVIEW_SNAPSHOT.blogReviewCount,
  );
});
```

In `tests/routes-contract.test.mjs`, change the review evidence assertion to:

```js
assert.equal(review.checkedAt, "2026-11-07");
```

In the existing `central review summaries are current, sourced, and safe` test, use:

```js
assert.equal(review.checkedAt, "2026-11-07");
```

In the existing `review FAQ answers visit-intent questions from central verified facts` expectation, use this first record while leaving the remaining three records unchanged:

```js
{
  question: "어믜뜰 후기에서 가장 많이 언급되는 장점은 무엇인가요?",
  answer:
    "2026년 11월 7일 확인한 네이버 방문자 반응에서는 음식의 맛과 고기 품질이 가장 많이 언급됐고, 친절한 응대와 넉넉한 양, 넓은 매장도 반복적으로 언급됐습니다.",
},
```

Keep the `cheongju-galbijjim-guide` story date at `2026-10-24`; that story is not edited by V6.

- [ ] **Step 2: Run the targeted tests and verify RED**

Run:

```powershell
pnpm exec node --test tests/content-model.test.mjs tests/routes-contract.test.mjs
```

Expected: FAIL because `STORE.verifiedAt`, `HOME_FAQ_ITEMS`, and `VISIT_INTENT_ITEMS` do not exist and the old review snapshot is dated 2026-10-24.

- [ ] **Step 3: Add the exact data types**

Add to `lib/content/types.ts`:

```ts
export type VisitIntentId =
  | "first-visit"
  | "family-dining"
  | "group-dining";

export type VisitIntentItem = {
  id: VisitIntentId;
  number: "01" | "02" | "03";
  label: string;
  title: string;
  summary: string;
  href: string;
  ctaLabel: string;
  placement: string;
  featured?: boolean;
};
```

Add these fields to `StoreInfo`:

```ts
verifiedAt: string;
verificationSource: string;
```

- [ ] **Step 4: Implement the verified central content**

Import `VisitIntentItem` in `lib/content/store.ts`, add these `STORE` fields, replace the review snapshot, add the home FAQ, and add the visit-intent array:

```ts
verifiedAt: "2026-11-07",
verificationSource: "네이버 스마트플레이스·공개 플레이스",
```

```ts
export const REVIEW_SNAPSHOT: ReviewSnapshot = {
  rating: 4.94,
  ratingCount: 425,
  participants: 389,
  visitorReviewCount: 446,
  blogReviewCount: 213,
  totalDisplayedReviewCount: 666,
  checkedAt: "2026-11-07",
  sourceLabel: "네이버 플레이스 공개 리뷰 화면",
  sourceUrl: STORE.reviewUrl,
};
```

```ts
const signatureSet = MENU_ITEMS.find((item) => item.slug === "spicy-set")!;

export const HOME_FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "처음 방문하면 무엇을 주문하나요?",
    answer: `매운 등갈비찜 또는 간장 등갈비찜 세트는 1인 ${signatureSet.price}이며 ${signatureSet.minimumOrder}인 이상 주문합니다. 셀프바에서 고른 재료를 함께 끓여 먹습니다.`,
  },
  {
    question: "아이와 함께 먹을 수 있나요?",
    answer:
      "맵지 않은 간장 등갈비찜과 어린이밥이 있고 유아의자를 이용할 수 있습니다. 휠체어 이용 가능 출입구·좌석·화장실도 등록되어 있습니다.",
  },
  {
    question: "회식은 몇 명까지 가능한가요?",
    answer: `한 팀 최대 ${STORE.maxGroupSize}명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다. 날짜·시간·예상 인원을 전화로 알려주세요.`,
  },
  {
    question: "주차와 예약은 어떻게 하나요?",
    answer:
      "건물 뒤 무료 지상주차장을 이용할 수 있습니다. 일반 식사는 네이버 예약, 단체·통대관은 전화 상담을 이용합니다.",
  },
];

export const VISIT_INTENT_ITEMS: readonly VisitIntentItem[] = [
  {
    id: "first-visit",
    number: "01",
    label: "처음 방문",
    title: "메뉴를 고르고 셀프바와 함께 끓여요",
    summary:
      "매운맛·간장맛 선택 → 채소와 사리 담기 → 샤브처럼 끓이기 → 수제우유빙수",
    href: "/menu",
    ctaLabel: "메뉴와 이용 방법 보기",
    placement: "home_intent_first_visit",
  },
  {
    id: "family-dining",
    number: "02",
    label: "가족외식",
    title: "아이부터 부모님까지 함께 고르기 좋은 메뉴",
    summary:
      "맵지 않은 간장맛 · 어린이밥 · 유아의자 · 휠체어 이용 가능 출입구·좌석·화장실",
    href: "/stories/family-dining-guide",
    ctaLabel: "가족 방문 정보 보기",
    placement: "home_intent_family_dining",
  },
  {
    id: "group-dining",
    number: "03",
    label: "모임·회식",
    title: `2명부터 한 팀 최대 ${STORE.maxGroupSize}명까지`,
    summary: `${STORE.seats} · ${STORE.privateHire} · 건물 뒤 무료 지상주차장 · 날짜·시간·예상 인원 상담`,
    href: "/stories/cheongju-group-dining",
    ctaLabel: "단체 이용 자세히 보기",
    placement: "home_intent_group_dining",
    featured: true,
  },
];
```

Change every `REVIEW_ITEMS[*].checkedAt` to `"2026-11-07"`. Change the first `REVIEW_FAQ_ITEMS` answer to:

```ts
answer:
  "2026년 11월 7일 확인한 네이버 방문자 반응에서는 음식의 맛과 고기 품질이 가장 많이 언급됐고, 친절한 응대와 넉넉한 양, 넓은 매장도 반복적으로 언급됐습니다.",
```

In `app/reviews/page.tsx`, derive the metadata description from the snapshot:

```ts
description: `${REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 네이버 플레이스에서 확인한 어믜뜰 평점과 방문자 반응을 바탕으로 청주갈비찜, 가족외식, 회식 이용 정보를 안내합니다.`,
```

- [ ] **Step 5: Run the targeted tests and verify GREEN**

Run:

```powershell
pnpm exec node --test tests/content-model.test.mjs tests/routes-contract.test.mjs
```

Expected: both files PASS, including exact review counts and 2026-11-07 evidence dates.

- [ ] **Step 6: Commit the central facts**

```powershell
git add lib/content/types.ts lib/content/store.ts app/reviews/page.tsx tests/content-model.test.mjs tests/routes-contract.test.mjs
git commit -m "feat: refresh verified store facts"
```

---

### Task 2: 최신 매장 정보와 방문 목적 컴포넌트

**Files:**
- Create: `components/site/latest-store-facts.tsx`
- Create: `components/site/visit-intent-grid.tsx`
- Modify: `components/site/analytics-link.tsx`
- Modify: `tests/homepage-contract.test.mjs`
- Modify: `tests/analytics-contract.test.mjs`

**Interfaces:**
- Consumes: `STORE.verifiedAt`, `STORE.verificationSource`, `STORE.openingPeriods`, `STORE.maxGroupSize`, `STORE.privateHire`, `MENU_ITEMS`, `VISIT_INTENT_ITEMS`
- Produces: `LatestStoreFacts(): JSX.Element`
- Produces: `VisitIntentGrid(): JSX.Element`
- Extends: `AnalyticsEventName` with `"visit_intent_click"`

- [ ] **Step 1: Write failing component and analytics contracts**

Add to `tests/homepage-contract.test.mjs`:

```js
test("V6 latest facts derive all changing values from central content", () => {
  const facts = read("components/site/latest-store-facts.tsx");
  for (const field of [
    "verifiedAt",
    "verificationSource",
    "openingPeriods",
    "regularClosure",
    "parking",
    "maxGroupSize",
    "privateHire",
  ]) {
    assert.ok(facts.includes(`STORE.${field}`), field);
  }
  assert.match(facts, /MENU_ITEMS\.find/);
  assert.match(facts, /<time dateTime=\{STORE\.verifiedAt\}>/);
  assert.doesNotMatch(facts, /19,900원|52명|2026-11-07/);
});

test("V6 visit cards use central content and tracked crawlable links", () => {
  const grid = read("components/site/visit-intent-grid.tsx");
  assert.match(grid, /VISIT_INTENT_ITEMS\.map/);
  assert.match(grid, /eventName="visit_intent_click"/);
  assert.match(grid, /placement=\{item\.placement\}/);
  assert.match(grid, /href=\{item\.href\}/);
  assert.match(grid, /item\.ctaLabel/);
  assert.doesNotMatch(grid, /preventDefault/);
});
```

Add to `tests/analytics-contract.test.mjs`:

```js
test("V6 visit-intent event is approved without blocking navigation", () => {
  const link = read("components/site/analytics-link.tsx");
  const grid = read("components/site/visit-intent-grid.tsx");
  assert.match(link, /"visit_intent_click"/);
  assert.match(grid, /eventName="visit_intent_click"/);
  assert.doesNotMatch(`${link}\n${grid}`, /preventDefault/);
});
```

- [ ] **Step 2: Run the targeted tests and verify RED**

Run:

```powershell
pnpm exec node --test tests/homepage-contract.test.mjs tests/analytics-contract.test.mjs
```

Expected: FAIL because both V6 components are absent and `visit_intent_click` is not in the analytics event union.

- [ ] **Step 3: Implement `LatestStoreFacts`**

Create `components/site/latest-store-facts.tsx`:

```tsx
import { MENU_ITEMS, STORE } from "@/lib/content/store";

export function LatestStoreFacts() {
  const signatureSet = MENU_ITEMS.find((item) => item.slug === "spicy-set")!;
  const [weekdayLunch, weekdayDinner, weekend] = STORE.openingPeriods;
  const facts = [
    {
      label: "영업",
      value: `화~금 ${weekdayLunch.opens}~${weekdayDinner.closes} · ${weekdayLunch.closes}~${weekdayDinner.opens} 브레이크 · 토~일 ${weekend.opens}~${weekend.closes} · ${STORE.regularClosure}`,
    },
    {
      label: "대표 세트",
      value: `매운·간장 ${signatureSet.price} · ${signatureSet.minimumOrder}인 이상`,
    },
    { label: "주차", value: STORE.parking },
    {
      label: "단체",
      value: `2~${STORE.maxGroupSize}명 · ${STORE.privateHire}`,
    },
  ] as const;

  return (
    <section
      className="latest-store-facts"
      aria-labelledby="latest-store-facts-title"
    >
      <div className="shell latest-store-facts-inner">
        <div className="latest-store-facts-heading">
          <div>
            <p className="eyebrow">LATEST STORE FACTS</p>
            <h2 id="latest-store-facts-title">한눈에 보는 최신 매장 정보</h2>
          </div>
          <p className="latest-store-facts-source">
            {STORE.verificationSource} ·{" "}
            <time dateTime={STORE.verifiedAt}>
              {STORE.verifiedAt.replaceAll("-", ".")} 확인
            </time>
          </p>
        </div>
        <dl className="latest-store-facts-grid">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Implement `VisitIntentGrid` and approve the analytics event**

Create `components/site/visit-intent-grid.tsx`:

```tsx
import { AnalyticsLink } from "@/components/site/analytics-link";
import { VISIT_INTENT_ITEMS } from "@/lib/content/store";

export function VisitIntentGrid() {
  return (
    <section
      className="visit-intents section-pad"
      aria-labelledby="visit-intents-title"
    >
      <div className="shell">
        <div className="visit-intents-heading">
          <p className="eyebrow">CHOOSE YOUR VISIT</p>
          <h2 id="visit-intents-title">어떤 자리로 오시나요?</h2>
          <p>각 상황에 필요한 정보와 다음 행동을 바로 보여드립니다.</p>
        </div>
        <div className="visit-intent-grid">
          {VISIT_INTENT_ITEMS.map((item) => (
            <article
              className={`visit-intent-card${
                item.featured ? " visit-intent-card--featured" : ""
              }`}
              key={item.id}
            >
              <p className="visit-intent-label">
                {item.number} · {item.label}
              </p>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <AnalyticsLink
                className="visit-intent-link"
                href={item.href}
                eventName="visit_intent_click"
                placement={item.placement}
              >
                {item.ctaLabel} <span aria-hidden="true">→</span>
              </AnalyticsLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

Extend the event union in `components/site/analytics-link.tsx`:

```ts
type AnalyticsEventName =
  | "naver_reservation_click"
  | "naver_map_click"
  | "phone_click"
  | "group_inquiry_click"
  | "visit_intent_click";
```

- [ ] **Step 5: Run the targeted tests and verify GREEN**

Run:

```powershell
pnpm exec node --test tests/homepage-contract.test.mjs tests/analytics-contract.test.mjs
```

Expected: both files PASS; every card remains a normal crawlable `<a href>` when GA is unavailable.

- [ ] **Step 6: Commit the V6 components**

```powershell
git add components/site/latest-store-facts.tsx components/site/visit-intent-grid.tsx components/site/analytics-link.tsx tests/homepage-contract.test.mjs tests/analytics-contract.test.mjs
git commit -m "feat: add homepage visit intent choices"
```

---

### Task 3: 홈페이지 통합과 반응형 레이아웃

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/homepage-contract.test.mjs`

**Interfaces:**
- Consumes: `LatestStoreFacts`, `VisitIntentGrid`, `HOME_FAQ_ITEMS`
- Produces: V6 homepage order and the hero `home_hero_menu` visit-intent event
- Preserves: `loadPublicOnlineReviews(3)` with `REVIEW_ITEMS` fallback

- [ ] **Step 1: Replace the V4 homepage order contract with V6 expectations**

Rename every `home V4 ...` test title in `tests/homepage-contract.test.mjs` to `home V6 ...`. In the first component-presence test, replace the component list with:

```js
[
  "HeroMedia",
  "LatestStoreFacts",
  "VisitIntentGrid",
  "ExperienceSteps",
  "ReservationCta",
  "LocationPanel",
  "FaqList",
  "JsonLd",
  "MenuCategoryGrid",
  "VisitFacts",
]
```

`ProofStrip` must no longer be required.

Update the component list and section-order test in `tests/homepage-contract.test.mjs` to this exact order:

```js
const sections = [
  "<HeroMedia",
  "<LatestStoreFacts",
  "<VisitIntentGrid",
  'className="brand-story',
  "<ExperienceSteps",
  'className="menu-preview',
  "<GroupDiningPanel",
  "<ReservationCta",
  'className="review-preview',
  'className="faq-section',
  "<VisitFacts",
  "<LocationPanel",
];
```

Update that test's visual-block matcher to include `LatestStoreFacts|VisitIntentGrid`, remove `ProofStrip`, and expect `12` blocks.

In the central-content test, require only these homepage imports:

```js
for (const source of ["HOME_FAQ_ITEMS", "MENU_ITEMS", "REVIEW_ITEMS", "STORE"]) {
  assert.match(page, new RegExp(source));
}
```

Delete the old `home V4 labels its verified rating with source and checked date` test. The new `LatestStoreFacts` contract owns verification-source and date coverage.

Replace the home FAQ assertions with:

```js
assert.match(page, /const homeFaqs = HOME_FAQ_ITEMS/);
assert.match(page, /faqSchema\(homeFaqs\)/);
assert.match(page, /<FaqList items=\{homeFaqs\}/);
```

In the hero-action test, keep the first two action expectations and replace the third-action expectation with:

```js
assert.match(actions[2], /className="button button-tertiary"/);
assert.match(actions[2], /href="\/menu"/);
assert.match(actions[2], /eventName="visit_intent_click"/);
assert.match(actions[2], /placement="home_hero_menu"/);
```

Add responsive assertions:

```js
assert.match(
  styles,
  /\.visit-intent-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/,
);
assert.match(
  styles,
  /@media \(max-width: 767px\)[\s\S]*?\.visit-intent-grid,[\s\S]*?\.latest-store-facts-grid\s*\{[^}]*grid-template-columns:\s*1fr/,
);
assert.match(styles, /\.visit-intent-link\s*\{[^}]*min-height:\s*48px/);
assert.match(styles, /@media \(max-width: 360px\)/);
```

- [ ] **Step 2: Run the homepage contract and verify RED**

Run:

```powershell
pnpm exec node --test tests/homepage-contract.test.mjs
```

Expected: FAIL because the new components, central home FAQ, event placement, and V6 CSS are not mounted.

- [ ] **Step 3: Integrate the V6 sections into `app/page.tsx`**

Add imports:

```tsx
import { LatestStoreFacts } from "@/components/site/latest-store-facts";
import { VisitIntentGrid } from "@/components/site/visit-intent-grid";
```

Import `HOME_FAQ_ITEMS` and remove `FAQ_ITEMS` and `REVIEW_SNAPSHOT` from the central-content import. Remove the `ProofStrip` import. Change:

```tsx
const homeFaqs = HOME_FAQ_ITEMS;
```

Replace the hero menu `Link` with:

```tsx
<AnalyticsLink
  className="button button-tertiary"
  href="/menu"
  eventName="visit_intent_click"
  placement="home_hero_menu"
>
  전체 메뉴 보기
</AnalyticsLink>
```

Replace the homepage `<ProofStrip>` block with:

```tsx
<LatestStoreFacts />
<VisitIntentGrid />
```

Keep the remaining order exactly as defined in Step 1. Keep the `Link` import because the review section still links to `/reviews`.

- [ ] **Step 4: Add exact desktop and mobile styles**

Add to `app/globals.css`:

```css
.latest-store-facts {
  background: var(--red-dark);
  color: var(--white);
}

.latest-store-facts-inner {
  padding: 28px 0;
}

.latest-store-facts-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 22px;
}

.latest-store-facts-heading h2,
.visit-intents-heading h2 {
  margin: 6px 0 0;
  font-size: 36px;
  line-height: 1.25;
}

.latest-store-facts-source {
  margin: 0;
  color: var(--hanji);
  text-align: right;
}

.latest-store-facts-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1px;
  margin: 0;
  background: rgb(255 255 255 / 24%);
}

.latest-store-facts-grid > div {
  min-width: 0;
  background: var(--red-dark);
  padding: 18px;
}

.latest-store-facts-grid dt {
  color: var(--straw);
  font-weight: 700;
}

.latest-store-facts-grid dd {
  margin: 8px 0 0;
  overflow-wrap: anywhere;
  line-height: 1.55;
}

.visit-intents {
  background: var(--hanji);
}

.visit-intents-heading {
  max-width: 760px;
  margin-bottom: 28px;
}

.visit-intents-heading > p:last-child {
  color: var(--muted);
}

.visit-intent-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.visit-intent-card {
  display: flex;
  min-width: 0;
  min-height: 390px;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--paper);
  padding: 28px;
}

.visit-intent-card--featured {
  border-color: var(--green);
  background: var(--green);
  color: var(--white);
}

.visit-intent-label {
  margin: 0 0 18px;
  color: var(--red);
  font-weight: 700;
}

.visit-intent-card--featured .visit-intent-label {
  color: var(--straw);
}

.visit-intent-card h3 {
  margin: 0 0 18px;
  overflow-wrap: anywhere;
  font-size: 28px;
  line-height: 1.3;
}

.visit-intent-card > p:not(.visit-intent-label) {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.visit-intent-card--featured > p:not(.visit-intent-label) {
  color: var(--hanji);
}

.visit-intent-link {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 24px;
  color: var(--green);
  font-weight: 700;
}

.visit-intent-card--featured .visit-intent-link {
  color: var(--white);
}

@media (max-width: 767px) {
  .latest-store-facts-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .latest-store-facts-source {
    text-align: left;
  }

  .visit-intent-grid,
  .latest-store-facts-grid {
    grid-template-columns: 1fr;
  }

  .latest-store-facts-heading h2,
  .visit-intents-heading h2 {
    font-size: 30px;
  }

  .visit-intent-card {
    min-height: 0;
    padding: 22px;
  }
}

@media (max-width: 360px) {
  .latest-store-facts-grid > div,
  .visit-intent-card {
    padding: 18px;
  }

  .visit-intent-card h3 {
    font-size: 24px;
  }
}
```

- [ ] **Step 5: Run the homepage and analytics contracts and verify GREEN**

Run:

```powershell
pnpm exec node --test tests/homepage-contract.test.mjs tests/analytics-contract.test.mjs
```

Expected: PASS with the V6 order, 3-column/1-column layout, 48px links, central FAQ, and `home_hero_menu` event.

- [ ] **Step 6: Commit the homepage integration**

```powershell
git add app/page.tsx app/globals.css tests/homepage-contract.test.mjs
git commit -m "feat: integrate homepage V6 journey"
```

---

### Task 4: FAQ 스키마와 sitemap 검색 계약

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `tests/seo-schema.test.mjs`
- Modify: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: `HOME_FAQ_ITEMS`, `faqSchema`, `STORE`
- Produces: homepage visible FAQ and FAQPage JSON-LD equality contract
- Produces: `/` and `/reviews` lastModified `2026-11-07`
- Preserves: no `AggregateRating`, no duplicate sitemap URLs

- [ ] **Step 1: Write failing SEO and sitemap tests**

Import `HOME_FAQ_ITEMS` in `tests/seo-schema.test.mjs` and add:

```js
test("homepage V6 renders and serializes the same direct-answer FAQ set", () => {
  const page = read("app/page.tsx");
  assert.match(page, /const homeFaqs = HOME_FAQ_ITEMS/);
  assert.match(page, /<FaqList items=\{homeFaqs\}/);
  assert.match(page, /faqSchema\(homeFaqs\)/);
  assert.deepEqual(
    faqSchema(HOME_FAQ_ITEMS).mainEntity.map((item) => [
      item.name,
      item.acceptedAnswer.text,
    ]),
    HOME_FAQ_ITEMS.map((item) => [item.question, item.answer]),
  );
  assert.doesNotMatch(page, /AggregateRating|ratingValue|reviewCount/);
});
```

Replace the static sitemap expectation in `tests/search-discovery.test.mjs` with:

```js
assert.deepEqual(entries, [
  ["", "2026-11-07"],
  ["/menu", "2026-10-23"],
  ["/store", "2026-10-23"],
  ["/location", "2026-10-23"],
  ["/faq", "2026-10-23"],
  ["/reviews", "2026-11-07"],
  ["/stories", "2026-10-23"],
]);
assert.equal(
  new Set(entries.map(([path]) => path)).size,
  entries.length,
  "static paths are unique",
);
```

- [ ] **Step 2: Run the targeted tests and verify RED**

Run:

```powershell
pnpm exec node --test tests/seo-schema.test.mjs tests/search-discovery.test.mjs
```

Expected: `seo-schema` passes only after Task 3 is present; `search-discovery` FAILS because `/` and `/reviews` still use 2026-10-24.

- [ ] **Step 3: Update only the actually changed sitemap entries**

In `app/sitemap.ts`, use:

```ts
const STATIC_PAGES = [
  { path: "", modifiedAt: "2026-11-07" },
  { path: "/menu", modifiedAt: "2026-10-23" },
  { path: "/store", modifiedAt: "2026-10-23" },
  { path: "/location", modifiedAt: "2026-10-23" },
  { path: "/faq", modifiedAt: "2026-10-23" },
  { path: "/reviews", modifiedAt: "2026-11-07" },
  { path: "/stories", modifiedAt: "2026-10-23" },
] as const;
```

Do not change story `modifiedAt` values because V6 does not edit their content.

- [ ] **Step 4: Run the SEO and sitemap tests and verify GREEN**

Run:

```powershell
pnpm exec node --test tests/seo-schema.test.mjs tests/search-discovery.test.mjs
```

Expected: PASS; visible FAQ and schema use identical answers, and sitemap contains unique URLs with only `/` and `/reviews` updated.

- [ ] **Step 5: Commit the search contracts**

```powershell
git add app/sitemap.ts tests/seo-schema.test.mjs tests/search-discovery.test.mjs
git commit -m "feat: align V6 search discovery data"
```

---

### Task 5: 전체 회귀, 빌드, 시각 검수와 출시 HOLD

**Files:**
- Verify: `C:\vibecoding\my-shop\초안`
- Verify: `app/page.tsx`
- Verify: `app/reviews/page.tsx`
- Verify: `app/sitemap.ts`
- Verify: `app/robots.ts`

**Interfaces:**
- Consumes: completed Tasks 1–4
- Produces: a locally verified V6 branch ready for user preview approval
- Does not produce: production deployment, `main` merge, search-engine resubmission

- [ ] **Step 1: Run the complete automated test suite**

Run:

```powershell
pnpm test
```

Expected: all Node test files PASS with zero failures.

- [ ] **Step 2: Run lint**

Run:

```powershell
pnpm lint
```

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Run the production build**

Run:

```powershell
pnpm build --webpack
```

Expected: exit code 0; `/`, `/reviews`, `/sitemap.xml`, `/robots.txt`, and existing public routes build successfully.

- [ ] **Step 4: Start a local V6 preview**

Run:

```powershell
pnpm exec next dev --webpack -p 3016
```

Expected: `http://localhost:3016/` responds and the dev server reports ready.

- [ ] **Step 5: Compare the desktop result with the approved Pencil frame**

At 1440px verify in this order:

1. one H1 and existing brand video
2. latest store facts with 2026.11.07 source date
3. three visit-intent cards in one row
4. existing brand story, dining steps, menu, V5 group panel, reservation CTA
5. latest approved reviews or safe static fallback
6. four visible direct answers matching JSON-LD
7. hours, accessibility, map, and mobile action bar

Expected: no duplicate sections, no clipped Korean copy, no unverified review or benefit claims.

- [ ] **Step 6: Verify 390px and 320px responsive behavior**

At both widths verify:

1. visit-intent cards are one column
2. latest facts are one column
3. phone numbers, prices, and long Korean phrases wrap without horizontal scroll
4. every action is at least 48px high
5. the bottom fixed action bar does not cover the final location content
6. link focus order follows hero → latest facts → visit cards → content → reviews → FAQ → location

Expected: no horizontal scroll and no content hidden behind the mobile action bar.

- [ ] **Step 7: Verify links and analytics-degraded behavior**

Check these exact destinations:

- hero reservation → `STORE.bookingUrl`
- hero group inquiry → `STORE.phoneHref`
- hero menu → `/menu`
- first visit → `/menu`
- family dining → `/stories/family-dining-guide`
- group dining → `/stories/cheongju-group-dining`
- location → `STORE.directionsUrl` or `STORE.placeUrl`

Temporarily test with `window.gtag` absent. Expected: every link still follows its native destination.

- [ ] **Step 8: Confirm the production release gate**

Run:

```powershell
git status --short
git log --oneline -5
```

Expected: only the known pre-existing untracked `docs/superpowers/plans/2026-07-27-search-indexing-completion.md` may remain; V6 implementation commits are present. Stop before `main` merge, Vercel production deployment, Google Search Console submission, or 네이버 서치어드바이저 재수집. Present the local/Preview result to the user for final approval.
