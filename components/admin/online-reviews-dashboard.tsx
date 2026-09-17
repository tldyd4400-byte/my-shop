import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { moderateOnlineReviewAction } from "@/app/admin/reviews/actions";
import type { OnlineReviewDashboard } from "@/lib/online-reviews/repository";
import type { OnlineReview, OnlineReviewStatus } from "@/lib/online-reviews/types";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: "Asia/Seoul",
});
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

const STATUS_LABELS: Record<OnlineReviewStatus, string> = {
  pending: "승인 대기",
  approved: "홈페이지 공개 중",
  rejected: "제외됨",
};

function actionLabel(status: OnlineReviewStatus): string {
  if (status === "approved") return "홈페이지 공개";
  if (status === "rejected") return "제외";
  return "공개 중지";
}

function ReviewAction({
  review,
  status,
}: Readonly<{ review: OnlineReview; status: OnlineReviewStatus }>) {
  return (
    <form action={moderateOnlineReviewAction}>
      <input type="hidden" name="sourceUrl" value={review.sourceUrl} />
      <input type="hidden" name="status" value={status} />
      <button className={styles.reviewAction} type="submit">
        {actionLabel(status)}
      </button>
    </form>
  );
}

function ReviewCard({ review }: Readonly<{ review: OnlineReview }>) {
  return (
    <article className={styles.reviewCard}>
      <div className={styles.reviewCardMeta}>
        <strong>{STATUS_LABELS[review.status]} · 네이버 블로그</strong>
        <time dateTime={review.publishedOn}>
          {dateFormatter.format(new Date(`${review.publishedOn}T00:00:00+09:00`))}
        </time>
      </div>
      <h3>{review.title}</h3>
      <p>{review.description}</p>
      <p className={styles.reviewBlogger}>{review.bloggerName}</p>
      <div className={styles.reviewActions}>
        <a
          className={styles.reviewSourceLink}
          href={review.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          원문 확인 ↗
        </a>
        {review.status !== "approved" ? (
          <ReviewAction review={review} status="approved" />
        ) : null}
        {review.status !== "rejected" ? (
          <ReviewAction review={review} status="rejected" />
        ) : null}
        {review.status === "approved" ? (
          <ReviewAction review={review} status="pending" />
        ) : null}
      </div>
    </article>
  );
}

function ReviewSection({
  title,
  reviews,
  emptyMessage,
}: Readonly<{
  title: string;
  reviews: OnlineReview[];
  emptyMessage: string;
}>) {
  return (
    <section className={styles.reviewSection} aria-label={title}>
      <h2>{title}</h2>
      {reviews.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <ReviewCard key={review.sourceUrl} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function lastRunLabel(dashboard: OnlineReviewDashboard): string {
  if (dashboard.lastRun === null) return "아직 실행 전";
  return dateTimeFormatter.format(new Date(dashboard.lastRun.startedAt));
}

export function OnlineReviewsDashboard({
  dashboard,
}: Readonly<{ dashboard: OnlineReviewDashboard }>) {
  return (
    <main className={styles.dashboardMain} aria-labelledby="online-reviews-title">
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.eyebrow}>관리자 후기 관리</p>
          <h1 id="online-reviews-title">후기 승인 관리</h1>
          <p className={styles.intro}>
            네이버 블로그 검색 결과를 원문 확인 후 공개합니다.
          </p>
        </div>
        <nav className={styles.adminNav} aria-label="관리자 메뉴">
          <Link className={styles.logoutLink} href="/admin/ai-visits">
            AI 방문 통계
          </Link>
          <Link className={styles.logoutLink} href="/admin/logout">
            로그아웃
          </Link>
        </nav>
      </header>

      <section aria-labelledby="review-summary-title">
        <h2 className={styles.visuallyHidden} id="review-summary-title">
          후기 상태 요약
        </h2>
        <div className={styles.reviewSummaryGrid}>
          <article className={styles.kpiCard}>
            <h3>승인 대기</h3>
            <p>{dashboard.pending.length}건</p>
          </article>
          <article className={styles.kpiCard}>
            <h3>홈페이지 공개 중</h3>
            <p>{dashboard.approved.length}건</p>
          </article>
          <article className={styles.kpiCard}>
            <h3>마지막 자동 수집</h3>
            <p className={styles.reviewSyncTime}>{lastRunLabel(dashboard)}</p>
          </article>
        </div>
      </section>

      <p className={styles.reviewSafetyNote}>
        자동 수집은 하루 1회 진행됩니다. 같은 링크는 중복 저장하지 않으며,
        승인 전에는 공개되지 않습니다. 수집 오류가 발생해도 기존 공개 후기는
        유지됩니다.
      </p>

      <ReviewSection
        title="승인 대기"
        reviews={dashboard.pending}
        emptyMessage="현재 승인 대기 중인 후기가 없습니다."
      />
      <ReviewSection
        title="홈페이지 공개 중"
        reviews={dashboard.approved}
        emptyMessage="현재 공개 중인 온라인 후기가 없습니다."
      />
      <ReviewSection
        title="제외된 후기"
        reviews={dashboard.rejected}
        emptyMessage="제외된 후기가 없습니다."
      />
    </main>
  );
}
