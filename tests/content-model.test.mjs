import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";
import ts from "typescript";

import {
  DINING_STEPS,
  FAQ_ITEMS,
  GALBIJJIM_FAQ_ITEMS,
  GROUP_FAQ_ITEMS,
  GROUP_STORY_FAQ_ITEMS,
  HOME_FAQ_ITEMS,
  MENU_CATEGORIES,
  MENU_ITEMS,
  REVIEW_FAQ_ITEMS,
  REVIEW_ITEMS,
  REVIEW_SNAPSHOT,
  STORE,
  VISIT_INTENT_ITEMS,
} from "../lib/content/store.ts";
import { getStory, STORIES } from "../lib/content/stories.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const listSourceFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(path) : [path];
  });

test("central content exports approved store facts", () => {
  assert.equal(STORE.name, "어믜뜰");
  assert.equal(STORE.fullName, "어믜뜰 등갈비찜 청주봉명동본점");
  assert.equal(STORE.address, "충북 청주시 흥덕구 백봉로 213-1 1층");
  assert.equal(STORE.phoneDisplay, "0507-1449-0004");
  assert.equal(
    STORE.parking,
    "건물 뒤 무료 지상주차장 · 점심시간 및 17시 이후 도로 주차 가능",
  );
  assert.deepEqual(STORE.openingPeriods, [
    {
      label: "화~금 점심",
      days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "11:00",
      closes: "15:30",
    },
    {
      label: "화~금 저녁",
      days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "16:30",
      closes: "22:00",
    },
    {
      label: "토~일",
      days: ["Saturday", "Sunday"],
      opens: "11:00",
      closes: "22:00",
    },
  ]);
});

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

test("V5 group story preserves the original parking evidence wording", () => {
  const story = getStory("cheongju-group-dining");
  const parkingSection = story?.sections.find(({ heading }) => heading === "차량이 많은 모임도 미리 동선을 확인하세요");

  assert.equal(
    parkingSection?.body,
    "건물 뒤 무료 지상주차장을 이용할 수 있습니다. 단체 차량 수는 예약 전에 매장과 상담해 주세요. 매주 월요일과 설·추석 당일은 휴무이므로 모임 날짜를 정할 때 확인해 주세요.",
  );
});

test("central store exposes verified postal address components", () => {
  assert.deepEqual(STORE.postalAddress, {
    streetAddress: "백봉로 213-1 1층",
    addressLocality: "청주시 흥덕구",
    addressRegion: "충청북도",
    addressCountry: "KR",
  });
});

test("reservation CTA links directly to the Naver booking item", () => {
  const bookingUrl = new URL(STORE.bookingUrl);

  assert.equal(bookingUrl.hostname, "m.booking.naver.com");
  assert.equal(
    bookingUrl.pathname,
    "/booking/6/bizes/1611967/items/7499930",
  );
  assert.equal(bookingUrl.searchParams.get("theme"), "place");
  assert.doesNotMatch(STORE.bookingUrl, /search\.naver\.com/);
});

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
  assert.deepEqual(STORE.familyFacilities, ["유아의자", "어린이밥"]);
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

test("menu items retain required display fields and fallback media", () => {
  for (const item of MENU_ITEMS) {
    assert.equal(typeof item.price, "string");
    assert.equal(typeof item.includes, "string");
    assert.ok(item.image);
    assert.ok(item.imageAlt);
    assert.ok(MENU_CATEGORIES.some(({ id }) => id === item.category));
  }

  const beefPancake = MENU_ITEMS.find(({ slug }) => slug === "beef-pancake");
  assert.equal(beefPancake.includes, "");
  assert.equal(beefPancake.image, STORE.image);
  assert.equal(beefPancake.imageAlt, "육전 메뉴 안내");
  assert.equal(MENU_ITEMS[0].image, "/images/eomeuittul/spicy-ribs.jpg");
  assert.equal(MENU_ITEMS[0].includes, "등갈비찜 · 셀프바 · 수제우유빙수");
});

test("V6 store facts carry the 2026-11-07 verification source", () => {
  assert.equal(STORE.verifiedAt, "2026-11-07");
  assert.equal(
    STORE.verificationSource,
    "네이버 스마트플레이스·공개 플레이스",
  );
  assert.equal(STORE.lastOrder, "21:00");
  assert.equal(STORE.regularClosure, "매주 월요일");
  assert.equal(STORE.holidayClosure, "설·추석 당일");
  assert.equal(STORE.minGroupSize, 2);
  assert.equal(STORE.maxGroupSize, 52);
  assert.equal(STORE.privateHire, "최대 인원 이용 시 통대관 협의");
});

async function contentWithStoreChange(update) {
  const path = "lib/content/store.ts";
  const original = read(path);
  const source = update(original);
  assert.notEqual(source, original, "fixture changes central content");
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: { module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript,${encodeURIComponent(outputText)}`);
}

function changeSoySet(source, before, after) {
  return source.replace(/^.*menuItem\(\{ slug: "soy-set".*$/m,
    (line) => line.replace(before, after),
  );
}

for (const [field, before, after] of [
  ["price", 'price: "19,900원", priceAmount: 19900', 'price: "21,900원", priceAmount: 21900'],
  ["minimum order", "minimumOrder: 2", "minimumOrder: 3"],
]) {
  test(`V6 first-visit FAQ lists both sets when only the soy ${field} changes`, async () => {
    const content = await contentWithStoreChange((source) =>
      changeSoySet(source, before, after),
    );
    const { answer } = content.HOME_FAQ_ITEMS[0];
    for (const slug of ["spicy-set", "soy-set"]) {
      const { name, price, minimumOrder } = content.MENU_ITEMS.find((item) => item.slug === slug);
      assert.ok(answer.includes(`${name}: ${price}이며 ${minimumOrder}인 이상 주문합니다.`), answer);
    }
    assert.doesNotMatch(answer, /매운 등갈비찜 또는 간장 등갈비찜/);
  });
}

test("V6 set-category keeps the approved minimum label when both sets match", () => {
  assert.equal(
    MENU_CATEGORIES.find(({ id }) => id === "set").description,
    "매운맛과 간장맛 중 선택 · 2인 이상 주문",
  );
});

test("V6 set-category lists both minimums when only the soy minimum changes", async () => {
  const content = await contentWithStoreChange((source) =>
    changeSoySet(source, "minimumOrder: 2", "minimumOrder: 3"),
  );
  const { description } = content.MENU_CATEGORIES.find(({ id }) => id === "set");
  assert.match(description, /매운[^·]*2인 이상 주문/);
  assert.match(description, /간장[^·]*3인 이상 주문/);
  assert.doesNotMatch(description, /중 선택 · 2인 이상 주문/);
});

test("V6 home group booking summary follows central capacity", async () => {
  const { STORE: alternate } = await contentWithStoreChange((source) =>
    source.replace(/\bmaxGroupSize:\s*52,/, "maxGroupSize: 48,"),
  );
  assert.equal(alternate.maxGroupSize, 48);
  assert.match(alternate.groupBooking, /한 팀 최대 48명/);
  assert.doesNotMatch(alternate.groupBooking, /최대 52명/);
});

test("V6 home parking copy follows the central parking location", async () => {
  const location = "건물 옆 유료 지상주차장";
  const content = await contentWithStoreChange((source) =>
    source.replace(/^  location: .*,$/m, `  location: "${location}",`),
  );
  assert.equal(content.GROUP_PARKING_FACTS.location, location);
  const parking = [
    content.STORE.parking,
    content.HOME_FAQ_ITEMS.find(({ question }) => question.startsWith("주차와 예약")).answer,
    content.VISIT_INTENT_ITEMS.find(({ id }) => id === "group-dining").summary,
  ];
  assert.deepEqual(parking.map((copy) => copy.includes(location)), [true, true, true], parking.join("\n"));
  assert.doesNotMatch(parking.join(" "), /건물 뒤 무료 지상주차장/);
});

test("V6 home family answers and cards follow central facility availability", async () => {
  const content = await contentWithStoreChange((source) =>
    source
      .replace(/^  familyFacilities: .*,$/m, '  familyFacilities: ["어린이 식기"],')
      .replace(/^  accessibility: .*,$/m, '  accessibility: ["경사로 출입구"],'),
  );
  const family = [
    content.HOME_FAQ_ITEMS.find(({ question }) => question.startsWith("아이와 함께")).answer,
    content.VISIT_INTENT_ITEMS.find(({ id }) => id === "family-dining").summary,
  ];
  for (const copy of family) {
    assert.match(copy, /어린이 식기/);
    assert.match(copy, /경사로 출입구/);
    assert.doesNotMatch(copy, /어린이밥|유아의자|좌석·화장실/);
  }
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
  assert.equal(
    VISIT_INTENT_ITEMS.find(({ id }) => id === "family-dining").summary,
    "맵지 않은 간장맛 · 어린이밥 · 유아의자 · 휠체어 이용 가능 출입구·좌석·화장실",
  );
  assert.equal(
    VISIT_INTENT_ITEMS.find(({ id }) => id === "group-dining").summary,
    "12테이블 · 52석 · 6인 단체석 2테이블 · 최대 인원 이용 시 통대관 협의 · 건물 뒤 무료 지상주차장 · 날짜·시간·예상 인원 상담",
  );
});

test("review snapshot records the verified public Naver counts without deriving totals", () => {
  assert.equal(STORE.reviewUrl, "https://pcmap.place.naver.com/restaurant/2021816208/review/visitor");
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
    assert.equal(review.checkedAt, "2026-11-07");
    assert.equal(review.sourceLabel, "네이버 방문자 반응 요약");
    assert.doesNotMatch(`${review.title} ${review.summary}`, /[“”]|1위|최고|무조건/);
  }
});

test("review FAQ answers visit-intent questions from central verified facts", () => {
  assert.deepEqual(REVIEW_FAQ_ITEMS, [
    {
      question: "어믜뜰 후기에서 가장 많이 언급되는 장점은 무엇인가요?",
      answer:
        "2026년 11월 7일 확인한 네이버 방문자 반응에서는 음식의 맛과 고기 품질이 가장 많이 언급됐고, 친절한 응대와 넉넉한 양, 넓은 매장도 반복적으로 언급됐습니다.",
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

test("central content exports approved FAQ, review, and dining data", () => {
  assert.deepEqual(FAQ_ITEMS, [
    { question: "월요일에도 영업하나요?", answer: "매주 월요일은 정기휴무입니다." },
    { question: "브레이크 타임이 있나요?", answer: "평일 15:30~16:30이며 주말·공휴일은 제외됩니다." },
    { question: "주차할 수 있나요?", answer: "건물 뒤 무료 지상주차장을 이용할 수 있습니다." },
    { question: "포장이나 배달이 되나요?", answer: "포장은 가능하며 배달은 운영하지 않습니다." },
    { question: "매운맛이 걱정돼요.", answer: "매운 등갈비찜과 간장 등갈비찜 중 선택할 수 있습니다." },
    { question: "네이버 예약 혜택이 있나요?", answer: "네이버 예약 페이지에서 현재 제공되는 최신 혜택을 확인해 주세요." },
    { question: "아이와 함께 갈 수 있나요?", answer: "유아의자를 이용할 수 있습니다." },
    { question: "단체 이용이 가능한가요?", answer: "단체 이용이 가능하며 방문 전 전화 문의를 권장합니다." },
    { question: "콜키지 비용이 있나요?", answer: "외부 주류를 가져올 수 있으며 콜키지는 무료입니다. 주류 주문은 필수가 아닙니다." },
    { question: "휠체어로 이용할 수 있나요?", answer: "휠체어 이용 가능 출입구와 좌석, 화장실이 있습니다." },
    { question: "포장 메뉴는 할인되나요?", answer: "반조리 단품은 1인 14,000원, 반조리 세트는 1인 19,000원으로 준비되어 있습니다. 단품은 2인 이상 주문입니다." },
  ]);
  assert.deepEqual(
    REVIEW_ITEMS.map(({ title, summary }) => ({ title, summary })),
    [
      { title: "부드러운 등갈비와 만족스러운 맛", summary: "최근 확인한 방문자 후기와 반응 집계에서 음식의 맛과 고기 품질이 반복적으로 언급됩니다." },
      { title: "샤브식 등갈비와 다양한 셀프바", summary: "채소와 사리를 취향대로 더해 끓이고 메밀전, 임궁밥, 수제우유빙수까지 이어지는 식사 경험이 언급됩니다." },
      { title: "가족외식과 회식에 편한 공간", summary: "넓고 깔끔한 공간, 단체 이용과 가족 방문, 친절한 응대가 반복적으로 언급됩니다." },
    ],
  );
  assert.deepEqual(
    DINING_STEPS.map(({ number, title, body, alt }) => ({ number, title, body, alt })),
    [
      { number: "01", title: "등갈비찜 선택", body: "매운맛과 간장맛 중 취향에 맞게 고릅니다.", alt: "채소와 함께 차려진 어믜뜰 등갈비찜" },
      { number: "02", title: "재료 담기", body: "셀프바에서 채소, 버섯, 떡과 당면을 담습니다.", alt: "채소와 버섯, 떡과 당면이 준비된 어믜뜰 셀프바" },
      { number: "03", title: "샤브처럼 끓이기", body: "고른 재료를 등갈비찜과 함께 끓여 나누어 먹습니다.", alt: "등갈비찜에 셀프바 재료를 넣어 끓이는 모습" },
      { number: "04", title: "빙수로 마무리", body: "매콤한 한 상 뒤 수제우유빙수로 마무리합니다.", alt: "어믜뜰 수제우유빙수" },
    ],
  );
});

test("complete FAQ route content has unique questions and one canonical maximum-group answer", () => {
  const allFaqs = [...FAQ_ITEMS, ...GROUP_FAQ_ITEMS];
  const questions = allFaqs.map((item) => item.question);
  assert.equal(new Set(questions).size, questions.length, "duplicate questions in /faq content");
  const groupSizeAnswers = allFaqs.filter((item) => item.question === "한 팀 몇 명까지 이용할 수 있나요?");
  assert.deepEqual(groupSizeAnswers, [{
    question: "한 팀 몇 명까지 이용할 수 있나요?",
    answer: "한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다.",
  }]);
});

test("central public content consistently identifies Monday as the closure", () => {
  const publicContent = JSON.stringify({ FAQ_ITEMS, STORIES });

  assert.match(publicContent, /월요일(?:은)? 정기휴무/);
  assert.doesNotMatch(publicContent, /일요일(?:은)? 정기휴무/);
});

test("stories export six records and getStory finds a story or returns undefined", () => {
  assert.equal(STORIES.length, 6);
  const story = getStory("how-to-enjoy-ribs");
  assert.equal(story, STORIES[0]);
  assert.equal(story?.title, "처음 보는 등갈비찜, 이렇게 즐겨요");
  assert.equal(getStory("missing-story"), undefined);
  const galbijjimStory = getStory("cheongju-galbijjim-guide");
  assert.equal(galbijjimStory?.title, "청주갈비찜 맛집을 찾는다면");
  assert.match(galbijjimStory?.description ?? "", /청주갈비찜/);
  assert.match(JSON.stringify(galbijjimStory), /매운 등갈비찜/);
  assert.match(JSON.stringify(galbijjimStory), /간장 등갈비찜/);
  assert.deepEqual(
    STORIES.map(({ title, description }) => ({ title, description })),
    [
      { title: "처음 보는 등갈비찜, 이렇게 즐겨요", description: "등갈비 선택부터 수제우유빙수까지 네 단계를 소개합니다." },
      { title: "청주 봉명동 가족 외식 가이드", description: "좌석, 주차, 아이 동반과 예약 정보를 가족 외식 관점에서 정리합니다." },
      { title: "30여 종 셀프바를 즐기는 법", description: "채소와 버섯, 떡과 당면으로 나만의 한 상을 만드는 법을 소개합니다." },
      { title: "매운맛과 간장맛, 무엇을 고를까", description: "첫 방문자가 취향에 맞는 등갈비찜을 고를 수 있도록 비교합니다." },
      { title: "청주 모임·회식 장소 가이드", description: "청주 봉명동에서 2명부터 한 팀 최대 52명까지 이용할 수 있는 어믜뜰. 12테이블·총 52석, 통대관 사전 협의, 매운맛·간장맛, 무료주차와 예약 방법을 확인하세요." },
      { title: "청주갈비찜 맛집을 찾는다면", description: "청주갈비찜을 찾는 분들을 위해 봉명동 매운 등갈비찜과 간장 등갈비찜, 셀프바와 무료주차를 한 번에 정리했습니다." },
    ],
  );
  assert.deepEqual(STORIES.flatMap((story) => story.sections.map((section) => section.heading)), [
    "등갈비찜에서 시작해 한 상의 경험으로",
    "네 단계로 즐기기",
    "가족과 편안하게 머무는 자리",
    "방문 전에 확인할 정보",
    "아이와 휠체어 이용자도 편안하게",
    "수제우유빙수로 식사 마무리",
    "취향대로 담는 재료",
    "구성은 달라질 수 있어요",
    "매콤한 한 상",
    "편안한 간장 한 상",
    "회식과 단체모임을 한자리에서",
    "통대관은 네 단계로 편하게 협의합니다",
    "여러 취향이 모여도 고르기 좋은 두 가지 갈비찜",
    "차량이 많은 모임도 미리 동선을 확인하세요",
    "청주갈비찜을 찾는 분들이 먼저 확인할 것",
    "매운 등갈비찜과 간장 등갈비찜",
    "셀프바와 함께 완성하는 한 상",
    "가족외식과 모임까지 이어지는 이유",
  ]);
});

test("group and family guides include the verified 2026-10-23 visit facts", () => {
  const groupStory = getStory("cheongju-group-dining");
  assert.equal(groupStory?.modifiedAt, "2026-10-25");
  const groupContent = JSON.stringify(groupStory);
  for (const fact of ["2명부터 한 팀 최대 52명", STORE.privateHire, STORE.corkage, "주류 주문은 필수가 아닙니다", STORE.holidayClosure]) {
    assert.ok(groupContent.includes(fact), fact);
  }

  const familyStory = getStory("family-dining-guide");
  assert.equal(familyStory?.modifiedAt, "2026-10-23");
  const familyContent = JSON.stringify(familyStory);
  for (const fact of ["간장등갈비찜", "어린이밥", "유아의자", "휠체어", STORE.holidayClosure]) {
    assert.ok(familyContent.includes(fact), fact);
  }
});

test("priority local-search guides carry the current content modification date", () => {
  assert.equal(getStory("cheongju-group-dining")?.modifiedAt, "2026-10-25");
  assert.equal(getStory("cheongju-galbijjim-guide")?.modifiedAt, "2026-10-24");
});

test("galbijjim FAQ answers direct search questions", () => {
  assert.deepEqual(GALBIJJIM_FAQ_ITEMS, [
    { question: "청주갈비찜으로 어떤 메뉴를 먹을 수 있나요?", answer: "매운 등갈비찜과 간장 등갈비찜을 선택할 수 있습니다." },
    { question: "매운 음식을 못 먹어도 방문할 수 있나요?", answer: "간장 등갈비찜을 선택할 수 있어 아이와 함께하는 가족외식이나 여러 취향이 모인 자리에도 맞추기 좋습니다." },
    { question: "청주 봉명동에서 주차가 가능한가요?", answer: "건물 뒤 무료 지상주차장을 이용할 수 있습니다." },
    { question: "회식이나 단체 모임도 가능한가요?", answer: "한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다." },
  ]);
});

test("public source rejects corrupted Task 1 facts and spelling", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const files = ["app", "components", "lib"].flatMap((directory) =>
    listSourceFiles(join(root, directory)),
  );
  const prohibited = [
    "어밀뜰",
    "건물 앞",
    "공깃밥 · 면사리",
    "수제연유빙수",
    "30초 셀프바",
  ];

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const phrase of prohibited) {
      assert.equal(source.includes(phrase), false, `${file}: ${phrase}`);
    }
  }
});

test("central content avoids prohibited volatile source claims", () => {
  const source = read("lib/content/store.ts");
  assert.doesNotMatch(source, /AggregateRating/);
  assert.doesNotMatch(source, /숫자 평점 또는/);
});
