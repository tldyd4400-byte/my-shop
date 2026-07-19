import { STORE } from "@/lib/content/store";
import { AnalyticsLink } from "./analytics-link";

export function MobileActionBar() {
  return (
    <nav className="mobile-actions" aria-label="빠른 작업">
      <AnalyticsLink
        href={STORE.phoneHref}
        eventName="phone_click"
        placement="mobile_bar"
      >
        전화
      </AnalyticsLink>
      <AnalyticsLink
        href={STORE.directionsUrl}
        target="_blank"
        rel="noreferrer"
        eventName="naver_map_click"
        placement="mobile_bar"
      >
        길찾기
      </AnalyticsLink>
      <AnalyticsLink
        className="mobile-action-primary"
        href={STORE.bookingUrl}
        target="_blank"
        rel="noreferrer"
        eventName="naver_reservation_click"
        placement="mobile_bar"
      >
        예약
      </AnalyticsLink>
    </nav>
  );
}
