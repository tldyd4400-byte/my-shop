import Image from "next/image";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { ProofStrip } from "@/components/site/proof-strip";
import { STORE } from "@/lib/content/store";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, restaurantSchema } from "@/lib/seo/schema";

export const metadata = createPageMetadata({
  title: "어믜뜰 매장 소개 | 청주 봉명동 가족 외식",
  description:
    "누군가를 배부르게 먹이고 싶은 마음으로 차린 어믜뜰 청주봉명동본점의 한 상과 매장 공간을 소개합니다.",
  path: "/store",
});

export default function StorePage() {
  return (
    <main className="store-route">
      <JsonLd
        data={[
          restaurantSchema(),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "매장", path: "/store" },
          ]),
        ]}
      />

      <HeroMedia
        eyebrow="STORE · 어믜뜰 청주봉명동본점"
        title={
          <>
            누군가를 배부르게
            <br />
            먹이고 싶은 마음
          </>
        }
        description="늘 자식 쪽으로 기울던 접시처럼 좋은 것을 먼저 내어주는 마음으로 차린 식당입니다."
        image="/images/eomeuittul/facade.jpg"
        imageAlt={`${STORE.name} 청주봉명동본점 외관`}
      >
        <AnalyticsLink
          className="button button-primary"
          href={STORE.bookingUrl}
          target="_blank"
          rel="noreferrer"
          eventName="naver_reservation_click"
          placement="store_hero"
        >
          네이버에서 예약하기
        </AnalyticsLink>
        <AnalyticsLink
          className="button button-secondary"
          href={STORE.phoneHref}
          eventName="phone_click"
          placement="store_hero"
        >
          {STORE.phoneDisplay}
        </AnalyticsLink>
      </HeroMedia>

      <ProofStrip
        items={[
          "청주 봉명동 본점",
          "30여 종 채소 셀프바",
          STORE.seats,
          STORE.parking,
        ]}
      />

      <section className="store-stories section-pad">
        <div className="shell route-stories">
          <article className="route-story">
            <Image
              src="/images/eomeuittul/hero-table.jpg"
              alt={`${STORE.name} 등갈비찜 한 상`}
              width={640}
              height={440}
            />
            <div>
              <p className="eyebrow">
                늘 자식 쪽으로 기울던 접시, 그날의 식탁
              </p>
              <h2>엄마의 마음으로 푸짐하게 차려내는 한 상</h2>
              <p>
                좋은 것은 자식 앞으로 밀어주시고 하나라도 더 챙겨주시던
                마음. 어믜뜰은 누군가를 배부르게 먹이고 싶은 그 마음을 닮은
                식당입니다.
              </p>
            </div>
          </article>

          <article className="route-story route-story--reverse">
            <Image
              src="/images/eomeuittul/identity-wall.jpg"
              alt={`${STORE.name} 매장 브랜드 벽면`}
              width={640}
              height={440}
            />
            <div>
              <p className="eyebrow">THE HEART OF EOMEUTTEULL</p>
              <h2>늘 자식 쪽으로 기울던 접시</h2>
              <p>
                좋은 것은 먼저 내어주고 하나라도 더 챙겨주던 마음. 어믜뜰은
                그 마음을 오늘의 식탁에 담습니다.
              </p>
            </div>
          </article>

          <article className="route-story">
            <Image
              src="/images/eomeuittul/interior.jpg"
              alt={`${STORE.name} 매장 내부 좌석`}
              width={640}
              height={440}
            />
            <div>
              <p className="eyebrow">SPACE · 실제 매장 공간</p>
              <h2>가족 외식부터 소규모 모임까지</h2>
              <p>{STORE.seats}</p>
            </div>
          </article>
        </div>
      </section>

      <LocationPanel />
    </main>
  );
}
