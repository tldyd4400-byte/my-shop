import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  loadAiVisitRows,
  recordAiVisit,
} from "../lib/ai-visits/repository.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const migrationPath = new URL("../migrations/001_create_ai_visits.sql", import.meta.url);
const migrationScriptPath = fileURLToPath(
  new URL("../scripts/migrate-ai-visits.mjs", import.meta.url),
);

const event = {
  createdAt: "2026-07-26T00:00:00.000Z",
  path: "/menu",
  userAgent: "GPTBot/1.0",
  botId: "gptbot",
  botName: "GPTBot",
  vendor: "OpenAI",
  purpose: "training",
};

function normalizeSql(text) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

test("recordAiVisit inserts exactly the seven approved values with placeholders", async () => {
  const calls = [];

  await recordAiVisit(event, async (text, params) => {
    calls.push({ text, params });
    return [];
  });

  assert.equal(calls.length, 1);
  const sql = normalizeSql(calls[0].text);
  assert.match(sql, /^insert into ai_visits/);
  assert.match(
    sql,
    /\(created_at, path, user_agent, bot_id, bot_name, vendor, purpose\)/,
  );
  assert.match(sql, /values \(\$1, \$2, \$3, \$4, \$5, \$6, \$7\)/);
  assert.doesNotMatch(sql, /\$(?:8|9|[1-9]\d+)/);
  assert.deepEqual(calls[0].params, [
    event.createdAt,
    event.path,
    event.userAgent,
    event.botId,
    event.botName,
    event.vendor,
    event.purpose,
  ]);

  for (const forbidden of [
    "ip",
    "ip_hash",
    "hash",
    "referrer",
    "cookie",
    "session",
    "name",
    "phone",
  ]) {
    assert.equal(
      sql
        .slice(sql.indexOf("(") + 1, sql.indexOf(")"))
        .split(",")
        .map((column) => column.trim())
        .includes(forbidden),
      false,
      forbidden,
    );
  }
});

test("loadAiVisitRows binds the deterministic 60-day cutoff and maps approved summary columns", async () => {
  const calls = [];
  const rows = await loadAiVisitRows(
    new Date("2026-07-26T00:00:00.000Z"),
    async (text, params) => {
      calls.push({ text, params });
      return [
        {
          created_at: "2026-07-25T00:00:00.000Z",
          path: "/menu",
          bot_id: "gptbot",
          bot_name: "GPTBot",
          vendor: "OpenAI",
          purpose: "training",
          user_agent: "must-not-be-returned",
          ip: "203.0.113.7",
        },
      ];
    },
  );

  assert.equal(calls.length, 1);
  const sql = normalizeSql(calls[0].text);
  assert.match(sql, /^select created_at, path, bot_id, bot_name, vendor, purpose/);
  assert.match(sql, /from ai_visits where created_at >= \$1/);
  assert.doesNotMatch(sql, /user_agent|\bip\b|referrer|cookie|session|phone/);
  assert.deepEqual(calls[0].params, ["2026-05-27T00:00:00.000Z"]);
  assert.deepEqual(rows, [
    {
      createdAt: "2026-07-25T00:00:00.000Z",
      path: "/menu",
      botId: "gptbot",
      botName: "GPTBot",
      vendor: "OpenAI",
      purpose: "training",
    },
  ]);
});

test("loadAiVisitRows skips malformed rows and snapshots accepted fields once", async () => {
  const reads = Object.create(null);
  const oneShotValues = {
    created_at: "2026-07-25T03:04:05.006Z",
    path: "/one-shot",
    bot_id: "otherbot",
    bot_name: "OtherBot",
    vendor: "Example",
    purpose: "other",
  };
  const oneShotRow = {};

  for (const [field, value] of Object.entries(oneShotValues)) {
    reads[field] = 0;
    Object.defineProperty(oneShotRow, field, {
      enumerable: true,
      get() {
        reads[field] += 1;
        if (reads[field] > 1) throw new Error(`read ${field} twice`);
        return value;
      },
    });
  }

  let extraReads = 0;
  Object.defineProperty(oneShotRow, "connection_secret", {
    enumerable: true,
    get() {
      extraReads += 1;
      throw new Error("must not read extra executor data");
    },
  });

  const validDateRow = {
    created_at: new Date("2026-07-25T00:00:00.000Z"),
    path: "/date",
    bot_id: "datebot",
    bot_name: "DateBot",
    vendor: "Example",
    purpose: "search_indexing",
    executor_metadata: "must-not-be-returned",
  };
  const validOffsetRow = {
    created_at: "2026-07-25T09:30:00+09:00",
    path: "/offset",
    bot_id: "offsetbot",
    bot_name: "OffsetBot",
    vendor: "Example",
    purpose: "realtime_citation",
  };
  const otherwiseValid = {
    created_at: "2026-07-25T00:00:00.000Z",
    path: "/invalid",
    bot_id: "invalidbot",
    bot_name: "InvalidBot",
    vendor: "Example",
    purpose: "training",
  };

  const rows = await loadAiVisitRows(
    new Date("2026-07-26T00:00:00.000Z"),
    async () => [
      null,
      7,
      "primitive",
      { ...otherwiseValid, purpose: "not-approved" },
      { created_at: otherwiseValid.created_at },
      { ...otherwiseValid, path: 42 },
      { ...otherwiseValid, created_at: new Date(Number.NaN) },
      { ...otherwiseValid, created_at: "not-a-timestamp" },
      { ...otherwiseValid, created_at: "2026-07-25T00:00:00" },
      Object.defineProperty({}, "created_at", {
        get() {
          throw new Error("executor getter failed with sensitive value");
        },
      }),
      validDateRow,
      validOffsetRow,
      oneShotRow,
    ],
  );

  assert.deepEqual(rows, [
    {
      createdAt: "2026-07-25T00:00:00.000Z",
      path: "/date",
      botId: "datebot",
      botName: "DateBot",
      vendor: "Example",
      purpose: "search_indexing",
    },
    {
      createdAt: "2026-07-25T00:30:00.000Z",
      path: "/offset",
      botId: "offsetbot",
      botName: "OffsetBot",
      vendor: "Example",
      purpose: "realtime_citation",
    },
    {
      createdAt: "2026-07-25T03:04:05.006Z",
      path: "/one-shot",
      botId: "otherbot",
      botName: "OtherBot",
      vendor: "Example",
      purpose: "other",
    },
  ]);
  assert.deepEqual({ ...reads }, {
    created_at: 1,
    path: 1,
    bot_id: 1,
    bot_name: 1,
    vendor: 1,
    purpose: 1,
  });
  assert.equal(extraReads, 0);
  assert.deepEqual(Object.keys(rows[0]), [
    "createdAt",
    "path",
    "botId",
    "botName",
    "vendor",
    "purpose",
  ]);
});

test("loadAiVisitRows rejects an invalid now before querying and exposes no input value", async () => {
  let queryCount = 0;
  const invalidNow = new Date(Number.NaN);

  await assert.rejects(
    loadAiVisitRows(invalidNow, async () => {
      queryCount += 1;
      return [];
    }),
    (error) => {
      assert.equal(error.message, "Invalid now");
      assert.doesNotMatch(error.message, /invalid date|nan/i);
      return true;
    },
  );
  assert.equal(queryCount, 0);
});

test("migration defines only the approved table shape and exactly three idempotent indexes", async () => {
  const migration = (await readFile(migrationPath, "utf8")).toLowerCase();
  const normalizedMigration = normalizeSql(migration);

  assert.match(migration, /create table if not exists ai_visits/);
  assert.match(
    migration,
    /id\s+bigint\s+generated always as identity\s+primary key/,
  );
  assert.match(migration, /created_at\s+timestamptz\s+not null\s+default now\(\)/);
  assert.match(migration, /char_length\(path\)\s+between\s+1\s+and\s+2048/);
  assert.match(
    migration,
    /char_length\(user_agent\)\s+between\s+1\s+and\s+512/,
  );
  assert.match(
    migration,
    /purpose\s+in\s*\(\s*'search_indexing'\s*,\s*'training'\s*,\s*'realtime_citation'\s*,\s*'other'\s*\)/,
  );

  const indexes = migration.match(/create index if not exists/g) ?? [];
  assert.equal(indexes.length, 3);
  assert.match(
    normalizedMigration,
    /create index if not exists ai_visits_created_at_idx on ai_visits \(created_at desc\)/,
  );
  assert.match(
    normalizedMigration,
    /create index if not exists ai_visits_purpose_created_at_idx on ai_visits \(purpose, created_at desc\)/,
  );
  assert.match(
    normalizedMigration,
    /create index if not exists ai_visits_bot_created_at_idx on ai_visits \(bot_id, created_at desc\)/,
  );

  for (const forbidden of [
    "ip",
    "ip_hash",
    "hash",
    "referrer",
    "cookie",
    "session",
    "name",
    "phone",
  ]) {
    const columns = migration
      .slice(migration.indexOf("(") + 1, migration.indexOf(");"))
      .split(",")
      .map((definition) => definition.trim().split(/\s+/)[0]);
    assert.equal(columns.includes(forbidden), false, forbidden);
  }
});

test("database adapter reports a stable credential-free error when its URL is absent", () => {
  const databaseUrl = pathToFileURL(
    fileURLToPath(new URL("../lib/ai-visits/database.ts", import.meta.url)),
  ).href;
  const env = { ...process.env };
  delete env.AI_VISITS_DATABASE_URL;
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
  assert.match(result.stderr, /AI_VISITS_DATABASE_URL is not configured/);
  assert.doesNotMatch(result.stderr, /postgres(?:ql)?:\/\//i);
});

test("migration CLI fails without DATABASE_URL using only its stable message", () => {
  const env = { ...process.env };
  delete env.DATABASE_URL;
  delete env.AI_VISITS_DATABASE_URL;
  const result = spawnSync(process.execPath, [migrationScriptPath], {
    cwd: root,
    encoding: "utf8",
    env,
  });

  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.trim(), "DATABASE_URL is not configured");
  assert.doesNotMatch(result.stderr, /postgres(?:ql)?:\/\//i);
});

test("migration CLI keeps canonical DDL in SQL and executes that file once", async () => {
  const script = await readFile(migrationScriptPath, "utf8");

  assert.match(script, /001_create_ai_visits\.sql/);
  assert.equal((script.match(/\.query\(migrationText\)/g) ?? []).length, 1);
  assert.doesNotMatch(script, /create\s+table|create\s+index/i);
  assert.doesNotMatch(
    script,
    /console\.error\(\s*(?:error|url|databaseUrl)\s*\)/,
  );
  assert.match(script, /AI visits migration failed/);
});
