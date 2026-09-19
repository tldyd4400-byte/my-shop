import { NextResponse } from "next/server.js";
import type { NextFetchEvent, NextRequest } from "next/server.js";

import { canonicalizeAdminPath } from "./lib/admin/urls.ts";
import { classifyAiBot } from "./lib/ai-visits/classify.ts";
import { createAiVisitEvent, type AiVisitEvent } from "./lib/ai-visits/event.ts";
import { recordAiVisit } from "./lib/ai-visits/repository.ts";
import { isCollectableRequest } from "./lib/ai-visits/request-policy.ts";

type PlanProxyActionInput = {
  method: string;
  pathname: string;
  userAgent: string | null;
  now: Date;
};

type ProxyAction = {
  redirectPath: string | null;
  event: AiVisitEvent | null;
};

export function planProxyAction({
  method,
  pathname,
  userAgent,
  now,
}: PlanProxyActionInput): ProxyAction {
  const redirectPath = canonicalizeAdminPath(pathname);
  if (redirectPath !== null) {
    return { redirectPath, event: null };
  }

  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    return { redirectPath: null, event: null };
  }

  if (!isCollectableRequest({ method, pathname })) {
    return { redirectPath: null, event: null };
  }

  const bot = classifyAiBot(userAgent);
  if (bot === null || userAgent === null) {
    return { redirectPath: null, event: null };
  }

  return {
    redirectPath: null,
    event: createAiVisitEvent({ pathname, userAgent, bot, now }),
  };
}

export function proxy(request: NextRequest, event: NextFetchEvent) {
  const action = planProxyAction({
    method: request.method,
    pathname: request.nextUrl.pathname,
    userAgent: request.headers.get("user-agent"),
    now: new Date(),
  });

  if (action.redirectPath !== null) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = action.redirectPath;
    redirectUrl.search = "";
    redirectUrl.hash = "";
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (action.event !== null) {
    event.waitUntil(
      recordAiVisit(action.event).catch((error) => {
        console.warn(
          "[ai-visits] record failed",
          error instanceof Error ? error.name : "UnknownError"
        );
      }),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|favicon(?:\\.[^/]+)?$|sitemap(?:[-.][^/]*)?$|robots\\.txt$|.*\\.[^/]+$).*)",
  ],
};
