# 어믜뜰 리뷰 최신화·SEO·AEO·GEO 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 2026-10-24에 검증한 네이버 플레이스 리뷰 스냅샷을 안전하게 반영하고, 청주갈비찜·청주 회식·청주 가족외식 검색에서 사실 정보와 직접 답변이 더 잘 발견되도록 홈페이지를 개선한다.

**Architecture:** `lib/content/store.ts`를 리뷰·매장 사실의 단일 원본으로 유지하고 홈, 후기 페이지, FAQ JSON-LD가 같은 데이터를 소비한다. 네이버 방문자 리뷰 전문은 수집하지 않고 검증된 집계값과 안전한 요약만 저장하며, 기존 NAVER API HUB 블로그 후기 승인 흐름은 그대로 둔다. 검색 개선은 고유 메타데이터, 문맥형 내부 링크, 화면과 일치하는 Restaurant 엔티티, 페이지별 사이트맵 수정일에 집중한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS Modules, Node.js built-in test runner, ESLint, Vercel

## Global Constraints

- 승인된 Pencil V4 레이아웃과 브랜드 구조를 유지하고 전면 재설계하지 않는다.
- 네이버 방문자 리뷰를 비공식 API나 브라우저 자동화로 수집하지 않는다.
- 방문자 닉네임·리뷰 전문·직접 인용을 홈페이지에 복제하지 않는다.
- 신규 NAVER API HUB 블로그 글은 계속 `pending`으로 저장하고 관리자 승인 후에만 공개한다.
- 제3자 네이버 수치를 `AggregateRating` 또는 개별 `Review` 스키마로 발행하지 않는다.
- 평점 4.94, 평점 401개, 참여자 367명, 방문자 리뷰 423개, 블로그 리뷰 203개, 상단 전체 표시 리뷰 631개는 2026-10-24 확인 스냅샷으로만 표시한다.
- 서로 다른 네이버 리뷰 분류의 수치를 더해 새로운 총계를 만들지 않는다.
- 정확한 우편번호와 위도·경도는 검증 전까지 추가하지 않는다.
- `sameAs`에는 확인된 네이버 플레이스만 유지하며 확인되지 않은 SNS를 추가하지 않는다.
- 검색 순위, 리치 결과, AI 답변 인용을 보장하거나 암시하지 않는다.
- 운영 배포는 Preview 검증 뒤 사용자 최종 승인을 받은 후에만 진행한다.
- 관련 없는 미추적 파일 `docs/superpowers/plans/2026-07-27-search-indexing-completion.md`는 수정·추가·커밋하지 않는다.

## File map

- `lib/content/types.ts`: 중앙 매장·리뷰 타입을 정의한다.
- `lib/content/store.ts`: 검증된 리뷰 스냅샷, 리뷰 요약, 후기 직접 답변, 주소 구성요소를 저장한다.
- `app/reviews/page.tsx`: 최신 리뷰 근거, 직접 답변, 관련 페이지 링크를 보여준다.
- `app/reviews/reviews.module.css`: 후기 스냅샷·직접 답변·관련 링크의 반응형 표현을 담당한다.
- `app/page.tsx`: 홈 메타데이터와 후기 페이지 진입 링크를 개선한다.
- `app/stories/[slug]/page.tsx`: 청주갈비찜·회식 가이드에서 최신 후기 페이지로 연결한다.
- `lib/seo/schema.ts`: 화면의 중앙 사실과 일치하는 Restaurant·FAQ 엔티티를 직렬화한다.
- `lib/content/stories.ts`: 실제로 수정된 관련 가이드의 수정일을 기록한다.
- `app/sitemap.ts`: 정적 페이지별 수정일과 스토리별 수정일을 발행한다.
- `tests/content-model.test.mjs`: 중앙 사실값과 안전한 리뷰 문구를 검증한다.
- `tests/routes-contract.test.mjs`: 후기·가이드 화면 구성과 내부 링크 계약을 검증한다.
- `tests/homepage-contract.test.mjs`: 홈 메타데이터·후기 진입 링크·기존 V4 구성을 검증한다.
- `tests/seo-schema.test.mjs`: Restaurant/FAQ 엔티티의 일관성과 리뷰 스키마 금지를 검증한다.
- `tests/search-discovery.test.mjs`: 페이지별 사이트맵 수정일을 검증한다.

---

### Task 1: 최신 리뷰 스냅샷과 직접 답변의 중앙 데이터

**Files:**
- Modify: `lib/content/types.ts:9-45`
- Modify: `lib/content/store.ts:3-31, 73-125`
- Test: `tests/content-model.test.mjs:6-20, 121-176`

**Interfaces:**
- Produces: `STORE.reviewUrl: string`
- Produces: `ReviewSnapshot` with `ratingCount`, `visitorReviewCount`, `blogReviewCount`, `totalDisplayedReviewCount`
- Produces: `REVIEW_FAQ_ITEMS: readonly FaqItem[]`
- Preserves: `REVIEW_ITEMS: readonly ReviewItem[]` and `REVIEW_SNAPSHOT.sourceUrl`

- [ ] **Step 1: Write the failing central-content tests**

Add `REVIEW_FAQ_ITEMS` to the import from `lib/content/store.ts`, replace the review snapshot assertion, and replace the three review-card expectations with these exact assertions:

```js
test("review snapshot records the verified public Naver counts without deriving totals", () => {
  assert.equal(STORE.reviewUrl, "https://pcmap.place.naver.com/restaurant/2021816208/review/visitor");
  assert.deepEqual(REVIEW_SNAPSHOT, {
    rating: 4.94,
    ratingCount: 401,
    participants: 367,
    visitorReviewCount: 423,
    blogReviewCount: 203,
    totalDisplayedReviewCount: 631,
    checkedAt: "2026-10-24",
    sourceLabel: "네이버 플레이스 공개 리뷰 화면",
    sourceUrl: STORE.reviewUrl,
  });
  assert.notEqual(
    REVIEW_SNAPSHOT.totalDisplayedReviewCount,
    REVIEW_SNAPSHOT.visitorReviewCount + REVIEW_SNAPSHOT.blogReviewCount,
    "independent Naver categories must not be derived by addition",
  );
});

test("central review summaries are current, sourced, and safe", () => {
  assert.deepEqual(
    REVIEW_ITEMS.map(({ title, summary }) => ({ title, summary })),
    [
      {
        title: "부드러운 등갈비와 만족스러운 맛",
        summary: "최근 확인한 방문자 후기와 반응 집계에서 음식의 맛과 고기 품질이 반복적으로 언급됩니다.",
      },
      {
        title: "샤브식 등갈비와 다양한 셀프바",
        summary: "채소와 사리를 취향대로 더해 끓이고 메밀전, 임궁밥, 수제우유빙수까지 이어지는 식사 경험이 언급됩니다.",
      },
      {
        title: "가족외식과 회식에 편한 공간",
        summary: "넓고 깔끔한 공간, 단체 이용과 가족 방문, 친절한 응대가 반복적으로 언급됩니다.",
      },
    ],
  );

  for (const review of REVIEW_ITEMS) {
    assert.equal(review.sourceUrl, STORE.reviewUrl);
    assert.equal(review.checkedAt, "2026-10-24");
    assert.equal(review.sourceLabel, "네이버 방문자 반응 요약");
    assert.doesNotMatch(`${review.title} ${review.summary}`, /[“”]|1위|최고|무조건/);
  }
});

test("review FAQ answers visit-intent questions from central verified facts", () => {
  assert.deepEqual(REVIEW_FAQ_ITEMS, [
    {
      question: "어믜뜰 후기에서 가장 많이 언급되는 장점은 무엇인가요?",
      answer: "2026년 10월 24일 확인한 네이버 방문자 반응에서는 음식의 맛과 고기 품질이 가장 많이 언급됐고, 친절한 응대와 넉넉한 양, 넓은 매장도 반복적으로 언급됐습니다.",
    },
    {
      question: "가족외식이나 회식에 적합한가요?",
      answer: "어믜뜰은 유아의자와 어린이밥을 갖추고 있으며 한 팀 최대 52명까지 이용할 수 있어 가족외식과 회식 모두 사전 상담이 가능합니다.",
    },
    {
      question: "매운 음식을 못 먹어도 이용할 수 있나요?",
      answer: "매운 등갈비찜 대신 달콤짭짤한 간장 등갈비찜을 선택할 수 있습니다.",
    },
    {
      question: "주차와 예약, 최대 인원은 어떻게 되나요?",
      answer: "건물 뒤 무료 지상주차장을 이용할 수 있고 네이버 예약이 가능하며, 한 팀 최대 52명과 최대 인원 통대관은 날짜·시간·인원을 사전에 상담해 주세요.",
    },
  ]);
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
node --test --test-name-pattern="review snapshot|central review summaries|review FAQ" tests/content-model.test.mjs
```

Expected: FAIL because `REVIEW_FAQ_ITEMS`, `STORE.reviewUrl`, and the new snapshot fields do not exist and the old values are still present.

- [ ] **Step 3: Extend the central types**

Insert `reviewUrl` between the existing place and booking URLs in `StoreInfo`, and replace `ReviewSnapshot` with:

```ts
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
  reviewUrl: string;
  bookingUrl: string;
  directionsUrl: string;
  image: string;
  openingPeriods: readonly OpeningPeriod[];
};

export type ReviewSnapshot = {
  rating: number;
  ratingCount: number;
  participants: number;
  visitorReviewCount: number;
  blogReviewCount: number;
  totalDisplayedReviewCount: number;
  checkedAt: string;
  sourceLabel: string;
  sourceUrl: string;
};
```

Do not delete or rename any existing `StoreInfo` field while inserting `reviewUrl` next to `placeUrl`.

- [ ] **Step 4: Replace the central review facts**

Add the verified URL to `STORE`:

```ts
reviewUrl: "https://pcmap.place.naver.com/restaurant/2021816208/review/visitor",
```

Replace `REVIEW_SNAPSHOT`, add `REVIEW_FAQ_ITEMS`, and replace `REVIEW_ITEMS` with:

```ts
export const REVIEW_SNAPSHOT: ReviewSnapshot = {
  rating: 4.94,
  ratingCount: 401,
  participants: 367,
  visitorReviewCount: 423,
  blogReviewCount: 203,
  totalDisplayedReviewCount: 631,
  checkedAt: "2026-10-24",
  sourceLabel: "네이버 플레이스 공개 리뷰 화면",
  sourceUrl: STORE.reviewUrl,
};

export const REVIEW_FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "어믜뜰 후기에서 가장 많이 언급되는 장점은 무엇인가요?",
    answer: "2026년 10월 24일 확인한 네이버 방문자 반응에서는 음식의 맛과 고기 품질이 가장 많이 언급됐고, 친절한 응대와 넉넉한 양, 넓은 매장도 반복적으로 언급됐습니다.",
  },
  {
    question: "가족외식이나 회식에 적합한가요?",
    answer: "어믜뜰은 유아의자와 어린이밥을 갖추고 있으며 한 팀 최대 52명까지 이용할 수 있어 가족외식과 회식 모두 사전 상담이 가능합니다.",
  },
  {
    question: "매운 음식을 못 먹어도 이용할 수 있나요?",
    answer: "매운 등갈비찜 대신 달콤짭짤한 간장 등갈비찜을 선택할 수 있습니다.",
  },
  {
    question: "주차와 예약, 최대 인원은 어떻게 되나요?",
    answer: "건물 뒤 무료 지상주차장을 이용할 수 있고 네이버 예약이 가능하며, 한 팀 최대 52명과 최대 인원 통대관은 날짜·시간·인원을 사전에 상담해 주세요.",
  },
];

export const REVIEW_ITEMS: readonly ReviewItem[] = [
  {
    title: "부드러운 등갈비와 만족스러운 맛",
    summary: "최근 확인한 방문자 후기와 반응 집계에서 음식의 맛과 고기 품질이 반복적으로 언급됩니다.",
    sourceLabel: "네이버 방문자 반응 요약",
    sourceUrl: STORE.reviewUrl,
    checkedAt: "2026-10-24",
  },
  {
    title: "샤브식 등갈비와 다양한 셀프바",
    summary: "채소와 사리를 취향대로 더해 끓이고 메밀전, 임궁밥, 수제우유빙수까지 이어지는 식사 경험이 언급됩니다.",
    sourceLabel: "네이버 방문자 반응 요약",
    sourceUrl: STORE.reviewUrl,
    checkedAt: "2026-10-24",
  },
  {
    title: "가족외식과 회식에 편한 공간",
    summary: "넓고 깔끔한 공간, 단체 이용과 가족 방문, 친절한 응대가 반복적으로 언급됩니다.",
    sourceLabel: "네이버 방문자 반응 요약",
    sourceUrl: STORE.reviewUrl,
    checkedAt: "2026-10-24",
  },
];
```

- [ ] **Step 5: Run the focused tests and verify they pass**

Run:

```powershell
node --test --test-name-pattern="review snapshot|central review summaries|review FAQ" tests/content-model.test.mjs
```

Expected: PASS for the three new tests.

- [ ] **Step 6: Commit the central review data**

```powershell
git add lib/content/types.ts lib/content/store.ts tests/content-model.test.mjs
git commit -m "feat: refresh verified review evidence"
```

---

### Task 2: 후기 페이지의 최신 근거와 직접 답변

**Files:**
- Modify: `app/reviews/page.tsx:1-167`
- Modify: `app/reviews/reviews.module.css:1-104`
- Test: `tests/routes-contract.test.mjs:243-335`
- Test: `tests/seo-schema.test.mjs:17-29, 122-151`

**Interfaces:**
- Consumes: `REVIEW_SNAPSHOT`, `REVIEW_ITEMS`, `REVIEW_FAQ_ITEMS`, `STORE.reviewUrl`
- Produces: one `<JsonLd>` payload containing `BreadcrumbList` and `FAQPage`
- Preserves: `loadPublicOnlineReviews(6)` and approved-only `OnlineReviewCards`

- [ ] **Step 1: Write the failing route and schema contract tests**

Update the review route assertions so they require the new metadata, all verified counts, direct-answer FAQ, internal links, and one JSON-LD component without rating schema:

```js
test("reviews route shows current evidence, direct answers, and contextual links", () => {
  const page = read("app/reviews/page.tsx");
  const styles = read("app/reviews/reviews.module.css");

  assert.match(page, /title: "청주갈비찜 후기·가족외식·회식 \| 어믜뜰"/);
  assert.match(page, /REVIEW_FAQ_ITEMS/);
  assert.match(page, /faqSchema\(REVIEW_FAQ_ITEMS\)/);
  assert.match(page, /<FaqList items=\{REVIEW_FAQ_ITEMS\} openAll \/>/);
  assert.equal(page.split("<JsonLd").length - 1, 1);
  assert.match(page, /REVIEW_SNAPSHOT\.ratingCount/);
  assert.match(page, /REVIEW_SNAPSHOT\.participants/);
  assert.match(page, /REVIEW_SNAPSHOT\.visitorReviewCount/);
  assert.match(page, /REVIEW_SNAPSHOT\.blogReviewCount/);
  assert.match(page, /REVIEW_SNAPSHOT\.totalDisplayedReviewCount/);
  assert.match(page, /서로 다른 네이버 분류이므로 합산하지 않습니다/);
  for (const href of [
    "/menu",
    "/stories/cheongju-group-dining",
    "/stories/cheongju-galbijjim-guide",
  ]) {
    assert.match(page, new RegExp(`href="${href}"`));
  }
  assert.match(page, /await loadPublicOnlineReviews\(6\)/);
  assert.doesNotMatch(page, /AggregateRating|aggregateRating|ratingValue|reviewCount/);
  assert.match(styles, /\.answerSection/);
  assert.match(styles, /\.relatedLinks/);
  assert.match(styles, /@media \(max-width: 767px\)[\s\S]*?\.relatedLinks/);
});
```

Add a schema synchronization test:

```js
test("reviews route renders and serializes the same central FAQ set", () => {
  const page = read("app/reviews/page.tsx");
  assert.match(page, /<FaqList items=\{REVIEW_FAQ_ITEMS\} openAll \/>/);
  assert.match(page, /faqSchema\(REVIEW_FAQ_ITEMS\)/);
  assert.equal(faqSchema(REVIEW_FAQ_ITEMS).mainEntity.length, REVIEW_FAQ_ITEMS.length);
});
```

Import `REVIEW_FAQ_ITEMS` in `tests/seo-schema.test.mjs` before running this test.

In the existing `reviews route shows the verified dated rating snapshot without rating schema` test, make these exact assertion replacements:

```js
assert.match(page, /title: "청주갈비찜 후기·가족외식·회식 \| 어믜뜰"/);
assert.match(snapshot, /aria-label="확인일 기준 네이버 리뷰 스냅샷"/);
assert.match(page, /확인일 기준 네이버 플레이스 공개 화면 스냅샷/);
```

Replace the existing `central review evidence has three safe, dated source records` test with:

```js
test("central review evidence has three safe, current source records", () => {
  assert.equal(REVIEW_ITEMS.length, 3);

  for (const review of REVIEW_ITEMS) {
    assert.equal(review.sourceUrl, STORE.reviewUrl);
    assert.equal(new URL(review.sourceUrl).protocol, "https:");
    assert.equal(review.checkedAt, "2026-10-24");
    assert.equal(review.sourceLabel, "네이버 방문자 반응 요약");
    assert.doesNotMatch(
      `${review.title} ${review.summary}`,
      /평점|별점|reviewCount|[“”]|1위|최고|무조건/,
    );
  }
});
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```powershell
node --test --test-name-pattern="reviews route shows current evidence|reviews route renders" tests/routes-contract.test.mjs tests/seo-schema.test.mjs
```

Expected: FAIL because the page does not yet import `FaqList`, `REVIEW_FAQ_ITEMS`, `faqSchema`, or the new CSS classes.

- [ ] **Step 3: Update review metadata, imports, and JSON-LD**

Add these imports:

```tsx
import Link from "next/link";

import { FaqList } from "@/components/site/faq-list";
import {
  REVIEW_FAQ_ITEMS,
  REVIEW_ITEMS,
  REVIEW_SNAPSHOT,
  STORE,
} from "@/lib/content/store";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/schema";
```

Replace the metadata with:

```tsx
export const metadata = createPageMetadata({
  title: "청주갈비찜 후기·가족외식·회식 | 어믜뜰",
  description:
    "2026년 10월 24일 네이버 플레이스에서 확인한 어믜뜰 평점과 방문자 반응을 바탕으로 청주갈비찜, 가족외식, 회식 이용 정보를 안내합니다.",
  path: "/reviews",
  image: "/images/eomeuittul/soy-ribs.jpg",
});
```

Replace the current `<JsonLd>` call with:

```tsx
<JsonLd
  data={[
    breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "방문자 후기", path: "/reviews" },
    ]),
    faqSchema(REVIEW_FAQ_ITEMS),
  ]}
/>
```

Change the hero description to:

```tsx
description="청주갈비찜의 맛과 고기 품질, 셀프바 식사 경험, 가족외식과 회식 공간에 관한 최근 방문자 반응을 확인하세요."
```

Change the hero source link from `STORE.placeUrl` to `STORE.reviewUrl`.

- [ ] **Step 4: Render every verified snapshot field without deriving totals**

Replace the `ProofStrip` items with:

```tsx
items={[
  `네이버 평점 ${REVIEW_SNAPSHOT.rating} / 5`,
  `${REVIEW_SNAPSHOT.ratingCount}개 평점 · ${REVIEW_SNAPSHOT.participants}명 참여`,
  `방문자 리뷰 ${REVIEW_SNAPSHOT.visitorReviewCount}개 · 블로그 리뷰 ${REVIEW_SNAPSHOT.blogReviewCount}개`,
  `${REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인`,
]}
```

Replace `ratingSnapshot` content with:

```tsx
<aside className={styles.ratingSnapshot} aria-label="확인일 기준 네이버 리뷰 스냅샷">
  <strong>{REVIEW_SNAPSHOT.rating} / 5</strong>
  <span>{REVIEW_SNAPSHOT.ratingCount}개 평점</span>
  <span>{REVIEW_SNAPSHOT.participants}명 참여</span>
  <span>방문자 리뷰 {REVIEW_SNAPSHOT.visitorReviewCount}개</span>
  <span>블로그 리뷰 {REVIEW_SNAPSHOT.blogReviewCount}개</span>
  <span>상단 전체 표시 {REVIEW_SNAPSHOT.totalDisplayedReviewCount}개</span>
  <time dateTime={REVIEW_SNAPSHOT.checkedAt}>
    {REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인
  </time>
  <a href={REVIEW_SNAPSHOT.sourceUrl} target="_blank" rel="noreferrer">
    네이버에서 최신 정보 보기
  </a>
</aside>
<p className={styles.snapshotNote}>
  방문자·블로그·상단 전체 표시는 서로 다른 네이버 분류이므로 합산하지 않습니다.
</p>
```

Change the evidence explanation from “관리자 화면 스냅샷” to “네이버 플레이스 공개 화면 스냅샷”.

- [ ] **Step 5: Add the visible direct-answer and related-page section**

Insert this section after the static review section and before approved online reviews:

```tsx
<section className={`${styles.answerSection} section-pad`} aria-labelledby="review-answers-title">
  <div className="shell">
    <div className={styles.evidenceHeader}>
      <p className="eyebrow">QUICK ANSWERS · 방문 전 확인</p>
      <h2 id="review-answers-title">청주갈비찜·가족외식·회식, 바로 답해드려요</h2>
      <p>최근 후기에서 궁금해진 내용을 매장의 확인된 메뉴·좌석·주차·예약 정보로 답합니다.</p>
    </div>
    <FaqList items={REVIEW_FAQ_ITEMS} openAll />
    <nav className={styles.relatedLinks} aria-label="후기 관련 정보">
      <Link href="/menu">전체 메뉴와 가격 보기</Link>
      <Link href="/stories/cheongju-group-dining">청주 모임·회식 안내</Link>
      <Link href="/stories/cheongju-galbijjim-guide">청주갈비찜 선택 가이드</Link>
    </nav>
  </div>
</section>
```

- [ ] **Step 6: Add minimal responsive styles**

Append:

```css
.snapshotNote {
  margin: 12px 0 0;
  color: var(--muted);
  font-size: 15px;
}

.answerSection {
  background: var(--hanji);
}

.relatedLinks {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 24px;
}

.relatedLinks a {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--red);
  border-radius: 6px;
  color: var(--red);
  font-weight: 700;
  text-align: center;
}
```

Add inside the existing `@media (max-width: 767px)` block:

```css
.relatedLinks {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 7: Run route, schema, and content tests**

Run:

```powershell
node --test --test-name-pattern="reviews route|central review|review FAQ" tests/content-model.test.mjs tests/routes-contract.test.mjs tests/seo-schema.test.mjs
```

Expected: PASS. If an old assertion expects `2026-07-19`, `관리자 화면`, or the old review titles, replace that assertion with the approved 2026-10-24 values rather than weakening it.

- [ ] **Step 8: Commit the review page**

```powershell
git add app/reviews/page.tsx app/reviews/reviews.module.css tests/routes-contract.test.mjs tests/seo-schema.test.mjs
git commit -m "feat: add current review answers and evidence"
```

---

### Task 3: 홈·가이드의 검색 의도와 문맥형 내부 링크

**Files:**
- Modify: `app/page.tsx:26-32, 120-148`
- Modify: `app/stories/[slug]/page.tsx:1-181`
- Test: `tests/homepage-contract.test.mjs:9-92, 199-211`
- Test: `tests/routes-contract.test.mjs:118-166`

**Interfaces:**
- Consumes: `/reviews`, `STORE.reviewUrl`, existing `REVIEW_ITEMS` fallback
- Produces: crawlable internal links from `/` and the two priority guides to `/reviews`
- Preserves: existing section order, `loadPublicOnlineReviews(3)`, booking and phone action priority

- [ ] **Step 1: Write failing home and story link tests**

Add these tests:

```js
test("home metadata and review section support the priority search intents", () => {
  const page = read("app/page.tsx");
  assert.match(page, /title: "청주갈비찜·회식·가족외식 \| 어믜뜰 청주봉명동본점"/);
  assert.match(page, /청주갈비찜/);
  assert.match(page, /청주 회식/);
  assert.match(page, /청주 가족외식/);
  assert.match(page, /<Link className="button button-tertiary" href="\/reviews">/);
  assert.match(page, /최신 후기 전체 보기/);
  assert.match(page, /await loadPublicOnlineReviews\(3\)/);
});

test("priority guides link contextually to the current review page", () => {
  const detail = read("app/stories/[slug]/page.tsx");
  assert.match(detail, /import Link from "next\/link"/);
  assert.match(detail, /hasDirectAnswerFaq/);
  assert.match(detail, /<Link className="button button-secondary" href="\/reviews">/);
  assert.match(detail, /최신 방문자 반응 확인하기/);
});
```

In the existing `home V4 exposes approved media, proof, trust, and conversion sections` test, replace the old metadata assertion with:

```js
assert.match(page, /청주갈비찜·회식·가족외식/);
```

- [ ] **Step 2: Run the focused tests and verify they fail**

Run:

```powershell
node --test --test-name-pattern="home metadata and review|priority guides link" tests/homepage-contract.test.mjs tests/routes-contract.test.mjs
```

Expected: FAIL because the new metadata and internal links are absent.

- [ ] **Step 3: Update home metadata and add the review hub link**

Replace home metadata with:

```tsx
export const metadata = createPageMetadata({
  title: "청주갈비찜·회식·가족외식 | 어믜뜰 청주봉명동본점",
  description:
    "청주 봉명동에서 매운·간장 등갈비찜과 셀프바를 샤브처럼 즐겨보세요. 청주 회식과 가족외식, 최대 52명 통대관 상담, 무료 주차와 네이버 예약이 가능합니다.",
  path: "/",
});
```

Inside `.review-preview`, immediately after its `<h2>`, add:

```tsx
<Link className="button button-tertiary" href="/reviews">
  최신 후기 전체 보기
</Link>
```

Do not change the online-review conditional or the `REVIEW_ITEMS` fallback.

- [ ] **Step 4: Link priority guides to the review evidence**

Add `Link` to the story page imports:

```tsx
import Link from "next/link";
```

Inside the existing story FAQ heading column, after the explanatory paragraph, add:

```tsx
{hasDirectAnswerFaq ? (
  <p>
    <Link className="button button-secondary" href="/reviews">
      최신 방문자 반응 확인하기
    </Link>
  </p>
) : null}
```

This condition limits the new link to `cheongju-group-dining` and `cheongju-galbijjim-guide`.

- [ ] **Step 5: Run homepage and route contracts**

Run:

```powershell
node --test --test-name-pattern="home|priority guides|story routes|group story|galbijjim story" tests/homepage-contract.test.mjs tests/routes-contract.test.mjs
```

Expected: PASS while the approved home section order and all tracked reservation/phone actions remain unchanged.

- [ ] **Step 6: Commit contextual discovery changes**

```powershell
git add app/page.tsx app/stories/[slug]/page.tsx tests/homepage-contract.test.mjs tests/routes-contract.test.mjs
git commit -m "feat: strengthen local search discovery paths"
```

---

### Task 4: Restaurant 엔티티의 검증된 주소 구조화

**Files:**
- Modify: `lib/content/types.ts:9-31`
- Modify: `lib/content/store.ts:3-31`
- Modify: `lib/seo/schema.ts:13-63`
- Test: `tests/content-model.test.mjs:23-74`
- Test: `tests/seo-schema.test.mjs:52-118`

**Interfaces:**
- Produces: `STORE.postalAddress: { streetAddress; addressLocality; addressRegion; addressCountry }`
- Consumes: `STORE.postalAddress` in `restaurantSchema().address`
- Preserves: `restaurantSchema()["@id"] === ${STORE.url}/#restaurant`, `sameAs: [STORE.placeUrl]`, and absence of rating schema

- [ ] **Step 1: Write failing address and entity tests**

Add:

```js
test("central store exposes verified postal address components", () => {
  assert.deepEqual(STORE.postalAddress, {
    streetAddress: "백봉로 213-1 1층",
    addressLocality: "청주시 흥덕구",
    addressRegion: "충청북도",
    addressCountry: "KR",
  });
});
```

Extend the schema factory test with:

```js
assert.equal(restaurant["@id"], `${STORE.url}/#restaurant`);
assert.equal(website.publisher["@id"], restaurant["@id"]);
assert.deepEqual(restaurant.address, {
  "@type": "PostalAddress",
  ...STORE.postalAddress,
});
assert.equal(restaurant.mainEntityOfPage, STORE.url);
assert.deepEqual(restaurant.sameAs, [STORE.placeUrl]);
assert.equal("geo" in restaurant, false);
assert.equal("postalCode" in restaurant.address, false);
```

- [ ] **Step 2: Run focused entity tests and verify they fail**

Run:

```powershell
node --test --test-name-pattern="postal address|schema factories" tests/content-model.test.mjs tests/seo-schema.test.mjs
```

Expected: FAIL because `STORE.postalAddress` and `mainEntityOfPage` are absent.

- [ ] **Step 3: Add the verified address type and central value**

Add to `StoreInfo`:

```ts
postalAddress: {
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  addressCountry: "KR";
};
```

Add immediately after the display `address` in `STORE`:

```ts
postalAddress: {
  streetAddress: "백봉로 213-1 1층",
  addressLocality: "청주시 흥덕구",
  addressRegion: "충청북도",
  addressCountry: "KR",
},
```

- [ ] **Step 4: Make Restaurant schema consume only verified central facts**

Replace the current `address` block and add `mainEntityOfPage`:

```ts
mainEntityOfPage: STORE.url,
address: {
  "@type": "PostalAddress",
  ...STORE.postalAddress,
},
```

Keep these exact lines unchanged:

```ts
"@id": `${STORE.url}/#restaurant`,
sameAs: [STORE.placeUrl],
acceptsReservations: true,
menu: `${STORE.url}/menu`,
```

Do not add `geo`, `postalCode`, `AggregateRating`, `Review`, or unverified social URLs.

- [ ] **Step 5: Run content and schema tests**

Run:

```powershell
node --test --test-name-pattern="postal address|schema factories|restaurant" tests/content-model.test.mjs tests/seo-schema.test.mjs
```

Expected: PASS, including the existing checks that reject `AggregateRating`, `ratingValue`, and `reviewCount`.

- [ ] **Step 6: Commit entity consistency changes**

```powershell
git add lib/content/types.ts lib/content/store.ts lib/seo/schema.ts tests/content-model.test.mjs tests/seo-schema.test.mjs
git commit -m "feat: structure verified restaurant address"
```

---

### Task 5: 실제 변경일 기반 사이트맵과 관련 가이드 수정일

**Files:**
- Modify: `lib/content/stories.ts:68-103`
- Modify: `app/sitemap.ts:1-24`
- Test: `tests/content-model.test.mjs:178-252`
- Test: `tests/search-discovery.test.mjs:15-29`

**Interfaces:**
- Produces: `STATIC_PAGES` records with `path` and ISO `modifiedAt`
- Consumes: each `story.modifiedAt` for story sitemap entries
- Preserves: every public static path and all six story URLs exactly once

- [ ] **Step 1: Write failing story-date and sitemap tests**

Add or update the story assertions:

```js
test("priority local-search guides carry the current content modification date", () => {
  assert.equal(getStory("cheongju-group-dining")?.modifiedAt, "2026-10-24");
  assert.equal(getStory("cheongju-galbijjim-guide")?.modifiedAt, "2026-10-24");
});
```

Replace the global-date sitemap source test with:

```js
test("sitemap publishes per-page static dates and story modification dates", () => {
  const sitemap = read("app/sitemap.ts");

  for (const path of ["", "/menu", "/store", "/location", "/faq", "/reviews", "/stories"]) {
    assert.match(sitemap, new RegExp(`path: "${path.replaceAll("/", "\\/")}"`));
  }
  assert.match(sitemap, /const STATIC_PAGES/);
  assert.match(sitemap, /modifiedAt: "2026-10-24"/);
  assert.match(sitemap, /new Date\(`\$\{page\.modifiedAt\}T00:00:00\+09:00`\)/);
  assert.match(sitemap, /story\.modifiedAt/);
  assert.doesNotMatch(sitemap, /LAST_SIGNIFICANT_UPDATE/);
});
```

- [ ] **Step 2: Run focused discovery tests and verify they fail**

Run:

```powershell
node --test --test-name-pattern="priority local-search guides|sitemap publishes per-page" tests/content-model.test.mjs tests/search-discovery.test.mjs
```

Expected: FAIL because the guides use older dates and `app/sitemap.ts` uses one global date.

- [ ] **Step 3: Update only the changed guide dates**

In `lib/content/stories.ts`, set:

```ts
// cheongju-group-dining
modifiedAt: "2026-10-24",

// cheongju-galbijjim-guide
modifiedAt: "2026-10-24",
```

Leave all other `publishedAt` and `modifiedAt` values unchanged.

- [ ] **Step 4: Replace the global sitemap date with page records**

Replace `LAST_SIGNIFICANT_UPDATE` and `staticPaths` with:

```ts
const STATIC_PAGES = [
  { path: "", modifiedAt: "2026-10-24" },
  { path: "/menu", modifiedAt: "2026-10-23" },
  { path: "/store", modifiedAt: "2026-10-23" },
  { path: "/location", modifiedAt: "2026-10-23" },
  { path: "/faq", modifiedAt: "2026-10-23" },
  { path: "/reviews", modifiedAt: "2026-10-24" },
  { path: "/stories", modifiedAt: "2026-10-24" },
] as const;
```

Replace the static mapping with:

```ts
...STATIC_PAGES.map((page) => ({
  url: `${STORE.url}${page.path}`,
  lastModified: new Date(`${page.modifiedAt}T00:00:00+09:00`),
})),
```

Keep the story mapping unchanged:

```ts
...STORIES.map((story) => ({
  url: `${STORE.url}/stories/${story.slug}`,
  lastModified: new Date(`${story.modifiedAt}T00:00:00+09:00`),
})),
```

- [ ] **Step 5: Run content and discovery tests**

Run:

```powershell
node --test --test-name-pattern="priority local-search guides|sitemap|stories export|group and family guides" tests/content-model.test.mjs tests/search-discovery.test.mjs
```

Expected: PASS. Update the existing group-guide date assertion from `2026-10-23` to `2026-10-24`; keep the family-guide assertion at `2026-10-23`.

- [ ] **Step 6: Commit sitemap freshness changes**

```powershell
git add lib/content/stories.ts app/sitemap.ts tests/content-model.test.mjs tests/search-discovery.test.mjs
git commit -m "feat: publish accurate page modification dates"
```

---

### Task 6: 전체 검증, Preview 확인, 운영 배포 승인 지점

**Files:**
- Verify: all changed files
- Preserve untracked: `docs/superpowers/plans/2026-07-27-search-indexing-completion.md`

**Interfaces:**
- Consumes: all Task 1-5 outputs
- Produces: locally verified branch ready for Preview review
- Gate: no push, PR merge, or production deployment before the user’s final approval

- [ ] **Step 1: Run the complete automated test suite**

Run:

```powershell
npm test
```

Expected: exit code 0 with every test passing and no skipped failure.

On this Windows managed sandbox, `tests/public-visible-terms.test.mjs` may fail before building with `EPERM ... symlink ... node_modules`. If that exact environment error occurs, rerun `npm test` with the command’s required elevated filesystem permission. Any assertion, compile, content, or route failure still counts as a real failure and must be fixed.

- [ ] **Step 2: Run static analysis**

Run:

```powershell
npm run lint
```

Expected: exit code 0 with no ESLint error.

- [ ] **Step 3: Build the production application**

Run:

```powershell
npm run build
```

Expected: exit code 0; Next.js generates `/`, `/reviews`, `/sitemap.xml`, and both priority story routes without compile or prerender errors.

- [ ] **Step 4: Verify the diff and forbidden claims**

Run:

```powershell
git diff --check origin/main...HEAD
rg -n "AggregateRating|aggregateRating|ratingValue|reviewCount|llms\.txt|1위|무조건 최고" app components lib
git status --short --branch
```

Expected:

- `git diff --check` prints nothing.
- `rg` prints no new prohibited review-schema, ranking, or `llms.txt` usage; if existing test strings appear outside `app`, `components`, or `lib`, they are not production output.
- branch contains only the planned commits plus the approved design/plan documents.
- `docs/superpowers/plans/2026-07-27-search-indexing-completion.md` remains untracked and untouched.

- [ ] **Step 5: Start a local production-equivalent preview**

Run:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3016
```

Expected: `http://127.0.0.1:3016` responds successfully.

Manually verify at desktop and 390px width:

- `/`: V4 section order is unchanged; latest review link is visible; booking and 52명 상담 remain first.
- `/reviews`: all six verified review fields and 2026.10.24 are visible; categories are explicitly not summed; four direct answers are open; three internal links work.
- `/stories/cheongju-group-dining`: latest review link works and phone/booking actions remain tracked.
- `/stories/cheongju-galbijjim-guide`: latest review link works and reservation action remains tracked.
- `/sitemap.xml`: home, reviews, stories index, and both priority guides have 2026-10-24 modification dates.
- page source: `Restaurant`, `WebSite`, `FAQPage`, `BreadcrumbList`, and `Article` remain valid JSON-LD; no `AggregateRating` or `Review` is emitted.

- [ ] **Step 6: Stop and request the user’s final publication approval**

Report:

```text
리뷰 최신화와 SEO·AEO·GEO 개선 구현 및 Preview 검증이 끝났습니다.
아직 GitHub 병합과 Vercel 운영 배포는 하지 않았습니다.
운영 배포를 승인하시면 PR 생성·병합·배포·운영 URL 확인·검색엔진 재수집 순서로 진행하겠습니다.
```

Do not run `git push`, create/merge a PR, or trigger production deployment until the user explicitly approves.

- [ ] **Step 7: After explicit approval, publish and verify production**

Run:

```powershell
git push -u origin codex/eomeutteull-review-seo-refresh
```

Create a pull request from `codex/eomeutteull-review-seo-refresh` to `main`, attach it to the Codex task, verify all checks, merge it, and confirm Vercel deploys the merged `main` commit.

Verify these production URLs return the new content:

```text
https://eomeutteull.com/
https://eomeutteull.com/reviews
https://eomeutteull.com/stories/cheongju-group-dining
https://eomeutteull.com/stories/cheongju-galbijjim-guide
https://eomeutteull.com/sitemap.xml
```

Then request recrawling for `/`, `/reviews`, and the two priority guides in Google Search Console and Naver Search Advisor. Record submission status; do not claim immediate indexing or ranking changes.
