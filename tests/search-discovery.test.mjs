import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("robots allows public crawling and advertises the canonical sitemap", () => {
  const robots = read("app/robots.ts");
  assert.match(robots, /userAgent:\s*"\*"/);
  assert.match(robots, /allow:\s*"\/"/);
  assert.match(robots, /`\$\{STORE\.url\}\/sitemap\.xml`/);
  assert.match(robots, /host:\s*STORE\.url/);
});

test("sitemap publishes per-page static dates and story modification dates", () => {
  const sitemap = read("app/sitemap.ts");

  for (const path of ["", "/menu", "/store", "/location", "/faq", "/reviews", "/stories"]) {
    assert.match(sitemap, new RegExp(`path: "${path.replaceAll("/", "\\/")}"`));
  }
  assert.match(sitemap, /const STATIC_PAGES/);
  assert.match(sitemap, /modifiedAt: "2026-10-24"/);
  assert.match(sitemap, /new Date\(`\$\{page\.modifiedAt\}T00:00:00\+09:00`\)/);
  assert.match(sitemap, /STORIES\.map/);
  assert.match(sitemap, /story\.modifiedAt/);
  assert.doesNotMatch(sitemap, /LAST_SIGNIFICANT_UPDATE/);
});

test("discovery sources no longer depend on migrated legacy content", () => {
  for (const path of ["app/sitemap.ts", "app/robots.ts"]) {
    assert.doesNotMatch(read(path), /lib\/site-content/);
  }

  for (const path of ["components/home/site-header.tsx", "lib/site-content.ts"]) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), false);
  }
});

test("root metadata supports Google and Naver verification tokens", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /NAVER_SITE_VERIFICATION/);
  assert.match(layout, /naver-site-verification/);
});
