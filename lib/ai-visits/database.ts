import { neon } from "@neondatabase/serverless";

export type QueryExecutor = (
  text: string,
  params: readonly unknown[],
) => Promise<unknown>;

export const query: QueryExecutor = async (text, params) => {
  const databaseUrl = process.env.AI_VISITS_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("AI_VISITS_DATABASE_URL is not configured");
  }

  const sql = neon(databaseUrl);
  return sql.query(text, [...params]);
};
