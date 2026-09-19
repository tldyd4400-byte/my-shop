import type { OnlineReview } from "@/lib/online-reviews/types";

import styles from "./online-review-cards.module.css";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});

export function OnlineReviewCards({
  reviews,
}: Readonly<{ reviews: readonly OnlineReview[] }>) {
  return (
    <div className={styles.grid}>
      {reviews.map((review) => (
        <article className={styles.card} key={review.sourceUrl}>
          <div className={styles.meta}>
            <span>네이버 블로그 · {review.bloggerName}</span>
            <time dateTime={review.publishedOn}>
              {dateFormatter.format(
                new Date(`${review.publishedOn}T00:00:00+09:00`),
              )}
            </time>
          </div>
          <h3>{review.title}</h3>
          <p>{review.description}</p>
          <a
            className={styles.sourceLink}
            href={review.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            네이버에서 원문 보기 <span aria-hidden="true">↗</span>
          </a>
        </article>
      ))}
    </div>
  );
}
