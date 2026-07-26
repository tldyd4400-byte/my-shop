import { query as databaseQuery } from "./database.ts";
import type { AiVisitEvent } from "./event.ts";
import type { AiVisitRow } from "./summary.ts";
import type { Purpose } from "./types.ts";
import type { QueryExecutor } from "./database.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 60 * DAY_MS;
const MINIMUM_DATE_MS = -8_640_000_000_000_000;

const INSERT_AI_VISIT_SQL = `
  insert into ai_visits
    (created_at, path, user_agent, bot_id, bot_name, vendor, purpose)
  values ($1, $2, $3, $4, $5, $6, $7)
`;

const LOAD_AI_VISIT_ROWS_SQL = `
  select created_at, path, bot_id, bot_name, vendor, purpose
  from ai_visits
  where created_at >= $1
  order by created_at asc
`;

export async function recordAiVisit(
  event: AiVisitEvent,
  query: QueryExecutor = databaseQuery,
): Promise<void> {
  await query(INSERT_AI_VISIT_SQL, [
    event.createdAt,
    event.path,
    event.userAgent,
    event.botId,
    event.botName,
    event.vendor,
    event.purpose,
  ]);
}

function mapRow(row: Record<string, unknown>): AiVisitRow {
  const createdAt = row.created_at;

  return {
    createdAt:
      createdAt instanceof Date
        ? createdAt.toISOString()
        : String(createdAt),
    path: String(row.path),
    botId: String(row.bot_id),
    botName: String(row.bot_name),
    vendor: String(row.vendor),
    purpose: row.purpose as Purpose,
  };
}

export async function loadAiVisitRows(
  now: Date,
  query: QueryExecutor = databaseQuery,
): Promise<AiVisitRow[]> {
  let nowMs: number;
  try {
    nowMs = Date.prototype.getTime.call(now);
  } catch {
    throw new Error("Invalid now");
  }

  if (!Number.isFinite(nowMs)) {
    throw new Error("Invalid now");
  }

  const cutoff = new Date(
    Math.max(MINIMUM_DATE_MS, nowMs - RETENTION_MS),
  ).toISOString();
  const result = await query(LOAD_AI_VISIT_ROWS_SQL, [cutoff]);
  if (!Array.isArray(result)) return [];

  return result
    .filter(
      (row): row is Record<string, unknown> =>
        row !== null && typeof row === "object",
    )
    .map(mapRow);
}
