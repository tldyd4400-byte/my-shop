import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared chrome renders literal labels instead of raw Unicode escapes", () => {
  const sources = [
    "components/site/site-header.tsx",
    "components/site/mobile-action-bar.tsx",
    "components/site/site-footer.tsx",
  ];

  const rawEscapeInRenderedJsx =
    /(?:\b(?:aria-label|title|alt)="[^"]*\\u[\da-f]{4}|>\s*\\u[\da-f]{4}|}\s*\\u[\da-f]{4}\s*{)/i;

  for (const path of sources) {
    assert.doesNotMatch(read(path), rawEscapeInRenderedJsx, path);
  }
});
