import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not configured");
  process.exitCode = 1;
} else {
  try {
    const migrationText = await readFile(
      new URL("../migrations/001_create_ai_visits.sql", import.meta.url),
      "utf8",
    );
    const sql = neon(databaseUrl);
    await sql.query(migrationText);
  } catch {
    console.error("AI visits migration failed");
    process.exitCode = 1;
  }
}
