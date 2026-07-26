import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("../", import.meta.url);
const rootPath = decodeURIComponent(root.pathname).replace(/^\/(?:([A-Za-z]):)/u, "$1:");
const fingerprintFile = join(rootPath, ".next", "public-visible-terms-source.sha256");
const publicHtmlRoot = join(rootPath, ".next", "server", "app");
const excludedDirectories = new Set([".git", ".next", ".superpowers", "node_modules", "public"]);
const buildInputs = new Set([".js", ".mjs", ".ts", ".tsx", ".json", ".css"]);

function walk(directory, predicate) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path, predicate));
    else if (predicate(path)) files.push(path);
  }
  return files.sort();
}

function sourceFingerprint() {
  const hash = createHash("sha256");
  for (const path of walk(rootPath, (candidate) => buildInputs.has(candidate.slice(candidate.lastIndexOf("."))))) {
    hash.update(relative(rootPath, path).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function ensureCurrentBuild() {
  const fingerprint = sourceFingerprint();
  const recorded = existsSync(fingerprintFile) ? readFileSync(fingerprintFile, "utf8").trim() : "";
  if (!existsSync(publicHtmlRoot) || recorded !== fingerprint) {
    const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
    const buildCommand = process.platform === "win32" ? process.execPath : "npm";
    const buildArguments = process.platform === "win32" ? [npmCli, "run", "build"] : ["run", "build"];
    const build = spawnSync(buildCommand, buildArguments, {
      cwd: rootPath,
      encoding: "utf8",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    });
    assert.equal(build.status, 0, `fresh public render build failed:\n${build.stdout}\n${build.stderr}`);
    writeFileSync(fingerprintFile, `${fingerprint}\n`, "utf8");
  }
}

function decodeCommonEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"' };
  return value
    .replace(/&(#(?:x[0-9a-f]+|\d+)|amp|apos|gt|lt|nbsp|quot);/giu, (entity, code) => {
      if (code[0] !== "#") return named[code.toLowerCase()];
      const number = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(number) && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
    });
}

function visibleText(html) {
  return decodeCommonEntities(
    html
      .replace(/<!--[\s\S]*?-->/gu, " ")
      .replace(/<(head|script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/giu, " ")
      .replace(/<[^>]+>/gu, " "),
  ).replace(/\s+/gu, " ").trim();
}

const forbidden = [
  ["SEO", /(^|[^A-Za-z0-9_])SEO(?![A-Za-z0-9_])/iu],
  ["GEO", /(^|[^A-Za-z0-9_])GEO(?![A-Za-z0-9_])/iu],
  ["LLM", /(^|[^A-Za-z0-9_])LLM(?![A-Za-z0-9_])/iu],
  ["JSON-LD", /(^|[^A-Za-z0-9_])JSON-LD(?![A-Za-z0-9_])/iu],
  ["schema.org", /(^|[^A-Za-z0-9_])schema\.org(?![A-Za-z0-9_])/iu],
  ["구조화 데이터", /구조화\s+데이터/iu],
];

test("visible-text extraction ignores metadata, code, comments, tags, and URL attributes", () => {
  const html = '<head><title>SEO</title></head><!-- GEO --><style>.LLM{}</style><script>"JSON-LD"</script><a href="https://schema.org">손님 안내 &amp; 예약</a>';
  assert.equal(visibleText(html), "손님 안내 & 예약");
});

test("forbidden matchers are case-insensitive phrases without identifier false positives", () => {
  for (const [term, pattern] of forbidden) {
    assert.match(`손님 ${term.toLowerCase()} 안내`, pattern);
  }
  assert.doesNotMatch("geography seoul llms seoPlus", forbidden[0][1]);
  assert.doesNotMatch("geography seoul llms seoPlus", forbidden[1][1]);
  assert.doesNotMatch("geography seoul llms seoPlus", forbidden[2][1]);
});

test("current rendered public customer text contains no forbidden developer terms", () => {
  ensureCurrentBuild();
  const htmlFiles = walk(publicHtmlRoot, (path) => path.endsWith(".html") && !relative(publicHtmlRoot, path).split(/[\\/]/u).includes("admin"));
  assert.ok(htmlFiles.length > 0, "a fresh build must produce public HTML");

  for (const path of htmlFiles) {
    const text = visibleText(readFileSync(path, "utf8"));
    for (const [term, pattern] of forbidden) {
      assert.doesNotMatch(text, pattern, `${relative(publicHtmlRoot, path)} exposes ${term} in visible customer text`);
    }
  }
});