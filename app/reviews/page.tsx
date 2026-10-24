import Image from "next/image";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { FaqList } from "@/components/site/faq-list";
import { HeroMedia } from "@/components/site/hero-media";
import { LocationPanel } from "@/components/site/location-panel";
import { OnlineReviewCards } from "@/components/site/online-review-cards";
import { ProofStrip } from "@/components/site/proof-strip";
import { ReservationCta } from "@/components/site/reservation-cta";
import {
  REVIEW_FAQ_ITEMS,
  REVIEW_ITEMS,
  REVIEW_SNAPSHOT,
  STORE,
} from "@/lib/content/store";
import { loadPublicOnlineReviews } from "@/lib/online-reviews/public";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/seo/schema";

import styles from "./reviews.module.css";

export const metadata = createPageMetadata({
  title: "청주갈비찜 후기·가족외식·회식 | 어믜뜰",
  description:
    "2026년 10월 24일 네이버 플레이스에서 확인한 어믜뜰 평점과 방문자 반응을 바탕으로 청주갈비찜, 가족외식, 회식 이용 정보를 안내합니다.",
  path: "/reviews",
  image: "/images/eomeuittul/soy-ribs.jpg",
});

export const revalidate = 3600;

export default async function ReviewsPage() {
  const onlineReviews = await loadPublicOnlineReviews(6);

  return (
    <main className={`store-route ${styles.reviewsRoute}`}>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "홈", path: "/" },
            { name: "방문자 후기", path: "/reviews" },
          ]),
          faqSchema(REVIEW_FAQ_ITEMS),
        ]}
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
        description="청주갈비찜의 맛과 고기 품질, 셀프바 식사 경험, 가족외식과 회식 공간에 관한 최근 방문자 반응을 확인하세요."
        image="/images/eomeuittul/soy-ribs.jpg"
        imageAlt={`${STORE.name} 간장 등갈비찜과 채소 한 상`}
      >
        <a
          className="button button-primary"
          href={STORE.reviewUrl}
          target="_blank"
          rel="noreferrer"
        >
          네이버에서 후기 원문 보기
        </a>
      </HeroMedia>

      <ProofStrip
        items={[
          `네이버 평점 ${REVIEW_SNAPSHOT.rating} / 5`,
          `${REVIEW_SNAPSHOT.ratingCount}개 평점 · ${REVIEW_SNAPSHOT.participants}명 참여`,
          `방문자 리뷰 ${REVIEW_SNAPSHOT.visitorReviewCount}개 · 블로그 리뷰 ${REVIEW_SNAPSHOT.blogReviewCount}개`,
          `${REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인`,
        ]}
      />

      <section className={`${styles.reviewsSection} section-pad surface-paper`}>
        <div className="shell">
          <div className={styles.evidenceHeader}>
            <p className="eyebrow">NAVER VISITOR REVIEWS</p>
            <h2>손님이 먼저 알아본 어믜뜰</h2>
            <p>
              아래 평점은 전체 실시간 후기 데이터가 아닌 확인일 기준 네이버 플레이스 공개 화면 스냅샷입니다.
              후기 카드는 네이버 방문자 후기 일부에서 반복된 반응을 요약했습니다.
            </p>
            <aside className={styles.ratingSnapshot} aria-label="확인일 기준 네이버 리뷰 스냅샷">
              <strong>{REVIEW_SNAPSHOT.rating} / 5</strong>
              <span>{REVIEW_SNAPSHOT.ratingCount}개 평점</span>
              <span>{REVIEW_SNAPSHOT.participants}명 참여</span>
              <span>방문자 리뷰 {REVIEW_SNAPSHOT.visitorReviewCount}개</span>
              <span>블로그 리뷰 {REVIEW_SNAPSHOT.blogReviewCount}개</span>
              <span>상단 전체 표시 {REVIEW_SNAPSHOT.totalDisplayedReviewCount}개</span>
              <time dateTime={REVIEW_SNAPSHOT.checkedAt}>
                {REVIEW_SNAPSHOT.checkedAt.replaceAll("-", ".")} 확인
              </time>
              <a href={REVIEW_SNAPSHOT.sourceUrl} target="_blank" rel="noreferrer">
                네이버에서 최신 정보 보기
              </a>
            </aside>
            <p className={styles.snapshotNote}>
              방문자·블로그·상단 전체 표시는 서로 다른 네이버 분류이므로 합산하지 않습니다.
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

      <section className={`${styles.answerSection} section-pad`} aria-labelledby="review-answers-title">
        <div className="shell">
          <div className={styles.evidenceHeader}>
            <p className="eyebrow">QUICK ANSWERS · 방문 전 확인</p>
            <h2 id="review-answers-title">청주갈비찜·가족외식·회식, 바로 답해드려요</h2>
            <p>최근 후기에서 궁금해진 내용을 매장의 확인된 메뉴·좌석·주차·예약 정보로 답합니다.</p>
          </div>
          <FaqList items={REVIEW_FAQ_ITEMS} openAll />
          <nav className={styles.relatedLinks} aria-label="후기 관련 정보">
            <Link href="/menu">전체 메뉴와 가격 보기</Link>
            <Link href="/stories/cheongju-group-dining">청주 모임·회식 안내</Link>
            <Link href="/stories/cheongju-galbijjim-guide">청주갈비찜 선택 가이드</Link>
          </nav>
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
