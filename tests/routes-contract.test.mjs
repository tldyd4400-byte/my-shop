import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { STORIES } from "../lib/content/stories.ts";
import { REVIEW_ITEMS, STORE } from "../lib/content/store.ts";
import { createPageMetadata } from "../lib/seo/metadata.ts";
import { breadcrumbSchema, restaurantSchema } from "../lib/seo/schema.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function cssVariable(styles, name) {
  const match = styles.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})`, "i"));
  assert.ok(match, `Missing --${name} color token`);
  return match[1];
}

function relativeLuminance(hex) {
  const value = hex.slice(1);
  const expanded =
    value.length === 3
      ? value
          .split("")
          .map((digit) => digit.repeat(2))
          .join("")
      : value.slice(0, 6);
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255,
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first, second) {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort(
    (left, right) => right - left,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function cssBlockAt(styles, start) {
  const openingBrace = styles.indexOf("{", start);
  assert.ok(openingBrace >= 0, "CSS block has no opening brace");

  let depth = 0;
  for (let index = openingBrace; index < styles.length; index += 1) {
    if (styles[index] === "{") depth += 1;
    if (styles[index] === "}") depth -= 1;
    if (depth === 0) return styles.slice(openingBrace + 1, index);
  }

  assert.fail("CSS block has no closing brace");
}

for (const route of ["menu", "store", "location", "faq"]) {
  test(`${route} route exists`, () => {
    assert.equal(
      existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)),
      true,
    );
  });
}

test("reviews route exists", () => {
  assert.equal(
    existsSync(new URL("../app/reviews/page.tsx", import.meta.url)),
    true,
  );
});

test("story index and detail routes exist", () => {
  assert.equal(
    existsSync(new URL("../app/stories/page.tsx", import.meta.url)),
    true,
  );
  assert.equal(
    existsSync(new URL("../app/stories/[slug]/page.tsx", import.meta.url)),
    true,
  );
});

test("story routes use central content, static generation, and approved SEO", () => {
  const index = read("app/stories/page.tsx");
  const detail = read("app/stories/[slug]/page.tsx");

  for (const source of [
    "STORIES",
    "StoryCard",
    "ReservationCta",
    "JsonLd",
    "collectionPageSchema",
    "breadcrumbSchema",
  ]) {
    assert.match(index, new RegExp(source));
  }
  assert.match(index, /path: STORIES_PATH/);
  assert.match(index, /STORIES\.slice\(0, 2\)/);
  assert.match(index, /STORIES\.slice\(2\)/);
  assert.equal(index.split("<StoryCard").length - 1, 2);
  assert.equal(index.split("<JsonLd").length - 1, 1);
  assert.doesNotMatch(index, /restaurantSchema|faqSchema|AggregateRating/);
  assert.doesNotMatch(
    index,
    /video=["'{]/,
    "the stories index hero must use the approved still image only",
  );

  for (const source of [
    "generateStaticParams",
    "generateMetadata",
    "articleSchema",
    "breadcrumbSchema",
    "notFound",
    "ExperienceSteps",
    "FaqList",
    "StoryCard",
    "ReservationCta",
  ]) {
    assert.match(detail, new RegExp(source));
  }
  assert.match(
    detail,
    /return STORIES\.map\(\(story\) => \(\{ slug: story\.slug \}\)\)/,
  );
  assert.match(detail, /type: "article"/);
  assert.match(detail, /story\.sections\.map/);
  assert.match(detail, /story\.publishedAt/);
  assert.match(detail, /story\.modifiedAt/);
  assert.match(detail, /story\.slug === "how-to-enjoy-ribs"/);
  assert.match(detail, /\.filter\(\(item\) => item\.slug !== story\.slug\)/);
  assert.match(detail, /\.slice\(0, 2\)/);
  assert.match(detail, /openAll/);
  assert.equal(detail.split("<JsonLd").length - 1, 1);
  assert.doesNotMatch(
    detail,
    /faqSchema|restaurantSchema|AggregateRating|SiteHeader|SiteFooter|MobileActionBar/,
  );

  assert.deepEqual(
    STORIES.map((story) => ({ slug: story.slug })),
    [
      { slug: "how-to-enjoy-ribs" },
      { slug: "family-dining-guide" },
      { slug: "self-bar-guide" },
      { slug: "spicy-or-soy" },
    ],
  );
});

test("story layouts match the approved desktop and 390px boundaries", () => {
  const styles = read("app/globals.css");

  assert.match(
    styles,
    /\.story-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.story-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(
    styles,
    /\.story-card a\s*\{[\s\S]*?min-height:\s*48px/,
  );
  assert.match(styles, /\.article-body[\s\S]*?max-width:\s*900px/);
  const mobileStart = styles.lastIndexOf("@media (max-width: 767px)");
  assert.ok(mobileStart >= 0, "missing story mobile layout rules");
  const mobile = cssBlockAt(styles, mobileStart);
  const hiddenSelectors = [...mobile.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , body]) => /display:\s*none/.test(body))
    .map(([, selectors]) => selectors)
    .join("\n");
  assert.doesNotMatch(
    hiddenSelectors,
    /\.stories-index \.hero-actions|\.story-detail \.hero-actions/,
    "story CTAs must not be hidden on mobile",
  );
  assert.match(
    mobile,
    /\.stories-index \.hero-actions,[\s\S]*?\.story-detail \.hero-actions\s*\{[\s\S]*?display:\s*flex;[\s\S]*?flex-direction:\s*column;[\s\S]*?width:\s*100%/,
  );
  assert.match(
    mobile,
    /\.stories-index \.hero-actions \.button,[\s\S]*?\.story-detail \.hero-actions \.button\s*\{[\s\S]*?width:\s*100%/,
  );
});

test("light-surface eyebrows and dual-color focus indicators meet contrast", () => {
  const styles = read("app/globals.css");
  const red = cssVariable(styles, "red");
  const hanji = cssVariable(styles, "hanji");
  const paper = cssVariable(styles, "paper");
  const white = cssVariable(styles, "white");

  assert.ok(contrastRatio(red, hanji) >= 4.5);
  assert.ok(contrastRatio(red, paper) >= 4.5);
  assert.ok(contrastRatio(white, "#261d17") >= 3);
  assert.ok(contrastRatio(red, hanji) >= 3);

  assert.match(styles, /\.eyebrow\s*\{[\s\S]*?color:\s*var\(--red\)/);
  assert.match(
    styles,
    /\.hero-media \.eyebrow\s*\{[\s\S]*?color:\s*var\(--straw\)/,
  );
  assert.match(
    styles,
    /:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--white\);[\s\S]*?box-shadow:\s*0 0 0 5px var\(--red\)/,
  );
});

test("reviews route presents checked source summaries without ratings", () => {
  const page = read("app/reviews/page.tsx");
  const styles = read("app/reviews/reviews.module.css");

  for (const source of [
    "REVIEW_ITEMS",
    "STORE",
    "HeroMedia",
    "ProofStrip",
    "ReservationCta",
    "LocationPanel",
    "JsonLd",
  ]) {
    assert.match(page, new RegExp(source));
  }

  assert.match(page, /title: "어믜뜰 방문자 후기 \| 청주 봉명동 등갈비찜"/);
  assert.match(page, /path: "\/reviews"/);
  assert.match(page, /image="\/images\/eomeuittul\/soy-ribs\.jpg"/);
  assert.match(page, /breadcrumbSchema\(\[/);
  assert.equal(page.split("<JsonLd").length - 1, 1);
  assert.doesNotMatch(page, /restaurantSchema|AggregateRating/);
  assert.match(
    page,
    /href=\{STORE\.placeUrl\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"/,
  );

  for (const proof of [
    "네이버 원문 링크",
    "2026.07.19 확인",
    "후기 일부만 발췌",
    "반복 반응 중심 요약",
  ]) {
    assert.match(page, new RegExp(proof));
  }

  assert.match(page, /REVIEW_ITEMS\.map\(\(review\) =>/);
  assert.match(page, /review\.sourceLabel/);
  assert.match(page, /review\.summary/);
  assert.match(page, /review\.checkedAt/);
  assert.match(page, /href=\{review\.sourceUrl\}/);
  assert.match(
    page,
    /href=\{review\.sourceUrl\}[\s\S]*?target="_blank"[\s\S]*?rel="noreferrer"/,
  );
  assert.match(page, /전체 실시간 후기 데이터가 아닌/);
  assert.match(page, /step-2-selfbar\.jpg/);
  assert.equal(page.split("soy-ribs.jpg").length - 1, 3);
  assert.match(page, /<ReservationCta placement="reviews_bottom" \/>/);
  assert.match(page, /<LocationPanel \/>/);
  assert.doesNotMatch(
    page,
    /평점|별점|reviewCount|리뷰 수|[“”]|예약 완료|효과|효능/,
  );
  assert.doesNotMatch(page, /SiteHeader|SiteFooter|MobileActionBar/);

  assert.match(styles, /\.reviewGrid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.reviewGrid\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(styles, /\.sourceLink\s*\{[\s\S]*?min-height:\s*48px/);
});

test("central review evidence has three safe, dated source records", () => {
  assert.equal(REVIEW_ITEMS.length, 3);

  for (const review of REVIEW_ITEMS) {
    assert.equal(review.sourceUrl, STORE.placeUrl);
    assert.equal(new URL(review.sourceUrl).protocol, "https:");
    assert.equal(review.checkedAt, "2026-07-19");
    assert.match(review.sourceLabel, /일부 요약/);
    assert.match(review.summary, /반응이 있습니다\.$/);
    assert.doesNotMatch(
      `${review.title} ${review.summary}`,
      /평점|별점|reviewCount|[“”]/,
    );
  }
});

test("location and FAQ expose direct-answer information", () => {
  const location = read("app/location/page.tsx");
  const faq = read("app/faq/page.tsx");

  for (const source of [
    "AnalyticsLink",
    "HeroMedia",
    "LocationPanel",
    "ProofStrip",
    "STORE.parking",
  ]) {
    assert.match(location, new RegExp(source.replace(".", "\\.")));
  }
  assert.match(location, /path: "\/location"/);
  assert.match(location, /restaurantSchema\(\)/);
  assert.match(location, /breadcrumbSchema\(\[/);
  assert.doesNotMatch(location, /faqSchema/);
  assert.match(location, /naver-map-location\.png/);
  assert.match(location, /eventName="phone_click"/);
  assert.match(location, /eventName="naver_map_click"/);

  for (const source of [
    "FAQ_ITEMS",
    "FaqList",
    "HeroMedia",
    "LocationPanel",
    "ProofStrip",
    "faqSchema",
  ]) {
    assert.match(faq, new RegExp(source));
  }
  assert.match(faq, /path: "\/faq"/);
  assert.match(faq, /영업과 방문/);
  assert.match(faq, /메뉴·예약·아이 동반/);
  assert.match(faq, /items=\{FAQ_ITEMS\.slice\(0, 4\)\}/);
  assert.match(faq, /items=\{FAQ_ITEMS\.slice\(4\)\}/);
  assert.equal(faq.split("openAll").length - 1, 2);
  assert.match(faq, /faqSchema\(FAQ_ITEMS\)/);
  assert.match(faq, /breadcrumbSchema\(\[/);
  assert.match(faq, /interior\.jpg/);
  assert.doesNotMatch(faq, /restaurantSchema/);
});

test("FAQ list can explicitly expose every answer without changing its default", () => {
  const list = read("components/site/faq-list.tsx");

  assert.match(list, /openAll\?: boolean/);
  assert.match(list, /open=\{openAll \|\| index === 0\}/);
});

test("location panel keeps desktop map-first and mobile information-first order", () => {
  const panel = read("components/site/location-panel.tsx");
  const styles = read("app/globals.css");

  assert.match(panel, /className="location-map"/);
  assert.match(panel, /className="location-details"/);
  assert.match(
    styles,
    /\.location-grid\s*\{[\s\S]*?grid-template-areas:\s*"map details"/,
  );
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.location-grid\s*\{[\s\S]*?grid-template-areas:\s*"details"\s*"map"/,
  );
});

test("menu route uses approved central content and composition", () => {
  const page = read("app/menu/page.tsx");

  for (const source of [
    "MENU_ITEMS",
    "STORE",
    "HeroMedia",
    "ProofStrip",
    "ExperienceSteps",
    "ReservationCta",
    "JsonLd",
  ]) {
    assert.match(page, new RegExp(source));
  }

  assert.match(page, /path: "\/menu"/);
  assert.match(page, /restaurantSchema\(\)/);
  assert.match(page, /breadcrumbSchema\(\[/);
  assert.match(page, /item\.price/);
  assert.match(page, /item\.includes/);
  assert.match(page, /step-2-selfbar\.jpg/);
  assert.match(page, /placement="menu_hero"/);
  assert.match(page, /placement="menu_bottom"/);
});

test("store route uses approved media, central facts, and composition", () => {
  const page = read("app/store/page.tsx");

  for (const source of [
    "STORE",
    "HeroMedia",
    "ProofStrip",
    "LocationPanel",
    "JsonLd",
  ]) {
    assert.match(page, new RegExp(source));
  }

  assert.match(page, /path: "\/store"/);
  assert.match(page, /restaurantSchema\(\)/);
  assert.match(page, /breadcrumbSchema\(\[/);
  assert.match(page, /facade\.jpg/);
  for (const image of ["hero-table.jpg", "identity-wall.jpg", "interior.jpg"]) {
    assert.equal(page.split(image).length - 1, 1, image);
  }
  assert.match(page, /누군가를 배부르게 먹이고 싶은 마음/);
  assert.match(page, /늘 자식 쪽으로 기울던 접시/);
  assert.match(page, /\{STORE\.seats\}/);
  assert.match(page, /STORE\.parking/);
  assert.doesNotMatch(page, /단체 방문은 전화 문의/);
});

test("route metadata and schemas serialize canonical central facts", () => {
  for (const [path, title] of [
    ["/menu", "청주 갈비찜 메뉴 | 어믜뜰 청주봉명동본점"],
    ["/store", "어믜뜰 매장 소개 | 청주 봉명동 가족 외식"],
    ["/location", "어믜뜰 오시는 길·주차 | 청주 봉명동 맛집"],
    ["/faq", "어믜뜰 FAQ | 예약·주차·영업시간·포장"],
    ["/reviews", "어믜뜰 방문자 후기 | 청주 봉명동 등갈비찜"],
  ]) {
    const metadata = createPageMetadata({ title, description: "route", path });
    const breadcrumbs = breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: title, path },
    ]);

    assert.deepEqual(metadata.alternates, { canonical: path });
    assert.equal(metadata.openGraph.url, path);
    assert.equal(
      breadcrumbs.itemListElement.at(-1).item,
      `${STORE.url}${path}`,
    );
  }
  assert.equal(restaurantSchema().name, STORE.fullName);
});

test("routes avoid unverified claims and leave chrome to the root layout", () => {
  const source = ["menu", "store", "location", "faq", "reviews"]
    .map((route) => read(`app/${route}/page.tsx`))
    .join("\n");

  assert.doesNotMatch(
    source,
    /AggregateRating|rating:|reviewCount|평점|낙지파전|등갈비 1인분 추가|일요일 (?:휴무|정기휴무)|예약 완료|리치 결과 보장|사진을 제공하면|이 영역에 바로 교체/,
  );
  assert.doesNotMatch(source, /SiteHeader|SiteFooter|MobileActionBar/);
});

test("route layouts stack at 390px and keep actions at least 48px", () => {
  const styles = read("app/globals.css");

  assert.match(styles, /\.route-story/);
  assert.match(styles, /\.route-story--reverse/);
  assert.match(
    styles,
    /@media \(max-width: 767px\)[\s\S]*?\.route-story\s*\{[\s\S]*?grid-template-columns:\s*1fr/,
  );
  assert.match(styles, /\.button\s*\{[\s\S]*?min-height:\s*54px/);
});
