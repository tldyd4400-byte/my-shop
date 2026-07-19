export type OpeningPeriod = {
  label: string;
  days: readonly string[];
  opens: string;
  closes: string;
};

export type StoreInfo = {
  name: string;
  fullName: string;
  url: string;
  phoneDisplay: string;
  phoneHref: string;
  address: string;
  parking: string;
  seats: string;
  placeUrl: string;
  bookingUrl: string;
  directionsUrl: string;
  image: string;
  openingPeriods: readonly OpeningPeriod[];
};

export type MenuItem = {
  slug: "spicy" | "soy";
  name: string;
  price: string;
  description: string;
  includes: string;
  image: string;
  imageAlt: string;
};

export type FaqItem = { question: string; answer: string };
export type ReviewItem = {
  title: string;
  summary: string;
  sourceLabel: string;
  sourceUrl: string;
  checkedAt: string;
};
export type DiningStep = {
  number: string;
  title: string;
  body: string;
  media: string;
  mediaType: "image" | "video";
  alt: string;
};
export type StorySection = {
  heading: string;
  body: string;
  image?: string;
  imageAlt?: string;
};
export type Story = {
  slug: string;
  title: string;
  description: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  modifiedAt: string;
  image: string;
  imageAlt: string;
  sections: readonly StorySection[];
};
