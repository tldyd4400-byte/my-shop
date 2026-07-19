import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const asset = (path) => new URL(`../public/${path}`, import.meta.url);
const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const ffprobeFallback = String.raw`C:\Users\ksgoe\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffprobe.exe`;

function resolveFfprobe() {
  const candidates = [
    ["FFPROBE_PATH", process.env.FFPROBE_PATH?.trim()],
    ["PATH", "ffprobe"],
    ["WinGet fallback", ffprobeFallback],
  ];
  const attempts = [];

  for (const [sourceName, command] of candidates) {
    if (!command) continue;
    const result = spawnSync(command, ["-version"], {
      encoding: "utf8",
      windowsHide: true,
    });

    if (result.status === 0) return command;
    attempts.push(`${sourceName}: ${result.error?.code ?? result.status}`);
  }

  assert.fail(`ffprobe is unavailable (${attempts.join(", ")})`);
}

function probeMedia(path) {
  const result = spawnSync(
    resolveFfprobe(),
    [
      "-v",
      "error",
      "-show_entries",
      "stream=codec_name,codec_type,width,height",
      "-of",
      "json",
      fileURLToPath(asset(path)),
    ],
    { encoding: "utf8", windowsHide: true },
  );

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return JSON.parse(result.stdout);
}

function extractCssBlock(css, atRulePattern) {
  const match = atRulePattern.exec(css);
  assert.ok(match, `Missing CSS at-rule: ${atRulePattern}`);

  const blockStart = css.indexOf("{", match.index);
  assert.ok(blockStart >= 0, "CSS at-rule has no opening brace");

  let depth = 0;
  for (let index = blockStart; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) {
      return {
        body: css.slice(blockStart + 1, index),
        end: index + 1,
        start: match.index,
      };
    }
  }

  assert.fail("CSS at-rule has no closing brace");
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

function topLevelMp4Atoms(bytes) {
  const atoms = [];
  let offset = 0;

  while (offset + 8 <= bytes.length) {
    const size32 = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const headerSize = size32 === 1 ? 16 : 8;
    const atomSize =
      size32 === 0
        ? bytes.length - offset
        : size32 === 1
          ? Number(bytes.readBigUInt64BE(offset + 8))
          : size32;

    assert.ok(atomSize >= headerSize, `invalid ${type} atom size ${atomSize}`);
    assert.ok(offset + atomSize <= bytes.length, `${type} atom exceeds file`);
    atoms.push({ offset, type });
    offset += atomSize;
  }

  assert.equal(offset, bytes.length, "MP4 has trailing bytes outside top-level atoms");
  return atoms;
}

test("approved step and map assets exist", () => {
  for (const path of [
    "images/eomeuittul/step-1-ribs.png",
    "images/eomeuittul/step-2-selfbar.jpg",
    "images/eomeuittul/step-4-bingsu.png",
    "images/eomeuittul/naver-map-location.png",
    "media/eomeuittul/hero-brand-720p.mp4",
    "media/eomeuittul/step-3-shabu-720p.mp4",
  ]) {
    assert.equal(existsSync(asset(path)), true, path);
  }
});

test("hero video stays within the approved budget", () => {
  assert.ok(
    statSync(asset("media/eomeuittul/hero-brand-720p.mp4")).size <=
      12 * 1024 * 1024,
  );
});

test("published videos are H.264 at 720px high with no audio", () => {
  for (const path of [
    "media/eomeuittul/hero-brand-720p.mp4",
    "media/eomeuittul/step-3-shabu-720p.mp4",
  ]) {
    const metadata = probeMedia(path);
    const videoStreams = metadata.streams.filter(
      (stream) => stream.codec_type === "video",
    );
    const audioStreams = metadata.streams.filter(
      (stream) => stream.codec_type === "audio",
    );

    assert.equal(videoStreams.length, 1, path);
    assert.equal(videoStreams[0].codec_name, "h264", path);
    assert.equal(videoStreams[0].height, 720, path);
    assert.equal(audioStreams.length, 0, path);
  }
});

test("hero video is faststart with moov before mdat", () => {
  const bytes = readFileSync(asset("media/eomeuittul/hero-brand-720p.mp4"));
  const atoms = topLevelMp4Atoms(bytes);
  const moov = atoms.find((atom) => atom.type === "moov")?.offset;
  const mdat = atoms.find((atom) => atom.type === "mdat")?.offset;

  assert.notEqual(moov, undefined, "hero is missing moov atom");
  assert.notEqual(mdat, undefined, "hero is missing mdat atom");
  assert.ok(moov < mdat, `expected moov (${moov}) before mdat (${mdat})`);
});

test("published media directory contains no oversized MP4", () => {
  const mediaDirectory = fileURLToPath(
    new URL("../public/media/", import.meta.url),
  );
  const mp4Files = listFiles(mediaDirectory).filter((path) =>
    path.toLowerCase().endsWith(".mp4"),
  );

  assert.ok(mp4Files.length > 0, "published media directory has no MP4 files");
  for (const path of mp4Files) {
    assert.ok(
      statSync(path).size <= 12 * 1024 * 1024,
      `${path} exceeds the 12 MiB published-media ceiling`,
    );
  }
});

test("published JPEG assets contain no EXIF block", () => {
  const bytes = readFileSync(
    asset("images/eomeuittul/step-2-selfbar.jpg"),
  );
  assert.equal(bytes.includes(Buffer.from("Exif\0\0", "latin1")), false);
});

test("shared visual component modules exist", () => {
  for (const name of [
    "hero-media",
    "experience-steps",
    "proof-strip",
    "reservation-cta",
    "location-panel",
    "faq-list",
    "story-card",
  ]) {
    assert.equal(
      existsSync(
        new URL(`../components/site/${name}.tsx`, import.meta.url),
      ),
      true,
      name,
    );
  }
});

test("hero keeps its poster image beneath accessible autoplay video", () => {
  const hero = source("components/site/hero-media.tsx");
  const imageIndex = hero.indexOf("<Image");
  const videoIndex = hero.indexOf("<video");

  assert.ok(imageIndex >= 0 && videoIndex > imageIndex);
  assert.match(hero, /autoPlay/);
  assert.match(hero, /muted/);
  assert.match(hero, /loop/);
  assert.match(hero, /playsInline/);
  assert.match(hero, /poster=\{image\}/);
  assert.match(hero, /aria-label=\{imageAlt\}/);
  assert.doesNotMatch(hero, /<video[^>]*\scontrols(?:\s|=|>)/s);
});

test("reduced-motion visitors see the persistent hero poster instead", () => {
  const styles = source("app/globals.css");
  const reducedMotion = extractCssBlock(
    styles,
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/,
  );
  const outsideReducedMotion =
    styles.slice(0, reducedMotion.start) + styles.slice(reducedMotion.end);

  assert.match(
    reducedMotion.body,
    /\.hero-background video\s*\{\s*display:\s*none;/,
  );
  assert.doesNotMatch(
    outsideReducedMotion,
    /\.hero-background video\s*\{\s*display:\s*none;/,
  );
});

test("experience step video has native controls and content-provided alt text", () => {
  const steps = source("components/site/experience-steps.tsx");

  assert.match(steps, /DINING_STEPS/);
  assert.match(steps, /<video[^>]*\scontrols(?:\s|=|>)/s);
  assert.match(steps, /aria-label=\{step\.alt\}/);
  assert.match(steps, /alt=\{step\.alt\}/);
});

test("shared content sections consume central content and analytics exports", () => {
  const reservation = source("components/site/reservation-cta.tsx");
  const location = source("components/site/location-panel.tsx");
  const faq = source("components/site/faq-list.tsx");
  const story = source("components/site/story-card.tsx");

  assert.match(reservation, /STORE\.bookingUrl/);
  assert.match(reservation, /AnalyticsLink/);
  assert.match(location, /STORE\.directionsUrl/);
  assert.match(location, /naver-map-location\.png/);
  assert.match(faq, /FaqItem/);
  assert.match(story, /Story/);
  assert.match(story, /story\.imageAlt/);
});

test("location panel derives opening periods and closure from STORE", () => {
  const location = source("components/site/location-panel.tsx");
  const store = source("lib/content/store.ts");

  assert.match(location, /STORE\.openingPeriods\.map/);
  assert.match(location, /STORE\.openingPeriods\.flatMap/);
  assert.match(location, /!openDays\.has/);
  assert.match(location, /정기휴무/);
  assert.doesNotMatch(location, /일요일\s*정기휴무/);
  assert.doesNotMatch(location, /11:00~22:00/);
  assert.match(store, /days:\s*\["Saturday",\s*"Sunday"\]/);
  assert.doesNotMatch(store, /days:\s*\[[^\]]*"Monday"/);
});
