import { STORE } from "@/lib/content/store";

import { AnalyticsLink } from "./analytics-link";
import { LocationMap } from "./location-map";

export function LocationPanel() {
  const [, , weekend] = STORE.openingPeriods;

  return (
    <section className="location-panel section-pad">
      <div className="shell location-grid">
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
          <p>{weekend.label}은 브레이크타임 없음</p>
          <p>라스트오더: {STORE.lastOrder}</p>
          <p>정기휴무: {STORE.regularClosure} · 명절 휴무: {STORE.holidayClosure}</p>
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
        <LocationMap
          className="location-map"
          sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1344px) calc(50vw - 48px), 624px"
        />
      </div>
    </section>
  );
}
