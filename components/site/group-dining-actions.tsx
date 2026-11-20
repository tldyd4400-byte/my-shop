import { AnalyticsLink } from "@/components/site/analytics-link";
import { STORE } from "@/lib/content/store";

type GroupDiningActionsProps = {
  placement: "group_story_hero" | "group_story_bottom";
};

export function GroupDiningActions({ placement }: GroupDiningActionsProps) {
  return (
    <div className="group-dining-actions group-v5-actions">
      <AnalyticsLink
        className="button button-primary group-v5-action"
        href={STORE.phoneHref}
        eventName="group_inquiry_click"
        placement={`${placement}_inquiry`}
      >
        <span>단체·통대관 전화 상담</span>
        <small>{STORE.phoneDisplay}</small>
      </AnalyticsLink>
      <AnalyticsLink
        className="button button-secondary group-v5-action"
        href={STORE.bookingUrl}
        target="_blank"
        rel="noreferrer"
        eventName="naver_reservation_click"
        placement={`${placement}_reservation`}
      >
        <span>일반 식사 네이버 예약</span>
        <small>최신 예약 시간 확인</small>
      </AnalyticsLink>
    </div>
  );
}
