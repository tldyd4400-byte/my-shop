import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const readBinary = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url));

test("home V2 exposes approved media, proof, trust, and conversion sections", () => {
  const page = read("app/page.tsx");

  for (const component of [
    "HeroMedia",
    "ProofStrip",
    "ExperienceSteps",
    "ReservationCta",
    "LocationPanel",
    "FaqList",
    "JsonLd",
  ]) {
    assert.match(page, new RegExp(component));
  }

  assert.match(page, /hero-brand-720p\.mp4/);
  assert.match(
    page,
    /<HeroMedia[\s\S]*?image="\/images\/eomeuittul\/hero-poster\.webp"/,
  );
  assert.match(page, /청주 봉명동 맛집 어믜뜰/);
});

test("home V2 keeps the approved section order", () => {
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
    "<LocationPanel",
  ];

  const positions = sections.map((section) => page.indexOf(section));
  assert.equal(positions.every((position) => position >= 0), true);
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));

  const visualBlocks =
    page.match(
      /<(?:HeroMedia|ProofStrip|ExperienceSteps|GroupDiningPanel|ReservationCta|LocationPanel)\b|<section\b/g,
    ) ?? [];
  assert.equal(visualBlocks.length, 10);
  for (const section of sections) {
    assert.equal(page.split(section).length - 1, 1, section);
  }
});

test("home V2 uses central content and matches visible FAQ items to JSON-LD", () => {
  const page = read("app/page.tsx");

  for (const source of ["FAQ_ITEMS", "MENU_ITEMS", "REVIEW_ITEMS", "STORE"]) {
    assert.match(page, new RegExp(source));
  }

  assert.match(page, /const homeFaqs = FAQ_ITEMS\.slice\(0, 4\)/);
  assert.match(page, /faqSchema\(homeFaqs\)/);
  assert.match(page, /<FaqList items=\{homeFaqs\}/);
  assert.doesNotMatch(
    page,
    /AggregateRating|rating:|review-rating|평점|낙지파전|등갈비 1인분 추가|예약 (?:완료|확정)/,
  );
  assert.doesNotMatch(
    page,
    /(?:맛있어요|고기 질|특별한 메뉴|매장이 넓)[^\n]*\d/,
  );
});

test("home V2 uses Next Link internally and leaves shared chrome to the root", () => {
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

test("home V2 preserves the 390px stack and 48px interactive targets", () => {
  const styles = read("app/globals.css");

  assert.match(styles, /@media \(max-width: 767px\)/);
  assert.match(
    styles,
    /\.split-section,[\s\S]*?\.menu-grid,[\s\S]*?\.review-grid\s*{\s*grid-template-columns:\s*1fr/,
  );
  assert.match(styles, /\.button\s*{[\s\S]*?min-height:\s*54px/);
  assert.match(styles, /\.faq-list summary\s*{[\s\S]*?min-height:\s*48px/);
  assert.match(styles, /\.review-grid a\s*{[\s\S]*?min-height:\s*48px/);
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
