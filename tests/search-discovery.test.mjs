import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("robots allows public crawling and advertises the canonical sitemap", () => {
  const robots = read("app/robots.ts");
  assert.match(robots, /userAgent:\s*"\*"/);
  assert.match(robots, /allow:\s*"\/"/);
  assert.match(robots, /`\$\{SITE\.url\}\/sitemap\.xml`/);
});

test("sitemap publishes the canonical homepage", () => {
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /url:\s*SITE\.url/);
  assert.match(sitemap, /lastModified:/);
});

test("root metadata supports Google and Naver verification tokens", () => {
  const layout = read("app/layout.tsx");
  assert.match(layout, /GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /NAVER_SITE_VERIFICATION/);
  assert.match(layout, /naver-site-verification/);
});
