import assert from "node:assert/strict";
import test from "node:test";

import { summarizeAiVisits } from "../lib/ai-visits/summary.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

function row(createdAt, botId, purpose, path, overrides = {}) {
  const botName = {
    "chatgpt-user": "ChatGPT-User",
    googlebot: "Googlebot",
    alpha: "Alpha",
    beta: "Beta",
    oldbot: "OldBot",
  }[botId] ?? botId;

  return {
    createdAt,
    path,
    botId,
    botName,
    vendor: "Example",
    purpose,
    ...overrides,
  };
}

function emptySummary() {
  return {
    total: 0,
    byPurpose: {
      search_indexing: 0,
      training: 0,
      realtime_citation: 0,
      other: 0,
    },
    bots: [],
  };
}

test("summarizes half-open UTC windows, purposes, latest visits, and tied paths", () => {
  const now = new Date("2026-07-26T00:00:00.000Z");
  const rows = [
    row("2026-07-25T00:00:00.000Z", "googlebot", "search_indexing", "/menu"),
    row("2026-07-24T00:00:00.000Z", "googlebot", "search_indexing", "/faq"),
    row("2026-07-23T00:00:00.000Z", "chatgpt-user", "realtime_citation", "/menu"),
    row("2026-06-26T00:00:00.001Z", "googlebot", "search_indexing", "/faq"),
    row("2026-06-26T00:00:00.000Z", "googlebot", "search_indexing", "/previous-boundary"),
    row("2026-05-27T00:00:00.001Z", "googlebot", "search_indexing", "/previous"),
    row("2026-05-27T00:00:00.000Z", "oldbot", "training", "/excluded-boundary"),
    row("2026-07-26T00:00:00.000Z", "oldbot", "training", "/excluded-now"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 4);
  assert.deepEqual(summary.byPurpose, {
    search_indexing: 3,
    training: 0,
    realtime_citation: 1,
    other: 0,
  });
  assert.deepEqual(summary.bots.map((bot) => bot.botId), [
    "googlebot",
    "chatgpt-user",
  ]);
  assert.deepEqual(summary.bots[0], {
    botId: "googlebot",
    botName: "Googlebot",
    vendor: "Example",
    purpose: "search_indexing",
    count: 3,
    previousCount: 2,
    change: 1,
    changePercent: 50,
    isNew: false,
    lastVisitedAt: "2026-07-25T00:00:00.000Z",
    topPath: "/faq",
  });
  assert.deepEqual(summary.bots[1], {
    botId: "chatgpt-user",
    botName: "ChatGPT-User",
    vendor: "Example",
    purpose: "realtime_citation",
    count: 1,
    previousCount: 0,
    change: 1,
    changePercent: 0,
    isNew: true,
    lastVisitedAt: "2026-07-23T00:00:00.000Z",
    topPath: "/menu",
  });
});

test("reports signed changes and deterministically sorts equal current counts", () => {
  const now = new Date("2026-07-26T00:00:00.000Z");
  const rows = [
    row("2026-07-25T00:00:00.000Z", "beta", "other", "/b"),
    row("2026-07-24T00:00:00.000Z", "alpha", "training", "/a"),
    row("2026-07-23T00:00:00.000Z", "beta", "other", "/b"),
    row("2026-07-22T00:00:00.000Z", "alpha", "training", "/a"),
    row("2026-06-25T00:00:00.000Z", "alpha", "training", "/a"),
    row("2026-06-24T00:00:00.000Z", "beta", "other", "/b"),
    row("2026-06-23T00:00:00.000Z", "beta", "other", "/b"),
    row("2026-06-22T00:00:00.000Z", "beta", "other", "/b"),
    row("2026-06-21T00:00:00.000Z", "beta", "other", "/b"),
    row("2026-06-20T00:00:00.000Z", "oldbot", "training", "/old"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.deepEqual(summary.bots.map((bot) => bot.botName), [
    "Alpha",
    "Beta",
    "OldBot",
  ]);
  assert.deepEqual(
    summary.bots.map(({ botId, count, previousCount, change, changePercent, isNew }) => ({
      botId,
      count,
      previousCount,
      change,
      changePercent,
      isNew,
    })),
    [
      { botId: "alpha", count: 2, previousCount: 1, change: 1, changePercent: 100, isNew: false },
      { botId: "beta", count: 2, previousCount: 4, change: -2, changePercent: -50, isNew: false },
      { botId: "oldbot", count: 0, previousCount: 1, change: -1, changePercent: -100, isNew: false },
    ],
  );
  assert.equal(summary.bots[2].lastVisitedAt, null);
  assert.equal(summary.bots[2].topPath, null);
});

test("skips invalid dates and unknown purposes without throwing or corrupting totals", () => {
  const now = new Date("2026-07-26T00:00:00.000Z");
  const rows = [
    row("not-a-date", "beta", "training", "/invalid-date"),
    row("2026-07-25T00:00:00.000Z", "beta", "unknown", "/invalid-purpose"),
    row("2026-07-24T00:00:00.000Z", "alpha", "other", "/valid"),
  ];

  assert.doesNotThrow(() => summarizeAiVisits(rows, now));
  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.deepEqual(summary.byPurpose, {
    search_indexing: 0,
    training: 0,
    realtime_citation: 0,
    other: 1,
  });
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
});

test("skips a non-leap February 29 without corrupting totals or bots", () => {
  const now = new Date("2026-03-02T00:00:00.000Z");
  const rows = [
    row("2026-02-29T00:00:00Z", "beta", "training", "/invalid-february"),
    row("2026-02-28T00:00:00Z", "alpha", "other", "/valid"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.equal(
    Object.values(summary.byPurpose).reduce((sum, count) => sum + count, 0),
    summary.total,
  );
  assert.equal(
    summary.bots.reduce((sum, bot) => sum + bot.count, 0),
    summary.total,
  );
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
});

test("skips April 31 without corrupting totals or bots", () => {
  const now = new Date("2026-05-02T00:00:00.000Z");
  const rows = [
    row("2026-04-31T00:00:00Z", "beta", "training", "/invalid-april"),
    row("2026-04-30T00:00:00Z", "alpha", "other", "/valid"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.equal(
    Object.values(summary.byPurpose).reduce((sum, count) => sum + count, 0),
    summary.total,
  );
  assert.equal(
    summary.bots.reduce((sum, bot) => sum + bot.count, 0),
    summary.total,
  );
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
});

test("accepts a valid leap day with an explicit numeric timezone", () => {
  const now = new Date("2024-03-01T00:00:00.000Z");
  const rows = [
    row("2024-02-29T12:34:56+09:00", "alpha", "other", "/leap-day"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
  assert.equal(summary.bots[0].lastVisitedAt, "2024-02-29T12:34:56+09:00");
});

test("rejects invalid calendar and clock edges while accepting a numeric timezone", () => {
  const now = new Date("2026-07-26T00:00:00.000Z");
  const rows = [
    row("2026-00-25T00:00:00Z", "beta", "training", "/month-zero"),
    row("2026-13-25T00:00:00Z", "beta", "training", "/month-thirteen"),
    row("2026-07-00T00:00:00Z", "beta", "training", "/day-zero"),
    row("2026-07-24T24:00:00Z", "beta", "training", "/hour-twenty-four"),
    row("2026-07-25T23:60:00Z", "beta", "training", "/minute-sixty"),
    row("2026-07-25T23:59:60Z", "beta", "training", "/second-sixty"),
    row("2026-07-25T23:00:00+04:00", "alpha", "other", "/explicit-zone"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
});

test("rejects timezone-less timestamps so aggregation is host-timezone independent", () => {
  const now = new Date("2026-07-26T00:00:00.000Z");
  const rows = [
    row("2026-07-25T23:00:00", "beta", "training", "/ambiguous"),
    row("2026-07-26T08:00:00+09:00", "alpha", "other", "/explicit-zone"),
  ];

  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
});

test("skips non-string contract fields without throwing or corrupting invariants", () => {
  const now = new Date("2026-07-26T00:00:00.000Z");
  const valid = row("2026-07-25T00:00:00.000Z", "alpha", "other", "/valid");
  const rows = [
    valid,
    row("2026-07-24T00:00:00.000Z", Symbol("bot-id"), "training", "/bad-bot-id"),
    row("2026-07-24T00:00:00.000Z", "beta", "training", "/bad-name", {
      botName: Symbol("bot-name"),
    }),
    row("2026-07-24T00:00:00.000Z", "beta", "training", "/bad-vendor", {
      vendor: 42,
    }),
    row("2026-07-24T00:00:00.000Z", "beta", "training", Symbol("bad-path")),
  ];

  assert.doesNotThrow(() => summarizeAiVisits(rows, now));
  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 1);
  assert.equal(
    Object.values(summary.byPurpose).reduce((sum, count) => sum + count, 0),
    summary.total,
  );
  assert.equal(
    summary.bots.reduce((sum, bot) => sum + bot.count, 0),
    summary.total,
  );
  assert.deepEqual(summary.bots.map((bot) => bot.botId), ["alpha"]);
});

test("returns a stable empty summary for an invalid now and does not mutate rows", () => {
  const rows = [row("2026-07-24T00:00:00.000Z", "alpha", "training", "/a")];
  const before = structuredClone(rows);

  assert.deepEqual(summarizeAiVisits(rows, new Date(Number.NaN)), emptySummary());
  assert.deepEqual(rows, before);
});

test("clamps range bounds near the minimum JavaScript date", () => {
  const minimumDateMs = -8_640_000_000_000_000;
  const now = new Date(minimumDateMs + DAY_MS);
  const rows = [
    row(new Date(minimumDateMs).toISOString(), "alpha", "training", "/minimum"),
  ];

  assert.doesNotThrow(() => summarizeAiVisits(rows, now));
  const summary = summarizeAiVisits(rows, now);
  assert.equal(summary.total, 1);
  assert.equal(summary.bots[0].lastVisitedAt, new Date(minimumDateMs).toISOString());
});

test("assigns the minimum date to previous at exactly minimum plus 30 days", () => {
  const minimumDateMs = -8_640_000_000_000_000;
  const now = new Date(minimumDateMs + 30 * DAY_MS);
  const rows = [
    row(new Date(minimumDateMs).toISOString(), "alpha", "training", "/minimum"),
  ];

  assert.doesNotThrow(() => summarizeAiVisits(rows, now));
  const summary = summarizeAiVisits(rows, now);

  assert.equal(summary.total, 0);
  assert.deepEqual(summary.byPurpose, emptySummary().byPurpose);
  assert.deepEqual(summary.bots.map(({ botId, count, previousCount }) => ({
    botId,
    count,
    previousCount,
  })), [
    { botId: "alpha", count: 0, previousCount: 1 },
  ]);
});
