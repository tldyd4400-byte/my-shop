import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import {
  ADMIN_COOKIE_NAME,
  adminCookieOptions,
  createAdminSession,
  hashAdminPassword,
  verifyAdminPassword,
  verifyAdminSession,
} from "../lib/admin/auth.ts";
import {
  canonicalizeAdminPath,
  sanitizeAdminNext,
} from "../lib/admin/urls.ts";

const TEST_SALT = Buffer.from("0123456789abcdef", "utf8");
const NOW = 2_000_000_000;

test("hashes and verifies a password with the approved scrypt format", async () => {
  const encoded = await hashAdminPassword("correct horse battery staple", TEST_SALT);

  assert.match(
    encoded,
    /^scrypt\$16384\$8\$1\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/u,
  );
  assert.equal(await verifyAdminPassword("correct horse battery staple", encoded), true);
  assert.equal(await verifyAdminPassword("wrong password", encoded), false);

  const [, , , , salt, hash] = encoded.split("$");
  assert.equal(Buffer.from(salt, "base64url").length, 16);
  assert.equal(Buffer.from(hash, "base64url").length, 32);
});

test("uses a fresh random salt when one is not provided", async () => {
  const first = await hashAdminPassword("same password");
  const second = await hashAdminPassword("same password");

  assert.notEqual(first, second);
  assert.equal(await verifyAdminPassword("same password", first), true);
  assert.equal(await verifyAdminPassword("same password", second), true);
});

test("rejects empty passwords and undersized explicit salts", async () => {
  await assert.rejects(() => hashAdminPassword(""), /password/iu);
  await assert.rejects(
    () => hashAdminPassword("password", Buffer.alloc(15)),
    /salt/iu,
  );
  assert.equal(
    await verifyAdminPassword(
      "",
      await hashAdminPassword("password", TEST_SALT),
    ),
    false,
  );
});

test("fails closed for malformed or unapproved password hashes", async () => {
  const valid = await hashAdminPassword("password", TEST_SALT);
  const [algorithm, n, r, p, salt, hash] = valid.split("$");
  const cases = [
    "",
    "not-a-hash",
    `${valid}$extra`,
    `argon2$${n}$${r}$${p}$${salt}$${hash}`,
    `${algorithm}$32768$${r}$${p}$${salt}$${hash}`,
    `${algorithm}$${n}$9$${p}$${salt}$${hash}`,
    `${algorithm}$${n}$${r}$2$${salt}$${hash}`,
    `${algorithm}$999999999999999999999999$${r}$${p}$${salt}$${hash}`,
    `${algorithm}$${n}$${r}$${p}$$${hash}`,
    `${algorithm}$${n}$${r}$${p}$${salt}=$${hash}`,
    `${algorithm}$${n}$${r}$${p}$${salt}$${hash}=`,
    `${algorithm}$${n}$${r}$${p}$${salt}$${hash.slice(0, -1)}`,
    `${algorithm}$${n}$${r}$${p}$${"A".repeat(10_000)}$${hash}`,
  ];

  for (const candidate of cases) {
    await assert.doesNotReject(() => verifyAdminPassword("password", candidate));
    assert.equal(
      await verifyAdminPassword("password", candidate),
      false,
      candidate.slice(0, 100),
    );
  }
});

test("creates an eight-hour signed admin session", () => {
  const token = createAdminSession("test-session-secret", NOW);
  const [payloadSegment, signatureSegment] = token.split(".");

  assert.deepEqual(
    JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8")),
    { exp: NOW + 60 * 60 * 8 },
  );
  assert.match(payloadSegment, /^[A-Za-z0-9_-]+$/u);
  assert.match(signatureSegment, /^[A-Za-z0-9_-]+$/u);
  assert.equal(verifyAdminSession(token, "test-session-secret", NOW), true);
  assert.equal(
    verifyAdminSession(token, "test-session-secret", NOW + 60 * 60 * 8 - 1),
    true,
  );
});

test("rejects expired, tampered, and wrongly signed sessions", () => {
  const token = createAdminSession("test-session-secret", NOW);
  const [payload, signature] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ exp: NOW + 60 * 60 * 24 }),
  ).toString("base64url");
  const tamperedSignature = `${signature.slice(0, -1)}${signature.endsWith("A") ? "B" : "A"}`;

  assert.equal(
    verifyAdminSession(token, "test-session-secret", NOW + 60 * 60 * 8),
    false,
  );
  assert.equal(
    verifyAdminSession(`${tamperedPayload}.${signature}`, "test-session-secret", NOW),
    false,
  );
  assert.equal(
    verifyAdminSession(`${payload}.${tamperedSignature}`, "test-session-secret", NOW),
    false,
  );
  assert.equal(verifyAdminSession(token, "another-secret", NOW), false);
});

test("fails closed for invalid session inputs and payload schemas", () => {
  const signedRawPayload = (rawPayload) => {
    const payloadSegment = Buffer.from(rawPayload).toString("base64url");
    const signature = createHmac("sha256", "test-session-secret")
      .update(payloadSegment)
      .digest("base64url");
    return `${payloadSegment}.${signature}`;
  };
  const signedTokenFor = (payload) => signedRawPayload(JSON.stringify(payload));
  const valid = createAdminSession("test-session-secret", NOW);
  const [payload, signature] = valid.split(".");
  const cases = [
    "",
    "not-a-token",
    `${valid}.extra`,
    `.${signature}`,
    `${payload}.`,
    `${payload}=.${signature}`,
    `${payload}.${signature}=`,
    `${"A".repeat(4097)}.${signature}`,
    signedTokenFor({}),
    signedTokenFor({ exp: NOW + 1, role: "admin" }),
    signedTokenFor({ exp: "tomorrow" }),
    signedTokenFor({ exp: 1.5 }),
    signedTokenFor({ exp: null }),
    signedRawPayload(`{ "exp": ${NOW + 1} }`),
    signedRawPayload(`{"exp":${NOW - 1},"exp":${NOW + 1}}`),
  ];

  for (const candidate of cases) {
    assert.doesNotThrow(() => verifyAdminSession(candidate, "test-session-secret", NOW));
    assert.equal(verifyAdminSession(candidate, "test-session-secret", NOW), false);
  }
  assert.equal(verifyAdminSession(valid, "", NOW), false);
  assert.equal(verifyAdminSession(valid, "test-session-secret", Number.NaN), false);
});

test("rejects empty secrets and invalid creation times", () => {
  assert.throws(() => createAdminSession("", NOW), /secret/iu);
  for (const now of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER,
  ]) {
    assert.throws(() => createAdminSession("secret", now), /time/iu);
  }
});

test("exports the exact admin cookie contract", () => {
  assert.equal(ADMIN_COOKIE_NAME, "eomeutteull_admin");
  assert.deepEqual(adminCookieOptions, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 8,
  });
});

test("sanitizes every next destination to the sole admin landing page", () => {
  for (const value of [
    undefined,
    null,
    "",
    "/admin/ai-visits",
    "/admin/settings",
    "https://evil.example",
    "//evil.example",
    "/public",
  ]) {
    assert.equal(sanitizeAdminNext(value), "/admin/ai-visits");
  }
});

test("canonicalizes only explicitly approved legacy admin path variants", () => {
  for (const pathname of [
    "/admin/ai-visits%22",
    '/admin/ai-visits"',
    "/admin/ai-visit",
    "/admin%2Fai-visits%22",
    "/admin%2Fai-visit",
  ]) {
    assert.equal(canonicalizeAdminPath(pathname), "/admin/ai-visits", pathname);
  }

  assert.equal(canonicalizeAdminPath("/admin/ai-visits"), null);
});

test("rejects unsafe and unrelated admin path representations", () => {
  const rejected = [
    "https://evil.example/admin/ai-visits%22",
    "//evil.example/admin/ai-visits%22",
    "///evil.example/admin/ai-visits%22",
    "\\\\evil.example\\admin\\ai-visits%22",
    "/admin\\ai-visits%22",
    "/admin%5Cai-visits%22",
    "/admin%255Cai-visits%22",
    "/admin/ai-visits%00%22",
    "/admin/ai-visits\u0000\"",
    "/admin/ai-visits%0A%22",
    "/admin/ai-visits%",
    "/admin/ai-visits%2",
    "/admin/ai-visits%ZZ",
    "/admin/ai-visits%22?next=https://evil.example",
    "/admin/ai-visits%22#fragment",
    "/admin/../admin/ai-visits%22",
    "/admin/%2e%2e/admin/ai-visits%22",
    "/ADMIN/AI-VISITS%22",
    "%2F%2Fevil.example%2Fadmin%2Fai-visits%2522",
    "%252F%252Fevil.example%252Fadmin%252Fai-visits%252522",
    "https%3A%2F%2Fevil.example%2Fadmin%2Fai-visits%2522",
    "/admin/ai-visits%2522",
    "/admin/settings",
    "/admin/ai-visits/",
    "admin/ai-visits%22",
    "",
    null,
  ];

  for (const pathname of rejected) {
    assert.doesNotThrow(() => canonicalizeAdminPath(pathname));
    assert.equal(canonicalizeAdminPath(pathname), null, String(pathname));
  }
});
