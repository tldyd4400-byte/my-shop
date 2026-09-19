import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { AiVisitsDashboard } from "@/components/admin/ai-visits-dashboard";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/admin/auth";
import { loadAiVisitRows } from "@/lib/ai-visits/repository";
import { summarizeAiVisits } from "@/lib/ai-visits/summary";

export const dynamic = "force-dynamic";

export default async function AiVisitsPage() {
  const cookieStore = await cookies();
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (
    typeof sessionSecret !== "string" ||
    typeof sessionToken !== "string" ||
    !verifyAdminSession(sessionToken, sessionSecret)
  ) {
    redirect("/admin/login?next=%2Fadmin%2Fai-visits");
  }

  const now = new Date();
  const summary = await (async () => {
    try {
      const rows = await loadAiVisitRows(now);
      return summarizeAiVisits(rows, now);
    } catch {
      return null;
    }
  })();

  if (summary === null) {
    return (
      <main className={styles.dashboardMain} aria-labelledby="ai-visits-error-title">
        <header className={styles.dashboardHeader}>
          <div>
            <p className={styles.eyebrow}>관리자 방문 통계</p>
            <h1 id="ai-visits-error-title">AI 어시스턴트별 방문</h1>
          </div>
          <Link className={styles.logoutLink} href="/admin/logout">로그아웃</Link>
        </header>
        <p className={styles.loadError} role="alert">
          방문 통계를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.
        </p>
      </main>
    );
  }

  return <AiVisitsDashboard summary={summary} />;
}
