export type Purpose =
  | "search_indexing"
  | "training"
  | "realtime_citation"
  | "other";

export type BotIdentity = {
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
};

export const PURPOSE_LABELS: Record<Purpose, string> = {
  search_indexing: "검색 인덱싱",
  training: "학습",
  realtime_citation: "실시간 인용",
  other: "기타",
};
