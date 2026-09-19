import type { AiVisitBotSummary, AiVisitSummary } from "@/lib/ai-visits/summary";
import Link from "next/link";

import styles from "@/app/admin/admin.module.css";

const PURPOSE_LABELS: Record<AiVisitBotSummary["purpose"], string> = {
  search_indexing: "검색 인덱싱",
  training: "학습",
  realtime_citation: "실시간 인용",
  other: "기타",
};

const numberFormatter = new Intl.NumberFormat("ko-KR");
const percentFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});
const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Seoul",
});

function formatChange(bot: AiVisitBotSummary): string {
  if (bot.isNew) return "신규";

  const change = Object.is(bot.change, -0) ? 0 : bot.change;
  const percent = Object.is(bot.changePercent, -0) ? 0 : bot.changePercent;
  const changeSign = change >= 0 ? "+" : "";
  const percentSign = percent >= 0 ? "+" : "";
  return `${changeSign}${numberFormatter.format(change)} (${percentSign}${percentFormatter.format(percent)}%)`;
}

function latestVisit(bot: AiVisitBotSummary) {
  if (bot.lastVisitedAt === null) return "—";

  return (
    <time dateTime={bot.lastVisitedAt}>
      {dateTimeFormatter.format(new Date(bot.lastVisitedAt))}
    </time>
  );
}

function topPath(bot: AiVisitBotSummary): string {
  return bot.topPath ?? "—";
}

export function AiVisitsDashboard({ summary }: Readonly<{ summary: AiVisitSummary }>) {
  const kpis = [
    ["전체 AI/크롤러 방문 수", summary.total],
    ["검색 인덱싱 방문 수", summary.byPurpose.search_indexing],
    ["학습 방문 수", summary.byPurpose.training],
    ["실시간 인용 방문 수", summary.byPurpose.realtime_citation],
  ] as const;

  return (
    <main className={styles.dashboardMain} aria-labelledby="ai-visits-title">
      <header className={styles.dashboardHeader}>
        <div>
          <p className={styles.eyebrow}>관리자 방문 통계</p>
          <h1 id="ai-visits-title">AI 어시스턴트별 방문</h1>
          <p className={styles.intro}>최근 30일 · 직전 30일 대비</p>
        </div>
        <nav className={styles.adminNav} aria-label="관리자 메뉴">
          <Link className={styles.logoutLink} href="/admin/reviews">
            후기 승인 관리
          </Link>
          <Link className={styles.logoutLink} href="/admin/logout">
            로그아웃
          </Link>
        </nav>
      </header>

      <section aria-labelledby="visit-summary-title">
        <h2 className={styles.visuallyHidden} id="visit-summary-title">
          방문 요약
        </h2>
        <div className={styles.kpiGrid}>
          {kpis.map(([label, value]) => (
            <article className={styles.kpiCard} key={label}>
              <h3>{label}</h3>
              <p>{numberFormatter.format(value)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.botSection} aria-labelledby="bot-visits-title">
        <h2 id="bot-visits-title">봇별 방문과 변화</h2>
        {summary.bots.length === 0 ? (
          <p className={styles.emptyState}>
            아직 기록된 AI/크롤러 방문이 없습니다. 공개 페이지에 봇 방문이 기록되면 이곳에 표시됩니다.
          </p>
        ) : (
          <>
            <div className={styles.desktopTable}>
              <table>
                <caption>최근 30일 봇별 방문 통계와 직전 30일 대비 변화</caption>
                <thead>
                  <tr>
                    <th scope="col">봇 이름</th>
                    <th scope="col">회사/vendor</th>
                    <th scope="col">목적 라벨</th>
                    <th scope="col">방문 수</th>
                    <th scope="col">최근 방문 시간</th>
                    <th scope="col">가장 많이 본 페이지</th>
                    <th scope="col">변화</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.bots.map((bot) => (
                    <tr key={bot.botId}>
                      <th scope="row">{bot.botName}</th>
                      <td>{bot.vendor}</td>
                      <td>{PURPOSE_LABELS[bot.purpose]}</td>
                      <td>{numberFormatter.format(bot.count)}</td>
                      <td>{bot.lastVisitedAt === null ? "—" : latestVisit(bot)}</td>
                      <td className={styles.pathCell}>{bot.topPath === null ? "—" : topPath(bot)}</td>
                      <td>{formatChange(bot)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCards} aria-label="모바일 봇별 방문 통계">
              {summary.bots.map((bot) => (
                <article className={styles.botCard} key={bot.botId}>
                  <h3>{bot.botName}</h3>
                  <dl>
                    <div><dt>회사/vendor</dt><dd>{bot.vendor}</dd></div>
                    <div><dt>목적 라벨</dt><dd>{PURPOSE_LABELS[bot.purpose]}</dd></div>
                    <div><dt>방문 수</dt><dd>{numberFormatter.format(bot.count)}</dd></div>
                    <div><dt>최근 방문 시간</dt><dd>{bot.lastVisitedAt === null ? "—" : latestVisit(bot)}</dd></div>
                    <div><dt>가장 많이 본 페이지</dt><dd className={styles.pathCell}>{bot.topPath === null ? "—" : topPath(bot)}</dd></div>
                    <div><dt>변화</dt><dd>{formatChange(bot)}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className={styles.purposeSection} aria-labelledby="purpose-title">
        <h2 id="purpose-title">방문 목적 안내</h2>
        <div className={styles.purposeGrid}>
          <article><p>검색 인덱싱: 검색 결과나 AI 검색에 보여줄 후보 페이지를 찾는 방문</p></article>
          <article><p>학습: 모델 학습·지식 수집 목적의 방문</p></article>
          <article><p>실시간 인용: 사용자가 AI에게 질문했을 때 답변·출처 확인을 위해 들어오는 방문</p></article>
        </div>
      </section>
    </main>
  );
}
