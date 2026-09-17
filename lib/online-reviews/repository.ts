import { query as databaseQuery } from "./database.ts";
import type { ReviewQueryExecutor } from "./database.ts";
import type {
  OnlineReview,
  OnlineReviewCandidate,
  OnlineReviewStatus,
  OnlineReviewSyncRun,
  OnlineReviewSyncStatus,
} from "./types.ts";

export type OnlineReviewDashboard = {
  pending: OnlineReview[];
  approved: OnlineReview[];
  rejected: OnlineReview[];
  lastRun: OnlineReviewSyncRun | null;
};

const REVIEW_STATUSES: readonly OnlineReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
];
const FINISHED_SYNC_STATUSES: readonly OnlineReviewSyncStatus[] = [
  "success",
  "failed",
];

const INSERT_PENDING_REVIEW_SQL = `
  insert into online_reviews
    (source_url, title, description, blogger_name, blogger_url,
     published_on, discovered_at, status)
  values ($1, $2, $3, $4, $5, $6, $7, $8)
  on conflict (source_url) do nothing
  returning source_url
`;

const REVIEW_COLUMNS = `
  source_url, title, description, blogger_name, blogger_url,
  published_on, discovered_at, status, moderated_at
`;

const LOAD_APPROVED_REVIEWS_SQL = `
  select ${REVIEW_COLUMNS}
  from online_reviews
  where status = 'approved'
  order by published_on desc, discovered_at desc
  limit $1
`;

const LOAD_DASHBOARD_REVIEWS_SQL = `
  select ${REVIEW_COLUMNS}
  from online_reviews
  order by discovered_at desc
  limit 200
`;

const LOAD_LATEST_SYNC_RUN_SQL = `
  select id, started_at, finished_at, status, discovered_count, error_code
  from online_review_sync_runs
  order by started_at desc
  limit 1
`;

const MODERATE_REVIEW_SQL = `
  update online_reviews
  set status = $2,
      moderated_at = case when $2 = 'pending' then null else now() end
  where source_url = $1
  returning source_url
`;

const START_SYNC_RUN_SQL = `
  insert into online_review_sync_runs (started_at, status)
  values ($1, $2)
  returning id
`;

const FINISH_SYNC_RUN_SQL = `
  update online_review_sync_runs
  set finished_at = $2,
      status = $3,
      discovered_count = $4,
      error_code = $5
  where id = $1
  returning id
`;

function rows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (row): row is Record<string, unknown> =>
          row !== null && typeof row === "object",
      )
    : [];
}

function normalizeDate(value: unknown): string | null {
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return value;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp)
      ? new Date(timestamp).toISOString().slice(0, 10)
      : null;
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeTimestamp(value: unknown): string | null {
  if (value === null) return null;
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function isReviewStatus(value: unknown): value is OnlineReviewStatus {
  return (
    typeof value === "string" &&
    REVIEW_STATUSES.includes(value as OnlineReviewStatus)
  );
}

function isSyncStatus(value: unknown): value is OnlineReviewSyncStatus {
  return (
    typeof value === "string" &&
    [...FINISHED_SYNC_STATUSES, "running"].includes(
      value as OnlineReviewSyncStatus,
    )
  );
}

function mapReviewRow(value: Record<string, unknown>): OnlineReview | null {
  try {
    const sourceUrl = value.source_url;
    const title = value.title;
    const description = value.description;
    const bloggerName = value.blogger_name;
    const bloggerUrl = value.blogger_url;
    const publishedOn = normalizeDate(value.published_on);
    const discoveredAt = normalizeTimestamp(value.discovered_at);
    const status = value.status;
    const moderatedAtValue = value.moderated_at;
    const moderatedAt = normalizeTimestamp(moderatedAtValue);

    if (
      typeof sourceUrl !== "string" ||
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof bloggerName !== "string" ||
      typeof bloggerUrl !== "string" ||
      publishedOn === null ||
      discoveredAt === null ||
      !isReviewStatus(status) ||
      (moderatedAtValue !== null && moderatedAt === null)
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
      status,
      moderatedAt,
    };
  } catch {
    return null;
  }
}

function mapSyncRunRow(value: Record<string, unknown>): OnlineReviewSyncRun | null {
  try {
    const id = value.id;
    const startedAt = normalizeTimestamp(value.started_at);
    const finishedAtValue = value.finished_at;
    const finishedAt = normalizeTimestamp(finishedAtValue);
    const status = value.status;
    const discoveredCount = value.discovered_count;
    const errorCode = value.error_code;

    if (
      typeof id !== "number" ||
      !Number.isSafeInteger(id) ||
      startedAt === null ||
      (finishedAtValue !== null && finishedAt === null) ||
      !isSyncStatus(status) ||
      typeof discoveredCount !== "number" ||
      !Number.isSafeInteger(discoveredCount) ||
      discoveredCount < 0 ||
      (errorCode !== null && typeof errorCode !== "string")
    ) {
      return null;
    }

    return {
      id,
      startedAt,
      finishedAt,
      status,
      discoveredCount,
      errorCode,
    };
  } catch {
    return null;
  }
}

function isValidReviewUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "blog.naver.com" &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === "" &&
      url.pathname.split("/").filter(Boolean).length >= 2
    );
  } catch {
    return false;
  }
}

export async function insertPendingReviews(
  candidates: readonly OnlineReviewCandidate[],
  query: ReviewQueryExecutor = databaseQuery,
): Promise<number> {
  let inserted = 0;
  for (const candidate of candidates) {
    const result = await query(INSERT_PENDING_REVIEW_SQL, [
      candidate.sourceUrl,
      candidate.title,
      candidate.description,
      candidate.bloggerName,
      candidate.bloggerUrl,
      candidate.publishedOn,
      candidate.discoveredAt,
      "pending",
    ]);
    inserted += rows(result).length > 0 ? 1 : 0;
  }
  return inserted;
}

export async function loadApprovedOnlineReviews(
  limit: number,
  query: ReviewQueryExecutor = databaseQuery,
): Promise<OnlineReview[]> {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 20) {
    throw new Error("Invalid review limit");
  }

  const result = await query(LOAD_APPROVED_REVIEWS_SQL, [limit]);
  return rows(result)
    .map(mapReviewRow)
    .filter((review): review is OnlineReview => review?.status === "approved");
}

export async function moderateOnlineReview(
  sourceUrl: string,
  status: OnlineReviewStatus,
  query: ReviewQueryExecutor = databaseQuery,
): Promise<boolean> {
  if (!isValidReviewUrl(sourceUrl)) throw new Error("Invalid review URL");
  if (!isReviewStatus(status)) throw new Error("Invalid review status");

  const result = await query(MODERATE_REVIEW_SQL, [sourceUrl, status]);
  return rows(result).length > 0;
}

export async function loadOnlineReviewDashboard(
  query: ReviewQueryExecutor = databaseQuery,
): Promise<OnlineReviewDashboard> {
  const [reviewResult, runResult] = await Promise.all([
    query(LOAD_DASHBOARD_REVIEWS_SQL, []),
    query(LOAD_LATEST_SYNC_RUN_SQL, []),
  ]);
  const reviews = rows(reviewResult)
    .map(mapReviewRow)
    .filter((review): review is OnlineReview => review !== null);
  const lastRun = rows(runResult).map(mapSyncRunRow).find(Boolean) ?? null;

  return {
    pending: reviews.filter((review) => review.status === "pending"),
    approved: reviews.filter((review) => review.status === "approved"),
    rejected: reviews.filter((review) => review.status === "rejected"),
    lastRun,
  };
}

export async function startOnlineReviewSyncRun(
  startedAt: string,
  query: ReviewQueryExecutor = databaseQuery,
): Promise<number> {
  const result = rows(await query(START_SYNC_RUN_SQL, [startedAt, "running"]));
  const id = result[0]?.id;
  if (typeof id !== "number" || !Number.isSafeInteger(id)) {
    throw new Error("Review sync run could not start");
  }
  return id;
}

export async function finishOnlineReviewSyncRun(
  id: number,
  result: {
    finishedAt: string;
    status: "success" | "failed";
    discoveredCount: number;
    errorCode: string | null;
  },
  query: ReviewQueryExecutor = databaseQuery,
): Promise<void> {
  if (
    !Number.isSafeInteger(id) ||
    id < 1 ||
    !FINISHED_SYNC_STATUSES.includes(result.status) ||
    !Number.isSafeInteger(result.discoveredCount) ||
    result.discoveredCount < 0
  ) {
    throw new Error("Invalid review sync result");
  }

  await query(FINISH_SYNC_RUN_SQL, [
    id,
    result.finishedAt,
    result.status,
    result.discoveredCount,
    result.errorCode,
  ]);
}
