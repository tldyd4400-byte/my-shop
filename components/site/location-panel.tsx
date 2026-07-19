import Image from "next/image";

import { STORE } from "@/lib/content/store";

import { AnalyticsLink } from "./analytics-link";

export function LocationPanel() {
  return (
    <section className="location-panel section-pad">
      <div className="shell location-grid">
        <Image
          src="/images/eomeuittul/naver-map-location.png"
          alt="어밀뜰 청주봉명동본점의 네이버 지도 위치"
          width={650}
          height={424}
        />
        <div>
          <h2>{STORE.fullName}</h2>
          <p>{STORE.address}</p>
          <p>
            영업 11:00~22:00 · 일요일 정기휴무
            <br />
            평일 브레이크 15:30~16:30
          </p>
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
