import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DINING_STEPS,
  FAQ_ITEMS,
  MENU_ITEMS,
  REVIEW_ITEMS,
  STORE,
} from "../lib/content/store.ts";
import { getStory, STORIES } from "../lib/content/stories.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("central content exports approved store facts", () => {
  assert.equal(STORE.name, "어밀뜰");
  assert.equal(STORE.fullName, "어밀뜰 등갈비찜 청주봉명동본점");
  assert.equal(STORE.address, "충북 청주시 흥덕구 백봉로 213-1 1층");
  assert.equal(STORE.phoneDisplay, "0507-1449-0004");
  assert.deepEqual(STORE.openingPeriods, [
    {
      label: "평일 점심",
      days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "11:00",
      closes: "15:30",
    },
    {
      label: "평일 저녁",
      days: ["Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "16:30",
      closes: "22:00",
    },
    {
      label: "주말",
      days: ["Saturday", "Sunday"],
      opens: "11:00",
      closes: "22:00",
    },
  ]);
});

test("central content exports approved menu, FAQ, review, and dining data", () => {
  assert.deepEqual(MENU_ITEMS.map((item) => item.slug), ["spicy", "soy"]);
  assert.equal(MENU_ITEMS[0].price, "19,900원");
  assert.equal(FAQ_ITEMS.length, 8);
  assert.equal(FAQ_ITEMS[0].question, "일요일에도 영업하나요?");
  assert.match(FAQ_ITEMS[5].answer, /최신 혜택/);
  assert.equal(REVIEW_ITEMS.length, 3);
  assert.equal(REVIEW_ITEMS[0].sourceUrl, STORE.placeUrl);
  assert.deepEqual(DINING_STEPS.map((step) => step.number), ["01", "02", "03", "04"]);
  assert.equal(DINING_STEPS[2].mediaType, "video");
});

test("stories export four records and getStory finds a story or returns undefined", () => {
  assert.equal(STORIES.length, 4);
  const story = getStory("how-to-enjoy-ribs");
  assert.equal(story, STORIES[0]);
  assert.equal(story?.title, "처음 보는 등갈비찜, 이렇게 즐겨요");
  assert.equal(getStory("missing-story"), undefined);
});

test("central content avoids prohibited volatile source claims", () => {
  const source = read("lib/content/store.ts");
  assert.doesNotMatch(source, /AggregateRating/);
  assert.doesNotMatch(source, /숫자 평점 또는/);
});
