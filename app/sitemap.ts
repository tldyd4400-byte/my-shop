import type { MetadataRoute } from "next";

import { STORIES } from "@/lib/content/stories";
import { STORE } from "@/lib/content/store";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-07-19T00:00:00+09:00");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = ["", "/menu", "/store", "/location", "/faq", "/reviews", "/stories"];

  return [
    ...staticPaths.map((path) => ({
      url: `${STORE.url}${path}`,
      lastModified: LAST_SIGNIFICANT_UPDATE,
    })),
    ...STORIES.map((story) => ({
      url: `${STORE.url}/stories/${story.slug}`,
      lastModified: new Date(`${story.modifiedAt}T00:00:00+09:00`),
    })),
  ];
}
