import type { OnlineReviewCandidate } from "./types.ts";

const STORE_NAME = "어믜뜰";
const NAVER_BLOG_HOST = "blog.naver.com";
const TITLE_MAX_LENGTH = 500;
const DESCRIPTION_MAX_LENGTH = 2_000;
const BLOGGER_NAME_MAX_LENGTH = 200;
const BLOGGER_URL_MAX_LENGTH = 2_048;

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  quot: '"',
};

function decodeEntity(entity: string): string {
  if (entity.startsWith("#x") || entity.startsWith("#X")) {
    const codePoint = Number.parseInt(entity.slice(2), 16);
    return safeCodePoint(codePoint, `&${entity};`);
  }

  if (entity.startsWith("#")) {
    const codePoint = Number.parseInt(entity.slice(1), 10);
    return safeCodePoint(codePoint, `&${entity};`);
  }

  return NAMED_ENTITIES[entity] ?? `&${entity};`;
}

function safeCodePoint(codePoint: number, fallback: string): string {
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return fallback;
  }

  return String.fromCodePoint(codePoint);
}

function safeText(value: string, maxLength: number): string {
  const withoutTags = value.replace(/<[^>]*>/gu, "");
  const decoded = withoutTags.replace(
    /&(#(?:x|X)[0-9a-fA-F]+|#[0-9]+|amp|apos|gt|lt|quot);/gu,
    (_match, entity: string) => decodeEntity(entity),
  );
  return decoded.replace(/\s+/gu, " ").trim().slice(0, maxLength);
}

function normalizePostUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== NAVER_BLOG_HOST ||
    url.username !== "" ||
    url.password !== ""
  ) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/u, "");
}

function normalizeBloggerUrl(value: string): string | null {
  const candidate = value.startsWith("https://") ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== NAVER_BLOG_HOST ||
    url.username !== "" ||
    url.password !== "" ||
    url.pathname.split("/").filter(Boolean).length < 1
  ) {
    return null;
  }

  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/u, "").slice(0, BLOGGER_URL_MAX_LENGTH);
}

function normalizePostDate(value: string): string | null {
  const match = /^(\d{4})(\d{2})(\d{2})$/u.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function normalizeDiscoveredAt(value: string): string | null {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString();
}

export function normalizeNaverBlogItem(
  value: unknown,
  discoveredAtValue: string,
): OnlineReviewCandidate | null {
  if (value === null || typeof value !== "object") return null;

  try {
    const candidate = value as Record<string, unknown>;
    const titleValue = candidate.title;
    const linkValue = candidate.link;
    const descriptionValue = candidate.description;
    const bloggerNameValue = candidate.bloggername;
    const bloggerUrlValue = candidate.bloggerlink;
    const postDateValue = candidate.postdate;

    if (
      typeof titleValue !== "string" ||
      typeof linkValue !== "string" ||
      typeof descriptionValue !== "string" ||
      typeof bloggerNameValue !== "string" ||
      typeof bloggerUrlValue !== "string" ||
      typeof postDateValue !== "string" ||
      typeof discoveredAtValue !== "string"
    ) {
      return null;
    }

    const title = safeText(titleValue, TITLE_MAX_LENGTH);
    const description = safeText(descriptionValue, DESCRIPTION_MAX_LENGTH);
    const bloggerName = safeText(bloggerNameValue, BLOGGER_NAME_MAX_LENGTH);
    const sourceUrl = normalizePostUrl(linkValue);
    const bloggerUrl = normalizeBloggerUrl(bloggerUrlValue);
    const publishedOn = normalizePostDate(postDateValue);
    const discoveredAt = normalizeDiscoveredAt(discoveredAtValue);

    if (
      title.length === 0 ||
      description.length === 0 ||
      bloggerName.length === 0 ||
      sourceUrl === null ||
      bloggerUrl === null ||
      publishedOn === null ||
      discoveredAt === null ||
      (!title.includes(STORE_NAME) && !description.includes(STORE_NAME))
    ) {
      return null;
    }

    return {
      sourceUrl,
      title,
      description,
      bloggerName,
      bloggerUrl,
      publishedOn,
      discoveredAt,
    };
  } catch {
    return null;
  }
}

export function dedupeOnlineReviewCandidates(
  values: readonly (OnlineReviewCandidate | null | undefined)[],
): OnlineReviewCandidate[] {
  const seen = new Set<string>();
  const results: OnlineReviewCandidate[] = [];

  for (const value of values) {
    if (value === null || value === undefined || seen.has(value.sourceUrl)) {
      continue;
    }
    seen.add(value.sourceUrl);
    results.push(value);
  }

  return results;
}
