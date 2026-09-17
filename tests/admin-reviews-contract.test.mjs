import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("review admin page authenticates before loading moderation data", () => {
  const source = read("app/admin/reviews/page.tsx");

  assert.match(source, /export const dynamic\s*=\s*["']force-dynamic["']/u);
  assert.match(source, /await cookies\(\)/u);
  assert.match(source, /process\.env\.ADMIN_SESSION_SECRET/u);
  assert.match(source, /ADMIN_COOKIE_NAME/u);
  assert.match(source, /verifyAdminSession/u);
  assert.match(source, /redirect\(["']\/admin\/login\?next=%2Fadmin%2Freviews["']\)/u);
  assert.match(source, /await loadOnlineReviewDashboard\(\)/u);
  assert.match(source, /OnlineReviewsDashboard/u);
  assert.match(source, /후기 정보를 불러오지 못했습니다\. 잠시 후 다시 확인해 주세요\./u);
  assert.doesNotMatch(source, /REVIEWS_DATABASE_URL|ADMIN_PASSWORD_HASH|console\./u);

  const verifyIndex = source.indexOf("verifyAdminSession(");
  const loadIndex = source.indexOf("await loadOnlineReviewDashboard()");
  assert.ok(verifyIndex >= 0 && loadIndex > verifyIndex);
});

test("review moderation action reauthenticates, restricts states, and revalidates public pages", () => {
  const source = read("app/admin/reviews/actions.ts");

  assert.match(source, /^"use server";/u);
  assert.match(source, /await cookies\(\)/u);
  assert.match(source, /verifyAdminSession/u);
  assert.match(source, /moderateOnlineReview/u);
  assert.match(source, /formData\.get\(["']sourceUrl["']\)/u);
  assert.match(source, /formData\.get\(["']status["']\)/u);
  assert.match(source, /new Set[^;]+approved[^;]+rejected[^;]+pending/su);
  assert.match(source, /revalidatePath\(["']\/["']\)/u);
  assert.match(source, /revalidatePath\(["']\/reviews["']\)/u);
  assert.match(source, /revalidatePath\(["']\/admin\/reviews["']\)/u);
  assert.doesNotMatch(source, /console\.|REVIEWS_DATABASE_URL|NAVER_API_HUB/u);

  const verifyIndex = source.indexOf("verifyAdminSession(");
  const moderateIndex = source.indexOf("await moderateOnlineReview(");
  assert.ok(verifyIndex >= 0 && moderateIndex > verifyIndex);
});

test("review dashboard exposes complete source evidence and moderation controls", () => {
  const source = read("components/admin/online-reviews-dashboard.tsx");

  for (const copy of [
    "후기 승인 관리",
    "승인 대기",
    "홈페이지 공개 중",
    "마지막 자동 수집",
    "수집일",
    "수집 성공",
    "수집 실패",
    "네이버 블로그",
    "원문 확인",
    "홈페이지 공개",
    "제외",
    "공개 중지",
    "자동 수집은 하루 1회",
    "승인 전에는 공개되지 않습니다.",
  ]) {
    assert.ok(source.includes(copy), `dashboard must include: ${copy}`);
  }

  assert.match(source, /action=\{moderateOnlineReviewAction\}/u);
  assert.match(source, /name="sourceUrl"/u);
  assert.match(source, /name="status"/u);
  assert.match(source, /target="_blank"/u);
  assert.match(source, /rel="noreferrer"/u);
  assert.match(source, /href="\/admin\/ai-visits"/u);
  assert.match(source, /href="\/admin\/logout"/u);
  assert.match(source, /timeZone:\s*["']Asia\/Seoul["']/u);
  assert.match(source, /review\.discoveredAt/u);
  assert.match(source, /dashboard\.counts\.pending/u);
  assert.match(source, /dashboard\.counts\.approved/u);
  assert.doesNotMatch(source, /cookies|process\.env|verifyAdminSession|database|REVIEWS_DATABASE_URL/u);
});

test("admin styles keep review cards responsive and actions touch-sized", () => {
  const source = read("app/admin/admin.module.css");

  assert.match(source, /\.reviewSummaryGrid/u);
  assert.match(source, /\.reviewList/u);
  assert.match(source, /\.reviewCard/u);
  assert.match(source, /\.reviewActions/u);
  assert.match(source, /\.reviewAction[^}]*min-height:\s*48px/su);
  assert.match(source, /@media\s*\(max-width:\s*390px\)[\s\S]*\.reviewSummaryGrid[\s\S]*grid-template-columns:\s*1fr/u);
  assert.match(source, /@media\s*\(max-width:\s*390px\)[\s\S]*\.reviewActions[\s\S]*grid-template-columns:\s*1fr/u);
});

test("AI dashboard links to review moderation", () => {
  const source = read("components/admin/ai-visits-dashboard.tsx");
  assert.match(source, /href="\/admin\/reviews"/u);
  assert.match(source, /후기 승인 관리/u);
});
