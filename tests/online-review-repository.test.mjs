import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  finishOnlineReviewSyncRun,
  insertPendingReviews,
  loadApprovedOnlineReviews,
  loadOnlineReviewDashboard,
  moderateOnlineReview,
  startOnlineReviewSyncRun,
} from "../lib/online-reviews/repository.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationPath = new URL(
  "../migrations/002_create_online_reviews.sql",
  import.meta.url,
);
const migrationScriptPath = fileURLToPath(
  new URL("../scripts/migrate-online-reviews.mjs", import.meta.url),
);

const candidate = {
  sourceUrl: "https://blog.naver.com/example/123",
  title: "청주 어믜뜰 후기",
  description: "등갈비찜과 셀프바를 즐긴 어믜뜰 방문기",
  bloggerName: "청주 기록",
  bloggerUrl: "https://blog.naver.com/example",
  publishedOn: "2026-09-17",
  discoveredAt: "2026-09-17T00:00:00.000Z",
};

function normalizeSql(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

test("insertPendingReviews inserts approved fields as pending and ignores duplicate URLs", async () => {
  const calls = [];
  const inserted = await insertPendingReviews(
    [candidate, { ...candidate, sourceUrl: "https://blog.naver.com/example/456" }],
    async (text, params) => {
      calls.push({ text, params });
      return calls.length === 1 ? [{ source_url: candidate.sourceUrl }] : [];
    },
  );

  assert.equal(inserted, 1);
  assert.equal(calls.length, 2);
  const sql = normalizeSql(calls[0].text);
  assert.match(sql, /^insert into online_reviews/);
  assert.match(sql, /status/);
  assert.match(sql, /on conflict \(source_url\) do nothing/);
  assert.match(sql, /returning source_url/);
  assert.deepEqual(calls[0].params, [
    candidate.sourceUrl,
    candidate.title,
    candidate.description,
    candidate.bloggerName,
    candidate.bloggerUrl,
    candidate.publishedOn,
    candidate.discoveredAt,
    "pending",
  ]);
});

test("insertPendingReviews skips non-canonical source URLs before querying", async () => {
  let queryCalls = 0;
  const inserted = await insertPendingReviews(
    [{ ...candidate, sourceUrl: "https://example.com/not-naver" }],
    async () => {
      queryCalls += 1;
      return [];
    },
  );

  assert.equal(inserted, 0);
  assert.equal(queryCalls, 0);
});

test("loadApprovedOnlineReviews binds a bounded limit and maps only explicit fields", async () => {
  const calls = [];
  const rows = await loadApprovedOnlineReviews(6, async (text, params) => {
    calls.push({ text, params });
    return [
      {
        source_url: candidate.sourceUrl,
        title: candidate.title,
        description: candidate.description,
        blogger_name: candidate.bloggerName,
        blogger_url: candidate.bloggerUrl,
        published_on: candidate.publishedOn,
        discovered_at: candidate.discoveredAt,
        status: "approved",
        moderated_at: "2026-09-17T01:00:00.000Z",
        credential: "must-not-be-read",
      },
      {
        source_url: "https://example.com/approved-but-unsafe",
        title: candidate.title,
        description: candidate.description,
        blogger_name: candidate.bloggerName,
        blogger_url: candidate.bloggerUrl,
        published_on: candidate.publishedOn,
        discovered_at: candidate.discoveredAt,
        status: "approved",
        moderated_at: null,
      },
      { source_url: "invalid" },
    ];
  });

  assert.equal(calls.length, 1);
  const sql = normalizeSql(calls[0].text);
  assert.match(sql, /from online_reviews/);
  assert.match(sql, /where status = 'approved'/);
  assert.match(sql, /order by published_on desc, discovered_at desc/);
  assert.match(sql, /limit \$1/);
  assert.deepEqual(calls[0].params, [6]);
  assert.deepEqual(rows, [
    {
      ...candidate,
      status: "approved",
      moderatedAt: "2026-09-17T01:00:00.000Z",
    },
  ]);

  for (const limit of [0, -1, 21, 1.5, Number.NaN]) {
    await assert.rejects(loadApprovedOnlineReviews(limit, async () => []), /Invalid review limit/);
  }
});

test("moderateOnlineReview allows exact states and updates moderation time safely", async () => {
  for (const status of ["approved", "rejected", "pending"]) {
    const calls = [];
    const changed = await moderateOnlineReview(
      candidate.sourceUrl,
      status,
      async (text, params) => {
        calls.push({ text, params });
        return [{ source_url: candidate.sourceUrl }];
      },
    );

    assert.equal(changed, true);
    assert.equal(calls.length, 1);
    assert.match(normalizeSql(calls[0].text), /^update online_reviews/);
    assert.deepEqual(calls[0].params, [candidate.sourceUrl, status]);
  }

  await assert.rejects(
    moderateOnlineReview(candidate.sourceUrl, "published", async () => []),
    /Invalid review status/,
  );
  await assert.rejects(
    moderateOnlineReview("https://example.com/123", "approved", async () => []),
    /Invalid review URL/,
  );
});

test("loadOnlineReviewDashboard returns moderation groups and the latest safe run", async () => {
  const calls = [];
  const dashboard = await loadOnlineReviewDashboard(async (text) => {
    const sql = normalizeSql(text);
    calls.push(sql);
    if (/where status = 'pending'/.test(sql)) {
      return [
        {
          source_url: candidate.sourceUrl,
          title: candidate.title,
          description: candidate.description,
          blogger_name: candidate.bloggerName,
          blogger_url: candidate.bloggerUrl,
          published_on: candidate.publishedOn,
          discovered_at: candidate.discoveredAt,
          status: "pending",
          moderated_at: null,
        },
      ];
    }
    if (/where status in \('approved', 'rejected'\)/.test(sql)) return [];
    if (/count\(\*\)::integer/.test(sql)) {
      return [
        { status: "pending", count: 201 },
        { status: "approved", count: 312 },
        { status: "rejected", count: 4 },
      ];
    }
    if (/from online_review_sync_runs/.test(sql)) {
      return [{
        id: "7",
        started_at: "2026-09-17T00:00:00.000Z",
        finished_at: "2026-09-17T00:00:03.000Z",
        status: "success",
        discovered_count: 1,
        error_code: null,
      }];
    }
    throw new Error(`Unexpected query: ${sql}`);
  });

  assert.equal(calls.length, 4);
  assert.match(calls[0], /where status = 'pending'/);
  assert.doesNotMatch(calls[0], /limit 200/);
  assert.match(calls[1], /where status in \('approved', 'rejected'\)/);
  assert.match(calls[1], /limit 200/);
  assert.match(calls[2], /count\(\*\)::integer/);
  assert.equal(dashboard.pending.length, 1);
  assert.equal(dashboard.approved.length, 0);
  assert.equal(dashboard.rejected.length, 0);
  assert.deepEqual(dashboard.counts, {
    pending: 201,
    approved: 312,
    rejected: 4,
  });
  assert.deepEqual(dashboard.lastRun, {
    id: "7",
    startedAt: "2026-09-17T00:00:00.000Z",
    finishedAt: "2026-09-17T00:00:03.000Z",
    status: "success",
    discoveredCount: 1,
    errorCode: null,
  });
});

test("sync run helpers insert running then finish with stable fields", async () => {
  const calls = [];
  const query = async (text, params) => {
    calls.push({ text: normalizeSql(text), params });
    return calls.length === 1 ? [{ id: "9" }] : [{ id: "9" }];
  };

  const id = await startOnlineReviewSyncRun("2026-09-17T00:00:00.000Z", query);
  assert.equal(id, "9");
  await finishOnlineReviewSyncRun(
    id,
    {
      finishedAt: "2026-09-17T00:00:05.000Z",
      status: "failed",
      discoveredCount: 2,
      errorCode: "PARTIAL_FAILURE",
    },
    query,
  );

  assert.match(calls[0].text, /^insert into online_review_sync_runs/);
  assert.deepEqual(calls[0].params, ["2026-09-17T00:00:00.000Z", "running"]);
  assert.match(calls[1].text, /^update online_review_sync_runs/);
  assert.deepEqual(calls[1].params, [
    "9",
    "2026-09-17T00:00:05.000Z",
    "failed",
    2,
    "PARTIAL_FAILURE",
  ]);
});

test("migration defines constrained review and sync tables with three indexes", async () => {
  const migration = (await readFile(migrationPath, "utf8")).toLowerCase();
  const normalized = normalizeSql(migration);

  assert.match(migration, /create table if not exists online_reviews/);
  assert.match(migration, /source_url\s+text\s+primary key/);
  assert.match(migration, /status\s+text\s+not null\s+default 'pending'/);
  assert.match(migration, /status in \('pending', 'approved', 'rejected'\)/);
  assert.match(migration, /create table if not exists online_review_sync_runs/);
  assert.match(migration, /status in \('running', 'success', 'failed'\)/);
  assert.match(migration, /discovered_count\s+integer\s+not null\s+default 0/);
  assert.equal((migration.match(/create index if not exists/g) ?? []).length, 3);
  assert.match(normalized, /online_reviews_status_published_idx on online_reviews \(status, published_on desc\)/);
  assert.match(normalized, /online_reviews_status_discovered_idx on online_reviews \(status, discovered_at desc\)/);
  assert.match(normalized, /online_review_sync_runs_started_idx on online_review_sync_runs \(started_at desc\)/);
});

test("database adapter fails with a stable credential-free error", () => {
  const databaseUrl = pathToFileURL(
    fileURLToPath(new URL("../lib/online-reviews/database.ts", import.meta.url)),
  ).href;
  const env = { ...process.env };
  delete env.REVIEWS_DATABASE_URL;
  delete env.DATABASE_URL;
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `import { query } from ${JSON.stringify(databaseUrl)}; await query("select $1", ["secret"]);`,
    ],
    { cwd: root, encoding: "utf8", env },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /REVIEWS_DATABASE_URL is not configured/);
  assert.doesNotMatch(result.stderr, /postgres(?:ql)?:\/\//i);
});

test("migration CLI reads canonical SQL once and fails safely without a URL", async () => {
  const script = await readFile(migrationScriptPath, "utf8");
  assert.match(script, /002_create_online_reviews\.sql/);
  assert.equal((script.match(/\.query\(migrationText\)/g) ?? []).length, 1);
  assert.doesNotMatch(script, /create\s+table|create\s+index/i);

  const env = { ...process.env };
  delete env.DATABASE_URL;
  delete env.REVIEWS_DATABASE_URL;
  const result = spawnSync(process.execPath, [migrationScriptPath], {
    cwd: root,
    encoding: "utf8",
    env,
  });
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr.trim(), "DATABASE_URL is not configured");
  assert.doesNotMatch(result.stderr, /postgres(?:ql)?:\/\//i);
});
