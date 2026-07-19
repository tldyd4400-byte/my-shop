import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const readBinary = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url));

test("homepage exposes every approved public section", () => {
  const page = read("app/page.tsx");

  for (const id of [
    "story",
    "guide",
    "menu",
    "space",
    "reviews",
    "faq",
    "visit",
  ]) {
    assert.match(page, new RegExp(`id=["']${id}["']`));
  }
});

test("homepage uses curated Naver visitor reviews with official attribution", () => {
  const page = read("app/page.tsx");
  const content = read("lib/site-content.ts");

  assert.match(page, /VISITOR_REVIEWS/);
  assert.match(content, /2021816208/);
  assert.match(content, /네이버 방문자 리뷰/);
  assert.match(content, /\["음식이 맛있어요", 253\]/);
  assert.match(content, /\["고기 질이 좋아요", 158\]/);
  assert.match(content, /\["특별한 메뉴가 있어요", 80\]/);
  assert.match(content, /\["매장이 넓어요", 81\]/);
  assert.match(content, /내용 요약/);
  assert.doesNotMatch(content, /rating:/);
  assert.doesNotMatch(page, /<blockquote>|review-rating/);
});

test("homepage exposes the approved phone and Naver actions", () => {
  const page = read("app/page.tsx");
  const content = read("lib/site-content.ts");

  assert.match(`${page}\n${content}`, /tel:050714490004/);
  assert.match(page, /네이버 예약/);
  assert.match(page, /네이버 길찾기/);
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
  const content = read("lib/site-content.ts");

  assert.doesNotMatch(`${page}\n${content}`, /테스트용|교체 예정/);
});

test("homepage publishes local restaurant, FAQ, and website structured data", () => {
  const page = read("app/page.tsx");
  const content = read("lib/site-content.ts");
  const layout = read("app/layout.tsx");
  const source = `${page}\n${content}`;

  assert.match(source, /"@type": "Restaurant"/);
  assert.match(source, /"@type": "FAQPage"/);
  assert.match(source, /"@type": "WebSite"/);
  assert.match(layout, /alternates/);
  assert.match(layout, /openGraph/);
  assert.match(content, /weekdayMorning/);
  assert.match(content, /weekdayEvening/);
  assert.match(content, /weekend/);
  assert.match(content, /15:30/);
  assert.match(content, /16:30/);
});

test("public body copy stays at least 16px", () => {
  const styles = read("app/globals.css");

  assert.doesNotMatch(styles, /font-size:\s*0\.[0-9]+rem/);
});
