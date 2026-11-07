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
  postalAddress: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    addressCountry: "KR";
  };
  parking: string;
  seats: string;
  maxGroupSize: number;
  groupBooking: string;
  privateHire: string;
  privateHireMinimum: string;
  groupParking: string;
  groupConsultation: readonly string[];
  corkage: string;
  lastOrder: string;
  regularClosure: string;
  holidayClosure: string;
  accessibility: readonly string[];
  familyFacilities: readonly string[];
  placeUrl: string;
  reviewUrl: string;
  bookingUrl: string;
  directionsUrl: string;
  image: string;
  openingPeriods: readonly OpeningPeriod[];
  verifiedAt: string;
  verificationSource: string;
};

export type MenuCategoryId = "set" | "side" | "extra" | "takeout";

export type MenuCategory = {
  id: MenuCategoryId;
  label: string;
  description: string;
};

export type MenuItem = {
  slug: string;
  category: MenuCategoryId;
  name: string;
  price: string;
  priceAmount: number;
  description: string;
  includes: string;
  minimumOrder?: number;
  badge?: string;
  image: string;
  imageAlt: string;
};

export type ReviewSnapshot = {
  rating: number;
  ratingCount: number;
  participants: number;
  visitorReviewCount: number;
  blogReviewCount: number;
  totalDisplayedReviewCount: number;
  checkedAt: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type FaqItem = { question: string; answer: string };

export type VisitIntentId =
  | "first-visit"
  | "family-dining"
  | "group-dining";

export type VisitIntentItem = {
  id: VisitIntentId;
  number: "01" | "02" | "03";
  label: string;
  title: string;
  summary: string;
  href: string;
  ctaLabel: string;
  placement: string;
  featured?: boolean;
};

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
