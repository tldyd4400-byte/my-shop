import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { NextRequest } from "next/server.js";

import { config, planProxyAction, proxy } from "../proxy.ts";

globalThis.AsyncLocalStorage ??= AsyncLocalStorage;
const { unstable_doesMiddlewareMatch } = await import(
  "next/experimental/testing/server.js"
);

const NOW = new Date("2026-07-26T12:34:56.000Z");
const PUBLIC_PATH = "/menu";

function plan(overrides = {}) {
  return planProxyAction({
    method: "GET",
    pathname: PUBLIC_PATH,
    userAgent: "GPTBot/1.0",
    now: NOW,
    ...overrides,
  });
}

test("canonical admin redirects outrank bot collection", () => {
  for (const pathname of [
    "/admin/ai-visits%22",
    '/admin/ai-visits"',
    "/admin/ai-visit",
  ]) {
    assert.deepEqual(plan({ pathname }), {
      redirectPath: "/admin/ai-visits",
      event: null,
    });
  }
});

test("plans privacy-safe events for every bot purpose and generic crawlers", () => {
  const cases = [
    ["OAI-SearchBot/1.0", "oai-searchbot", "search_indexing"],
    ["GPTBot/1.0", "gptbot", "training"],
    ["ChatGPT-User/1.0", "chatgpt-user", "realtime_citation"],
    ["OAI-AdsBot/1.0", "oai-adsbot", "other"],
    ["ExampleSpider/1.0", "generic-crawler", "other"],
  ];

  for (const [userAgent, botId, purpose] of cases) {
    const action = plan({
      pathname: "/stories/example?private=yes#secret",
      userAgent,
    });

    assert.equal(action.redirectPath, null);
    assert.deepEqual(Object.keys(action.event).sort(), [
      "botId",
      "botName",
      "createdAt",
      "path",
      "purpose",
      "userAgent",
      "vendor",
    ]);
    assert.equal(action.event.createdAt, NOW.toISOString());
    assert.equal(action.event.path, "/stories/example");
    assert.equal(action.event.userAgent, userAgent);
    assert.equal(action.event.botId, botId);
    assert.equal(action.event.purpose, purpose);
  }
});

test("allows eligible HEAD requests", () => {
  assert.equal(plan({ method: "HEAD" }).event?.botId, "gptbot");
});

test("does not collect browsers, unknown normal agents, or missing agents", () => {
  for (const userAgent of [
    "Mozilla/5.0 Chrome/126",
    "ordinary-http-client/1.0",
    "",
    null,
  ]) {
    assert.deepEqual(plan({ userAgent }), { redirectPath: null, event: null });
  }
});

test("does not collect private, framework, or static asset requests", () => {
  for (const pathname of [
    "/admin",
    "/admin/ai-visits",
    "/api/health",
    "/_next/static/chunk.js",
    "/_next/image",
    "/images/photo.webp",
    "/media/hero.mp4",
    "/uploads/menu.pdf",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/assets/app.css",
    "/downloads/archive.zip",
  ]) {
    assert.deepEqual(
      plan({ pathname }),
      { redirectPath: null, event: null },
      pathname,
    );
  }
});

test("does not collect non-GET/HEAD methods", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS", ""]) {
    assert.deepEqual(plan({ method }), { redirectPath: null, event: null });
  }
});

test("fails closed without throwing for ordinary malformed and unsafe pathnames", () => {
  for (const pathname of [
    "http://[::1",
    "//evil.example/menu",
    "/admin\\ai-visits",
    "/admin%2Fai-visits",
    "/menu%",
    "/menu%ZZ",
  ]) {
    assert.doesNotThrow(() => plan({ pathname }), pathname);
    assert.deepEqual(
      plan({ pathname }),
      { redirectPath: null, event: null },
      pathname,
    );
  }
});

test("fails closed without throwing for invalid runtime timestamp values", () => {
  for (const now of [new Date(Number.NaN), null, "2026-07-26", 0]) {
    assert.doesNotThrow(() => plan({ now }));
    assert.deepEqual(
      plan({ now }),
      { redirectPath: null, event: null },
      String(now),
    );
  }
});

test("preserves valid Date boundaries", () => {
  for (const now of [new Date(-8.64e15), new Date(8.64e15)]) {
    assert.equal(plan({ now }).event?.createdAt, now.toISOString());
  }
});

test("redirect planning still outranks invalid timestamp validation", () => {
  assert.deepEqual(
    plan({ pathname: "/admin/ai-visits%22", now: new Date(Number.NaN) }),
    { redirectPath: "/admin/ai-visits", event: null },
  );
});

test("matcher includes public and malformed admin paths while excluding internals and assets", () => {
  const cases = [
    ["https://shop.example/menu", true],
    ["https://shop.example/stories/example", true],
    ["https://shop.example/admin/ai-visits%22", true],
    ["https://shop.example/admin/ai-visit", true],
    ["https://shop.example/api/health", false],
    ["https://shop.example/_next/static/chunk.js", false],
    ["https://shop.example/_next/image", false],
    ["https://shop.example/favicon.ico", false],
    ["https://shop.example/robots.txt", false],
    ["https://shop.example/sitemap.xml", false],
    ["https://shop.example/images/photo.webp", false],
  ];

  for (const [url, expected] of cases) {
    assert.equal(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url }),
      expected,
      url,
    );
  }
});

test("real NextRequest receives a same-origin canonical 308 without query data", () => {
  const response = proxy(
    new NextRequest(
      "https://shop.example/admin/ai-visits%22?private=yes#secret",
      {
        headers: {
          host: "evil.example",
          "user-agent": "GPTBot/1.0",
        },
      },
    ),
    { waitUntil: () => assert.fail("redirect must not schedule persistence") },
  );

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://shop.example/admin/ai-visits",
  );
});

test("eligible real NextRequest schedules a contained persistence promise", async () => {
  const previousDatabaseUrl = process.env.AI_VISITS_DATABASE_URL;
  const previousWarn = console.warn;
  const warnings = [];
  let persistence;

  delete process.env.AI_VISITS_DATABASE_URL;
  console.warn = (...args) => warnings.push(args);

  try {
    const response = proxy(
      new NextRequest("https://shop.example/menu?private=yes", {
        headers: { "user-agent": "GPTBot/1.0" },
      }),
      { waitUntil: (promise) => (persistence = promise) },
    );

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.ok(persistence instanceof Promise);
    await persistence;
    assert.deepEqual(warnings, [["[ai-visits] record failed", "Error"]]);
  } finally {
    console.warn = previousWarn;
    if (previousDatabaseUrl === undefined) {
      delete process.env.AI_VISITS_DATABASE_URL;
    } else {
      process.env.AI_VISITS_DATABASE_URL = previousDatabaseUrl;
    }
  }
});

test("proxy source binds persistence as non-awaited and avoids prohibited request data", async () => {
  const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

  assert.match(source, /recordAiVisit\(/u);
  assert.doesNotMatch(source, /await\s+recordAiVisit/u);
  assert.doesNotMatch(
    source,
    /request\.(?:cookies|ip|geo)|headers\.get\(["'](?:referer|referrer|cookie)["']\)/iu,
  );
});
