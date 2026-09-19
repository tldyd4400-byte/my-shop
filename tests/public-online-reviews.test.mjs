import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { loadPublicOnlineReviews } from "../lib/online-reviews/public.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const approvedReview = {
  sourceUrl: "https://blog.naver.com/example/123",
  title: "청주 어믜뜰 후기",
  description: "등갈비찜과 셀프바를 즐긴 어믜뜰 방문기",
  bloggerName: "청주 기록",
  bloggerUrl: "https://blog.naver.com/example",
  publishedOn: "2026-09-17",
  discoveredAt: "2026-09-17T00:00:00.000Z",
  status: "approved",
  moderatedAt: "2026-09-17T01:00:00.000Z",
};

test("public loader skips an unconfigured database without calling the repository", async () => {
  let calls = 0;
  const result = await loadPublicOnlineReviews(3, {
    configured: false,
    load: async () => {
      calls += 1;
      return [approvedReview];
    },
  });

  assert.deepEqual(result, []);
  assert.equal(calls, 0);
});

test("public loader returns approved records and contains repository failures", async () => {
  const limits = [];
  assert.deepEqual(
    await loadPublicOnlineReviews(6, {
      configured: true,
      load: async (limit) => {
        limits.push(limit);
        return [approvedReview];
      },
    }),
    [approvedReview],
  );
  assert.deepEqual(limits, [6]);

  assert.deepEqual(
    await loadPublicOnlineReviews(3, {
      configured: true,
      load: async () => {
        throw new Error("postgres://private-credential");
      },
    }),
    [],
  );
});

test("public review cards show source, date, unchanged content, and safe original links", () => {
  const source = read("components/site/online-review-cards.tsx");

  assert.match(source, /review\.title/u);
  assert.match(source, /review\.description/u);
  assert.match(source, /review\.bloggerName/u);
  assert.match(source, /review\.publishedOn/u);
  assert.match(source, /href=\{review\.sourceUrl\}/u);
  assert.match(source, /target="_blank"/u);
  assert.match(source, /rel="noreferrer"/u);
  assert.match(source, /네이버 블로그/u);
  assert.match(source, /네이버에서 원문 보기/u);
  assert.doesNotMatch(source, /평점|별점|rating|AggregateRating|reviewCount/u);
});

test("home loads three approved reviews and keeps the static evidence fallback", () => {
  const source = read("app/page.tsx");

  assert.match(source, /export const revalidate\s*=\s*3600/u);
  assert.match(source, /export default async function HomePage/u);
  assert.match(source, /await loadPublicOnlineReviews\(3\)/u);
  assert.match(source, /onlineReviews\.length\s*>\s*0/u);
  assert.match(source, /<OnlineReviewCards\s+reviews=\{onlineReviews\}/u);
  assert.match(source, /REVIEW_ITEMS\.map\(\(review\)\s*=>/u);

  const onlineIndex = source.indexOf("onlineReviews.length > 0");
  const fallbackIndex = source.indexOf("REVIEW_ITEMS.map((review) =>");
  assert.ok(onlineIndex >= 0 && fallbackIndex > onlineIndex);
});

test("reviews page keeps visitor evidence and adds up to six approved online reviews", () => {
  const source = read("app/reviews/page.tsx");

  assert.match(source, /export const revalidate\s*=\s*3600/u);
  assert.match(source, /export default async function ReviewsPage/u);
  assert.match(source, /await loadPublicOnlineReviews\(6\)/u);
  assert.match(source, /REVIEW_ITEMS\.map\(\(review\)\s*=>/u);
  assert.match(source, /최근 온라인 후기/u);
  assert.match(source, /관리자가 원문을 확인하고 승인한/u);
  assert.match(source, /<OnlineReviewCards\s+reviews=\{onlineReviews\}/u);
  assert.doesNotMatch(source, /AggregateRating|reviewCount/u);
});

test("public review card styles are three-column desktop and one-column mobile", () => {
  const source = read("components/site/online-review-cards.module.css");
  assert.match(source, /\.grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/u);
  assert.match(source, /\.sourceLink[\s\S]*min-height:\s*48px/u);
  assert.match(source, /@media\s*\(max-width:\s*767px\)[\s\S]*\.grid\s*\{[\s\S]*grid-template-columns:\s*1fr/u);
});
