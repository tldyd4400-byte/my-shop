export type OnlineReviewStatus = "pending" | "approved" | "rejected";

export type OnlineReviewCandidate = {
  sourceUrl: string;
  title: string;
  description: string;
  bloggerName: string;
  bloggerUrl: string;
  publishedOn: string;
  discoveredAt: string;
};

export type OnlineReview = OnlineReviewCandidate & {
  status: OnlineReviewStatus;
  moderatedAt: string | null;
};

export type OnlineReviewSyncStatus = "running" | "success" | "failed";

export type OnlineReviewSyncRun = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: OnlineReviewSyncStatus;
  discoveredCount: number;
  errorCode: string | null;
};
