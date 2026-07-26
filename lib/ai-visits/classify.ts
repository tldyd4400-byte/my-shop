import { BOT_REGISTRY } from "./bot-registry.ts";
import type { BotIdentity } from "./types.ts";

const GENERIC_BOT_PATTERN = /bot|crawler|spider|fetcher|slurp/i;

export function classifyAiBot(
  userAgent: string | null | undefined,
): BotIdentity | null {
  if (!userAgent) return null;

  const known = BOT_REGISTRY.find(({ pattern }) => pattern.test(userAgent));
  if (known) {
    return {
      botId: known.botId,
      botName: known.botName,
      vendor: known.vendor,
      purpose: known.purpose,
    };
  }

  return GENERIC_BOT_PATTERN.test(userAgent)
    ? {
        botId: "generic-crawler",
        botName: "기타 크롤러",
        vendor: "Unknown",
        purpose: "other",
      }
    : null;
}
