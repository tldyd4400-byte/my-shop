import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { REVIEW_ITEMS, STORE } from "../lib/content/store.ts";
import { createPageMetadata } from "../lib/seo/metadata.ts";
import { breadcrumbSchema, restaurantSchema } from "../lib/seo/schema.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

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
