import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const runtimeBaseUrl = process.env.ADMIN_RUNTIME_BASE_URL;

const chromeClasses = ["site-header", "site-footer", "mobile-actions"];

const assertNoCustomerChrome = (html, path) => {
  for (const className of chromeClasses) {
    assert.doesNotMatch(
      html,
      new RegExp(`class=["'][^"']*${className}`, "u"),
      `${path} must not render .${className}`,
    );
  }
};

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

test("admin optional catch-all keeps unmatched paths inside the admin segment", () => {
  const source = read("app/admin/[[...adminPath]]/page.tsx");

  assert.match(source, /import\s+\{\s*notFound\s*\}\s+from\s+["']next\/navigation["']/u);
  assert.match(source, /notFound\(\)/u);
  assert.doesNotMatch(source, /redirect|permanentRedirect/u);
});

test("admin not-found renders an accessible natural Korean explanation", () => {
  const source = read("app/admin/not-found.tsx");

  assert.match(source, /<main/u);
  assert.match(source, /<h1[^>]*>[\s\S]*[가-힣][\s\S]*<\/h1>/u);
  assert.match(source, /관리자 페이지를 찾을 수 없습니다\./u);
  assert.match(source, /주소를 확인한 뒤 다시 시도해 주세요\./u);
});

test(
  "production admin fallbacks return contained 404s without changing specific or public routes",
  { skip: runtimeBaseUrl ? false : "set ADMIN_RUNTIME_BASE_URL to a production Next server" },
  async () => {
    for (const path of [
      "/admin",
      "/admin/nope",
      "/admin/login/nope",
      "/admin/logout/nope",
    ]) {
      const response = await fetch(`${runtimeBaseUrl}${path}`, { redirect: "manual" });
      const html = await response.text();

      assert.equal(response.status, 404, `${path} must return 404`);
      assertNoCustomerChrome(html, path);
      assert.match(html, /관리자 페이지를 찾을 수 없습니다\./u);
      assert.match(
        html,
        /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*nofollow[^"']*["']/u,
        `${path} must publish noindex,nofollow`,
      );
    }

    assert.equal((await fetch(`${runtimeBaseUrl}/admin/login`)).status, 200);
    assert.equal(
      (await fetch(`${runtimeBaseUrl}/admin/logout`, { redirect: "manual" })).status,
      303,
    );

    const publicResponse = await fetch(`${runtimeBaseUrl}/public-nope`);
    const publicHtml = await publicResponse.text();
    assert.equal(publicResponse.status, 404);
    for (const className of chromeClasses) {
      assert.match(publicHtml, new RegExp(`class=["'][^"']*${className}`, "u"));
    }
  },
);

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

test("AI visits page authenticates before loading data and contains failures", () => {
  const source = read("app/admin/ai-visits/page.tsx");

  assert.match(source, /export const dynamic\s*=\s*["']force-dynamic["']/u);
  assert.match(source, /await cookies\(\)/u);
  assert.match(source, /process\.env\.ADMIN_SESSION_SECRET/u);
  assert.match(source, /ADMIN_COOKIE_NAME/u);
  assert.match(source, /verifyAdminSession/u);
  assert.match(source, /redirect\(["']\/admin\/login\?next=%2Fadmin%2Fai-visits["']\)/u);
  assert.match(source, /const now = new Date\(\)/u);
  assert.match(source, /loadAiVisitRows\(now\)/u);
  assert.match(source, /summarizeAiVisits\(rows, now\)/u);
  assert.match(source, /방문 통계를 불러오지 못했습니다\. 잠시 후 다시 확인해 주세요\./u);
  assert.doesNotMatch(source, /AI_VISITS_DATABASE_URL|ADMIN_PASSWORD_HASH|console\.(?:log|info|error|debug)/u);

  const verifyIndex = source.indexOf("verifyAdminSession(");
  const loadIndex = source.indexOf("loadAiVisitRows(now)");
  assert.ok(verifyIndex >= 0 && loadIndex > verifyIndex, "session verification must precede the DB query");
});

test("AI visits dashboard is a pure summary view with complete desktop and mobile information", () => {
  const source = read("components/admin/ai-visits-dashboard.tsx");

  for (const copy of [
    "AI 어시스턴트별 방문",
    "최근 30일 · 직전 30일 대비",
    "전체 AI/크롤러 방문 수",
    "검색 인덱싱 방문 수",
    "학습 방문 수",
    "실시간 인용 방문 수",
    "봇 이름",
    "회사/vendor",
    "목적 라벨",
    "방문 수",
    "최근 방문 시간",
    "가장 많이 본 페이지",
    "변화",
    "검색 인덱싱: 검색 결과나 AI 검색에 보여줄 후보 페이지를 찾는 방문",
    "학습: 모델 학습·지식 수집 목적의 방문",
    "실시간 인용: 사용자가 AI에게 질문했을 때 답변·출처 확인을 위해 들어오는 방문",
    "아직 기록된 AI/크롤러 방문이 없습니다. 공개 페이지에 봇 방문이 기록되면 이곳에 표시됩니다.",
  ]) {
    assert.ok(source.includes(copy), `dashboard must include: ${copy}`);
  }

  assert.match(source, /AiVisitSummary/u);
  assert.match(source, /styles\.desktopTable/u);
  assert.match(source, /styles\.mobileCards/u);
  assert.match(source, /<caption/u);
  assert.match(source, /scope="col"/u);
  assert.match(source, /<time\s+dateTime=\{bot\.lastVisitedAt\}/u);
  assert.match(source, /timeZone:\s*["']Asia\/Seoul["']/u);
  assert.match(source, /href="\/admin\/logout"/u);
  assert.doesNotMatch(source, /cookies|process\.env|verifyAdminSession|repository|database|loadAiVisitRows|userAgent/i);

  for (const field of ["botName", "vendor", "purpose", "count", "lastVisitedAt", "topPath", "change"]) {
    assert.ok(source.split(`bot.${field}`).length >= 3, `desktop and mobile must both render ${field}`);
  }
});

test("AI visits dashboard styles contain arbitrary long table and mobile values", () => {
  const source = read("app/admin/admin.module.css");

  assert.match(
    source,
    /\.desktopTable th,\s*\.desktopTable td\s*\{[^}]*min-width:\s*0;[^}]*overflow-wrap:\s*anywhere;/u,
    "desktop bot names, vendors, purposes, and values must wrap inside table cells",
  );
  assert.match(
    source,
    /\.botCard,\s*\.botCard h3,\s*\.botCard dl,\s*\.botCard dl > div,\s*\.botCard dt,\s*\.botCard dd,\s*\.purposeGrid article,\s*\.purposeGrid p\s*\{[^}]*min-width:\s*0;[^}]*overflow-wrap:\s*anywhere;/u,
    "mobile headings, labels, values, and purpose cards must contain unbroken text",
  );
  assert.match(source, /\.pathCell\s*\{[^}]*overflow-wrap:\s*anywhere;/u, "path wrapping must remain intact");
});

test("AI visits dashboard styles switch complete cards and table at 390px", () => {
  const source = read("app/admin/admin.module.css");

  assert.match(source, /\.desktopTable/u);
  assert.match(source, /\.mobileCards/u);
  assert.match(source, /@media\s*\(max-width:\s*390px\)[\s\S]*\.desktopTable[\s\S]*display:\s*none/u);
  assert.match(source, /@media\s*\(max-width:\s*390px\)[\s\S]*\.mobileCards[\s\S]*display:\s*grid/u);
  assert.match(source, /\.logoutLink[\s\S]*min-height:\s*48px/u);
  assert.match(source, /\.logoutLink:focus-visible/u);
});
