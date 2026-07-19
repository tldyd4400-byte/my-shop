"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  deliverSessionEvent,
  startBoundedRetry,
} from "@/lib/analytics/read-event";

export function MenuViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `menu_view:${pathname}`;

    return startBoundedRetry(
      () =>
        deliverSessionEvent({
          key,
          eventName: "menu_view",
          pathname,
          getStorage: () => window.sessionStorage,
          getGtag: () => window.gtag,
        }),
      {
        setTimeout: (callback, delay) => window.setTimeout(callback, delay),
        clearTimeout: (handle) => window.clearTimeout(handle),
      },
    );
  }, [pathname]);

  return null;
}
