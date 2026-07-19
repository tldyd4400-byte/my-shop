import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("central content contains approved store facts", () => {
  const source = read("lib/content/store.ts");
  assert.match(source, /어밀뜰 등갈비찜 청주봉명동본점/);
  assert.match(source, /백봉로 213-1 1층/);
  assert.match(source, /0507-1449-0004/);
  assert.match(source, /11:00/);
  assert.match(source, /22:00/);
  assert.match(source, /15:30/);
  assert.match(source, /16:30/);
  assert.match(source, /일요일/);
});

test("central content avoids volatile hard-coded claims", () => {
  const source = read("lib/content/store.ts");
  assert.doesNotMatch(source, /AggregateRating/);
  assert.doesNotMatch(source, /숫자 평점 또는/);
  assert.match(source, /최신 혜택/);
});

test("content contains eight FAQs and four initial stories", () => {
  const store = read("lib/content/store.ts");
  const stories = read("lib/content/stories.ts");
  assert.equal((store.match(/question:/g) ?? []).length, 8);
  assert.equal((stories.match(/slug:/g) ?? []).length, 4);
});
