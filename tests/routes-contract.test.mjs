import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { STORE } from "../lib/content/store.ts";
import { createPageMetadata } from "../lib/seo/metadata.ts";
import { breadcrumbSchema, restaurantSchema } from "../lib/seo/schema.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

for (const route of ["menu", "store"]) {
  test(`${route} route exists`, () => {
    assert.equal(
      existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)),
      true,
    );
  });
}

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
  const source = `${read("app/menu/page.tsx")}\n${read("app/store/page.tsx")}`;

  assert.doesNotMatch(
    source,
    /AggregateRating|rating:|reviewCount|평점|낙지파전|등갈비 1인분 추가|일요일 (?:휴무|정기휴무)/,
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
