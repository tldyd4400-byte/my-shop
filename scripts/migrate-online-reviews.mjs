import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL ?? process.env.REVIEWS_DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not configured");
  process.exitCode = 1;
} else {
  try {
    const migrationText = await readFile(
      new URL("../migrations/002_create_online_reviews.sql", import.meta.url),
      "utf8",
    );
    const sql = neon(databaseUrl);
    await sql.query(migrationText);
  } catch {
    console.error("Online reviews migration failed");
    process.exitCode = 1;
  }
}
