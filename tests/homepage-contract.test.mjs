import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import * as storeContent from "../lib/content/store.ts";
import * as metadata from "../lib/seo/metadata.ts";
import * as schema from "../lib/seo/schema.ts";

const { MENU_ITEMS, STORE } = storeContent;

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const readBinary = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url));

test("home V6 exposes approved media, trust, and conversion sections", () => {
  const page = read("app/page.tsx");

  for (const component of [
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
  ]) {
    assert.match(page, new RegExp(component));
  }

  assert.match(page, /hero-brand-720p\.mp4/);
  assert.match(
    page,
    /<HeroMedia[\s\S]*?image="\/images\/eomeuittul\/hero-poster\.webp"/,
  );
  assert.match(page, /청주갈비찜·회식·가족외식/);

  const resolvedCopy = page.replaceAll("{STORE.maxGroupSize}", String(STORE.maxGroupSize));
  for (const phrase of [
    "회식도 가족외식도",
    "함께 끓여 더 즐거운 한 상",
    "52명 모임 상담",
    "전체 메뉴 보기",
  ]) assert.match(resolvedCopy, new RegExp(phrase));
  assert.match(page, /placement="home_group"/);
  assert.match(page, /STORE\.bookingUrl/);
  assert.match(page, /STORE\.phoneHref/);
});

test("home metadata and review section support the priority search intents", () => {
  const page = read("app/page.tsx");
  assert.match(page, /title: "청주갈비찜·회식·가족외식 \| 어믜뜰 청주봉명동본점"/);
  assert.match(page, /청주갈비찜/);
  assert.match(page, /청주 회식과 가족외식/);
  const reviewSection = page.match(/<section className="review-preview[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(reviewSection, /<h2>손님이 먼저 알아본 어믜뜰<\/h2>\s*<Link className="button button-tertiary" href="\/reviews">\s*최신 후기 전체 보기\s*<\/Link>/);
  assert.match(page, /await loadPublicOnlineReviews\(3\)/);
});

test("home V6 keeps the approved section order", () => {
  const page = read("app/page.tsx");

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

  const positions = sections.map((section) => page.indexOf(section));
  assert.equal(positions.every((position) => position >= 0), true);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));

  const visualBlocks =
    page.match(
      /<(?:HeroMedia|LatestStoreFacts|VisitIntentGrid|ExperienceSteps|GroupDiningPanel|ReservationCta|VisitFacts|LocationPanel)\b|<section\b/g,
    ) ?? [];
  assert.equal(visualBlocks.length, 12);
  for (const section of sections) {
    assert.equal(page.split(section).length - 1, 1, section);
  }
  assert.doesNotMatch(page, /<ProofStrip\b/);
});

test("home V6 uses central content and matches visible FAQ items to JSON-LD", () => {
  const page = read("app/page.tsx");

  for (const source of ["HOME_FAQ_ITEMS", "MENU_ITEMS", "REVIEW_ITEMS", "STORE"]) {
    assert.match(page, new RegExp(source));
  }

  assert.match(page, /const homeFaqs = HOME_FAQ_ITEMS/);
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

test("home V6 uses Next Link for reviews and leaves shared chrome to the root", () => {
  const page = read("app/page.tsx");

  assert.match(page, /import Link from "next\/link"/);
  assert.match(page, /<Link[\s\S]*?href="\/reviews"/);
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

test("home V6 preserves the 390px stack and 48px interactive targets", () => {
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
});

test("home V6 prioritizes tracked reservation and group inquiry before menu browsing", () => {
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
  assert.match(actions[2], /className="button button-tertiary"/);
  assert.match(actions[2], /href="\/menu"/);
  assert.match(actions[2], /eventName="visit_intent_click"/);
  assert.match(actions[2], /placement="home_hero_menu"/);
});

function luminanceForRule(styles, selector, property) {
  const declarations = styles.split(`${selector} {`)[1]?.split("}")[0] ?? "";
  const token = declarations.match(new RegExp(`(?:^|\\s)${property}:\\s*var\\((--[\\w-]+)\\)`))?.[1];
  assert.ok(token, `${selector} must define a ${property} color token`);
  const hex = styles.match(new RegExp(`${token}:\\s*#([0-9a-f]{6})\\s*;`, "i"))?.[1];
  const white = styles.match(new RegExp(`${token}:\\s*#([0-9a-f]{3})\\s*;`, "i"))?.[1];
  const channels = hex?.match(/../g) ?? white?.split("").map((digit) => digit.repeat(2));
  assert.ok(channels, `missing hex color for ${token}`);
  const [r, g, b] = channels.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

for (const [label, surface] of [
  [".latest-store-facts .eyebrow", ".latest-store-facts"],
  [".latest-store-facts-grid dt", ".latest-store-facts-grid > div"],
  [".visit-intent-card--featured .visit-intent-label", ".visit-intent-card--featured"],
]) {
  test(`home V6 label ${label} meets 4.5:1 contrast`, () => {
    const styles = read("app/globals.css");
    const fg = luminanceForRule(styles, label, "color");
    const bg = luminanceForRule(styles, surface, "background");
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    assert.ok(ratio >= 4.5, `${label} contrast is ${ratio.toFixed(3)}:1`);
  });
}

test("home V6 menu preview groups central categories with optional four-item summaries", () => {
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

test("home V6 visit facts expose hours, closures, parking, and accessible family facilities", () => {
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

test("home V6 group panel includes private hire, corkage, and both tracked contact choices", () => {
  const panel = read("components/site/group-dining-panel.tsx");
  for (const field of ["privateHire", "corkage", "bookingUrl", "phoneHref"]) {
    assert.ok(panel.includes(`STORE.${field}`), field);
  }
  assert.match(panel, /주류 주문 필수 아님/);
  assert.match(panel, /eventName="naver_reservation_click" placement=\{placement\}/);
  assert.match(panel, /eventName="group_inquiry_click" placement=\{placement\}/);
});

test("home V6 preserves approved online-review loading and static fallback", () => {
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

const require = createRequire(import.meta.url);

function evaluateTypeScript(path, source, imports = require) {
  const { outputText } = ts.transpileModule(source, {
    fileName: path,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const exports = {};
  new Function("require", "exports", outputText)(imports, exports);
  return exports;
}

function evaluateHomePage(content = storeContent) {
  const path = "app/page.tsx";
  const heroPath = "components/site/hero-media.tsx";
  const heroModule = evaluateTypeScript(heroPath, read(heroPath));
  const imports = {
    "@/lib/content/store": content,
    "@/lib/seo/metadata": metadata,
    "@/lib/seo/schema": schema,
    "@/lib/online-reviews/public": { loadPublicOnlineReviews: async () => [] },
    "@/components/site/hero-media": heroModule,
  };
  // Unrendered sibling components are irrelevant to the props HomePage gives its hero.
  return { heroModule, ...evaluateTypeScript(path, read(path), (id) =>
    imports[id] ?? (id.startsWith("@/components/") ? {} : require(id)),
  ) };
}

async function homeHeroDescription(content = storeContent) {
  const { default: HomePage, heroModule } = evaluateHomePage(content);
  const main = await HomePage();
  return main.props.children.find(({ type }) => type === heroModule.HeroMedia).props.description;
}

test("home V6 hero preserves the approved combined price and minimum copy", async () => {
  assert.equal(
    await homeHeroDescription(),
    "매운·간장 등갈비찜 세트 1인 19,900원 · 2인 이상 · 최대 52명 단체 이용과 통대관 상담 · 무료 주차",
  );
});

test("home V6 hero description follows central capacity", async () => {
  const description = await homeHeroDescription({
    ...storeContent,
    STORE: { ...STORE, maxGroupSize: 48 },
  });
  assert.match(description, /최대 48명 단체 이용/);
});

test("home V6 metadata description follows central capacity", () => {
  const home = evaluateHomePage({
    ...storeContent,
    STORE: { ...STORE, maxGroupSize: 48 },
  });
  assert.match(home.metadata.description, /최대 48명 통대관 상담/);
  assert.equal(home.metadata.openGraph.description, home.metadata.description);
  assert.doesNotMatch(home.metadata.description, /최대 52명/);
});

test("home V6 hero and metadata do not retain a stale free-parking claim", async () => {
  const content = {
    ...storeContent,
    GROUP_PARKING_FACTS: { ...storeContent.GROUP_PARKING_FACTS, summary: "유료 주차" },
  };
  for (const description of [
    await homeHeroDescription(content),
    evaluateHomePage(content).metadata.description,
  ]) {
    assert.match(description, /유료 주차/);
    assert.doesNotMatch(description, /무료 주차/);
  }
});

test("home V6 group panel follows the central parking location", () => {
  const path = "components/site/group-dining-panel.tsx";
  const linkPath = "components/site/analytics-link.tsx";
  const { GroupDiningPanel } = evaluateTypeScript(path, read(path), (id) => {
    if (id === "@/lib/content/store") {
      const location = "건물 옆 유료 지상주차장";
      return {
        ...storeContent,
        GROUP_PARKING_FACTS: { ...storeContent.GROUP_PARKING_FACTS, location },
      };
    }
    if (id === "@/components/site/analytics-link") return evaluateTypeScript(linkPath, read(linkPath));
    return require(id);
  });
  const html = renderToStaticMarkup(GroupDiningPanel({ placement: "home_group" }));
  assert.match(html, /건물 옆 유료 지상주차장/);
  assert.doesNotMatch(html, /건물 뒤 무료 지상주차장/);
});

for (const [field, change] of [
  ["price", { price: "21,900원", priceAmount: 21900 }],
  ["minimum order", { minimumOrder: 3 }],
]) {
  test(`home V6 hero lists both sets when only the soy ${field} changes`, async () => {
    const items = MENU_ITEMS.map((item) =>
      item.slug === "soy-set" ? { ...item, ...change } : item,
    );
    const description = await homeHeroDescription({ ...storeContent, MENU_ITEMS: items });
    for (const slug of ["spicy-set", "soy-set"]) {
      const { name, price, minimumOrder } = items.find((item) => item.slug === slug);
      assert.ok(description.includes(`${name} ${price} · ${minimumOrder}인 이상`), description);
    }
    assert.doesNotMatch(description, /매운·간장/);
  });
}

function renderLatestFacts(content = { STORE, MENU_ITEMS }) {
  const path = "components/site/latest-store-facts.tsx";
  const { LatestStoreFacts } = evaluateTypeScript(path, read(path), (id) =>
    id === "@/lib/content/store" ? content : require(id),
  );
  return renderToStaticMarkup(LatestStoreFacts());
}

function displayedFacts(html) {
  return Object.fromEntries(
    Array.from(html.matchAll(/<dt\b[^>]*>(.*?)<\/dt>\s*<dd\b[^>]*>(.*?)<\/dd>/gs),
      ([, label, value]) => [label, value.replace(/<[^>]*>/g, "")]),
  );
}

test("V6 latest facts preserve the approved current display", () => {
  const html = renderLatestFacts();
  assert.deepEqual(displayedFacts(html), {
    영업: "화~금 11:00~22:00 · 15:30~16:30 브레이크 · 토~일 11:00~22:00 · 매주 월요일",
    "대표 세트": "매운·간장 19,900원 · 2인 이상",
    주차: STORE.parking,
    단체: `2~52명 · ${STORE.privateHire}`,
  });
  assert.ok(html.includes(STORE.verificationSource));
  assert.ok(html.includes(`<time dateTime="${STORE.verifiedAt}">${STORE.verifiedAt.replaceAll("-", ".")} 확인</time>`));
});

test("V6 latest facts follow alternate opening-period labels", () => {
  const openingPeriods = STORE.openingPeriods.map((period, index) => ({
    ...period,
    label: ["수~금 점심", "수~금 저녁", "일~월"][index],
  }));
  const facts = displayedFacts(renderLatestFacts({
    STORE: { ...STORE, openingPeriods }, MENU_ITEMS,
  }));
  assert.match(facts.영업, /수~금 11:00~22:00/);
  assert.match(facts.영업, /일~월 11:00~22:00/);
  assert.doesNotMatch(facts.영업, /화~금|토~일/);
});

test("V6 latest facts do not merge opening periods with different day labels", () => {
  const openingPeriods = STORE.openingPeriods.map((period, index) =>
    index === 1 ? { ...period, label: "목~금 저녁" } : period,
  );
  const facts = displayedFacts(renderLatestFacts({
    STORE: { ...STORE, openingPeriods }, MENU_ITEMS,
  }));
  assert.match(facts.영업, /화~금 점심 11:00~15:30/);
  assert.match(facts.영업, /목~금 저녁 16:30~22:00/);
  assert.doesNotMatch(facts.영업, /화~금 11:00~22:00|브레이크/);
});

function contentWithAlternateGroupMinimum() {
  const path = "lib/content/store.ts";
  // Change only the central fixture's numeric data, then evaluate the real exports.
  const source = read(path)
    .replace(/^[ \t]*minGroupSize\s*:\s*\d+,\r?$/m, "")
    .replace(/\bmaxGroupSize\s*:/, "minGroupSize: 4,\n  maxGroupSize:");
  const content = evaluateTypeScript(path, source);
  assert.equal(content.STORE.minGroupSize, 4, "fixture group minimum");
  return content;
}

test("V6 store facts follow the central group minimum", () => {
  const content = contentWithAlternateGroupMinimum();
  assert.equal(
    displayedFacts(renderLatestFacts(content)).단체,
    `4~${content.STORE.maxGroupSize}명 · ${content.STORE.privateHire}`,
  );
});

test("V6 group-visit title follows the central group minimum", () => {
  const content = contentWithAlternateGroupMinimum();
  assert.equal(
    content.VISIT_INTENT_ITEMS.find(({ id }) => id === "group-dining").title,
    `4명부터 한 팀 최대 ${content.STORE.maxGroupSize}명까지`,
  );
});

for (const [field, change] of [
  ["price", { price: "21,900원", priceAmount: 21900 }],
  ["minimum order", { minimumOrder: 3 }],
]) {
  test(`V6 latest facts list both sets when only the soy ${field} changes`, () => {
    const items = MENU_ITEMS.map((item) =>
      item.slug === "soy-set" ? { ...item, ...change } : item,
    );
    const value = displayedFacts(renderLatestFacts({ STORE, MENU_ITEMS: items }))["대표 세트"];
    for (const slug of ["spicy-set", "soy-set"]) {
      const { name, price, minimumOrder } = items.find((item) => item.slug === slug);
      assert.ok(value.includes(`${name} ${price} · ${minimumOrder}인 이상`), value);
    }
    assert.doesNotMatch(value, /매운·간장/);
  });
}

test("V6 visit cards use central content and tracked crawlable links", () => {
  const grid = read("components/site/visit-intent-grid.tsx");
  assert.match(grid, /VISIT_INTENT_ITEMS\.map/);
  assert.match(grid, /eventName="visit_intent_click"/);
  assert.match(grid, /placement=\{item\.placement\}/);
  assert.match(grid, /href=\{item\.href\}/);
  assert.match(grid, /item\.ctaLabel/);
  assert.doesNotMatch(grid, /preventDefault/);
});
