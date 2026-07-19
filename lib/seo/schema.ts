import { FAQ_ITEMS, MENU_ITEMS, STORE } from "../content/store.ts";
import type { FaqItem, Story } from "../content/types.ts";

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${STORE.url}/#website`,
    name: STORE.name,
    url: STORE.url,
    inLanguage: "ko-KR",
    publisher: { "@id": `${STORE.url}/#restaurant` },
  };
}

export function restaurantSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${STORE.url}/#restaurant`,
    name: STORE.fullName,
    alternateName: STORE.name,
    url: STORE.url,
    telephone: STORE.phoneDisplay,
    image: [`${STORE.url}${STORE.image}`],
    sameAs: [STORE.placeUrl],
    servesCuisine: ["Korean", "Braised ribs"],
    acceptsReservations: true,
    address: {
      "@type": "PostalAddress",
      streetAddress: STORE.address,
      addressCountry: "KR",
    },
    openingHoursSpecification: STORE.openingPeriods.map((period) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: period.days,
      opens: period.opens,
      closes: period.closes,
    })),
    menu: `${STORE.url}/menu`,
    hasMenu: {
      "@type": "Menu",
      hasMenuSection: {
        "@type": "MenuSection",
        name: "Menu",
        hasMenuItem: MENU_ITEMS.map((item) => ({
          "@type": "MenuItem",
          name: item.name,
          description: item.description,
          offers: {
            "@type": "Offer",
            price: item.price.replace(/[^0-9]/g, ""),
            priceCurrency: "KRW",
          },
        })),
      },
    },
  };
}

export function breadcrumbSchema(
  items: readonly { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${STORE.url}${item.path}`,
    })),
  };
}

export function faqSchema(items: readonly FaqItem[] = FAQ_ITEMS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function collectionPageSchema(input: {
  name: string;
  description: string;
  path: string;
  items: readonly Story[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: `${STORE.url}${input.path}`,
    inLanguage: "ko-KR",
    isPartOf: { "@id": `${STORE.url}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: input.items.map((story, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: story.title,
        url: `${STORE.url}/stories/${story.slug}`,
      })),
    },
  };
}

export function articleSchema(story: Story) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: story.title,
    description: story.description,
    image: `${STORE.url}${story.image}`,
    datePublished: story.publishedAt,
    dateModified: story.modifiedAt,
    author: { "@type": "Organization", name: STORE.name },
    publisher: { "@id": `${STORE.url}/#restaurant` },
    mainEntityOfPage: `${STORE.url}/stories/${story.slug}`,
  };
}
