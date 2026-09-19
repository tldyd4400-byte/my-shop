import {
  dedupeOnlineReviewCandidates,
  normalizeNaverBlogItem,
} from "./normalize.ts";
import { searchNaverBlog } from "./naver-client.ts";
import {
  finishOnlineReviewSyncRun,
  insertPendingReviews,
  startOnlineReviewSyncRun,
} from "./repository.ts";
import type { OnlineReviewCandidate } from "./types.ts";

export const NAVER_REVIEW_QUERIES = [
  "어믜뜰",
  "어믜뜰 등갈비찜",
  "어믜뜰 청주",
] as const;

type FinishRun = typeof finishOnlineReviewSyncRun;

export type OnlineReviewSyncDependencies = {
  now?: () => Date;
  search?: (query: string) => Promise<unknown[]>;
  startRun?: (startedAt: string) => Promise<string>;
  insert?: (candidates: readonly OnlineReviewCandidate[]) => Promise<number>;
  finishRun?: FinishRun;
};

function safeNow(now: () => Date): string {
  try {
    const date = now();
    const timestamp = date.getTime();
    if (!Number.isFinite(timestamp)) throw new Error();
    return date.toISOString();
  } catch {
    throw new Error("REVIEW_SYNC_CLOCK_INVALID");
  }
}

export async function syncOnlineReviews(
  dependencies: OnlineReviewSyncDependencies = {},
): Promise<{ discoveredCount: number; partialFailure: boolean }> {
  const now = dependencies.now ?? (() => new Date());
  const search = dependencies.search ?? searchNaverBlog;
  const startRun = dependencies.startRun ?? startOnlineReviewSyncRun;
  const insert = dependencies.insert ?? insertPendingReviews;
  const finishRun = dependencies.finishRun ?? finishOnlineReviewSyncRun;
  const startedAt = safeNow(now);
  const runId = await startRun(startedAt);

  const searchResults = await Promise.allSettled(
    NAVER_REVIEW_QUERIES.map((query) => search(query)),
  );
  const partialFailure = searchResults.some(
    (result) => result.status === "rejected",
  );
  const candidates = dedupeOnlineReviewCandidates(
    searchResults.flatMap((result) =>
      result.status === "fulfilled"
        ? result.value
            .slice(0, 20)
            .map((item) => normalizeNaverBlogItem(item, startedAt))
        : [],
    ),
  ).slice(0, 60);

  let discoveredCount: number;
  try {
    discoveredCount = await insert(candidates);
  } catch {
    try {
      await finishRun(runId, {
        finishedAt: safeNow(now),
        status: "failed",
        discoveredCount: 0,
        errorCode: "INSERT_FAILED",
      });
    } catch {
      // The caller still receives only the stable sync error.
    }
    throw new Error("REVIEW_SYNC_FAILED");
  }

  try {
    await finishRun(runId, {
      finishedAt: safeNow(now),
      status: partialFailure ? "failed" : "success",
      discoveredCount,
      errorCode: partialFailure ? "PARTIAL_FAILURE" : null,
    });
  } catch {
    throw new Error("REVIEW_SYNC_FAILED");
  }

  return { discoveredCount, partialFailure };
}
