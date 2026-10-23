import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { GroupDiningPanel } from "@/components/site/group-dining-panel";
import { LocationPanel } from "@/components/site/location-panel";
import { MenuCategoryGrid } from "@/components/site/menu-category-grid";
import { OnlineReviewCards } from "@/components/site/online-review-cards";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import { VisitFacts } from "@/components/site/visit-facts";
import {
  FAQ_ITEMS,
  MENU_ITEMS,
  REVIEW_ITEMS,
  REVIEW_SNAPSHOT,
  STORE,
} from "@/lib/content/store";
import { loadPublicOnlineReviews } from "@/lib/online-reviews/public";
import { createPageMetadata } from "@/lib/seo/metadata";
import {
  faqSchema,
  restaurantSchema,
  websiteSchema,
} from "@/lib/seo/schema";

export const metadata = createPageMetadata({
  title: "청주 봉명동 맛집 어믜뜰 | 색다른 등갈비찜",
  description:
    "청주 봉명동에서 등갈비찜과 30여 종 셀프바를 샤브처럼 즐기는 어믜뜰입니다.",
  path: "/",
});

export const revalidate = 3600;

export default async function HomePage() {
  const homeFaqs = FAQ_ITEMS.slice(0, 4);
  const onlineReviews = await loadPublicOnlineReviews(3);

  return (
    <main>
      <JsonLd
        data={[websiteSchema(), restaurantSchema(), faqSchema(homeFaqs)]}
      />

      <HeroMedia
        eyebrow="BRAND FILM · 청주 봉명동"
        title={
          <>
            <span>회식도 가족외식도,</span>
            <br />
            함께 끓여 더 즐거운 한 상
          </>
        }
        description="매운·간장 등갈비찜 세트 1인 19,900원 · 2인 이상 · 최대 52명 단체 이용과 통대관 상담 · 무료 주차"
        image="/images/eomeuittul/hero-poster.webp"
        imageAlt="등갈비찜과 메밀전, 채소가 함께 차려진 어믜뜰 한 상"
        video="/media/eomeuittul/hero-brand-720p.mp4"
      >
        <AnalyticsLink
          className="button button-primary"
          href={STORE.bookingUrl}
          target="_blank"
          rel="noreferrer"
          eventName="naver_reservation_click"
          placement="home_hero"
        >
          네이버 예약하기
        </AnalyticsLink>
        <AnalyticsLink
          className="button button-secondary"
          href={STORE.phoneHref}
          eventName="group_inquiry_click"
          placement="home_hero"
        >
          52명 모임 상담
        </AnalyticsLink>
        <Link className="button button-tertiary" href="/menu">
          전체 메뉴 보기
        </Link>
      </HeroMedia>

      <ProofStrip
        items={[
          `네이버 평점 ${REVIEW_SNAPSHOT.rating} / 5 · ${REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인`,
          `메뉴 ${MENU_ITEMS.length}개 최신 가격`,
          `2~${STORE.maxGroupSize}명 단체석 · 통대관 협의`,
          "매장 뒤 무료 주차",
        ]}
      />

      <section className="brand-story section-pad">
        <div className="shell split-section">
          <Image
            src="/images/eomeuittul/hero-table.jpg"
            alt="어믜뜰 등갈비찜 한 상"
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
        </div>
      </section>

      <ExperienceSteps />

      <section className="menu-preview section-pad">
        <div className="shell">
          <h2>한 상에 빠짐없이 담았습니다</h2>
          <MenuCategoryGrid compact />
        </div>
      </section>

      <GroupDiningPanel placement="home_group" />
      <ReservationCta placement="home_mid" />

      <section className="review-preview section-pad surface-paper">
        <div className="shell">
          <h2>손님이 먼저 알아본 어믜뜰</h2>
          {onlineReviews.length > 0 ? (
            <OnlineReviewCards reviews={onlineReviews} />
          ) : (
            <div className="review-grid">
              {REVIEW_ITEMS.map((review) => (
                <article key={review.title}>
                  <h3>{review.title}</h3>
                  <p>{review.summary}</p>
                  <p className="review-source">{review.sourceLabel}</p>
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    원문 보기
                  </a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="faq-section section-pad surface-paper">
        <div className="shell">
          <h2>방문 전 궁금한 점</h2>
          <FaqList items={homeFaqs} />
        </div>
      </section>

      <VisitFacts />
      <LocationPanel />
    </main>
  );
}
