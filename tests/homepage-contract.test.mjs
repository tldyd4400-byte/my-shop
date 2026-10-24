import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { MENU_ITEMS, STORE } from "../lib/content/store.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const readBinary = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url));

test("home V4 exposes approved media, proof, trust, and conversion sections", () => {
  const page = read("app/page.tsx");

  for (const component of [
    "HeroMedia",
    "ProofStrip",
    "ExperienceSteps",
    "ReservationCta",
    "LocationPanel",
    "FaqList",
    "JsonLd",
    "MenuCategoryGrid",
    "VisitFacts",
  ]) {
    assert.match(page, new RegExp(component));
  }

  assert.match(page, /hero-brand-720p\.mp4/);
  assert.match(
    page,
    /<HeroMedia[\s\S]*?image="\/images\/eomeuittul\/hero-poster\.webp"/,
  );
  assert.match(page, /청주 봉명동 맛집 어믜뜰/);

  const resolvedCopy = page
    .replace("${MENU_ITEMS.length}", String(MENU_ITEMS.length))
    .replaceAll("{STORE.maxGroupSize}", String(STORE.maxGroupSize));
  for (const phrase of [
    "회식도 가족외식도",
    "함께 끓여 더 즐거운 한 상",
    "52명 모임 상담",
    "전체 메뉴 보기",
    "메뉴 17개 최신 가격",
    "매장 뒤 무료 주차",
  ]) assert.match(resolvedCopy, new RegExp(phrase));
  assert.match(page, /placement="home_group"/);
  assert.match(page, /STORE\.bookingUrl/);
  assert.match(page, /STORE\.phoneHref/);
});

test("home V4 keeps the approved section order", () => {
  const page = read("app/page.tsx");

  const sections = [
    "<HeroMedia",
    "<ProofStrip",
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

  const positions = sections.map((section) => page.indexOf(section));
  assert.equal(positions.every((position) => position >= 0), true);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));

  const visualBlocks =
    page.match(
      /<(?:HeroMedia|ProofStrip|ExperienceSteps|GroupDiningPanel|ReservationCta|VisitFacts|LocationPanel)\b|<section\b/g,
    ) ?? [];
  assert.equal(visualBlocks.length, 11);
  for (const section of sections) {
    assert.equal(page.split(section).length - 1, 1, section);
  }
});

test("home V4 uses central content and matches visible FAQ items to JSON-LD", () => {
  const page = read("app/page.tsx");

  for (const source of ["FAQ_ITEMS", "MENU_ITEMS", "REVIEW_ITEMS", "REVIEW_SNAPSHOT", "STORE"]) {
    assert.match(page, new RegExp(source));
  }

  assert.match(page, /const homeFaqs = FAQ_ITEMS\.slice\(0, 4\)/);
  assert.match(page, /faqSchema\(homeFaqs\)/);
  assert.match(page, /<FaqList items=\{homeFaqs\}/);
  assert.doesNotMatch(
    page,
    /AggregateRating|rating:|reviewCount|review-rating|낙지파전|등갈비 1인분 추가|예약 (?:완료|확정)/,
  );
  assert.doesNotMatch(
    page,
    /(?:맛있어요|고기 질|특별한 메뉴|매장이 넓)[^\n]*\d/,
  );
});

test("home V4 uses Next Link internally and leaves shared chrome to the root", () => {
  const page = read("app/page.tsx");

  assert.match(page, /import Link from "next\/link"/);
  assert.match(page, /<Link[\s\S]*?href="\/menu"/);
  const reviewLinks = (page.match(/<a[\s\S]*?<\/a>/g) ?? []).filter((link) =>
    link.includes("review.sourceUrl"),
  );
  assert.equal(reviewLinks.length, 1);
  for (const link of reviewLinks) {
    assert.match(link, /href=\{review\.sourceUrl\}/);
    assert.match(link, /target="_blank"/);
    assert.match(link, /rel="noreferrer"/);
  }
  assert.doesNotMatch(page, /SiteHeader|SiteFooter|MobileActionBar/);
});

test("home V4 preserves the 390px stack and 48px interactive targets", () => {
  const styles = read("app/globals.css");

  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(
    styles,
    /\.split-section,[\s\S]*?\.menu-grid,[\s\S]*?\.review-grid\s*{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(styles, /\.button\s*{[\s\S]*?min-height:\s*54px/);
  assert.match(styles, /\.faq-list summary\s*{[\s\S]*?min-height:\s*48px/);
  assert.match(styles, /\.review-grid a\s*{[\s\S]*?min-height:\s*48px/);
  assert.match(styles, /\.menu-category-grid\s*{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 767px\)\s*{[^}]*\.menu-category-grid,[\s\S]*?\.visit-facts-grid\s*{\s*grid-template-columns:\s*1fr/);
  assert.match(styles, /\.button-tertiary\s*{[^}]*color:\s*var\(--ink\)/);
});

test("home V4 prioritizes tracked reservation and group inquiry before menu browsing", () => {
  const page = read("app/page.tsx");
  const hero = page.match(/<HeroMedia[\s\S]*?<\/HeroMedia>/)?.[0] ?? "";
  const actions = hero.match(/<(?:AnalyticsLink|Link)\b[\s\S]*?<\/(?:AnalyticsLink|Link)>/g) ?? [];
  assert.equal(actions.length, 3);
  assert.match(actions[0], /href=\{STORE\.bookingUrl\}/);
  assert.match(actions[0], /eventName="naver_reservation_click"/);
  assert.match(actions[0], /target="_blank"[\s\S]*?rel="noreferrer"/);
  assert.match(actions[1], /href=\{STORE\.phoneHref\}/);
  assert.match(actions[1], /eventName="group_inquiry_click"/);
  for (const action of actions.slice(0, 2)) assert.match(action, /placement="home_hero"/);
  assert.match(actions[2], /className="button button-tertiary" href="\/menu"/);
});

test("home V4 labels its verified rating with source and checked date", () => {
  const page = read("app/page.tsx");
  assert.match(page, /네이버 평점 \$\{REVIEW_SNAPSHOT\.rating\} \/ 5/);
  assert.match(page, /REVIEW_SNAPSHOT\.checkedAt\.replaceAll\("-", "\."\)\} 확인/);
  assert.match(page, /메뉴 \$\{MENU_ITEMS\.length\}개 최신 가격/);
  assert.match(page, /2~\$\{STORE\.maxGroupSize\}명 단체석 · 통대관 협의/);
});

test("home V4 menu preview groups central categories with optional four-item summaries", () => {
  assert.equal(existsSync(new URL("../components/site/menu-category-grid.tsx", import.meta.url)), true);
  const grid = read("components/site/menu-category-grid.tsx");
  assert.match(read("app/page.tsx"), /<MenuCategoryGrid compact \/>/);
  assert.match(grid, /compact = false/);
  assert.match(grid, /MENU_CATEGORIES\.map/);
  assert.match(grid, /MENU_ITEMS\.filter\(\(item\) => item\.category === category\.id\)/);
  assert.match(grid, /compact \? items\.slice\(0, 4\) : items/);
  for (const field of ["category.label", "category.description", "item.name", "item.description", "item.price", "item.minimumOrder"]) {
    assert.ok(grid.includes(field), field);
  }
  assert.match(grid, /인 이상 주문/);
});

test("home V4 visit facts expose hours, closures, parking, and accessible family facilities", () => {
  assert.equal(existsSync(new URL("../components/site/visit-facts.tsx", import.meta.url)), true);
  const facts = read("components/site/visit-facts.tsx");
  assert.match(facts, /aria-labelledby="visit-facts-title"/);
  assert.match(facts, /id="visit-facts-title"/);
  assert.match(facts, /화~금/);
  assert.match(facts, /const \[weekdayLunch, weekdayDinner, weekend\] = STORE\.openingPeriods/);
  assert.match(facts, /\$\{weekdayLunch\.opens\}~\$\{weekdayDinner\.closes\} · \$\{weekdayLunch\.closes\}~\$\{weekdayDinner\.opens\} 브레이크타임/);
  assert.match(facts, /\$\{weekend\.opens\}~\$\{weekend\.closes\} · 브레이크타임 없음/);
  assert.doesNotMatch(facts, /11:00|22:00|15:30|16:30/);
  assert.match(facts, /토·일·공휴일/);
  assert.match(facts, /브레이크타임 없음/);
  for (const field of ["lastOrder", "regularClosure", "holidayClosure", "parking", "familyFacilities", "accessibility"]) {
    assert.ok(facts.includes(`STORE.${field}`), field);
  }
});

test("home hero derives price, minimum order, and capacity from the central model", () => {
  const page = read("app/page.tsx");
  assert.match(page, /const signatureSet = MENU_ITEMS\.find\(\(item\) => item\.slug === "spicy-set"\)!/);
  assert.match(page, /description=\{`매운·간장 등갈비찜 세트 1인 \$\{signatureSet\.price\} · \$\{signatureSet\.minimumOrder\}인 이상 · 최대 \$\{STORE\.maxGroupSize\}명 단체 이용과 통대관 상담 · 무료 주차`\}/);
  assert.match(page, /\{STORE\.maxGroupSize\}명 모임 상담/);
  assert.doesNotMatch(page, /19,900원|2인 이상|52명 모임 상담/);
});

test("home V4 group panel includes private hire, corkage, and both tracked contact choices", () => {
  const panel = read("components/site/group-dining-panel.tsx");
  for (const field of ["privateHire", "corkage", "bookingUrl", "phoneHref"]) {
    assert.ok(panel.includes(`STORE.${field}`), field);
  }
  assert.match(panel, /주류 주문 필수 아님/);
  assert.match(panel, /eventName="naver_reservation_click" placement=\{placement\}/);
  assert.match(panel, /eventName="group_inquiry_click" placement=\{placement\}/);
});

test("home V4 preserves approved online-review loading and static fallback", () => {
  const page = read("app/page.tsx");
  assert.match(page, /await loadPublicOnlineReviews\(3\)/);
  assert.match(page, /onlineReviews\.length > 0 \? \([\s\S]*?<OnlineReviewCards reviews=\{onlineReviews\} \/>[\s\S]*?\) : \([\s\S]*?REVIEW_ITEMS\.map/);
});

test("layout uses central Korean metadata and document language", () => {
  const layout = read("app/layout.tsx");
  const content = read("lib/content/store.ts");

  assert.match(layout, /lang="ko"/);
  assert.match(layout, /청주 봉명동 맛집 어믜뜰 \| 색다른 등갈비찜/);
  assert.match(layout, /STORE/);
  assert.match(content, /https:\/\/eomeutteull\.com/);
});

test("root layout uses shared chrome and optional GA4", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /SiteHeader/);
  assert.match(layout, /SiteFooter/);
  assert.match(layout, /MobileActionBar/);
  assert.match(layout, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(layout, /lang="ko"/);
});

test("approved owner-provided visual assets exist", () => {
  for (const name of [
    "hero-table.jpg",
    "spicy-ribs.jpg",
    "soy-ribs.jpg",
    "buckwheat-pancake.jpg",
    "imgung-rice.jpg",
    "interior.jpg",
    "facade.jpg",
    "identity-wall.jpg",
  ]) {
    assert.equal(
      existsSync(
        new URL(`../public/images/eomeuittul/${name}`, import.meta.url),
      ),
      true,
      name,
    );
  }
});

test("published restaurant photos do not expose EXIF metadata", () => {
  for (const name of [
    "hero-table.jpg",
    "spicy-ribs.jpg",
    "soy-ribs.jpg",
    "buckwheat-pancake.jpg",
    "imgung-rice.jpg",
    "interior.jpg",
    "facade.jpg",
    "identity-wall.jpg",
  ]) {
    const bytes = readBinary(`public/images/eomeuittul/${name}`);
    assert.equal(bytes.includes(Buffer.from("Exif\0\0", "latin1")), false, name);
  }
});

test("public homepage no longer labels restaurant imagery as temporary", () => {
  const page = read("app/page.tsx");
  const content = read("lib/content/store.ts");

  assert.doesNotMatch(`${page}\n${content}`, /테스트용|교체 예정/);
});

test("homepage publishes local restaurant, four-item FAQ, and website schemas", () => {
  const page = read("app/page.tsx");
  const content = read("lib/content/store.ts");
  const layout = read("app/layout.tsx");
  const source = `${page}\n${content}`;

  assert.match(source, /restaurantSchema/);
  assert.match(source, /faqSchema/);
  assert.match(source, /websiteSchema/);
  assert.match(layout, /alternates/);
  assert.match(layout, /openGraph/);
  assert.match(content, /화~금 점심/);
  assert.match(content, /화~금 저녁/);
  assert.match(content, /토~일/);
  assert.match(content, /15:30/);
  assert.match(content, /16:30/);
});

test("public body copy stays at least 16px", () => {
  const styles = read("app/globals.css");

  assert.doesNotMatch(styles, /font-size:\s*0\.[0-9]+rem/);
});
