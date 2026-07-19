import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared navigation exposes every public route", () => {
  const header = read("components/site/site-header.tsx");

  for (const path of ["/menu", "/store", "/location", "/faq", "/reviews", "/stories"]) {
    assert.match(header, new RegExp(path));
  }
});

test("analytics link records approved events without blocking navigation", () => {
  const link = read("components/site/analytics-link.tsx");

  assert.match(
    link,
    /setTimeout\(\(\) => \{\s*try \{\s*window\.gtag\?\.\("event"/s,
  );
  assert.match(link, /event_name/);
  assert.match(link, /catch\s*\{/);
  assert.doesNotMatch(link, /preventDefault/);
});
