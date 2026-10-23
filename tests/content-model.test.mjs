import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  DINING_STEPS,
  FAQ_ITEMS,
  GALBIJJIM_FAQ_ITEMS,
  MENU_CATEGORIES,
  MENU_ITEMS,
  REVIEW_ITEMS,
  REVIEW_SNAPSHOT,
  STORE,
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

test("review snapshot records source and checked date without schema claims", () => {
  assert.deepEqual(REVIEW_SNAPSHOT, {
    rating: 4.94,
    participants: 362,
    checkedAt: "2026-10-23",
    sourceLabel: "네이버 스마트플레이스 관리자 화면",
    sourceUrl: STORE.placeUrl,
  });
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
    { question: "한 팀 몇 명까지 이용할 수 있나요?", answer: "한 팀 최대 52명까지 이용할 수 있으며 최대 인원 이용 시 통대관으로 협의합니다." },
    { question: "콜키지 비용이 있나요?", answer: "외부 주류를 가져올 수 있으며 콜키지는 무료입니다. 주류 주문은 필수가 아닙니다." },
    { question: "휠체어로 이용할 수 있나요?", answer: "휠체어 이용 가능 출입구와 좌석, 화장실이 있습니다." },
    { question: "포장 메뉴는 할인되나요?", answer: "반조리 단품은 1인 14,000원, 반조리 세트는 1인 19,000원으로 준비되어 있습니다. 단품은 2인 이상 주문입니다." },
  ]);
  assert.deepEqual(
    REVIEW_ITEMS.map(({ title, summary }) => ({ title, summary })),
    [
      { title: "색다른 한 상", summary: "등갈비찜과 샤브샤브를 함께 즐기는 이색적인 조합이라는 반응이 있습니다." },
      { title: "부드러운 등갈비", summary: "등갈비가 부드러워 가족과 함께 먹기 좋았다는 반응이 있습니다." },
      { title: "골라 먹는 재미", summary: "채소를 자유롭게 더하고 메밀전과 함께 먹는 방식이 재미있다는 반응이 있습니다." },
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
      { title: "청주 모임·회식 장소 가이드", description: "한 팀 최대 52명, 통대관까지 가능한 어믜뜰. 날짜·시간·인원 사전 협의부터 메뉴 선택과 무료주차까지 단체 이용 정보를 확인하세요." },
      { title: "청주갈비찜 맛집을 찾는다면", description: "청주갈비찜을 찾는 분들을 위해 봉명동 매운 등갈비찜과 간장 등갈비찜, 셀프바와 무료주차를 한 번에 정리했습니다." },
    ],
  );
  assert.deepEqual(STORIES.flatMap((story) => story.sections.map((section) => section.heading)), [
    "등갈비찜에서 시작해 한 상의 경험으로",
    "네 단계로 즐기기",
    "가족과 편안하게 머무는 자리",
    "방문 전에 확인할 정보",
    "가족의 취향에 맞는 갈비찜",
    "수제우유빙수로 식사 마무리",
    "취향대로 담는 재료",
    "구성은 달라질 수 있어요",
    "매콤한 한 상",
    "편안한 간장 한 상",
    "한 팀 최대 52명까지 한자리에서",
    "통대관은 네 단계로 편하게 협의합니다",
    "여러 취향이 모여도 고르기 좋은 두 가지 갈비찜",
    "차량이 많은 모임도 미리 동선을 확인하세요",
    "청주갈비찜을 찾는 분들이 먼저 확인할 것",
    "매운 등갈비찜과 간장 등갈비찜",
    "셀프바와 함께 완성하는 한 상",
    "가족외식과 모임까지 이어지는 이유",
  ]);
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
