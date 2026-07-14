import type { MetadataRoute } from "next";

import { SITE } from "@/lib/site-content";

const LAST_SIGNIFICANT_UPDATE = new Date("2026-07-14T00:00:00+09:00");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: LAST_SIGNIFICANT_UPDATE,
    },
  ];
}
