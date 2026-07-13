import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage exposes every approved public section", () => {
  const page = read("app/page.tsx");

  for (const id of ["story", "guide", "menu", "space", "faq", "visit"]) {
    assert.match(page, new RegExp(`id=["']${id}["']`));
  }
});

test("homepage exposes the approved phone and Naver actions", () => {
  const page = read("app/page.tsx");
  const content = read("lib/site-content.ts");

  assert.match(`${page}\n${content}`, /tel:050714490004/);
  assert.match(page, /네이버 예약/);
  assert.match(page, /네이버 길찾기/);
});

test("layout uses Korean metadata and document language", () => {
  const layout = read("app/layout.tsx");

  assert.match(layout, /lang="ko"/);
  assert.match(layout, /어믜뜰 등갈비찜 청주봉명동본점/);
});

test("test-only visual assets exist", () => {
  for (const name of [
    "eomeuittul-ribs-spicy.png",
    "eomeuittul-ribs-soy.png",
    "eomeuittul-interior.png",
    "eomeuittul-group-seating.png",
  ]) {
    assert.equal(
      existsSync(new URL(`../public/images/${name}`, import.meta.url)),
      true,
      name,
    );
  }
});
