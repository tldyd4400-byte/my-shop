import Image from "next/image";

import { STORE } from "@/lib/content/store";

import { AnalyticsLink } from "./analytics-link";

const DAY_LABELS = {
  Monday: "월요일",
  Tuesday: "화요일",
  Wednesday: "수요일",
  Thursday: "목요일",
  Friday: "금요일",
  Saturday: "토요일",
  Sunday: "일요일",
} as const;

export function LocationPanel() {
  const openDays = new Set(
    STORE.openingPeriods.flatMap((period) => period.days),
  );
  const closedDays = Object.entries(DAY_LABELS)
    .filter(([day]) => !openDays.has(day))
    .map(([, label]) => label);

  return (
    <section className="location-panel section-pad">
      <div className="shell location-grid">
        <Image
          className="location-map"
          src="/images/eomeuittul/naver-map-location.png"
          alt={`${STORE.name} 청주봉명동본점의 네이버 지도 위치`}
          width={650}
          height={424}
        />
        <div className="location-details">
          <h2>{STORE.fullName}</h2>
          <p>{STORE.address}</p>
          <dl className="location-hours">
            {STORE.openingPeriods.map((period) => (
              <div key={period.label}>
                <dt>{period.label}</dt>
                <dd>
                  {period.opens}~{period.closes}
                </dd>
              </div>
            ))}
          </dl>
          <p>정기휴무: {closedDays.join(", ")}</p>
          <p>{STORE.parking}</p>
          <AnalyticsLink
            className="button button-secondary"
            href={STORE.directionsUrl}
            target="_blank"
            rel="noreferrer"
            eventName="naver_map_click"
            placement="location_panel"
          >
            네이버 지도에서 보기
          </AnalyticsLink>
        </div>
      </div>
    </section>
  );
}
