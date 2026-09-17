import { loadApprovedOnlineReviews } from "./repository.ts";
import type { OnlineReview } from "./types.ts";

type PublicReviewLoader = (limit: number) => Promise<OnlineReview[]>;

export type PublicReviewOptions = {
  configured?: boolean;
  load?: PublicReviewLoader;
};

export async function loadPublicOnlineReviews(
  limit: number,
  options: PublicReviewOptions = {},
): Promise<OnlineReview[]> {
  const configured =
    options.configured ?? Boolean(process.env.REVIEWS_DATABASE_URL);
  if (!configured) return [];

  const load = options.load ?? loadApprovedOnlineReviews;
  try {
    return await load(limit);
  } catch {
    return [];
  }
}
