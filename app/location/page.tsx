import Image from "next/image";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { ProofStrip } from "@/components/site/proof-strip";
import { FAQ_ITEMS, STORE } from "@/lib/content/store";
import type { FaqItem } from "@/lib/content/types";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, restaurantSchema } from "@/lib/seo/schema";

const VISIT_FAQS: readonly FaqItem[] = FAQ_ITEMS.slice(0, 4);

export const metadata = createPageMetadata({
  title: "어믜뜰 오시는 길·주차 | 청주 봉명동 맛집",
  description:
    "어믜뜰 청주봉명동본점 주소, 영업시간, 월요일 휴무, 주차와 네이버 길찾기 정보를 확인하세요.",
  path: "/location",
  image: "/images/eomeuittul/naver-map-location.png",
});

export default function LocationPage() {
  return (
    <main className="store-route location-route">
      <JsonLd
        data={[
          restaurantSchema(),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "오시는 길", path: "/location" },
          ]),
        ]}
      />

      <HeroMedia
        eyebrow="LOCATION · 청주 봉명동"
        title={
          <>
            청주 봉명동 어믜뜰
            <br />
            찾아오는 길
          </>
        }
        description={`${STORE.address} · 건물 뒤 무료 지상주차장을 이용할 수 있습니다.`}
        image="/images/eomeuittul/naver-map-location.png"
        imageAlt={`${STORE.name} 청주봉명동본점 네이버 지도 위치`}
      >
        <AnalyticsLink
          className="button button-primary"
          href={STORE.directionsUrl}
          target="_blank"
          rel="noreferrer"
          eventName="naver_map_click"
          placement="location_hero"
        >
          네이버 지도에서 길찾기
        </AnalyticsLink>
        <AnalyticsLink
          className="button button-secondary"
          href={STORE.phoneHref}
          eventName="phone_click"
          placement="location_hero"
        >
          {STORE.phoneDisplay}
        </AnalyticsLink>
      </HeroMedia>

      <ProofStrip
        items={[
          "청주 봉명동 본점",
          "백봉로 213-1",
          "건물 뒤 무료 지상주차장",
          "월요일 정기휴무 · 일요일 영업",
        ]}
      />

      <LocationPanel />

      <section className="section-pad surface-hanji">
        <div className="shell split-section">
          <div>
            <p className="eyebrow">PARKING &amp; ENTRANCE</p>
            <h2>건물 뒤 무료 지상주차장</h2>
            <p>{STORE.parking}</p>
            <AnalyticsLink
              className="button button-secondary"
              href={STORE.placeUrl}
              target="_blank"
              rel="noreferrer"
              eventName="naver_map_click"
              placement="location_parking"
            >
              네이버 지도에서 위치 보기
            </AnalyticsLink>
          </div>
          <Image
            src="/images/eomeuittul/naver-map-location.png"
            alt={`${STORE.name} 주차 안내용 네이버 지도`}
            width={650}
            height={424}
          />
        </div>
      </section>

      <section className="faq-section section-pad surface-paper">
        <div className="shell split-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>방문 전 궁금한 점</h2>
            <p>추가 확인이 필요하면 매장으로 전화해 주세요.</p>
            <AnalyticsLink
              className="button button-primary"
              href={STORE.phoneHref}
              eventName="phone_click"
              placement="location_faq"
            >
              {STORE.phoneDisplay}
            </AnalyticsLink>
          </div>
          <FaqList items={VISIT_FAQS} />
        </div>
      </section>
    </main>
  );
}
