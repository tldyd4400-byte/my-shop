import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const asset = (path) => new URL(`../public/${path}`, import.meta.url);
const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

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

  assert.match(
    styles,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.hero-background video\s*\{\s*display:\s*none;/,
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
