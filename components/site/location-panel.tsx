import Image from "next/image";

import { STORE } from "@/lib/content/store";

import { AnalyticsLink } from "./analytics-link";

export function LocationPanel() {
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
          <p>토·일·공휴일은 브레이크타임 없음</p>
          <p>라스트오더: {STORE.lastOrder}</p>
          <p>정기휴무: {STORE.regularClosure} · 공휴일 휴무: {STORE.holidayClosure}</p>
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
