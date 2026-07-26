import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("root layout delegates the unchanged customer chrome boundary to RouteChrome", () => {
  const layout = read("app/layout.tsx");
  const routeChrome = read("components/site/route-chrome.tsx");

  assert.match(layout, /import\s+\{\s*RouteChrome\s*\}\s+from\s+"@\/components\/site\/route-chrome"/u);
  assert.match(layout, /<RouteChrome>\s*\{children\}\s*<\/RouteChrome>/u);
  assert.doesNotMatch(layout, /<SiteHeader\s*\/>|<SiteFooter\s*\/>|<MobileActionBar\s*\/>/u);

  assert.match(routeChrome, /^"use client";/u);
  assert.match(routeChrome, /usePathname\(\)/u);
  assert.match(
    routeChrome,
    /pathname\s*===\s*["']\/admin["']\s*\|\|\s*pathname\.startsWith\(["']\/admin\/["']\)/u,
  );
  assert.match(routeChrome, /<SiteHeader\s*\/>/u);
  assert.match(routeChrome, /<SiteFooter\s*\/>/u);
  assert.match(routeChrome, /<MobileActionBar\s*\/>/u);
});

test("admin layout publishes Korean noindex nofollow metadata", () => {
  const source = read("app/admin/layout.tsx");

  assert.match(source, /export const metadata:\s*Metadata/u);
  assert.match(source, /title:\s*["'][^"']*[가-힣][^"']*["']/u);
  assert.match(source, /robots:\s*\{[\s\S]*index:\s*false,[\s\S]*follow:\s*false/u);
});

test("login page has natural Korean copy and an accessible server-action form", () => {
  const source = read("app/admin/login/page.tsx");

  assert.match(source, /useActionState/u);
  assert.match(source, /action=\{formAction\}/u);
  assert.match(source, /name="password"/u);
  assert.match(source, /type="password"/u);
  assert.match(source, /autoComplete="current-password"/u);
  assert.match(source, /required/u);
  assert.match(source, /name="next"/u);
  assert.match(source, /type="hidden"/u);
  assert.match(source, /<button[^>]*type="submit"/u);
  assert.match(source, /[가-힣]/u);
  assert.doesNotMatch(source, /ADMIN_PASSWORD_HASH|ADMIN_SESSION_SECRET|createAdminSession|verifyAdminPassword/u);
});

test("login action fails generically and redirects only after setting the signed scoped cookie", () => {
  const source = read("app/admin/login/actions.ts");
  const genericMessage = "비밀번호를 확인해 주세요.";

  assert.match(source, /^"use server";/u);
  assert.match(source, /verifyAdminPassword/u);
  assert.match(source, /createAdminSession/u);
  assert.match(source, /sanitizeAdminNext/u);
  assert.match(source, /ADMIN_COOKIE_NAME/u);
  assert.match(source, /adminCookieOptions/u);
  assert.match(source, /process\.env\.ADMIN_PASSWORD_HASH/u);
  assert.match(source, /process\.env\.ADMIN_SESSION_SECRET/u);
  assert.match(source, /typeof password !== "string"/u);
  assert.match(source, /await cookies\(\)/u);
  assert.match(source, /cookieStore\.set\(ADMIN_COOKIE_NAME, token, adminCookieOptions\)/u);
  assert.match(source, /redirect\(sanitizeAdminNext\(next\)\)/u);
  assert.equal(source.split(genericMessage).length - 1, 1);
  assert.doesNotMatch(source, /console\.(?:log|info|warn|error|debug)/u);

  const catchIndex = source.indexOf("catch");
  const redirectIndex = source.indexOf("redirect(sanitizeAdminNext(next))");
  assert.ok(catchIndex >= 0, "auth/config/cookie failures must be caught");
  assert.ok(redirectIndex > catchIndex, "redirect must remain outside the catch boundary");
});

test("logout expires exactly the admin cookie and returns a same-origin 303", () => {
  const source = read("app/admin/logout/route.ts");

  assert.match(source, /ADMIN_COOKIE_NAME/u);
  assert.match(source, /adminCookieOptions/u);
  assert.match(source, /await cookies\(\)/u);
  assert.match(source, /maxAge:\s*0/u);
  assert.match(source, /new URL\(["']\/admin\/login["'],\s*request\.url\)/u);
  assert.match(source, /status:\s*303/u);
  assert.doesNotMatch(source, /searchParams|get\(["']next["']\)/u);
  assert.equal(source.split(/\.set\(/u).length - 1, 1);
});

test("admin styles keep controls touch-sized, responsive, and visibly focused", () => {
  const source = read("app/admin/admin.module.css");

  assert.match(source, /min-height:\s*48px/u);
  assert.match(source, /:focus-visible/u);
  assert.match(source, /@media\s*\([^)]*390px/u);
  assert.match(source, /var\(--(?:hanji|ink|line|muted|red|paper|white)\)/u);
});
