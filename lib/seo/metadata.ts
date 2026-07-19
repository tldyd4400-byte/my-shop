import type { Metadata } from "next";

import { STORE } from "../content/store.ts";

type MetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
};

export function createPageMetadata(input: MetadataInput): Metadata {
  const image = input.image ?? STORE.image;

  return {
    metadataBase: new URL(STORE.url),
    title: { absolute: input.title },
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      type: input.type ?? "website",
      locale: "ko_KR",
      url: input.path,
      siteName: STORE.name,
      title: input.title,
      description: input.description,
      images: [{ url: image, alt: input.title }],
    },
  };
}
