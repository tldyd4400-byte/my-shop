import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { AnalyticsLink } from "@/components/site/analytics-link";
import { ExperienceSteps } from "@/components/site/experience-steps";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import {
  FAQ_ITEMS,
  MENU_ITEMS,
  REVIEW_ITEMS,
  STORE,
} from "@/lib/content/store";
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

export default function HomePage() {
  const homeFaqs = FAQ_ITEMS.slice(0, 4);

  return (
    <main>
      <JsonLd
        data={[websiteSchema(), restaurantSchema(), faqSchema(homeFaqs)]}
      />

      <HeroMedia
        eyebrow="BRAND FILM · 청주 봉명동"
        title={
          <>
            처음 보는 등갈비찜,
            <br />
            함께 끓여 더 맛있는 한 상
          </>
        }
        description="부드러운 등갈비와 30여 종의 채소를 취향대로 더해 샤브처럼 즐기는 어믜뜰만의 색다른 한 상"
        image="/images/eomeuittul/hero-table.jpg"
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
          네이버에서 예약하기
        </AnalyticsLink>
        <Link className="button button-secondary" href="/menu">
          메뉴 먼저 보기
        </Link>
      </HeroMedia>

      <ProofStrip
        items={[
          "청주 봉명동 본점",
          "30여 종 채소 셀프바",
          "등갈비찜 + 샤브의 색다른 조합",
          "네이버 예약 가능",
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
          <div className="menu-grid">
            {MENU_ITEMS.map((item) => (
              <article key={item.slug}>
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  width={640}
                  height={360}
                />
                <h3>{item.name}</h3>
                <strong>{item.price}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ReservationCta placement="home_mid" />

      <section className="review-preview section-pad surface-paper">
        <div className="shell">
          <h2>손님이 먼저 알아본 어믜뜰</h2>
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
        </div>
      </section>

      <section className="faq-section section-pad surface-paper">
        <div className="shell">
          <h2>방문 전 궁금한 점</h2>
          <FaqList items={homeFaqs} />
        </div>
      </section>

      <LocationPanel />
    </main>
  );
}
