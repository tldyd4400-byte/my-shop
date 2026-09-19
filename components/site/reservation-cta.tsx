import { STORE } from "@/lib/content/store";

import { AnalyticsLink } from "./analytics-link";

export function ReservationCta({
  placement = "section",
}: {
  placement?: string;
}) {
  return (
    <section className="reservation-cta section-pad">
      <div className="shell reservation-cta-inner">
        <div>
          <p className="eyebrow">NAVER RESERVATION</p>
          <h2>한 끼를 직접 경험해 보세요</h2>
          <p>
            네이버 예약 페이지에서 최신 예약 시간과 현재 제공하는 혜택을
            확인할 수 있습니다.
          </p>
        </div>
        <AnalyticsLink
          className="button button-primary"
          href={STORE.bookingUrl}
          target="_blank"
          rel="noreferrer"
          eventName="naver_reservation_click"
          placement={placement}
        >
          네이버에서 예약하기
        </AnalyticsLink>
      </div>
    </section>
  );
}
