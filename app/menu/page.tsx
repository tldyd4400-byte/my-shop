import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { HeroMedia } from "@/components/site/hero-media";
import { MenuCategoryGrid } from "@/components/site/menu-category-grid";
import { MenuViewTracker } from "@/components/site/menu-view-tracker";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import { STORE } from "@/lib/content/store";
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
          "매운·간장 세트 19,900원",
          "대표 세트 2인 이상",
          "수제우유빙수 후식 무료",
          "반조리 포장 할인",
        ]}
      />

      <section className="menu-page section-pad">
        <div className="shell">
          <h2>전체 메뉴와 포장 할인</h2>
          <MenuCategoryGrid />
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
            <p className="notice-copy">
              셀프바에서 채소를 자유롭게 선택할 수 있습니다. 완전 비건 식사가 필요하다면 육수·소스 등 동물성 재료 포함 여부를 매장에 먼저 확인해 주세요.
            </p>
          </div>
        </div>
      </section>

      <ExperienceSteps />
      <ReservationCta placement="menu_bottom" />
    </main>
  );
}
