import { neon } from "@neondatabase/serverless";

export type ReviewQueryExecutor = (
  text: string,
  params: readonly unknown[],
) => Promise<unknown>;

export const query: ReviewQueryExecutor = async (text, params) => {
  const databaseUrl = process.env.REVIEWS_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("REVIEWS_DATABASE_URL is not configured");
  }

  const sql = neon(databaseUrl);
  return sql.query(text, [...params]);
};
