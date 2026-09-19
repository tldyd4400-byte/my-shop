import Image from "next/image";

import { JsonLd } from "@/components/seo/json-ld";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { OnlineReviewCards } from "@/components/site/online-review-cards";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import { REVIEW_ITEMS, STORE } from "@/lib/content/store";
import { loadPublicOnlineReviews } from "@/lib/online-reviews/public";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";

import styles from "./reviews.module.css";

export const metadata = createPageMetadata({
  title: "어믜뜰 방문자 후기 | 청주 봉명동 등갈비찜",
  description:
    "네이버 방문자 후기 일부에서 확인한 어믜뜰의 색다른 한 상, 부드러운 등갈비와 골라 먹는 재미를 원문 링크와 확인일로 살펴보세요.",
  path: "/reviews",
  image: "/images/eomeuittul/soy-ribs.jpg",
});

export const revalidate = 3600;

export default async function ReviewsPage() {
  const onlineReviews = await loadPublicOnlineReviews(6);

  return (
    <main className={`store-route ${styles.reviewsRoute}`}>
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "방문자 후기", path: "/reviews" },
        ])}
      />

      <HeroMedia
        eyebrow="REVIEWS · 네이버 방문자 후기"
        title={
          <>
            손님이 먼저 알아본
            <br />
            어믜뜰의 특별함
          </>
        }
        description="색다른 메뉴, 부드러운 등갈비, 골라 먹는 재미. 방문자 후기 일부에서 반복된 반응을 원문과 함께 확인하세요."
        image="/images/eomeuittul/soy-ribs.jpg"
        imageAlt={`${STORE.name} 간장 등갈비찜과 채소 한 상`}
      >
        <a
          className="button button-primary"
          href={STORE.placeUrl}
          target="_blank"
          rel="noreferrer"
        >
          네이버에서 후기 원문 보기
        </a>
      </HeroMedia>

      <ProofStrip
        items={[
          "네이버 원문 링크",
          "2026.07.19 확인",
          "후기 일부만 발췌",
          "반복 반응 중심 요약",
        ]}
      />

      <section className={`${styles.reviewsSection} section-pad surface-paper`}>
        <div className="shell">
          <div className={styles.evidenceHeader}>
            <p className="eyebrow">NAVER VISITOR REVIEWS · 2026.07.19</p>
            <h2>손님이 먼저 알아본 어믜뜰</h2>
            <p>
              전체 실시간 후기 데이터가 아닌, 확인일 기준 네이버 방문자 후기
              일부에서 반복된 반응을 요약했습니다.
            </p>
          </div>

          <div className={styles.reviewGrid}>
            {REVIEW_ITEMS.map((review) => (
              <article className={styles.reviewCard} key={review.title}>
                <p className={styles.cardLabel}>{review.sourceLabel}</p>
                <h3>{review.title}</h3>
                <p className={styles.reviewText}>{review.summary}</p>
                <div className={styles.cardMeta}>
                  <time dateTime={review.checkedAt}>
                    {review.checkedAt.replaceAll("-", ".")} 확인
                  </time>
                  <a
                    className={styles.sourceLink}
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    네이버 원문 보기 <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {onlineReviews.length > 0 ? (
        <section className={`${styles.reviewsSection} section-pad`}>
          <div className="shell">
            <div className={styles.evidenceHeader}>
              <p className="eyebrow">RECENT ONLINE REVIEWS · 관리자 승인 후기</p>
              <h2>최근 온라인 후기</h2>
              <p>
                네이버 블로그 검색 결과 중 관리자가 원문을 확인하고 승인한
                어믜뜰 관련 글입니다.
              </p>
            </div>
            <OnlineReviewCards reviews={onlineReviews} />
          </div>
        </section>
      ) : null}

      <section className={`${styles.supportSection} section-pad`}>
        <div className="shell route-stories">
          <article className="route-story">
            <Image
              src="/images/eomeuittul/step-2-selfbar.jpg"
              alt="채소와 버섯, 떡과 당면이 준비된 어믜뜰 셀프바"
              width={640}
              height={440}
            />
            <div>
              <p className="eyebrow">SPECIAL EXPERIENCE · 반복 언급</p>
              <h2>등갈비찜과 샤브를 한 상에서 즐기는 재미</h2>
              <p>
                원하는 채소와 버섯, 떡과 당면을 담아 함께 끓이는 방식이
                색다르다는 반응이 있습니다. 셀프바 구성은 매장 상황에 따라
                달라질 수 있습니다.
              </p>
            </div>
          </article>

          <article className="route-story route-story--reverse">
            <Image
              src="/images/eomeuittul/soy-ribs.jpg"
              alt="채소와 함께 담은 어믜뜰 간장 등갈비찜"
              width={640}
              height={440}
            />
            <div>
              <p className="eyebrow">TENDER RIBS · 반복 언급</p>
              <h2>부드러운 등갈비와 함께 고르는 채소</h2>
              <p>
                확인한 후기 일부에는 등갈비가 부드럽다는 반응과 채소를
                자유롭게 더하는 방식이 재미있다는 반응이 있습니다.
              </p>
            </div>
          </article>
        </div>
      </section>

      <ReservationCta placement="reviews_bottom" />
      <LocationPanel />
    </main>
  );
}
