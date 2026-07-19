import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

const asset = (path) => new URL(`../public/${path}`, import.meta.url);
const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

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

function findOversizedMp4s(directory, maximumBytes) {
  return listFiles(directory).filter(
    (path) =>
      path.toLowerCase().endsWith(".mp4") &&
      statSync(path).size > maximumBytes,
  );
}

function parseMp4Boxes(bytes, start = 0, end = bytes.length) {
  const boxes = [];
  let offset = start;

  while (offset + 8 <= end) {
    const size32 = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const headerSize = size32 === 1 ? 16 : 8;
    assert.ok(offset + headerSize <= end, `${type} box header exceeds parent`);

    const extendedSize =
      size32 === 1 ? bytes.readBigUInt64BE(offset + 8) : undefined;
    assert.ok(
      extendedSize === undefined ||
        extendedSize <= BigInt(Number.MAX_SAFE_INTEGER),
      `${type} box is too large to inspect safely`,
    );
    const boxSize =
      size32 === 0
        ? end - offset
        : size32 === 1
          ? Number(extendedSize)
          : size32;

    assert.ok(boxSize >= headerSize, `invalid ${type} box size ${boxSize}`);
    assert.ok(offset + boxSize <= end, `${type} box exceeds parent`);
    boxes.push({
      dataStart: offset + headerSize,
      end: offset + boxSize,
      offset,
      size: boxSize,
      type,
    });
    offset += boxSize;
  }

  assert.equal(offset, end, "MP4 box region contains trailing bytes");
  return boxes;
}

function requireChildBox(bytes, parent, type) {
  const box = parseMp4Boxes(bytes, parent.dataStart, parent.end).find(
    (candidate) => candidate.type === type,
  );
  assert.ok(box, `${parent.type} is missing ${type}`);
  return box;
}

function readTrackHandler(bytes, track) {
  const media = requireChildBox(bytes, track, "mdia");
  const handler = requireChildBox(bytes, media, "hdlr");
  assert.ok(handler.dataStart + 12 <= handler.end, "hdlr payload is truncated");
  return bytes.toString("ascii", handler.dataStart + 8, handler.dataStart + 12);
}

function readTrackHeight(bytes, track) {
  const header = requireChildBox(bytes, track, "tkhd");
  const version = bytes.readUInt8(header.dataStart);
  assert.ok(
    version === 0 || version === 1,
    `unsupported tkhd version ${version}`,
  );

  const heightOffset = header.dataStart + (version === 1 ? 92 : 80);
  assert.ok(heightOffset + 4 <= header.end, "tkhd dimensions are truncated");
  return bytes.readUInt32BE(heightOffset) / 65_536;
}

function readVideoSampleEntries(bytes, track) {
  const media = requireChildBox(bytes, track, "mdia");
  const mediaInfo = requireChildBox(bytes, media, "minf");
  const sampleTable = requireChildBox(bytes, mediaInfo, "stbl");
  const sampleDescription = requireChildBox(bytes, sampleTable, "stsd");
  assert.ok(
    sampleDescription.dataStart + 8 <= sampleDescription.end,
    "stsd payload is truncated",
  );

  const entryCount = bytes.readUInt32BE(sampleDescription.dataStart + 4);
  const entries = parseMp4Boxes(
    bytes,
    sampleDescription.dataStart + 8,
    sampleDescription.end,
  );
  assert.equal(entries.length, entryCount, "stsd entry count does not match");
  return entries.map((entry) => {
    assert.ok(
      entry.dataStart + 28 <= entry.end,
      `${entry.type} visual sample entry is truncated`,
    );
    return {
      height: bytes.readUInt16BE(entry.dataStart + 26),
      type: entry.type,
      width: bytes.readUInt16BE(entry.dataStart + 24),
    };
  });
}

function inspectMp4Tracks(path) {
  const bytes = readFileSync(asset(path));
  const moov = parseMp4Boxes(bytes).find((box) => box.type === "moov");
  assert.ok(moov, `${path} is missing moov`);

  return parseMp4Boxes(bytes, moov.dataStart, moov.end)
    .filter((box) => box.type === "trak")
    .map((track) => {
      const handler = readTrackHandler(bytes, track);
      return {
        handler,
        height: handler === "vide" ? readTrackHeight(bytes, track) : undefined,
        sampleEntries:
          handler === "vide" ? readVideoSampleEntries(bytes, track) : [],
      };
    });
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

test("hero poster is a dedicated web-sized WebP", () => {
  const poster = asset("images/eomeuittul/hero-poster.webp");

  assert.equal(existsSync(poster), true);
  assert.ok(statSync(poster).size <= 700 * 1024);
  const bytes = readFileSync(poster);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
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
    const tracks = inspectMp4Tracks(path);
    const videoTracks = tracks.filter((track) => track.handler === "vide");
    const audioTracks = tracks.filter((track) => track.handler === "soun");

    assert.equal(videoTracks.length, 1, path);
    assert.equal(audioTracks.length, 0, path);
    assert.equal(videoTracks[0].height, 720, path);
    assert.ok(videoTracks[0].sampleEntries.length > 0, path);
    assert.ok(
      videoTracks[0].sampleEntries.every((entry) => entry.width > 0),
      `${path}: encoded sample width is missing`,
    );
    assert.ok(
      videoTracks[0].sampleEntries.every(
        (entry) => entry.height === 720,
      ),
      `${path}: encoded sample height is not 720`,
    );
    assert.ok(
      videoTracks[0].sampleEntries.every(
        (entry) => entry.type === "avc1" || entry.type === "avc3",
      ),
      `${path}: encoded sample entry is not AVC`,
    );
  }
});

test("hero video is faststart with moov before mdat", () => {
  const bytes = readFileSync(asset("media/eomeuittul/hero-brand-720p.mp4"));
  const boxes = parseMp4Boxes(bytes);
  const moov = boxes.find((box) => box.type === "moov")?.offset;
  const mdat = boxes.find((box) => box.type === "mdat")?.offset;

  assert.notEqual(moov, undefined, "hero is missing moov atom");
  assert.notEqual(mdat, undefined, "hero is missing mdat atom");
  assert.ok(moov < mdat, `expected moov (${moov}) before mdat (${mdat})`);
});

test("published public tree contains no oversized MP4", () => {
  const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));
  const mp4Files = listFiles(publicDirectory).filter((path) =>
    path.toLowerCase().endsWith(".mp4"),
  );

  assert.ok(mp4Files.length > 0, "published public tree has no MP4 files");
  assert.deepEqual(findOversizedMp4s(publicDirectory, 12 * 1024 * 1024), []);
});

test("oversized scan catches an MP4 outside a media directory", (context) => {
  const fixture = mkdtempSync(join(tmpdir(), "media-contract-"));
  context.after(() => rmSync(fixture, { force: true, recursive: true }));

  const nestedDirectory = join(fixture, "images", "raw-source");
  const oversizedFile = join(nestedDirectory, "hero.mp4");
  mkdirSync(nestedDirectory, { recursive: true });
  writeFileSync(oversizedFile, Buffer.alloc(5));

  assert.deepEqual(findOversizedMp4s(fixture, 4), [oversizedFile]);
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
