import assert from "node:assert/strict";
import test from "node:test";

import { searchNaverBlog } from "../lib/online-reviews/naver-client.ts";
import {
  NAVER_REVIEW_QUERIES,
  syncOnlineReviews,
} from "../lib/online-reviews/sync.ts";

function apiItem(overrides = {}) {
  return {
    title: "청주 <b>어믜뜰</b> 후기",
    link: "https://blog.naver.com/example/123",
    description: "어믜뜰 등갈비찜 방문기",
    bloggername: "청주 기록",
    bloggerlink: "blog.naver.com/example",
    postdate: "20260917",
    ...overrides,
  };
}

test("searchNaverBlog calls the exact official endpoint and credential headers", async () => {
  const calls = [];
  const items = await searchNaverBlog("어믜뜰 청주", {
    clientId: "client-id",
    clientSecret: "client-secret",
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ items: [apiItem()] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  assert.equal(calls.length, 1);
  const url = new URL(calls[0].url);
  assert.equal(
    `${url.origin}${url.pathname}`,
    "https://naverapihub.apigw.ntruss.com/search/v1/blog",
  );
  assert.equal(url.searchParams.get("query"), "어믜뜰 청주");
  assert.equal(url.searchParams.get("display"), "20");
  assert.equal(url.searchParams.get("start"), "1");
  assert.equal(url.searchParams.get("sort"), "date");
  assert.equal(url.searchParams.get("format"), "json");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.headers["X-NCP-APIGW-API-KEY-ID"], "client-id");
  assert.equal(calls[0].options.headers["X-NCP-APIGW-API-KEY"], "client-secret");
  assert.deepEqual(items, [apiItem()]);
});

test("searchNaverBlog fails with stable codes without leaking credentials or bodies", async () => {
  await assert.rejects(
    searchNaverBlog("어믜뜰", {
      clientId: "",
      clientSecret: "secret-value",
      fetcher: async () => new Response(),
    }),
    (error) => {
      assert.equal(error.message, "NAVER_API_CREDENTIALS_MISSING");
      assert.doesNotMatch(error.message, /secret-value/u);
      return true;
    },
  );

  await assert.rejects(
    searchNaverBlog("어믜뜰", {
      clientId: "id-value",
      clientSecret: "secret-value",
      fetcher: async () =>
        new Response('{"private":"response-body"}', { status: 429 }),
    }),
    (error) => {
      assert.equal(error.message, "NAVER_API_REQUEST_FAILED");
      assert.doesNotMatch(error.message, /private|response-body|secret-value|id-value/u);
      return true;
    },
  );
});

test("searchNaverBlog contains malformed successful payloads", async () => {
  const options = {
    clientId: "id",
    clientSecret: "secret",
    fetcher: async () => new Response("{}", { status: 200 }),
  };
  assert.deepEqual(await searchNaverBlog("어믜뜰", options), []);

  await assert.rejects(
    searchNaverBlog("어믜뜰", {
      ...options,
      fetcher: async () => new Response("not-json", { status: 200 }),
    }),
    /NAVER_API_RESPONSE_INVALID/,
  );
});

test("syncOnlineReviews searches three queries, deduplicates, and records success", async () => {
  const searches = [];
  const inserted = [];
  const runs = [];
  const result = await syncOnlineReviews({
    now: () => new Date("2026-09-17T00:00:00.000Z"),
    search: async (query) => {
      searches.push(query);
      return [
        apiItem(),
        apiItem({ link: `https://blog.naver.com/example/${searches.length + 123}` }),
      ];
    },
    startRun: async (startedAt) => {
      runs.push({ type: "start", startedAt });
      return 11;
    },
    insert: async (candidates) => {
      inserted.push(...candidates);
      return candidates.length;
    },
    finishRun: async (id, finish) => {
      runs.push({ type: "finish", id, finish });
    },
  });

  assert.deepEqual(searches, [...NAVER_REVIEW_QUERIES]);
  assert.equal(inserted.length, 4);
  assert.deepEqual(result, { discoveredCount: 4, partialFailure: false });
  assert.deepEqual(runs, [
    { type: "start", startedAt: "2026-09-17T00:00:00.000Z" },
    {
      type: "finish",
      id: 11,
      finish: {
        finishedAt: "2026-09-17T00:00:00.000Z",
        status: "success",
        discoveredCount: 4,
        errorCode: null,
      },
    },
  ]);
});

test("syncOnlineReviews keeps successful searches when one query fails", async () => {
  const finishes = [];
  const result = await syncOnlineReviews({
    now: () => new Date("2026-09-17T00:00:00.000Z"),
    search: async (query) => {
      if (query === "어믜뜰 등갈비찜") throw new Error("private upstream body");
      return [apiItem({ link: `https://blog.naver.com/example/${query.length}` })];
    },
    startRun: async () => 12,
    insert: async (candidates) => candidates.length,
    finishRun: async (_id, finish) => finishes.push(finish),
  });

  assert.deepEqual(result, { discoveredCount: 2, partialFailure: true });
  assert.equal(finishes[0].status, "failed");
  assert.equal(finishes[0].errorCode, "PARTIAL_FAILURE");
  assert.doesNotMatch(JSON.stringify(finishes), /private upstream body/u);
});

test("syncOnlineReviews records a contained insert failure then rejects stably", async () => {
  const finishes = [];
  await assert.rejects(
    syncOnlineReviews({
      now: () => new Date("2026-09-17T00:00:00.000Z"),
      search: async () => [apiItem()],
      startRun: async () => 13,
      insert: async () => {
        throw new Error("postgres://private-credential");
      },
      finishRun: async (_id, finish) => finishes.push(finish),
    }),
    (error) => {
      assert.equal(error.message, "REVIEW_SYNC_FAILED");
      assert.doesNotMatch(error.message, /postgres|private-credential/u);
      return true;
    },
  );

  assert.equal(finishes[0].status, "failed");
  assert.equal(finishes[0].errorCode, "INSERT_FAILED");
});
