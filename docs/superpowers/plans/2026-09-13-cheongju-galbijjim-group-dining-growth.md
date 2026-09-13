# 청주갈비찜·모임회식 검색 성장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 청주 등갈비찜 검색 강점을 유지하면서 청주갈비찜과 청주 모임·회식 검색 의도에 맞는 실제 콘텐츠, 단체 문의 행동, 검색 구조를 추가한다.

**Architecture:** 중앙 콘텐츠 모델에 최대 52명·통대관 사실과 단체 FAQ를 추가하고, 재사용 가능한 단체 안내 컴포넌트를 홈페이지와 매장 문맥에 연결한다. 신규 모임·회식 가이드는 기존 동적 이야기 라우트를 재사용하며, 메뉴·매장·FAQ 페이지는 각자의 검색 의도가 겹치지 않도록 제목과 본문을 조정한다. 사이트맵, Restaurant/FAQ/Article 구조화 데이터와 GA4 행동 이벤트를 함께 검증한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS, Node.js built-in test runner, JSON-LD, GA4, Vercel, Pencil

## Global Constraints

- 실제 코드 수정 전에 `C:\vibecoding\my-shop\초안` Pencil 스케치를 갱신하고 사용자 승인을 받는다.
- 한 팀 최대 52명, 최대 인원 이용 시 통대관 가능, 날짜·시간·인원 사전 협의라는 확인된 사실만 사용한다.
- 고정 최소 인원, 최소 금액, 확정되지 않은 별도 혜택을 만들지 않는다.
- 기존 영상 히어로와 `청주 등갈비찜` 중심 메시지는 유지한다.
- 페이지마다 하나의 중심 검색 의도와 하나의 H1을 사용하고 키워드를 반복 나열하지 않는다.
- 기존 실제 사진을 먼저 사용하며 손님 얼굴이 식별되는 신규 사진은 동의가 확인된 경우에만 사용한다.
- 네이버 플레이스, 홈페이지, 구글 비즈니스 프로필의 상호·주소·전화·영업시간·가격·주차 정보를 일치시킨다.
- 검색 순위와 노출 시점은 보장하지 않는다.

---

## File Map

- Create: `components/site/group-dining-panel.tsx` — 홈페이지와 관련 페이지에서 사용하는 단체·통대관 안내 및 행동 링크
- Modify: `lib/content/types.ts` — `StoreInfo`에 단체 수용 정보 타입 추가
- Modify: `lib/content/store.ts` — 확인된 단체 사실과 `GROUP_FAQ_ITEMS` 추가
- Modify: `lib/content/stories.ts` — 신규 청주 모임·회식 가이드와 가족외식 콘텐츠 보완
- Modify: `app/page.tsx` — 단체 안내 패널 연결
- Modify: `app/menu/page.tsx` — 청주갈비찜 검색 의도와 단체 가이드 연결
- Modify: `app/store/page.tsx` — 매장·단체 공간 역할로 제목과 좌석 섹션 조정
- Modify: `app/faq/page.tsx` — 단체·통대관 FAQ 화면 및 동일 JSON-LD 추가
- Modify: `app/stories/[slug]/page.tsx` — 신규 단체 이야기 전용 FAQ와 문의 행동 연결
- Modify: `app/stories/page.tsx` — 다섯 번째 이야기 배열과 소개 문구 조정
- Modify: `lib/seo/schema.ts` — 갈비찜 음식 유형, 최대 수용 인원, 단체 편의 정보 구조화
- Modify: `app/sitemap.ts` — 정적 변경일 갱신; 신규 이야기는 `STORIES`에서 자동 포함
- Modify: `components/site/analytics-link.tsx` — `group_inquiry_click` 허용
- Modify: `app/globals.css` — 단체 안내 패널 및 반응형 규칙
- Modify: `tests/content-model.test.mjs` — 단체 사실, FAQ, 다섯 이야기 계약
- Modify: `tests/homepage-contract.test.mjs` — 홈페이지 단체 패널과 섹션 순서
- Modify: `tests/routes-contract.test.mjs` — 메뉴·매장·FAQ·이야기 역할 검증
- Modify: `tests/seo-schema.test.mjs` — Restaurant 단체·갈비찜 구조화 데이터 검증
- Modify: `tests/search-discovery.test.mjs` — 신규 이야기의 사이트맵 포함 계약
- Modify: `tests/analytics-contract.test.mjs` — 단체 문의 이벤트 계약

---

### Task 1: Pencil 화면 스케치와 사용자 승인

**Files:**
- Modify: `C:\vibecoding\my-shop\초안`

**Interfaces:**
- Consumes: 승인된 설계 문서 `docs/superpowers/specs/2026-09-13-cheongju-galbijjim-group-dining-growth-design.md`
- Produces: 홈페이지·메뉴·모임회식·FAQ의 데스크톱/모바일 승인 화면

- [ ] **Step 1: 기존 Pencil 원본 열기**

Pencil 앱에서 `C:\vibecoding\my-shop\초안`을 열고 현재 홈페이지 디자인 프레임과 색상·간격·버튼 패턴을 확인한다. 기존 프레임을 삭제하거나 덮어쓰지 않는다.

- [ ] **Step 2: 홈페이지 단체 안내 스케치**

기존 메뉴 미리보기와 예약 CTA 사이에 다음 구조를 스케치한다.

```text
SPACE FOR TOGETHER
청주 모임과 회식, 최대 52명까지 한자리에서
12테이블 · 총 52석 | 통대관 가능 | 날짜·인원 사전 협의 | 무료주차
[단체 이용 자세히 보기] [전화로 일정 상담]
```

실제 `/images/eomeuittul/interior.jpg` 이미지를 사용하고 데스크톱은 사진/텍스트 2열, 모바일은 사진→텍스트→버튼 1열로 설계한다.

- [ ] **Step 3: 메뉴 페이지 연결 스케치**

히어로 H1을 `청주에서 색다른 갈비찜을 찾는다면`으로 바꾸고 메뉴 카드 뒤에 다음 짧은 연결 카드를 배치한다.

```text
함께 고르기 좋은 두 가지 갈비찜
매운맛과 간장맛을 준비해 여러 취향이 모이는 회식 자리에서도 선택하기 좋습니다.
[모임·회식 안내 보기]
```

- [ ] **Step 4: 모임·회식 가이드 스케치**

신규 상세 화면에 히어로, 4개 근거 스트립, 공간 사진, 통대관 절차, 메뉴 선택, 주차, FAQ, 전화/네이버 예약 버튼을 순서대로 배치한다. 히어로 핵심 문구는 다음과 같다.

```text
청주 모임·회식 장소를 찾는다면
한 팀 최대 52명, 통대관까지 가능한 어믜뜰
날짜·시간·인원은 매장과 사전에 협의해 주세요.
```

- [ ] **Step 5: FAQ 단체 섹션 스케치**

기존 두 FAQ 구역 아래에 `GROUP · PRIVATE HIRE` 구역을 추가하고 단체 수용, 통대관, 조건, 메뉴 선택, 주차 질문을 열린 답변 카드로 표현한다.

- [ ] **Step 6: 사용자 승인 받기**

Pencil 전체 화면과 핵심 프레임을 캡처해 사용자에게 보여준다. 사용자가 승인하기 전에는 Task 2를 시작하지 않는다.

---

### Task 2: 중앙 단체 콘텐츠 모델

**Files:**
- Modify: `lib/content/types.ts`
- Modify: `lib/content/store.ts`
- Test: `tests/content-model.test.mjs`

**Interfaces:**
- Consumes: 없음
- Produces: `STORE.maxGroupSize: number`, `STORE.groupBooking: string`, `GROUP_FAQ_ITEMS: readonly FaqItem[]`

- [ ] **Step 1: 실패하는 단체 사실 테스트 작성**

`tests/content-model.test.mjs`의 import에 `GROUP_FAQ_ITEMS`를 추가하고 다음 테스트를 작성한다.

```js
test("central content exports approved group dining facts", () => {
  assert.equal(STORE.maxGroupSize, 52);
  assert.equal(
    STORE.groupBooking,
    "한 팀 최대 52명 · 통대관 가능 · 날짜·시간·인원 사전 협의",
  );
  assert.deepEqual(GROUP_FAQ_ITEMS, [
    { question: "단체는 최대 몇 명까지 이용할 수 있나요?", answer: "한 팀 최대 52명까지 이용할 수 있습니다." },
    { question: "매장 통대관이 가능한가요?", answer: "최대 52명 단체는 매장 통대관으로 진행할 수 있습니다." },
    { question: "통대관 조건은 어떻게 확인하나요?", answer: "고정된 최소 인원이나 최소 금액 조건 없이 날짜, 시간과 인원을 매장과 사전에 협의합니다." },
    { question: "단체 이용 시 메뉴를 어떻게 고르면 되나요?", answer: "매운 등갈비찜과 간장 등갈비찜 중에서 선택할 수 있으며 자세한 구성은 예약 전에 매장과 확인해 주세요." },
    { question: "단체 방문 시 주차할 수 있나요?", answer: "건물 뒤 무료 지상주차장을 이용할 수 있습니다." },
  ]);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="approved group dining facts"`

Expected: FAIL because `STORE.maxGroupSize`, `STORE.groupBooking`, and `GROUP_FAQ_ITEMS` do not exist.

- [ ] **Step 3: 타입과 데이터 구현**

`lib/content/types.ts`의 `StoreInfo`에 다음 필드를 추가한다.

```ts
maxGroupSize: number;
groupBooking: string;
```

`lib/content/store.ts`의 `STORE`에 다음 값을 추가한다.

```ts
maxGroupSize: 52,
groupBooking: "한 팀 최대 52명 · 통대관 가능 · 날짜·시간·인원 사전 협의",
```

같은 파일에 테스트와 정확히 일치하는 `GROUP_FAQ_ITEMS` 다섯 항목을 추가한다.

- [ ] **Step 4: 통과 확인**

Run: `npm test -- --test-name-pattern="approved group dining facts"`

Expected: PASS, 0 failures.

- [ ] **Step 5: 커밋**

```bash
git add lib/content/types.ts lib/content/store.ts tests/content-model.test.mjs
git commit -m "feat: add verified group dining facts"
```

---

### Task 3: 모임·회식 이야기와 가족외식 보완

**Files:**
- Modify: `lib/content/stories.ts`
- Modify: `app/stories/[slug]/page.tsx`
- Modify: `app/stories/page.tsx`
- Modify: `components/site/analytics-link.tsx`
- Test: `tests/content-model.test.mjs`
- Test: `tests/routes-contract.test.mjs`
- Test: `tests/analytics-contract.test.mjs`

**Interfaces:**
- Consumes: `GROUP_FAQ_ITEMS`, `STORE.maxGroupSize`
- Produces: `getStory("cheongju-group-dining")`, `group_inquiry_click`, 단체 가이드 상세 페이지, 다섯 개 이야기 목록

- [ ] **Step 1: 실패하는 이야기 계약 테스트 작성**

`tests/content-model.test.mjs`에서 이야기 수를 5개로 바꾸고 다음을 추가한다.

```js
const groupStory = getStory("cheongju-group-dining");
assert.equal(groupStory?.title, "청주 모임·회식 장소 가이드");
assert.match(groupStory?.description ?? "", /최대 52명/);
assert.match(JSON.stringify(groupStory), /통대관/);
assert.match(JSON.stringify(groupStory), /사전 협의/);
```

`tests/routes-contract.test.mjs`에 다음을 추가한다.

```js
test("group dining story uses verified FAQs and contact actions", () => {
  const storyPage = read("app/stories/[slug]/page.tsx");
  assert.match(storyPage, /cheongju-group-dining/);
  assert.match(storyPage, /GROUP_FAQ_ITEMS/);
  assert.match(storyPage, /group_inquiry_click/);
  assert.match(storyPage, /STORE\.phoneHref/);
});
```

`tests/analytics-contract.test.mjs`에 다음 계약을 추가한다.

```js
test("analytics link accepts the group inquiry event", () => {
  const link = read("components/site/analytics-link.tsx");
  assert.match(link, /"group_inquiry_click"/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="stories export|group dining story|group inquiry event"`

Expected: FAIL because the fifth story and group-specific rendering do not exist.

- [ ] **Step 3: 분석 이벤트 타입 확장**

`components/site/analytics-link.tsx`의 이벤트 union에 다음을 추가한다.

```ts
| "group_inquiry_click"
```

- [ ] **Step 4: 신규 이야기 데이터 구현**

`lib/content/stories.ts`에서 가족외식 이야기를 다음 실제 근거로 확장한다: 간장 등갈비찜, 유아의자, 무료주차, 수제우유빙수. 이어서 `cheongju-group-dining` 항목을 추가한다.

```ts
{
  slug: "cheongju-group-dining",
  title: "청주 모임·회식 장소 가이드",
  description: "한 팀 최대 52명, 통대관과 무료주차가 가능한 어믜뜰의 단체 이용 정보를 확인하세요.",
  category: "단체 방문 가이드",
  readingTime: "4분",
  publishedAt: "2026-09-13",
  modifiedAt: "2026-09-13",
  image: "/images/eomeuittul/interior.jpg",
  imageAlt: "최대 52명이 이용할 수 있는 어믜뜰 매장 내부",
  sections: [
    { heading: "한 팀 최대 52명까지", body: "어믜뜰은 12테이블과 총 52석을 갖추고 있으며 한 팀 최대 52명까지 이용할 수 있습니다.", image: "/images/eomeuittul/interior.jpg", imageAlt: "어믜뜰 매장 전체 좌석" },
    { heading: "통대관은 사전 협의로", body: "최대 52명 단체는 매장 통대관으로 진행할 수 있습니다. 고정된 최소 인원이나 최소 금액 조건 없이 날짜, 시간과 인원을 매장과 사전에 협의합니다." },
    { heading: "여러 취향이 모여도 편안하게", body: "매콤한 맛을 원하는 분은 매운 등갈비찜, 맵지 않은 맛을 원하는 분은 간장 등갈비찜을 선택할 수 있습니다.", image: "/images/eomeuittul/soy-ribs.jpg", imageAlt: "단체 식사에서 선택할 수 있는 어믜뜰 간장 등갈비찜" },
    { heading: "주차와 예약을 먼저 확인하세요", body: "건물 뒤 무료 지상주차장을 이용할 수 있습니다. 단체 방문 전 전화 또는 네이버 예약에서 날짜와 인원을 확인해 주세요." },
  ],
},
```

- [ ] **Step 5: 상세 페이지에 단체 FAQ와 전화 행동 연결**

`app/stories/[slug]/page.tsx`에서 `GROUP_FAQ_ITEMS`, `STORE`, `AnalyticsLink`를 import한다. `storyFaqItems` 첫 분기에 다음을 추가한다.

```ts
if (slug === "cheongju-group-dining") {
  return GROUP_FAQ_ITEMS;
}
```

단체 이야기의 Hero 액션에 다음 링크를 추가한다.

```tsx
{story.slug === "cheongju-group-dining" ? (
  <AnalyticsLink
    className="button button-secondary"
    href={STORE.phoneHref}
    eventName="group_inquiry_click"
    placement="group_story_hero"
  >
    단체 일정 전화 상담
  </AnalyticsLink>
) : null}
```

- [ ] **Step 6: 이야기 목록을 다섯 항목에 맞게 조정**

`app/stories/page.tsx`의 설명에 모임·회식을 포함하고, 신규 단체 이야기가 첫 추천 영역에 보이도록 필터링한다.

```tsx
const featuredStories = STORIES.filter((story) =>
  ["cheongju-group-dining", "how-to-enjoy-ribs"].includes(story.slug),
);
const moreStories = STORIES.filter((story) =>
  !featuredStories.includes(story),
);
```

- [ ] **Step 7: 통과 확인**

Run: `npm test -- --test-name-pattern="stories export|group dining story|group inquiry event"`

Expected: PASS, 0 failures.

- [ ] **Step 8: 커밋**

```bash
git add lib/content/stories.ts app/stories/[slug]/page.tsx app/stories/page.tsx components/site/analytics-link.tsx tests/content-model.test.mjs tests/routes-contract.test.mjs tests/analytics-contract.test.mjs
git commit -m "feat: add Cheongju group dining guide"
```

---

### Task 4: 단체 안내 컴포넌트와 홈페이지 연결

**Files:**
- Create: `components/site/group-dining-panel.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/homepage-contract.test.mjs`
- Test: `tests/analytics-contract.test.mjs`

**Interfaces:**
- Consumes: `STORE.maxGroupSize`, `STORE.groupBooking`, `STORE.phoneHref`
- Produces: `<GroupDiningPanel placement: string>`, `group_inquiry_click`

- [ ] **Step 1: 실패하는 홈페이지·분석 테스트 작성**

`tests/homepage-contract.test.mjs`의 컴포넌트 목록과 섹션 순서에 `GroupDiningPanel`을 메뉴 미리보기 다음, 예약 CTA 이전으로 추가한다. 이어서 다음을 검증한다.

```js
assert.match(page, /<GroupDiningPanel placement="home_group" \/>/);
```

`tests/analytics-contract.test.mjs`에 다음을 추가한다.

```js
test("group dining contact uses the approved analytics event", () => {
  const panel = read("components/site/group-dining-panel.tsx");
  assert.match(panel, /최대 \{STORE\.maxGroupSize\}명/);
  assert.match(panel, /eventName="group_inquiry_click"/);
  assert.match(panel, /href=\{STORE\.phoneHref\}/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="home V2 keeps|group dining contact"`

Expected: FAIL because the component and event do not exist.

- [ ] **Step 3: 단체 안내 컴포넌트 구현**

`components/site/group-dining-panel.tsx`를 생성한다.

```tsx
import Image from "next/image";
import Link from "next/link";

import { AnalyticsLink } from "@/components/site/analytics-link";
import { STORE } from "@/lib/content/store";

export function GroupDiningPanel({ placement }: { placement: string }) {
  return (
    <section className="group-dining section-pad">
      <div className="shell group-dining-grid">
        <Image src="/images/eomeuittul/interior.jpg" alt="최대 52명 단체 이용이 가능한 어믜뜰 내부 좌석" width={640} height={440} />
        <div>
          <p className="eyebrow">SPACE FOR TOGETHER</p>
          <h2>청주 모임과 회식, 최대 {STORE.maxGroupSize}명까지 한자리에서</h2>
          <p>{STORE.groupBooking}</p>
          <ul>
            <li>12테이블 · 총 52석</li>
            <li>건물 뒤 무료 지상주차장</li>
            <li>매운맛·간장맛 선택</li>
          </ul>
          <div className="group-dining-actions">
            <Link className="button button-primary" href="/stories/cheongju-group-dining">단체 이용 자세히 보기</Link>
            <AnalyticsLink className="button button-secondary" href={STORE.phoneHref} eventName="group_inquiry_click" placement={placement}>전화로 일정 상담</AnalyticsLink>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: 홈페이지에 연결**

`app/page.tsx`에서 컴포넌트를 import하고 `menu-preview` 다음, 기존 `ReservationCta` 이전에 추가한다.

```tsx
<GroupDiningPanel placement="home_group" />
```

- [ ] **Step 5: 반응형 스타일 구현**

`app/globals.css`에 다음 레이아웃을 추가하고 모바일에서는 1열과 전체 너비 버튼으로 전환한다.

```css
.group-dining { background: var(--paper); }
.group-dining-grid { display: grid; grid-template-columns: 1fr 1.1fr; align-items: center; gap: 64px; }
.group-dining-grid > img { width: 100%; height: 408px; object-fit: cover; }
.group-dining-grid h2 { margin: 10px 0 14px; font-size: 40px; line-height: 1.3; }
.group-dining-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
```

모바일 미디어 쿼리에 다음을 추가한다.

```css
.group-dining-grid { grid-template-columns: 1fr; gap: 18px; }
.group-dining-grid > img { height: 220px; }
.group-dining-grid h2 { font-size: 30px; }
.group-dining-actions { flex-direction: column; }
.group-dining-actions .button { width: 100%; }
```

- [ ] **Step 6: 통과 확인**

Run: `npm test -- --test-name-pattern="home V2 keeps|group dining contact"`

Expected: PASS, 0 failures.

- [ ] **Step 7: 커밋**

```bash
git add components/site/group-dining-panel.tsx app/page.tsx app/globals.css tests/homepage-contract.test.mjs tests/analytics-contract.test.mjs
git commit -m "feat: add group dining conversion panel"
```

---

### Task 5: 메뉴·매장·FAQ 검색 의도 분리

**Files:**
- Modify: `app/menu/page.tsx`
- Modify: `app/store/page.tsx`
- Modify: `app/faq/page.tsx`
- Test: `tests/routes-contract.test.mjs`

**Interfaces:**
- Consumes: `GROUP_FAQ_ITEMS`, `STORE.groupBooking`
- Produces: 청주갈비찜 메뉴 랜딩, 매장·단체 공간 랜딩, 화면과 일치하는 단체 FAQ JSON-LD

- [ ] **Step 1: 실패하는 페이지 역할 테스트 작성**

`tests/routes-contract.test.mjs`에 다음 검증을 추가한다.

```js
assert.match(menu, /청주에서 색다른 갈비찜을 찾는다면/);
assert.match(menu, /href="\/stories\/cheongju-group-dining"/);
assert.match(store, /청주 봉명동 모임 공간/);
assert.match(store, /최대 52명/);
assert.match(faq, /GROUP_FAQ_ITEMS/);
assert.match(faq, /faqSchema\(allFaqs\)/);
assert.match(faq, /GROUP · PRIVATE HIRE/);
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="menu route|store route|location and FAQ"`

Expected: FAIL on the new search-intent copy and group FAQ section.

- [ ] **Step 3: 메뉴 페이지 구현**

`app/menu/page.tsx`의 metadata를 유지하되 description을 `청주에서 즐기는 매운 등갈비찜과 간장 등갈비찜의 가격, 구성, 셀프바와 단체 메뉴 선택 정보를 확인하세요.`로 바꾼다. Hero H1은 다음으로 바꾼다.

```tsx
<>청주에서 색다른<br />갈비찜을 찾는다면</>
```

메뉴 카드 뒤에 다음 내부 링크 블록을 추가한다.

```tsx
<section className="group-menu-link section-pad surface-paper">
  <div className="shell split-section">
    <Image src="/images/eomeuittul/interior.jpg" alt="어믜뜰 단체 모임 좌석" width={640} height={440} />
    <div>
      <p className="eyebrow">GROUP MENU</p>
      <h2>함께 고르기 좋은 두 가지 갈비찜</h2>
      <p>매운맛과 간장맛을 준비해 여러 취향이 모이는 회식 자리에서도 선택하기 좋습니다.</p>
      <Link className="button button-secondary" href="/stories/cheongju-group-dining">모임·회식 안내 보기</Link>
    </div>
  </div>
</section>
```

내부 링크는 `next/link`의 `Link`로 구현한다.

- [ ] **Step 4: 매장 페이지 역할 조정**

metadata title을 `어믜뜰 매장·단체석 | 청주 봉명동 모임 공간`으로, description을 실제 좌석·통대관·주차 중심으로 수정한다. 마지막 공간 섹션을 다음 의미로 바꾼다.

```tsx
<h2>가족 외식부터 최대 {STORE.maxGroupSize}명 단체 모임까지</h2>
<p>{STORE.seats}</p>
<p>{STORE.groupBooking}</p>
<Link className="button button-secondary" href="/stories/cheongju-group-dining">단체 이용 안내</Link>
```

- [ ] **Step 5: FAQ 화면과 스키마 동기화**

`app/faq/page.tsx`에서 다음 상수를 만든다.

```ts
const allFaqs = [...FAQ_ITEMS, ...GROUP_FAQ_ITEMS];
```

`faqSchema(allFaqs)`를 사용하고 기존 두 구역 아래에 다음 구역을 추가한다.

```tsx
<section className="faq-section section-pad surface-paper">
  <div className="shell split-section">
    <div>
      <p className="eyebrow">GROUP · PRIVATE HIRE</p>
      <h2>단체·회식·통대관</h2>
      <p>최대 인원, 통대관 협의, 메뉴와 주차 안내입니다.</p>
    </div>
    <FaqList items={GROUP_FAQ_ITEMS} openAll />
  </div>
</section>
```

- [ ] **Step 6: 통과 확인**

Run: `npm test -- --test-name-pattern="menu route|store route|location and FAQ"`

Expected: PASS, 0 failures.

- [ ] **Step 7: 커밋**

```bash
git add app/menu/page.tsx app/store/page.tsx app/faq/page.tsx tests/routes-contract.test.mjs
git commit -m "feat: align pages with galbijjim and group intent"
```

---

### Task 6: 구조화 데이터와 검색 발견성

**Files:**
- Modify: `lib/seo/schema.ts`
- Modify: `app/sitemap.ts`
- Test: `tests/seo-schema.test.mjs`
- Test: `tests/search-discovery.test.mjs`

**Interfaces:**
- Consumes: `STORE.maxGroupSize`, `STORIES`
- Produces: 갈비찜·최대 수용 인원·단체 편의를 담은 Restaurant JSON-LD, 신규 이야기 URL이 포함된 사이트맵

- [ ] **Step 1: 실패하는 SEO 테스트 작성**

`tests/seo-schema.test.mjs`에 다음을 추가한다.

```js
assert.deepEqual(restaurant.servesCuisine, ["한식", "갈비찜", "등갈비찜"]);
assert.equal(restaurant.maximumAttendeeCapacity, 52);
assert.deepEqual(
  restaurant.amenityFeature.map((item) => item.name),
  ["단체 이용", "통대관", "무료주차"],
);
```

`tests/search-discovery.test.mjs`에서 `STORIES`를 import하고 다음을 추가한다.

```js
assert.ok(STORIES.some((story) => story.slug === "cheongju-group-dining"));
assert.match(sitemap, /STORIES\.map/);
assert.match(sitemap, /2026-09-13/);
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- --test-name-pattern="schema factories|sitemap publishes"`

Expected: FAIL because group schema properties and the new update date are absent.

- [ ] **Step 3: Restaurant 구조화 데이터 구현**

`lib/seo/schema.ts`의 Restaurant 객체를 다음 값으로 갱신한다.

```ts
servesCuisine: ["한식", "갈비찜", "등갈비찜"],
maximumAttendeeCapacity: STORE.maxGroupSize,
amenityFeature: [
  { "@type": "LocationFeatureSpecification", name: "단체 이용", value: true },
  { "@type": "LocationFeatureSpecification", name: "통대관", value: true },
  { "@type": "LocationFeatureSpecification", name: "무료주차", value: true },
],
```

기존 `acceptsReservations`, `menu`, `hasMenu`, `openingHoursSpecification`, `sameAs`는 유지한다.

- [ ] **Step 4: 사이트맵 변경일 갱신**

`app/sitemap.ts`의 정적 페이지 변경일을 다음으로 바꾼다.

```ts
const LAST_SIGNIFICANT_UPDATE = new Date("2026-09-13T00:00:00+09:00");
```

신규 이야기 URL은 기존 `STORIES.map`을 통해 자동 포함되도록 유지한다.

- [ ] **Step 5: 통과 확인**

Run: `npm test -- --test-name-pattern="schema factories|sitemap publishes"`

Expected: PASS, 0 failures.

- [ ] **Step 6: 커밋**

```bash
git add lib/seo/schema.ts app/sitemap.ts tests/seo-schema.test.mjs tests/search-discovery.test.mjs
git commit -m "feat: publish group dining search signals"
```

---

### Task 7: 전체 검증과 Pencil 일치 확인

**Files:**
- Verify: `C:\vibecoding\my-shop\초안`
- Verify: all files changed in Tasks 2–6

**Interfaces:**
- Consumes: Tasks 1–6 결과
- Produces: 배포 가능한 검증 결과

- [ ] **Step 1: 전체 테스트**

Run: `npm test`

Expected: all tests pass, 0 failures.

- [ ] **Step 2: 정적 검사**

Run: `npm run lint`

Expected: exit 0 with no ESLint errors.

- [ ] **Step 3: 운영 빌드**

Run: `npm run build`

Expected: exit 0; `/stories/cheongju-group-dining` appears among the generated static story routes.

- [ ] **Step 4: 로컬 시각 검증**

Run: `npm run dev`

확인 URL:

```text
http://localhost:3000/
http://localhost:3000/menu
http://localhost:3000/store
http://localhost:3000/faq
http://localhost:3000/stories
http://localhost:3000/stories/cheongju-group-dining
http://localhost:3000/sitemap.xml
```

데스크톱과 390px 모바일에서 Pencil 승인안과 섹션 순서, 줄바꿈, 사진 비율, 48px 이상 행동 영역, 하단 고정바 비가림을 확인한다.

- [ ] **Step 5: 검색·행동 검증**

다음을 확인한다.

```text
각 페이지 H1 1개
각 페이지 고유 title/description/canonical
FAQ 화면 질문과 FAQ JSON-LD 질문 일치
Restaurant JSON-LD에 52명, 갈비찜, 통대관, 무료주차 포함
sitemap.xml에 /stories/cheongju-group-dining 포함
전화·예약·지도·단체문의 링크 정상
분석 스크립트가 없어도 링크 이동 정상
```

- [ ] **Step 6: 검증 커밋**

테스트 조정이 필요했다면 관련 코드와 함께 커밋한다.

```bash
git add app components lib tests
git commit -m "test: verify group dining search experience"
```

변경이 없다면 빈 커밋을 만들지 않는다.

---

### Task 8: Vercel 배포와 검색 재수집

**Files:**
- Verify: production deployment
- External: Naver Search Advisor, Google Search Console

**Interfaces:**
- Consumes: Task 7 검증 완료 커밋
- Produces: 운영 배포와 검색엔진 재수집 요청

- [ ] **Step 1: Vercel 미리보기 배포**

Run: `npx vercel --yes`

Expected: preview deployment reaches `READY`.

- [ ] **Step 2: 미리보기 검증**

홈, 메뉴, 매장, FAQ, 이야기 목록, 신규 모임 가이드와 사이트맵이 HTTP 200인지 확인한다. 실제 텍스트, 링크, 메타데이터, 구조화 데이터가 Task 7의 로컬 결과와 같은지 확인한다.

- [ ] **Step 3: 운영 배포 전 사용자 승인**

미리보기 주소와 핵심 화면을 사용자에게 보여주고 운영 배포 승인을 받는다.

- [ ] **Step 4: 운영 배포**

Run: `npx vercel --prod --yes`

Expected: deployment `READY`; `https://eomeutteull.com` alias updated.

- [ ] **Step 5: 운영 스모크 테스트**

다음 URL이 HTTP 200인지 확인한다.

```text
https://eomeutteull.com/
https://eomeutteull.com/menu
https://eomeutteull.com/store
https://eomeutteull.com/faq
https://eomeutteull.com/stories/cheongju-group-dining
https://eomeutteull.com/sitemap.xml
https://eomeutteull.com/robots.txt
```

- [ ] **Step 6: 검색엔진 재수집 요청**

네이버 서치어드바이저에 사이트맵을 다시 제출하고 `/`, `/menu`, `/store`, `/faq`, `/stories/cheongju-group-dining` 수집을 요청한다. Google Search Console에서도 사이트맵 상태를 확인하고 동일 핵심 URL의 색인 요청을 진행한다. CAPTCHA가 나오면 사용자가 직접 완료한다.

---

### Task 9: 네이버 플레이스 단체·회식 정보 정렬

**Files:**
- External: Naver Place business management

**Interfaces:**
- Consumes: 운영 배포된 모임·회식 가이드와 확인된 매장 사실
- Produces: 홈페이지와 일치하는 네이버 플레이스 소개·사진·새 소식

- [ ] **Step 1: 현재 정보 비교**

네이버 플레이스의 상호, 주소, 전화, 영업시간, 가격, 주차, 단체 이용, 예약 정보를 홈페이지와 대조한다. 불일치 항목만 수정 대상으로 표시한다.

- [ ] **Step 2: 소개 문구 준비**

다음 사실을 자연스러운 문장으로 구성한다.

```text
청주 봉명동에서 매운 등갈비찜과 간장 등갈비찜을 셀프바 재료와 함께 즐기는 어믜뜰입니다. 12테이블, 총 52석으로 한 팀 최대 52명까지 이용할 수 있으며 최대 인원 단체는 매장 통대관으로 진행할 수 있습니다. 단체 회식과 통대관은 날짜, 시간과 인원을 매장과 사전에 협의해 주세요. 건물 뒤 무료 지상주차장을 이용할 수 있습니다.
```

- [ ] **Step 3: 사진 순서 준비**

대표 음식 → 전체 좌석 → 단체 배치 → 주차장 → 셀프바 → 수제우유빙수 순으로 실제 사진을 선택한다. 얼굴 식별 사진은 동의 여부를 확인한다.

- [ ] **Step 4: 새 소식 준비**

제목은 `최대 52명 단체 회식 및 통대관 안내`로 하고 본문에는 최대 인원, 사전 협의, 메뉴 선택, 주차, 전화/네이버 예약 방법만 포함한다.

- [ ] **Step 5: 사용자 최종 확인 후 게시**

소개 수정, 사진 변경, 새 소식 게시처럼 공개 정보가 바뀌는 각 최종 제출 전에 사용자 확인을 받는다. 저장 후 공개 플레이스에서 변경 내용과 홈페이지 정보가 일치하는지 다시 확인한다.

---

## Final Verification Checklist

- [ ] Pencil 최신 스케치와 구현 화면 일치
- [ ] `npm test` 0 failures
- [ ] `npm run lint` exit 0
- [ ] `npm run build` exit 0
- [ ] 신규 가이드, 변경 페이지, sitemap, robots HTTP 200
- [ ] 네이버·구글 인증 태그 유지
- [ ] 화면 콘텐츠와 JSON-LD 사실 일치
- [ ] 신규 모임 가이드가 sitemap에 포함
- [ ] 전화·예약·지도·단체문의 링크 정상
- [ ] 네이버 플레이스와 홈페이지 핵심 정보 일치
- [ ] 검색 재수집 요청 완료
