import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("shared navigation exposes every public route", () => {
  const header = read("components/site/site-header.tsx");

  for (const path of ["/menu", "/store", "/location", "/faq", "/reviews", "/stories"]) {
    assert.match(header, new RegExp(path));
  }
});

test("analytics link records approved events without blocking navigation", () => {
  const link = read("components/site/analytics-link.tsx");

  assert.match(
    link,
    /setTimeout\(\(\) => \{\s*try \{\s*window\.gtag\?\.\("event"/s,
  );
  assert.match(link, /event_name/);
  assert.match(link, /catch\s*\{/);
  assert.doesNotMatch(link, /preventDefault/);
});

test("menu and story read events are session-deduplicated", () => {
  const menu = read("components/site/menu-view-tracker.tsx");
  const story = read("components/site/story-read-tracker.tsx");

  assert.match(menu, /menu_view:/);
  assert.match(menu, /sessionStorage/);
  assert.match(menu, /menu_view/);
  assert.match(menu, /startBoundedRetry/);
  assert.match(menu, /return null/);

  assert.match(story, /story_read:/);
  assert.match(story, /scrollY/);
  assert.match(story, /30_000/);
  assert.match(story, /sessionStorage/);
  assert.match(story, /story_read/);
  assert.match(story, /startBoundedRetry/);
  assert.match(story, /removeEventListener/);
  assert.match(story, /clearTimeout/);
  assert.match(story, /return null/);
});

test("session events mark storage only after a successful analytics handoff", async () => {
  const { deliverSessionEvent } = await import("../lib/analytics/read-event.ts");
  const values = new Map();
  const calls = [];
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  let gtag;
  const input = {
    key: "menu_view:/behavior-test",
    eventName: "menu_view",
    pathname: "/behavior-test",
    getStorage: () => storage,
    getGtag: () => gtag,
  };

  assert.equal(deliverSessionEvent(input), false);
  assert.equal(values.has(input.key), false);

  gtag = (...args) => calls.push(args);
  assert.equal(deliverSessionEvent(input), true);
  assert.equal(values.get(input.key), "1");
  assert.deepEqual(calls, [
    ["event", "menu_view", { page_path: "/behavior-test" }],
  ]);

  assert.equal(deliverSessionEvent(input), true);
  assert.equal(calls.length, 1);
});

test("session events contain storage and analytics exceptions", async () => {
  const { deliverSessionEvent } = await import("../lib/analytics/read-event.ts");
  let successfulCalls = 0;
  const key = "story_read:/guard-test";
  const throwingStorage = {
    getItem: () => {
      throw new Error("storage unavailable");
    },
    setItem: () => {
      throw new Error("storage unavailable");
    },
  };

  assert.equal(
    deliverSessionEvent({
      key,
      eventName: "story_read",
      pathname: "/guard-test",
      getStorage: () => throwingStorage,
      getGtag: () => {
        throw new Error("analytics unavailable");
      },
    }),
    false,
  );

  const input = {
    key,
    eventName: "story_read",
    pathname: "/guard-test",
    getStorage: () => throwingStorage,
    getGtag: () => () => {
      successfulCalls += 1;
    },
  };
  assert.equal(deliverSessionEvent(input), true);
  assert.equal(deliverSessionEvent(input), true);
  assert.equal(successfulCalls, 1);
});

test("bounded analytics retries stop after success and can be cleaned up", async () => {
  const { startBoundedRetry } = await import("../lib/analytics/read-event.ts");
  const scheduled = [];
  const cleared = [];
  const scheduler = {
    setTimeout(callback, delay) {
      const id = scheduled.length;
      scheduled.push({ callback, delay });
      return id;
    },
    clearTimeout(id) {
      cleared.push(id);
    },
  };
  let attempts = 0;
  const stop = startBoundedRetry(
    () => {
      attempts += 1;
      return attempts === 3;
    },
    scheduler,
    { delayMs: 25, retryLimit: 4 },
  );

  assert.equal(attempts, 1);
  assert.equal(scheduled[0].delay, 25);
  scheduled[0].callback();
  scheduled[1].callback();
  assert.equal(attempts, 3);
  assert.equal(scheduled.length, 2);

  stop();
  assert.deepEqual(cleared, [1]);
});

test("read trackers mount only on their intended detail routes", () => {
  const menuPage = read("app/menu/page.tsx");
  const storyPage = read("app/stories/[slug]/page.tsx");
  const storyIndex = read("app/stories/page.tsx");

  assert.match(menuPage, /<MenuViewTracker \/>/);
  assert.match(storyPage, /<StoryReadTracker \/>/);
  assert.doesNotMatch(storyIndex, /StoryReadTracker/);
});
