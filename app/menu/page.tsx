import Image from "next/image";

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
    "매운 등갈비찜과 간장 등갈비찜의 가격, 구성과 어믜뜰 식사 순서를 확인하세요.",
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
            등갈비찜에서 시작해
            <br />
            나만의 한 상으로
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
