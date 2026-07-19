import type { MetadataRoute } from "next";

import { STORE } from "@/lib/content/store";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${STORE.url}/sitemap.xml`,
    host: STORE.url,
  };
}
