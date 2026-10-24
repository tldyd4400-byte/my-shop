import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { FAQ_ITEMS, GROUP_FAQ_ITEMS, MENU_ITEMS, STORE } from "../lib/content/store.ts";

const rootPath = fileURLToPath(new URL("../", import.meta.url));
const requiredPublicRoutes = ["/", "/menu", "/store", "/location", "/faq", "/reviews", "/stories"];
const excludedTopLevelEntries = new Set([
  ".git",
  ".next",
  ".superpowers",
  ".turbo",
  ".vercel",
  "coverage",
  "dist",
  "node_modules",
]);
const sensitiveFileName = /^(?:\.env(?:\..*)?|\.npmrc|\.yarnrc(?:\.yml)?|.*(?:credential|credentials|secret).*)$/iu;
const sensitiveFileExtension = /\.(?:key|p12|pem|pfx)$/iu;

function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else files.push(path);
  }
  return files.sort();
}

function shouldCopySource(source) {
  const sourceRelative = relative(rootPath, source);
  if (sourceRelative === "") return true;
  const firstEntry = sourceRelative.split(sep)[0];
  if (excludedTopLevelEntries.has(firstEntry)) return false;
  const name = basename(source);
  return !sensitiveFileName.test(name) && !sensitiveFileExtension.test(name);
}

function safeBuildEnvironment() {
  const safeNames = new Set([
    "COMSPEC",
    "HOME",
    "HOMEDRIVE",
    "HOMEPATH",
    "LOCALAPPDATA",
    "PATH",
    "PATHEXT",
    "SYSTEMDRIVE",
    "SYSTEMROOT",
    "TEMP",
    "TMP",
    "TMPDIR",
    "USERPROFILE",
    "WINDIR",
  ]);
  const env = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value !== undefined && safeNames.has(name.toUpperCase())) env[name] = value;
  }
  return {
    ...env,
    CI: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    NODE_ENV: "production",
  };
}

function boundedBuildOutput(build) {
  const output = `${build.stdout ?? ""}\n${build.stderr ?? ""}`.trim();
  const limit = 20_000;
  return output.length <= limit ? output : `${output.slice(0, limit)}\n...[build output truncated]`;
}

function withFreshBuild(inspect) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "public-visible-terms-"));
  const projectPath = join(temporaryRoot, "project");
  try {
    cpSync(rootPath, projectPath, { recursive: true, filter: shouldCopySource });
    const installedModules = join(rootPath, "node_modules");
    assert.ok(existsSync(installedModules), "existing node_modules is required; this guard never installs packages");
    symlinkSync(installedModules, join(projectPath, "node_modules"), process.platform === "win32" ? "junction" : "dir");

    const nextCli = join(installedModules, "next", "dist", "bin", "next");
    assert.ok(existsSync(nextCli), "installed Next CLI must exist");
    const startedAt = Date.now();
    const build = spawnSync(process.execPath, [nextCli, "build", "--webpack"], {
      cwd: projectPath,
      encoding: "utf8",
      env: safeBuildEnvironment(),
      maxBuffer: 4 * 1024 * 1024,
      timeout: 240_000,
      windowsHide: true,
    });
    const buildOutput = boundedBuildOutput(build);
    assert.ifError(build.error);
    assert.equal(build.status, 0, `fresh isolated public render build failed:\n${buildOutput}`);

    return inspect({
      appOutput: join(projectPath, ".next", "server", "app"),
      buildOutput,
      durationMs: Date.now() - startedAt,
      projectPath,
      temporaryRoot,
    });
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
    assert.equal(existsSync(temporaryRoot), false, `temporary build directory was not removed: ${temporaryRoot}`);
  }
}

function decodeCommonEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    copy: "©",
    gt: ">",
    hellip: "…",
    lt: "<",
    mdash: "—",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    reg: "®",
  };
  return value.replace(
    /&(#(?:x[0-9a-f]+|\d+)|amp|apos|copy|gt|hellip|lt|mdash|nbsp|ndash|quot|reg);/giu,
    (entity, code) => {
      if (code[0] !== "#") return named[code.toLowerCase()];
      const number = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(number) && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
    },
  );
}

const textBoundaryTags = new Set([
  "address", "article", "aside", "blockquote", "br", "dd", "div", "dl", "dt", "fieldset",
  "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
  "hr", "li", "main", "nav", "ol", "p", "pre", "section", "table", "tbody", "td", "tfoot",
  "th", "thead", "tr", "ul",
]);

function visibleText(html) {
  const withoutHiddenContent = html
    .replace(/<(head|script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, " ")
    .replace(/<!--[\s\S]*?-->/gu, "");
  const withoutMarkup = withoutHiddenContent.replace(/<\/?([A-Za-z][\w:-]*)\b[^>]*>/gu, (tag, name) =>
    textBoundaryTags.has(name.toLowerCase()) ? " " : "",
  );
  return decodeCommonEntities(withoutMarkup).replace(/\s+/gu, " ").trim();
}

const forbidden = [
  ["SEO", /(^|[^A-Za-z0-9_])SEO(?![A-Za-z0-9_])/iu],
  ["GEO", /(^|[^A-Za-z0-9_])GEO(?![A-Za-z0-9_])/iu],
  ["LLM", /(^|[^A-Za-z0-9_])LLM(?![A-Za-z0-9_])/iu],
  ["JSON-LD", /(^|[^A-Za-z0-9_])JSON-LD(?![A-Za-z0-9_])/iu],
  ["schema.org", /(^|[^A-Za-z0-9_])schema\.org(?![A-Za-z0-9_])/iu],
  ["구조화 데이터", /구조화\s+데이터/iu],
];

function parseSitemapPaths(xml) {
  const paths = [];
  for (const match of xml.matchAll(/<loc\b[^>]*>([\s\S]*?)<\/loc>/giu)) {
    const path = new URL(decodeCommonEntities(match[1].trim())).pathname;
    paths.push(path === "/" ? path : path.replace(/\/+$/u, ""));
  }
  return paths;
}

function routeArtifactCandidates(appOutput, routePath) {
  if (routePath === "/") return [join(appOutput, "index.html")];
  const relativeRoute = routePath.replace(/^\/+|\/+$/gu, "");
  return [join(appOutput, `${relativeRoute}.html`), join(appOutput, relativeRoute, "index.html")];
}

function locateSitemap(appOutput) {
  const candidates = walkFiles(appOutput).filter((path) =>
    relative(appOutput, path).replaceAll("\\", "/").includes("sitemap.xml") && path.endsWith(".body"),
  );
  assert.ok(candidates.length > 0, "fresh build must generate the sitemap body");
  return candidates.sort((left, right) => left.length - right.length)[0];
}

test("visible-text extraction ignores metadata, non-rendered blocks, comments, tags, and URL attributes", () => {
  const html = '<head><title>SEO</title></head><!-- GEO --><style>.LLM{}</style><script>"JSON-LD"</script><template>SEO</template><noscript>GEO</noscript><a href="https://schema.org">손님 안내 &amp; 예약</a>';
  assert.equal(visibleText(html), "손님 안내 & 예약");
});

test("visible-text extraction preserves forbidden terms across inline markup", () => {
  assert.equal(visibleText("<p>S<strong>E</strong>O</p>"), "SEO");
  assert.match(visibleText("<p>S<strong>E</strong>O</p>"), forbidden[0][1]);
});

test("visible-text extraction preserves forbidden terms across comments", () => {
  assert.equal(visibleText("<p>S<!--x-->EO</p>"), "SEO");
  assert.match(visibleText("<p>S<!--x-->EO</p>"), forbidden[0][1]);
});

test("visible-text extraction inserts boundaries for blocks and line breaks only", () => {
  assert.equal(visibleText("<section><p>SE</p><p>O</p><div>A<br>B</div></section>"), "SE O A B");
  assert.doesNotMatch(visibleText("<p>SE</p><p>O</p>"), forbidden[0][1]);
});

test("visible-text extraction decodes named, decimal, and hexadecimal entities without breaking continuity", () => {
  assert.equal(visibleText("<p>JSON&#45;LD schema&#x2e;org A&amp;B</p>"), "JSON-LD schema.org A&B");
  assert.match(visibleText("<p>JSON&#45;LD</p>"), forbidden[3][1]);
  assert.match(visibleText("<p>schema&#x2e;org</p>"), forbidden[4][1]);
});

test("forbidden matchers are case-insensitive phrases without identifier false positives", () => {
  for (const [term, pattern] of forbidden) {
    assert.match(`손님 ${term.toLowerCase()} 안내`, pattern);
  }
  for (const identifier of ["geography", "llms", "seoPlus", "myJSON-LDValue", "schema.organic"]) {
    for (const [, pattern] of forbidden.slice(0, 5)) assert.doesNotMatch(identifier, pattern);
  }
});

test("guard never reuses rendered output and owns an isolated temporary build", () => {
  const source = readFileSync(new URL(import.meta.url), "utf8");
  assert.doesNotMatch(source, new RegExp(["finger", "print"].join(""), "iu"));
  assert.match(source, /mkdtempSync/u);
  assert.match(source, /cpSync/u);
  assert.match(source, /rmSync/u);
});

test("sitemap paths drive complete route-to-artifact coverage", () => {
  const paths = parseSitemapPaths(`<?xml version="1.0"?><urlset>
    <url><loc>https://example.test/</loc></url>
    <url><loc>https://example.test/menu</loc></url>
    <url><loc>https://example.test/stories/a-story</loc></url>
  </urlset>`);
  assert.deepEqual(paths, ["/", "/menu", "/stories/a-story"]);
  assert.equal(routeArtifactCandidates("C:/build/app", "/")[0], join("C:/build/app", "index.html"));
  assert.equal(routeArtifactCandidates("C:/build/app", "/menu")[0], join("C:/build/app", "menu.html"));
});

test("fresh sitemap routes have rendered public HTML with no forbidden developer terms", { timeout: 260_000 }, () => {
  let removedTemporaryRoot;
  withFreshBuild(({ appOutput, buildOutput, durationMs, temporaryRoot }) => {
    removedTemporaryRoot = temporaryRoot;
    assert.ok(existsSync(appOutput), `fresh build must produce app artifacts:\n${buildOutput}`);

    const sitemapPath = locateSitemap(appOutput);
    const sitemapPaths = parseSitemapPaths(readFileSync(sitemapPath, "utf8"));
    assert.ok(sitemapPaths.length > 0, "generated sitemap must contain public routes");
    assert.ok(sitemapPaths.includes("/stories/cheongju-group-dining"));
    assert.equal(new Set(sitemapPaths).size, sitemapPaths.length, "generated sitemap routes must be unique");
    assert.equal(sitemapPaths.some((path) => path === "/admin" || path.startsWith("/admin/")), false, "sitemap must not contain admin routes");
    for (const route of requiredPublicRoutes) {
      assert.ok(sitemapPaths.includes(route), `generated sitemap is missing required public route ${route}`);
    }

    for (const route of sitemapPaths) {
      const candidates = routeArtifactCandidates(appOutput, route);
      const htmlPath = candidates.find(existsSync);
      assert.ok(htmlPath, `sitemap route ${route} has no generated HTML artifact; checked ${candidates.join(", ")}`);
      const html = readFileSync(htmlPath, "utf8");
      const text = visibleText(html);
      assert.equal((html.match(/<h1\b/gu) ?? []).length, 1, `${route} needs exactly one H1`);
      if (route === "/") {
        for (const fact of [
          "매운·간장 등갈비찜 세트 1인 19,900원 · 2인 이상 · 최대 52명 단체 이용과 통대관 상담 · 무료 주차",
          "52명 모임 상담",
          "메뉴 17개 최신 가격",
          "11:00~22:00 · 15:30~16:30 브레이크타임",
          "11:00~22:00 · 브레이크타임 없음",
        ]) assert.ok(text.includes(fact), `home preserves approved copy: ${fact}`);
      }
      if (route === "/menu") {
        for (const fact of ["매운·간장 세트 19,900원", "대표 세트 2인 이상"]) {
          assert.ok(text.includes(fact), `menu preserves approved copy: ${fact}`);
        }
      }
      if (route === "/stories/cheongju-group-dining" || route === "/faq") {
        const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gu)].flatMap((match) => JSON.parse(match[1]));
        const faq = schemas.find((item) => item["@type"] === "FAQPage");
        assert.ok(faq, `${route} needs FAQ schema`);
        if (route === "/faq") {
          const questions = [...FAQ_ITEMS, ...GROUP_FAQ_ITEMS].map((item) => item.question);
          assert.equal(new Set(questions).size, questions.length, "/faq content questions must be unique");
          assert.deepEqual(faq.mainEntity.map((item) => item.name), questions);
          const renderedQuestions = [...html.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/gu)]
            .map((match) => visibleText(match[1]));
          assert.deepEqual(renderedQuestions, questions, "/faq UI and schema must publish the same questions once");
        }
        for (const item of GROUP_FAQ_ITEMS) {
          assert.ok(text.includes(item.question));
          assert.ok(text.includes(item.answer));
          assert.ok(faq.mainEntity.some((entry) => entry.name === item.question && entry.acceptedAnswer.text === item.answer));
        }
      }
      if (route === "/stories/cheongju-group-dining") {
        assert.ok(html.includes(`href="${STORE.phoneHref}"`));
        assert.ok(text.includes("한 팀 최대 52명"));
        assert.ok(text.includes("최종 확정"));
        assert.ok(text.includes("사전 협의"));
        assert.ok(text.includes("콜키지 무료"));
        assert.ok(text.includes("주류 주문은 필수가 아닙니다"));
        assert.ok(text.includes("네이버에서 예약하기"));
        assert.ok(text.includes("설·추석 당일"));
        assert.ok(text.includes("2026-10-24 수정"));
        const heroActions = html.match(/<div class="hero-actions">([\s\S]*?)<\/div>/u)?.[1];
        assert.ok(heroActions, "group story needs visible hero actions");
        assert.ok(heroActions.includes(`href="${STORE.phoneHref}"`));
        assert.ok(heroActions.includes(`href="${STORE.bookingUrl.replaceAll("&", "&amp;")}"`));
        const groupMenu = html.match(/<div class="menu-grid group-menu-grid">([\s\S]*?)<\/div>/u)?.[1];
        assert.ok(groupMenu, "group story needs representative menu cards");
        assert.equal((groupMenu.match(/<article\b/gu) ?? []).length, 2);
        const menuText = visibleText(groupMenu);
        for (const item of MENU_ITEMS.filter((item) => item.category === "set")) {
          assert.ok(menuText.includes(item.name));
          assert.ok(menuText.includes(item.price));
          assert.ok(menuText.includes(`${item.minimumOrder}인 이상 주문`));
        }
        assert.equal((menuText.match(/2인 이상 주문/gu) ?? []).length, 2);
      }
      if (route === "/stories/family-dining-guide") {
        for (const fact of ["어린이밥", "유아의자", "휠체어", "출입구", "좌석", "화장실", "설·추석 당일", "2026-10-23 수정"]) {
          assert.ok(text.includes(fact), fact);
        }
      }
      for (const [term, pattern] of forbidden) {
        assert.doesNotMatch(text, pattern, `${route} exposes ${term} in visible customer text`);
      }
    }
    assert.ok(durationMs >= 0, "fresh build duration must be recorded");
  });
  assert.ok(removedTemporaryRoot, "fresh build must allocate an isolated temporary root");
  assert.equal(existsSync(removedTemporaryRoot), false, "fresh build temporary root must be cleaned after scanning");
});
