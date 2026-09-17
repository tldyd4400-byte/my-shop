import assert from "node:assert/strict";
import test from "node:test";

import {
  dedupeOnlineReviewCandidates,
  normalizeNaverBlogItem,
} from "../lib/online-reviews/normalize.ts";

const discoveredAt = "2026-09-17T00:00:00.000Z";

function validItem(overrides = {}) {
  return {
    title: "청주 <b>어믜뜰</b> 후기",
    link: "https://blog.naver.com/example/123?trackingCode=abc&utm_source=test",
    description: "등갈비찜 &amp; 셀프바를 즐긴 <b>어믜뜰</b> 방문기",
    bloggername: "청주 기록",
    bloggerlink: "blog.naver.com/example",
    postdate: "20260917",
    ...overrides,
  };
}

test("normalizes a relevant Naver blog item into safe unchanged text", () => {
  const result = normalizeNaverBlogItem(validItem(), discoveredAt);

  assert.deepEqual(result, {
    sourceUrl: "https://blog.naver.com/example/123",
    title: "청주 어믜뜰 후기",
    description: "등갈비찜 & 셀프바를 즐긴 어믜뜰 방문기",
    bloggerName: "청주 기록",
    bloggerUrl: "https://blog.naver.com/example",
    publishedOn: "2026-09-17",
    discoveredAt,
  });
});

test("accepts relevance from either title or description", () => {
  assert.ok(
    normalizeNaverBlogItem(
      validItem({ title: "청주 갈비찜", description: "어믜뜰 방문기" }),
      discoveredAt,
    ),
  );
  assert.ok(
    normalizeNaverBlogItem(
      validItem({ title: "어믜뜰 방문기", description: "청주 갈비찜" }),
      discoveredAt,
    ),
  );
  assert.equal(
    normalizeNaverBlogItem(
      validItem({ title: "다른 식당", description: "무관한 방문기" }),
      discoveredAt,
    ),
    null,
  );
});

test("rejects unsafe, unrelated, and malformed source URLs", () => {
  for (const link of [
    "http://blog.naver.com/example/123",
    "https://example.com/example/123",
    "https://m.blog.naver.com/example/123",
    "javascript:alert(1)",
    "https://blog.naver.com/",
    "not a url",
  ]) {
    assert.equal(normalizeNaverBlogItem(validItem({ link }), discoveredAt), null, link);
  }
});

test("rejects impossible dates, invalid discovery timestamps, and malformed values", () => {
  for (const postdate of ["20260229", "20260431", "20261301", "2026091", "date"] ) {
    assert.equal(
      normalizeNaverBlogItem(validItem({ postdate }), discoveredAt),
      null,
      postdate,
    );
  }

  assert.equal(normalizeNaverBlogItem(validItem(), "not-a-date"), null);
  assert.equal(normalizeNaverBlogItem(null, discoveredAt), null);
  assert.equal(normalizeNaverBlogItem("item", discoveredAt), null);
  assert.equal(normalizeNaverBlogItem(validItem({ title: 42 }), discoveredAt), null);
});

test("removes markup without executing or preserving hidden tags", () => {
  const result = normalizeNaverBlogItem(
    validItem({
      title: "<b>어믜뜰</b><script>alert(1)</script>",
      description: "&lt;맛집&gt; &#xC5B4;&#xBBDC;&#xB730; &quot;후기&quot;",
    }),
    discoveredAt,
  );

  assert.equal(result.title, "어믜뜰alert(1)");
  assert.equal(result.description, '<맛집> 어믜뜰 "후기"');
  assert.doesNotMatch(`${result.title} ${result.description}`, /<\/?(?:b|script)\b/iu);
});

test("caps source text and snapshots each input property once", () => {
  const reads = Object.create(null);
  const values = validItem({
    title: `어믜뜰 ${"가".repeat(600)}`,
    description: `어믜뜰 ${"나".repeat(3000)}`,
    bloggername: "다".repeat(600),
  });
  const item = {};

  for (const [key, value] of Object.entries(values)) {
    reads[key] = 0;
    Object.defineProperty(item, key, {
      enumerable: true,
      get() {
        reads[key] += 1;
        if (reads[key] > 1) throw new Error(`read ${key} twice`);
        return value;
      },
    });
  }

  const result = normalizeNaverBlogItem(item, discoveredAt);
  assert.ok(result);
  assert.equal(result.title.length, 500);
  assert.equal(result.description.length, 2000);
  assert.equal(result.bloggerName.length, 200);
  assert.deepEqual({ ...reads }, {
    title: 1,
    link: 1,
    description: 1,
    bloggername: 1,
    bloggerlink: 1,
    postdate: 1,
  });
});

test("deduplicates normalized candidates by source URL and preserves first order", () => {
  const first = normalizeNaverBlogItem(validItem(), discoveredAt);
  const duplicate = { ...first, title: "두 번째 제목" };
  const second = normalizeNaverBlogItem(
    validItem({ link: "https://blog.naver.com/example/456" }),
    discoveredAt,
  );

  assert.deepEqual(
    dedupeOnlineReviewCandidates([first, null, duplicate, second]),
    [first, second],
  );
});
