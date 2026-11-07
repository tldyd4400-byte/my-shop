import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import { FAQ_ITEMS, GROUP_FAQ_ITEMS, GROUP_STORY_FAQ_ITEMS, MENU_CATEGORIES, MENU_ITEMS, REVIEW_FAQ_ITEMS, STORE } from "../lib/content/store.ts";
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

test("group story schema uses the same V5 direct answers shown on screen", () => {
  const page = read("app/stories/[slug]/page.tsx");
  assert.match(page, /if \(slug === "cheongju-group-dining"\) return GROUP_STORY_FAQ_ITEMS/);
  assert.match(page, /faqSchema\(faqs\)/);
  const schema = faqSchema(GROUP_STORY_FAQ_ITEMS);
  assert.deepEqual(
    schema.mainEntity.map((item) => [item.name, item.acceptedAnswer.text]),
    GROUP_STORY_FAQ_ITEMS.map((item) => [item.question, item.answer]),
  );
});

test("reviews route renders and serializes the same central FAQ set", () => {
  const page = read("app/reviews/page.tsx");
  assert.match(page, /<FaqList items=\{REVIEW_FAQ_ITEMS\} openAll \/>/);
  assert.match(page, /faqSchema\(REVIEW_FAQ_ITEMS\)/);
  assert.equal(faqSchema(REVIEW_FAQ_ITEMS).mainEntity.length, REVIEW_FAQ_ITEMS.length);
});

test("FAQ route publishes its complete visible question set exactly once in schema", () => {
  const page = read("app/faq/page.tsx");
  assert.match(page, /const allFaqs = \[\.\.\.FAQ_ITEMS, \.\.\.GROUP_FAQ_ITEMS\]/);
  assert.match(page, /items=\{FAQ_ITEMS\.slice\(0, 4\)\}/);
  assert.match(page, /items=\{FAQ_ITEMS\.slice\(4\)\}/);
  assert.match(page, /items=\{GROUP_FAQ_ITEMS\}/);
  assert.match(page, /faqSchema\(allFaqs\)/);
  const questions = faqSchema([...FAQ_ITEMS, ...GROUP_FAQ_ITEMS]).mainEntity.map((item) => item.name);
  assert.equal(new Set(questions).size, questions.length, "duplicate questions in /faq schema");
  assert.equal(questions.filter((question) => question === "한 팀 몇 명까지 이용할 수 있나요?").length, 1);
});

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

test("schema factories use central facts without publishing the display-only rating snapshot", () => {
  const website = websiteSchema();
  const restaurant = restaurantSchema();

  assert.equal(website["@type"], "WebSite");
  assert.equal(website.url, STORE.url);
  assert.equal(restaurant["@type"], "Restaurant");
  assert.equal(restaurant["@id"], `${STORE.url}/#restaurant`);
  assert.equal(website.publisher["@id"], restaurant["@id"]);
  assert.equal(restaurant.name, STORE.fullName);
  assert.equal(restaurant.telephone, STORE.phoneDisplay);
  assert.deepEqual(restaurant.sameAs, [STORE.placeUrl]);
  assert.deepEqual(restaurant.address, {
    "@type": "PostalAddress",
    ...STORE.postalAddress,
  });
  assert.equal(restaurant.mainEntityOfPage, STORE.url);
  assert.equal("geo" in restaurant, false);
  assert.equal("postalCode" in restaurant.address, false);
  assert.equal(restaurant.maximumAttendeeCapacity, 52);
  assert.deepEqual(restaurant.servesCuisine, ["한식", "갈비찜", "등갈비찜"]);
  assert.deepEqual(
    restaurant.amenityFeature.map((item) => item.name),
    ["단체 이용", "통대관", "무료주차", "유아의자", "휠체어 이용 가능"],
  );
  assert.equal(restaurant.hasMenu.hasMenuSection.length, MENU_CATEGORIES.length);
  assert.equal(
    restaurant.hasMenu.hasMenuSection.flatMap((section) => section.hasMenuItem).length,
    MENU_ITEMS.length,
  );
  assert.equal(restaurant.hasMenu.hasMenuSection[0].hasMenuItem[0].offers.price, "19900");
  assert.equal(JSON.stringify(restaurant).includes("AggregateRating"), false);
  assert.doesNotMatch(JSON.stringify(restaurant), /"@type":"Review"/);
  assert.doesNotMatch(JSON.stringify(restaurant), /aggregateRating|ratingValue|reviewCount/);
});

test("restaurant menu sections preserve category content and numeric KRW prices", () => {
  const restaurant = restaurantSchema();

  assert.deepEqual(
    restaurant.hasMenu.hasMenuSection,
    MENU_CATEGORIES.map((category) => ({
      "@type": "MenuSection",
      name: category.label,
      description: category.description,
      hasMenuItem: MENU_ITEMS.filter((item) => item.category === category.id).map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: String(item.priceAmount),
          priceCurrency: "KRW",
        },
      })),
    })),
  );
});

test("restaurant amenities publish central private-hire and accessibility facts", () => {
  const { amenityFeature } = restaurantSchema();

  assert.equal(amenityFeature.find((item) => item.name === "통대관").description, STORE.privateHire);
  assert.equal(
    amenityFeature.find((item) => item.name === "휠체어 이용 가능")?.description,
    STORE.accessibility.join(" · "),
  );
  assert.ok(amenityFeature.every((item) => item["@type"] === "LocationFeatureSpecification" && item.value === true));
});

function restaurantWithStoreChange(change) {
  function evaluate(path, source, imports) {
    const { outputText } = ts.transpileModule(source, {
      fileName: path,
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    });
    const exports = {};
    new Function("require", "exports", outputText)(imports, exports);
    return exports;
  }
  const path = "lib/content/store.ts";
  const original = read(path);
  const changed = change(original);
  assert.notEqual(changed, original, "fixture must change central data");
  const content = evaluate(path, changed, (id) => assert.fail(`unexpected dependency ${id}`));
  const schemaPath = "lib/seo/schema.ts";
  const schema = evaluate(schemaPath, read(schemaPath), (id) => {
    assert.equal(id, "../content/store.ts");
    return content;
  });
  const { amenityFeature } = JSON.parse(JSON.stringify(schema.restaurantSchema()));
  return { content, amenities: amenityFeature };
}

test("restaurant JSON-LD omits free parking when the visible central fee is paid", () => {
  const { content, amenities } = restaurantWithStoreChange((source) =>
    source.replace(/^const parkingFee[^=]*= "무료";/m, 'const parkingFee = "유료";'),
  );
  assert.equal(content.GROUP_PARKING_FACTS.summary, "유료 주차");
  assert.match(content.STORE.parking, /유료 지상주차장/);
  assert.match(content.HOME_FAQ_ITEMS.find(({ question }) => question.startsWith("주차와 예약")).answer, /유료 지상주차장/);
  assert.ok(!amenities.some(({ name }) => name === "무료주차"), "paid parking must not publish a free-parking claim");
});

test("restaurant JSON-LD omits high chair when central family facilities no longer list it", () => {
  const { content, amenities } = restaurantWithStoreChange((source) =>
    source.replace(/^  familyFacilities: .*,$/m, '  familyFacilities: ["어린이밥"],'),
  );
  const family = content.VISIT_INTENT_ITEMS.find(({ id }) => id === "family-dining").summary;
  assert.match(family, /어린이밥/);
  assert.doesNotMatch(family, /유아의자/);
  assert.ok(!amenities.some(({ name }) => name === "유아의자"), "removed high chair must not appear as an amenity");
});

test("restaurant JSON-LD omits wheelchair amenity when only unrelated access is listed", () => {
  const { content, amenities } = restaurantWithStoreChange((source) =>
    source.replace(/^  accessibility: .*,$/m, '  accessibility: ["점자 안내판"],'),
  );
  const family = content.VISIT_INTENT_ITEMS.find(({ id }) => id === "family-dining").summary;
  assert.match(family, /점자 안내판/);
  assert.doesNotMatch(family, /휠체어 이용 가능/);
  assert.ok(!amenities.some(({ name }) => name === "휠체어 이용 가능"), "unrelated access must not imply wheelchair access");
});

test("restaurant JSON-LD names only the verified wheelchair features in mixed access data", () => {
  const { content, amenities } = restaurantWithStoreChange((source) =>
    source.replace(/^  accessibility: .*,$/m, '  accessibility: ["휠체어 이용 가능 출입구", "점자 안내판"],'),
  );
  assert.deepEqual(
    amenities.find(({ name }) => name === "휠체어 이용 가능"),
    {
      "@type": "LocationFeatureSpecification",
      name: "휠체어 이용 가능",
      value: true,
      description: content.STORE.accessibility[0],
    },
  );
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
    [1, 2, 3, 4, 5, 6],
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
  assert.doesNotMatch(schema, /AggregateRating|aggregateRating|ratingValue|reviewCount|REVIEW_SNAPSHOT/);
  assert.match(jsonLd, /JSON\.stringify\(data\)\.replace\(\/<\/g, "\\\\u003c"\)/);
});
