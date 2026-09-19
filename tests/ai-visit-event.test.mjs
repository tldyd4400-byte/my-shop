import assert from "node:assert/strict";
import test from "node:test";

import { createAiVisitEvent } from "../lib/ai-visits/event.ts";
import { isCollectableRequest } from "../lib/ai-visits/request-policy.ts";

const bot = {
  botId: "gptbot",
  botName: "GPTBot",
  vendor: "OpenAI",
  purpose: "training",
};

test("creates only the approved privacy-safe fields", () => {
  const event = createAiVisitEvent({
    pathname: "/menu?phone=010-0000-0000#secret",
    userAgent: `GPTBot/1.0\r\n${"x".repeat(700)}`,
    bot,
    now: new Date("2026-07-26T00:00:00.000Z"),
    ip: "203.0.113.4",
    ipHash: "hash",
    referrer: "https://example.com/private",
    cookie: "session=secret",
    session: "secret",
    name: "Private Name",
    phone: "010-0000-0000",
  });

  assert.deepEqual(Object.keys(event).sort(), [
    "botId",
    "botName",
    "createdAt",
    "path",
    "purpose",
    "userAgent",
    "vendor",
  ]);
  assert.equal(event.createdAt, "2026-07-26T00:00:00.000Z");
  assert.equal(event.path, "/menu");
  assert.equal(event.userAgent.length, 512);
  assert.doesNotMatch(event.userAgent, /[\u0000-\u001f\u007f-\u009f]/u);

  for (const forbidden of [
    "ip",
    "ipHash",
    "referrer",
    "cookie",
    "session",
    "phone",
    "name",
    "query",
    "fragment",
  ]) {
    assert.equal(forbidden in event, false);
  }
});

test("sanitizes all C0 and C1 controls and caps user agents at 512 code units", () => {
  const controls = Array.from(
    { length: 65 },
    (_, index) => String.fromCharCode(index < 32 ? index : index + 95),
  ).join("");
  const event = createAiVisitEvent({
    pathname: "/menu",
    userAgent: `${controls}${"😀".repeat(300)}`,
    bot,
    now: new Date("2026-07-26T00:00:00.000Z"),
  });

  assert.equal(event.userAgent.length, 512);
  assert.doesNotMatch(event.userAgent, /[\u0000-\u001f\u007f-\u009f]/u);
});

test("falls back to the root path when the pathname is malformed", () => {
  const event = createAiVisitEvent({
    pathname: "http://[::1",
    userAgent: "GPTBot/1.0",
    bot,
    now: new Date("2026-07-26T00:00:00.000Z"),
  });

  assert.equal(event.path, "/");
});

test("falls back to the root path for unsafe pathname representations", () => {
  for (const pathname of [
    "//admin/ai-visits",
    "///admin/ai-visits",
    "https://example.com/menu",
    "/admin\\ai-visits",
    "\\\\admin\\ai-visits",
    "/admin%2Fai-visits",
    "/admin%5Cai-visits",
    "/admin%3Fpublic",
    "/admin%23public",
  ]) {
    const event = createAiVisitEvent({
      pathname,
      userAgent: "GPTBot/1.0",
      bot,
      now: new Date("2026-07-26T00:00:00.000Z"),
    });

    assert.equal(event.path, "/", pathname);
  }
});

test("collects public HTML GET and HEAD requests case-insensitively", () => {
  for (const request of [
    { method: "GET", pathname: "/menu" },
    { method: "head", pathname: "/stories/example?preview=false#details" },
    { method: "gEt", pathname: "/about.html" },
  ]) {
    assert.equal(isCollectableRequest(request), true, JSON.stringify(request));
  }
});

test("excludes private and non-page route families", () => {
  for (const pathname of [
    "/admin",
    "/admin/ai-visits",
    "/api",
    "/api/health",
    "/_next/static/a.js",
    "/_next/image",
    "/images/a.webp",
    "/media/a.mp4",
    "/uploads/a.pdf",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    assert.equal(
      isCollectableRequest({ method: "GET", pathname }),
      false,
      pathname,
    );
  }
});

test("rejects non-path, authority-bearing, and backslash pathname forms", () => {
  for (const pathname of [
    "admin/ai-visits",
    "//admin/ai-visits",
    "///admin/ai-visits",
    "https://example.com/menu",
    "/admin\\ai-visits",
    "\\\\admin\\ai-visits",
  ]) {
    assert.equal(
      isCollectableRequest({ method: "GET", pathname }),
      false,
      pathname,
    );
  }
});

test("rejects encoded separators, delimiters, and static extensions", () => {
  for (const pathname of [
    "/admin%2Fai-visits",
    "/admin%2fai-visits",
    "/admin%5Cai-visits",
    "/admin%3Fpublic",
    "/admin%23public",
    "/asset%2Ejs",
    "/asset.%6As",
    "/asset%252Ejs",
  ]) {
    assert.equal(
      isCollectableRequest({ method: "GET", pathname }),
      false,
      pathname,
    );
  }
});

test("excludes only the admin segment boundary", () => {
  for (const pathname of ["/administrator", "/administrator/x"]) {
    assert.equal(
      isCollectableRequest({ method: "GET", pathname }),
      true,
      pathname,
    );
  }
});

test("excludes static file extensions case-insensitively", () => {
  for (const pathname of [
    "/asset.png",
    "/asset.JPEG",
    "/asset.svg",
    "/asset.webp",
    "/asset.mp4",
    "/asset.webm",
    "/asset.MP3",
    "/asset.woff2",
    "/asset.TTF",
    "/script.JS",
    "/data.JSON",
    "/feed.xml",
    "/styles/site.CSS?version=1",
    "/bundle.js.MAP",
    "/document.PDF",
    "/document.docx",
    "/archive.ZIP",
    "/archive.tar.gz",
  ]) {
    assert.equal(
      isCollectableRequest({ method: "HEAD", pathname }),
      false,
      pathname,
    );
  }
});

test("excludes non-GET/HEAD methods and safely rejects malformed input", () => {
  for (const method of ["POST", "put", "PATCH", "DELETE", "OPTIONS", ""]) {
    assert.equal(isCollectableRequest({ method, pathname: "/menu" }), false);
  }

  for (const request of [
    { method: null, pathname: "/menu" },
    { method: "GET", pathname: null },
    { method: "GET", pathname: "http://[::1" },
    null,
  ]) {
    assert.doesNotThrow(() => isCollectableRequest(request));
    assert.equal(isCollectableRequest(request), false);
  }
});
