"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type AnalyticsEventName =
  | "naver_reservation_click"
  | "naver_map_click"
  | "phone_click"
  | "group_inquiry_click";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventName: AnalyticsEventName;
  placement: string;
};

export function AnalyticsLink({ eventName, placement, onClick, ...props }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    setTimeout(() => {
      try {
        window.gtag?.("event", eventName, {
          event_name: eventName,
          placement,
          page_path: window.location.pathname,
        });
      } catch {
        // Analytics must never interfere with the link's native navigation.
      }
    }, 0);
    onClick?.(event);
  }

  return <a {...props} onClick={handleClick} />;
}
