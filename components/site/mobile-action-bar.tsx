import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";

export function MobileActionBar() {
  return (
    <nav className="mobile-actions" aria-label="\ube60\ub978 \uc791\uc5c5">
      <AnalyticsLink
        href={STORE.phoneHref}
        eventName="phone_click"
        placement="mobile_bar"
      >
        \uc804\ud654
      </AnalyticsLink>
      <AnalyticsLink
        href={STORE.directionsUrl}
        target="_blank"
        rel="noreferrer"
        eventName="naver_map_click"
        placement="mobile_bar"
      >
        \uae38\ucc3e\uae30
      </AnalyticsLink>
      <AnalyticsLink
        className="mobile-action-primary"
        href={STORE.bookingUrl}
        target="_blank"
        rel="noreferrer"
        eventName="naver_reservation_click"
        placement="mobile_bar"
      >
        \uc608\uc57d
      </AnalyticsLink>
    </nav>
  );
}
