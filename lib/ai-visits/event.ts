import { sanitizePathname, sanitizeUserAgent } from "./privacy.ts";
import type { BotIdentity, Purpose } from "./types.ts";

export type AiVisitEvent = {
  createdAt: string;
  path: string;
  userAgent: string;
  botId: string;
  botName: string;
  vendor: string;
  purpose: Purpose;
};

type CreateAiVisitEventInput = {
  pathname: string;
  userAgent: string;
  bot: BotIdentity;
  now: Date;
};

export function createAiVisitEvent({
  pathname,
  userAgent,
  bot,
  now,
}: CreateAiVisitEventInput): AiVisitEvent {
  return {
    createdAt: now.toISOString(),
    path: sanitizePathname(pathname),
    userAgent: sanitizeUserAgent(userAgent),
    botId: bot.botId,
    botName: bot.botName,
    vendor: bot.vendor,
    purpose: bot.purpose,
  };
}
