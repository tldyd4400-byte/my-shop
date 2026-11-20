# 어믜뜰 모임·회식 전환 개선 V5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미 검색 클릭이 발생하는 `/stories/cheongju-group-dining`에서 일반 식사 네이버 예약과 단체·통대관 전화 상담을 명확히 분리해 사용자가 맞는 행동을 빠르게 선택하게 한다.

**Architecture:** 검증된 영업 사실은 `STORE`와 전용 FAQ 배열에만 저장하고, V5 전용 화면은 작은 서버 컴포넌트 두 개로 분리한다. 기존 정적 이야기 URL, Article·BreadcrumbList 구조화 데이터, 분석 이벤트와 내부 링크 구조는 유지하면서 화면에 보이는 직접 답변만 FAQPage 데이터로 제공한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, CSS, Node test runner, Vercel

## Global Constraints

- Pencil 원본 `C:\vibecoding\my-shop\초안`의 `검색 성장 V5 모임·회식 전환 개선 Pencil 승인안`과 일치해야 한다.
- URL과 canonical은 `/stories/cheongju-group-dining`으로 유지한다.
- 한 팀 최대 52명, 12테이블·총 52석, 최대 인원 통대관 사전 협의, 정해진 최소 인원·최소 금액 없음, 건물 뒤 무료주차만 사용한다.
- 특정 인원부터 전화해야 한다는 기준, 좌석 보장, 주차 가능 대수, 예약 확정, 검색 순위 효과를 추가하지 않는다.
- 일반 식사는 네이버 예약, 단체·통대관은 전화 상담으로 문구와 분석 이벤트를 구분한다.
- 전화는 `STORE.phoneHref`, 네이버 예약은 `STORE.bookingUrl`, 지도는 `STORE.directionsUrl`을 사용한다.
- 주요 행동은 최소 48px이며 320px·390px 모바일에서 잘리거나 겹치지 않아야 한다.
- 운영 배포는 별도의 명시적 최종 승인 전에는 실행하지 않는다.
- 기존 미추적 파일 `docs/superpowers/plans/2026-07-27-search-indexing-completion.md`는 수정·추가·삭제·커밋하지 않는다.

---

## File Structure

- Modify `lib/content/types.ts`: 단체 상담에 필요한 중앙 데이터 필드를 `StoreInfo`에 정의한다.
- Modify `lib/content/store.ts`: 통대관 최소 조건, 단체 주차, 상담 준비 정보와 V5 직접 답변 FAQ를 단일 기준으로 제공한다.
- Modify `lib/content/stories.ts`: 모임·회식 이야기의 승인된 설명과 실제 수정일을 갱신한다.
- Create `components/site/group-dining-actions.tsx`: 전화 상담과 일반 식사 네이버 예약을 의미·분석 이벤트별로 분리한다.
- Create `components/site/group-booking-guide.tsx`: 네 가지 근거, 예약 방법 선택, 상담 준비 정보를 렌더링한다.
- Modify `app/stories/[slug]/page.tsx`: V5 컴포넌트, 직접 답변 FAQ, 내부 링크를 기존 정적 이야기 템플릿에 통합한다.
- Modify `app/globals.css`: V5 데스크톱·모바일 레이아웃과 접근성 있는 행동 스타일을 추가한다.
- Modify `tests/content-model.test.mjs`: 중앙 사실과 V5 FAQ, 수정일 계약을 검증한다.
- Modify `tests/routes-contract.test.mjs`: V5 컴포넌트, CTA 문구, 내부 링크와 기존 URL 계약을 검증한다.
- Modify `tests/analytics-contract.test.mjs`: 전화 상담과 네이버 예약 이벤트·placement 분리를 검증한다.
- Modify `tests/seo-schema.test.mjs`: 모임·회식 페이지의 화면 FAQ와 FAQPage 데이터 일치를 검증한다.
- Modify `tests/public-visible-terms.test.mjs`: 빌드 결과에서 V5 문구, 링크, 금지 표현을 검증한다.

---

### Task 1: Centralize V5 Group Facts and Direct Answers

**Files:**
- Modify: `lib/content/types.ts`
- Modify: `lib/content/store.ts`
- Modify: `lib/content/stories.ts`
- Modify: `tests/content-model.test.mjs`

**Interfaces:**
- Produces: `STORE.privateHireMinimum: string`
- Produces: `STORE.groupParking: string`
- Produces: `STORE.groupConsultation: readonly string[]`
- Produces: `GROUP_STORY_FAQ_ITEMS: readonly FaqItem[]`
- Preserves: `GROUP_FAQ_ITEMS` for the complete `/faq` route

- [ ] **Step 1: Add failing central-data tests**

Append the following test to `tests/content-model.test.mjs` and import `GROUP_STORY_FAQ_ITEMS` from `lib/content/store.ts`:

```js
test("V5 group conversion facts and direct answers stay centralized", () => {
  assert.equal(STORE.privateHireMinimum, "정해진 최소 인원이나 최소 금액 없음");
  assert.equal(STORE.groupParking, "건물 뒤 무료 지상주차장이 있으며 단체 차량 수는 예약 전에 상담해 주세요.");
  assert.deepEqual(STORE.groupConsultation, ["희망 날짜", "희망 시간", "예상 인원"]);
  assert.deepEqual(GROUP_STORY_FAQ_ITEMS, [
    {
      question: "청주에서 50명 안팎의 회식이 가능한가요?",
      answer: "어믜뜰은 한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다.",
    },
    {
      question: "단체 예약은 어떻게 하나요?",
      answer: "날짜·시간·예상 인원을 전화로 알려주시면 좌석과 준비 사항을 안내합니다. 일반 식사는 네이버 예약에서 가능한 시간을 확인할 수 있습니다.",
    },
    {
      question: "단체 차량을 주차할 수 있나요?",
      answer: "건물 뒤 무료 지상주차장이 있으며 단체 차량 수는 예약 전에 상담해 주세요.",
    },
  ]);
});

test("V5 group story carries the actual 2026-10-25 modification date", () => {
  const story = getStory("cheongju-group-dining");
  assert.equal(story?.modifiedAt, "2026-10-25");
  assert.match(story?.description ?? "", /2명부터 한 팀 최대 52명/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
node --test tests/content-model.test.mjs
```

Expected: FAIL because `StoreInfo` and `STORE` do not expose the three V5 fields, `GROUP_STORY_FAQ_ITEMS` does not exist, and the story modification date is still `2026-10-24`.

- [ ] **Step 3: Extend the central store interface**

Add these fields immediately after `privateHire` in `StoreInfo` inside `lib/content/types.ts`:

```ts
  privateHireMinimum: string;
  groupParking: string;
  groupConsultation: readonly string[];
```

- [ ] **Step 4: Add the verified values and story FAQ**

Add these properties immediately after `privateHire` in `STORE` inside `lib/content/store.ts`:

```ts
  privateHireMinimum: "정해진 최소 인원이나 최소 금액 없음",
  groupParking: "건물 뒤 무료 지상주차장이 있으며 단체 차량 수는 예약 전에 상담해 주세요.",
  groupConsultation: ["희망 날짜", "희망 시간", "예상 인원"],
```

Add this export after `GROUP_FAQ_ITEMS`:

```ts
export const GROUP_STORY_FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "청주에서 50명 안팎의 회식이 가능한가요?",
    answer: `어믜뜰은 한 팀 최대 ${STORE.maxGroupSize}명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다.`,
  },
  {
    question: "단체 예약은 어떻게 하나요?",
    answer: "날짜·시간·예상 인원을 전화로 알려주시면 좌석과 준비 사항을 안내합니다. 일반 식사는 네이버 예약에서 가능한 시간을 확인할 수 있습니다.",
  },
  {
    question: "단체 차량을 주차할 수 있나요?",
    answer: STORE.groupParking,
  },
];
```

Use `STORE.groupConsultation` only for the three-item checklist. Keep `GROUP_BOOKING_STEPS` unchanged because it describes the deeper four-step consultation process.

- [ ] **Step 5: Update the group story's approved description and modification date**

Change the `cheongju-group-dining` story entry in `lib/content/stories.ts` to:

```ts
    description: "청주 봉명동에서 2명부터 한 팀 최대 52명까지 이용할 수 있는 어믜뜰. 12테이블·총 52석, 통대관 사전 협의, 매운맛·간장맛, 무료주차와 예약 방법을 확인하세요.",
    modifiedAt: "2026-10-25",
```

Within that story's existing evidence sections, replace only the equivalent hard-coded minimum-condition and parking sentences with `STORE.privateHireMinimum` and `STORE.groupParking` interpolation. Keep the rendered wording and every other evidence sentence unchanged. Do not change its slug, published date, image, or evidence-section order.

- [ ] **Step 6: Run the focused tests**

Run:

```bash
node --test tests/content-model.test.mjs tests/search-discovery.test.mjs
```

Expected: PASS. The sitemap implementation continues to read `story.modifiedAt` rather than a separate hard-coded story date.

- [ ] **Step 7: Commit the centralized facts**

```bash
git add lib/content/types.ts lib/content/store.ts lib/content/stories.ts tests/content-model.test.mjs
git commit -m "feat: centralize group booking conversion facts"
```

---

### Task 2: Build the V5 Group Conversion Components

**Files:**
- Create: `components/site/group-dining-actions.tsx`
- Create: `components/site/group-booking-guide.tsx`
- Modify: `app/globals.css`
- Modify: `tests/routes-contract.test.mjs`
- Modify: `tests/analytics-contract.test.mjs`

**Interfaces:**
- Consumes: `STORE.phoneHref`, `STORE.phoneDisplay`, `STORE.bookingUrl`
- Consumes: `STORE.maxGroupSize`, `STORE.seats`, `STORE.privateHire`, `STORE.privateHireMinimum`, `STORE.groupParking`, `STORE.groupConsultation`
- Produces: `GroupDiningActions({ placement }: { placement: "group_story_hero" | "group_story_bottom" })`
- Produces: `GroupBookingGuide()`

- [ ] **Step 1: Add failing component and analytics contracts**

Append this test to `tests/routes-contract.test.mjs`:

```js
test("V5 group conversion components expose the approved choices and facts", () => {
  const actions = read("components/site/group-dining-actions.tsx");
  const guide = read("components/site/group-booking-guide.tsx");

  assert.match(actions, /단체·통대관 전화 상담/);
  assert.match(actions, /일반 식사 네이버 예약/);
  assert.match(actions, /STORE\.phoneDisplay/);
  assert.match(actions, /STORE\.phoneHref/);
  assert.match(actions, /STORE\.bookingUrl/);
  assert.match(guide, /STORE\.maxGroupSize/);
  assert.match(guide, /STORE\.seats/);
  assert.match(guide, /STORE\.privateHire/);
  assert.match(guide, /STORE\.privateHireMinimum/);
  assert.match(guide, /STORE\.groupParking/);
  assert.match(guide, /STORE\.groupConsultation\.map/);
});
```

Append this test to `tests/analytics-contract.test.mjs`:

```js
test("V5 group actions keep inquiry and reservation analytics distinct", () => {
  const source = read("components/site/group-dining-actions.tsx");
  assert.match(source, /eventName="group_inquiry_click"/);
  assert.match(source, /eventName="naver_reservation_click"/);
  assert.match(source, /placement=\{`\$\{placement\}_inquiry`\}/);
  assert.match(source, /placement=\{`\$\{placement\}_reservation`\}/);
});
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
node --test tests/routes-contract.test.mjs tests/analytics-contract.test.mjs
```

Expected: FAIL because both V5 component files are absent.

- [ ] **Step 3: Create `GroupDiningActions`**

Create `components/site/group-dining-actions.tsx` with:

```tsx
import { AnalyticsLink } from "@/components/site/analytics-link";
import { STORE } from "@/lib/content/store";

type GroupDiningActionsProps = {
  placement: "group_story_hero" | "group_story_bottom";
};

export function GroupDiningActions({ placement }: GroupDiningActionsProps) {
  return (
    <div className="group-dining-actions group-v5-actions">
      <AnalyticsLink
        className="button button-primary group-v5-action"
        href={STORE.phoneHref}
        eventName="group_inquiry_click"
        placement={`${placement}_inquiry`}
      >
        <span>단체·통대관 전화 상담</span>
        <small>{STORE.phoneDisplay}</small>
      </AnalyticsLink>
      <AnalyticsLink
        className="button button-secondary group-v5-action"
        href={STORE.bookingUrl}
        target="_blank"
        rel="noreferrer"
        eventName="naver_reservation_click"
        placement={`${placement}_reservation`}
      >
        <span>일반 식사 네이버 예약</span>
        <small>최신 예약 시간 확인</small>
      </AnalyticsLink>
    </div>
  );
}
```

The telephone link must remain a native `tel:` anchor even when analytics is unavailable.

- [ ] **Step 4: Create `GroupBookingGuide`**

Create `components/site/group-booking-guide.tsx` with:

```tsx
import { STORE } from "@/lib/content/store";

const proofs = [
  { label: "CAPACITY", title: `한 팀 최대 ${STORE.maxGroupSize}명`, detail: STORE.seats },
  { label: "PRIVATE HIRE", title: "통대관 사전 협의", detail: STORE.privateHireMinimum },
  { label: "PARKING", title: "건물 뒤 무료주차", detail: STORE.groupParking },
  { label: "MENU", title: "매운맛 · 간장맛", detail: "여러 취향을 함께 고려" },
] as const;

export function GroupBookingGuide() {
  return (
    <section className="group-booking-guide section-pad surface-paper" aria-labelledby="group-booking-guide-title">
      <div className="shell">
        <div className="group-v5-proof-grid" aria-label="단체 이용 핵심 정보">
          {proofs.map((proof) => (
            <article className="group-v5-proof" key={proof.label}>
              <p className="eyebrow">{proof.label}</p>
              <h2>{proof.title}</h2>
              <p>{proof.detail}</p>
            </article>
          ))}
        </div>

        <div className="group-v5-choice-grid">
          <article className="group-v5-choice">
            <p className="eyebrow">BOOKING CHOICE</p>
            <h2 id="group-booking-guide-title">어떤 방법으로 준비하면 될까요?</h2>
            <h3>일반 식사</h3>
            <p>네이버 예약에서 가능한 시간을 확인하고 예약합니다.</p>
            <h3>단체·통대관</h3>
            <p>전화로 날짜·시간·예상 인원을 먼저 알려주시면 좌석과 준비 사항을 안내합니다.</p>
            <p className="group-v5-note">특정 인원 기준을 새로 만들지 않고 통대관 여부는 매장과 사전에 협의합니다.</p>
          </article>

          <article className="group-v5-checklist">
            <p className="eyebrow">BEFORE YOU CALL</p>
            <h2>전화 전에 세 가지만 준비하세요</h2>
            <ol>
              {STORE.groupConsultation.map((item, index) => (
                <li key={item}><span>0{index + 1}</span>{item}</li>
              ))}
            </ol>
            <p>상담 후 메뉴 선택, 좌석 구성, 통대관 여부와 준비 사항을 확정합니다.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add the Pencil-approved responsive CSS**

Append this block to the existing group dining section at the top of `app/globals.css`:

```css
.group-v5-actions { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); width:min(760px,100%); }
.group-v5-action { min-height:88px; flex-direction:column; gap:4px; text-align:center; }
.group-v5-action small { font-size:15px; font-weight:600; }
.group-v5-proof-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
.group-v5-proof { min-width:0; border:1px solid var(--line); border-radius:6px; background:var(--hanji); padding:24px; }
.group-v5-proof h2 { margin:16px 0 8px; font-size:24px; line-height:1.3; }
.group-v5-proof > p:last-child { color:var(--muted); }
.group-v5-choice-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; margin-top:32px; }
.group-v5-choice,.group-v5-checklist { border-radius:8px; padding:32px; }
.group-v5-choice { background:var(--green); color:var(--white); }
.group-v5-choice .eyebrow,.group-v5-note { color:var(--straw); }
.group-v5-choice h2,.group-v5-checklist h2 { margin:10px 0 24px; font-size:30px; line-height:1.3; }
.group-v5-choice h3 { margin:22px 0 4px; font-size:22px; }
.group-v5-choice p { margin:0; }
.group-v5-note { margin-top:24px !important; font-weight:700; }
.group-v5-checklist { border:1px solid var(--line); background:var(--hanji); }
.group-v5-checklist ol { display:grid; gap:14px; margin:0 0 24px; padding:0; list-style:none; }
.group-v5-checklist li { display:flex; min-height:48px; align-items:center; gap:16px; border-top:1px solid var(--line); font-size:22px; font-weight:700; }
.group-v5-checklist li span { color:var(--red); font-size:16px; }

@media (max-width:767px) {
  .group-v5-actions,.group-v5-proof-grid,.group-v5-choice-grid { grid-template-columns:1fr; }
  .group-v5-action { min-height:62px; }
  .group-v5-proof { padding:20px; }
  .group-v5-proof h2 { font-size:22px; }
  .group-v5-choice,.group-v5-checklist { padding:24px; }
  .group-v5-choice h2,.group-v5-checklist h2 { font-size:27px; }
}
```

- [ ] **Step 6: Run component contracts and lint**

Run:

```bash
node --test tests/routes-contract.test.mjs tests/analytics-contract.test.mjs
pnpm lint
```

Expected: tests PASS and ESLint exits 0.

- [ ] **Step 7: Commit the V5 components**

```bash
git add components/site/group-dining-actions.tsx components/site/group-booking-guide.tsx app/globals.css tests/routes-contract.test.mjs tests/analytics-contract.test.mjs
git commit -m "feat: add group booking conversion components"
```

---

### Task 3: Integrate the V5 Flow, Direct Answers, and Internal Links

**Files:**
- Modify: `app/stories/[slug]/page.tsx`
- Modify: `tests/routes-contract.test.mjs`
- Modify: `tests/seo-schema.test.mjs`
- Modify: `tests/public-visible-terms.test.mjs`

**Interfaces:**
- Consumes: `GroupDiningActions`, `GroupBookingGuide`, `GROUP_STORY_FAQ_ITEMS`
- Preserves: `articleSchema(story)`, `breadcrumbSchema(...)`, static route generation, existing menu and parking evidence
- Produces: group-only FAQPage schema from the same three visible direct answers

- [ ] **Step 1: Add failing route, schema, and public-text contracts**

Add these assertions to the existing group-story test in `tests/routes-contract.test.mjs`:

```js
assert.match(detail, /import \{ GroupDiningActions \}/);
assert.match(detail, /import \{ GroupBookingGuide \}/);
assert.match(detail, /GROUP_STORY_FAQ_ITEMS/);
assert.match(detail, /title=\{isGroupStory \? "청주 모임·회식, 2명부터 한 팀 최대 52명까지"/);
assert.match(detail, /<GroupDiningActions placement="group_story_hero" \/>/);
assert.match(detail, /<GroupBookingGuide \/>/);
assert.match(detail, /<GroupDiningActions placement="group_story_bottom" \/>/);
for (const href of ["/menu", "/store", "/location", "/faq", "/reviews"]) {
  assert.match(detail, new RegExp(`href="${href}"`));
}
```

In the same test, replace the old loop that searches for `STORE.phoneHref`, `STORE.bookingUrl`, and both analytics events inline inside `page.tsx`. The actions now live in `GroupDiningActions`, so the route test must verify the two component placements shown above while `tests/analytics-contract.test.mjs` verifies the links and events inside the component. Keep the menu, `STORE.privateHire`, and `STORE.corkage` assertions.

Add this test to `tests/seo-schema.test.mjs` and import `GROUP_STORY_FAQ_ITEMS`:

```js
test("group story schema uses the same V5 direct answers shown on screen", () => {
  const page = read("app/stories/[slug]/page.tsx");
  assert.match(page, /if \(slug === "cheongju-group-dining"\) return GROUP_STORY_FAQ_ITEMS/);
  assert.match(page, /faqSchema\(faqs\)/);
  const schema = faqSchema(GROUP_STORY_FAQ_ITEMS);
  assert.deepEqual(
    schema.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]),
    GROUP_STORY_FAQ_ITEMS.map((item) => [item.question, item.answer]),
  );
});
```

Update the import in `tests/public-visible-terms.test.mjs` to include `GROUP_STORY_FAQ_ITEMS`. In the shared `/stories/cheongju-group-dining` and `/faq` branch, replace the unconditional `GROUP_FAQ_ITEMS` loop with:

```js
const expectedFaqItems = route === "/stories/cheongju-group-dining"
  ? GROUP_STORY_FAQ_ITEMS
  : GROUP_FAQ_ITEMS;
for (const item of expectedFaqItems) {
  assert.ok(text.includes(item.question));
  assert.ok(text.includes(item.answer));
  assert.ok(faq.mainEntity.some((entry) => entry.name === item.question && entry.acceptedAnswer.text === item.answer));
}
```

Keep the complete `FAQ_ITEMS + GROUP_FAQ_ITEMS` equality checks for `/faq` only.

In the existing fresh-build group-story assertions, replace the old `네이버에서 예약하기` and `2026-10-24 수정` expectations with `일반 식사 네이버 예약` and `2026-10-25 수정`, then add:

```js
for (const fact of [
  "청주 모임·회식, 2명부터 한 팀 최대 52명까지",
  "단체·통대관 전화 상담",
  "일반 식사 네이버 예약",
  "전화 전에 세 가지만 준비하세요",
  "청주에서 50명 안팎의 회식이 가능한가요?",
  "단체 예약은 어떻게 하나요?",
]) {
  assert.ok(text.includes(fact), fact);
}
for (const href of ["/menu", "/store", "/location", "/faq", "/reviews"]) {
  assert.ok(html.includes(`href="${href}"`), href);
}
```

- [ ] **Step 2: Run the focused contracts and verify failure**

Run:

```bash
node --test tests/routes-contract.test.mjs tests/seo-schema.test.mjs tests/public-visible-terms.test.mjs
```

Expected: FAIL because the page still uses the old hero, old group FAQ set, and inline old CTA labels.

- [ ] **Step 3: Replace group-story imports and FAQ selection**

In `app/stories/[slug]/page.tsx`:

```tsx
import { GroupDiningActions } from "@/components/site/group-dining-actions";
import { GroupBookingGuide } from "@/components/site/group-booking-guide";
```

Change the store import to include `GROUP_STORY_FAQ_ITEMS`, and change the first branch of `storyFaqItems` to:

```ts
  if (slug === "cheongju-group-dining") return GROUP_STORY_FAQ_ITEMS;
```

Remove `ProofStrip` from the imports and remove the group-only `<ProofStrip ... />` call because `GroupBookingGuide` now owns the four approved facts.

- [ ] **Step 4: Replace the group hero content and actions**

Change the `HeroMedia` props and children to this structure:

```tsx
      <HeroMedia
        eyebrow={isGroupStory ? "GROUP DINING · 청주 모임·회식" : `${story.category} · ${story.readingTime} 읽기`}
        title={isGroupStory ? "청주 모임·회식, 2명부터 한 팀 최대 52명까지" : story.title}
        description={story.description}
        image={story.image}
        imageAlt={story.imageAlt}
      >
        {isGroupStory ? (
          <GroupDiningActions placement="group_story_hero" />
        ) : (
          <a className="button button-primary" href="#article">이야기 읽기</a>
        )}
        {isGalbijjimStory ? (
          <AnalyticsLink className="button button-secondary" href={STORE.bookingUrl} target="_blank" rel="noreferrer" eventName="naver_reservation_click" placement="galbijjim_story_hero">네이버에서 예약하기</AnalyticsLink>
        ) : null}
      </HeroMedia>

      {isGroupStory ? <GroupBookingGuide /> : null}
```

This keeps one H1 and places telephone consultation before general reservation.

- [ ] **Step 5: Add explicit crawlable internal links**

Immediately before the group contact section, add:

```tsx
      {isGroupStory ? (
        <nav className="group-related-links section-pad surface-hanji" aria-label="모임 준비 관련 정보">
          <div className="shell">
            <p className="eyebrow">PLAN WITH VERIFIED DETAILS</p>
            <h2>메뉴와 방문 정보를 함께 확인하세요</h2>
            <div className="group-dining-actions">
              <Link className="button button-tertiary" href="/menu">메뉴 보기</Link>
              <Link className="button button-tertiary" href="/store">매장·좌석 보기</Link>
              <Link className="button button-tertiary" href="/location">오시는 길·주차</Link>
              <Link className="button button-tertiary" href="/faq">예약 FAQ</Link>
              <Link className="button button-tertiary" href="/reviews">최근 후기 확인</Link>
            </div>
          </div>
        </nav>
      ) : null}
```

- [ ] **Step 6: Replace the bottom inline actions**

Replace the two inline `AnalyticsLink` elements inside `.group-contact` with:

```tsx
<GroupDiningActions placement="group_story_bottom" />
```

Keep the verified corkage and `주류 주문은 필수가 아닙니다` copy already present in the section.

- [ ] **Step 7: Run the focused contracts**

Run:

```bash
node --test tests/content-model.test.mjs tests/routes-contract.test.mjs tests/analytics-contract.test.mjs tests/seo-schema.test.mjs tests/public-visible-terms.test.mjs
```

Expected: PASS. The built group page contains the three visible direct answers and the same three FAQPage entries.

- [ ] **Step 8: Commit the integrated page**

```bash
git add app/stories/[slug]/page.tsx tests/routes-contract.test.mjs tests/seo-schema.test.mjs tests/public-visible-terms.test.mjs
git commit -m "feat: improve group dining search conversion flow"
```

---

### Task 4: Full Verification, Pencil Comparison, and Preview Handoff

**Files:**
- Verify: `C:\vibecoding\my-shop\초안`
- Verify: all files changed in Tasks 1–3
- Modify only deterministic failures in those same files

**Interfaces:**
- Consumes: completed V5 implementation
- Produces: locally verified build and review-ready branch
- Does not produce: a production deployment

- [ ] **Step 1: Run the complete automated gate**

Run:

```bash
pnpm test
pnpm lint
pnpm build
```

Expected: all Node tests PASS, ESLint exits 0, Next build exits 0, and `/stories/cheongju-group-dining` remains a generated static route.

- [ ] **Step 2: Verify the sitemap modification date from the production build**

Start the built application on port 3016:

```bash
pnpm start -- --port 3016
```

Open `http://localhost:3016/sitemap.xml` and verify the entry for `https://eomeutteull.com/stories/cheongju-group-dining` has `2026-10-25` as its modification date. Do not change static-page dates.

- [ ] **Step 3: Compare desktop layout with the approved Pencil frame**

Open `http://localhost:3016/stories/cheongju-group-dining` at 1440px and compare with `검색 성장 V5 모임·회식 전환 개선 Pencil 승인안`.

Verify all of the following:

- H1 reads `청주 모임·회식, 2명부터 한 팀 최대 52명까지`.
- Telephone consultation is the first action and displays `0507-1449-0004`.
- General Naver reservation is the second action.
- Four proof cards appear in the approved order.
- Booking choice and three consultation items appear before the long article content.
- Existing menu, parking, four-step process, corkage, review evidence, and related stories remain available.
- Internal links to menu, store, location, FAQ, and reviews are visible and crawlable.

- [ ] **Step 4: Compare mobile layout at 390px and 320px**

Verify at both widths:

- no horizontal scrolling;
- H1, phone number, and CTA labels are not clipped;
- CTA height is at least 48px;
- proof and choice grids collapse to one column;
- the fixed telephone·directions·reservation bar does not cover the last content;
- focus order reaches telephone consultation, Naver reservation, internal links, FAQ, and bottom actions.

- [ ] **Step 5: Verify native links without analytics**

Run once without `NEXT_PUBLIC_GA_MEASUREMENT_ID` and verify:

- telephone consultation uses `tel:050714490004`;
- Naver reservation opens `STORE.bookingUrl`;
- map opens `STORE.directionsUrl`;
- no console error blocks navigation.

- [ ] **Step 6: Check the final diff and repository state**

Run:

```bash
git diff --check
git status --short
git log --oneline --decorate -5
```

Expected: no whitespace errors; only the pre-existing untracked `docs/superpowers/plans/2026-07-27-search-indexing-completion.md` remains outside commits; the branch contains the design, plan, content, component, and page commits.

- [ ] **Step 7: Commit deterministic QA fixes only if needed**

If Steps 1–5 require code changes, rerun `pnpm test && pnpm lint && pnpm build`, then commit only those files:

```bash
git add app components lib tests
git commit -m "fix: resolve group conversion V5 QA findings"
```

If no code changed, do not create an empty commit.

- [ ] **Step 8: Present the local preview and diff for approval**

Show the user:

- desktop and mobile preview;
- automated test, lint, and build results;
- exact changed files;
- confirmation that production is unchanged.

Wait for explicit approval before pushing, creating or updating a pull request, merging, or running a Vercel production deployment.

---

## Post-Approval Release Checklist

These actions are intentionally outside Tasks 1–4 and require the user's explicit release approval.

1. Push `codex/eomeutteull-group-conversion-v5`.
2. Create or update a Draft PR and attach it to this task.
3. Verify GitHub and Vercel preview checks.
4. Ask for final production approval.
5. Merge and verify `https://eomeutteull.com/stories/cheongju-group-dining`.
6. Submit the updated URL to Google Search Console and 네이버 서치어드바이저.
7. Compare the first complete 28 days against the preceding 28 days.
