"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import {
  deliverSessionEvent,
  startBoundedRetry,
} from "@/lib/analytics/read-event";

export function StoryReadTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const key = `story_read:${pathname}`;
    let readSignaled = false;
    let stopRetry = () => {};

    const signalRead = () => {
      if (readSignaled) {
        return;
      }

      readSignaled = true;
      window.clearTimeout(readTimer);
      window.removeEventListener("scroll", onScroll);
      stopRetry = startBoundedRetry(
        () =>
          deliverSessionEvent({
            key,
            eventName: "story_read",
            pathname,
            getStorage: () => window.sessionStorage,
            getGtag: () => window.gtag,
          }),
        {
          setTimeout: (callback, delay) => window.setTimeout(callback, delay),
          clearTimeout: (handle) => window.clearTimeout(handle),
        },
      );
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.5) {
        signalRead();
      }
    };

    const readTimer = window.setTimeout(signalRead, 30_000);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.clearTimeout(readTimer);
      window.removeEventListener("scroll", onScroll);
      stopRetry();
    };
  }, [pathname]);

  return null;
}
