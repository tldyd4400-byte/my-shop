import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { HeroMedia } from "@/components/site/hero-media";
import { MenuViewTracker } from "@/components/site/menu-view-tracker";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import { MENU_ITEMS, STORE } from "@/lib/content/store";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, restaurantSchema } from "@/lib/seo/schema";

export const metadata = createPageMetadata({
  title: "청주 갈비찜 메뉴 | 어믜뜰 청주봉명동본점",
  description:
    "청주에서 즐기는 매운 등갈비찜과 간장 등갈비찜의 가격, 구성, 셀프바와 단체 메뉴 선택 정보를 확인하세요.",
  path: "/menu",
});

export default function MenuPage() {
  return (
    <main>
      <JsonLd
        data={[
          restaurantSchema(),
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "메뉴", path: "/menu" },
          ]),
        ]}
      />
      <MenuViewTracker />

      <HeroMedia
        eyebrow="MENU · 청주갈비찜"
        title={
          <>
            청주에서 색다른
            <br />
            갈비찜을 찾는다면
          </>
        }
        description="매운맛과 간장맛을 고르고 셀프바 재료를 더해 샤브처럼 즐겨보세요."
        image="/images/eomeuittul/spicy-ribs.jpg"
        imageAlt={`${STORE.name} 매운 등갈비찜`}
      >
        <AnalyticsLink
          className="button button-primary"
          href={STORE.bookingUrl}
          target="_blank"
          rel="noreferrer"
          eventName="naver_reservation_click"
          placement="menu_hero"
        >
          네이버에서 예약하기
        </AnalyticsLink>
      </HeroMedia>

      <ProofStrip
        items={[
          "매운맛 · 간장맛",
          `세트 ${MENU_ITEMS[0].price}`,
          MENU_ITEMS[0].includes,
          "30여 종 셀프바",
        ]}
      />

      <section className="menu-page section-pad">
        <div className="shell menu-grid">
          {MENU_ITEMS.map((item) => (
            <article key={item.slug}>
              <Image
                src={item.image}
                alt={item.imageAlt}
                width={640}
                height={420}
              />
              <h2>{item.name}</h2>
              <strong>{item.price}</strong>
              <p>{item.includes}</p>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="group-menu-link section-pad">
        <div className="shell split-section">
          <Image src="/images/eomeuittul/spicy-ribs.jpg" alt="어믜뜰 매운 등갈비찜" width={640} height={440} sizes="(max-width: 767px) calc(100vw - 48px), 50vw" />
          <div>
            <p className="eyebrow">MENU FOR EVERYONE</p>
            <h2>함께 고르기 좋은 두 가지 갈비찜</h2>
            <p>매운맛과 간장맛을 준비해 여러 취향이 모이는 회식 자리에서도 선택하기 좋습니다.</p>
            <Link className="button button-primary" href="/stories/cheongju-group-dining">모임·회식 안내 보기</Link>
          </div>
        </div>
      </section>

      <section className="self-bar section-pad">
        <div className="shell split-section">
          <Image
            src="/images/eomeuittul/step-2-selfbar.jpg"
            alt={`${STORE.name} 셀프바`}
            width={640}
            height={440}
          />
          <div>
            <p className="eyebrow">30여 종 채소 · 버섯 · 떡 · 당면</p>
            <h2>취향대로 담아 나만의 한 상</h2>
            <p>재료 구성은 매장 상황에 따라 달라질 수 있습니다.</p>
          </div>
        </div>
      </section>

      <ExperienceSteps />
      <ReservationCta placement="menu_bottom" />
    </main>
  );
}
