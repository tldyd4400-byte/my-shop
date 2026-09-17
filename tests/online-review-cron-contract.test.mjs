import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isAuthorizedCronRequest } from "../lib/online-reviews/cron-auth.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("cron authorization accepts only the exact non-empty bearer secret", () => {
  assert.equal(isAuthorizedCronRequest("Bearer expected-secret", "expected-secret"), true);
  for (const [header, secret] of [
    [null, "expected-secret"],
    ["Bearer expected-secret ", "expected-secret"],
    ["bearer expected-secret", "expected-secret"],
    ["Bearer wrong-secret", "expected-secret"],
    ["Bearer expected-secret", ""],
    ["Bearer ", ""],
  ]) {
    assert.equal(isAuthorizedCronRequest(header, secret), false);
  }
});

test("cron route authenticates before sync and contains failures", () => {
  const source = read("app/api/cron/reviews/route.ts");
  assert.match(source, /request\.headers\.get\(["']authorization["']\)/u);
  assert.match(source, /process\.env\.CRON_SECRET/u);
  assert.match(source, /isAuthorizedCronRequest/u);
  assert.match(source, /status:\s*401/u);
  assert.match(source, /await syncOnlineReviews\(\)/u);
  assert.match(source, /status:\s*503/u);
  assert.doesNotMatch(source, /console\.(?:log|info|warn|error|debug)|NAVER_API_HUB_CLIENT_SECRET|REVIEWS_DATABASE_URL/u);

  const authIndex = source.indexOf("isAuthorizedCronRequest(");
  const syncIndex = source.indexOf("await syncOnlineReviews()");
  assert.ok(authIndex >= 0 && syncIndex > authIndex);
});

test("Vercel config schedules one daily review collection at 00:00 UTC", () => {
  const config = JSON.parse(read("vercel.json"));
  assert.deepEqual(config.crons, [
    { path: "/api/cron/reviews", schedule: "0 0 * * *" },
  ]);
});
