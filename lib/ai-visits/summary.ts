import type { Purpose } from "./types.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 30 * DAY_MS;
const MINIMUM_DATE_MS = -8_640_000_000_000_000;
const EXPLICIT_TIMEZONE_TIMESTAMP =
  /^(\d{4}|[+-]\d{6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

const PURPOSES: readonly Purpose[] = [
  "search_indexing",
  "training",
  "realtime_citation",
  "other",
];

export type AiVisitRow = {
  createdAt: string;
  path: string;
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
};

export type AiVisitBotSummary = {
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
  count: number;
  previousCount: number;
  change: number;
  changePercent: number;
  isNew: boolean;
  lastVisitedAt: string | null;
  topPath: string | null;
};

export type AiVisitSummary = {
  total: number;
  byPurpose: Record<Purpose, number>;
  bots: AiVisitBotSummary[];
};

type BotState = {
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
  count: number;
  previousCount: number;
  lastVisitedAt: string | null;
  lastVisitedMs: number;
  paths: Map<string, number>;
};

function createPurposeTotals(): Record<Purpose, number> {
  return {
    search_indexing: 0,
    training: 0,
    realtime_citation: 0,
    other: 0,
  };
}

function emptySummary(): AiVisitSummary {
  return {
    total: 0,
    byPurpose: createPurposeTotals(),
    bots: [],
  };
}

function isPurpose(value: unknown): value is Purpose {
  return PURPOSES.includes(value as Purpose);
}

function hasValidContractFields(row: AiVisitRow): boolean {
  return (
    row !== null &&
    typeof row === "object" &&
    typeof row.createdAt === "string" &&
    typeof row.path === "string" &&
    typeof row.botId === "string" &&
    typeof row.botName === "string" &&
    typeof row.vendor === "string"
  );
}

function parseExplicitTimezoneTimestamp(value: string): number {
  const match = EXPLICIT_TIMEZONE_TIMESTAMP.exec(value);
  if (!match) return Number.NaN;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] === undefined ? 0 : Number(match[6]);
  const isLeapYear =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth[month - 1] ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return Number.NaN;
  }

  const timestampMs = Date.parse(value);
  return Number.isFinite(timestampMs) ? timestampMs : Number.NaN;
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function identityKey(row: AiVisitRow): string {
  return `${row.botName}\u0000${row.vendor}\u0000${row.purpose}`;
}

function createBotState(row: AiVisitRow): BotState {
  return {
    botId: row.botId,
    botName: row.botName,
    vendor: row.vendor,
    purpose: row.purpose,
    count: 0,
    previousCount: 0,
    lastVisitedAt: null,
    lastVisitedMs: Number.NEGATIVE_INFINITY,
    paths: new Map(),
  };
}

function applyDeterministicIdentity(state: BotState, row: AiVisitRow): void {
  const stateKey = `${state.botName}\u0000${state.vendor}\u0000${state.purpose}`;
  if (compareText(identityKey(row), stateKey) < 0) {
    state.botName = row.botName;
    state.vendor = row.vendor;
    state.purpose = row.purpose;
  }
}

function selectTopPath(paths: Map<string, number>): string | null {
  const first = [...paths.entries()].sort(
    ([leftPath, leftCount], [rightPath, rightCount]) =>
      rightCount - leftCount || compareText(leftPath, rightPath),
  )[0];

  return first?.[0] ?? null;
}

export function summarizeAiVisits(
  rows: readonly AiVisitRow[],
  now: Date,
): AiVisitSummary {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return emptySummary();

  const mathematicalCurrentStartMs = nowMs - WINDOW_MS;
  const mathematicalPreviousStartMs = nowMs - 2 * WINDOW_MS;
  const currentStartWasClamped = mathematicalCurrentStartMs < MINIMUM_DATE_MS;
  const previousStartWasClamped = mathematicalPreviousStartMs < MINIMUM_DATE_MS;
  const currentStartMs = Math.max(MINIMUM_DATE_MS, mathematicalCurrentStartMs);
  const previousStartMs = Math.max(MINIMUM_DATE_MS, mathematicalPreviousStartMs);
  const byPurpose = createPurposeTotals();
  const bots = new Map<string, BotState>();
  let total = 0;

  for (const row of rows) {
    if (!hasValidContractFields(row) || !isPurpose(row.purpose)) continue;

    const visitedMs = parseExplicitTimezoneTimestamp(row.createdAt);
    if (!Number.isFinite(visitedMs)) continue;

    const isCurrent =
      visitedMs < nowMs &&
      (visitedMs > currentStartMs ||
        (currentStartWasClamped && visitedMs === MINIMUM_DATE_MS));
    const isPrevious =
      !currentStartWasClamped &&
      visitedMs <= currentStartMs &&
      (visitedMs > previousStartMs ||
        (previousStartWasClamped && visitedMs === MINIMUM_DATE_MS));
    if (!isCurrent && !isPrevious) continue;

    let state = bots.get(row.botId);
    if (!state) {
      state = createBotState(row);
      bots.set(row.botId, state);
    } else {
      applyDeterministicIdentity(state, row);
    }

    if (isPrevious) {
      state.previousCount += 1;
      continue;
    }

    total += 1;
    byPurpose[row.purpose] += 1;
    state.count += 1;
    state.paths.set(row.path, (state.paths.get(row.path) ?? 0) + 1);

    if (
      visitedMs > state.lastVisitedMs ||
      (visitedMs === state.lastVisitedMs &&
        (state.lastVisitedAt === null ||
          compareText(row.createdAt, state.lastVisitedAt) < 0))
    ) {
      state.lastVisitedMs = visitedMs;
      state.lastVisitedAt = row.createdAt;
    }
  }

  const botSummaries = [...bots.values()]
    .map((state): AiVisitBotSummary => {
      const change = state.count - state.previousCount;
      const isNew = state.previousCount === 0 && state.count > 0;
      const changePercent =
        state.previousCount === 0
          ? 0
          : (change / state.previousCount) * 100;

      return {
        botId: state.botId,
        botName: state.botName,
        vendor: state.vendor,
        purpose: state.purpose,
        count: state.count,
        previousCount: state.previousCount,
        change,
        changePercent,
        isNew,
        lastVisitedAt: state.lastVisitedAt,
        topPath: selectTopPath(state.paths),
      };
    })
    .sort(
      (left, right) =>
        right.count - left.count || compareText(left.botName, right.botName),
    );

  return { total, byPurpose, bots: botSummaries };
}
