import { query as databaseQuery } from "./database.ts";
import type { AiVisitEvent } from "./event.ts";
import type { AiVisitRow } from "./summary.ts";
import type { Purpose } from "./types.ts";
import type { QueryExecutor } from "./database.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const RETENTION_MS = 60 * DAY_MS;
const MINIMUM_DATE_MS = -8_640_000_000_000_000;
const EXPLICIT_TIMEZONE_TIMESTAMP =
  /^(?:\d{4}|[+-]\d{6})-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/;
const PURPOSES: readonly Purpose[] = [
  "search_indexing",
  "training",
  "realtime_citation",
  "other",
];

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

function isPurpose(value: unknown): value is Purpose {
  return typeof value === "string" && PURPOSES.includes(value as Purpose);
}

function normalizeCreatedAt(value: unknown): string | null {
  let timestampMs: number;

  if (value instanceof Date) {
    timestampMs = Date.prototype.getTime.call(value);
  } else if (
    typeof value === "string" &&
    EXPLICIT_TIMEZONE_TIMESTAMP.test(value)
  ) {
    timestampMs = Date.parse(value);
  } else {
    return null;
  }

  return Number.isFinite(timestampMs)
    ? new Date(timestampMs).toISOString()
    : null;
}

function mapRow(row: unknown): AiVisitRow | null {
  if (row === null || typeof row !== "object") return null;

  try {
    const candidate = row as Record<string, unknown>;
    const createdAtValue = candidate.created_at;
    const path = candidate.path;
    const botId = candidate.bot_id;
    const botName = candidate.bot_name;
    const vendor = candidate.vendor;
    const purpose = candidate.purpose;
    const createdAt = normalizeCreatedAt(createdAtValue);

    if (
      createdAt === null ||
      typeof path !== "string" ||
      typeof botId !== "string" ||
      typeof botName !== "string" ||
      typeof vendor !== "string" ||
      !isPurpose(purpose)
    ) {
      return null;
    }

    return { createdAt, path, botId, botName, vendor, purpose };
  } catch {
    return null;
  }
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

  const rows: AiVisitRow[] = [];
  for (const candidate of result) {
    const row = mapRow(candidate);
    if (row !== null) rows.push(row);
  }
  return rows;
}
