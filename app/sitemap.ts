import type { MetadataRoute } from "next";

import { STORIES } from "@/lib/content/stories";
import { STORE } from "@/lib/content/store";

const STATIC_PAGES = [
  { path: "", modifiedAt: "2026-10-24" },
  { path: "/menu", modifiedAt: "2026-10-23" },
  { path: "/store", modifiedAt: "2026-10-23" },
  { path: "/location", modifiedAt: "2026-10-23" },
  { path: "/faq", modifiedAt: "2026-10-23" },
  { path: "/reviews", modifiedAt: "2026-10-24" },
  { path: "/stories", modifiedAt: "2026-10-23" },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_PAGES.map((page) => ({
      url: `${STORE.url}${page.path}`,
      lastModified: new Date(`${page.modifiedAt}T00:00:00+09:00`),
    })),
    ...STORIES.map((story) => ({
      url: `${STORE.url}/stories/${story.slug}`,
      lastModified: new Date(`${story.modifiedAt}T00:00:00+09:00`),
    })),
  ];
}
