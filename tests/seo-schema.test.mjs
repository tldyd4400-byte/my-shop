import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { FAQ_ITEMS, MENU_ITEMS, STORE } from "../lib/content/store.ts";
import { STORIES } from "../lib/content/stories.ts";
import { createPageMetadata } from "../lib/seo/metadata.ts";
import {
  articleSchema,
  breadcrumbSchema,
  collectionPageSchema,
  faqSchema,
  restaurantSchema,
  websiteSchema,
} from "../lib/seo/schema.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("createPageMetadata returns canonical Korean Open Graph metadata", () => {
  const metadata = createPageMetadata({
    title: "Menu | Eomeutteull",
    description: "Our menu",
    path: "/menu",
  });

  assert.equal(metadata.metadataBase?.href, `${STORE.url}/`);
  assert.deepEqual(metadata.title, { absolute: "Menu | Eomeutteull" });
  assert.deepEqual(metadata.alternates, { canonical: "/menu" });
  assert.deepEqual(metadata.openGraph, {
    type: "website",
    locale: "ko_KR",
    url: "/menu",
    siteName: STORE.name,
    title: "Menu | Eomeutteull",
    description: "Our menu",
    images: [{ url: STORE.image, alt: "Menu | Eomeutteull" }],
  });
});

test("schema factories use central facts and avoid unverified ratings", () => {
  const website = websiteSchema();
  const restaurant = restaurantSchema();

  assert.equal(website["@type"], "WebSite");
  assert.equal(website.url, STORE.url);
  assert.equal(restaurant["@type"], "Restaurant");
  assert.equal(restaurant.name, STORE.fullName);
  assert.equal(restaurant.telephone, STORE.phoneDisplay);
  assert.deepEqual(restaurant.sameAs, [STORE.placeUrl]);
  assert.equal(restaurant.hasMenu.hasMenuSection.hasMenuItem.length, MENU_ITEMS.length);
  assert.equal(restaurant.hasMenu.hasMenuSection.hasMenuItem[0].offers.price, "19900");
  assert.equal(JSON.stringify(restaurant).includes("AggregateRating"), false);
});

test("breadcrumb, FAQ, and article schemas serialize supplied central content", () => {
  const crumbs = breadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Stories", path: "/stories" },
  ]);
  const faqs = faqSchema([FAQ_ITEMS[1]]);
  const article = articleSchema(STORIES[0]);

  assert.deepEqual(crumbs.itemListElement.map((item) => item.position), [1, 2]);
  assert.equal(crumbs.itemListElement[1].item, `${STORE.url}/stories`);
  assert.equal(faqs.mainEntity.length, 1);
  assert.equal(faqs.mainEntity[0].name, FAQ_ITEMS[1].question);
  assert.equal(article["@type"], "Article");
  assert.equal(article.headline, STORIES[0].title);
  assert.equal(article.mainEntityOfPage, `${STORE.url}/stories/${STORIES[0].slug}`);
});

test("collection page schema serializes the central story listing", () => {
  const collection = collectionPageSchema({
    name: "어믜뜰 이야기",
    description: "등갈비찜 이야기",
    path: "/stories",
    items: STORIES,
  });

  assert.equal(collection["@type"], "CollectionPage");
  assert.equal(collection.url, `${STORE.url}/stories`);
  assert.equal(collection.mainEntity["@type"], "ItemList");
  assert.deepEqual(
    collection.mainEntity.itemListElement.map((item) => item.position),
    [1, 2, 3, 4],
  );
  assert.equal(
    collection.mainEntity.itemListElement[0].url,
    `${STORE.url}/stories/${STORIES[0].slug}`,
  );
  assert.equal(
    JSON.stringify(collection).includes("AggregateRating"),
    false,
  );
});

test("SEO helpers contain only approved schema types and JsonLd escapes HTML delimiters", () => {
  const metadata = read("lib/seo/metadata.ts");
  const schema = read("lib/seo/schema.ts");
  const jsonLd = read("components/seo/json-ld.tsx");

  assert.match(metadata, /metadataBase/);
  assert.match(metadata, /alternates/);
  assert.match(metadata, /openGraph/);
  for (const type of [
    "WebSite",
    "Restaurant",
    "BreadcrumbList",
    "FAQPage",
    "Article",
    "CollectionPage",
  ]) {
    assert.match(schema, new RegExp(type));
  }
  assert.doesNotMatch(schema, /AggregateRating/);
  assert.match(jsonLd, /JSON\.stringify\(data\)\.replace\(\/<\/g, "\\\\u003c"\)/);
});
