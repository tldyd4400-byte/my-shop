import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { config, planProxyAction } from "../proxy.ts";

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

test("exports one static Next 16 matcher excluding internal and extension assets", () => {
  assert.deepEqual(config, {
    matcher: [
      "/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|favicon(?:\\.[^/]+)?$|sitemap(?:[-.][^/]*)?$|robots\\.txt$|.*\\.[^/]+$).*)",
    ],
  });
});

test("proxy source enforces non-blocking persistence and privacy contracts", async () => {
  const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");

  assert.match(source, /request\.nextUrl\.pathname/u);
  assert.match(source, /request\.headers\.get\(["']user-agent["']\)/u);
  assert.equal((source.match(/request\.headers\.get\(/gu) ?? []).length, 1);
  assert.match(source, /event\.waitUntil\(/u);
  assert.match(source, /recordAiVisit\(action\.event\)\.catch\(/u);
  assert.match(
    source,
    /console\.warn\(\s*["']\[ai-visits\] record failed["'],\s*error instanceof Error \? error\.name : ["']UnknownError["']\s*\)/u,
  );
  assert.match(source, /return NextResponse\.next\(\)/u);
  assert.doesNotMatch(source, /await\s+recordAiVisit/u);
  assert.doesNotMatch(source, /request\.(?:cookies|ip|geo)|headers\.get\(["'](?:referer|referrer|cookie)["']\)/iu);
  assert.match(source, /request\.nextUrl\.clone\(\)/u);
  assert.match(source, /redirectUrl\.search\s*=\s*["']["']/u);
  assert.match(source, /redirectUrl\.hash\s*=\s*["']["']/u);
  assert.match(source, /NextResponse\.redirect\(redirectUrl,\s*308\)/u);
});
